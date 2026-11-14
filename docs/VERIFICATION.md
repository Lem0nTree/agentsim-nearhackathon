# Implementation and verification

The project owner confirmed on November 14, 2026: “signing on the physical SIM”. This is an owner report. Independent verification was not supplied, and this is the confirmation date rather than a stated test date. [Owner confirmation](../evidence/hardware/2026-11-14-owner-confirmation.json)

A separate controlled diagnostic on November 14 found native ECC unavailable on the tested card; it did not demonstrate a product signature. The two reports do not establish whether the same card was involved. [Diagnostic record](../evidence/hardware/2026-11-14-native-ecc-retest.json)

The local NEAR flow used a fixture rather than a live model completion. An authenticated NEAR AI request returned HTTP 402 with no completion. The phone approval interface and authorized provisioning/access have not been demonstrated. The local operator retains contract administrative authority, and no public-chain deployment is recorded. The PC simulator and local network results below identify their execution environments.

## Restricted relayer and proposals

Run `npm run demo:restricted -- fixture` after starting the dedicated local sandbox as described in the [restricted relayer guide](../tests/near-sandbox/RESTRICTED.md). The fixture proposes an amount and recipient; trusted code enforces the grant and uses a separate execute-only, finite-allowance relayer key. The [local proof](../evidence/near/2026-11-14-restricted-relayer.json) records a 0.001 sandbox NEAR transfer and callback, four node-level permission denials, and contract denials for overspending and a post-revocation spend. The [24-second replay](../off-track/video-emulator/agentsim-restricted-relayer.mp4) uses that fixture-based run.

| Component | Evidence and limits |
| --- | --- |
| Protocol and local vault | Software tests and an actual transfer on a private local NEAR sandbox, using test funds. |
| Physical card | On November 14 a controlled diagnostic on the connected card returned `NO_SUCH_ALGORITHM` for all 14 tested ECC cases. The owned probe was removed; inventory matched baseline and free persistent memory returned to 44,864 bytes. This diagnostic did not demonstrate a product applet or physical product signature. See the [physical evidence](../evidence/hardware/2026-11-14-native-ecc-retest.json) and [recovery record](../docs/handoff/CARD-RECOVERY.md). |
| NEAR contract | Built and tested on a private local NEAR sandbox: signed authorization, agent spend, transfer receipt and revocation. No public-network deployment or real funds. See [sandbox evidence](../evidence/near/2026-11-14-local-sandbox.json). |
| AI proposal | The local payment flow uses a fixture. Live NEAR AI returned HTTP 402; no live completion is claimed. |
| Video emulator | jCardSim on a PC, separate under `off-track/video-emulator`; public fixture PIN and ephemeral simulated key. It is not hardware evidence. |

Requires Node.js 22+. `npm test` runs protocol and software tests. `npm run demo` runs the local software scenario. Baseline protocol code, public vectors and tests originate in the earlier AgentSIM research workspace. The submission validator is retained for historical offline validation, not a claim that current rules are unchanged.

`npm run applet:build` requires a compatible Java Card Classic SDK and JDK: set `AGENTSIM_JC_HOME` and optionally `AGENTSIM_JAVA_HOME`. The build creates a CAP in ignored `.build/card`; it does not install anything. Supply application install data as one PIN-length byte followed by 6–16 PIN bytes, inside standard GlobalPlatform install parameters. Secure provisioning, transport and lifecycle management are operator responsibilities; this prototype has not been audited.

For the command table, per-signature PIN flow and dated CAP build hashes, see the [Java Card applet reference](../card/applet/README.md).

For read-only inspection, set `AGENTSIM_READER` to the exact PC/SC reader name and `AGENTSIM_AID` to the expected applet AID in hexadecimal (the build uses `F0414753494D0701`), then run `npm run card:inspect`. It selects only that applet and reads its public key; missing reader, SELECT failure, card status and transport errors are surfaced. It never installs, signs, tries a PIN or substitutes an emulator. The host adapter accepts a PIN at runtime through its `sign` API; keep PINs out of logs and source. No private-key export command exists.

For the video-only emulator, run `npm run offtrack:setup`, `npm run offtrack:test`, and `npm run offtrack:demo`. Setup downloads pinned `com.klinec:jcardsim:3.0.5.0` from Maven Central and checks SHA-256 `5587d55f63d0364ed4da93404595071ad56f09833ded91d7addfd860341bee6b`. It builds an isolated demo applet with public PIN `123456`; never provision that PIN to a physical card. Simulator output is not card or NEAR network proof.

See `contracts/agentsim-vault/README.md` for contract limitations and `evidence/` for observations. No claim of SIM origin, secure user presence, legal identity, telco partnership, or deployed settlement follows from a signature.

PowerShell inspection example (use the exact reader name shown by your PC/SC reader tools):

```powershell
$env:AGENTSIM_READER = 'Exact reader name'
$env:AGENTSIM_AID = 'F0414753494D0701'
npm run card:inspect
```

`card:inspect` reads these environment variables; it does not accept reader or AID flags. The off-track integration tests compile the actual `card/applet` source and exercise install PIN boundaries, PIN authorization, multiple short signing APDUs, independent signature verification, reset, and deselection in jCardSim. Multiple short APDUs are distinct from transport fragmentation of one APDU: the latter remains unverified. Neither emulator results nor CAP conversion establish physical-card capability.


The offline payment example is `npm run offtrack:setup` then `npm run offtrack:demo`. It compiles the real product applet for jCardSim, verifies a P-256 owner grant and revocation and an Ed25519 agent spend, and checks the revoked rejection. The accepted spend is a local test-credit reservation only: there is no settlement or NEAR transaction. Run `node off-track/video-emulator/scripts/verify-evidence.mjs` to independently verify the output. `python off-track/video-emulator/scripts/render-video.py` generates a short, silent video in the ignored output directory with FFmpeg; see the off-track README.

The [sandbox integration](../tests/near-sandbox/README.md) separately exercises the Rust vault and actual local transfer and callback receipts. The [short sandbox video](../off-track/video-emulator/agentsim-sandbox-demo.mp4) is a replay of that recorded local run; the signer remains a PC simulator. No outer transaction was sent to a public NEAR network.

