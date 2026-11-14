# Submission checklist

## Available for review

- [x] The product README and dated handoff cover the protocol, local policy, scope and execution environments. [README](../README.md) · [Handoff](../docs/handoff/START-HERE.md)
- [x] The dated source index identifies original October and November files. The chronology summarizes older threat, legal, market, SIM compatibility and pitch work. [Findings](../docs/handoff/FINDINGS.md)
- [x] The final restricted-relayer revision passed independent review: 48 core tests, 22 off-track tests and 5 proof tests (75 total). The actual product applet signed in the PC simulator. [Restricted run guide](../tests/near-sandbox/RESTRICTED.md) · [Acceptance gates](../docs/handoff/ACCEPTANCE.md)
- [x] The product applet converted to a CAP and its Java PC/SC bridge compiled. A connected-card diagnostic found the required native ECC unavailable; no physical product signature was obtained. [Card recovery record](../docs/handoff/CARD-RECOVERY.md)
- [x] The project includes a draft description, a payload template, an offline validator and a demo script. [Project description](project-description.md)

## Engineering claims to check at the final revision

- [ ] Repeat the documented commands from a clean checkout and record environment, commit and results.
- [x] Verify the actual signed grant, spend and revocation against the built WASM in a local sandbox; inspect transfer and success-callback receipts, limits and resulting state. [Sandbox evidence](../evidence/near/2026-11-14-local-sandbox.json)
- [ ] Exercise failed-transfer callbacks, concurrent execution and additional vectors before broader contract claims.
- [ ] For a testnet settlement claim, obtain the actual deployment, transfer and negative-case outcomes.
- [ ] For a physical product-signing claim, demonstrate a grant and revocation on the provisioned card and independently verify both.
- [ ] Review the current device recovery state, contract administration and evidence provenance before final wording.

## Event entry

- [ ] Link the actual in-window work and disclose reused sources in the README.
- [x] Add the owner-selected [MIT License](../LICENSE).
- [ ] Obtain publication authorization and verify unauthenticated access to the repository.
- [ ] Verify that the exported demo video plays, shows the actual execution mode and is attached to the participant's public X post.
- [ ] Collect the real lead, email, team-size category, tracks, prize account and public links.
- [ ] Check the event window and one-submission status, validate the exact payload and obtain genuine contact consent and final confirmation.
- [ ] Save the organizer's actual success receipt. Corrections to a saved entry use the organizer's request-changes process.

Hardware and NEAR milestones above govern what the project can claim. The event rules establish the entry requirements. [Official rules](https://nearhackathon.com/HACKATHON.md)
