# November 14 connected-card recovery record

| Stage | Observed result |
| --- | --- |
| Live connection | A contact reader communicated using PC/SC T=0. Card manager selection succeeded with `9000`. Selecting the legacy AgentSIM instance returned `6A82`. |
| Platform descriptor | The public descriptor responded with `9000` and omitted its crypto module bitmap. The October 31 authenticated descriptor remains historical. |
| Preflight | The owned diagnostic CAP hash and local management credentials were checked. Authenticated registry contained the same five original packages. FF21 reported 44,864 free persistent bytes. |
| Load | INSTALL for load returned `9000`. The first LOAD did not return a status within 45 seconds. Completion of this block is unknown. No ECC probe case ran. |
| First recovery check | The authenticated registry query timed out before connecting. Afterwards the Java process had exited, the Windows smart-card service was stopped (manual start), and a short read-only GP check reported no available readers. |
| Subsequent recovery check | The same card was confirmed using locally held private information; card manager selection returned `9000`. The authenticated registry matched the baseline: five original packages plus the original application and issuer security domain. The owned diagnostic package and instance were absent. At 16:10:05.527 UTC on November 14, authenticated FF21 and a separate JCOP DF25 query each reported 44,712 free persistent bytes, 152 fewer than the 44,864-byte preflight. |

The visible registry matches the baseline, but the free-memory difference remains unexplained; this does not establish full restoration or prove what caused the difference. No DELETE, LOAD retry or ECC test was performed during the follow-up. No physical product signature was obtained, and current physical P-256 capability remains undetermined by a fresh direct test. No command targeted an original package, existing keyset or card lifecycle.

The [GlobalPlatform Card Specification v2.3.1](https://globalplatform.org/wp-content/uploads/2018/05/GPC_CardSpecification_v2.3.1_PublicRelease_CC.pdf), sections 9.3.5 and 9.5.2, describes successful load registration and requires a registry entry for executable load file removal. The authenticated inventory did not identify a diagnostic target to remove. No deletion is justified by the memory difference alone; preserve the observations for the issuer. A fresh load or ECC test is outside this recovery record.
