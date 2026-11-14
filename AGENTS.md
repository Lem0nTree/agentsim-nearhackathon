# AgentSIM — instructions for coding agents

AgentSIM is a working reference for SIM-secured agent spending. The owner holds a PIN-gated P-256 key on a card and signs a budget; a separate Ed25519 agent key can only spend inside that signed recipient, per-call limit, total and expiry. A Rust NEAR vault enforces it.

The November 15 payment record is the **physical capture**, signed over PC/SC. The applet source is the same one compiled into jCardSim for local runs.

## Run

```sh
npm ci --prefix tests/near-sandbox
npm test
node tests/near-sandbox/verify-restricted.mjs evidence/near/2026-11-15-live-near-ai.json
node tests/near-sandbox/verify.mjs evidence/near/2026-11-14-local-sandbox.json
```

## Expected output

- `npm test` → `# pass 48`
- `verify-restricted` → `Verified restricted key setup, signed messages/actions, recorded node rejection codes, local receipts and policy states.`
- `verify` → `Verified signed local actions, owner and agent signatures, recorded receipt outcomes and receiver delta.`

Applet suite (needs JDK 17+ or `AGENTSIM_JAVA_HOME`; skip if `javac` is absent):

```sh
npm run card-sim:setup
npm run card-sim:test
```
→ `Product applet simulator compiled from card/applet source.` then `# pass 21`. Without a JDK, setup stops with `JDK_REQUIRED`. This is the only jCardSim path; the recorded run did not use it.

## Proof map

- `evidence/near/2026-11-15-live-near-ai.json` — physical capture. `roles.owner.source` is `Physical SIM`; the object also carries `expectedAID`, `pinnedPublicKey`, `transport`, `keyCheck`, `signatureEncoding`, and no simulator hashes.
- `evidence/near/2026-11-14-live-near-ai.json` — emulator control. Same schema, `source` is `product applet in jCardSim`, both simulator hashes present.
- `tests/near-sandbox/verify-restricted.mjs` — re-derives every signature; the physical branch asserts the transport, AID and pinned key.
- `docs/VERIFICATION.md` — canonical claim, mechanism and limits.

## Scope limits

- Local NEAR sandbox, test funds, no public-chain settlement, no compute delivered.
- PC/SC does not attest the reader, the installed applet build or the card identity.
- Provider response origin is not attested.
- The phone approval screen and provisioning are not shipped.

## Do not claim

No public-chain transaction, no real funds, no TEE/attestation, no telco partnership, no audited production contract, no shipped phone app. The contract operator keeps admin authority.

