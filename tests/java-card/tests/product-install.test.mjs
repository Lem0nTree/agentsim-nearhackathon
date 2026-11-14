import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {productCommand} from '../scripts/product-runtime.mjs';
function install(hex){const {command,args}=productCommand(hex);return spawnSync(command,args,{input:'',encoding:'utf8',timeout:15000,windowsHide:true})}
const data=pin=>`0000${(pin.length+1).toString(16).padStart(2,'0')}${pin.length.toString(16).padStart(2,'0')}${pin.toString('hex')}`;
test('product applet accepts per-install PIN lengths 6 and 16',()=>{for(const len of [6,16]){const r=install(data(Buffer.alloc(len,0x31)));assert.equal(r.status,0,r.stderr);assert.match(r.stdout,/READY product-applet-p256/)}});
test('product applet rejects short, long and inconsistent install data',()=>{
 for(const hex of [data(Buffer.alloc(5,0x31)),data(Buffer.alloc(17,0x31)),'00000707313233343536','00000906313233343536','00000100']){const r=install(hex);assert.notEqual(r.status,0,hex);assert.doesNotMatch(r.stdout,/READY product-applet-p256/)}
});
