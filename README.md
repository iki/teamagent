# Team Agent

A local agent harness with a CLI, React web app and Tauri desktop app. SQLite
owns durable tasks/events; verified artifacts use content-addressed storage.
The execution adapters are a built-in workspace inspection and the embedded Pi
agent loop. Mobile remains deferred.

Source memory imports URLs, documents, images, folders and Git repositories,
retains versions, and exposes retrieval through the CLI, MCP and a library API.
See [memory and import commands](spec/memory-imports.md) for conversion and agent installation.
Document conversion supports named option profiles for xberg, Marker, MinerU,
Docling and OpenDataLoader PDF through an explicitly selected trusted
[extractors configuration](extractors.config.ts). The
[extractor benchmark](spec/benchmarks/extractors-methodology.md) measures recovered
annotated information and speed for each option set. Its
[results and recommendations](spec/benchmarks/extractors-results.md) retain separate
digital-PDF and scanned-document results with an audit of apparent misses.
The [memory benchmark protocol](spec/benchmarks/methodology.md) defines frozen coding
and PDF tasks, real reference-system adapters, development/holdout separation and
reproduction commands. The [measured results](spec/benchmarks/results.md) retain
88 questions, before/after runs, reference comparisons and remaining limitations.
`aube run --no-install benchmark:memory --help` lists the runner.

```sh
aube install --frozen-lockfile
aube run --no-install build:web
aube run --no-install cli harness serve
```

Open the printed loopback address. In another terminal, run
`aube run --no-install cli harness token` to get the browser pairing token.
The browser keeps it in memory; the service keeps running after a disconnect.

```sh
aube run --no-install cli workspaces add /absolute/project/path --name Project
aube run --no-install cli tasks add "Inspect the workspace" --workspace WORKSPACE_ID
aube run --no-install cli tasks show TASK_ID
aube run --no-install cli artifacts export ARTIFACT_ID --output result.json
```

Inspection inventories files without a model. To run Pi objectives, choose a
model with `cli agents models`, supply the provider key in the environment and
start with an explicit trusted `--config` file. The [harness contract](spec/harness.md)
documents commands, configuration, file grants, budgets and recovery.

`aube run --no-install build:desktop` builds the native application and its Bun
sidecar, using Rust and the platform's Tauri prerequisites. On Windows, start
`app/desktop/src-tauri/target/release/teamagent-desktop.exe`; keep the adjacent
daemon executable and resources together. Desktop pairs automatically and stops
its service on exit. Set `TEAMAGENT_CONFIG` to an absolute trusted configuration
file before starting desktop to select a Pi model.

Platform acceptance commands are `aube run --no-install test:web` and
`aube run --no-install test:desktop`. See the [verification record](spec/harness-verification.md)
for actual browser/native evidence and live-provider limitations.

[Architecture and source analysis](spec/README.md) covers the eight requested directions, 19 source categories, project reports, contracts, evaluation and implementation sequence.

[Development architecture](spec/architecture/README.md) defines our TypeScript, Effect, Oxc, CLI, web, desktop and mobile choices. [Agent rules](AGENTS.md), [verification](spec/verification.md) and [conversation logging](spec/conversation-logging.md) apply to every implementation task.

The [installed skill audit](spec/skills-audit.md) records applicable guidance, compatibility caveats and future integration requirements.

Use Bun **1.4.2** and Aube **2.5.1**:

```sh
aube install --frozen-lockfile
aube run --no-install imports:setup
aube run --no-install hooks:install
aube run --no-install step:check
aube run --no-install review:check
```

Aube owns dependencies; Bun runs scripts and tests. The installer registers this checkout's Git pre-commit checks and records the current Bun path locally. Review/trust the repository lifecycle hooks in Codex for automatic logging and end-of-turn verification. Other agents use the same explicit commands and JSON conversation writer.

Each module exports its public API and CLI descriptor. [Module rules](spec/architecture/modules.md)
enforce those entry points and dependency boundaries. [Reuse decisions](spec/architecture/reuse.md)
record provenance and licensing. Further product work follows the [delivery roadmap](spec/roadmap.md).
