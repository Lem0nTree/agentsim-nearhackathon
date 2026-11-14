# Demo script

## Recorded local NEAR sandbox demo — 24 seconds

**0:00–0:04 — Scope.** “AgentSIM lets an owner give an AI agent bounded spending authority. This recording uses a Java Card applet in a PC simulator and a private local NEAR sandbox.” Keep “No physical SIM; no public-chain transaction” visible.

**0:04–0:08 — Owner grant.** “The applet signs a P-256 grant that specifies the agent, allowed recipient, limits and expiry. The sandbox vault verifies it.” The video displays a prefix of the real local signature.

**0:08–0:12 — Agent request.** “The agent uses its own Ed25519 key to sign the spend. A separate Ed25519 relayer signs the outer sandbox transaction.”

**0:12–0:16 — Local transfer.** “The sandbox executes the request. Its transfer receipt and callback succeed, and the receiver balance increases by the requested 10^21 yoctoNEAR in sandbox funds.”

**0:16–0:20 — Revocation.** “The owner signs a revocation with the same simulated applet. A subsequent agent request is rejected.”

**0:20–0:24 — Boundaries.** “The owner, agent and relayer use distinct signing roles. The recording shows no physical product signature and no public-network deployment or transfer.”

The replay is [agentsim-sandbox-demo.mp4](../off-track/video-emulator/agentsim-sandbox-demo.mp4). [Sandbox evidence](../evidence/near/2026-11-14-local-sandbox.json) records canonical messages, signatures, decoded outer actions, receipt results and balance changes. Use the [sandbox run instructions](../tests/near-sandbox/README.md) to reproduce and verify them. A separate [offline policy-only clip](../off-track/video-emulator/agentsim-demo.mp4) contains no settlement.

## Physical and public-network extensions

Show actual card and independently verified grant/revocation signatures only after they are obtained on a supported provisioned card. The current connected card's measured ECC failures are documented in the [physical evidence](../evidence/hardware/2026-11-14-native-ecc-retest.json); they are not a product signing demonstration.

Show testnet deployment, transaction hashes, transfer and final receipt only after separately authorized public-network execution. Never describe a sandbox receipt as a public NEAR transaction. No public post, event submission or publication is implied by this draft.
