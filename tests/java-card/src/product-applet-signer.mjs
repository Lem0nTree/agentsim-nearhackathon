import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import { check, grantBytes, controlBytes, verifyOwner } from '../../../src/protocol.mjs';
import { ROOT } from '../scripts/sim-runtime.mjs';
import { productCommand } from '../scripts/product-runtime.mjs';

/** Strict ASN.1 DER ECDSA -> 64-byte IEEE P1363 r || s; never silently truncates. */
export function derToP1363(value) {
  const bytes = Buffer.from(value);
  check(bytes.length >= 8 && bytes.length <= 72 && bytes[0] === 0x30 && bytes[1] === bytes.length-2,'SIGNATURE_DER');
  let offset = 2;
  const integer = () => {
    check(bytes[offset++] === 2,'SIGNATURE_DER');
    const length = bytes[offset++];
    check(length >= 1 && length <= 33 && offset+length <= bytes.length,'SIGNATURE_DER');
    let part = bytes.subarray(offset,offset+length); offset += length;
    check((part[0] & 0x80) === 0,'SIGNATURE_DER');
    if (part.length > 1 && part[0] === 0) {
      check((part[1] & 0x80) !== 0,'SIGNATURE_DER');
      part = part.subarray(1);
    }
    check(part.length <= 32 && part.some(byte => byte !== 0),'SIGNATURE_DER');
    return Buffer.concat([Buffer.alloc(32-part.length),part]);
  };
  const signature = Buffer.concat([integer(),integer()]);
  check(offset === bytes.length,'SIGNATURE_DER');
  return signature;
}

export function apdu(instruction, data = Buffer.alloc(0)) {
  check(Number.isInteger(instruction) && instruction >= 0 && instruction <= 255,'APDU_INS');
  check(data.length <= 240,'APDU_LENGTH');
  return data.length ? Buffer.concat([Buffer.from([0x80,instruction,0,0,data.length]),data,Buffer.from([0])])
    : Buffer.from([0x80,instruction,0,0,0]);
}

export async function openJavaCardSimulator() {
  const { command,args } = productCommand();
  const child = spawn(command,args,{cwd:ROOT,stdio:['pipe','pipe','pipe'],windowsHide:true});
  const buffered = [], waiting = [], transcript = [];
  let ended, diagnostics = '', closed = false, queue = Promise.resolve();
  const fail = error => {
    ended ??= error;
    while (waiting.length) { const pending = waiting.shift(); clearTimeout(pending.timer); pending.reject(ended); }
  };
  child.stderr.on('data',chunk => { diagnostics = (diagnostics+chunk).slice(-8000); });
  child.on('error',error => fail(error));
  child.on('exit',(code,signal) => fail(new Error(`SIM_PROCESS_EXIT ${code ?? signal}: ${diagnostics}`)));
  const lines = createInterface({input:child.stdout});
  lines.on('line',line => {
    const pending = waiting.shift();
    if (pending) { clearTimeout(pending.timer); pending.resolve(line); }
    else buffered.push(line);
  });
  const nextLine = () => {
    if (buffered.length) return Promise.resolve(buffered.shift());
    if (ended) return Promise.reject(ended);
    return new Promise((resolve,reject) => {
      const entry = {resolve,reject,timer:setTimeout(() => {
        fail(new Error('SIM_TIMEOUT')); child.kill();
      },15000)};
      waiting.push(entry);
    });
  };
  const close = () => { if (!closed) { closed = true; child.stdin.end(); child.kill(); lines.close(); } };
  const exchange = line => {
    const pending = queue.then(async () => {
      check(!closed,'SIM_CLOSED');
      if (ended) throw ended;
      child.stdin.write(line+'\n');
      return nextLine();
    });
    queue = pending.catch(() => {});
    return pending;
  };
  const transmit = async commandBytes => {
    const commandHex = Buffer.from(commandBytes).toString('hex');
    const result = await exchange(commandHex);
    check(/^(?:[0-9a-f]{2}){2,}$/.test(result),'APDU_RESPONSE');
    const response = Buffer.from(result,'hex');
    const sw = response.readUInt16BE(response.length-2);
    transcript.push({command:commandBytes[1] === 0x20 ? '80200000 [DEMO PIN REDACTED]' : commandHex,
      response:result,status:sw.toString(16).padStart(4,'0')});
    return {data:response.subarray(0,-2),sw};
  };
  const expect = async (instruction,data) => {
    const result = await transmit(apdu(instruction,data));
    check(result.sw === 0x9000,`CARD_SW_${result.sw.toString(16)}`);
    return result.data;
  };
  try {
    check(await nextLine() === 'READY product-applet-p256','SIM_STARTUP');
    const point = await expect(0x10);
    check(point.length === 65 && point[0] === 4,'CARD_PUBLIC_KEY');
    const publicKey = Buffer.concat([Buffer.from([2+(point[64]&1)]),point.subarray(1,33)]).toString('hex');
    const signCanonical = async canonical => {
      check(canonical.length > 0 && canonical.length <= 4096,'CARD_MESSAGE_LENGTH');
      await expect(0x20,Buffer.from('123456')); // Public simulation fixture, not secure user approval.
      await expect(0x30);
      for (let offset=0;offset<canonical.length;offset+=240) {
        const chunk = canonical.subarray(offset,offset+240);
        const final = offset+chunk.length === canonical.length;
        const result = await expect(final ? 0x34 : 0x32,chunk);
        if (final) {
          const signature = derToP1363(result).toString('hex');
          check(verifyOwner(canonical,signature,publicKey),'CARD_SIGNATURE_INVALID');
          return signature;
        }
      }
    };
    // Serialize complete signing sessions so concurrent callers cannot mix chunks.
    let signingQueue = Promise.resolve();
    const sign = bytes => {
      const result = signingQueue.then(() => signCanonical(bytes));
      signingQueue = result.catch(() => {});
      return result;
    };
    return Object.freeze({kind:'product-applet-p256-simulator',publicKey,algorithm:'P-256/SHA-256',
      signatureEncoding:'ieee-p1363',hardwareProvenance:'SIMULATED — PC JVM only',
      signGrant:grant => sign(grantBytes(grant)),signControl:control => sign(controlBytes(control)),
      transmit,inputWiped:async () => (await exchange('CHECK_INPUT_WIPED')) === 'INPUT_WIPED',deselect:async () => check(await exchange('DESELECT') === 'DESELECT_OK','SIM_DESELECT'),reset:async () => check(await exchange('RESET') === 'RESET_OK','SIM_RESET'),
      getTranscript:() => structuredClone(transcript),close});
  } catch (error) { close(); throw error; }
}
