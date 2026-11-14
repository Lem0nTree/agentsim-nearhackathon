#!/bin/sh
set -eu
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
export CARGO_TARGET_DIR="$ROOT/.build/rust-target" CARGO_BUILD_JOBS=2
export RUSTFLAGS='--cfg near'
cd "$ROOT/contracts/agentsim-vault"
exec cargo build --locked --release --target wasm32-unknown-unknown -j 2
