import { check, uint, hex, context, grantBytes, spendBytes, controlBytes, digest, p256PublicKey, verifyOwner, verifySession } from './protocol.mjs';

/** In-memory reference state machine. Test units only: never holds or sends NEAR. */
export class LocalVault {
  #owner; #epoch = 0n; #controlNonce = 0n; #paused = false; #balance;
  #grants = new Map(); #revoked = new Set(); #pending = new Map(); #events = [];
  constructor({chain='local', vault='agentsim.local', ownerKey, balance='1000', now=()=>Math.floor(Date.now()/1000)}) {
    context(chain,vault,'0'); p256PublicKey(ownerKey); uint(balance);
    this.chain=chain; this.vault=vault; this.now=now; this.#owner=ownerKey; this.#balance=BigInt(balance);
  }
  #scope(value) {
    check(value.chain===this.chain && value.vault===this.vault, 'DOMAIN');
    check(BigInt(value.epoch)===this.#epoch, 'EPOCH');
  }
  #time() { const time=this.now(); check(Number.isSafeInteger(time)&&time>=0,'CLOCK'); return BigInt(time); }
  authorize(grant, signature) {
    const bytes=grantBytes(grant); this.#scope(grant);
    check(!this.#paused,'PAUSED'); check(this.#time()<BigInt(grant.expires),'EXPIRED');
    check(verifyOwner(bytes,signature,this.#owner),'OWNER_SIGNATURE');
    const grantId=digest(bytes);
    check(!this.#grants.has(grantId)&&!this.#revoked.has(grantId),'GRANT_EXISTS');
    this.#grants.set(grantId,{grant:structuredClone(grant),spent:0n,nextNonce:0n});
    this.#events.push({type:'grant',grantId,hardware:'unverified'}); return grantId;
  }
  execute(spend, signature) {
    const bytes=spendBytes(spend); this.#scope(spend); check(!this.#paused,'PAUSED');
    const state=this.#grants.get(spend.grantId); check(state,'GRANT_UNKNOWN');
    check(!this.#revoked.has(spend.grantId),'REVOKED');
    const g=state.grant, now=this.#time();
    check(BigInt(g.epoch)===this.#epoch,'EPOCH');
    check(now<BigInt(g.expires)&&now<BigInt(spend.deadline),'EXPIRED');
    check(BigInt(spend.deadline)<=BigInt(g.expires),'DEADLINE');
    check(verifySession(bytes,signature,g.sessionKey),'SESSION_SIGNATURE');
    check(BigInt(spend.nonce)===state.nextNonce,'NONCE');
    check(state.nextNonce < (1n<<64n)-1n,'NONCE_EXHAUSTED');
    check(spend.receiver===g.receiver,'RECEIVER');
    const amount=BigInt(spend.amount);
    check(amount<=BigInt(g.perCall),'PER_CALL');
    check(state.spent+amount<=BigInt(g.total),'TOTAL');
    check(amount<=this.#balance,'BALANCE');
    const transferId=digest(bytes);
    // Reserve once before yielding to an external settlement system.
    state.spent+=amount; state.nextNonce++; this.#balance-=amount;
    this.#pending.set(transferId,{amount,receiver:spend.receiver});
    this.#events.push({type:'reserved',transferId,grantId:spend.grantId,amount:spend.amount,receiver:spend.receiver});
    return transferId;
  }
  // Trusted adapter callback in this local model. Rust uses a #[private] callback.
  settle(transferId, success) {
    hex(transferId,32); check(typeof success==='boolean','SETTLEMENT');
    const transfer=this.#pending.get(transferId); check(transfer,'TRANSFER_UNKNOWN');
    this.#pending.delete(transferId);
    if (!success) this.#balance+=transfer.amount;
    // A failed attempt still consumes the nonce and policy budget, deliberately.
    this.#events.push({type:success?'settled':'failed',transferId});
  }
  control(command, signature) {
    const bytes=controlBytes(command); this.#scope(command);
    check(BigInt(command.nonce)===this.#controlNonce,'CONTROL_NONCE');
    check(this.#controlNonce<(1n<<64n)-1n,'NONCE_EXHAUSTED');
    check(verifyOwner(bytes,signature,this.#owner),'OWNER_SIGNATURE');
    if(command.operation==='rotate') { check(this.#epoch<(1n<<64n)-1n,'EPOCH_EXHAUSTED'); p256PublicKey(command.value); }
    this.#controlNonce++;
    if(command.operation==='revoke') this.#revoked.add(command.value);
    if(command.operation==='pause') this.#paused=true;
    if(command.operation==='resume') this.#paused=false;
    if(command.operation==='rotate') { this.#owner=command.value; this.#epoch++; }
    this.#events.push({type:command.operation,epoch:this.#epoch.toString()});
  }
  snapshot() {
    return {mode:'LOCAL SOFTWARE SIMULATION',chain:this.chain,vault:this.vault,epoch:this.#epoch.toString(),
      controlNonce:this.#controlNonce.toString(),paused:this.#paused,available:this.#balance.toString(),
      pending:this.#pending.size,grants:[...this.#grants.entries()].map(([id,s])=>({id,spent:s.spent.toString(),nextNonce:s.nextNonce.toString()})),events:structuredClone(this.#events)};
  }
}
