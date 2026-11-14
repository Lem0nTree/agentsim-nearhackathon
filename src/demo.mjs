import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { softwareAgent,spendBytes } from './protocol.mjs';
import { createOwnerSigner } from './owner-signer.mjs';
import { LocalVault } from './vault.mjs';

export async function runDemo() {
  const owner=createOwnerSigner({backend:'software'}), agent=softwareAgent();
  const vault=new LocalVault({ownerKey:owner.publicKey,now:()=>1000});
  const grant={chain:'local',vault:'agentsim.local',epoch:'0',agent:'research-agent',sessionKey:agent.publicKey,perCall:'100',total:'150',receiver:'compute.local',expires:'1600'};
  const grantId=vault.authorize(grant,await owner.signGrant(grant));
  const spend={chain:grant.chain,vault:grant.vault,epoch:'0',grantId,nonce:'0',receiver:'compute.local',amount:'90',deadline:'1500'};
  const sig=agent.sign(spendBytes(spend)); const transferId=vault.execute(spend,sig); vault.settle(transferId,true);
  const outcomes=[{case:'owner delegation',result:'accepted'},{case:'agent spends 90 test units',result:'settled'}];
  function denied(name,action,expected) { let code; try{action();}catch(e){code=e.code;} assert.equal(code,expected); outcomes.push({case:name,result:'rejected',code}); }
  denied('replay',()=>vault.execute(spend,sig),'NONCE');
  const over={...spend,nonce:'1',amount:'101'};
  denied('per-call overspend',()=>vault.execute(over,agent.sign(spendBytes(over))),'PER_CALL');
  const wrong={...spend,nonce:'1',receiver:'attacker.local'};
  denied('recipient substitution',()=>vault.execute(wrong,agent.sign(spendBytes(wrong))),'RECEIVER');
  const revoke={chain:'local',vault:'agentsim.local',epoch:'0',nonce:'0',operation:'revoke',value:grantId};
  vault.control(revoke,await owner.signControl(revoke));
  const after={...spend,nonce:'1',amount:'10'};
  denied('spend after owner revocation',()=>vault.execute(after,agent.sign(spendBytes(after))),'REVOKED');
  return {disclosure:'Local software P-256 signer and simulated vault. No SIM/JCOP execution, no chain deployment, no real money, no LLM.',outcomes,state:vault.snapshot()};
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.log(JSON.stringify(await runDemo(),null,2));
}
