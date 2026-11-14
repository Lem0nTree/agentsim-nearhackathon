# Submission description

## Draft for the form

AgentSIM is building phone-based control for personal NEAR AI agents, with the owner's signing key protected by a compatible, provisioned SIM or eSIM. This proposed phone experience would let you approve spending without carrying another device. The cloud model proposes a payment, your SIM signs the permission you choose, and the NEAR vault enforces those limits.

You set a recipient, per-payment limit, total budget and expiry, and can revoke the grant. A separate agent session key signs each request, while a restricted relayer submits it to the vault. There is no shipped phone app. Compatible-card support, secure provisioning and an understandable approval interface still need proof. Any later identity link would be optional, consent-based and require an appropriate operator. A signature alone is not KYC or proof of identity.

In our controlled local demonstration, the product Java Card applet signed the owner's grant and revocation in jCardSim on a PC. A separate Ed25519 agent signed the spend and an execute-only, finite-allowance relayer submitted it to a local NEAR sandbox. The receiver gained 0.001 sandbox NEAR and the callback succeeded. The node rejected four forbidden relayer actions; the contract rejected overspending and a post-revocation payment. The proposal was a fixture. A live NEAR AI request returned HTTP 402, with no completion. The tested physical card lacked the required native ECC; no physical product signature or public-network deployment is claimed. [Local proof](../evidence/near/2026-11-14-restricted-relayer.json) · [Physical diagnostic](../evidence/hardware/2026-11-14-native-ecc-retest.json) · [Video](../off-track/video-emulator/agentsim-restricted-relayer.mp4)

## Implementation and provenance

The October workspace contained canonical protocol bytes, a software signer, a policy model, test vectors and the Rust scaffold. November 14 work added the product applet, PC/SC host, local NEAR execution, restricted relayer and proposal interface. [History and source index](../docs/handoff/FINDINGS.md) · [Current run instructions](../README.md)

G+D dates the first commercial SIM to 1991. GSMA's 2026 report describes 8.8 billion wireless connections and 5.8 billion unique subscribers; these are mobile-industry figures, not a count of compatible cards or deployed users. [G+D history](https://www.gi-de.com/en/about-us/company/history) · [GSMA report](https://www.gsma.com/solutions-and-impact/connectivity-for-good/mobile-economy/wp-content/uploads/2026/02/The-Mobile-Economy-2026.pdf)

The local vault operator retains administrative authority over the test contract. Hardware provisioning, a trustworthy user display, contract security and an authorized public-network test remain open. [Acceptance gates](../docs/handoff/ACCEPTANCE.md)
