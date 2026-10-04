# Team Agent

[Architecture and source analysis](spec/README.md) covers the eight requested directions, 19 source categories, project reports, contracts, evaluation and implementation sequence.

[Development architecture](spec/architecture/README.md) defines our TypeScript, Effect, Oxc, CLI, web, desktop and mobile choices. [Agent rules](AGENTS.md), [verification](spec/verification.md) and [conversation logging](spec/conversation-logging.md) apply to every implementation task.

Use Bun **1.4.2** and Aube **2.5.1**:

```sh
aube install --frozen-lockfile
aube run hooks:install
aube run step:check
aube run review:check
```

Aube owns dependencies; Bun runs scripts and tests. The installer registers this checkout's Git pre-commit checks and records the current Bun path locally. Review/trust the repository lifecycle hooks in Codex for automatic logging and end-of-turn verification. Other agents use the same explicit commands and JSON conversation writer.

The installed foundation is the toolchain, architecture rules, verification and logging. Product applications remain governed by the [delivery roadmap](spec/roadmap.md).
