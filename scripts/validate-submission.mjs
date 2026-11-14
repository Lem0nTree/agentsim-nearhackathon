import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
export const OPEN='2026-11-01T00:00:00Z',CLOSE='2026-11-14T23:59:00Z';
const fields=['requestId','projectName','leadName','email','size','tracks','nearAddress','projectUrl','demoUrl','idea','consent'];
const trackIds=['defi','thesis','privacy','business','swarms','security','agents','realworld','games','nfts','memecoins','social','open'];
export function validateSubmission(p,now=new Date()) {
  const errors=[];
  if(!p||typeof p!=='object'||Array.isArray(p))return ['Payload must be an object'];
  if(Object.keys(p).sort().join(',')!==fields.slice().sort().join(','))errors.push('Use exactly the official fields; no website field');
  const str=(k,min,max)=>{const v=p[k];if(typeof v!=='string'||v.length<min||v.length>max||v!==v.trim()){errors.push(`${k}: expected trimmed string ${min}-${max} characters`);return false;}return true;};
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(p.requestId??''))errors.push('requestId: supply and preserve one UUID');
  str('projectName',2,80);str('leadName',2,80);str('idea',20,2000);
  if(str('email',3,160)&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email))errors.push('email: invalid format');
  if(!['1','2 - 4','4 - 6','6 - 8','8+'].includes(p.size))errors.push('size: use an official category');
  if(!Array.isArray(p.tracks)||!p.tracks.length||new Set(p.tracks).size!==p.tracks.length||p.tracks.some(t=>!trackIds.includes(t)))errors.push('tracks: nonempty unique official IDs required');
  if(str('nearAddress',2,64)&&(!/^(([a-z\d]+[-_])*[a-z\d]+\.)*([a-z\d]+[-_])*[a-z\d]+$/.test(p.nearAddress)||p.nearAddress.endsWith('.testnet')))errors.push('nearAddress: mainnet account syntax required');
  for(const field of ['projectUrl','demoUrl'])if(str(field,10,300)){try{const u=new URL(p[field]);if(!['http:','https:'].includes(u.protocol)||u.username||u.password)throw Error();if(field==='demoUrl'&&!['x.com','www.x.com','twitter.com','www.twitter.com'].includes(u.hostname))errors.push('demoUrl: public X post required');}catch{errors.push(`${field}: valid public http(s) URL required`);}}
  if(p.consent!==true)errors.push('consent: genuine agreement to contact notice required');
  const time=+new Date(now);if(!Number.isFinite(time)||time<+new Date(OPEN)||time>+new Date(CLOSE))errors.push('Submission window is closed');
  return errors;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  const file=process.argv[2]??'submission/payload.template.json';
  const errors=validateSubmission(JSON.parse(fs.readFileSync(file,'utf8')));
  console.log(JSON.stringify({mode:'OFFLINE VALIDATION ONLY',file,errors,checksNotPerformed:['name/email uniqueness','account existence and control','link availability and content','prior-work eligibility','whether team already submitted','live rule changes'],notice:'No network request is made. Contact consent: I agree that the organizers may use these details to review our submission and contact us about this hackathon.'},null,2));
  process.exitCode=errors.length?1:0;
}
