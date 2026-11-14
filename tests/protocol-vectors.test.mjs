import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { controlBytes, digest, grantBytes, spendBytes, verifyOwner, verifySession } from '../src/protocol.mjs';

test('preserved public protocol vectors retain canonical bytes, digest and signatures', () => {
  const vectors = JSON.parse(readFileSync(new URL('../artifacts/protocol-vectors.json', import.meta.url), 'utf8'));
  const grant = grantBytes(vectors.grant), spend = spendBytes(vectors.spend), control = controlBytes(vectors.control);
  assert.equal(grant.toString(), vectors.grantBytes);
  assert.equal(spend.toString(), vectors.spendBytes);
  assert.equal(control.toString(), vectors.controlBytes);
  assert.equal(digest(grant), vectors.grantSha256);
  assert.equal(vectors.spend.grantId, vectors.grantSha256);
  assert.equal(verifyOwner(grant, vectors.grantSignature, vectors.ownerKey), true);
  assert.equal(verifySession(spend, vectors.spendSignature, vectors.grant.sessionKey), true);
  assert.equal(verifyOwner(control, vectors.controlSignature, vectors.ownerKey), true);
  assert.equal(verifyOwner(grantBytes({ ...vectors.grant, agent:'changed' }), vectors.grantSignature, vectors.ownerKey), false);
  assert.equal(verifySession(spendBytes({ ...vectors.spend, nonce:'1' }), vectors.spendSignature, vectors.grant.sessionKey), false);
  assert.equal(verifyOwner(controlBytes({ ...vectors.control, nonce:'1' }), vectors.controlSignature, vectors.ownerKey), false);
});
