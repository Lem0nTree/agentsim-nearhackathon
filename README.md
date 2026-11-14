# AgentSIM — NEAR Hackathon

AgentSIM explores owner-authorized, bounded agent spending using a P-256 owner signer and a NEAR vault. Canonical protocol bytes bind grants, spending and control operations. This is research software, not a deployed financial service.

| Component | Evidence and limits |
| --- | --- |
| Protocol and local vault | Automated software tests; settlement is simulated locally. |
| Physical card | Java Card applet and PC/SC adapter are provided; no successful on-card signing has been established for this project. Card capabilities and applet installation require verification. |
| NEAR contract | Source scaffold; compilation, deployment and chain execution are not established. No mainnet funds. |
| Video emulator | jCardSim on a PC, separate under `off-track/video-emulator`; public fixture PIN and ephemeral simulated key. It is not hardware evidence. |

Requires Node.js 22+. `npm test` runs protocol and software tests. `npm run demo` runs the local software scenario. Baseline protocol code, public vectors and tests originate in the earlier AgentSIM research workspace. The submission validator is retained for historical offline validation, not a claim that current rules are unchanged.

`npm run applet:build` requires a compatible Java Card Classic SDK and JDK: set `AGENTSIM_JC_HOME` and optionally `AGENTSIM_JAVA_HOME`. The build creates a CAP in ignored `.build/card`; it does not install anything. Supply application install data as one PIN-length byte followed by 6–16 PIN bytes, inside standard GlobalPlatform install parameters. Secure provisioning, transport and lifecycle management are operator responsibilities; this prototype has not been audited.

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
