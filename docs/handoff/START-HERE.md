# AgentSIM engineering handoff

Start at the [product README](../../README.md) for the runnable entry points. AgentSIM lets an owner authorize a limited spending capability for an agent and revoke it. The owner signs grants and controls with P-256. The agent signs each spend with Ed25519. The vault checks chain, vault, epoch, recipient, amount, expiry and nonce before reserving the allowance.

Current record: the physical SIM signed the owner authorization for the November 15 sandbox payment, and the record stores its PC/SC scope, applet AID and pinned key. Verification checks the signatures and payment results; PC/SC provides no device attestation. See [current verification](../VERIFICATION.md). The November 14 diagnostic below remains a separate historical observation.

## Resume this build

1. Inspect the current refs in [Branch handoff](BRANCHES.md) and read the [history of the old workspace](FINDINGS.md). Dated hashes are in the [source index](baseline-source-sha256.tsv).
2. Use the [Codex launcher](../../harness/launch.md) to start Astra. Assign Terra one outcome with the applicable [acceptance gates](ACCEPTANCE.md). Sol independently tests that revision. Bring blockers back to Astra.
3. Read the [November 14 physical diagnostic](../../evidence/hardware/2026-11-14-native-ecc-retest.json). At 16:29 UTC all 14 standard Java Card ECC paths failed at stage 1, and both positive controls passed. The coordinator removed the temporary diagnostic, confirmed the original registry and read 44,864 free persistent bytes. The [recovery record](CARD-RECOVERY.md) explains the earlier interruption and the 44,712-byte intermediate reading. The [November 15 live payment](../../evidence/near/2026-11-15-live-near-ai.json) is the physical signing capture; it stores the PC/SC scope, the applet AID and the pinned owner key.
4. To repeat a physical product signature, set `AGENTSIM_OWNER_BACKEND=pcsc` with the [harness run](../../harness/2026-11-14-run.md) and current README; the runner pins the card key before each signature. For the emulator, policy and NEAR execution results see the current README.
5. For possible additions to the security-track demonstration, see the dated [NEAR integration options](NEAR-OPTIONS-2026-11-14.md).

## Delivery scope and deadline

The owner requested a separate working GitHub repository, Java Card P-256 applet and prototype functions, tests on the connected card, a separate GitHub folder for emulator/video, and the Astra → Terra → Sol → Astra workflow. The product name is **AgentSIM**. The working repository was created private on November 14. The owner retains publication and submission decisions. [Repository](https://github.com/Lem0nTree/agentsim-nearhackathon)

The official cutoff is **14 November 2026 at 23:59 UTC** (15 November at 00:59 in Rome). The organizers accept work from the October 19 announcement and ask existing projects to identify their baseline and new changes. Distinguish the October files, November 14 simulator integration and work in this new Git repository. The hash index identifies old inputs. Only Git can identify a new revision. [Official rules, Q-001 through Q-005](https://nearhackathon.com/HACKATHON.md)

For an entry, the organizer requests a public repository by the cutoff, a license file, public access through judging and one public X demo post. A local-only project needs an actual video attached. The project includes the owner-selected [MIT License](../../LICENSE). The participant supplies the real team and contact details and prize account, posts the demo and confirms the exact final submission. Check these individually before calling the entry submitted. Code, an HTML replay, a private repository, a movie file and an accepted form each represent different milestones. Historical track fit was AI Security & Defense first and Agent Economy second. [Official procedures and Q-010 through Q-017](https://nearhackathon.com/HACKATHON.md)
