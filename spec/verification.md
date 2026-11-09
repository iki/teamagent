# Verification and agent hooks

The root [agent rules](../AGENTS.md) govern implementation. The CLI/web/desktop harness adds [platform evidence](harness-verification.md); unimplemented platforms remain unverified.

## Commands and failures

| Task                          | Command                                            | Contract                                                                                                 |
| ----------------------------- | -------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Reproducible installation     | `aube install --frozen-lockfile`                   | Exact manifest/lockfile agreement; no secondary lockfile                                                 |
| Completed implementation step | `aube run --no-install step:check`                 | Format owned sources, strict TS7, type-aware Oxlint, regression tests                                    |
| Review or delivery            | `aube run --no-install review:check`               | Check formatting, strict TS7, type-aware Oxlint, regression tests; no automatic source fixes             |
| Hook installation             | `aube run --no-install hooks:install`              | Install repository Git hook and record this checkout's Bun executable                                    |
| Conversation archive          | `aube run --no-install conversations:record`       | Read validated JSON from stdin and preserve a public response record                                     |
| Parallel tasks                | `aube run --no-install task:parallel`              | Bounded JSON worktree, PR submission and explicit integration protocol                                   |
| Task workflow                 | `aube run --no-install task:run`                   | JSON begin/checkpoint/revision/verification/publication protocol; exact destination and signature guards |
| Dependency integrity          | `aube run --no-install deps:check`                 | Offline checks of selected Patches artifacts, catalog provenance and pin coverage; no installation       |
| Fresh verification            | `aube run --no-install review:check --force-fresh` | Execute checks even when a cooperative receipt matches                                                   |
| Receipt inspection            | `aube run --no-install cache:status --json`        | Git-history and repository-input equivalence, without readiness or publication claims                    |
| Staged receipt verification   | `aube run --no-install cache:verify-staged`        | Validate changed receipts against the actual staged index                                                |

Either Aube or Bun may dispatch package scripts; Aube alone installs JavaScript dependencies. Complete a frozen install first, then use `aube run --no-install` or direct Bun for checks: ordinary Aube run/exec may install missing or stale dependencies, which is inappropriate inside a read-only verification gate. The check launcher invokes installed tool entries with the running Bun executable and resolves the platform-native `oxlint-tsgolint` backend directly. It does not depend on Node shebangs, shell interpolation, shortened PATH, or fallback to syntax-only lint.

Any missing dependency, nonzero result, timeout or missing backend is a failure. Repair the cause before advancing. Do not turn off type-aware lint, relax strictness, add blanket suppressions or silently skip checks. Research documents in `spec/` and imported material in `data/research/texts/` and historical output in `spec/archive/legacy-research/` remain source evidence; formatting covers owned implementation files and the new development specifications without wholesale research rewrites.

The [cache contract](cache.md) permits exact-input reuse for format, all four
type programs, lint and unit tests. Review preserves source bytes but may write
cooperative success receipts and owned test/cache outputs.
The version-two repository check/task launchers default
`TEAMAGENT_VERIFICATION_CACHE_WRITE` to `local` when unset; legacy low-level calls
default to `tracked`. Explicit `local` routes new
successes to ignored `.cache/verification/` files. Empty or unsupported values
fail. Both modes validate tracked evidence first, then local evidence; tracked
mode can promote a revalidated local hit. Routing is excluded from input keys,
and local mode never rewrites tracked receipts. Pre-commit and workflow final
verification select local writes while preserving exact staged/tree drift checks.
Installed prerequisite identity, dependency artifacts, module layout and raw
LF/export integrity remain live. The test key includes consumed research Python
tools and the distributable memory skill; ignored compiler inputs cannot be
silently omitted. Reuse is not independent verification or publication authority.

Verification actually executes with `LANG` and `LC_ALL` set to `C.UTF-8`; keys
bind those values together with the running runtime's resolved `Intl` locale and
time zone. Other meaningful environment settings remain inputs. Unit workers
drop inherited receipt-write policy so their fixtures use the ordinary default.
Builds retain their ambient locale and bind its raw values separately. The
[cache contract](cache.md#bounds-and-concurrency) defines cumulative bounded
rejection history, legacy migration and invalidation of both receipt stores;
success for different inputs does not clear earlier failed keys, and switching
stores cannot bypass a force-fresh failure.

Use `aube run --no-install step:check --workers 2 --force-fresh` to execute
the full gate with at most two unit processes. The optional --workers flag
accepts 1, 2 or 3; without it, admission remains resource-derived up to three.
It is a cap, not a minimum: initial and live resource checks can admit fewer.
Two and three workers use the same audited batches; one worker preserves the
complete original file order. Research runs first and alone. While any of the
four new multi-step Git scenarios is active, total batch concurrency is capped
at two; a scenario also requires fewer than two already-active batches before
starting. Ordinary audited groups are queued before those scenarios and can
use three slots while none is active, subject to the caller cap, live resources
and the two-workflow-group cap.
The flag changes scheduling only, without
per-batch success reuse, partial receipts, shortened coverage or new deadlines.
A matching complete receipt can still be reused unless --force-fresh is selected.

Tool launches retain their 120-second cap. The complete unit phase, including
every admitted child, has a 720-second cap explicitly approved on 2026-11-06.
The unit runner retains its 120-second per-test default; only the four new
multi-step Git cases for integration, failures, recovery and PR integration
have explicit 180-second limits. The pure PR-admission test and older tests
retain their existing limits. The root Stop hook separately caps its assembled
verification subprocess at 300 seconds. Its outer command budget is 420 seconds,
allowing the unchanged 60-second archive operation and cleanup overhead.
Workflow review retains its 300-second budget, and SubagentStop retains its
90-second outer budget. A timeout is a failed gate, not a skipped check; longer
specialized integration/benchmark jobs need explicit separately bounded tasks.

The independently bounded workflow review and Stop hook may require successful
step evidence for exact-input reuse. A cold or force-fresh run is not guaranteed
to fit their shorter assembled budget. Run the complete step separately first;
reuse still requires matching inputs, prerequisites, output integrity and live
checks, and never turns a partial or timed-out attempt into success.

The resource-aware unit scheduler and audited batches are specified in
the [cache contract](cache.md#measurements-and-scheduling). Every group shares
the same 720-second deadline; parallel execution does not extend it. The live
prerequisite probe permits read-only use of provisioned Python bytecode and
fingerprints its bytes before accepting cache reuse. Environment-honoring unit
fixtures receive fresh bytecode prefixes; isolated converter and OmniVoice
workers use explicit `-I -B` and may read the fingerprinted provisioned bytecode.
Ignored source-tree bytecode fails the live consumed-input check. Isolated
repository-import fixtures use a temporary prefix for those imports.

The [resource contract](resources.md) defines bounded streaming fingerprints,
memory admission, process ownership and temporary-file cleanup. Available
memory is resampled before each admitted batch; less than 1 GiB admits no new
batch. Unrun files fail the phase. Tests keep complete coverage and their
adopted deadlines, including the four explicitly approved 180-second cases.
Managed fixture allocation and a fixture-tested lint rule prevent
new native temporary directories outside the audited ownership helpers.
Only the three validated temporary-parent routing variables are excluded from
verification keys; malformed routing fails the live prerequisite check before
reuse. Temporary paths cannot waive input identity or authorize deletion.
The live prerequisite identity also validates the Windows supervisor's binary
against its source/compiler key and receipt before accepting any cached result.
Corrupt or partial native artifacts require explicit inspection, not automatic
replacement or fallback to weaker process ownership.

The historical 2026-10-28 assembled step check, before the expanded workflow,
dependency and cache suites, passed 358 tests with 1,321 assertions: the
test subprocess took 223.44 seconds and the full check took 266.94 seconds, including
about 38 seconds for the LF inventory and text-export verification. Citation
validation was running concurrently, so this is an observed combined run, not an
isolated performance baseline. The former 240-second assembled limit was below
that successful run; the 300-second budget accommodates the added LF work without
changing check content or the individual tool/test timeouts.

## Automated architecture checks

Source-memory conversion tests require Git, Python 3.12 and the project-local
converter installed with `aube run --no-install imports:setup`. The verification
gate never installs it implicitly and fails when required conversion coverage
is unavailable. Python worker dependencies have their own exact requirements
lock; Aube remains the sole manager of JavaScript dependencies. The full import,
CLI, MCP and library fixtures run without credentials or paid inference.
PowerShell 7 is also required by the local Git maintenance fixtures. Prerequisite
inspection describes the actual runtime and provisioned bytes; it does not
install, repair, or claim that every declared provider route has been exercised.

TypeScript enforces strict mode, unchecked-index safety, exact optional fields, explicit returns, switch fallthrough and override checks. Oxlint rejects `any`, unsafe typed operations, non-null assertions and floating promises. Repository rules guard portable library boundaries, public import paths, hidden I/O/clock/logger setup and Effect execution, unsafe casts, executable input and runtime launchers. The lint implementation is explicitly host tooling, not a portable product library. Tests exercise valid and invalid rule fixtures.

Structural checks are not proof of correctness or a sandbox. Schema and semantic validation, least-privilege capabilities, human review and behavioral tests remain required. Add focused rules and regression fixtures for repeated structural review findings. Keep exceptions narrow and documented at the actual third-party adapter.

## Hooks and scope

The [project-aware launcher](project-launcher.md) is an explicit caller surface.
It does not replace the local hook bootstrap or enable Mise inside a normal
gate. Its helper sources are covered by the verification engine's existing
`app/check` input scope; the launcher identity alone is not reusable success.

- `.agents/hooks/after-step.json` and `before-review.json` describe required workflow commands. They are portable instructions, not undocumented automatic integrations.
- `.githooks/pre-commit` executes review with local receipt writes and validates changed staged receipts against Git's actual active index. It rejects any staged or nonignored working-tree drift and does not fix sources. `.githooks/commit-msg` validates the bounded conventional message. `hooks:install` preserves conflicting hook configuration and stores `teamagent.bunPath` only in local Git configuration. Both hook files must have executable Git index modes for portable checkouts.
- `.codex/hooks.json` registers `Stop` and `SubagentStop` through `app/hooks/stop.ts`. Root recording requires an active changed task; no active task, unchanged work and frozen records are explicit skips. Subagent progress belongs to the root task instead of a separate record. Only root `Stop` checks assembled code; concurrent subagents must not test incomplete shared edits on every completion.
- A failed root check requests one repair continuation. If verification still fails on an already continued stop, it reports the failure without an endless loop. Logging and verification run independently: an archive error cannot skip the code gate, and the hook explicitly reports an unsaved reply. Hook stdout remains JSON; failed operations return relative references to retained sanitized diagnostics.
- Until automatic hooks are trusted and observed, agents invoke the commands and writer explicitly. Installation does not self-approve product hook trust or alter account-wide settings.

The Stop adapter awaits bounded asynchronous subprocesses. Archive work retains
its 60-second/2,000,000-byte limits; review retains its 300-second/16-MiB limits.
On Windows, the shared process runner uses the native Job Object supervisor
described in [resource ownership](resources.md#process-ownership). It attaches
children before execution and joins descendants on normal exit, cancellation
or owner death. The POSIX fallback terminates and joins the owned process group;
abrupt owner death and descendants that deliberately leave that group are not
certified by the Windows fixtures. New Windows receipts identify
`windows-job-object`; historical `windows-child-tree` receipts remain readable
without rewriting them. An unconfirmed termination is a failed hook even if a
status of zero was observed. The 420-second root and 90-second subagent outer
budgets remain unchanged. Metadata-lock acquisition automatically recovers only
an exact confirmed-dead same-host owner under [resource ownership](resources.md#metadata-lock-recovery);
age alone never permits recovery.

Each operation reserves capacity and writes a pending receipt under `.cache/hook-diagnostics/`,
then retains a completed receipt and LF, redacted log with unique names. Receipts
record the host PID, phase, configured bounds, elapsed time, exit status, outcome,
cleanup confirmation and log hash/path. Missing status or cleanup information
stays null. A pending receipt does not prove that the child started or completed.
Raw hook input, environment dumps and unsanitized child output are never saved.
Logs are bounded after redaction as well as during capture; truncation is marked.
`termination: "closed"` means the observed process streams closed and the
reported ownership mechanism confirmed cleanup. A scope label describes the
configured mechanism, including in pending receipts; it is not proof the process
started. Historical receipts retain their original, weaker tree-cleanup meaning.
No receipt certifies unrelated processes or descendants outside its reported
scope. An unconfirmed result retains scratch until process-tree cleanup is
verified; metadata-lock recovery does not satisfy that separate check.
New hook diagnostics have a separate 64-MiB, 4096-file, 1024-operation-slot budget.
A short admission/finalization lock accounts for actual completed files and full
pending reservations, including temporary-file and metadata allowances. It is
released before running a child. Only checked completed publication releases a
reservation; publication failures, abandoned reservations and malformed reservations require explicit
inspection and are never reclaimed by age or PID. Historical
`.cache/workflow/hooks/` evidence remains untouched in the workflow cache.
The main workflow's existing capacity checks are separate per-operation inventory
checks; standalone pre-commit and conversation Git-error writers do not share a
transactional aggregate reservation. The hook budget does not claim otherwise.
These files remain available across a repair continuation. Inspect the named receipt and log before drawing a
conclusion about a timeout, rejection, transport failure or missing dependency.

On 2026-10-28, an observed Stop failure left successful format/type/lint receipts,
no successful unit receipt, an orphan unit process and a dead-owner unit lock.
The former synchronous parent timeout retained no status/timeout diagnostics,
so the exact initial failure remained unconfirmed. Recovery inspected the owned
process tree and preserved the exact lock evidence before removing the stale
lock; no running process or unrelated work was discarded. The asynchronous
runner and child-tree fixtures cover that cleanup and diagnostic boundary.

Signed publication uses the [workflow](workflow.md), which rechecks scope,
destination, actual signature and remote state at the action boundary. A final
check failure does not authorize replacing frozen hashes: use the explicit
checkpoint revision operation, preserve its receipt and verify again. Neither
the Git hooks nor a successful cache lookup independently grants publication
permission or automatically reconciles an uncertain push.

Codex's [official hook documentation](https://learn.chatgpt.com/docs/hooks) defines events, the Windows command override and trust review. The repository enables `features.hooks`. Native transcript formats are not stable APIs; the archiver tests supported event shapes and retains a validated manual fallback.

## Evidence for product work

Cover observable success, typed failures, malformed boundaries, cancellation/resource cleanup, bounded queues/caches and authorization constraints when those behaviors change. Test browser workers in a real browser and Worker deployments against workerd. Native builds require SDK/device or simulator evidence for every claimed platform; record build-only, browser-only and untested states explicitly.

Validate local/HTTP data parity, sizes/hashes/versioning, schema coverage and missing-result semantics where applicable. Keep private values out of logs and public URLs. Benchmarks record actual Bun/browser/native runtime versions, hardware, fixture/source hashes, first-call behavior, warmups, serial samples and spread. Never relabel old evidence or compare mixed methods as a speedup.

## LF text and retained originals

The normal gate checks LF line endings in tracked and untracked nonignored files
plus explicitly owned ignored output roots. Oxfmt formatting remains scoped, but
active research evidence also follows LF. The checker rejects CRLF and lone CR,
fails malformed authored UTF-8, and reports opaque binary/invalid-UTF-8 inputs
without rewriting them. It never follows directory links or traverses installed
dependencies, nested Git checkouts/object stores, or named temporary byte-fixture
roots. Cache metadata receives the same LF check; `.cache/text/exports` is checked
through its export manifests and exact raw/output hashes. The immutable source
blob/DB store retains original input bytes under the memory adapter's version
contract. The public/private line-ending migration manifests bind every retained
historical exception to its exact path and SHA-256; unlisted history receives the
ordinary LF check. The private manifest can separately name narrow historical
opaque inputs: each declaration must name an allowed evidence path, explain the
exception and bind the input and its retained `.bin` original to the same verified
hash. The bytes must actually contain NUL or fail UTF-8 decoding; ordinary valid
text and authored source/configuration cannot acquire this exception.
`.gitattributes` preserves original history bytes across
platform Git settings, while active reports use LF. Explicit binary-extension
attributes also preserve ASCII-only document/media containers; a real-Git fixture
checks every supported extension in both letter cases, active LF text and retained
originals with `core.autocrlf` enabled and disabled. The private `.env.local` file
receives the LF check without logging its contents; any future migration must
retain local settings privately. New owned cache/output roots
must be registered with the checker; no directory-wide imported-text waiver is
created. The owned cache inventory includes benchmark/extractor outputs, web
evidence, launcher probes, immediate cache helper/receipt files and `media-smoke-*`
directories. Installed PyYAML, virtualenvs, compiled third-party packages, models,
benchmark memory stores and explicit document-input fixtures remain outside it;
binary/media files are counted without text decoding. Bounds are 100,000 selected files, 25,000 visited output directories,
32 path segments, 64 MiB per inspected file and 2 GiB per scan. Exceeding a bound
fails explicitly rather than silently skipping files.
