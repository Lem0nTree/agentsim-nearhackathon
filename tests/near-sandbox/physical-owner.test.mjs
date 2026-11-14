import test from 'node:test';import assert from 'node:assert/strict';import {PassThrough,Writable} from 'node:stream';
import {openPhysicalOwner,promptOwnerPin} from './physical-owner.mjs';
import {softwareOwner,grantBytes,controlBytes,verifyOwner} from '../../src/protocol.mjs';
const owner=softwareOwner(),grant={chain:'local',vault:'agentsim.local',epoch:'0',agent:'agent',sessionKey:'01'.repeat(32),perCall:'100',total:'150',receiver:'compute.local',expires:'1600'};
const control={chain:'local',vault:'agentsim.local',epoch:'0',nonce:'0',operation:'revoke',value:'ab'.repeat(32)};
const opts={reader:'Exact reader',expectedAID:'F0414753494D0701',pinnedPublicKey:owner.publicKey};
test('physical adapter signs and independently verifies grant and control, then wipes PIN',async()=>{
 let secret=Buffer.from('654321'),closed=0,seen=[];const connectCard=async args=>{assert.deepEqual(args,{reader:opts.reader,expectedAID:opts.expectedAID});return {publicKey:async()=>owner.publicKey,sign:async(bytes,pin)=>{seen.push(Buffer.from(pin));return {publicKey:owner.publicKey,signature:owner.sign(bytes)}},close:()=>closed++}};
 const card=await openPhysicalOwner({...opts,connectCard,promptPin:async()=>secret});assert.equal(card.source,'Physical SIM');assert(verifyOwner(grantBytes(grant),await card.signGrant(grant),owner.publicKey));assert(verifyOwner(controlBytes(control),await card.signControl(control),owner.publicKey));assert.equal(seen.length,2);card.close();assert(secret.every(x=>x===0));assert.equal(closed,1);await assert.rejects(card.signGrant(grant),/OWNER_CLOSED/);
});
test('invalid configuration and wrong pinned key fail before PIN prompt',async()=>{
 let prompts=0,closes=0,connects=0;const connectCard=async()=>{connects++;return {publicKey:async()=>softwareOwner().publicKey,close:()=>closes++}};
 await assert.rejects(openPhysicalOwner({...opts,reader:'',connectCard}),/OWNER_CARD_CONFIGURATION/);assert.equal(connects,0);
 await assert.rejects(openPhysicalOwner({...opts,connectCard,promptPin:async()=>{prompts++;return Buffer.from('654321')}}),/OWNER_PUBLIC_KEY_MISMATCH/);assert.equal(prompts,0);assert.equal(closes,1);
});
test('wrong returned key or corrupted signature never succeeds',async()=>{
 for(const tamper of ['key','signature']){const pin=Buffer.from('654321');const card=await openPhysicalOwner({...opts,promptPin:async()=>pin,connectCard:async()=>({publicKey:async()=>owner.publicKey,sign:async bytes=>({publicKey:tamper==='key'?softwareOwner().publicKey:owner.publicKey,signature:tamper==='signature'?'00'.repeat(64):owner.sign(bytes)}),close(){}})});await assert.rejects(card.signGrant(grant),/OWNER_SIGNATURE_INVALID/);card.close();assert(pin.every(x=>x===0))}
});
test('PIN prompt requires terminal and never echoes input',async()=>{
 await assert.rejects(promptOwnerPin(new PassThrough(),new PassThrough()),/OWNER_PIN_TTY_REQUIRED/);
 const input=new PassThrough();input.isTTY=true;let raw=[];input.setRawMode=x=>raw.push(x);let output='';const out=new Writable({write(chunk,enc,done){output+=chunk.toString();done()}});
 const pending=promptOwnerPin(input,out);input.write(Buffer.from('987654\r'));const pin=await pending;assert.equal(pin.toString(),'987654');assert.equal(output,'Owner PIN: \n');assert.deepEqual(raw,[true,false]);pin.fill(0);
});
