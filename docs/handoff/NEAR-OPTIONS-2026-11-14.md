# NEAR integration options for AgentSIM

**Decision for November 14, 2026.** The best addition that judges could repeat without a cloud account is a restricted NEAR function-call key for the relayer. If a funded NEAR AI Cloud key is available, pair this with a model that can propose a payment and a vault that can reject it. Both fit the security track's emphasis on spending limits and agent permissions. These are proposed experiments. The existing demo already verifies an owner grant, agent spend, successful native transfer, callback and revocation on a local NEAR network. [Event tracks](https://nearhackathon.com/) · [AgentSIM sandbox evidence](../../evidence/near/2026-11-14-local-sandbox.json)

**Implementation update later on November 14.** The restricted relayer and proposal-only NEAR AI adapter are implemented. An explicitly labeled fixture proposal drove the complete local sandbox flow, including protocol-level access-key rejections, the transfer and callback, and contract-level overspend and revocation checks. A live provider request returned HTTP 402; no live completion or attestation is claimed. See the [restricted relayer guide](../../tests/near-sandbox/RESTRICTED.md) and [local proof](../../evidence/near/2026-11-14-restricted-relayer.json). The Intents quote remains a proposal. The recommendations below preserve the original decision context.

## 1. Limit the key that pays the gas

In the sandbox, give the relay account an Ed25519 function-call key scoped to this vault, the single method `execute`, and a finite gas allowance. Keep the setup key separate. The relay attaches zero NEAR to each call. The contract validates the signed spend and transfers from its own balance. The protocol's gas allowance limits the relayer's gas spending. The owner grant's recipient and per-call and total limits govern the payment.

**Demo gate.** Show a valid spend and its receipt, a call to a different method or receiver rejected by the NEAR protocol, and an overspend rejected by the vault. For a transaction refused before execution, retain the RPC rejection and verify that the vault state did not move. This uses the existing local setup and requires no API key. [NEAR access keys](https://docs.near.org/protocol/accounts-contracts/access-keys)

## 2. Give the AI a proposal-only interface

Have a NEAR AI Cloud model turn a public purchase request into a structured proposal containing the recipient and amount. Validate the schema and show the proposed fields for review. The host obtains chain, vault, grant identity and next nonce from trusted state. The model receives no signing material. Record one real completion leading to an accepted payment and one unacceptable proposal blocked by the grant. A recorded fixture remains available for offline replay.

This option requires a working API key and credit. For a verified model execution, preserve the exact request and response bytes and match a `provider_tee` signature against its independently verified preflight attestation. A gateway signature supports a narrower claim about the gateway. The vault still decides whether the payment is authorized. [NEAR AI quickstart](https://docs.near.ai/cloud/quickstart) · [Response signatures](https://docs.near.ai/cloud/verification/cloud-api/response-signatures) · [Verification policy](https://docs.near.ai/cloud/verification/reference/verification-policy)

## 3. Preview an Intents quote

A quote-only integration can display a 1Click exact-input quote and screen token IDs, chain, amount, minimum output, expiry, destination and refund address. Set `dry: true` to preview the terms without creating a deposit address or starting the swap. The native-transfer grant currently signs a single recipient and budgets. Executing a cross-chain swap would require the owner's signed authorization to bind the new terms and actual settlement evidence. [1Click quote API](https://docs.near-intents.org/api-reference/oneclick/request-a-swap-quote)

The Intents verifier documents P-256 through a WebAuthn envelope containing authenticator data and client data. The AgentSIM applet currently signs canonical application messages. An Intents integration needs its own supported envelope. Chain Signatures would additionally introduce MPC-managed signing and another chain's settlement dependency. Both add less directly to the current security demonstration than the first two options. [NEAR Intents overview](https://docs.near.org/chain-abstraction/intents/overview) · [1Click API](https://docs.near-intents.org/) · [Intent signature formats](https://docs.near-intents.org/integration/verifier-contract/signing-intents)

## Tooling snapshot

| Tool | Published version observed on November 14 | AgentSIM integration |
| --- | --- | --- |
| Rust `near-sdk` | 5.30.2, November 13, on crates.io and the SDK's GitHub release | The tested WASM was built with 5.29.1. [Registry](https://crates.io/crates/near-sdk/5.30.2) · [SDK release](https://github.com/near/near-sdk-rs/releases/tag/near-sdk-v5.30.2) |
| `near-api-js` | npm's latest tag was 7.5.3, published November 11 at 12:37 UTC. GitHub's latest release was 7.5.1, published the same day at 01:21 UTC. | The sandbox driver pins 6.5.1. [npm release](https://www.npmjs.com/package/near-api-js/v/7.5.3) · [GitHub release](https://github.com/near/near-api-js/releases/tag/near-api-js%407.5.1) |
| `cargo-near` | 0.23.0, GitHub publication November 6, with nearcore 2.14 support | The checked-in build uses locked Cargo dependencies and the NEAR compiler configuration. [Build recipe](../../tests/near-sandbox/build.sh) · [Release](https://github.com/near/cargo-near/releases/tag/cargo-near-v0.23.0) |
| 1Click TypeScript SDK | `@defuse-protocol/one-click-sdk-typescript` 0.1.26, npm publication September 22 | Optional client for the quote experiment. [Published package](https://www.npmjs.com/package/@defuse-protocol/one-click-sdk-typescript/v/0.1.26) |

Keep the verified dependency locks for the submission. An upgrade should be evaluated separately by rebuilding the WASM and repeating the signed receipt flow and balance checks.
