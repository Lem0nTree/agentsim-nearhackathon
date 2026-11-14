# Local NEAR sandbox integration

This test sends real signed transactions only to a loopback-only, disposable NEAR sandbox. It will create fresh local accounts, deploy the vault and spend sandbox funds. It never calls a public NEAR RPC. Never use public-network credentials: use only the sandbox's generated validator key under the ignored `.build/sandbox-home` directory.

Prerequisites: Node 22, JDK 8+ for the product applet simulator, Python 3 and the official Linux x86-64 NEAR sandbox 2.14.0 binary. The tested sandbox artifact was downloaded from the [official NEAR release bucket](https://s3-us-west-1.amazonaws.com/build.nearprotocol.com/nearcore/Linux-x86_64/2.14.0/near-sandbox.tar.gz); the download URL is defined in [near-sandbox-rs](https://github.com/near/near-sandbox-rs/blob/56e17cd/src/runner/mod.rs). Use WSL on Windows; keep its process and RPC loopback-bound. Rebuilding the WASM additionally requires Rust 1.100 with `wasm32-unknown-unknown`.

From the repository root, first `npm run card-sim:setup` and `npm ci --prefix tests/near-sandbox`. The driver defaults to the checked-in WASM, so Rust is not required to rerun the test. To rebuild, install Rust and build in Linux with `sh tests/near-sandbox/build.sh`. It uses the committed Cargo lock, 2 jobs, and `RUSTFLAGS='--cfg near'`, as required for the pinned SDK. The non-reproducible local build produced `b26c7b6a9928e967e3e26c8219a8587f84982c40acfe05fa77d673317c20c3c0`; the same checked artifact is `contracts/agentsim-vault/artifacts/agentsim_vault.wasm`. Compiler versions may affect the hash; do not assume identical builds across toolchains.

In Linux, with `near-sandbox` on PATH:

```sh
near-sandbox --home .build/sandbox-home init --chain-id agentsim-local --account-id test.near --fast
python3 tests/near-sandbox/isolate.py .build/sandbox-home
near-sandbox --home .build/sandbox-home validate-config
near-sandbox --home .build/sandbox-home run --rpc-addr 127.0.0.1:3030 --network-addr 127.0.0.1:24568
```

Keep that process running; in a second terminal at the repository root set `AGENTSIM_JAVA_HOME` if needed and run `node tests/near-sandbox/run.mjs`. It validates chain ID, P-256 host availability and the local isolation configuration before signing. Each run creates unique subaccounts, records actual decoded function-call actions and verifies that they reconstruct each signed transaction hash. It writes local receipts and public signatures to ignored `.build/sandbox-results/evidence.json`, never the validator or applet private keys. Verify the recorded example with `node tests/near-sandbox/verify.mjs`.

The checked example records the separate P-256 owner, Ed25519 agent and Ed25519 outer relayer, grant/spend/revocation bytes and signatures, transaction outcomes, successful recipient and callback receipts, balance delta, state and negative results. The sandbox state is not public-network evidence. Failed-transfer callbacks, concurrent execution and transport fragmentation within a single APDU remain unverified here. The signer is a PC Java Card simulator, not a physical SIM.

On Windows, run Node and the JDK in PowerShell from the repository root; run the Linux sandbox in WSL with the same project directory mounted. In an all-Linux setup, run Node, the JDK and sandbox on Linux. The driver reads the shared `.build/sandbox-home` and connects to `127.0.0.1:3030`. To test a different locally built artifact, set `AGENTSIM_VAULT_WASM` to its path; quote paths containing spaces.
