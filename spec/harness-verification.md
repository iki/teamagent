# Harness verification record

Verified locally on Windows x64 on 2026-10-04. No paid inference or external
publication was performed. These are correctness checks, not performance claims.

| Check               | Result and evidence                                                                                                                                                                                                                                                     |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frozen Aube install | Passed; 142 packages matched the lockfile. Reviewed unnecessary transitive install hooks remain explicitly disabled.                                                                                                                                                    |
| Repository gate     | 69 tests across 12 files passed. Formatting, module inventory/graph checks, four strict TS7 programs and type-aware Oxlint passed.                                                                                                                                      |
| Pi integration      | Actual pinned Pi loop with deterministic provider streams and real temporary files/SQLite. Covers read/write grants, lease revocation, cancellation, turn/tool limits, duplicate IDs, malformed public output/usage, hidden-reasoning exclusion and verified artifacts. |
| CLI/config          | Real subprocess CLI against a loopback daemon: module catalog/model listing, help/version without config execution, strict flags, configuration precedence, disabled ambient layers, workspace/task commands and exclusive digest-checked export.                       |
| Persistence/HTTP    | Restart/queued recovery, competing owners, stale leases, no replay, cancellation cleanup, terminal event reserve, idempotency, overlapping/private paths, corruption, request bounds, Host/Origin/token checks and static asset containment.                            |
| Browser             | Production Vite build in Chromium 153.0.8010.12. Pairing failure/recovery, workspaces, task completion/cancellation, incremental progress, artifact verification, escaped input, narrow layout, disconnect/reload and reconnect.                                        |
| Native              | Four Rust tests passed, including compiled Bun sidecar startup/authentication/shutdown. Actual Windows WebView2 154.0.4258.53 tested restricted IPC, automatic pairing, explicit trusted config with Pi availability, task completion, reconnect and sidecar shutdown.  |

Reproduce with Bun 1.4.2 and Aube 2.5.1:

```sh
aube install --frozen-lockfile
aube run --no-install review:check
aube run --no-install test:web
aube run --no-install test:desktop
aube run --no-install build:desktop
```

Browser acceptance needs Playwright's matching Chromium installed. Desktop
acceptance needs Rust, Windows native build tools and WebView2. The test launchers
use Bun explicitly; they do not install missing dependencies. Native acceptance
is a separate bounded command because platform prerequisites and compile time
do not belong in every agent Stop hook.

Local evidence is retained under `.cache/web-evidence/`: `desktop.png`,
`narrow.png`, `native-webview2.png`, `accessibility.yml` and `trace.zip`.
These generated files are ignored by Git. The Windows release output is
`app/desktop/src-tauri/target/release/teamagent-desktop.exe`, with its adjacent
`teamagent-daemon.exe` and bundled notices. Keep the output files together.

Provider tests use fixtures and deliberately fake credentials for passive model
availability; no live provider transport, actual billing, subscription access,
model quality or real task acceptance benchmark has been established. Native
behavior was exercised in a debug WebView2 build; release compilation is separate
evidence. No signed installer, public redistribution, Linux/macOS native run,
Cloudflare/workerd deployment or mobile implementation is claimed. Complete
redistribution notices for all transitive dependencies remain a release task.
