//! RESEARCH SCAFFOLD: compiled and exercised locally; no public-network deployment.
//! No claim of hardware provenance, KYC, NEP-641 support, or production security.
use near_sdk::{env, near, require, AccountId, Gas, NearToken, PanicOnDefault, Promise};
use near_sdk::store::{LookupMap, LookupSet};
use near_sdk::serde::{Deserialize, Serialize};
use near_sdk::serde_json::{json, Value};

#[derive(Serialize, Deserialize, Clone)]
#[serde(crate = "near_sdk::serde", deny_unknown_fields)]
pub struct Grant {
    pub chain: String, pub vault: String, pub epoch: String, pub agent: String,
    #[serde(rename = "sessionKey")] pub session_key: String,
    #[serde(rename = "perCall")] pub per_call: String,
    pub total: String, pub receiver: String, pub expires: String,
}
#[derive(Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde", deny_unknown_fields)]
pub struct Spend {
    pub chain: String, pub vault: String, pub epoch: String,
    #[serde(rename = "grantId")] pub grant_id: String,
    pub nonce: String, pub receiver: String, pub amount: String, pub deadline: String,
}
#[derive(Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde", deny_unknown_fields)]
pub struct Control {
    pub chain: String, pub vault: String, pub epoch: String, pub nonce: String,
    pub operation: String, pub value: String,
}
#[near(serializers = [borsh])]
struct GrantState { grant: GrantStored, spent: u128, next_nonce: u64 }
// State representation avoids persisting any identity documents or SIM identifiers.
#[near(serializers = [borsh])]
struct GrantStored { epoch: u64, session_key: [u8;32], per_call: u128, total: u128, receiver: AccountId, expires: u64 }

#[near(contract_state)]
#[derive(PanicOnDefault)]
pub struct AgentSimVault {
    owner_key: [u8;33], epoch: u64, control_nonce: u64, paused: bool,
    available: u128, pending_total: u128,
    grants: LookupMap<String, GrantState>, revoked: LookupSet<String>, pending: LookupMap<String,u128>,
}

fn number(s: &str) -> u128 {
    require!(!s.is_empty() && s.len() <= 39 && s.bytes().all(|b|b.is_ascii_digit()), "UINT");
    require!(s == "0" || !s.starts_with('0'), "UINT");
    s.parse().unwrap_or_else(|_|env::panic_str("UINT"))
}
fn u64_number(s: &str) -> u64 { number(s).try_into().unwrap_or_else(|_|env::panic_str("UINT")) }
fn identifier(s: &str) {
    require!(!s.is_empty() && s.len()<=64 && s.as_bytes()[0].is_ascii_alphanumeric(),"ID");
    require!(s.bytes().all(|b|b.is_ascii_lowercase() || b.is_ascii_digit() || b"._-".contains(&b)),"ID");
}
fn bytes<const N:usize>(s:&str)->[u8;N] {
    require!(s.len()==N*2 && s.bytes().all(|b|b.is_ascii_digit()||(b'a'..=b'f').contains(&b)),"HEX");
    hex::decode(s).unwrap().try_into().unwrap()
}
fn message(value:Value)->Vec<u8> { near_sdk::serde_json::to_vec(&value).unwrap() }
fn hash(value:&[u8])->String { hex::encode(env::sha256(value)) }
fn check_key(key:&[u8;33]) { require!(p256::PublicKey::from_sec1_bytes(key).is_ok(),"KEY"); }

#[near]
impl AgentSimVault {
    #[init]
    pub fn new(owner_key:String)->Self {
        require!(env::predecessor_account_id()==env::current_account_id(),"SELF_INIT_ONLY");
        let key=bytes::<33>(&owner_key); check_key(&key);
        Self { owner_key:key,epoch:0,control_nonce:0,paused:false,available:0,pending_total:0,
            grants:LookupMap::new(b"g"),revoked:LookupSet::new(b"r"),pending:LookupMap::new(b"p") }
    }
    // Funding permission belongs to the account operator in this minimal scaffold.
    #[payable]
    pub fn fund(&mut self) {
        require!(env::predecessor_account_id()==env::current_account_id(),"SELF_FUND_ONLY");
        let next=self.available.checked_add(env::attached_deposit().as_yoctonear()).expect("OVERFLOW");
        let backing=next.checked_add(self.pending_total).expect("OVERFLOW");
        let reserve=env::storage_byte_cost().as_yoctonear().checked_mul(env::storage_usage() as u128).expect("OVERFLOW").checked_add(10_000_000_000_000_000_000_000).expect("OVERFLOW");
        require!(backing.checked_add(reserve).expect("OVERFLOW")<=env::account_balance().as_yoctonear(),"FUND_BACKING");
        self.available=next;
    }
    pub fn authorize(&mut self, grant:Grant, signature:String)->String {
        self.scope(&grant.chain,&grant.vault,&grant.epoch);
        identifier(&grant.agent); identifier(&grant.receiver);
        let session_key=bytes::<32>(&grant.session_key);
        let per_call=number(&grant.per_call); let total=number(&grant.total); let expires=u64_number(&grant.expires);
        require!(!self.paused,"PAUSED");require!(per_call>0 && total>=per_call,"LIMIT");
        require!(Self::now()<expires,"EXPIRED");
        let data=message(json!(["AgentSIM",1,"grant",grant.chain,grant.vault,grant.epoch,grant.agent,grant.session_key,grant.per_call,grant.total,grant.receiver,grant.expires]));
        self.owner_signature(&data,&signature);
        let id=hash(&data);
        require!(!self.grants.contains_key(&id) && !self.revoked.contains(&id),"GRANT_EXISTS");
        let receiver:AccountId=grant.receiver.parse().expect("ACCOUNT_ID");
        require!(receiver!=env::current_account_id(),"SELF_RECEIVER");
        self.grants.insert(id.clone(),GrantState{grant:GrantStored{epoch:self.epoch,session_key,per_call,total,receiver,expires},spent:0,next_nonce:0});
        env::log_str(&json!({"event":"agentsim_grant","grant_id":id}).to_string());id
    }
    pub fn execute(&mut self, spend:Spend, signature:String)->Promise {
        self.scope(&spend.chain,&spend.vault,&spend.epoch);
        bytes::<32>(&spend.grant_id);identifier(&spend.receiver);
        let nonce=u64_number(&spend.nonce);let amount=number(&spend.amount);let deadline=u64_number(&spend.deadline);
        require!(amount>0,"AMOUNT");require!(!self.paused,"PAUSED");
        require!(!self.revoked.contains(&spend.grant_id),"REVOKED");
        let state=self.grants.get(&spend.grant_id).expect("GRANT_UNKNOWN");
        require!(state.grant.epoch==self.epoch,"EPOCH");
        require!(Self::now()<deadline && Self::now()<state.grant.expires,"EXPIRED");
        require!(deadline<=state.grant.expires,"DEADLINE");
        require!(spend.receiver==state.grant.receiver.as_str(),"RECEIVER");
        require!(nonce==state.next_nonce,"NONCE");
        require!(amount<=state.grant.per_call,"PER_CALL");
        let next_spent=state.spent.checked_add(amount).expect("OVERFLOW");
        require!(next_spent<=state.grant.total,"TOTAL");require!(amount<=self.available,"BALANCE");
        let data=message(json!(["AgentSIM",1,"spend",spend.chain,spend.vault,spend.epoch,spend.grant_id,spend.nonce,spend.receiver,spend.amount,spend.deadline]));
        require!(env::ed25519_verify(&bytes::<64>(&signature),&data,&state.grant.session_key),"SESSION_SIGNATURE");
        let receiver=state.grant.receiver.clone();let transfer_id=hash(&data);
        let next_nonce=state.next_nonce.checked_add(1).expect("NONCE_EXHAUSTED");
        let state=self.grants.get_mut(&spend.grant_id).unwrap();state.spent=next_spent;state.next_nonce=next_nonce;
        self.available-=amount;self.pending_total=self.pending_total.checked_add(amount).expect("OVERFLOW");self.pending.insert(transfer_id.clone(),amount);
        // Flush cached maps before measuring storage; LookupSet writes directly.
        self.grants.flush();self.pending.flush();
        let storage_floor=env::storage_byte_cost().as_yoctonear().checked_mul(env::storage_usage() as u128).expect("OVERFLOW");
        let reserve=storage_floor.checked_add(10_000_000_000_000_000_000_000).expect("OVERFLOW");
        require!(env::account_balance().as_yoctonear()>=amount.checked_add(reserve).expect("OVERFLOW"),"STORAGE_RESERVE");
        env::log_str(&json!({"event":"agentsim_reserved","transfer_id":transfer_id,"amount":spend.amount}).to_string());
        Promise::new(receiver).transfer(NearToken::from_yoctonear(amount)).then(
            Promise::new(env::current_account_id()).function_call("on_settle",message(json!({"transfer_id":transfer_id})),NearToken::from_yoctonear(0),Gas::from_tgas(15)))
    }
    #[private]
    pub fn on_settle(&mut self,transfer_id:String)->bool {
        require!(env::promise_results_count()==1,"CALLBACK_RESULTS");
        let amount=self.pending.remove(&transfer_id).expect("TRANSFER_UNKNOWN");
        self.pending_total=self.pending_total.checked_sub(amount).expect("PENDING_TOTAL");
        let success=matches!(env::promise_result(0),near_sdk::PromiseResult::Successful(_));
        if !success {self.available=self.available.checked_add(amount).expect("OVERFLOW");}
        // Nonce and policy budget stay consumed even if settlement fails.
        env::log_str(&json!({"event":"agentsim_settled","transfer_id":transfer_id,"success":success}).to_string());success
    }
    pub fn control(&mut self, command:Control, signature:String) {
        self.scope(&command.chain,&command.vault,&command.epoch);
        require!(u64_number(&command.nonce)==self.control_nonce,"CONTROL_NONCE");
        let data=message(json!(["AgentSIM",1,"control",command.chain,command.vault,command.epoch,command.nonce,command.operation,command.value]));
        self.owner_signature(&data,&signature);
        match command.operation.as_str() {
            "revoke"=>{bytes::<32>(&command.value);self.revoked.insert(command.value.clone());},
            "pause"=>{require!(command.value.is_empty(),"VALUE");self.paused=true;},
            "resume"=>{require!(command.value.is_empty(),"VALUE");self.paused=false;},
            "rotate"=>{let key=bytes::<33>(&command.value);check_key(&key);self.owner_key=key;self.epoch=self.epoch.checked_add(1).expect("EPOCH_EXHAUSTED");},
            _=>env::panic_str("OPERATION"),
        }
        self.control_nonce=self.control_nonce.checked_add(1).expect("NONCE_EXHAUSTED");
        env::log_str(&json!({"event":"agentsim_control","operation":command.operation,"epoch":self.epoch.to_string()}).to_string());
    }
    pub fn status(&self)->Value {json!({"epoch":self.epoch.to_string(),"controlNonce":self.control_nonce.to_string(),"paused":self.paused,"available":self.available.to_string()})}
    pub fn grant_status(&self,grant_id:String)->Value {
        let g=self.grants.get(&grant_id).expect("GRANT_UNKNOWN");
        json!({"spent":g.spent.to_string(),"nextNonce":g.next_nonce.to_string(),"revoked":self.revoked.contains(&grant_id),"epoch":g.grant.epoch.to_string()})
    }
}
impl AgentSimVault {
    fn scope(&self,chain:&str,vault:&str,epoch:&str) {
        identifier(chain);identifier(vault);
        require!(chain==env::chain_id() && vault==env::current_account_id().as_str(),"DOMAIN");
        require!(u64_number(epoch)==self.epoch,"EPOCH");
    }
    fn now()->u64 {env::block_timestamp()/1_000_000_000}
    fn owner_signature(&self,data:&[u8],signature:&str) {
        let digest: [u8;32]=env::sha256(data).try_into().unwrap();
        require!(env::p256_verify(&bytes::<64>(signature),&digest,&self.owner_key),"OWNER_SIGNATURE");
    }
}

