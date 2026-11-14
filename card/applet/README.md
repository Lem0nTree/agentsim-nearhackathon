# AgentSIM Java Card applet

The product applet in `src/agentsim/card/AgentSimApplet.java` generates a P-256 key pair on the card at installation and signs supplied message bytes using ECDSA with SHA-256. Both EC key objects receive the P-256 parameters before key generation. The command interface returns the public key and signatures; it has no private-key export command. It uses the card's native Java Card EC key and ECDSA facilities, which must actually be available on the target card. See the dated [physical diagnostic](../../evidence/hardware/2026-11-14-native-ecc-retest.json): it did not demonstrate this product applet running on that card.

A PIN of 6–16 bytes is supplied at installation as application data: one PIN-length byte followed by exactly that many PIN bytes, within the standard GlobalPlatform install parameters. Provision through a protected management channel and a trusted operator process. The applet has no built-in PIN; the public PIN in the off-track test fixture is for PC simulation only. Three failed PIN checks block the PIN. There is no PIN change or unblock command in this prototype.

All application commands use CLA `80`, P1 `00`, P2 `00`, and short APDUs:

| INS | Operation | Input / result |
| --- | --- | --- |
| `10` | Read public key | No data; 65-byte uncompressed SEC1 point (`04 || X || Y`). |
| `20` | Verify PIN | 6–16 PIN bytes; successful validation enables one signing session. |
| `30` | Initialize signing | No data; requires a validated PIN. |
| `32` | Update signing | 1–240 message bytes; requires an initialized signing session. |
| `34` | Finalize signing | 1–240 final message bytes; returns an ASN.1 DER ECDSA signature and clears PIN validation. |

The total streamed message is limited to 4,096 bytes. `ALG_ECDSA_SHA_256` hashes the supplied message once; callers must not pre-hash it. The Node host validates strict DER and converts the signature to 64-byte IEEE P1363 `r || s`, then verifies it against the card's public key and exact input bytes. The host reports card status words rather than substituting a software signer. Wrong CLA returns `6E00`, wrong P1/P2 `6A86`, invalid length `6700`, missing PIN validation `6982`, invalid signing sequence `6985`, and wrong PIN `63Cx` with remaining attempts; unsupported instructions return `6D00`. Errors clear pending signing state and PIN validation. Reset or deselection also clears authorization; the generated key is intended to persist.

The transient input buffer is cleared after every command, and the APDU data area is cleared after PIN commands, including rejection paths. This is a software property of this applet, not a claim of a trusted display, independent user presence or physical side-channel resistance.

## Build and test

Set `AGENTSIM_JC_HOME` to a compatible Java Card Classic SDK containing `lib/api_classic.jar`, `lib/tools.jar` and `api_export_files`. Set `AGENTSIM_JAVA_HOME` if the JDK is not on PATH. Run `npm run applet:build` at the project root. It compiles and converts the applet without installing it; output is ignored under `.build/card/agentsim/card/javacard/card.cap`.

On November 14, 2026 the Java Card 3.0.5u4 converter with JDK 8u504 produced zero converter errors and warnings for this revision; javac reported its source-7 bootstrap-classpath warning. SHA-256 of the product source: `fa9d26eca4f6c0e9e4a7292872aaff77fd5dc5ebe05bca575ce86294c81e9a40`. SHA-256 of that local CAP: `8e75cea2595d0b36f126872d5d914932edec62f341b13c92a785718310f7c31a`. These hashes identify this local build, not a deployed card.

The [off-track emulator instructions](../../off-track/video-emulator/README.md) compile the exact product source into jCardSim and independently verify canonical grant and revocation signatures. They cover invalid headers, PIN/session clearing, chunk boundaries and the 4,096-byte message limit. Multiple signing APDUs are not proof of physical transport fragmentation within a single APDU. No simulator result proves card compatibility.
