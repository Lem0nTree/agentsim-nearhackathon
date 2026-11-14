# AgentSIM — NEAR Hackathon

AgentSIM is designed to give you control of a personal NEAR AI agent from your phone, with the owner's P-256 signing key protected by a compatible, provisioned SIM or eSIM and authorized phone access. The owner approves spending without carrying another signing device. The cloud model proposes a payment, the owner signs the permission, and the NEAR vault enforces its limits.

You choose the recipient, per-payment limit, total budget and expiry, and can revoke the grant. A separate Ed25519 agent session key signs each spend, and an execute-only relayer submits it to the vault. A handset approval interface has not been shipped. Explore the [pitch](submission/pitch.md) and [form draft](submission/project-description.md).

## Implementation and verification

**Applet status: working.** The project owner confirmed signing on a physical SIM on November 14, 2026. The [owner report](evidence/hardware/2026-11-14-owner-confirmation.json) records that confirmation. The product applet source implements P-256 key generation and grant and revocation signing, with no private-key export APDU. In a controlled local NEAR run, the vault transferred 0.001 test NEAR and completed its callback. The node denied four forbidden relay actions, and the vault denied overspending and spending after revocation. See the [verification guide](docs/VERIFICATION.md) for the separate card diagnostic, execution environments, provider result and commands. The [24-second replay](off-track/video-emulator/agentsim-restricted-relayer.mp4) shows the recorded local flow.

## Why a phone-scale approach?

G+D dates the first commercial SIM to 1991. GSMA's 2026 report describes 8.8 billion wireless connections and 5.8 billion unique subscribers. These are mobile-industry figures, not counts of compatible cards or AgentSIM deployments. Android documents carrier-privileged UICC access as one possible route; operator-granted access and compatible provisioning would still be required. [Android UICC privileges](https://source.android.com/docs/core/connect/uicc) · [G+D SIM history](https://www.gi-de.com/en/group/press/press-releases/30-years-of-sim-a-fascinating-success-story) · [GSMA Mobile Economy 2026](https://www.gsmaintelligence.com/research/the-mobile-economy-2026)

## Security notes

SIMs have a long mobile security history, and [GSMA IoT SAFE](https://www.gsma.com/solutions-and-impact/technologies/internet-of-things/iot-safe/) describes a SIM-based root of trust for IoT devices. This precedent does not establish AgentSIM compatibility or certification. Independent researchers reported deficiencies in a specific eSIM implementation and test profile, so individual cards, provisioning and phone access require evaluation. [Security Explorations research](https://www.security-explorations.com/esim-security)

The local contract operator retains administrative authority. A trustworthy approval interface, secure provisioning and independent security review remain open. Any future identity link would be optional, consent-based and require an appropriate operator; a signature alone does not establish identity or KYC.

## License

AgentSIM is available under the [MIT License](LICENSE).
