# Build and verification cache contract

Verification lock acquisition follows the bounded
[automatic metadata recovery protocol](resources.md#metadata-lock-recovery).
Confirmed same-host absent owners retain exact evidence before a new lock is
acquired. A reclaimed lock never clears failed-key history or supplies a passing
verification result. Live, reused, foreign, malformed and unknown owners remain
protected, and all existing deadlines stay in force.

If a lock-owner record cannot be read, a waiting verifier re-observes it within
its existing deadline. It can proceed only after a genuine exclusive acquisition
or the complete recovery protocol above. Persistent denial preserves the lock
and its evidence; it supplies no cache success or recovery authority.

This contract defines Teamagent's build and verification evidence. Implementation and measured results must be distinguished from these requirements. The [adoption record](analyses/trigon-process-sync/verification.md) and [benchmark record](benchmarks/trigon-process-sync-2026-10-28.json) retain the initial fixed-pin comparison and its limitations.

## Commands and evidence

```sh
aube run --no-install step:check
aube run --no-install review:check
aube run --no-install review:check --force-fresh
aube run --no-install cache:status --json
aube run --no-install cache:verify-staged
aube run --no-install build:web --cache
aube run --no-install build:desktop --force-fresh-cache
```

The four cooperative verification groups are format, types, lint and tests.
Their compact tracked success files are `.verification/verification-<group>.json`;
local successes use `.cache/verification/verification-<group>.json`. Local build
receipts and locks also live in `.cache/verification/`. Status reports
repository-input equivalence and Git-history provenance, not tool readiness or
permission to publish. `cache:verify-staged --index-file PATH` validates an
explicit alternate index. It never substitutes the working tree for staged
receipt inputs.

`TEAMAGENT_VERIFICATION_CACHE_WRITE` selects `tracked` or `local`; an unset
variable defaults to `tracked` in the low-level API. The repository check
launcher and task verification supply `local` for version-two policy when unset;
explicit selections remain honored. Empty or unsupported values fail explicitly.
Both modes check tracked evidence first, then local evidence, using the same
schema, current input identity, rejection history and live validation. A miss
writes only the selected store. Tracked mode promotes a matching local success
to the tracked path only after revalidation; local mode never creates or rewrites
tracked receipts, including during force-fresh execution or failure. The policy
controls storage only and is excluded from verification input keys. Portable
success receipts retain their version-one schema; build and nonportable tasks
continue to use only local receipts.

Promotion atomically preserves the exact bounded, schema-validated local bytes,
including valid JSON property order and whitespace. Undeclared receipt fields
are rejected. Non-LF text cannot be promoted; retained evidence is not silently
normalized or overwritten to make it acceptable.

Normal verification preserves source files, but writes result receipts and
owned fixture/cache outputs. Step formatting is explicit and precedes the
whole-gate source identity. A force-fresh request ignores reusable successes;
a failure cannot leave the same result eligible for reuse. Missing/corrupt
build outputs invalidate a hit. Installed-tool and source identities are checked
again before accepting successful work; source changes during a hit also fail.

Each working-tree identity makes two fresh Git inspections: object format plus
repository root, then a tagged NUL-framed tracked/untracked inventory. Validate
complete framing, the actual root, object widths, stages, paths and at most
100,000 combined names before hashing working bytes. Assumed-unchanged and
skip-worktree flags do not waive byte inspection; tracked ignored files remain
inputs. Staged-only receipt validation retains its separate active-index path.
Query batching does not cache an observation or remove the final live reread.

Installed package fingerprints describe the actual provisioned graph, not an
independent attestation of a frozen installation. Direct pins must exist and
match. Declared virtual or absent transitive edges must remain distinguishable,
and later presence changes the identity. Trusted host/OS prerequisites remain
outside the claim of a portable source receipt. The normal gate neither installs
missing prerequisites nor executes a dependency repair.

Installed-file reads bind the original path, opened handle and final path to the
same file identity, mode, size and precise timestamps. Parsed manifests must
match their bytes in the package inventory and remain unchanged on graph revisits.
Serial 64-KiB reads and the stable digest format remain unchanged; parallel
hashing is an unimplemented proposal, not an adopted optimization.

On Windows, ordinary checks and Git hooks discover the same Git-for-Windows
installation through its canonical `cmd` launcher and reported execution payload.
Both executable identities remain live. Missing or linked executables,
mismatched payloads and unsupported installation layouts fail explicitly.
Verification retains canonical launcher PATH normalization, so Git's hook-added
core directory does not select a different installation.

The explicitly selected asynchronous workflow Git adapter may execute the
validated payload directly for the reviewed binary/environment profile. The user
approved this contract revision on 2026-11-08. The adapter verifies complete
executable bytes and physical paths on each selection and prepares only a child
environment matching the admitted wrapper behavior. A bounded discovery cache
retains the installation relationship and baseline fingerprints, but never treats
retained fingerprints as live evidence. Valid
installations outside the admitted profile return canonical execution with an
explicit reason; they do not approximate unsupported wrapper behavior.

Verification also binds the execution profile, current wrapper configuration and
effective environment controls. The per-dispatch environment digest is distinct
from reusable verification identity: raw PATH spelling and Git's hook-added core
entry must not cause false toolchain differences. Synchronous cache Git reads
reuse the same reviewed profile and environment selection. Each dispatch reads
the complete selected wrapper, canonical launcher, core payload and runtime
payload bytes; only same-observation aliases are deduplicated. Missing, changed,
linked or unsupported inputs retain the original `git` command and environment.
An already-selected core payload retains its existing environment without a
second wrapper translation. No discovery process, retained digest, retry or new
verification identity is introduced. Arguments, index overrides, raw byte reads,
strict UTF-8 decoding, errors and the existing 30-second/16-MiB bounds remain
unchanged. Native preparation and launcher keys include the added helper
dependency. Generic process execution is unchanged. See the
[execution review](analyses/git-execution-2026-11-08.md) for the admitted profile,
provenance, parity evidence and measured limits. POSIX selection is unchanged.

Verification executes with `LANG=C.UTF-8` and `LC_ALL=C.UTF-8`, including direct
checks, workflow children, prerequisite probes and unit workers. Its environment
identity uses those same values and also binds the runtime's actual resolved
`Intl` locale and time zone: changing environment variables does not necessarily
change defaults already selected by a running runtime. Meaningful settings such
as `TZ` remain inputs. Building a child environment does not mutate its caller.

The three validated temporary-owner routing fields are excluded from verification
environment keys because fresh child scopes receive new ownership tokens. Their
complete lease and trusted repository root are validated before cache reuse,
including when every verification group is a hit. This exception covers only
`TEAMAGENT_TEMPORARY_ROOT`, `TEAMAGENT_TEMPORARY_PARENT` and
`TEAMAGENT_TEMPORARY_PARENT_ID`; other `TEAMAGENT_` settings remain inputs. Routing
does not establish authority to delete a borrowed parent or to publish a result.

The pre-commit hook and workflow final verification select local receipt writes.
A newly required check can therefore finish without changing tracked evidence
or requiring a new staging cycle solely for that local result. The pre-commit
hook still rejects every staged or nonignored working-tree change during review,
including unexpected changes to tracked receipts. Successful verification does
not authorize committing a different prepared tree; review actual changes, stage
the intended bytes and obtain a new publication proof when the tree changed.

## Cache identities and trust

Local caches hold build outputs and mutable execution receipts. Git-stored `.verification` results are cooperative reviewed evidence for another checkout; they are not independent attestations, authority to publish, or proof that an external service/device remains ready. A force-fresh path must run the actual checks without accepting a success receipt.

Key every result by its task definition, arguments, exact input scope, relevant environment, runtime/platform and consumed tools/prerequisites. Include the complete owned helper closure. Inspect the real source bytes rather than trusting stat-cache hints, ignored changes or a clean-filter process. Paths, modes, filenames and deletions matter. An unrelated document can be excluded only when the check does not consume it; excluding all specifications is not a valid universal optimization.

Tests include the maintained verification-input union, the production Python
tools in `spec/tools/`, and the distributable memory skill consumed by fixtures.
Git-ignored source files still consumed by compiler/build globs cannot disappear
from the key: the implementation rejects undeclared ignored source inputs.
Builds additionally account for relevant ignored dotenv files and Vite
environment values as hashes, never copied secrets. The four TypeScript programs
retain their existing include/exclude semantics.

The current web adapter initializes Vite's production defaults before keying,
preserves explicit `NODE_ENV`, and uses Vite's data-only dotenv loader for the
actual `app/web` environment directory. All four production dotenv files and a
digest of the resolved values are inputs, including expansion from inherited
variables without a `VITE_` prefix. Hit and miss validation rechecks that digest
before publishing success. Config and plugins execute only for an actual build.
Nonempty `DEBUG` is rejected before loading Vite because its environment debug
output can reveal values. Future mode, envDir, envPrefix or environment-sensitive
configuration changes require updating this explicit adapter contract.

Validate inputs before execution and again after success. Never publish success when inputs changed during the run, a child failed, coverage was incomplete or a result exceeded its limits. A historical successful receipt can remain as evidence without matching current inputs. Unknown/shallow Git provenance must remain explicit.

## Bounds and concurrency

Bound file counts, bytes, depth, receipt sizes, process time, log output and concurrent workers. Reject path escapes and unexpected links; external prerequisites need explicit declared ownership. Use atomic output/receipt publication and exclusive per-task locks. Never reclaim a live or unknown owner merely because the lock is old.

Source and output fingerprints stream every byte through 64-KiB buffers. The
fingerprint reader admits at most four open readers and 256 queued requests in
one process; exceeding that queue fails explicitly. This is an I/O bound, not
permission to run more verification children. Reads bind the original file
identity to the opened handle and final path, compare precise metadata and
probe beyond the expected end to reject growth, truncation and replacement.
Caller-specific file and aggregate byte limits remain in force.

Git blob fingerprints retain their exact object-format header and complete raw
bytes. Inventory hashing writes the same ordered JSON array encoding
incrementally, including names, modes, missing entries and directory rows. The
streaming change does not alter the digest format, canonicalize LF, use stat
values as a byte substitute or sample large files. Installed-package inventories
retain their separate serial reader contract described above.

Local rejection history is cumulative per task, with at most 256 unique keys
and a 32-KiB read bound. Legacy single-key records remain readable; updates use
the version-two key set. Success removes only its own rejected key, so a later
result for different inputs cannot revive an earlier failure retained in either
receipt store. Exceeding capacity persists a blocked marker before reporting
failure. Malformed, oversized or blocked rejection state cannot authorize reuse
and requires inspection; entries are never silently evicted to admit a new key.

Explicit invalidation holds the same task lock and rejects both retained valid
receipt keys plus the current input key when it can be computed. If current
inputs cannot be hashed, the retained keys are still rejected before that error
is reported. Restoring earlier source bytes cannot undo that invalidation.

New hook diagnostics use the independently reserved `.cache/hook-diagnostics/`
budget: 64 MiB, 4096 files and 1024 operation slots. Short admission and finalization
locks charge completed bytes or each pending operation's full output/metadata
allowance; no lock spans child execution. Failed or abandoned reservations remain
charged until explicit recovery. This budget does not cover the existing main
workflow cache or move historical `.cache/workflow/hooks/` evidence.
The main workflow's existing 256-MiB inventory checks remain per-operation
admission checks, not a transactional reservation across every writer. In
particular, the standalone pre-commit review log and conversation recorder's Git
error log can be written outside the task workflow lock. The independent hook
budget does not change that guarantee.

Cancellation must terminate and reap owned processes. A displayed summary is not a bound on queued writes or raw output. Retain useful redacted failure diagnostics without credentials or private payloads. Cache failures must be visible; they cannot silently convert into successful verification.

The [resource ownership contract](resources.md) separates disposable scratch
from persistent evidence. Workflow commands, verification tools and unit batches
hold marked scratch until their owned process scope confirms descendant shutdown.
Windows uses atomic Job Object assignment and parent-handle supervision; POSIX
uses an owned process group with explicitly narrower owner-death guarantees.
Unconfirmed shutdown retains scratch and fails verification. Borrowed temporary
parents grant use only. Fresh allocation performs no automatic recovery of old
scratch, workflow locks, rejection history or conversation records.

Unit children remove repository-local Git overrides and disable inherited
system/global Git configuration while preserving fixture-local configuration.
They also remove inherited receipt-write policy so fixture checks retain their
ordinary tracked default, and execute with the normalized verification locale.
Environment-honoring Python fixtures receive a fresh bytecode prefix and disable
bytecode writes. Isolated document and OmniVoice workers explicitly use `-I -B`:
`-I` ignores those environment settings, while `-B` prevents writes but permits
reading provisioned bytecode bound by the installed-input fingerprint. Isolated
fixtures that import repository modules set a temporary prefix for those imports.
Ignored source-tree bytecode is rejected by the live input boundary; it is never
silently excluded from cache identity. The parent environment is unchanged.

The workflow fixture reapplies those Git overrides after the production
environment sanitizer, uses an empty template directory, disables system/global
attributes and selects its own hooks before its first commit. Its Git operations,
signatures and isolated bare-remote pushes remain real.

The prerequisite probe can read existing provisioned Python bytecode, whose
bytes are included in the installed-input fingerprint, but cannot write it.
It removes inherited external bytecode prefixes before importing converters.
These are separate modes; the probe does not establish a fresh-prefix claim for
isolated workers. No launch changes installed packages or removes their bytecode.

## Live checks and staged publication

The explicit [project launcher](project-launcher.md) exposes a streaming helper
identity for external consumers. It contains no environment snapshot or
successful result. Each consumer still binds its selected project, runtime,
arguments, meaningful environment and outputs. Teamagent's normal verification
already binds the whole `app/check` helper scope, and keeps prerequisite,
temporary-routing and native-artifact validation live. Mise is not evaluated by
cache lookup, normal checks or hooks.

Windows supervisor artifacts may be copied from the physical primary only
through the complete immutable-artifact contract in [resources](resources.md).
This makes actual binary bytes equal across related checkouts without dropping
their hashes from prerequisite identity. The importing implementation's source,
preparation/topology helpers, compiler/configuration, framework references,
architecture and runtime remain key inputs. Per-checkout executable paths,
completion scratch and mutable app/build outputs stay local. Artifact equality
does not establish equal verification inputs or grant reusable result authority.

Keep raw LF and text-export integrity checks live initially. They inspect ignored caches, retained originals and exported bytes that a source-tree-only key cannot certify. A Git-canonical text hash does not establish actual LF bytes. Signing, allowed destinations, remote state, credentials and real browser/native/service acceptance also remain live unless a separate exact contract proves which evidence can be reused.

Validate staged verification receipts against the actual index, including alternate-index cases. A checked working tree is not proof of different staged content. The publication proof must bind the final reviewed scope and receipt bytes without making receipt timestamps recursively part of their own input keys.

## Builds

An input hit alone is insufficient for a build. Validate the complete owned output inventory, hashes and modes; missing, renamed, corrupt or extra outputs invalidate reuse. Include configuration, plugins, compiler/tool identity and the build helper's imports in the input scope. Never restore or delete an output directory outside its validated owner boundary.

Preserve Cargo's native incremental system. Cache deterministic preparation stages separately where measured savings justify it. Target, compiler, linker, flags and native prerequisites remain relevant inputs; a cached web bundle does not establish packaged native correctness.

Both build caches remain opt-in. Web reuse verifies the complete `data/web`
inventory. Desktop reuse covers the compiled Bun daemon preparation only;
Vite, locked Cargo/Tauri work and real platform acceptance remain live. The
supplied Tauri lifetime adapter is governed by the [central patch policy](dependencies.md).

Build execution retains its ambient locale. Its keys and final prerequisite
validation separately bind the actual `LANG` and `LC_ALL` values rather than
inheriting verification's normalized-locale equivalence. Runtime `Intl` defaults
also remain bound. A locale change can therefore invalidate a build result even
when normalized verification would reuse its own evidence.

## Measurements and scheduling

Preserve all four TypeScript programs and their distinct host/browser/portable environments. A build-mode experiment must first prove equivalent flags and file coverage; do not merge ambient declarations merely to save startup time.

Only suites with audited private state can run in separate processes. Keep unknown suites together, preserve exact file/test coverage, enforce one bounded phase deadline and cap concurrency using available resources. The initial Teamagent experiments isolated the research-Git suite and then analysis-sync; all variants passed the same 359 tests and 1,321 Bun expectations. Node assertion calls are not individually counted by that Bun metric.

The implemented scheduler refuses new work below 1 GiB available memory, admits
one worker from 1 GiB below 2 GiB or with fewer than two CPUs, two workers from
2 GiB, and three from 4 GiB with at least four CPUs. Available memory is the
smaller of host free memory and the runtime's process-available estimate. Unknown
availability remains conservatively sequential. Admission is checked again
before each batch. If memory falls below the floor, running children are joined;
queued files remain explicitly unrun and verification fails without a receipt.
The check launcher's optional --workers 1, 2 or 3 caps unit processes.
Without it, the default remains resource-derived admission up to three.
The effective initial count is the smaller of the requested cap and resource
admission; live memory checks can lower it further before each batch. Selecting
two workers uses the same complete audited inventory as three, so fewer workers
do not fold isolated suites back into an oversized remaining batch. One worker
keeps the complete original file order. This option changes scheduling only:
there is no per-batch success cache, partial receipt or coverage reduction.
Existing complete exact-input receipts remain eligible; use --force-fresh to
measure an executed run.

Research Git runs first and alone in both parallel-worker inventories.
No other batch can start until it settles, including failure; research also
requires an otherwise empty active set. The one-worker path remains one complete
batch in the original discovery order.
Both parallel-worker counts use the same fixed queue after research: remaining
suites, workflow, workflow revisions, verification cache, analysis sync,
pre-commit, imports, owned launchers (native lifetime, both owned process suites,
project launcher and environment), bootstrap, and HTTP cache plus memory CLI/MCP.
The longer ordinary groups lead this queue to reduce staggered admission of the
later heavy groups. This is a fixed priority based on retained observations,
not runtime duration prediction or a guarantee that a run fits its deadline.
The four new heavy scenario batches follow those ordinary audited groups:
parallel integration, failures, recovery and PR integration. Bootstrap pairs
the start/registry and policy-migration tests in one separately audited batch.
At most two of the seven workflow groups (workflow, workflow revisions and the
five parallel-workflow groups) can run at once. The four new multi-step Git
scenario batches (integration, failures, recovery and PR integration) also cap
total active batches at two whenever any of them is running. A scenario can
start only when fewer than two batches are already active, so entering this
phase cannot exceed that cap. Before any scenario starts, compatible ordinary
groups can use three slots, including bootstrap and older workflow groups while
retaining their two-workflow cap. A scenario may overlap one earlier ordinary
batch still running. A caller-selected two-worker cap stays at two throughout.
Each available slot takes the first compatible queued batch, so later work can
proceed while an earlier batch waits for capacity. With the complete inventory,
remaining, workflow and workflow revisions start after research when three
workers are admitted. Existing running children are
never interrupted to change admission.
Eligibility is released only after an active batch settles; every admitted
child is still joined before the scheduler reports failures. This contention
policy is not a measured speedup claim and changes no memory or time limit.
These suites use private fixtures; process-local mutations are restored,
network fixtures bind ephemeral loopback ports, and native artifact publication
retains its ownership lock while complete warm artifacts require full live
validation. Parallel workflow groups use separate bare remotes, keys, worktrees
and registries. Only independent source publications within one fixture overlap,
with a maximum of two joined publishers before shared main or hooks change.
Unknown suites stay together in
their original order, every file belongs to exactly one batch, and the one-worker
path retains the original complete file order. All groups share the
1,680-second unit deadline. The runner's default remains 120 seconds per test;
the four new multi-step Git scenarios (integration, failures, recovery and
PR integration) have explicit 240-second limits. The first research maintenance
scenario separately uses the [180-second child and 185-second case](verification.md)
allowance; other older cases retain their existing limits. Live admission still caps all active workers at three and
workflow groups at two, with the research exclusion described above. The
one-GiB floor is a conservative admission policy, not a measured optimum.
Historical samples below describe the policy in force when those samples were
collected.

The user approved the shared phase increase from 240 to 360 seconds on
2026-11-02 after measured full runs exhausted the previous budget despite
passing individual batches. Coverage, individual test limits, the three-worker
cap and exact-input reuse requirements remain unchanged. The
[import and repair report](analyses/project-launcher-sync-2026-11-02.md) retains
the failed attempts and optimization evidence. Assembled hook/workflow budgets
remain independently bounded; obtain successful step evidence before their
shorter review/publication checks, which may reuse only validated exact inputs.

On 2026-11-06 the user approved increasing only the shared unit phase from 360
to 420 seconds for the expanded parallel-workflow suite. One 360-second attempt
completed about 969 worker-seconds before three remaining groups reached the
shared deadline without assertion failures; a later memory-constrained run
admitted only two workers. The task record retains those distinct observations.
Individual test limits, complete coverage, live memory admission, the three-worker
cap, force-fresh behavior and the shorter hook/workflow review budgets are
unchanged. This approval does not make incomplete verification successful.

Later on 2026-11-06, the user explicitly approved a 600-second shared unit phase
and 180-second limits for only the four new multi-step Git cases: signed task
integration, conflict/verification failure handling, uncertain-push recovery,
and PR integration. The separate pure PR-admission test, older tests and the
120-second runner default retain their existing limits. The preceding run
completed 1,139.62 worker-seconds across finished batches; four new Git cases
reached their 120-second limit, and three batches remained unfinished at the
420-second phase deadline. Worker durations overlap and are not the elapsed
phase duration. Complete coverage, live memory thresholds, the overall
three-worker cap, the two-workflow-group cap, research exclusion and exact-input
reuse remain unchanged. Root Stop review remains bounded at 300 seconds, its
outer command at 420 seconds, and workflow review at 300 seconds. The task
record retains the attempts and approval; a timed-out or unfinished run still
cannot produce successful verification evidence.

On 2026-11-06, the user explicitly approved increasing only the shared unit
phase from 600 to 720 seconds. The four new multi-step Git cases retain their
180-second limits; older cases and the 120-second runner default retain their
existing limits. The overall three-worker cap, two-workflow-group cap, temporary
two-batch cap while heavy scenarios run, research exclusivity, live memory
thresholds and complete coverage remain unchanged. Root Stop review and workflow
review still have 300-second budgets, and the root hook outer budget remains
420 seconds.

The preceding 600-second attempts were incomplete. An explicit two-worker run
passed research and all four new Git scenarios, but workflow revisions,
verification cache, pre-commit, analysis sync and imports did not complete by the
shared deadline. Those four scenarios accumulated 493.65 worker-seconds in that
run; overlapping worker durations are not a phase elapsed time or a prediction
for another run. The subsequent automatic schedule ran research exclusively,
ordinary groups before heavy scenarios, and at most two batches while a heavy
scenario was active. Every ordinary batch passed, followed by integration in
147.05 seconds and failure handling in 159.54 seconds. Recovery and PR remained
incomplete when the 600-second phase expired. No assertion failures were observed
before that phase abort, and all scheduled descendants were joined. These
partial successes do not constitute a passed full gate. The extra phase budget
allows more time for the retained schedule, including exclusive research and
bounded heavy work; it does not change admission limits or certify the next run.

On 2026-11-09, the user explicitly approved increasing only the shared unit
phase from 720 to 960 seconds. Individual test limits, complete coverage, live
memory admission, the three-worker cap, two-workflow-group cap, temporary
two-batch heavy-scenario cap and research exclusivity remain unchanged.
Force-fresh behavior and complete-input reuse remain unchanged. Workflow and
root Stop review still have 300-second budgets; the root Stop outer budget
remains 420 seconds. This approval does not certify an incomplete attempt or
predict the outcome of a later run.

On 2026-11-10, the user-approved shared phase allowance increased from 960 to
1,440 seconds. The completed research batch took 159.86 seconds and the ordinary
71-file batch took 652.05 seconds; all four heavy Git files remained unfinished
at the phase deadline. All scheduled children were joined. A planning comparison
with the previously measured heavy work, plus the two reviewed fixture bounds,
left insufficient margin at 1,200 seconds; overlapping worker timings are not
an exact elapsed prediction. The 1,440-second bound preserves every scenario,
worker/resource cap and the independent review/Stop limits. The direct step
owner allows 1,800 seconds for the complete command and owned cleanup; it does
not extend the unit phase or certify the next result.

Later on 2026-11-10, the standing approval for needed limits extended the shared
unit phase from 1,440 to 1,680 seconds (28 minutes) and the same four heavy Git
cases from 180 to 240 seconds. In the preceding complete step, all four reached
their 180-second case limits without exhausting the shared phase. A subsequent
serial diagnostic run passed integration in 177.30 seconds, recovery in 128.85
seconds and PR integration in 128.31 seconds; the separate pure PR case passed.
The failure-handling case timed out at 180 seconds, then its callback emitted
further stage records through 188.711 seconds. That continuation is not a passed
case. The run finished with four passes and one failure across five cases; one
small integration trace segment was clipped, so the retained trace is partial.

The extra 240 phase seconds equal the four additional 60-second case allowances
in worker-seconds, not a prediction of elapsed time or a guarantee of completion.
The subsequent direct step has a 2,100-second owner for its complete command and
owned cleanup. Assertions, nested command limits, the 120-second runner default,
worker/resource caps and independent workflow/Stop limits remain unchanged.
These allowances do not resolve the earlier after-hook cleanup errors or prove
that the next complete gate will pass. All scheduled children must still be
joined, and uncertain shutdown retains its marked scratch.

When `GITHUB_ACTIONS=true`, verification executes rather than reusing tracked,
local or nonportable passed receipts, even when every input matches. Storage
routing and rejection history still apply. Local reuse outside Actions and
integrity-validated build reuse remain unchanged. Isolated unit workers remove
the outer Actions flag so private fixture repositories can exercise both
policies; the parent verification runner retains it.

On 2026-11-01, the regrouped Windows full step check completed in 317.896 seconds
with exit zero and confirmed closed process scope. Bun 1.4.2 (`744846f84`)
executed all 67 files through three workers: 516 tests passed, none failed, and
the existing POSIX-only test was skipped. The remaining 63-file batch completed
in 194.88 seconds, verification-cache in 64.36 seconds, and workflow in 204.95
seconds; batch times overlap and are not the whole-check duration. Format,
types, lint, tests and live LF/export checks all passed. The portable
[measurement record](data/research-maintenance-2026-11-01.json) retains the
receipt/log hashes, runtime evidence and preceding failed/interrupted attempts.
A later step after creator-owned scratch recovery and repository case-ID fixes
passed 519 tests across the same 67 files in 276.208 seconds, also retained in
that record. These changed-source samples are not a controlled speedup comparison
or machine-cold measurements.

A later November 1 reconciliation run reached the unchanged unit deadline in
the workflow suite after 15 of its 16 cases passed. A fixture-only optimization
replaced eleven configuration setter processes with an explicit per-fixture LF
Git template and one exact parsed-value check. The bare remote still receives
an empty template; each working fixture retains its own key, hooks, unsigned
baseline commit and real signed publication. No test case or deadline changed.
On Bun 1.4.2 and Git 2.56.0.windows.4 on Windows x64, a configuration-only
comparison used one labeled warmup per method followed by three samples each.
The measured medians were 2,032.94 ms for initialization plus eleven setters
and 396.89 ms for template writing, initialization and parsed-value validation
(12 versus two Git processes). Baseline value validation was outside its timed
region. These are warm local setup measurements, not whole-suite speedup or
production signing performance. Exact source hashes, all samples and subsequent
behavioral checks are retained in the
[reconciliation measurements](data/research-reconciliation-2026-11-01.json).

The first assembled process-transfer check timed out at that deadline after
394 tests across 51 files had passed, before completing the workflow suite.
It admitted one worker because memory was below the floor. This remains failed
verification, not a reusable partial success. A later ordered prerequisite pair
took 70.138 seconds with a fresh bytecode prefix and 50.890 seconds using the
provisioned bytecode; all seven installed-input identities matched. Memory at
the two starts was 1,827,201,024 and 2,062,602,240 bytes. This single pair retained
OS caches and had differing available memory; it is not a repeatable speedup
estimate or evidence that a full grouped gate passed.

A second full attempt also admitted one worker and exceeded the same deadline
after 401 passing tests, including six workflow fixtures. Its complete capture
took 317.515 seconds. No individual test had failed before cancellation; this
still does not satisfy the full gate. Memory measured afterward was 859,037,696
bytes. The resource floor and deadlines were preserved.

A later fixture-setup experiment retained all fifteen workflow tests and removed
110 setup-only Git launches by static count. The fresh baseline passed in
85.703 seconds; the candidate timed out in one unchanged 30-second test, followed
by a transport failure (13 passes, 119.672 seconds overall). Both runs began at
99% memory load, with 227,115,008 and 258,625,536 bytes available. This pair
establishes no benefit. The exact original fixture was restored; both source
versions and captures are retained. Further performance experiments are deferred.

Observed initial elapsed times were 207.281 seconds sequential, 151.016 seconds in two groups and 128.109 seconds in three groups. These were single, memory-constrained samples with slightly different evidence-collection timing boundaries. Controlled repeats were refused below a conservative 4 GiB experiment floor. Do not treat that floor as a measured production optimum or these timings as a guaranteed speedup.

Warm web builds measured 0.469–0.938 seconds. Measure input/output-inventory overhead before enabling a build cache for that workload. Report first application-cache misses, unchanged local hits, fresh-checkout hits, mutations, missing outputs and invalid receipts separately. Preserve failed experiments and original runtime/source provenance; never label warm OS caches as machine-cold.

The corrected real web adapter passed all five production-entry measurements:
1.000 seconds uncached, 55.031 seconds force-fresh with cache validation,
44.109 seconds for a validated hit, 48.969 seconds rebuilding a missing
`data/web/index.html`, and 53.953 seconds rebuilding a modified one. All five
complete output inventories were identical. These are single OS-warm samples
under memory pressure. They support keeping caching opt-in for this small build;
the observed hit costs substantially more than rebuilding. The earlier rejected
build and its `NODE_ENV` diagnosis remain retained evidence.

The desktop production test entry passed a force-fresh daemon preparation and
validated hit in 125.469 and 72.031 seconds respectively. The daemon output
inventory was identical; Vite and locked Cargo tests ran on both paths. Those
whole-command times include native compilation and its incremental cache, so
their difference cannot be attributed solely to daemon reuse. Separate real
browser and Windows WebView2 acceptance passed in 10.563 and 49.282 seconds.
The [implementation measurements](benchmarks/trigon-process-implementation-2026-10-28.json)
retain source identities, runtime details, failed attempts and per-output hashes.

## Repository-shared verification results

Explicitly selected portable, output-free verification groups may use the new
`.cache/verification-results/v1/` store in the canonical primary checkout. The
primary and each registered task or detached integration candidate must resolve
to the same physical common Git directory. Repository URL equality is insufficient.
An unregistered, redirected, ambiguous or uncertain worktree cannot use this store.
The four production format/type/lint/test groups opt in; generic tasks remain
local unless explicitly selected. Build outputs, logs, scratch, task records and
final/publication proofs remain local. CI continues to execute checks, while its
actual starts and outcomes still participate in same-key failure ordering. CI
status never exempts a genuine failure from invalidating another worktree's
older success.

The storage selector does not enter the definition key. Every actual raw source,
engine helper, definition, environment and installed-prerequisite input remains
mandatory. Workflow ownership helpers are part of the engine source projection.
A matching source tree is insufficient when the supervisor binary, installed
packages, tool identity or execution environment differs. No old cache is copied
into this initially empty namespace, and no supervisor hash is omitted.

All four production groups currently receive the same complete prerequisite
array, including the Python environment identity. Independently provisioned
worktree environments can contain different actual bytes, including Python
bytecode (`.pyc`), even when their package versions match. Such a difference
prevents reuse for format, types and lint as well as tests. All four groups are
eligible to share results only when their complete source, prerequisite and
execution-environment identities match; ordinary separate installs do not
guarantee a shared hit. Identities are not normalized to manufacture equality.

The prepared cross-worktree production acceptance procedure explicitly selects
one common Python executable with `TEAMAGENT_TEST_PYTHON` in both worktrees while
retaining its complete environment fingerprint. It exercises actual shared native
artifacts and complete prerequisite equality for that configuration. A passing
run establishes reuse for that explicit common-Python configuration only; it does
not establish equality or cache-hit rates for independently provisioned Python
environments.

A short common key lock protects a generation head plus immutable starts and
outcomes. Begin advances the generation before execution and blocks older
shared, local and tracked successes. Actual checks run outside metadata locks.
Full native discovery and registry enumeration also stay outside these locks;
inside validation reads only physical bindings, bounded Git metadata and the
selected registration. Native atomic registry temporaries are independently
bounded and never ownership candidates. A proven atomic entry replacement gets
at most three consistent-snapshot attempts; missing or corrupt ownership rejects.
Before accepting reuse or publishing fresh success, a complete registry refresh
runs outside locks to reject new ambiguity and malformed metadata. The captured
directory revision is checked cheaply inside metadata operations. Routine
inventory churn refreshes outside locks within fixed bounds, including during
failure recording; actual transition failures are never automatically replayed.
Only a successful attempt that still owns the current generation can publish a
reusable result. Every failure advances the current generation, including an
older attempt failing after a newer success. A stale success cannot erase a
later failure. A fresh exact-input execution can supersede an unfinished attempt
while preserving its evidence. Existing local cumulative rejection remains
independently authoritative; another checkout's success cannot clear it.

Production group execution leaves its shared generation running until the
complete gate repeats its installed/native/Python prerequisites and passes its
live LF/export and whole-source checks. It writes neither local nor tracked
success and clears no rejection before this barrier. No additional per-group
Python probe is introduced. Completion reacquires the local task lock, refreshes
ownership and source identity, and publishes local evidence only when the shared
attempt still owns the current generation. An older pending success cannot clear
a later same-checkout failure, even if both failures have identical rejection
bytes. Any gate or completion failure settles all pending attempts and rejects
the captured identities of all four groups, including reused ones; uncertain
metadata publication remains explicit retained failure evidence. Generic callers
with complete live validation may still publish their own success immediately.
The gate retains every consumed group's exact returned key, including shared-only
hits that create no local receipt. Failure adds that captured key to invalidation
alongside current and retained local identities, even if source mutation or an
unreadable input prevents reconstructing the identity that was actually reused.

A retained transaction marker means metadata publication is unconfirmed and
fails closed. Unknown locks are never reclaimed. Exact confirmed-dead metadata
owners follow the automatic recovery protocol; this never clears transaction
markers, running generations, failed results or reserved evidence. An execution
crash alone does not establish metadata ownership or process absence.
Lookups validate strict bounded LF
metadata, the pointed immutable receipt and unchanged head after live input
validation; orphan artifacts never establish success. Successful receipts retain
the version-one schema. Staged-index and all external readiness checks stay live.

The store reserves at most 1,024 full-key slots and 8,192 attempts, with at most
64 KiB for each immutable successful receipt and 2 KiB per metadata record. Starts
reserve their terminal record, including unfinished attempts. These reservations
remain below the existing 25,000-file and 256 MiB aggregate limits. No normal
lookup or admission prunes failures, starts, outcomes or successes.
An atomic repository-bound reservation account retains counts even if an admitted
writer crashes before creating its start. Full inventory checks run outside every
lock and bind the reservation generation. Admission compares that generation
under the short lock, reserving slots without enumeration. Lock order is key then
admission; no owner waits for a key while holding admission. Changed snapshots
get at most three attempts outside locks. Missing or unconfirmed reservation state
in an existing namespace is an error, never permission to recreate counts.

A process orders only its shared admission transitions, from fresh inventory through reservation and start publication, by the physical repository identity. At most 64 active or waiting admissions exist across that process; overflow fails explicitly, and both successful and failed settlement remove empty queues. Actual checks, result inspection and completion remain outside this queue. Other processes still use the unchanged short metadata locks and three snapshot attempts. No queue survives settlement or increases a caller deadline.

At capacity, a strict repository-bound unavailable marker visibly disables all
shared-task reuse, including old local/tracked receipts. Checks still execute
fresh and retain failures. Deferred production checks publish no new local or
tracked success and clear no rejection while this marker is present: capacity
mode has no execution generation with which to prove local ordering. Generic
immediate callers retain their existing local-result behavior. A later successful check does not
remove that marker or silently restore reuse. Explicit reviewed maintenance is
required; corrupt state, redirected ownership and unknown locks remain errors.
No deadline, test coverage, worker maximum or memory admission changes.
