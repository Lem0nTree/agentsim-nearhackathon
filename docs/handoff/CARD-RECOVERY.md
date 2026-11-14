# November 14 connected-card recovery record

| Stage | Observed result |
| --- | --- |
| Live connection | A contact reader communicated using PC/SC T=0. Card manager selection succeeded with `9000`. Selecting the legacy AgentSIM instance returned `6A82`. |
| Platform descriptor | The public descriptor responded with `9000` and omitted its crypto module bitmap. The October 31 authenticated descriptor remains historical. |
| Preflight | The owned diagnostic CAP hash and local management credentials were checked. Authenticated registry contained the same five original packages. FF21 reported 44,864 free persistent bytes. |
| Load | INSTALL for load returned `9000`. The first LOAD did not return a status within 45 seconds. Completion of this block is unknown. No ECC probe case ran. |
| First recovery check | The authenticated registry query timed out before connecting. Afterwards the Java process had exited, the Windows smart-card service was stopped (manual start), and a short read-only GP check reported no available readers. The operator was asked to reconnect the reader/reinsert the card. |

At this point, **physical P-256 capability on November 14 is undetermined**, and no physical product signature was obtained. A partial load or reservation cannot be ruled out. No attempt was made to remove an unidentified item. No command targeted an original package, existing keyset or card lifecycle. Sanitized follow-up receipts under [evidence](../../evidence/) should be read in timestamp order.

## Resume after the device reappears

1. Confirm reader visibility, PC/SC communication and card-manager selection with bounded timeouts. Verify this is the intended card using locally held information. Keep raw card identifiers and management traffic private.
2. Read the authenticated package/instance registry and free persistent memory with the previously working management configuration. Compare with the recorded five-package, 44,864-byte preflight. Matching observations establish a return to that *visible* baseline.
3. If the exact new, owned diagnostic instance/package appears, reconcile and remove only the verified diagnostic items. Reread both registry and memory. If only memory differs, or an unfamiliar item appears, preserve the observations for the issuer. A fresh loading attempt is outside this recovery procedure.
4. Record UTC time, precise operation, result, known residual state and remaining limitations. Keep the October 31 measured negative ECC result, November 14 communication result and any future signing result distinct.
