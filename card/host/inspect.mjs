import { openCard } from './pcsc.mjs';
const reader=process.env.AGENTSIM_READER, expectedAID=process.env.AGENTSIM_AID;
try {const card=await openCard({reader,expectedAID});try {console.log(JSON.stringify({stage:'public-key',selectStatus:card.selectStatus,publicKey:await card.publicKey(),provenance:'physical PC/SC card; no simulator fallback'},null,2))} finally {card.close()}} catch(e){console.error(e.message);process.exitCode=1}
