import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {PassThrough,Writable} from 'node:stream';
import {generateKeyPairSync,sign as cryptoSign} from 'node:crypto';
import {createCardSession} from '../../../card/host/pcsc.mjs';

function mock(handler){
 const child=new EventEmitter();child.stdout=new PassThrough();child.stderr=new PassThrough();child.killed=false;child.kill=()=>{child.killed=true};
 child.stdin=new Writable({write(chunk,enc,cb){handler(String(chunk).trim(),line=>child.stdout.write(line+'\n'));cb()}});
 return child;
}
async function connect(child,timeoutMs=100){const pending=createCardSession(child,{timeoutMs});queueMicrotask(()=>child.stdout.write('SELECT 9000\n'));return pending}
test('snapshots queued message and PIN before caller can mutate them',async()=>{
 const {privateKey,publicKey}=generateKeyPairSync('ec',{namedCurve:'prime256v1'}),jwk=publicKey.export({format:'jwk'});
 const point=Buffer.concat([Buffer.from([4]),Buffer.from(jwk.x,'base64url'),Buffer.from(jwk.y,'base64url')]);
 let observedPin,observedMessage;
 const child=mock((hex,reply)=>{const cmd=Buffer.from(hex,'hex'); if(cmd[1]===0x10)reply(point.toString('hex')+'9000'); else if(cmd[1]===0x20){observedPin=cmd.subarray(5,5+cmd[4]).toString();reply('9000')} else if(cmd[1]===0x30)reply('9000'); else if(cmd[1]===0x34){observedMessage=Buffer.from(cmd.subarray(5,5+cmd[4]));reply(cryptoSign('sha256',observedMessage,privateKey).toString('hex')+'9000')}});
 const card=await connect(child);const bytes=Buffer.from('original'),pin=Buffer.from('654321');const pending=card.sign(bytes,pin);bytes.fill(120);pin.fill(48);
 await pending;assert.equal(observedMessage.toString(),'original');assert.equal(observedPin,'654321');card.close();
});
test('timeout terminates bridge and rejects pending and queued APDUs',async()=>{
 const child=mock(()=>{}),card=await connect(child,30);const first=card.publicKey(),second=card.publicKey();
 await Promise.all([assert.rejects(first,/PCSC_TIMEOUT/),assert.rejects(second,/PCSC_TIMEOUT/)]);assert.equal(child.killed,true);await assert.rejects(card.publicKey(),/PCSC_TIMEOUT/);
});
test('close rejects in-flight and queued work immediately',async()=>{
 const child=mock(()=>{}),card=await connect(child);const first=card.publicKey(),second=card.publicKey();card.close();
 await Promise.all([assert.rejects(first,/PCSC_CLOSED/),assert.rejects(second,/PCSC_CLOSED/)]);assert.equal(child.killed,true);
});
test('startup timeout terminates unresponsive bridge',async()=>{
 const child=mock(()=>{});await assert.rejects(createCardSession(child,{timeoutMs:30}),/PCSC_TIMEOUT/);assert.equal(child.killed,true);
});

test('broken stdin pipe rejects pending and queued operations without an unhandled stream error',async()=>{
 const child=new EventEmitter();child.stdout=new PassThrough();child.stderr=new PassThrough();child.killed=false;child.kill=()=>{child.killed=true};
 child.stdin=new Writable({write(data,encoding,callback){const e=new Error('private stream payload');e.code='EPIPE';callback(e)}});
 const card=await connect(child);const first=card.publicKey(),second=card.publicKey();
 await Promise.all([assert.rejects(first,/PCSC_STDIN_ERROR/),assert.rejects(second,/PCSC_STDIN_ERROR/)]);
 assert.equal(child.killed,true);await assert.rejects(card.publicKey(),/PCSC_STDIN_ERROR/);
});
test('stdout or stderr stream error closes the session and rejects pending work',async()=>{
 for(const name of ['stdout','stderr']){const child=mock(()=>{}),card=await connect(child);const pending=card.publicKey();
 child[name].emit('error',Error('secret payload'));await assert.rejects(pending,new RegExp('PCSC_'+name.toUpperCase()+'_ERROR'));assert.equal(child.killed,true)}
});
test('closed stdout or stderr rejects pending work',async()=>{
 for(const name of ['stdout','stderr']){const child=mock(()=>{}),card=await connect(child);const pending=card.publicKey();
 child[name].emit('close');await assert.rejects(pending,new RegExp('PCSC_'+name.toUpperCase()+'_CLOSED'));assert.equal(child.killed,true)}
});

test('malformed APDU response terminates the session and rejects queued work',async()=>{
 let writes=0;const child=mock((_hex,reply)=>{writes++;reply(writes===1?'not-a-response':'9000')});
 const card=await connect(child);const first=card.transmit(Buffer.from('8010000000','hex')),second=card.transmit(Buffer.from('8010000000','hex'));
 await Promise.all([assert.rejects(first,/PCSC_RESPONSE/),assert.rejects(second,/PCSC_RESPONSE/)]);
 assert.equal(writes,1);assert.equal(child.killed,true);await assert.rejects(card.publicKey(),/PCSC_RESPONSE/);
});
