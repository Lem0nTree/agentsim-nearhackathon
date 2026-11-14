"""Configure the dedicated, already initialized restricted-relayer sandbox."""
from pathlib import Path
import subprocess,sys
root=Path(__file__).resolve().parents[2]
home=root/'.build'/'relay-sandbox-home'
if not (home/'config.json').is_file(): raise SystemExit('Initialize .build/relay-sandbox-home first.')
subprocess.run([sys.executable,str(root/'tests/near-sandbox/isolate.py'),str(home)],check=True)
(home/'agentsim-runtime-owner.txt').write_text('restricted-relayer-terra-2026-11-14\n',encoding='utf8')
print('Dedicated relay sandbox configured for loopback-only use.')
