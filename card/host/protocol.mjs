import { check } from '../../src/protocol.mjs';
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

