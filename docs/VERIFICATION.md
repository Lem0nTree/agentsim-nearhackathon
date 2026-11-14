# Implementation and verification

## Physical SIM signing

The November 15 payment is the physical capture. The runner selected the SIM through PC/SC, pinned the owner's P-256 key read from the card before signing, and verified both signatures against it. The record stores the transport, the applet AID, the pinned key, the key check and the signature encoding. [Payment record](../evidence/near/2026-11-15-live-near-ai.json) · [Signing capture](../evidence/hardware/2026-11-14-physical-sim-p256.json) · [Test setup photo](../evidence/hardware/2026-11-14-physical-sim.jpg)

The applet hashes the grant or revocation bytes once with SHA-256 and signs with ECDSA on the card; the private key does not leave it. In our live hardware test the physical SIM supported P-256 ECC and signed with ECDSA. The [November 14 record](../evidence/near/2026-11-14-live-near-ai.json) is the emulator control: same flow, jCardSim signer, simulator hashes retained.

**Limits**

- Local sandbox only; no public-chain settlement and no real funds.
- PC/SC does not attest the reader, the installed applet build or the card identity.
- The phone approval screen and authorized provisioning are not shipped.

An earlier NEAR AI request returned HTTP 402 with no completion. A later live NEAR AI response supplied a validated payment proposal for the recorded local NEAR flow. The proof does not independently attest provider origin. The live driver recorded final outcomes and receipts. A later independent RPC check matched the final key permissions, deployed code, grant state and recipient balance, while transaction history queries returned UNKNOWN_TRANSACTION. The local operator retains contract administrative authority, and no public-chain deployment is recorded.

## Restricted relayer and proposals

Run `npm run demo:restricted -- fixture` after starting the dedicated local sandbox as described in the [restricted relayer guide](../tests/near-sandbox/RESTRICTED.md). The fixture proposes an amount and recipient; trusted code enforces the grant and uses a separate execute-only, finite-allowance relayer key. The [local proof](../evidence/near/2026-11-14-restricted-relayer.json) records a 0.001 sandbox NEAR transfer and callback, four node-level permission denials, and contract denials for overspending and a post-revocation spend.

| Component | Evidence and limits |
| --- | --- |
| Protocol and local vault | Software tests and an actual transfer on a private local NEAR sandbox, using test funds. |
| Card compatibility probe | A separate November 14 diagnostic returned `NO_SUCH_ALGORITHM` for 14 native ECC operations on the card it probed. The registry matched its baseline after cleanup. [Diagnostic results](../evidence/hardware/2026-11-14-native-ecc-retest.json) · [Recovery record](handoff/CARD-RECOVERY.md) |
| NEAR contract | Built and tested on a private local NEAR sandbox: signed authorization, agent spend, transfer receipt and revocation. No public-network deployment or real funds. See [sandbox evidence](../evidence/near/2026-11-14-local-sandbox.json). |
| AI proposal | Two successful NEAR AI Cloud calls each produced a 0.001 test NEAR payment. The November 15 trace signed the owner grant and revocation on the physical SIM and records its transport, AID and pinned key; the November 14 trace is the emulator control. Both traces include the response, signed transactions, transfer callback and revocation. [November 14 receipts](../evidence/near/2026-11-14-live-near-ai.json) · [November 15 receipts](../evidence/near/2026-11-15-live-near-ai.json) |
| Product applet tests | jCardSim on a PC with a public fixture PIN and ephemeral simulated key. It is not hardware evidence. |

Requires Node.js 22+. `npm test` runs protocol and software tests. `npm run demo` runs the local software scenario. Baseline protocol code, public vectors and tests originate in the earlier AgentSIM research workspace. The submission validator is retained for historical offline validation, not a claim that current rules are unchanged.

`npm run applet:build` requires a compatible Java Card Classic SDK and JDK: set `AGENTSIM_JC_HOME` and optionally `AGENTSIM_JAVA_HOME`. The build creates a CAP in ignored `.build/card`; it does not install anything. Supply application install data as one PIN-length byte followed by 6–16 PIN bytes, inside standard GlobalPlatform install parameters. Secure provisioning, transport and lifecycle management are operator responsibilities; this prototype has not been audited.

For the command table, per-signature PIN flow and dated CAP build hashes, see the [Java Card applet reference](../card/applet/README.md).

For read-only inspection, set `AGENTSIM_READER` to the exact PC/SC reader name and `AGENTSIM_AID` to the expected applet AID in hexadecimal (the build uses `F0414753494D0701`), then run `npm run card:inspect`. It selects only that applet and reads its public key; missing reader, SELECT failure, card status and transport errors are surfaced. It never installs, signs, tries a PIN or substitutes an emulator. The host adapter accepts a PIN at runtime through its `sign` API; keep PINs out of logs and source. No private-key export command exists.

For public product applet tests, run `npm run card-sim:setup` and `npm run card-sim:test`. See the [PC test guide](../tests/java-card/README.md) for the pinned simulator dependency, fixture PIN, source and scope.

See `contracts/agentsim-vault/README.md` for contract limitations and `evidence/` for observations. No claim of SIM origin, secure user presence, legal identity, telco partnership, or deployed settlement follows from a signature.

PowerShell inspection example (use the exact reader name shown by your PC/SC reader tools):

```powershell
$env:AGENTSIM_READER = 'Exact reader name'
$env:AGENTSIM_AID = 'F0414753494D0701'
npm run card:inspect
```

`card:inspect` reads these environment variables; it does not accept reader or AID flags. The off-track integration tests compile the actual `card/applet` source and exercise install PIN boundaries, PIN authorization, multiple short signing APDUs, independent signature verification, reset, and deselection in jCardSim. Multiple short APDUs are distinct from transport fragmentation of one APDU: the latter remains unverified. Neither emulator results nor CAP conversion establish physical-card capability.


The product applet tests independently verify P-256 owner grant and revocation signatures and a separate Ed25519 agent spend against the local policy model. The accepted local policy reservation uses test credits and is not a NEAR transaction.

The [sandbox integration](../tests/near-sandbox/README.md) separately exercises the Rust vault and actual local transfer and callback receipts. The November 14 record is the emulator control; the [November 15 live record](../evidence/near/2026-11-15-live-near-ai.json) records the physical SIM over PC/SC. No outer transaction was sent to a public NEAR network, and the payment example does not deliver compute.

`node tests/near-sandbox/verify-restricted.mjs <record>` checks a record. For a physical record it additionally asserts the PC/SC scope, the applet AID and the pinned key before rechecking every signature.

