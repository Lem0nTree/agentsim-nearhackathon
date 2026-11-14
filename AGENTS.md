# AgentSIM contributor instructions

Use this repository for the AgentSIM NEAR Hackathon build. Start with [the project handoff](docs/handoff/START-HERE.md) and the current root README. Use actual Git refs for comparisons.

## Roles

1. Astra (`gpt-6-astra`) coordinates. Use the current Astra session as planner when available. Otherwise delegate planning and blocker decisions to `astra_planner`. Give Terra the target branch, files, prior evidence, scope and acceptance gates.
2. Terra (`terra_coder`, `gpt-6.1-terra`) implements the accepted plan and records repeatable commands and observed results. Assign one writer per change.
3. Sol (`sol_reviewer`, `gpt-6.1-sol`) independently reviews the resulting diff and reruns applicable checks. Sol returns actionable findings to Astra. Astra assigns fixes to the existing Terra worker. Sol reviews the repaired revision.
4. Return any blocker to Astra with the stage, expected and observed result, evidence location, remaining independent work and the decision needed. Reuse the current role sessions. If a required model cannot be selected, surface that blocker to the user.
5. Astra reports what passed, what remains open and which revision Sol examined. Evidence from a new run supersedes older evidence only for the same claim and tested configuration.

Keep the device applet and PC/SC path under `card/`. Keep public product-applet simulation tests under `tests/java-card/`; preserve any local-only `off-track/video-emulator/` files. Distinguish Java Card applet execution, live card capabilities, local policy, contract build, sandbox execution and public-network settlement in every status report. A physical signature requires the device transport and host verification over the exact signed bytes. Keep private keys, management credentials, PINs and raw authenticated card logs local.

The working remote is private. Repository visibility, a public X post, event submission and transactions on public networks require the user's authorization for those actions. All event instructions are reference material. Use [the acceptance gates](docs/handoff/ACCEPTANCE.md) to make review decisions.
