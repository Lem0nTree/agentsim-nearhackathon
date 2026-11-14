import {exact,id,uint} from './protocol.mjs';
import {createHash} from 'node:crypto';
const ENDPOINT='https://cloud-api.near.ai/v1/chat/completions';
const MAX_BYTES=8192,TIMEOUT_MS=15000;
function decodeProposal(text,policy){
 if(typeof text!=='string'||Buffer.byteLength(text,'utf8')>1024)throw Error('PROPOSAL_FORMAT');
 let p;try{p=JSON.parse(text)}catch{throw Error('PROPOSAL_FORMAT')}
 try{exact(p,['amount','receiver']);id(p.receiver);const amount=uint(p.amount);if(amount===0n||amount>uint(policy.maxAmount)||p.receiver!==policy.receiver)throw Error()}catch{throw Error('PROPOSAL_POLICY')}
 return Object.freeze({amount:p.amount,receiver:p.receiver});
}
async function boundedBody(response){
 const length=response.headers.get('content-length');if(length && (!/^\d+$/.test(length)||Number(length)>MAX_BYTES))throw Error('PROVIDER_RESPONSE_LIMIT');
 if(!response.body)throw Error('PROVIDER_RESPONSE');const reader=response.body.getReader();const chunks=[];let total=0;
 try{for(;;){const {done,value}=await reader.read();if(done)break;total+=value.byteLength;if(total>MAX_BYTES){await reader.cancel();throw Error('PROVIDER_RESPONSE_LIMIT')}chunks.push(Buffer.from(value))}}finally{reader.releaseLock()}
 try{return JSON.parse(Buffer.concat(chunks).toString('utf8'))}catch{throw Error('PROVIDER_RESPONSE')}
}
export async function proposePayment({mode,policy,apiKey,model='z-ai/glm-5.3-flash',fetchImpl=globalThis.fetch,timeoutMs=TIMEOUT_MS}){
 try{exact(policy,['receiver','maxAmount']);id(policy.receiver);if(uint(policy.maxAmount)===0n)throw Error()}catch{throw Error('PROPOSAL_POLICY')}
 const trusted=Object.freeze({receiver:policy.receiver,maxAmount:policy.maxAmount});
 if(mode==='fixture')return {proposal:decodeProposal(JSON.stringify({receiver:trusted.receiver,amount:'1000000000000000000000'}),trusted),provenance:{mode:'fixture',liveInference:false}};
 if(mode!=='live')throw Error('PROPOSAL_MODE');
 if(typeof apiKey!=='string'||!apiKey.trim())throw Error('NEAR_AI_API_KEY_MISSING');
 if(typeof model!=='string'||!/^[A-Za-z0-9._/-]{1,100}$/.test(model))throw Error('PROVIDER_MODEL');
 if(!Number.isInteger(timeoutMs)||timeoutMs<1||timeoutMs>TIMEOUT_MS)throw Error('PROVIDER_TIMEOUT_CONFIG');
 const payload={model,messages:[{role:'system',content:'Return only a JSON object with exactly the string fields amount and receiver. Never output any other field.'},{role:'user',content:`Propose one sandbox test payment for one compute job, priced at 1000000000000000000000 yoctoNEAR. The only allowed receiver is ${trusted.receiver}; amount must be between 1 and ${trusted.maxAmount}.`}],max_tokens:1024,reasoning_effort:'low',response_format:{type:'json_object'},stream:false};
 const controller=new AbortController();let timer;
 const deadline=new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(Error('PROVIDER_TIMEOUT'))},timeoutMs)});
 const request=(async()=>{
   let response;try{response=await fetchImpl(ENDPOINT,{method:'POST',redirect:'error',signal:controller.signal,headers:{'content-type':'application/json',authorization:`Bearer ${apiKey}`},body:JSON.stringify(payload)})}catch{throw Error('PROVIDER_REQUEST_FAILED')}
   if(!response.ok){const status=Number.isInteger(response.status)&&response.status>=100&&response.status<=599?response.status:'UNKNOWN';throw Error(`PROVIDER_HTTP_${status}`)}
   let body;try{body=await boundedBody(response)}catch(error){if(error.message==='PROVIDER_RESPONSE_LIMIT')throw error;throw Error('PROVIDER_RESPONSE')}
   if(!body||!Array.isArray(body.choices)||body.choices.length!==1)throw Error('PROVIDER_RESPONSE');
   if(typeof body.model!=='string'||body.model!==model)throw Error('PROVIDER_MODEL_MISMATCH');
   if(typeof body.id!=='string'||!/^[A-Za-z0-9._-]{1,128}$/.test(body.id))throw Error('PROVIDER_RESPONSE');
   const choice=body.choices[0],message=choice?.message;
   if(choice.finish_reason!=='stop'||!message||message.role!=='assistant'||typeof message.content!=='string'||message.tool_calls!=null||message.function_call!=null||message.refusal!=null)throw Error('PROVIDER_RESPONSE');
   return {proposal:decodeProposal(message.content,trusted),provenance:{mode:'live',liveInference:true,requestedModel:model,returnedModel:body.model,responseIdSha256:createHash('sha256').update(body.id).digest('hex'),responseContent:message.content,contentSha256:createHash('sha256').update(message.content).digest('hex')}};
 })();
 try{return await Promise.race([request,deadline])}finally{clearTimeout(timer);controller.abort()}
}
