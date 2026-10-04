# Bun and Aube runtime rules

[Architecture rules](README.md) · [Stack](stack.md) · [CLI contracts](cli.md)

Bun runs all repository JavaScript/TypeScript tasks, tests and native-tool
launchers. Record the pinned Bun version in `.bun-version` and package engines.
Aube remains the sole dependency manager, pinned in `packageManager`; commit its
real lockfile and use `aube install --frozen-lockfile` for repeatable installation.
Use either `aube run <task>` or `bun run <task>` to dispatch scripts. Do not mutate
dependencies with npm, pnpm or Bun, create a second JS lockfile, or introduce
Node/tsx solely to run repository tooling.

Configure Bun to disable implicit dotenv loading and runtime auto-install.
Select Bun explicitly in launchers and package scripts rather than depending on
automatic shebang rewriting. Native prerequisites remain explicit: Bun does not
supply Rust, Android SDK, Xcode, browser binaries or external compression tools.

## Native tools and Windows

Invoke each pinned formatter/type/lint JavaScript entry with the current Bun
executable and a structured argument list, without a shell. This avoids a Node
shebang or `.cmd` wrapper becoming an undeclared runtime dependency and avoids
shell quoting/PATH truncation issues. Preserve the user's PATH.

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
