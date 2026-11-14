# Start an AgentSIM Codex session

Open this repository as the project in Codex and start a new chat after the project configuration has been loaded. Use the following prompt, replacing the bracketed task.

```text
Use this repository's AgentSIM harness. As Astra, read AGENTS.md and
docs/handoff/START-HERE.md, inspect the current branch and plan this task:
[describe the outcome]. Delegate implementation to terra_coder. Give the
resulting revision to sol_reviewer for independent checks. Send any blocker
back to Astra and iterate with the same workers. Report the revision, test
commands, evidence and remaining gaps.
```

On installations with a working native execution backend, this is the interactive CLI form from the repo root:

```sh
codex -m gpt-6-astra "Follow harness/launch.md for this task: review the current card and contract gates and implement the highest-priority open item within my current authorization."
```

The project loads model selections from `.codex/config.toml` and role definitions from `.codex/agents/`. In Codex, inspect the session's active model and each spawned role's model as the session runs. On installations that require project trust for local configuration, open the repository as a trusted project. Signed-in Codex access to all three models is required. This harness uses native Codex delegation with the current session's tools and permissions. [OpenAI custom agent configuration](https://learn.chatgpt.com/docs/agent-configuration/subagents)

## November 14 Windows run

The native CLI root `01a1dade-00c5-78c3-9a18-885df1d462c4` and its planner selected Astra, then reported `registered Core launch requires an installed app` before any task command ran. The coordinator continued in the open desktop session, assigned this project to the existing Astra planner (`gpt-6-astra`), Terra coder (`gpt-6.1-terra`) and Sol reviewer (`gpt-6.1-sol`), and verified the resulting work. A new desktop project chat should confirm the assigned models before delegation. The Windows run verified the app-managed workflow and did not establish fresh CLI discovery of the Terra and Sol roles. The project's configuration is repository-scoped. [Run evidence and test results](2026-11-14-run.md)
