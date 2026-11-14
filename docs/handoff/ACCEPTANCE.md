# Acceptance and blocker handling

Run from the repository root. Use the root README for the actual Java/SDK environment and platform-specific setup. Each run should identify UTC time, Git revision or exact source hash, command, environment, expected result, observed result and a sanitized evidence path. Label an unexecuted or skipped check as such.

| Gate | Reproduce | Evidence required to pass |
| --- | --- | --- |
| Protocol and policy | `npm test` and `npm run demo` | Verify imported vectors without regenerating them. Exercise a valid spend, replay, changed recipient, cap, expiry, cumulative budget, revocation and pending callback handling. List suite counts and distinguish form-validation tests. |
| Product applet | `npm run applet:build` | A CAP built from the product source with package/applet AIDs, converted Java Card target, tool versions and SHA-256. Record verifier result separately when available. Review installation parameters, PIN retries, streaming and deselection. |
| Physical connection | Set `AGENTSIM_READER` to the exact reader name and `AGENTSIM_AID` to the expected instance AID, then run `npm run card:inspect` | The actual selected reader responds over PC/SC. Record transport, command stage and status words. If several readers are attached, bind the intended reader explicitly. An earlier live check returned `6A82` for the legacy product instance. |
| Physical ECC | Run the owned diagnostic on the identified card under the authorized scope | Check ownership of probe AIDs and compare registries before/after. The detailed response must report each operation's internal result as well as the APDU status; include positive controls. A failed measurement is valid evidence of the tested configuration. |
| Physical product signing | Follow the device path in `card/` on a provisioned compatible card | Independently verify a grant and revoke signature under a public key fetched from that card. Record redacted evidence. Verify replay and altered message failures, and key continuity after reset where feasible. Operator PIN stays outside logs. |
| Emulator | `npm run offtrack:setup`, `npm run offtrack:test`, `npm run offtrack:demo` | Applet executes in jCardSim, APDU handling and independent public signature checks pass. A recording must open and play as a video. A replay page is separately identified as HTML. |
| NEAR build | In `contracts/agentsim-vault`, build with the pinned SDK/toolchain and a locked dependency graph | Capture the build command and versions, lockfile and WASM hash. Rust source or compilation on the host alone does not demonstrate a deployable artifact. |
| NEAR execution | Execute matching vectors against a local NEAR sandbox and, when authorized, a dedicated testnet account | Check canonical bytes, signature mutations, accepted spend, replay, overspend, revocation, callback access, callback failure and accounting. For a public-network claim record final execution outcomes for the complete receipt chain, balances and fees. |

Validate execution provenance at the API boundary. Card-only execution fails closed when the reader, target applet, key or PIN fails. The fixture PIN stays confined to the emulator path. Card-side ECDSA/SHA-256 hashes message bytes once. Strictly convert DER to P1363 and uncompressed SEC1 to compressed SEC1. The NEAR host receives the already-computed 32-byte digest.

## Device and network blockers

If the selected applet is absent, record the status and investigate capability separately. An unauthenticated platform descriptor may omit the module tag. A supported reader, free EEPROM and a successfully selected card manager establish neither EC-key creation nor successful signing. If the owned diagnostic is authorized for use, verify it against the approved source, check the registry for collisions, use only known working credentials locally, and remove only newly installed diagnostic items. Stop on rejected credentials, unexpected AIDs, or inability to establish ownership. Recheck the resulting inventory after partial failure.

If the contract build fails, retain the first meaningful toolchain/dependency error and continue independent card and protocol gates. If a build works but sandbox execution fails, publish only the build evidence. If public-network testing lacks an authorized account or funds, keep the on-chain gate open. Never send private credentials or unredacted transcripts to reviewers.

## Review cycle

Terra reports changed files, commands, result and evidence. Sol inspects and reruns the affected path. For each blocker, send Astra the failing stage, observed error, expected condition, evidence and smallest next action. Astra chooses a repair or alternative test within scope, then returns the assignment to Terra and the repaired revision to Sol. Infrastructure, unpublished links and owner decisions remain visible even if all code checks pass.
