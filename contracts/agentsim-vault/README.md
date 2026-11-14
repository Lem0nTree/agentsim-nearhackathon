# NEAR vault implementation scaffold

**Built and exercised on a local NEAR sandbox; not audited or deployed to a public network. No mainnet funds.**

The pinned build recipe, local runtime requirements and receipt verification are documented in `tests/near-sandbox/README.md`; `Cargo.lock` and the tested WASM are supplied. The local sandbox test does not establish public-network execution.

Methods: `new(owner_key)`, `fund()`, `authorize(grant,signature)`, `execute(spend,signature)`, `control(command,signature)`, `status()`, `grant_status(grant_id)` and private `on_settle(transfer_id)`.

Initialization and funding require the vault account as predecessor. The operator must deploy and initialize atomically using a controlled account. Public relays may submit signed authorizations/spends/control requests; their predecessor is not the owner identity. The native transfer callback may only originate from this contract account.

The contract performs raw application-protocol P-256 verification. It is neither a SIM applet nor a WebAuthn/NEP-641 implementation. The current full-access account operator remains able to replace code. Storage reserves, funding accounting and callback failure behavior require sandbox validation before testnet funding.

Cross-language vectors live at `artifacts/protocol-vectors.json`. They use dummy testnet account names and software-generated public test material. They do not identify existing accounts, a submitted transaction or a deployed project.
