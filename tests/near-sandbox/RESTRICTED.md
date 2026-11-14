# Restricted relayer and proposal demo

The demo creates new accounts on a disposable local NEAR sandbox. The setup operator controls the sandbox validator and a separate vault administration key. A fresh relayer account is created with **one** Ed25519 FunctionCall access key: receiver is the newly deployed vault, method allowlist is only `execute`, allowance is finite, and deposits must be zero. The relayer signer receives only that key. The demo process still retains setup/operator authority; this is not process isolation or an immutable contract.

The product Java Card applet runs in jCardSim on the PC and signs the P-256 owner grant and revocation. A separate Ed25519 agent signs the spend. The model or fixture proposes only two strings, `amount` and `receiver`; trusted code supplies and checks chain, vault, grant, epoch, nonce, recipient policy, limits and deadline. The model is never given signing keys. The function-call key's allowance pays transaction fees and is distinct from the agent grant's spending budget and nonce.

The stored [fixture proof](../../evidence/near/2026-11-14-restricted-relayer.json) records actual sandbox broadcasts, node responses and receipts. It includes signed setup actions, the installed key and its on-chain permissions, and four **protocol-layer** rejections: wrong method, wrong receiver, nonzero deposit, and transfer action. The positive spend produces a transfer receipt and successful callback with receiver balance reconciliation. Separate **contract-layer** rejections cover overspending and post-revocation spending; they consume relayer nonce and gas while the grant state is unchanged. This is local test money, not a public transaction or physical card signature.

## Run locally

Prerequisites and the pinned sandbox 2.14.0 download are in [the sandbox guide](README.md). From the repository root, run `npm run offtrack:setup` and `npm ci --prefix tests/near-sandbox`. Ensure ports 3030 and 24568 are unused. For a fresh, dedicated sandbox, in Linux or WSL:

```sh
near-sandbox --home ".build/relay-sandbox-home" init --chain-id agentsim-local --account-id test.near --fast
python3 tests/near-sandbox/prepare-restricted.py
near-sandbox --home ".build/relay-sandbox-home" validate-config
near-sandbox --home ".build/relay-sandbox-home" run --rpc-addr 127.0.0.1:3030 --network-addr 127.0.0.1:24568
```

The helper disables STUN, telemetry and outbound peer discovery and sets a local owner marker. Keep that process running. In another terminal from the same checkout, with Node 22 and `AGENTSIM_JAVA_HOME` set when needed, run:

```sh
npm run demo:restricted -- fixture
node tests/near-sandbox/verify-restricted.mjs evidence/near/2026-11-14-restricted-relayer.json
node --test tests/near-sandbox/verify-restricted.test.mjs
```

Each run creates new local accounts and writes its proof under a unique ignored `.build/restricted-relayer/<run-id>/evidence.json`. Pass the resulting path to `verify-restricted.mjs` to verify that run. Check both its sandbox identity and the local process before stopping it; do not stop unrelated instances. When running Node on Windows and the sandbox in WSL, run each command in the corresponding environment from the same checkout. Quote any checkout path containing spaces.

For **explicit live mode**, configure `NEAR_AI_API_KEY` privately and run `npm run demo:restricted -- live`; optionally set `NEAR_AI_MODEL`. Node 22 can load a private file without printing it, for example:

```powershell
node --env-file=".local/near-ai.env" tests/near-sandbox/restricted-relayer.mjs live
```

The CLI captures the provider credential in its own process and removes it from the environment before starting child Java tools; it passes the value only to the provider request. The key remains in the Node process memory while needed. The fixed endpoint is `https://cloud-api.near.ai/v1/chat/completions` ([NEAR AI quickstart](https://docs.near.ai/cloud/quickstart)); redirects are refused. The default requested model is `z-ai/glm-5.3-flash`; the response model must match. Only a successful, single assistant answer containing the exact two-field JSON proposal is accepted. Request and response are bounded, timeout and provider errors fail closed, and live mode never falls back to the fixture. An earlier live attempt reported HTTP 402. A later [live proof](../../evidence/near/2026-11-14-live-near-ai.json) records a validated response and local transfer. Provider attestation is not verified. No request is retried automatically. The proof records only the validated proposal, minimal provider metadata and hashes; it does not verify NEAR AI attestation or response origin.

The checked-in [24-second replay](../../off-track/video-emulator/agentsim-restricted-relayer.mp4) is generated from the verified fixture proof. It is a replay of recorded local results, not a live inference recording. Run `python off-track/video-emulator/scripts/render-restricted-video.py` to regenerate it with FFmpeg.
