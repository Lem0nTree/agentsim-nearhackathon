# Near-sandbox tests

- Run `node tests/near-sandbox/verify-restricted.mjs <record>` from the repository root before quoting any field.
- `evidence/near/2026-11-15-live-near-ai.json` is the physical capture; `2026-11-14-live-near-ai.json` is the emulator control.
- The physical branch asserts `transport: {api: "PC/SC", selectStatus: "9000"}`, the AID and the pinned key.
- Expected success line is in `../../AGENTS.md`. A changed record must fail closed, not warn.
