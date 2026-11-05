# Team Agent

A local agent harness with a CLI, React web app and Tauri desktop app. SQLite
owns durable tasks/events; verified artifacts use content-addressed storage.
The execution adapters are a built-in workspace inspection and the embedded Pi
agent loop. Mobile remains deferred.

Speech and media have portable libraries and CLI commands for file STT, TTS,
reference voice synthesis, voice enrollment, audio conversion and bounded
microphone capture. Automatic selection filters capabilities and ranks configured
backends; backend/model/locality overrides remain explicit. Channel input adds
bound envelopes, attachment evidence, durable receipts and speech event state.
See the [runtime guide](spec/media-runtime.md), [channel analysis](spec/channel-input.md)
and [media analysis](spec/media-processing.md).
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

[Repository workflow](spec/workflow.md), [dependency and patch maintenance](spec/dependencies.md),
and [build/verification caching](spec/cache.md) define the imported development
process. The [Trigon comparison](spec/analyses/trigon-process-sync-2026-10-28.md)
records source provenance, review findings and measured limits.

The [installed skill audit](spec/skills-audit.md) records applicable guidance, compatibility caveats and future integration requirements.

Use Bun **1.4.2** and Aube **2.5.1**:

```sh
aube install --frozen-lockfile
aube run --no-install imports:setup
aube run --no-install hooks:install
aube run --no-install step:check
aube run --no-install review:check
aube run --no-install deps:check
aube run --no-install cache:status --json
```

Aube owns dependencies; Bun runs scripts and tests. The installer registers this checkout's Git verification/message hooks and records the Bun path locally. Review/trust the repository lifecycle hooks in Codex separately; installation does not activate trust. Other agents use the same explicit commands and task-level JSON writer. `task:run --help` describes the repository workflow, including explicit repair of a frozen checkpoint and signed publication to the configured Teamagent upstream. Start a logical task before changing files; preserve its baseline through follow-ups.

Verification can reuse matching cooperative results committed under
`.verification/`; use `review:check --force-fresh` to execute every group. Raw
LF/export checks remain live. Web and desktop preparation caches are opt-in
with `--cache`; native compilation and platform acceptance are separate checks.

The [project-aware launcher](spec/project-launcher.md) runs another explicitly
selected project's pinned Bun or Aube with owned process and scratch cleanup.
Use `aube run --no-install project:run --help` for physical runtime overrides,
literal command arguments and optional trusted Windows Mise environment capture.
The host-only API is available through `teamagent/project-launcher`.

Each module exports its public API and CLI descriptor. [Module rules](spec/architecture/modules.md)
enforce those entry points and dependency boundaries. [Reuse decisions](spec/architecture/reuse.md)
record provenance and licensing. Further product work follows the [delivery roadmap](spec/roadmap.md).

Research maintenance: [project settings, repository sync, incremental analysis, and text resources](spec/research-sync.md). Run `aube run --no-install research:sync` to process all stages; incomplete sources remain explicit in their reports. Repository identities live in [git-sources.json](git-sources.json), and analyzed revisions stay in [the review ledger](spec/analyses/README.md). A fresh checkout uses its own `.cache/git`; optional `.env.local` settings select external export imports and a different local cache.
