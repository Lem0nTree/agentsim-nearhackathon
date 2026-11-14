# Submission description

## Draft for the form

AgentSIM's working Java Card applet uses P-256 elliptic-curve cryptography (ECC) to control what a personal NEAR AI agent can spend. The applet generates the owner's signing key and signs spending grants and revocations. Its APDU interface has no private-key export command. Phone-based control requires a compatible, provisioned SIM or eSIM and authorized phone access, without a separate consumer signing device.

You set a recipient, per-payment limit, total budget and expiry, and can revoke the grant. The Rust NEAR vault verifies the P-256 permissions. A separate Ed25519 agent session key signs each spend and a restricted Ed25519 relayer submits it to the vault. A handset approval interface has not been shipped. Any identity link requires consent and an appropriate operator. A signature alone is not KYC or proof of identity.

On November 14, 2026, the project owner confirmed a physical SIM signing test worked with P-256 ECC. The recorded product applet signed the grant and revocation in a PC Java Card simulator. A live NEAR AI response supplied the amount and recipient for a controlled local NEAR run that transferred 0.001 test NEAR and completed the callback. Four forbidden relay actions, overspending and a post-revocation payment were rejected. [Website](https://agentsimnear.xyz/) · [Implementation and verification](../docs/VERIFICATION.md) · [Live replay](video/agentsim-live-demo.mp4) · [30-second overview](https://youtu.be/TdMTaH6908w)

## Implementation and provenance

The October workspace contained canonical protocol bytes, a software signer, a policy model, test vectors and the Rust scaffold. November 14 work added the product applet, PC/SC host, local NEAR execution, restricted relayer and proposal interface. [History and source index](../docs/handoff/FINDINGS.md) · [Current run instructions](../README.md)

G+D dates the first commercial SIM to 1991. GSMA's 2026 report describes 8.8 billion wireless connections and 5.8 billion unique subscribers; these are mobile-industry figures, not a count of compatible cards or deployed users. [G+D history](https://www.gi-de.com/en/about-us/company/history) · [GSMA report](https://www.gsma.com/solutions-and-impact/connectivity-for-good/mobile-economy/wp-content/uploads/2026/02/The-Mobile-Economy-2026.pdf)

The local vault operator retains administrative authority over the test contract. Hardware provisioning, a trustworthy user display, contract security and an authorized public-network test remain open. [Acceptance gates](../docs/handoff/ACCEPTANCE.md)
