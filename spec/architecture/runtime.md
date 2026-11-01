# Bun and Aube runtime rules

[Architecture rules](README.md) · [Stack](stack.md) · [CLI contracts](cli.md)

Bun runs all repository JavaScript/TypeScript tasks, tests and native-tool
launchers. Record the pinned Bun version in `.bun-version` and package engines.
Aube remains the sole dependency manager, pinned in `packageManager`; commit its
real lockfile and use `aube install --frozen-lockfile` for repeatable installation.
After that setup use `aube run --no-install <task>` or `bun run <task>` to dispatch
verification scripts. Aube's `run`/`exec` can install missing or stale dependencies;
`--no-install` prevents a check from quietly changing the dependency state. Put
Aube options before the task name so they are not forwarded to the task.
Do not mutate
dependencies with npm, pnpm or Bun, create a second JS lockfile, or introduce
Node/tsx solely to run repository tooling.

Before an intentional dependency change, inspect the pinned Aube version,
manifest, existing lockfile, workspace configuration and `.npmrc` when present.
Review manifest and lockfile changes together. Preserve the existing lockfile
and workspace choice; importing a new lockfile format is an explicit migration.
Use the pinned local tool through its repository launcher, not a throwaway
`aubx` installation. Missing native builds require inspecting diagnostics and
the dependency's scripts; do not relax build trust or switch linkers merely to
clear an install failure. Registry credentials stay in environment references.

[Dependency maintenance](../dependencies.md) uses Trigon as the central source of
shared-stack patches. Pin and retain applicable supplied artifacts here; another
checkout must not need a sibling repository. A necessary absent, incompatible or
unverified fix requires a user decision before the affected update proceeds.
Automated repair, CI and overrides cannot create an independent workaround.

The [repository workflow](../workflow.md) owns development task scope and signed
publication. The [cache contract](../cache.md) distinguishes local build outputs,
Git-stored cooperative results, and checks that must run against live state.
These maintenance tools do not replace the product's durable task service.

Configure Bun to disable implicit dotenv loading and runtime auto-install.
Select Bun explicitly in launchers and package scripts rather than depending on
automatic shebang rewriting. Native prerequisites remain explicit: Bun does not
supply Rust, Android SDK, Xcode, browser binaries or external compression tools.

## Native tools and Windows

Invoke pinned formatter/lint JavaScript entries with the current Bun executable
and a structured argument list, without a shell. For TypeScript, resolve the
installed native-preview package's matching platform executable and launch it
directly through the owned process supervisor. Validate exact package versions
and physical executable identity; retain both launcher and native-package inputs
in verification fingerprints. This repository launcher selection does not modify
the dependency. The upstream JavaScript wrapper starts another process without
Windows hiding, so hiding only that wrapper does not cover its native child.
These paths avoid Node shebangs and `.cmd` wrappers as undeclared runtime
dependencies and avoid shell quoting/PATH truncation issues. Preserve the user's
PATH. Background launch checks must include descendants and actual tool worker
paths, not only the first process.

Resolve the platform-specific native `tsgolint` executable from the installed
`oxlint-tsgolint` package and pass its path through `OXLINT_TSGOLINT_PATH`.
The resolver must follow the installed package's OS/architecture mapping and
fail clearly if the backend is missing. Never silently turn off type-aware lint
or custom rules as a compatibility fallback. Test the launchers from a path with
spaces and without Node available when changing their resolution behavior.

Bun is an executor, not the TypeScript checker. `tsgo --noEmit` and type-aware
Oxlint remain separate required stages.

## Runtime boundaries

Shared libraries reject Bun-specific imports and globals. Bun's support for a
`node:` API does not make that import portable to browsers or Workers. The
local daemon and host adapters may use Bun APIs behind explicit interfaces;
domain contracts, shared state and worker payloads remain portable.

Browser workers run the browser's engine. Cloudflare runs workerd. Tauri hosts
system WebViews. A Bun development command changes none of those runtimes.
Electron, if ever selected, would still embed its own Node and Chromium.
Run targeted compatibility checks for an actual new Node/bundled consumer; do not
claim Node compatibility solely because it shares TypeScript source.

Bun is the initial host for the TypeScript local control plane, with SQLite and
content-addressed blobs as selected by the system architecture. Keep its HTTP,
WebSocket, database and process APIs in adapters. Measure concurrent requests,
worker cancellation, tracing, persistence recovery and memory on real workloads.
Isolate CPU-heavy or untrusted agent work from the request/render path.

A native shell does not implicitly package a Bun daemon. Packaging a compiled
sidecar or starting an installed daemon requires an explicit IPC/transport
contract, capability policy, platform binaries, signing, asset discovery,
startup/reconnect and shutdown tests. Keep the shell and durable task lifetime
independent.

## Measurements and upgrades

Record the actual engine and version, OS/CPU, browser/WebView version, input
hashes, workload, cache policy and timing boundaries. Under Bun, its emulated
`process.version` is not the engine identity. `node:zlib` under Bun uses Bun's
implementation; preserve the actual original runtime in artifact provenance.

Report a cold or empty-application-cache first call separately from warmed
performance. For repeatable measurements use explicit warmups, serial samples,
median/range and retained raw samples; isolate workloads and record whether HTTP
and data caches are warm. Worker setup, I/O, validation, message transfer and
rendering must be included or excluded explicitly. Verify identical results
before claiming an optimization, and do not relabel results from another runtime.

Keep bounded caches, reuse workers/stores where appropriate and do not claim a
whole corpus fits a cache without measurement. Windows evidence is not
Linux/macOS or packaged-app evidence. A future package-manager migration needs a
lockfile comparison, linking/lifecycle review and fresh frozen installs on
supported platforms; runtime speed alone does not justify one.
