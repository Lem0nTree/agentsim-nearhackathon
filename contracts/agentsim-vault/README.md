# NEAR vault implementation scaffold

**Not compiled, deployed or audited. No mainnet funds.**

Compilation, deployment and runtime capability require independent verification. Direct dependency versions are pinned, but no complete lockfile or WASM is supplied because Rust/Cargo was unavailable here.

Methods: `new(owner_key)`, `fund()`, `authorize(grant,signature)`, `execute(spend,signature)`, `control(command,signature)`, `status()`, `grant_status(grant_id)` and private `on_settle(transfer_id)`.

Initialization and funding require the vault account as predecessor. The operator must deploy and initialize atomically using a controlled account. Public relays may submit signed authorizations/spends/control requests; their predecessor is not the owner identity. The native transfer callback may only originate from this contract account.

The contract performs raw application-protocol P-256 verification. It is neither a SIM applet nor a WebAuthn/NEP-641 implementation. The current full-access account operator remains able to replace code. Storage reserves, funding accounting and callback failure behavior require sandbox validation before testnet funding.

Cross-language vectors live at `artifacts/protocol-vectors.json`. They use dummy testnet account names and software-generated public test material. They do not identify existing accounts, a submitted transaction or a deployed project.
