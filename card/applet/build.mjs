import fs from 'node:fs'; import path from 'node:path'; import {spawnSync} from 'node:child_process'; import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url)), jc=process.env.AGENTSIM_JC_HOME;
if(!jc){console.error('Set AGENTSIM_JC_HOME to a Java Card Classic SDK containing lib/api_classic.jar and lib/tools.jar.');process.exit(1)}
const api=path.join(jc,'lib','api_classic.jar'),converter=path.join(jc,'lib','tools.jar'),exportsDir=path.join(jc,'api_export_files');
for(const f of [api,converter,exportsDir])if(!fs.existsSync(f)){console.error('Java Card SDK component missing: '+f);process.exit(1)}
const home=process.env.AGENTSIM_JAVA_HOME; const tool=n=>home?path.join(home,'bin',process.platform==='win32'?n+'.exe':n):n;
const out=path.join(root,'.build','card');fs.mkdirSync(out,{recursive:true});
function run(cmd,args){const r=spawnSync(cmd,args,{cwd:root,stdio:'inherit',windowsHide:true});if(r.error||r.status!==0){console.error('Build failed: '+(r.error?.message||r.status));process.exit(1)}}
run(tool('javac'),['-source','7','-target','7','-classpath',api,'-d',out,path.join(root,'card/applet/src/agentsim/card/AgentSimApplet.java')]);
run(tool('java'),['-cp',path.join(jc,'lib','*'),'com.sun.javacard.converter.Main','-classdir',out,'-exportpath',exportsDir,'-d',out,'-out','CAP','-applet','0xF0:0x41:0x47:0x53:0x49:0x4D:0x07:0x01','agentsim.card.AgentSimApplet','agentsim.card','0xF0:0x41:0x47:0x53:0x49:0x4D:0x07','1.0']);
console.log('CAP conversion finished under '+out);

