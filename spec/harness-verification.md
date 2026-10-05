# Harness verification record

Verified locally on Windows x64 on 2026-10-04. No paid inference or external
publication was performed. These are correctness checks, not performance claims.

| Check               | Result and evidence                                                                                                                                                                                                                                                     |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frozen Aube install | Passed; 156 packages matched the lockfile. Reviewed unnecessary transitive install hooks remain explicitly disabled.                                                                                                                                                    |
| Repository gate     | 122 tests across 18 files passed, with 473 assertions. Formatting, module inventory/graph checks, four strict TS7 programs and type-aware Oxlint passed.                                                                                                                |
| Pi integration      | Actual pinned Pi loop with deterministic provider streams and real temporary files/SQLite. Covers read/write grants, lease revocation, cancellation, turn/tool limits, duplicate IDs, malformed public output/usage, hidden-reasoning exclusion and verified artifacts. |
| CLI/config          | Real subprocess CLI against a loopback daemon: module catalog/model listing, help/version without config execution, strict flags, configuration precedence, disabled ambient layers, workspace/task commands and exclusive digest-checked export.                       |
| Persistence/HTTP    | Restart/queued recovery, competing owners, stale leases, no replay, cancellation cleanup, terminal event reserve, idempotency, overlapping/private paths, corruption, request bounds, Host/Origin/token checks and static asset containment.                            |
| Browser             | Production Vite build in Chromium 153.0.8010.12. Pairing failure/recovery, workspaces, task completion/cancellation, incremental progress, artifact verification, escaped input, narrow layout, disconnect/reload and reconnect.                                        |
| Native              | Four Rust tests passed, including compiled Bun sidecar startup/authentication/shutdown. Actual Windows WebView2 154.0.4258.53 tested restricted IPC, automatic pairing, explicit trusted config with Pi availability, task completion, reconnect and sidecar shutdown.  |

The source-memory extension adds real PDF/DOCX/PPTX/XLSX and Markdown-image
conversion, local and smart-HTTP Git fixtures, image-only changes, conditional
HTTP retrieval, failed-refresh preservation and cancellation cleanup. Persistence
fixtures cover immutable history, bounded pagination, scope isolation, corruption
and verified exports. Public package entry points and scoped Effect cleanup,
subprocess CLI workflows, all eight MCP tools with the official legacy client,
and modern protocol discovery passed. Agent installation tests use isolated
configuration directories and verify conflict handling and idempotence.

The converter doctor reports the pinned packages available in an isolated Python
3.12.15 environment. The distributable skill passed structural validation and an
actual CLI import/sync/historical-read workflow. Its installed project copy binds
this checkout; no account-wide agent configuration was changed. The rebuilt
Windows release sidecar passed converter inspection and an actual HTML-to-Markdown
import/read using an explicit Python path. Its default embedded runtime path does
not locate the checkout's converter, so packaged imports require `--python` or
`TEAMAGENT_IMPORT_PYTHON`.

The memory benchmark increment adds query/migration, positioned PDF text,
Git capacity preflight and evaluator identity/error-accounting regression tests.
It retains 88 reference questions, sequential competitor measurements and 35
native lifecycle checks in the [benchmark report](benchmarks/results.md).
Windows acceptance was rerun: all four Rust tests, actual WebView2 workflow and
managed shutdown passed, and the release application was rebuilt. Its compiled
CLI imported the five-page Czech reference PDF, retained physical-page headings,
returned evidence for a natural-language question and preserved the version on
unchanged sync. The [compiled smoke record](../data/benchmarks/compiled-release-smoke.json)
identifies the executable and PDF hashes. Existing browser acceptance evidence
above remains from the prior harness run; the memory benchmark did not change UI code.

The external-extractor increment adds explicit named profiles across the library,
CLI, MCP server and agent installation bindings. Regression coverage includes
literal arguments, version/provenance changes, media routing, extensionless
documents, contained output, failed refreshes, cancellation and bounded cleanup.
Windows fixtures verify Marker helper termination on success, failure and abrupt
cancellation, including delayed file-handle release. A Git staging-monitor race
now tolerates temporary entries disappearing without suppressing permission,
link or capacity failures. The completed implementation gate passed 163 tests
across 24 files with 658 Bun expect calls, including contained file-URL rebasing,
duplicate image names and one-pass reference rewriting. Real DOCX/HTML fallback,
mixed PDF/DOCX provenance, legacy manifest hashes and metadata tampering are
covered. Genuine isolated Windows Ctrl+C/Ctrl+Break fixtures verify joined
process/staging cleanup, failed-sync preservation and interruption of benchmark
work without fabricated measurements. The fixture explicitly resets inherited
Ctrl+C-ignore state; launcher behavior remains a separate observation.
A real Docling image conversion verified every returned asset reference,
content hash and staging cleanup. The final full extractor matrix completed
144 attempts: 142 successful conversions and two explicit Marker timeouts.
Seventy of 71 successful pairs had identical Markdown; all 71 had identical
annotated quality outcomes. This is calibrated extraction evidence, not a claim
of complete factual or visual fidelity.
Native acceptance was rerun after the lifecycle/provenance changes: all four Rust
tests, actual WebView2 workflow and managed sidecar shutdown passed.
The final release rebuild and its [compiled OCR smoke](../data/extractor-benchmarks/compiled-release-final-smoke.json)
passed extractor version inspection, real scan import with two images, evidence
read and unchanged-version sync. On this Windows host, the separate
[Aube launcher probe](../data/extractor-benchmarks/setup/windows-interruption.json)
requires Ctrl+Break for graceful cancellation; direct Bun processes handle
Ctrl+C when their console enables it. An event suppressed by an outer launcher
cannot activate application cleanup.
The [extractor protocol](benchmarks/extractors-methodology.md),
[runtime setup](benchmarks/extractor-runtimes.md) and
[results](benchmarks/extractors-results.md) and [result audit](benchmarks/extractors-audit.md) retain the separate measurement
and compatibility evidence.

Reproduce with Bun 1.4.2, Aube 2.5.1, Git and Python 3.12:

```sh
aube install --frozen-lockfile
aube run --no-install imports:setup
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
