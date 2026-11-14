# Live-run replay script — 72 seconds

The replay is silent with on-screen text and an accompanying SRT. These nine optional spoken lines match its nine-second cards; the last card is a terminal check of the applet suite. The visual is a replay of recorded evidence, not a screen capture of a handset or public-chain transaction.

1. Pay 0.001 test NEAR for a compute job. Your agent spends under limits you choose, with phone SIM owner control.
2. In our live hardware test, the physical SIM supported P-256 ECC and signed successfully with ECDSA. This recording shows the physical SIM authorizing the local NEAR payment.
3. The owner applet signs a bounded P-256 grant on the card; the key stays there.
4. A live NEAR AI response proposes the displayed amount and local recipient. Both come from the verified record.
5. A separate Ed25519 agent signs the spend. Trusted code binds the limits and transaction context.
6. The restricted relayer can call only the approved vault method. The node rejects forbidden actions.
7. The local vault transfers 0.001 test NEAR. Its transaction and successful callback are recorded.
8. The owner signs revocation. A later spend is rejected. The recorded transfer uses local test funds.
9. The applet suite compiles that same source and passes, so you can reproduce it without a card.

[Implementation and verification](../docs/VERIFICATION.md) · [Recorded live proof](../evidence/near/2026-11-14-live-near-ai.json)
