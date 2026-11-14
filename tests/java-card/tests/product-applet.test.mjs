import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { openJavaCardSimulator, apdu, derToP1363 } from '../src/product-applet-signer.mjs';
import { grantBytes, controlBytes, verifyOwner, softwareAgent, spendBytes } from '../../../src/protocol.mjs';
import { LocalVault } from '../../../src/vault.mjs';

const grantFor = agent => ({chain:'local',vault:'agentsim.local',epoch:'0',agent:'research-agent',
  sessionKey:agent.publicKey,perCall:'100',total:'150',receiver:'compute.local',expires:'1600'});

test('strict DER decoder handles padding and rejects ambiguous or malformed encodings',() => {
  assert.equal(derToP1363(Buffer.from('3006020101020102','hex')).toString('hex'),'01'.padStart(64,'0')+'02'.padStart(64,'0'));
  const positive = Buffer.concat([Buffer.from([0x30,0x26,2,0x21,0]),Buffer.alloc(32,0x80),Buffer.from([2,1,1])]);
  assert.equal(derToP1363(positive).length,64);
  for (const value of ['','3006020180020101','300702020001020101','3006020100020101','300602010102010200','308106020101020101'])
    assert.throws(() => derToP1363(Buffer.from(value,'hex')),error => error.code === 'SIGNATURE_DER');
});

test('Java Card APDU signatures interoperate with Node, bind canonical bytes, and enforce local policy',async () => {
  const card = await openJavaCardSimulator();
  try {
    const agent = softwareAgent(), grant = {...grantFor(agent),agent:'a'.repeat(64),receiver:'compute.'.padEnd(64,'x')}, original = structuredClone(grant);
    const pending = card.signGrant(grant);
    grant.perCall = '101'; // Mutation after the request cannot change the canonical payload.
    const signature = await pending;
    assert.equal(verifyOwner(grantBytes(original),signature,card.publicKey),true);
    assert.equal(verifyOwner(grantBytes(grant),signature,card.publicKey),false);
    const digest = createHash('sha256').update(grantBytes(original)).digest();
    assert.equal(verifyOwner(digest,signature,card.publicKey),false,'message must not be double-hashed');
    const vault = new LocalVault({ownerKey:card.publicKey,now:()=>1000});
    const id = vault.authorize(original,signature);
    const spend = {chain:'local',vault:'agentsim.local',epoch:'0',grantId:id,nonce:'0',receiver:original.receiver,amount:'90',deadline:'1500'};
    const agentSignature = agent.sign(spendBytes(spend));
    vault.settle(vault.execute(spend,agentSignature),true);
    assert.throws(() => vault.execute(spend,agentSignature),error => error.code === 'NONCE');
    for (const [change,code] of [[{amount:'101'},'PER_CALL'],[{receiver:'attacker.local'},'RECEIVER'],[{amount:'70'},'TOTAL']]) {
      const denied = {...spend,nonce:'1',...change};
      assert.throws(() => vault.execute(denied,agent.sign(spendBytes(denied))),error => error.code === code);
    }
    const control = {chain:'local',vault:'agentsim.local',epoch:'0',nonce:'0',operation:'revoke',value:id};
    vault.control(control,await card.signControl(control));
    const after = {...spend,nonce:'1',amount:'10'};
    assert.throws(() => vault.execute(after,agent.sign(spendBytes(after))),error => error.code === 'REVOKED');
    assert.equal(vault.snapshot().available,'910');
    assert.equal(card.getTranscript().some(entry => entry.command.startsWith('80320000')),true,'long canonical grant uses chunked APDUs');
    assert.equal(card.getTranscript().every(entry => !entry.command.includes('313233343536')),true,'PIN omitted from recorded commands');
    assert.throws(() => card.signGrant({...original,extra:'not signed'}),error => error.code === 'SCHEMA');
  } finally { card.close(); }
});

test('applet rejects missing/wrong PIN, wrong sequence, blocked PIN and unsupported commands',async () => {
  const card = await openJavaCardSimulator();
  try {
    assert.equal((await card.transmit(apdu(0x30))).sw,0x6982);
    assert.equal((await card.transmit(apdu(0x34,Buffer.from('abc')))).sw,0x6982);
    assert.equal((await card.transmit(apdu(0x20,Buffer.from('123456')))).sw,0x9000);
    assert.equal((await card.transmit(apdu(0x34,Buffer.from('abc')))).sw,0x6985);
    assert.equal((await card.transmit(apdu(0x30))).sw,0x6982, 'errors clear PIN authorization');
    assert.equal((await card.transmit(apdu(0x20,Buffer.from('123456')))).sw,0x9000);
    assert.equal((await card.transmit(apdu(0x30))).sw,0x9000);
    await card.reset();
    assert.equal((await card.transmit(apdu(0x34,Buffer.from('abc')))).sw,0x6982);
    assert.equal((await card.transmit(apdu(0x7f))).sw,0x6d00);
    assert.equal((await card.transmit(Buffer.from('0010000000','hex'))).sw,0x6e00);
    for (const expected of [0x63c2,0x63c1,0x63c0])
      assert.equal((await card.transmit(apdu(0x20,Buffer.from('000000')))).sw,expected);
    assert.equal((await card.transmit(apdu(0x20,Buffer.from('123456')))).sw,0x63c0);
    assert.equal((await card.transmit(apdu(0x30))).sw,0x6982);
  } finally { card.close(); }
});

test('concurrent owner requests remain separate and finalizing consumes PIN authorization',async () => {
  const card = await openJavaCardSimulator();
  try {
    const a = grantFor(softwareAgent()), b = {...grantFor(softwareAgent()),agent:'second-agent'};
    const [sa,sb] = await Promise.all([card.signGrant(a),card.signGrant(b)]);
    assert.equal(verifyOwner(grantBytes(a),sa,card.publicKey),true);
    assert.equal(verifyOwner(grantBytes(b),sb,card.publicKey),true);
    assert.equal(verifyOwner(grantBytes(a),sb,card.publicKey),false);
    assert.equal((await card.transmit(apdu(0x30))).sw,0x6982);
    const command = {chain:'local',vault:'agentsim.local',epoch:'0',nonce:'0',operation:'pause',value:''};
    assert.equal(verifyOwner(controlBytes(command),await card.signControl(command),card.publicKey),true);
  } finally { card.close(); }
});


test('deselection and reset clear both PIN and pending signing state',async()=>{
 const card=await openJavaCardSimulator();
 try {for(const clear of [()=>card.deselect(),()=>card.reset()]){
   assert.equal((await card.transmit(apdu(0x20,Buffer.from('123456')))).sw,0x9000);
   assert.equal((await card.transmit(apdu(0x30))).sw,0x9000);
   assert.equal((await card.transmit(apdu(0x32,Buffer.from('part')))).sw,0x9000);
   await clear();
   assert.equal((await card.transmit(apdu(0x34,Buffer.from('rest')))).sw,0x6982);
   assert.equal((await card.transmit(apdu(0x20,Buffer.from('123456')))).sw,0x9000);
   assert.equal((await card.transmit(apdu(0x34,Buffer.from('rest')))).sw,0x6985);
 }}finally{card.close()}
});

test('PIN input buffer is cleared on success, incorrect PIN and malformed commands',async()=>{
 const card=await openJavaCardSimulator();
 try {
   for(const [command,status] of [
     [apdu(0x20,Buffer.from('123456')),0x9000],
     [apdu(0x20,Buffer.from('000000')),0x63c2],
     [apdu(0x20,Buffer.from('12345')),0x6700],
     [Buffer.from('802001000631323334353600','hex'),0x6a86],
     [Buffer.from('002000000631323334353600','hex'),0x6e00]]){
       assert.equal((await card.transmit(command)).sw,status);assert.equal(await card.inputWiped(),true);
   }
 }finally{card.close()}
});

test('wrong headers and oversized chunks cancel pending authorization',async()=>{
 const card=await openJavaCardSimulator();
 try{
   for(const [command,status] of [
     [Buffer.from('80320100016100','hex'),0x6a86],
     [Buffer.from('80320001016100','hex'),0x6a86],
     [Buffer.from('00320000016100','hex'),0x6e00],
     [Buffer.concat([Buffer.from([0x80,0x32,0,0,241]),Buffer.alloc(241,0x61),Buffer.from([0])]),0x6700],
     [apdu(0x32),0x6700]]){
     assert.equal((await card.transmit(apdu(0x20,Buffer.from('123456')))).sw,0x9000);
     assert.equal((await card.transmit(apdu(0x30))).sw,0x9000);
     assert.equal((await card.transmit(apdu(0x32,Buffer.from('prefix')))).sw,0x9000);
     assert.equal((await card.transmit(command)).sw,status);
     assert.equal(await card.inputWiped(),true);
     assert.equal((await card.transmit(apdu(0x34,Buffer.from('suffix')))).sw,0x6982);
   }
 }finally{card.close()}
});

test('4096 byte streaming limit signs exactly once, rejects overflow and preserves key across reset',async()=>{
 const card=await openJavaCardSimulator();
 try {
   const message=Buffer.alloc(4096,0x61),chunk=message.subarray(0,240);
   const start=async()=>{assert.equal((await card.transmit(apdu(0x20,Buffer.from('123456')))).sw,0x9000);assert.equal((await card.transmit(apdu(0x30))).sw,0x9000)};
   await start();for(let i=0;i<17;i++)assert.equal((await card.transmit(apdu(0x32,chunk))).sw,0x9000);
   const result=await card.transmit(apdu(0x34,message.subarray(4080)));assert.equal(result.sw,0x9000);
   const signature=derToP1363(result.data).toString('hex');assert(verifyOwner(message,signature,card.publicKey));
   assert.equal(verifyOwner(Buffer.concat([message,Buffer.from('x')]),signature,card.publicKey),false);
   assert.equal(await card.inputWiped(),true);await start();for(let i=0;i<17;i++)assert.equal((await card.transmit(apdu(0x32,chunk))).sw,0x9000);
   assert.equal((await card.transmit(apdu(0x34,Buffer.alloc(17,0x61)))).sw,0x6700);
   assert.equal((await card.transmit(apdu(0x34,Buffer.from('x')))).sw,0x6982);
   const before=card.publicKey;await card.reset();const after=await card.transmit(apdu(0x10));assert.equal(after.sw,0x9000);
   const point=after.data;const compressed=Buffer.concat([Buffer.from([2+(point[64]&1)]),point.subarray(1,33)]).toString('hex');assert.equal(compressed,before);
   const grant=grantFor(softwareAgent());assert(verifyOwner(grantBytes(grant),await card.signGrant(grant),before));
 }finally{card.close()}
});
