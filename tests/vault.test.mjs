import test from 'node:test';
import assert from 'node:assert/strict';
import { softwareOwner,softwareAgent,grantBytes,spendBytes,controlBytes,uint,U128_MAX } from '../src/protocol.mjs';
import { LocalVault } from '../src/vault.mjs';

function setup(overrides={}) {
  const owner=softwareOwner(),agent=softwareAgent(); let clock=1000;
  const vault=new LocalVault({ownerKey:owner.publicKey,now:()=>clock,...overrides});
  const grant={chain:'local',vault:'agentsim.local',epoch:'0',agent:'demo',sessionKey:agent.publicKey,perCall:'100',total:'150',receiver:'compute.local',expires:'1600'};
  const grantId=vault.authorize(grant,owner.sign(grantBytes(grant)));
  const spend={chain:'local',vault:'agentsim.local',epoch:'0',grantId,nonce:'0',receiver:grant.receiver,amount:'90',deadline:'1500'};
  const exec=(s=spend)=>vault.execute(s,agent.sign(spendBytes(s)));
  const control=(operation,value='',nonce='0')=>{const c={chain:'local',vault:'agentsim.local',epoch:vault.snapshot().epoch,nonce,operation,value};vault.control(c,owner.sign(controlBytes(c)));};
  return {owner,agent,vault,grant,grantId,spend,exec,control,setTime:t=>clock=t};
}
const rejected=(fn,code)=>assert.throws(fn,e=>e.code===code);
test('valid delegation, reserve, settle and replay reject',()=>{const s=setup();const id=s.exec();assert.equal(s.vault.snapshot().available,'910');s.vault.settle(id,true);rejected(()=>s.exec(),'NONCE');});
test('owner signature tampering fails with no state change',()=>{const s=setup();const before=s.vault.snapshot();rejected(()=>s.vault.authorize({...s.grant,agent:'other'},s.owner.sign(grantBytes(s.grant))),'OWNER_SIGNATURE');assert.deepEqual(s.vault.snapshot(),before);});
test('wrong owner cannot grant',()=>{const s=setup();rejected(()=>s.vault.authorize({...s.grant,agent:'other'},softwareOwner().sign(grantBytes({...s.grant,agent:'other'}))),'OWNER_SIGNATURE');});
test('wrong session cannot spend',()=>{const s=setup();rejected(()=>s.vault.execute(s.spend,softwareAgent().sign(spendBytes(s.spend))),'SESSION_SIGNATURE');});
test('mutated amount fails cryptographic verification',()=>{const s=setup();rejected(()=>s.vault.execute({...s.spend,amount:'91'},s.agent.sign(spendBytes(s.spend))),'SESSION_SIGNATURE');});
for(const [field,value,code] of [['chain','testnet','DOMAIN'],['vault','evil.local','DOMAIN'],['epoch','1','EPOCH'],['receiver','evil.local','RECEIVER'],['nonce','2','NONCE'],['amount','101','PER_CALL'],['deadline','1700','DEADLINE']]) {
  test(`rejects ${field} violation atomically`,()=>{const s=setup();const before=s.vault.snapshot();rejected(()=>s.exec({...s.spend,[field]:value}),code);assert.deepEqual(s.vault.snapshot(),before);});
}
test('aggregate limit includes pending reservations',()=>{const s=setup();s.exec();rejected(()=>s.exec({...s.spend,nonce:'1',amount:'70'}),'TOTAL');});
test('low vault balance rejects without consuming nonce',()=>{const s=setup({balance:'50'});rejected(()=>s.exec(),'BALANCE');assert.equal(s.vault.snapshot().grants[0].nextNonce,'0');});
test('deadline and grant expiry are exclusive',()=>{const s=setup();s.setTime(1500);rejected(()=>s.exec(),'EXPIRED');s.setTime(1600);rejected(()=>s.exec({...s.spend,deadline:'1600'}),'EXPIRED');});
test('revocation is permanent and cannot be bypassed by regranting',()=>{const s=setup();s.control('revoke',s.grantId);rejected(()=>s.exec(),'REVOKED');rejected(()=>s.vault.authorize(s.grant,s.owner.sign(grantBytes(s.grant))),'GRANT_EXISTS');});
test('pause and signed resume require fresh control nonce',()=>{const s=setup();s.control('pause');rejected(()=>s.exec(),'PAUSED');rejected(()=>s.control('resume'),'CONTROL_NONCE');s.control('resume','','1');s.exec();});
test('key rotation invalidates old epoch and replaces owner authority',()=>{const s=setup();const next=softwareOwner();s.control('rotate',next.publicKey);rejected(()=>s.exec(),'EPOCH');const g={...s.grant,epoch:'1'};rejected(()=>s.vault.authorize(g,s.owner.sign(grantBytes(g))),'OWNER_SIGNATURE');s.vault.authorize(g,next.sign(grantBytes(g)));});
test('old grant cannot be rebound to the current epoch after rotation',()=>{const s=setup();s.control('rotate',softwareOwner().publicKey);rejected(()=>s.exec({...s.spend,epoch:'1'}),'EPOCH');});
test('failed settlement refunds funds once, retains budget and nonce',()=>{const s=setup();const id=s.exec();s.vault.settle(id,false);assert.equal(s.vault.snapshot().available,'1000');assert.equal(s.vault.snapshot().grants[0].spent,'90');rejected(()=>s.vault.settle(id,false),'TRANSFER_UNKNOWN');rejected(()=>s.exec(),'NONCE');});
test('two duplicate in-flight submissions reserve only once',async()=>{const s=setup();const results=await Promise.allSettled([Promise.resolve().then(()=>s.exec()),Promise.resolve().then(()=>s.exec())]);assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(s.vault.snapshot().available,'910');});
test('strict schema, decimal and overflow boundaries',()=>{const s=setup();rejected(()=>grantBytes({...s.grant,kyc:true}),'SCHEMA');for(const value of ['01','-1','1.0','1e2',1,(U128_MAX+1n).toString()])rejected(()=>uint(value),'UINT');assert.equal(uint(U128_MAX.toString()),U128_MAX);rejected(()=>spendBytes({...s.spend,amount:'0'}),'AMOUNT');});
test('canonical serialization independent of object insertion order',()=>{const s=setup();assert.deepEqual(spendBytes(s.spend),spendBytes(Object.fromEntries(Object.entries(s.spend).reverse())));});
test('mutable caller objects cannot alter stored policy',()=>{const s=setup();s.grant.perCall='999';rejected(()=>s.exec({...s.spend,amount:'101'}),'PER_CALL');const view=s.vault.snapshot();view.events.length=0;assert.equal(s.vault.snapshot().events.length,1);});
test('equivalent high-S ECDSA signature cannot reauthorize a consumed grant',()=>{const s=setup();const signature=s.owner.sign(grantBytes(s.grant));const n=BigInt('0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551');const high=signature.slice(0,64)+(n-BigInt('0x'+signature.slice(64))).toString(16).padStart(64,'0');rejected(()=>s.vault.authorize(s.grant,high),'GRANT_EXISTS');});
