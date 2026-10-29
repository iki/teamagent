# Build and verification cache contract

This contract transfers the useful parts of [Trigon's cache design](analyses/trigon-process-sync/verification.md) into Teamagent's development tooling. Implementation and measured results must be distinguished from these requirements. The [benchmark record](benchmarks/trigon-process-sync-2026-10-28.json) retains the initial fixed-pin comparison and its limitations.

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
Their compact success files are `.verification/verification-<group>.json`;
local build receipts and locks live in `.cache/verification/`. Status reports
repository-input equivalence and Git-history provenance, not tool readiness or
permission to publish. `cache:verify-staged --index-file PATH` validates an
explicit alternate index. It never substitutes the working tree for staged
receipt inputs.

Normal verification preserves source files, but writes result receipts and
owned fixture/cache outputs. Step formatting is explicit and precedes the
whole-gate source identity. A force-fresh request ignores reusable successes;
a failure cannot leave the same result eligible for reuse. Missing/corrupt
build outputs invalidate a hit. Installed-tool and source identities are checked
again before accepting successful work; source changes during a hit also fail.

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

On Windows, ordinary checks and Git hooks use the same Git-for-Windows `cmd`
launcher from the installation identified by its execution payload. Both the
launcher and core executable remain hashed. The launcher must report that same
payload; missing or linked executables, mismatched payloads and unsupported
installation layouts fail explicitly.
Verification prepends the validated launcher directory to its actual process
path. This avoids treating Git's hook-added core directory as a different
verification toolchain without ignoring executable or environment changes.
POSIX executable selection is unchanged.

The pre-commit hook rejects any staged or working-tree change during review,
including a refreshed result receipt. Successful verification alone does not
authorize committing a different prepared tree; review and stage the changed
receipts before obtaining a new publication proof.

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

Unit children remove repository-local Git overrides and disable inherited
system/global Git configuration while preserving fixture-local configuration.
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

Keep raw LF and text-export integrity checks live initially. They inspect ignored caches, retained originals and exported bytes that a source-tree-only key cannot certify. A Git-canonical text hash does not establish actual LF bytes. Signing, allowed destinations, remote state, credentials and real browser/native/service acceptance also remain live unless a separate exact contract proves which evidence can be reused.

Validate staged verification receipts against the actual index, including alternate-index cases. A checked working tree is not proof of different staged content. The publication proof must bind the final reviewed scope and receipt bytes without making receipt timestamps recursively part of their own input keys.

## Builds

An input hit alone is insufficient for a build. Validate the complete owned output inventory, hashes and modes; missing, renamed, corrupt or extra outputs invalidate reuse. Include configuration, plugins, compiler/tool identity and the build helper's imports in the input scope. Never restore or delete an output directory outside its validated owner boundary.

Preserve Cargo's native incremental system. Cache deterministic preparation stages separately where measured savings justify it. Target, compiler, linker, flags and native prerequisites remain relevant inputs; a cached web bundle does not establish packaged native correctness.

Both build caches remain opt-in. Web reuse verifies the complete `data/web`
inventory. Desktop reuse covers the compiled Bun daemon preparation only;
Vite, locked Cargo/Tauri work and real platform acceptance remain live. The
supplied Tauri lifetime adapter is governed by the [central patch policy](dependencies.md).

## Measurements and scheduling

Preserve all four TypeScript programs and their distinct host/browser/portable environments. A build-mode experiment must first prove equivalent flags and file coverage; do not merge ambient declarations merely to save startup time.

Only suites with audited private state can run in separate processes. Keep unknown suites together, preserve exact file/test coverage, enforce one bounded phase deadline and cap concurrency using available resources. The initial Teamagent experiments isolated the research-Git suite and then analysis-sync; all variants passed the same 359 tests and 1,321 Bun expectations. Node assertion calls are not individually counted by that Bun metric.

The implemented scheduler admits one worker below 2 GiB available memory or
two CPUs, two workers from 2 GiB, and three from 4 GiB with at least four CPUs.
With multiple workers it starts the remaining suites first and isolates the
audited research-Git and workflow suites; three-worker mode also isolates
analysis-sync. Unknown suites stay together in their original order. The
one-worker path retains the original complete file order. All groups share the
unchanged 240-second unit deadline.

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
