import fs from 'node:fs';import assert from 'node:assert/strict';import crypto from 'node:crypto';
import {utils,transactions} from 'near-api-js';
import {grantBytes,spendBytes,controlBytes,digest,verifyOwner,verifySession} from '../../src/protocol.mjs';
const file=process.argv[2]??'evidence/near/2026-11-14-local-sandbox.json',e=JSON.parse(fs.readFileSync(file,'utf8'));
assert.equal(e.chainId,'agentsim-local');assert.equal(e.p256HostFunction,true);
const wasm=fs.readFileSync('contracts/agentsim-vault/artifacts/agentsim_vault.wasm');assert.equal(crypto.createHash('sha256').update(wasm).digest('hex'),e.wasmSha256);
const g=grantBytes(e.grant.grant),s=spendBytes(e.spend.spend),c=controlBytes(e.revocation.control);
assert.equal(g.toString(),e.grant.canonicalUtf8);assert.equal(digest(g),e.grant.grantId);assert(verifyOwner(g,e.grant.signature,e.roles.owner.publicKey));
assert.equal(s.toString(),e.spend.canonicalUtf8);assert(verifySession(s,e.spend.signature,e.roles.agent.publicKey));
assert.equal(c.toString(),e.revocation.canonicalUtf8);assert(verifyOwner(c,e.revocation.signature,e.roles.owner.publicKey));assert.equal(e.revocation.control.value,e.grant.grantId);
for(const o of e.outcomes){const hash=utils.serialize.base_decode(o.transactionHash),signature=utils.serialize.base_decode(o.outerSignature.split(':')[1]);assert(utils.PublicKey.fromString(o.publicKey).verify(hash,signature));
 if(o.decodedActions.every(a=>a.type==='FunctionCall')){for(const a of o.decodedActions)assert.deepEqual(JSON.parse(Buffer.from(a.argsBase64,'base64').toString()),a.args);const actions=o.decodedActions.map(a=>transactions.functionCall(a.method,Buffer.from(a.argsBase64,'base64'),BigInt(a.gas),BigInt(a.deposit)));const tx=transactions.createTransaction(o.signer,utils.PublicKey.fromString(o.publicKey),o.receiver,BigInt(o.transactionNonce),actions,utils.serialize.base_decode(o.transactionBlockHash));assert.equal(utils.serialize.base_encode(crypto.createHash('sha256').update(transactions.encodeTransaction(tx)).digest()),o.transactionHash)}
}
const accepted=(name)=>{const matches=e.outcomes.filter(o=>o.name===name&&o.status.SuccessValue!==undefined);assert.equal(matches.length,1,name);return matches[0]};
const auth=accepted('authorize'),pay=accepted('execute'),revoke=accepted('control');
for(const [outcome,expected] of [[auth,{grant:e.grant.grant,signature:e.grant.signature}],[pay,{spend:e.spend.spend,signature:e.spend.signature}],[revoke,{command:e.revocation.control,signature:e.revocation.signature}]]){
 assert.equal(outcome.signer,e.roles.outerRelayer.account);assert.equal(outcome.publicKey,e.roles.outerRelayer.publicKey);assert.equal(outcome.receiver,e.grant.grant.vault);assert.equal(outcome.decodedActions.length,1);assert.equal(outcome.decodedActions[0].method,outcome.name);assert.deepEqual(outcome.decodedActions[0].args,expected);assert(outcome.receipts.every(r=>!('Failure' in r.status)));
}
assert.equal(e.roles.outerRelayer.algorithm,'Ed25519');assert.equal(e.roles.agent.algorithm,'Ed25519');assert.equal(e.roles.owner.algorithm,'P-256');
assert.notEqual(Buffer.from(utils.serialize.base_decode(e.roles.outerRelayer.publicKey.split(':')[1])).toString('hex'),e.roles.agent.publicKey,'agent and outer relayer keys must differ');
assert.equal(e.grant.grant.sessionKey,e.roles.agent.publicKey);assert.equal(e.grant.grant.chain,e.chainId);assert.equal(e.spend.spend.chain,e.chainId);assert.equal(e.revocation.control.chain,e.chainId);
assert.equal(e.grant.grant.vault,e.spend.spend.vault);assert.equal(e.grant.grant.vault,e.revocation.control.vault);assert.equal(e.spend.spend.grantId,e.grant.grantId);assert.equal(e.spend.spend.receiver,e.grant.grant.receiver);
assert.equal(e.revocation.control.operation,'revoke');assert.equal(e.states.afterRevocation.grant.spent,e.spend.spend.amount);assert.equal(e.states.afterRevocation.status.available,(2n*10n**24n-BigInt(e.spend.spend.amount)).toString());
for(const code of ['OWNER_SIGNATURE','SESSION_SIGNATURE','NONCE','PER_CALL','REVOKED'])assert(e.outcomes.some(o=>JSON.stringify(o.status).includes(code)),code);
const payment=e.outcomes.find(o=>o.name==='execute'&&o.status.SuccessValue!==undefined);assert(payment.receipts.some(r=>r.executor===e.spend.spend.receiver && r.status.SuccessValue!==undefined));assert(payment.receipts.some(r=>r.logs.some(l=>{try{let x=JSON.parse(l);return x.event==='agentsim_settled'&&x.success===true}catch{return false}})));
assert.equal(BigInt(e.after.receiver)-BigInt(e.before.receiver),BigInt(e.spend.spend.amount));assert.equal(e.states.afterRevocation.grant.revoked,true);assert.equal(e.states.afterRevocation.grant.nextNonce,'1');assert.equal(e.states.afterRevocation.status.controlNonce,'1');
console.log('Verified signed local actions, owner and agent signatures, recorded receipt outcomes and receiver delta. Receipt evidence is local, not public-chain proof.');
