import { spawn, spawnSync } from 'node:child_process';
import { createInterface } from 'node:readline';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { verifyOwner } from '../../src/protocol.mjs';
import { derToP1363, apdu } from './protocol.mjs';
const root=fileURLToPath(new URL('../../',import.meta.url));
const tool=n=>process.env.AGENTSIM_JAVA_HOME ? path.join(process.env.AGENTSIM_JAVA_HOME,'bin',process.platform==='win32'?n+'.exe':n) : n;
export async function openCard({reader,expectedAID}) {
 if(!reader || !/^(?:[0-9a-fA-F]{2}){5,16}$/.test(expectedAID || '')) throw Error('Exact reader and expected AID are required');
 const classes=path.join(root,'.build','pcsc'); mkdirSync(classes,{recursive:true});
 const build=spawnSync(tool('javac'),['-d',classes,path.join(root,'card','host','PcscBridge.java')],{encoding:'utf8',windowsHide:true});
 if(build.error||build.status!==0) throw Error('PCSC_BRIDGE_BUILD: '+(build.error?.message||build.stderr));
 const child=spawn(tool('java'),['-cp',classes,'PcscBridge',reader,expectedAID],{stdio:['pipe','pipe','pipe'],windowsHide:true});
 return createCardSession(child);
}
// Exposed for deterministic, offline transport testing; production always uses the PC/SC bridge.
export async function createCardSession(child,{timeoutMs=15000}={}) {
 let failure,queue=Promise.resolve(); const waiters=[];
 const rl=createInterface({input:child.stdout});
 const fail=e=>{if(failure)return;failure=e;while(waiters.length){const w=waiters.shift();clearTimeout(w.timer);w.reject(e)};child.stdin.destroy();child.kill();rl.close()};
 // Stream errors can be emitted after a failed write even when its callback receives the error.
 // Never include stream payloads or diagnostics in errors: a command can contain a PIN.
 for (const [name,stream] of [['STDIN',child.stdin],['STDOUT',child.stdout],['STDERR',child.stderr]]) {
   stream.on('error',()=>fail(Error('PCSC_'+name+'_ERROR')));
   stream.on('close',()=>fail(Error('PCSC_'+name+'_CLOSED')));
 }
 rl.on('error',()=>fail(Error('PCSC_STDOUT_ERROR')));
 child.stderr.on('data',()=>{});
 child.stdout.on('end',()=>fail(Error('PCSC_STDOUT_CLOSED')));
 child.stderr.on('end',()=>fail(Error('PCSC_STDERR_CLOSED')));
 child.on('error',()=>fail(Error('PCSC_PROCESS_ERROR')));child.on('exit',c=>fail(Error(`PCSC_EXIT ${c}`)));
 rl.on('line',line=>{if(failure)return;const w=waiters.shift();if(!w){fail(Error('PCSC_UNEXPECTED_RESPONSE'));return}clearTimeout(w.timer);w.resolve(line)});
 const next=()=>failure?Promise.reject(failure):new Promise((resolve,reject)=>{const w={resolve,reject};w.timer=setTimeout(()=>fail(Error('PCSC_TIMEOUT')),timeoutMs);waiters.push(w)});
 const close=()=>fail(Error('PCSC_CLOSED'));
 const select=await next().catch(e=>{close();throw e}); if(!/^SELECT [0-9a-f]+$/i.test(select)){close();throw Error('SELECT_PROTOCOL '+select)}
 const sel=select.slice(7); const sw=sel.slice(-4); if(sw.toLowerCase()!=='9000'){close();throw Error('SELECT_SW_'+sw.toUpperCase())}
 const transmit=async cmd=>{const command=Buffer.from(cmd);const action=queue.then(async()=>{if(failure)throw failure;const response=next();try {child.stdin.write(command.toString('hex')+'\n',error=>{if(error)fail(Error('PCSC_STDIN_ERROR'))})} catch {fail(Error('PCSC_STDIN_ERROR'))}const line=await response;if(!/^(?:[0-9a-f]{2}){2,}$/i.test(line))throw Error('PCSC_RESPONSE');const b=Buffer.from(line,'hex');return {data:b.subarray(0,-2),sw:b.readUInt16BE(b.length-2)}});queue=action.catch(()=>{});return action};
 const expect=async(i,d)=>{const r=await transmit(apdu(i,d));if(r.sw!==0x9000)throw Error('CARD_SW_'+r.sw.toString(16).padStart(4,'0').toUpperCase());return r.data};
 async function publicKey(){const point=await expect(0x10);if(point.length!==65||point[0]!==4)throw Error('CARD_PUBLIC_KEY');return Buffer.concat([Buffer.from([2+(point[64]&1)]),point.subarray(1,33)]).toString('hex')}
 let signQueue=Promise.resolve();
 function sign(bytes,pin){const message=Buffer.from(bytes),secret=Buffer.from(pin);const work=signQueue.then(async()=>{try {if(message.length<1||message.length>4096||secret.length<6||secret.length>16)throw Error('CARD_INPUT');const key=await publicKey();await expect(0x20,secret);await expect(0x30);for(let i=0;i<message.length;i+=240){const last=i+240>=message.length;const out=await expect(last?0x34:0x32,message.subarray(i,i+240));if(last){const signature=derToP1363(out).toString('hex');if(!verifyOwner(message,signature,key))throw Error('CARD_SIGNATURE_INVALID');return {signature,publicKey:key}}}} finally {secret.fill(0)}});signQueue=work.catch(()=>{});return work}
 return {selectStatus:sw,transmit,publicKey,sign,close};
}
