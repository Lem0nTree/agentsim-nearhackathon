# AgentSIM pitch

AgentSIM is designed to give you control of a personal NEAR AI agent from your phone, with the owner's P-256 signing key protected by a compatible, provisioned SIM or eSIM and authorized phone access. The owner approves spending without carrying another signing device. The cloud model proposes a payment, the owner signs the permission, and the NEAR vault enforces its limits.

Choose the recipient, per-payment limit, total budget and expiry. Revoke permission when you choose. A separate Ed25519 agent signs the spend and a restricted relayer submits it to the vault.

On November 14, 2026, the project owner confirmed signing on a physical SIM. A live NEAR AI response drove a controlled local NEAR run that transferred 0.001 test NEAR, completed the callback and rejected forbidden relay actions, overspending and a post-revocation spend. [Implementation and verification](../docs/VERIFICATION.md) · [Live replay](video/agentsim-live-demo.mp4) · [Earlier fixture replay](../off-track/video-emulator/agentsim-restricted-relayer.mp4)

G+D dates the first commercial SIM to 1991. GSMA reports 8.8 billion wireless connections and 5.8 billion unique subscribers in 2026. Those are mobile-industry figures, not counts of compatible AgentSIM cards. [G+D SIM history](https://www.gi-de.com/en/group/press/press-releases/30-years-of-sim-a-fascinating-success-story) · [GSMA Mobile Economy 2026](https://www.gsmaintelligence.com/research/the-mobile-economy-2026) · [Security notes](../README.md#security-notes)

The next steps include a phone approval flow that shows the exact grant and independent validation on an authorized public test network. Any future identity link would be optional, consent-based and involve an appropriate operator.
