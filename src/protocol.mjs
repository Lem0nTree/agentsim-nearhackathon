import { createHash, createPublicKey, ECDH, generateKeyPairSync, sign, verify } from 'node:crypto';

export const U128_MAX = (1n << 128n) - 1n;
export class Rejection extends Error {
  constructor(code) { super(code); this.name = 'Rejection'; this.code = code; }
}
export function check(condition, code) { if (!condition) throw new Rejection(code); }
export function exact(value, fields) {
  check(value !== null && typeof value === 'object' && !Array.isArray(value), 'SCHEMA');
  check(Object.keys(value).sort().join(',') === [...fields].sort().join(','), 'SCHEMA');
}
export function uint(value, max = U128_MAX) {
  check(typeof value === 'string' && /^(0|[1-9][0-9]{0,38})$/.test(value), 'UINT');
  const result = BigInt(value); check(result <= max, 'UINT'); return result;
}
export function id(value) {
  check(typeof value === 'string' && /^[a-z0-9][a-z0-9._-]{0,63}$/.test(value), 'ID'); return value;
}
export function hex(value, bytes) {
  check(typeof value === 'string' && new RegExp(`^[0-9a-f]{${bytes * 2}}$`).test(value), 'HEX');
  return Buffer.from(value, 'hex');
}
const U64_MAX = (1n << 64n) - 1n;
export function context(chain, vault, epoch) { id(chain); id(vault); uint(epoch, U64_MAX); }
export function grantBytes(g) {
  exact(g, ['chain', 'vault', 'epoch', 'agent', 'sessionKey', 'perCall', 'total', 'receiver', 'expires']);
  context(g.chain, g.vault, g.epoch); id(g.agent); hex(g.sessionKey, 32); id(g.receiver);
  check(uint(g.perCall) > 0n && uint(g.total) >= uint(g.perCall), 'LIMIT'); uint(g.expires, U64_MAX);
  return Buffer.from(JSON.stringify(['AgentSIM', 1, 'grant', g.chain, g.vault, g.epoch, g.agent, g.sessionKey, g.perCall, g.total, g.receiver, g.expires]));
}
export function spendBytes(s) {
  exact(s, ['chain', 'vault', 'epoch', 'grantId', 'nonce', 'receiver', 'amount', 'deadline']);
  context(s.chain, s.vault, s.epoch); hex(s.grantId, 32); uint(s.nonce, U64_MAX); id(s.receiver);
  check(uint(s.amount) > 0n, 'AMOUNT'); uint(s.deadline, U64_MAX);
  return Buffer.from(JSON.stringify(['AgentSIM', 1, 'spend', s.chain, s.vault, s.epoch, s.grantId, s.nonce, s.receiver, s.amount, s.deadline]));
}
export function controlBytes(c) {
  exact(c, ['chain', 'vault', 'epoch', 'nonce', 'operation', 'value']);
  context(c.chain, c.vault, c.epoch); uint(c.nonce, U64_MAX);
  check(['revoke', 'pause', 'resume', 'rotate'].includes(c.operation), 'OPERATION');
  if (c.operation === 'revoke') hex(c.value, 32);
  else if (c.operation === 'rotate') hex(c.value, 33);
  else check(c.value === '', 'VALUE');
  return Buffer.from(JSON.stringify(['AgentSIM', 1, 'control', c.chain, c.vault, c.epoch, c.nonce, c.operation, c.value]));
}
export function digest(bytes) { return createHash('sha256').update(bytes).digest('hex'); }
export function p256PublicKey(compressedHex) {
  const compressed = hex(compressedHex, 33);
  const raw = ECDH.convertKey(compressed, 'prime256v1', undefined, undefined, 'uncompressed');
  return createPublicKey({format:'jwk', key:{kty:'EC', crv:'P-256', x:raw.subarray(1,33).toString('base64url'), y:raw.subarray(33).toString('base64url')}});
}
export function edPublicKey(publicHex) {
  return createPublicKey({format:'jwk', key:{kty:'OKP', crv:'Ed25519', x:hex(publicHex,32).toString('base64url')}});
}
export function verifyOwner(bytes, signature, publicKey) {
  try { return verify('sha256', bytes, {key:p256PublicKey(publicKey), dsaEncoding:'ieee-p1363'}, hex(signature,64)); }
  catch { return false; }
}
export function verifySession(bytes, signature, publicKey) {
  try { return verify(null, bytes, edPublicKey(publicKey), hex(signature,64)); }
  catch { return false; }
}
// Explicitly software-only. This creates no SIM, JCOP, eSIM, or hardware attestation.
export function softwareOwner() {
  const {publicKey, privateKey} = generateKeyPairSync('ec', {namedCurve:'prime256v1'});
  const jwk = publicKey.export({format:'jwk'});
  const x = Buffer.from(jwk.x,'base64url'), y = Buffer.from(jwk.y,'base64url');
  const publicHex = Buffer.concat([Buffer.from([2 + (y[31] & 1)]), x]).toString('hex');
  return Object.freeze({kind:'software-p256', publicKey:publicHex,
    sign:bytes=>sign('sha256',bytes,{key:privateKey,dsaEncoding:'ieee-p1363'}).toString('hex')});
}
export function softwareAgent() {
  const {publicKey, privateKey} = generateKeyPairSync('ed25519');
  return Object.freeze({publicKey:Buffer.from(publicKey.export({format:'jwk'}).x,'base64url').toString('hex'),
    sign:bytes=>sign(null,bytes,privateKey).toString('hex')});
}
