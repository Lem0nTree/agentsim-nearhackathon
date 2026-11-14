# Demo script

## Recorded local restricted-relayer replay — 24 seconds

**0:00–0:04.** “Your agent can handle expenses with permission you control.”

**0:04–0:08.** “The product applet signs a bounded grant in simulation.”

**0:08–0:12.** “A fixture proposes an amount and the agent signs separately.”

**0:12–0:16.** “A restricted relay submits only the permitted vault call.”

**0:16–0:20.** “The sandbox transfers test funds and confirms the callback.”

**0:20–0:24.** “The owner revokes permission. The next spend is rejected.”

## Speaker notes

The product Java Card applet runs in jCardSim on a PC and signs the owner's grant and revocation. Trusted code creates the grant context and a separate Ed25519 agent key signs the spend. The proposal is a fixture. A live NEAR AI request returned HTTP 402 without a completion.

The execute-only relay key has a finite fee allowance and is scoped to the vault. The local node rejected wrong-method, wrong-receiver, deposit and transfer actions. The contract rejected overspending and a post-revocation payment. The receiver gained 0.001 sandbox NEAR and the transfer callback succeeded.

Keep “PC Java Card simulator; local NEAR sandbox; no physical SIM or public-chain transaction” visible. The [replay](../off-track/video-emulator/agentsim-restricted-relayer.mp4) is generated from the [recorded local proof](../evidence/near/2026-11-14-restricted-relayer.json), and the [guide](../tests/near-sandbox/RESTRICTED.md) explains how to repeat it.

## Proposed phone experience

A future compatible, provisioned SIM or eSIM in the person's phone would protect the owner key without requiring another consumer device. A phone interface would show the exact grant for approval. Neither the mobile app nor that provisioning and approval flow has been shipped or demonstrated. The connected test card's [native ECC diagnostic](../evidence/hardware/2026-11-14-native-ecc-retest.json) failed for the required algorithms. That diagnostic and this recording produced no physical product signature. The owner separately reported physical SIM signing; see [implementation and verification](../docs/VERIFICATION.md).

Show public-network deployment, transaction hashes and final receipts only after separately authorized execution. A sandbox receipt is not a public NEAR transaction. No public post, submission or publication is implied by this draft.
