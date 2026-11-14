"""Build an allowlisted, reviewable local release ZIP; never reads private directories."""
import argparse,hashlib,json,subprocess,zipfile
from pathlib import Path,PurePosixPath
ROOT=Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser();p.add_argument('--proof',type=Path,required=True);p.add_argument('--media-dir',type=Path,required=True);p.add_argument('--output',type=Path,default=ROOT/'.build/submission-package/agentsim-submission.zip');a=p.parse_args()
proof=a.proof.resolve();media=a.media_dir.resolve();out=a.output.resolve();out.parent.mkdir(parents=True,exist_ok=True)
subprocess.run(['node',str(ROOT/'tests/near-sandbox/verify-restricted.mjs'),str(proof)],cwd=ROOT,check=True)
e=json.loads(proof.read_text(encoding='utf8'));meta=json.loads((media/'video-source.json').read_text(encoding='utf8'))
hash_file=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
if e['mode'].get('mode')!='live' or not e['mode'].get('liveInference') or meta['proofSha256']!=hash_file(proof): raise SystemExit('Verified live proof and video source must match.')
allow=json.loads((ROOT/'submission/package-allowlist.json').read_text(encoding='utf8')); data={}
for name in allow:
 path=PurePosixPath(name)
 if path.is_absolute() or any(part in {'.','..','.local','.build','.git','node_modules','target','output'} for part in path.parts): raise SystemExit('Unsafe allowlist entry')
 f=ROOT.joinpath(*path.parts)
 if f.is_symlink() or not f.is_file() or not f.resolve().is_relative_to(ROOT): raise SystemExit('Missing or unsafe allowlist file: '+name)
 data[name]=f.read_bytes()
if 'evidence/near/'+proof.name in data and hashlib.sha256(data['evidence/near/'+proof.name]).hexdigest()!=hash_file(proof): raise SystemExit('Allowlisted live proof differs from video proof.')
for name,src in {'evidence/near/'+proof.name:proof,'submission/video/agentsim-live-demo.mp4':media/'agentsim-live-demo.mp4','submission/video/agentsim-live-demo.srt':media/'agentsim-live-demo.srt','submission/video/video-source.json':media/'video-source.json'}.items():
 value=src.read_bytes()
 if name in data and data[name]!=value: raise SystemExit('Allowlisted file differs from release artifact: '+name)
 data[name]=value
manifest={'format':'agentsim-submission-manifest-v1','baseCommit':'69030fa969e5db79eb56b953a19eed1f27c8e504','proofSha256':hash_file(proof),'entries':{n:hashlib.sha256(v).hexdigest() for n,v in sorted(data.items())},'note':'Manifest lists every other archive entry; ZIP hash is printed separately.'}
data['MANIFEST.json']=(json.dumps(manifest,indent=2)+'\n').encode()
with zipfile.ZipFile(out,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=9) as z:
 for name,content in sorted(data.items()):
  info=zipfile.ZipInfo(name,(2026,11,14,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED;info.external_attr=0o100644<<16;z.writestr(info,content)
print('Archive:',out);print('SHA-256:',hash_file(out));print('Entries:',len(data))
