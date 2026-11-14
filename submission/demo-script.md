# Demo script

## Current local demo, approximately 3 minutes

**0:00–0:25 — Problem.** “AI agents need limited authority. AgentSIM lets an owner approve an agent's recipient, budget and expiry. Our longer-term distribution thesis uses capable secure elements already present in mobile deployments.”

**0:25–0:40 — Disclosure, visible and spoken.** “This run uses software P-256 signing and a local simulated vault. It does not use a physical SIM, JCOP card, deployed NEAR contract, live funds or LLM.” Keep that text visible in the recording.

**0:40–1:00 — Policy.** Show `src/demo.mjs`: approved recipient `compute.local`, cap 100 test units per call, 150 total, a short expiry and a separate agent key. Explain that these units are not currency.

**1:00–1:35 — Run.** Execute `npm run demo`. Show accepted owner delegation and successful simulated spending of 90 units. Show replay, 101-unit overspend, substituted recipient and post-revocation requests rejected with explicit reasons.

**1:35–2:00 — Verify.** Execute `npm test`. Explain that signatures are real and the ledger/settlement are simulated. Test coverage does not establish hardware or on-chain correctness.

**2:00–2:30 — NEAR role.** Show the vault architecture and Rust source. “The contract scaffold uses native P-256 owner verification, agent signatures and native NEAR transfer promises. Public RPC config reports the feature enabled; our contract still needs compilation and testnet execution.”

**2:30–3:00 — Adoption and next proof.** “GSMA reports billions of wireless connections. This gives a distribution context, not a compatible-device count. We start with controlled hardware and managed fleets, then validate provisioning partnerships.” End with build/testnet and actual hardware gates.

## Testnet extension after implementation

Replace the simulation segment only after passing sandbox checks. Show actual vault/recipient accounts, grant policy, a successful transfer and final promise receipt. Show rejected replay, overspend and post-revocation calls. Reconcile recipient balance and distinguish gas from transferred amount. Keep software signer disclosure if no hardware is used. Record actual transaction hashes in a new evidence file. Never fill that file with invented examples.

## Hardware extension after actual access

Show card/reader/model and sanitized applet selection/generation/sign traces. Bind its public key to the demonstrated grant and verify the signature independently. Keep claims limited to the measured card and workflow. Explain whether hardware origin is based on a controlled lab record or a verified attestation chain.

## Unpublished X draft

Before the event: “AgentSIM preparation: a software prototype for bounded AI agent spending, with a NEAR vault scaffold and a SIM integration research plan. Local demo uses software keys and simulated settlement. No SIM/JCOP execution or deployed contract is claimed.”

During/after eligible in-event work: write a fresh post naming NEAR HACKATHON, the exact work completed and the actual demonstration mode. Attach the real demo video or screenshots. Do not use “built at NEAR HACKATHON” for the October baseline unless organizers confirm the entry and the statement accurately describes the in-event work.
