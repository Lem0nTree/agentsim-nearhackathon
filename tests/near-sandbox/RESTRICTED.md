# Restricted relayer and proposal demo

The demo creates new accounts on a disposable local NEAR sandbox. The setup operator controls the sandbox validator and a separate vault administration key. A fresh relayer account is created with **one** Ed25519 FunctionCall access key: receiver is the newly deployed vault, method allowlist is only `execute`, allowance is finite, and deposits must be zero. The relayer signer receives only that key. The demo process still retains setup/operator authority; this is not process isolation or an immutable contract.

The owner grant and revocation are P-256 signatures. For the reproducible simulator path, the product applet runs in jCardSim on the PC; set `AGENTSIM_OWNER_BACKEND=simulator` explicitly. `AGENTSIM_OWNER_BACKEND=pcsc` selects a physical SIM instead. A separate Ed25519 agent signs the spend. The model or fixture proposes only two strings, `amount` and `receiver`; trusted code supplies and checks chain, vault, grant, epoch, nonce, recipient policy, limits and deadline. The model is never given signing keys. The function-call key's allowance pays transaction fees and is distinct from the agent grant's spending budget and nonce.

The stored [fixture proof](../../evidence/near/2026-11-14-restricted-relayer.json) records actual sandbox broadcasts, node responses and receipts. It includes signed setup actions, the installed key and its on-chain permissions, and four **protocol-layer** rejections: wrong method, wrong receiver, nonzero deposit, and transfer action. The positive spend produces a transfer receipt and successful callback with receiver balance reconciliation. Separate **contract-layer** rejections cover overspending and post-revocation spending; they consume relayer nonce and gas while the grant state is unchanged. This fixture proof is local test money with a simulator signer, not a public transaction. The [November 15 live proof](../../evidence/near/2026-11-15-live-near-ai.json) records the same flow signed on the physical SIM over PC/SC, with the applet AID and the pinned owner key stored beside the grant.

## Run locally

Prerequisites and the pinned sandbox 2.14.0 download are in [the sandbox guide](README.md). From the repository root, run `npm run card-sim:setup` and `npm ci --prefix tests/near-sandbox`. Ensure ports 3030 and 24568 are unused. For a fresh, dedicated sandbox, in Linux or WSL:

```sh
near-sandbox --home ".build/relay-sandbox-home" init --chain-id agentsim-local --account-id test.near --fast
python3 tests/near-sandbox/prepare-restricted.py
near-sandbox --home ".build/relay-sandbox-home" validate-config
near-sandbox --home ".build/relay-sandbox-home" run --rpc-addr 127.0.0.1:3030 --network-addr 127.0.0.1:24568
```

The helper disables STUN, telemetry and outbound peer discovery and sets a local owner marker. Keep that process running. In another terminal from the same checkout, with Node 22 and `AGENTSIM_JAVA_HOME` set when needed, run:

```sh
export AGENTSIM_OWNER_BACKEND=simulator
npm run demo:restricted -- fixture
node tests/near-sandbox/verify-restricted.mjs evidence/near/2026-11-14-restricted-relayer.json
node --test tests/near-sandbox/verify-restricted.test.mjs
```

In PowerShell, use `$env:AGENTSIM_OWNER_BACKEND = 'simulator'` in place of the `export` line.

Each run creates new local accounts and writes its proof under a unique ignored `.build/restricted-relayer/<run-id>/evidence.json`. Pass the resulting path to `verify-restricted.mjs` to verify that run. Check both its sandbox identity and the local process before stopping it; do not stop unrelated instances. When running Node on Windows and the sandbox in WSL, run each command in the corresponding environment from the same checkout. Quote any checkout path containing spaces.

For **explicit live mode**, configure `NEAR_AI_API_KEY` privately and run `npm run demo:restricted -- live`; optionally set `NEAR_AI_MODEL`. Node 22 can load a private file without printing it, for example:

```powershell
node --env-file=".local/near-ai.env" tests/near-sandbox/restricted-relayer.mjs live
```

The CLI captures the provider credential in its own process and removes it from the environment before starting child Java tools; it passes the value only to the provider request. The key remains in the Node process memory while needed. The fixed endpoint is `https://cloud-api.near.ai/v1/chat/completions` ([NEAR AI quickstart](https://docs.near.ai/cloud/quickstart)); redirects are refused. The default requested model is `z-ai/glm-5.3-flash`; the response model must match. Only a successful, single assistant answer containing the exact two-field JSON proposal is accepted. Request and response are bounded, timeout and provider errors fail closed, and live mode never falls back to the fixture. An earlier live attempt reported HTTP 402. A later [live proof](../../evidence/near/2026-11-14-live-near-ai.json) records a validated response and local transfer. Provider attestation is not verified. No request is retried automatically. The proof records only the validated proposal, minimal provider metadata and hashes; it does not verify NEAR AI attestation or response origin.

The [live replay](../../submission/video/agentsim-live-demo.mp4) uses the recorded live proposal and local NEAR results. See the [release guide](../../submission/RELEASE.md) for reproduction.

The November 15 payment record was signed on the physical SIM over PC/SC and stores the applet AID and the pinned owner key. Verification checks signatures and sandbox results; PC/SC provides no device attestation. [Details](../../docs/VERIFICATION.md). The November 14 fixture and replay described above remain simulator records.

## Physical owner over PC/SC

The default owner remains the PC Java Card simulator. To select a physical card explicitly, set the following variables in the same interactive terminal before running the existing `fixture` or `live` command:

```powershell
$env:AGENTSIM_OWNER_BACKEND = 'pcsc'
$env:AGENTSIM_READER = 'Exact reader name'
$env:AGENTSIM_AID = 'Expected applet AID in hexadecimal'
$env:AGENTSIM_OWNER_PUBLIC_KEY = 'Independently trusted compressed P-256 public key in lowercase hex'
npm run demo:restricted -- fixture
```

The reader and AID must match exactly. Obtain and verify the expected public key independently; the program will not trust an unknown key fetched from the same card. The PIN is prompted on a TTY without echo, kept in a transient process buffer and cleared on close. Never put the PIN in a command argument, environment variable, log or source file. The CLI uses the PIN for the owner grant and revocation, checks the returned key against the pinned key each time and independently verifies both P-256 signatures. Missing configuration, reader, AID, PIN, unexpected key or card failure stops the run; the physical profile never falls back to the simulator.

The output records operator-selected PC/SC provenance and the pinned public key, but signatures do not independently attest the device, installed applet or source. In physical mode the simulator dependency and local applet-source hashes are null: this software cannot infer which applet binary is installed. Historical simulator records retain their original hashes and remain verifiable. The [November 15 live proof](../../evidence/near/2026-11-15-live-near-ai.json) was produced in this profile; its scope, AID, pinned key and null simulator hashes identify the hardware capture. The AI proposal, agent Ed25519 key, restricted relay and local NEAR scope are unchanged. Physical execution requires a compatible applet provisioned by an authorized card manager; this guide does not install or provision one. The phone approval interface and actual compute delivery are not demonstrated.

The public-key and sign-init commands have no incoming data. The PC/SC bridge rejects data-bearing forms before transmission. Direct APDU clients must obey that contract: under T=0 the header byte can represent either an expected response length or incoming data length, so an applet cannot reliably distinguish every malformed no-data command from its header alone. The strict case-2 regression uses a test API that throws if these commands try to receive input; it is not hardware evidence.
