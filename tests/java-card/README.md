# Product applet tests on a PC

Run `npm run card-sim:setup` then `npm run card-sim:test` from the project root. Node 22 and a JDK are required; set `AGENTSIM_JAVA_HOME` when the JDK is not on PATH. Setup downloads pinned `com.klinec:jcardsim:3.0.5.0` from Maven Central and verifies SHA-256 `5587d55f63d0364ed4da93404595071ad56f09833ded91d7addfd860341bee6b`, then compiles the exact `card/applet` product source with the test bridge. The fixture PIN `123456` is public test data only, never for physical provisioning.

No physical SIM or reader is needed for these product applet tests. The separate [November 15 payment record](../../evidence/near/2026-11-15-live-near-ai.json) has different evidence and scope.

These tests exercise grant and revocation signatures with independent Node verification, PIN and session handling, bounds, and mocked PC/SC transport failures. They run in jCardSim on the computer. A simulator key is generated on the computer and is not protected by a physical SIM. The PC/SC implementation is separate and never substitutes the simulator. Multiple short signing APDUs do not verify transport fragmentation within one APDU.
