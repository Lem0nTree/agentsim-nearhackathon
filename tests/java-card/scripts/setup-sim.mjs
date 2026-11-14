import fs from 'node:fs';
import path from 'node:path';
import { SIM_URL, SIM_JAR, SIM_HASH, verifyDependency } from './sim-runtime.mjs';

if (!fs.existsSync(SIM_JAR)) {
  console.log('Downloading pinned jCardSim dependency from Maven Central...');
  const response = await fetch(SIM_URL,{signal:AbortSignal.timeout(30000)});
  if (!response.ok) throw new Error(`SIM_DOWNLOAD_HTTP_${response.status}`);
  const data = Buffer.from(await response.arrayBuffer());
  const { createHash } = await import('node:crypto');
  if (createHash('sha256').update(data).digest('hex') !== SIM_HASH) throw new Error('SIM_DOWNLOAD_HASH_MISMATCH');
  fs.mkdirSync(path.dirname(SIM_JAR),{recursive:true});
  fs.writeFileSync(SIM_JAR,data);
}
verifyDependency();


const {buildProductSimulator}=await import('./product-runtime.mjs'); buildProductSimulator(); console.log('Product applet simulator compiled from card/applet source.');
