# AgentSIM pitch

AgentSIM's working Java Card applet uses P-256 elliptic-curve cryptography (ECC) to control what a personal NEAR AI agent can spend. The applet generates the owner's signing key and signs spending grants and revocations. Its APDU interface has no private-key export command. Phone-based control requires a compatible, provisioned SIM or eSIM and authorized phone access, without a separate consumer signing device.

Choose the recipient, per-payment limit, total budget and expiry. Revoke permission when you choose. The Rust NEAR vault verifies the P-256 permissions. A separate Ed25519 agent signs the spend, and a restricted Ed25519 relayer submits it to the vault. A handset approval interface has not shipped.

On November 14, 2026, the project owner confirmed a physical SIM signing test worked with P-256 ECC. The recorded product applet signed the grant and revocation in a PC Java Card simulator. A live NEAR AI response supplied the amount and recipient for a controlled local NEAR run that transferred 0.001 test NEAR, completed the callback and rejected forbidden relay actions, overspending and a post-revocation spend. [Website](https://agentsimnear.xyz/) · [Implementation and verification](../docs/VERIFICATION.md) · [Live replay](video/agentsim-live-demo.mp4) · [30-second overview](video/agentsim-overview-30s.mp4)

G+D dates the first commercial SIM to 1991. GSMA reports 8.8 billion wireless connections and 5.8 billion unique subscribers in 2026. Those are mobile-industry figures, not counts of compatible AgentSIM cards. [G+D SIM history](https://www.gi-de.com/en/group/press/press-releases/30-years-of-sim-a-fascinating-success-story) · [GSMA Mobile Economy 2026](https://www.gsmaintelligence.com/research/the-mobile-economy-2026) · [Security notes](../README.md#security-notes)

The next steps include a phone approval flow that shows the exact grant and independent validation on an authorized public test network. Any future identity link would be optional, consent-based and involve an appropriate operator.
