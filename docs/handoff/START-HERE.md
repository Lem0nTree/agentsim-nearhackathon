# AgentSIM engineering handoff

Start at the [product README](../../README.md) for the runnable entry points. AgentSIM lets an owner authorize a limited spending capability for an agent and revoke it. The owner signs grants and controls with P-256. The agent signs each spend with Ed25519. The vault checks chain, vault, epoch, recipient, amount, expiry and nonce before reserving the allowance.

## Resume this build

1. Inspect the current refs in [Branch handoff](BRANCHES.md) and read the [history of the old workspace](FINDINGS.md). Dated hashes are in the [source index](baseline-source-sha256.tsv).
2. Use the [Codex launcher](../../harness/launch.md) to start Astra. Assign Terra one outcome with the applicable [acceptance gates](ACCEPTANCE.md). Sol independently tests that revision. Bring blockers back to Astra.
3. Use the run evidence under [evidence](../../evidence/) and the current README to update public claims. A November 14 live PC/SC check selected the card manager (`9000`) and returned `6A82` for the legacy applet AID. A later authorized diagnostic load stalled before the first block returned. The post-attempt inventory was initially unavailable; a later authenticated check matched the original visible registry and found no owned diagnostic item, while authenticated FF21 and a separate JCOP DF25 query agreed at 16:10:05.527 UTC on 44,712 free persistent bytes, 152 below preflight for an undetermined reason. See the [recovery record](CARD-RECOVERY.md) before further physical work.
4. Prioritize an actual card capability result and applet/host integration, then the NEAR contract build and sandbox gates. The off-track recording path has its own tests. Describe each result in its own execution environment.

## Delivery scope and deadline

The owner requested a separate working GitHub repository, Java Card P-256 applet and prototype functions, tests on the connected card, a separate GitHub folder for emulator/video, and the Astra → Terra → Sol → Astra workflow. The product name is **AgentSIM**. The working repository was created private on November 14. The owner retains publication and submission decisions. [Repository](https://github.com/Lem0nTree/agentsim-nearhackathon)

The official cutoff is **14 November 2026 at 23:59 UTC** (15 November at 00:59 in Rome). The organizers accept work from the October 19 announcement and ask existing projects to identify their baseline and new changes. Distinguish the October files, November 14 simulator integration and work in this new Git repository. The hash index identifies old inputs. Only Git can identify a new revision. [Official rules, Q-001 through Q-005](https://nearhackathon.com/HACKATHON.md)

For an entry, the organizer requests a public repository by the cutoff, a license file, public access through judging and one public X demo post. A local-only project needs an actual video attached. The participant chooses a license, supplies the real team and contact details and prize account, posts the demo and confirms the exact final submission. Check these individually before calling the entry submitted. Code, an HTML replay, a private repository, a movie file and an accepted form each represent different milestones. Historical track fit was AI Security & Defense first and Agent Economy second. [Official procedures and Q-010 through Q-017](https://nearhackathon.com/HACKATHON.md)
