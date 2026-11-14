# Submission package

Build from the reviewed checkout after obtaining a sanitized, verified live proof. The renderer verifies the proof and requires live mode; it produces a 72-second silent video, captions and source metadata. The physical-SIM statement is the project owner's report; the recorded applet runs on a PC and the transfer uses local NEAR test funds. No handset recording or public-chain deployment is claimed. The model response is not attested.

```powershell
python off-track/video-emulator/scripts/render-live-submission.py 'evidence/near/2026-11-14-live-near-ai.json'
python submission/package-release.py --proof 'evidence/near/2026-11-14-live-near-ai.json' --media-dir '.build/submission-package'
```

Node 22, Python, FFmpeg, Arial or DejaVu Sans and the dependencies in the [restricted guide](../tests/near-sandbox/RESTRICTED.md) are required. The reviewed [main replay](video/agentsim-live-demo.mp4), [captions](video/agentsim-live-demo.srt) and [source metadata](video/video-source.json) are also included at those paths in the ZIP. The generated archive remains an ignored local artifact. The exact file allowlist is [package-allowlist.json](package-allowlist.json). `MANIFEST.json` within the archive lists SHA-256 for each other entry, along with the source base commit. The packager prints the ZIP hash. It excludes `.git`, `.local`, `.build`, dependencies, private entry data and credentials. Review the archive and the draft before publishing.

The video metadata's `assistantContentSha256` covers the validated assistant content only. It is not a digest of the entire provider response and does not establish attestation or independently prove origin.
