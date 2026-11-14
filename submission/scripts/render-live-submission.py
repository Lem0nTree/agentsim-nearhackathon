"""Render a 72-second local demonstration from a verified live-mode proof."""
import argparse, hashlib, json, os, shutil, subprocess
from decimal import Decimal
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
parser=argparse.ArgumentParser(); parser.add_argument('evidence',type=Path); parser.add_argument('--output',type=Path,default=ROOT/'.build/submission-package'); args=parser.parse_args()
evidence=args.evidence.resolve(); out=args.output.resolve(); out.mkdir(parents=True,exist_ok=True)
subprocess.run(['node',str(ROOT/'tests/near-sandbox/verify-restricted.mjs'),str(evidence)],check=True,cwd=ROOT)
e=json.loads(evidence.read_text(encoding='utf8'))
if e['mode'].get('mode')!='live' or e['mode'].get('liveInference') is not True: raise SystemExit('A verified live-mode proof is required; fixture is not live inference.')
if e['proposal']['amount']!=e['spend']['value']['amount']: raise SystemExit('Proposal and spend differ')
amount=e['proposal']['amount']; human=format(Decimal(amount)/Decimal(10**24),'f'); execute=[o for o in e['outcomes'] if o['name']=='execute'];
if len(execute)!=1: raise SystemExit('Expected one successful execute')
tx=execute[0]['transactionHash']; digest=hashlib.sha256(evidence.read_bytes()).hexdigest(); tmp=out/'frames'; tmp.mkdir(exist_ok=True)
fonts=[Path(os.environ.get('WINDIR','C:/Windows'))/'Fonts/arial.ttf',Path('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf')]; font=next((f for f in fonts if f.is_file()),None)
if not font: raise SystemExit('Arial or DejaVu Sans is required')
shutil.copyfile(font,tmp/'font.ttf')
slides=[
('YOUR SIM. YOUR AGENT. YOUR RULES.','Owner control for personal NEAR AI agents.',f'Buy one compute job for {human} test NEAR.'),
('SIGNING ON A PHYSICAL SIM','The project owner confirmed physical SIM signing.','Owner report, 14 Nov 2026. Independent verification not supplied.'),
('PERMISSION WITH LIMITS','P-256 owner grant: recipient, budget and expiry.',f"PC applet grant signature: {e['grant']['signature'][:20]}..."),
('A LIVE AI PAYMENT PROPOSAL',f"{human} test NEAR | {e['mode']['returnedModel']}",f"Receiver: {e['proposal']['receiver']}"),
('THE AGENT SIGNS THE SPEND','A separate Ed25519 session key signs the payment.',f"Agent signature: {e['spend']['signature'][:20]}..."),
('RELAY WITH NARROW AUTHORITY','One finite-allowance key can call execute only.','Node rejects wrong receiver, method, deposit and transfer.'),
('LOCAL NEAR TRANSFER',f'{human} test NEAR transferred | callback succeeded',f'Local execute transaction: {tx[:22]}...'),
('REVOKE. STAY IN CONTROL.','Owner signs revocation; later spend is rejected.',f"PC applet revocation signature: {e['revocation']['signature'][:20]}...")]
for i,(title,sub,detail) in enumerate(slides):
 for name,text in [('title',title),('sub',sub),('detail',detail)]: (tmp/f'{name}{i}.txt').write_text(text,encoding='utf8')
 filt=('drawbox=x=0:y=0:w=24:h=720:color=0xff6b28:t=fill,'
 "drawtext=fontfile=font.ttf:fontsize=32:fontcolor=white:x=76:y=54:text='AgentSIM',"
 f"drawtext=fontfile=font.ttf:fontsize=20:fontcolor=0xffb88d:x=1030:y=62:text='0{i+1} / 08',"
 f'drawtext=fontfile=font.ttf:fontsize={40 if i == 0 else 49}:fontcolor=white:x=76:y=205:textfile=title{i}.txt,'
 f'drawtext=fontfile=font.ttf:fontsize=29:fontcolor=0xffa270:x=76:y=315:textfile=sub{i}.txt,'
 f'drawtext=fontfile=font.ttf:fontsize=23:fontcolor=0xdddddd:x=76:y=380:textfile=detail{i}.txt,'
 'drawbox=x=76:y=566:w=1128:h=2:color=0x663d29:t=fill,'
 "drawtext=fontfile=font.ttf:fontsize=19:fontcolor=0xaaaaaa:x=76:y=606:text='Recorded demonstration  |  Product applet on PC  |  Local NEAR test funds'")
 if i == 3:
  (tmp/'raw-amount.txt').write_text('Raw amount: '+amount+' yoctoNEAR',encoding='utf8')
  filt += ',drawtext=fontfile=font.ttf:fontsize=23:fontcolor=0xaaaaaa:x=76:y=430:textfile=raw-amount.txt'
 if i == 0:
  filt += ',drawbox=x=1015:y=178:w=155:h=198:color=0xff6b28:t=fill,drawbox=x=1029:y=192:w=127:h=170:color=0x101014:t=fill,drawbox=x=1053:y=231:w=79:h=91:color=0xffa270:t=fill,drawbox=x=1056:y=260:w=73:h=3:color=0x101014:t=fill,drawbox=x=1056:y=291:w=73:h=3:color=0x101014:t=fill,drawbox=x=1089:y=234:w=3:h=85:color=0x101014:t=fill'
 subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-f','lavfi','-i','color=c=0x101014:s=1280x720','-vf',filt,'-frames:v','1','-threads','1',f'frame{i}.png'],cwd=tmp,check=True)
(tmp/'frames.txt').write_text(''.join(f"file 'frame{i}.png'\nduration 9\n" for i in range(8))+"file 'frame7.png'\n",encoding='utf8')
subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i','frames.txt','-t','72','-r','24','-c:v','libx264','-pix_fmt','yuv420p','-movflags','+faststart',str(out/'agentsim-live-demo.mp4')],cwd=tmp,check=True)
def timestamp(sec): return f'00:{sec//60:02}:{sec%60:02},000'
(out/'agentsim-live-demo.srt').write_text(''.join(f'{i+1}\n{timestamp(i*9)} --> {timestamp((i+1)*9)}\n{sub}\n{detail}'+(('\nRaw amount: '+amount+' yoctoNEAR') if i==3 else '')+'\n\n' for i,(_,sub,detail) in enumerate(slides)),encoding='utf8')
(out/'video-source.json').write_text(json.dumps({'proofSha256':digest,'mode':'live','proposalAmount':amount,'receiver':e['proposal']['receiver'],'executeTransactionHash':tx,'requestedModel':e['mode']['requestedModel'],'returnedModel':e['mode']['returnedModel'],'assistantContentSha256':e['mode']['contentSha256'],'attestation':'not verified'},indent=2)+'\n',encoding='utf8')
print('Video:',out/'agentsim-live-demo.mp4');print('Source proof SHA-256:',digest)
