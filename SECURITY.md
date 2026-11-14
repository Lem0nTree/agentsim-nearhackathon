# Security policy

## Scope

This is a hackathon prototype. The vault operator keeps administrative authority, the Java Card applet has not been audited, and the sandbox uses test funds. See `docs/VERIFICATION.md` for the exact limits.

## Reporting

Open a GitHub issue describing the affected path, the observed result and the expected one. Do not attach PINs, management keys, private keys or authenticated card logs. For anything sensitive, say so in the issue and coordinate before posting details.

## Tested boundaries

Owner P-256 signatures, replay, recipient change, per-call and total limits, expiry and post-revocation spends are covered by tests and by the recorded rejection cases. Transport fragmentation inside one APDU, concurrent execution and failed-transfer callbacks are not.
