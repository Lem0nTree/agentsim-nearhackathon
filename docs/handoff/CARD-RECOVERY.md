# November 14 connected-card recovery record

| Stage | Observed result |
| --- | --- |
| Live connection | A contact reader communicated using PC/SC T=0. Card manager selection succeeded with `9000`. Selecting the legacy AgentSIM instance returned `6A82`. |
| Platform descriptor | The public descriptor responded with `9000` and omitted its crypto module bitmap. The October 31 authenticated descriptor remains historical. |
| Preflight | The owned diagnostic CAP hash and local management credentials were checked. Authenticated registry contained the same five original packages. FF21 reported 44,864 free persistent bytes. |
| Load | INSTALL for load returned `9000`. The first LOAD did not return a status within 45 seconds. Completion of this block is unknown. No ECC probe case ran. |
| First recovery check | The authenticated registry query timed out before connecting. Afterwards the Java process had exited, the Windows smart-card service was stopped (manual start), and a short read-only GP check reported no available readers. |
| Subsequent recovery check | The same card was confirmed using locally held private information; card manager selection returned `9000`. The authenticated registry matched the baseline: five original packages plus the original application and issuer security domain. The owned diagnostic package and instance were absent. At 16:10:05.527 UTC on November 14, authenticated FF21 and a separate JCOP DF25 query each reported 44,712 free persistent bytes, 152 fewer than the 44,864-byte preflight. |

At 16:10 UTC the visible registry matched the baseline and the 152-byte difference remained unexplained. The recovery follow-up performed no deletion, load retry or ECC test. Physical P-256 capability at that point remained unmeasured in the November 14 session.

The [GlobalPlatform Card Specification v2.3.1](https://globalplatform.org/wp-content/uploads/2018/05/GPC_CardSpecification_v2.3.1_PublicRelease_CC.pdf), sections 9.3.5 and 9.5.2, describes successful load registration and requires a registry entry for executable load file removal. The authenticated inventory did not identify a diagnostic target to remove. No deletion is justified by the memory difference alone; preserve the observations for the issuer. A fresh load or ECC test is outside this recovery record.

## Fresh capability test, 16:29 UTC

Under the renewed request for a physical signing test, the coordinator loaded the owned diagnostic once using 128-byte blocks, installed the diagnostic instance and ran 16 cases. All 14 ECC paths returned Java Card `CryptoException` reason 3 (`NO_SUCH_ALGORITHM`) at stage 1. The standard P-256 private/public key, key-pair and ECDSA/SHA-256 creation calls all failed. The diagnostic known-scalar import stopped at EC private-key object creation, before scalar import. SHA-256 of `abc` and creation of an RSA-2048 public-key object passed. Each diagnostic APDU returned `9000`; the per-operation status is encoded in its data.

The coordinator removed the owned diagnostic instance and package. The full authenticated inventory matched the preflight inventory. FF21 and DF25 each reported 44,712 free persistent bytes before this test and 44,864 afterward, matching the earlier 44,864-byte baseline. The helper flagged `memoryMatchesPreflight: false` because it checked equality to the immediate preflight. The difference is an increase of 152 bytes whose cause remains undetermined. The product applet was absent and no P-256 key or signature was produced. No original-package, keyset or lifecycle changes were performed. [All 16 results, CAP/source hashes and original helper status](../../evidence/hardware/2026-11-14-native-ecc-retest.json)
