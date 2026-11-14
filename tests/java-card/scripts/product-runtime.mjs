import fs from 'node:fs'; import path from 'node:path'; import {spawnSync} from 'node:child_process';
import {ROOT,SIM_JAR,verifyDependency,javaTool,fileHash} from './sim-runtime.mjs';
const classes=path.join(ROOT,'.build','product-applet-sim-classes');
const source=path.join(ROOT,'card','applet','src','agentsim','card','AgentSimApplet.java');
const bridge=path.join(ROOT,'tests','java-card','java','ProductAppletBridge.java');
export function buildProductSimulator(){verifyDependency();fs.mkdirSync(classes,{recursive:true});const r=spawnSync(javaTool('javac'),['-source','7','-target','7','-Xlint:-options','-classpath',SIM_JAR,'-d',classes,source,bridge],{encoding:'utf8',windowsHide:true});if(r.error||r.status!==0)throw Error('PRODUCT_SIM_BUILD '+(r.error?.message||r.stderr));fs.writeFileSync(path.join(classes,'manifest.json'),JSON.stringify({source:fileHash(source),bridge:fileHash(bridge)}));}
export function productCommand(installHex='00000706313233343536'){verifyDependency();const m=JSON.parse(fs.readFileSync(path.join(classes,'manifest.json'),'utf8'));if(m.source!==fileHash(source)||m.bridge!==fileHash(bridge))throw Error('PRODUCT_SIM_STALE: run npm run card-sim:setup');return {command:javaTool('java'),args:['-noverify','-classpath',[classes,SIM_JAR].join(path.delimiter),'agentsim.sim.ProductAppletBridge',installHex]}}
