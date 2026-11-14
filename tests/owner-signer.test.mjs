import test from 'node:test';
import assert from 'node:assert/strict';
import { createOwnerSigner, CURRENT_CARD_PROFILE } from '../src/owner-signer.mjs';
import { controlBytes, grantBytes, softwareAgent, spendBytes, verifyOwner } from '../src/protocol.mjs';
import { LocalVault } from '../src/vault.mjs';
import { runDemo } from '../src/demo.mjs';

function fixture() {
  const owner = createOwnerSigner({ backend: 'software' });
  const agent = softwareAgent();
  const grant = { chain:'local', vault:'agentsim.local', epoch:'0', agent:'demo', sessionKey:agent.publicKey,
    perCall:'100', total:'150', receiver:'compute.local', expires:'1600' };
  const vault = new LocalVault({ ownerKey:owner.publicKey, now:()=>1000 });
  const command = { chain:grant.chain, vault:grant.vault, epoch:'0', nonce:'0', operation:'pause', value:'' };
  return { owner, agent, grant, vault, command };
}

test('explicit software adapter signs existing canonical grant bytes and permits bounded spend', async () => {
  const { owner, agent, grant, vault } = fixture();
  const signature = await owner.signGrant(grant);
  assert.equal(signature.length, 128);
  assert.equal(verifyOwner(grantBytes(grant), signature, owner.publicKey), true);
  const grantId = vault.authorize(grant, signature);
  const spend = { chain:grant.chain, vault:grant.vault, epoch:'0', grantId, nonce:'0',
    receiver:grant.receiver, amount:'90', deadline:'1500' };
  vault.settle(vault.execute(spend, agent.sign(spendBytes(spend))), true);
  assert.equal(vault.snapshot().available, '910');
  assert.equal(owner.kind, 'software-p256');
  assert.equal(owner.hardwareProvenance, 'unverified');
  assert.equal(Object.isFrozen(owner), true);
});

test('control signing preserves owner authority and message separation', async () => {
  const { owner, grant, command, vault } = fixture();
  const signature = await owner.signControl(command);
  assert.equal(verifyOwner(controlBytes(command), signature, owner.publicKey), true);
  assert.equal(verifyOwner(grantBytes(grant), signature, owner.publicKey), false);
  vault.control(command, signature);
  assert.equal(vault.snapshot().paused, true);
  assert.throws(() => vault.control(command, signature), error => error.code === 'CONTROL_NONCE');
});

test('editing a grant during async signing cannot change the authorized policy', async () => {
  const { owner, grant, vault } = fixture();
  const original = structuredClone(grant);
  const pending = owner.signGrant(grant);
  grant.perCall = '150';
  const signature = await pending;
  assert.throws(() => vault.authorize(grant, signature), error => error.code === 'OWNER_SIGNATURE');
  assert.equal(vault.snapshot().grants.length, 0);
  vault.authorize(original, signature);
});

test('grant and control schemas reject unexpected fields before signing', () => {
  const { owner, grant, command } = fixture();
  assert.throws(() => owner.signGrant({ ...grant, hardware:true }), error => error.code === 'SCHEMA');
  assert.throws(() => owner.signControl({ ...command, operation:'spend' }), error => error.code === 'OPERATION');
  assert.throws(() => owner.signGrant(command), error => error.code === 'SCHEMA');
  assert.throws(() => owner.signControl(grant), error => error.code === 'SCHEMA');
});

test('current card and unknown backends fail closed without a software fallback', () => {
  assert.throws(() => createOwnerSigner({ backend:'current-card' }), error => error.code === 'OWNER_SIGNER_UNSUPPORTED');
  for (const options of [undefined, {}, { backend:'future-hardware' }]) {
    assert.throws(() => createOwnerSigner(options), error => error.code === 'OWNER_BACKEND');
  }
  assert.equal(Object.isFrozen(CURRENT_CARD_PROFILE), true);
  assert.equal(CURRENT_CARD_PROFILE.eccRetestedAfterCleanup, true);
});

test('adapter-backed demo completes the expected authorization and rejection journey', async () => {
  const result = await runDemo();
  assert.deepEqual(result.outcomes.map(outcome => outcome.result), ['accepted','settled','rejected','rejected','rejected','rejected']);
  assert.deepEqual(result.outcomes.filter(outcome => outcome.code).map(outcome => outcome.code), ['NONCE','PER_CALL','RECEIVER','REVOKED']);
  assert.equal(result.state.available, '910');
  assert.equal(result.state.pending, 0);
});
