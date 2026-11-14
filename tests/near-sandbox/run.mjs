import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {connect,keyStores,KeyPair,transactions,utils} from 'near-api-js';
import {openJavaCardSimulator} from '../../off-track/video-emulator/src/product-applet-signer.mjs';
import {grantBytes,spendBytes,controlBytes,digest,verifyOwner,verifySession,softwareAgent} from '../../src/protocol.mjs';
const rpc='http://127.0.0.1:3030', expectedChain='agentsim-local';
const callRpc=async(method,params)=>{const r=await fetch(rpc,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:'agentsim',method,params})});const x=await r.json();if(x.error)throw Error(JSON.stringify(x.error));return x.result};
const status=await callRpc('status',[]), config=await callRpc('EXPERIMENTAL_protocol_config',{finality:'final'});
assert.equal(status.chain_id,expectedChain,'Refusing non-local chain');assert.equal(config.runtime_config.wasm_config.p256_verify_host_fn,true,'P-256 host function missing');
const sandboxConfig=JSON.parse(fs.readFileSync(process.env.AGENTSIM_SANDBOX_CONFIG??'.build/sandbox-home/config.json','utf8'));
const net=sandboxConfig.network;
assert.equal(net.addr,'127.0.0.1:24568');assert.equal(sandboxConfig.rpc.addr,'127.0.0.1:3030');
assert.equal(net.boot_nodes,'');assert.deepEqual(net.trusted_stun_servers,[]);assert.deepEqual(sandboxConfig.telemetry.endpoints,[]);
assert.equal(net.tier1.enable_inbound,false);assert.equal(net.tier1.enable_outbound,false);assert.equal(net.experimental.network_config_overrides.outbound_disabled,true);
assert(net.public_addrs.length>0 && net.public_addrs.every(x=>x.endsWith('@127.0.0.1:24568')));
const keyPath=process.env.AGENTSIM_SANDBOX_KEY??'.build/sandbox-home/validator_key.json';
const creds=JSON.parse(fs.readFileSync(keyPath,'utf8'));assert.equal(creds.account_id,'test.near');
const relayer=KeyPair.fromString(creds.secret_key??creds.private_key),keyStore=new keyStores.InMemoryKeyStore();
await keyStore.setKey(expectedChain,'test.near',relayer);
const near=await connect({networkId:expectedChain,nodeUrl:rpc,keyStore});const root=await near.account('test.near');
const owner=await openJavaCardSimulator(),agent=softwareAgent(),vaultKey=KeyPair.fromRandom('ed25519'),receiverKey=KeyPair.fromRandom('ed25519');
const suffix=process.env.AGENTSIM_SANDBOX_RUN_ID??Date.now().toString(36);assert(/^[a-z0-9]{1,20}$/.test(suffix));const vaultId=`v${suffix}.test.near`,receiverId=`r${suffix}.test.near`;await keyStore.setKey(expectedChain,vaultId,vaultKey);
const vault=await near.account(vaultId),gas=200_000_000_000_000n,NEAR=10n**24n;
const outcomes=[];
function snap(name,result,args,signed){const summary={name,signer:result.transaction.signer_id,publicKey:result.transaction.public_key,receiver:result.transaction.receiver_id,transactionHash:result.transaction.hash,outerSignature:result.transaction.signature,transactionNonce:String(result.transaction.nonce),transactionBlockHash:utils.serialize.base_encode(signed.transaction.blockHash),decodedActions:result.transaction.actions.map(a=>{if(a.FunctionCall){const c=a.FunctionCall;const decoded=JSON.parse(Buffer.from(c.args,'base64').toString('utf8'));assert.deepEqual(decoded,args);return {type:'FunctionCall',method:c.method_name,args:decoded,argsBase64:c.args,gas:String(c.gas),deposit:String(c.deposit)}}if(a.DeployContract)return {type:'DeployContract',note:'WASM omitted; digest is recorded'};return {type:typeof a==='string'?a:Object.keys(a)[0]}}),status:result.status,receipts:result.receipts_outcome.map(x=>({id:x.id,executor:x.outcome.executor_id,status:x.outcome.status,logs:x.outcome.logs,gasBurnt:x.outcome.gas_burnt,tokensBurnt:x.outcome.tokens_burnt})),args};const hash=utils.serialize.base_decode(summary.transactionHash),signature=utils.serialize.base_decode(summary.outerSignature.split(':')[1]);
 assert(utils.PublicKey.fromString(summary.publicKey).verify(hash,signature),'outer signature invalid');
 if(summary.decodedActions.every(a=>a.type==='FunctionCall')){const actions=summary.decodedActions.map(a=>transactions.functionCall(a.method,Buffer.from(a.argsBase64,'base64'),BigInt(a.gas),BigInt(a.deposit)));const tx=transactions.createTransaction(summary.signer,utils.PublicKey.fromString(summary.publicKey),summary.receiver,BigInt(summary.transactionNonce),actions,utils.serialize.base_decode(summary.transactionBlockHash));assert.equal(utils.serialize.base_encode(crypto.createHash('sha256').update(transactions.encodeTransaction(tx)).digest()),summary.transactionHash,'outer transaction hash mismatch')}
 outcomes.push(summary);return summary}
async function send(account,receiverId,name,actions,args){const signed=await account.createSignedTransaction(receiverId,actions);const r=await account.provider.sendTransactionUntil(signed,'FINAL');return snap(name,r,args,signed)}
function success(x){assert(!('Failure' in x.status),JSON.stringify(x.status));assert(x.receipts.every(y=>!('Failure' in y.status)),JSON.stringify(x.receipts));}
function failed(x,code){assert(JSON.stringify(x.status).includes(code),JSON.stringify(x.status));}
const fn=(method,args,deposit=0n)=>transactions.functionCall(method,args,gas,deposit);
async function method(account,name,args,deposit=0n){return send(account,vaultId,name,[fn(name,args,deposit)],args)}
async function view(method,args={}){return vault.viewFunction({contractId:vaultId,methodName:method,args})}
async function state(id){return {status:await view('status'),grant:await view('grant_status',{grant_id:id})}}
async function balance(id){return (await callRpc('query',{request_type:'view_account',account_id:id,finality:'final'})).amount}
try {
 const wasm=fs.readFileSync(process.env.AGENTSIM_VAULT_WASM??'contracts/agentsim-vault/artifacts/agentsim_vault.wasm');
 for(const [id,key] of [[vaultId,vaultKey],[receiverId,receiverKey]])success(await send(root,id,'create-account',[transactions.createAccount(),transactions.transfer(10n*NEAR),transactions.addKey(key.getPublicKey(),transactions.fullAccessKey())],{initialBalance:'10000000000000000000000000'}));
 success(await send(vault,vaultId,'deploy',[transactions.deployContract(wasm)],{wasmSha256:crypto.createHash('sha256').update(wasm).digest('hex')}));
 success(await method(vault,'new',{owner_key:owner.publicKey}));success(await method(vault,'fund',{},2n*NEAR));
 const now=Math.floor(Date.now()/1000),grant={chain:expectedChain,vault:vaultId,epoch:'0',agent:'research-agent',sessionKey:agent.publicKey,perCall:(2n*10n**21n).toString(),total:(3n*10n**21n).toString(),receiver:receiverId,expires:String(now+1200)};
 const grantSignature=await owner.signGrant(grant);assert(verifyOwner(grantBytes(grant),grantSignature,owner.publicKey));const grantId=digest(grantBytes(grant));const tamperedGrant={...grant,total:(4n*10n**21n).toString()};failed(await method(root,'authorize',{grant:tamperedGrant,signature:grantSignature}),'OWNER_SIGNATURE');success(await method(root,'authorize',{grant,signature:grantSignature}));
 const spend={chain:expectedChain,vault:vaultId,epoch:'0',grantId,nonce:'0',receiver:receiverId,amount:(10n**21n).toString(),deadline:String(now+600)};
 const spendSignature=agent.sign(spendBytes(spend));assert(verifySession(spendBytes(spend),spendSignature,agent.publicKey));
 const initialState=await state(grantId);const foreignAgent=softwareAgent();failed(await method(root,'execute',{spend,signature:foreignAgent.sign(spendBytes(spend))}),'SESSION_SIGNATURE');assert.deepEqual(await state(grantId),initialState);
 const before={vault:await balance(vaultId),receiver:await balance(receiverId)};const payment=await method(root,'execute',{spend,signature:spendSignature});success(payment);const after={vault:await balance(vaultId),receiver:await balance(receiverId)};
 assert.equal(BigInt(after.receiver)-BigInt(before.receiver),BigInt(spend.amount),'receiver balance delta');
 assert(payment.receipts.some(x=>x.executor===receiverId && x.status.SuccessValue!==undefined),'successful receiver transfer receipt missing');const paidState=await state(grantId);assert.equal(paidState.status.available,(2n*NEAR-BigInt(spend.amount)).toString());assert.equal(paidState.grant.spent,spend.amount);assert.equal(paidState.grant.nextNonce,'1');assert.equal(paidState.grant.revoked,false);
 failed(await method(root,'execute',{spend,signature:spendSignature}),'NONCE');assert.deepEqual(await state(grantId),paidState);
 const overspend={...spend,nonce:'1',amount:(3n*10n**21n).toString()};failed(await method(root,'execute',{spend:overspend,signature:agent.sign(spendBytes(overspend))}),'PER_CALL');assert.deepEqual(await state(grantId),paidState);
 const control={chain:expectedChain,vault:vaultId,epoch:'0',nonce:'0',operation:'revoke',value:grantId}, controlSignature=await owner.signControl(control);assert(verifyOwner(controlBytes(control),controlSignature,owner.publicKey));success(await method(root,'control',{command:control,signature:controlSignature}));
 const revokedState=await state(grantId);assert.equal(revokedState.status.controlNonce,'1');assert.equal(revokedState.status.available,paidState.status.available);assert.equal(revokedState.grant.revoked,true);assert.equal(revokedState.grant.spent,spend.amount);assert.equal(revokedState.grant.nextNonce,'1');const revoked={...spend,nonce:'1'};failed(await method(root,'execute',{spend:revoked,signature:agent.sign(spendBytes(revoked))}),'REVOKED');assert.deepEqual(await state(grantId),revokedState);
 const settled=payment.receipts.flatMap(x=>x.logs).find(x=>x.includes('agentsim_settled'));assert(settled && JSON.parse(settled).success===true,'successful settlement callback missing');
 const evidence={schema:'agentsim-local-near-sandbox/v1',createdAt:new Date().toISOString(),network:'isolated local sandbox; no public network transaction',chainId:status.chain_id,protocolVersion:status.protocol_version,p256HostFunction:true,sandboxVersion:status.version,networkIsolation:{rpc:rpc,peerAddr:net.addr,bootNodes:'',stunServers:[],telemetryEndpoints:[],tier1Inbound:false,tier1Outbound:false,peerOutboundDisabled:true},wasmSha256:crypto.createHash('sha256').update(wasm).digest('hex'),roles:{owner:{algorithm:'P-256',source:'product Java Card applet in PC jCardSim',publicKey:owner.publicKey},agent:{algorithm:'Ed25519',publicKey:agent.publicKey},outerRelayer:{algorithm:'Ed25519',account:'test.near',publicKey:relayer.getPublicKey().toString()}},grant:{grant,canonicalUtf8:grantBytes(grant).toString(),signature:grantSignature,grantId},spend:{spend,canonicalUtf8:spendBytes(spend).toString(),signature:spendSignature},revocation:{control,canonicalUtf8:controlBytes(control).toString(),signature:controlSignature},before,after,states:{initial:initialState,afterPayment:paidState,afterRevocation:revokedState},outcomes};
 fs.mkdirSync('.build/sandbox-results',{recursive:true});fs.writeFileSync('.build/sandbox-results/evidence.json',JSON.stringify(evidence,null,2)+'\n');console.log('SANDBOX_PASS',JSON.stringify({chain:status.chain_id,protocol:status.protocol_version,receiverDelta:(BigInt(after.receiver)-BigInt(before.receiver)).toString(),outcomes:outcomes.length,relayer:relayer.getPublicKey().toString()}));
} finally {owner.close()}

