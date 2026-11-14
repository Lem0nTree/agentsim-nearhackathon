# Git branches and ownership

The October workspace was a directory tree without a `.git` directory. The maintainer's GitHub inventory contained no older AgentSIM repository during the November 14 check. No historical Git refs were recovered. The dated file manifest supplies the provenance of the imported implementation.

The new repository was initialized separately on November 14. The table assigns responsibilities. To determine which refs have actually been created or pushed, use the commands below. Git records their creation in this repository's history; descriptive workstream names carry no evidence of prior commits.

| Ref | Responsibility | Evidence for the next handoff |
| --- | --- | --- |
| `main` | Integrated, independently reviewed product | Commit ID, gate results and outstanding blockers |
| `work/applet-and-host` | Java Card CAP, PC/SC transport, signer integration and device tests | CAP hash, pinned tool versions and sanitized live results |
| `work/near-vault` | Rust vault, canonical vectors, sandbox and any authorized deployment | Toolchain, build hash, runtime version and outcomes |
| `work/submission` | Product README, rules, asset index and disclosures | Reproducible run instructions, source provenance, publication and form state |

```sh
git remote -v
git branch -avv
git for-each-ref --format="%(refname:short) %(objectname)" refs/heads refs/remotes
git ls-remote --heads origin
git log --all --graph --decorate --oneline
```

For each task, record the actual base and reviewed commit (or uncommitted diff if the change is still in preparation), changed paths, test commands, results, open blockers and next owner. Use `git diff main...work/applet-and-host` with a verified ref for the relevant workstream. Switches and merges belong to the new repository. If two refs initially point to one commit, they have zero divergence. An empty diff at that point establishes no independent implementation or past activity. New topology can be verified without reconstructing a fictional October branch.

Legacy source archive location on the maintainer's machine: `..\AgentSIM` when the new checkout is beside the old folder. The [SHA-256 index](baseline-source-sha256.tsv) uses paths relative to that archive root. The local archive is optional for running the new product.
