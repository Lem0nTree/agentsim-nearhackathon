import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';

export const ROOT = fileURLToPath(new URL('../../../', import.meta.url));
export const SIM_VERSION = '3.0.5.0';
export const SIM_HASH = '5587d55f63d0364ed4da93404595071ad56f09833ded91d7addfd860341bee6b';
export const SIM_URL = `https://repo.maven.apache.org/maven2/com/klinec/jcardsim/${SIM_VERSION}/jcardsim-${SIM_VERSION}.jar`;
export const SIM_JAR = path.join(ROOT, '.build', 'offtrack-deps', `jcardsim-${SIM_VERSION}.jar`);
export const SIM_CLASSES = path.join(ROOT, '.build', 'offtrack-classes');
export const fileHash = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex');

export function javaTool(name) {
  const executable = process.platform === 'win32' ? `${name}.exe` : name;
  const homes = [process.env.AGENTSIM_JAVA_HOME, process.env.JAVA_HOME,
    ''].filter(Boolean);
  for (const home of homes) {
    const candidate = path.join(home, 'bin', executable);
    if (fs.existsSync(candidate)) return candidate;
  }
  return executable;
}

export function verifyDependency() {
  if (!fs.existsSync(SIM_JAR)) throw new Error('SIM_DEPENDENCY_MISSING: run npm run card-sim:setup');
  if (fileHash(SIM_JAR) !== SIM_HASH) throw new Error('SIM_DEPENDENCY_HASH_MISMATCH');
}

