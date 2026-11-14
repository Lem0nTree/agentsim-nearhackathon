import fs from 'node:fs';
import {softwareOwner,softwareAgent,grantBytes,spendBytes,controlBytes,digest} from '../src/protocol.mjs';
const o=softwareOwner(),a=softwareAgent();
const grant={chain:'testnet',vault:'agentsim-example.testnet',epoch:'0',agent:'demo',sessionKey:a.publicKey,perCall:'10000000000000000000000',total:'30000000000000000000000',receiver:'receiver-example.testnet',expires:'2000000000'};
const gb=grantBytes(grant),grantId=digest(gb);
const spend={chain:grant.chain,vault:grant.vault,epoch:'0',grantId,nonce:'0',receiver:grant.receiver,amount:'1000000000000000000000',deadline:'1999999900'};
const control={chain:grant.chain,vault:grant.vault,epoch:'0',nonce:'0',operation:'revoke',value:grantId};
fs.mkdirSync('artifacts',{recursive:true});
fs.writeFileSync('artifacts/protocol-vectors.json',JSON.stringify({disclosure:'Fresh software-only public test vectors. No private keys retained. Not a chain execution receipt.',ownerKey:o.publicKey,grant,grantBytes:gb.toString(),grantSha256:grantId,grantSignature:o.sign(gb),spend,spendBytes:spendBytes(spend).toString(),spendSignature:a.sign(spendBytes(spend)),control,controlBytes:controlBytes(control).toString(),controlSignature:o.sign(controlBytes(control))},null,2)+'\n');
