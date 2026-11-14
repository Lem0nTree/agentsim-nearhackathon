# Submission description

## Draft for the form

AgentSIM lets a person limit what an AI agent can spend. The owner signs a grant naming the agent, recipient, maximum per payment, lifetime budget and expiry. The agent signs each request with a separate key. In the working local prototype a permitted spend succeeds, replay and overspending fail, and revocation stops the next request. We built a P-256 Java Card owner-signing applet, converted it to a CAP and added a PC/SC host. A connected development card responded to inspection. Physical product signatures remain unverified. The Rust NEAR vault is designed to enforce the same authority on native transfers. The demonstrated settlement runs in the local policy model. The separate emulator demo shows applet signing with independently verified signatures.

## Implementation and provenance

The October workspace contained the canonical protocol, software signer, policy model, test vectors and Rust scaffold. The November 14 additions include the applet and off-track demonstration, followed by this separate working repository with an install-time-PIN device applet, CAP build, physical transport and repeatable verification. The handoff identifies the dated work in each environment. [History and source index](../docs/handoff/FINDINGS.md) · [Current run instructions](../README.md)

Bounded authorization can contain a compromised agent's spending to the chosen allowance. The owner still needs a trustworthy way to review the actual signed fields. Suitable SIM or eSIM deployments would also require confirmed P-256 support and provisioning authority. The next end-to-end proof is a signed grant and revoke on a capable card plus a NEAR runtime executing the vault. Each claim should cite its own evidence. [Acceptance gates](../docs/handoff/ACCEPTANCE.md)
