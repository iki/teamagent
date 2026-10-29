# Trigon cache and verification transfer audit — 2026-10-28

Analysis only. No builds, tests, benchmark runs, source changes, dependency changes, staging or publication were performed by this audit. The parent coordinates executable measurements and user decisions.

## Evidence and scope

Source: [Trigon](https://github.com/iki/trigon), revision `454e372cbc6bb75eafbbc4795391c492bc4fbf96`; Teamagent comparison baseline `176569773` supplied by the parent. The central snapshot is `.cache/review-2026-10-27/trigon-sync-2026-10-28/snapshot.json`. The source worktree has mutable `.verification` receipts; those are examples of the format, not evidence for Teamagent, and must not be imported as successful Teamagent results.

This audit additionally retained 28 source files (161,291 bytes) under `cache/captures.json`, with original and LF hashes. All were already LF. Twenty-seven match the central snapshot exactly; `test/repository-fixture.ts` is an additional read-only working-tree capture. The inspected source/test contracts are distinguished below from runtime behavior, which was not exercised here.

Read contracts: Teamagent `AGENTS.md`, `spec/architecture/stack.md`, `spec/architecture.md`, `spec/roadmap.md`, `spec/architecture/runtime.md`, `spec/verification.md`; Trigon `AGENTS.md`, `spec/stack.md`, `spec/cache.md`, `spec/cache-intro.md`, `spec/development.md`, `spec/development-intro.md`, `spec/runtime.md`. Oxc skill examples do not override Aube ownership or pinned runtime APIs.

## Current difference

Teamagent's `app/check/index.ts` serially formats/checks formatting, validates module layout, runs four strict TypeScript programs, runs type-aware lint, runs all 48 test files in one Bun process, then verifies owned LF text and all memory exports. The normal source tests and web/native acceptance remain separate. Tool deadlines are 120 seconds, unit subprocess 240 seconds; integration stages are explicitly bounded separately. There is no build/result reuse engine. Web output is `data/web`; desktop builds repeat Vite and a Bun-compiled daemon before Cargo/Tauri's own native incremental build.

Trigon uses independent policy tasks, a formatting barrier, type checking and lint in parallel, and a bounded test scheduler. It wraps deterministic tasks in a Git-aware cache, persists verification results in `.verification`, and keeps build receipts/outputs local. Its type checker invokes the same pinned TS7 preview in one build-mode invocation over tooling and portable configurations, with distinct build-info files.

## Reusable cache contract

The [cache engine](https://github.com/iki/trigon/blob/454e372cbc6bb75eafbbc4795391c492bc4fbf96/app/trigon-check/input-cache.ts) provides useful mechanisms:

- Normalize repository-relative scopes and reject traversal/Git metadata paths; explicitly declare external inputs/output roots.
- Read Git index blob identities and file modes; hash only dirty/untracked selected inputs. Treat unmerged indexes as unverified.
- Key task definition, scope/exclusions, argument/environment values, input projection, external inventory and Bun/OS/architecture. Exclude result metadata from its own projection.
- Record success only after execution succeeds and its input key still matches. Failed portable checks preserve earlier historical receipts without making them a match for changed inputs.
- Use per-task locks and atomic result replacement; separate mutable worktree caches.
- For builds, compare the complete output inventory, including missing/modified files, names, modes and explicit external output trees. A matching input key alone is insufficient.
- Validate changed staged receipts against the actual index (including alternate indexes), rather than accepting verification of different unstaged bytes.
- Derive receipt provenance from Git path history; shallow boundary history stays unknown. Status only reports repository-input equivalence, not full runtime equivalence or publication approval.

The [input-cache fixtures](https://github.com/iki/trigon/blob/454e372cbc6bb75eafbbc4795391c492bc4fbf96/test/input-cache.test.ts) cover fresh clones/worktrees, mutations/deletion/renames/modes, output corruption, failure retention, external inputs, simultaneous callers, staged mismatch, alternate index, and shallow provenance. These are inspected tests, not tests run by this audit.

## Required adaptations and review issues

1. **Keep LF/export checks live or give them an exact byte-level key.** Git canonicalizes text intentionally: the Trigon fixture explicitly preserves identity across CRLF normalization and staging. Teamagent must reject actual CRLF/lone CR and verify ignored caches/originals/export contents, which can change without any Git-visible source change. A source-only `.verification` hit must never skip that tail. Start with live LF/export checks; benchmark their traversal/hash cost separately before proposing content-addressed reuse.
2. **Preserve process and inventory limits.** Trigon `runToolAsync` and `runCompact` have no process deadline. `runCompact` writes unbounded logs/lines and can queue writes; `pathInventory` recursively reads files and follows link targets without byte/file/depth limits, and receipt reads are unbounded. These cannot replace Teamagent's bounded launchers unchanged. Reuse the algorithm with explicit time/output/receipt/file/depth budgets, cancellation and owned child-tree cleanup. External outputs require explicit containment/symlink policy, not accidental target traversal.
3. **Declare all implementation dependencies.** Scoped build inputs include `input-cache.ts` but not its imported `task-git.ts`, `atomic-rename.ts`, or `state-lock.ts`; default verification scope `.` includes them, but scoped builds can miss a helper implementation change. The engine-owned inputs must include its entire owned execution/identity helper closure, or the shared adapter directory.
4. **Fingerprint actual prerequisites or retain live checks.** The runtime tuple is only Bun/OS/architecture. Teamagent additionally relies on Git, PowerShell, the project Python converter environment, media binaries, Rust targets and browser/WebView resources. A lockfile identifies desired dependencies, not a complete installed runtime. Do not equate a same-platform Git receipt with a working Python/Playwright/native installation. Use bounded capability/version/lock/installation evidence per task, with no installation or download in gates. Credentials, remote availability, signing and real service/device acceptance stay live.
5. **Select scopes deliberately.** Trigon verification defaults to the whole Git-visible repository. Applied unchanged, an article/report change would invalidate Teamagent's formatter, compiler, linter and unit cache. Conversely, excluding all `spec/` is unsafe because several policies, formatter inputs, fixtures and runtime specifications depend on selected documents. Derive per-task declarations from actual consumed files and include dependency/config/tool definitions. Keep new/unclassified tests in a conservative group and include discovery inventory in the key.
6. **Git receipts are cooperative evidence.** The staged guard verifies projection consistency and the self-consistent task key; it does not attest that a process actually ran. A forged `passed:true` receipt is not an independently signed test result. Treat committed receipts under the repository review/trust model, disclose reuse, and retain a force-fresh path for audit/CI. Decide whether untrusted/new-branch receipts can be reused or require a fresh run before adoption. Reuse never grants signing/push/deployment authority.
7. **Preserve separate compiler/acceptance boundaries.** Teamagent has host, portable library, tooling and browser programs. Do not replace them with Trigon's two broader programs or allow ambient DOM/Node leakage. Combine invocations or add incremental state only while preserving all four effective program inventories and strict flags. Web/native smoke tests remain the existing explicitly required acceptance commands.
8. **Use conservative lock recovery.** Trigon's shared lock may retire an owner after wall-clock expiry even if it remains alive; the cache uses 24 hours, other workflow callers differ. Long operations must be bounded below that lifetime, and a Teamagent adaptation should not silently steal a demonstrably live same-host owner solely because wall time jumped. Filesystem locks coordinate cooperating writers, not arbitrary external edits or shared external output destinations.
9. **Do not copy Trigon-specific task ordering or native design.** Its browser pool is audited against its exact suites and clipboard behavior. Teamagent uses a Bun daemon sidecar and has different browser/native acceptance; Trigon's mobile/toolkit/platform assumptions are not source-compatible defaults.
10. **Keep inspection passive.** The cache inherits ordinary Git `status`/`hash-object` calls from Trigon's workflow Git adapter. Its environment isolation is valuable, but read-only identity queries do not disable optional index refresh or configured filesystem monitors, and hashing through attributes can execute trusted clean filters. Teamagent already suppresses optional Git locks and filesystem monitors in its import/research observation paths. Preserve that distinction for cache inspection, explicitly document trusted attributes/filter semantics, and fixture-test that cache status neither changes index bytes nor invokes an installed monitor. Do not reuse a mutation-capable Git adapter unchanged simply because its argument vectors are safe.

## Transferable optimization evidence

All following numbers are historical claims documented in [Trigon's development guide](https://github.com/iki/trigon/blob/454e372cbc6bb75eafbbc4795391c492bc4fbf96/spec/development-intro.md), on Windows on October 22. They are local before/after pairs, not Teamagent results or controlled multi-sample estimates. Additional regression counts vary between some pairs.

| Change | Complete-gate before → after | Relevant interpretation |
| --- | --- | --- |
| Bounded process groups | 406.11 → 274.00 s | Same 523-test inventory in the compared pair; main gain was unit overlap. |
| Per-process immutable Git fixture seeds | 267.94 → 266.55 s | Lower repeated setup cost but only 0.5% whole-gate improvement; within ordinary noise. |
| Isolated CLI/native suites plus audited browser pool | 268.59 → 199.14 s | Local 25.9% reduction, with seven scheduler regressions added. |
| Longest-first browser priorities | 196.65 → 196.86 s | Independent browser phase improved ~4 s; whole gate did not. |
| Resource-selected third browser | 191.46 → 178.12 s | Three allowed with >=4 CPUs and >=4 GiB free/available memory; sample is not resource reservation. |
| Resource-selected fourth unit worker and smaller groups | 178.31 → 169.68 s | 4.8% local gain; extra startup/contention made actual gain smaller than the prior estimate. |

Trigon caps unit processes at four only with >=6 CPUs and >=6 GiB memory; otherwise it uses at most three, capped further by CPU availability. Browser processes are at most three and no greater than unit concurrency. Unknown browser suites default to an exclusive barrier after audited independent suites. Every file runs once; unknown units stay together. Those algorithms can transfer; the source-specific suite inventory, durations and exact cap choice must be remeasured here.

The stored September runtime benchmark concerns astronomical calculations and compression. It is not evidence for Teamagent verification/build speed. The current runtime benchmark driver describes warm OS caches, one warm-up and seven fresh-process samples; that measurement discipline is useful, its workload is not.

## Preliminary Teamagent measurements from the parent

The parent executed the current Teamagent commands at the frozen pins on this Windows machine, with Bun 1.4.2, Aube 2.5.1 and Python 3.12.16. The [measurement record](../../benchmarks/trigon-process-sync-2026-10-28.json) retains exact arguments, input digest and original/LF output hashes. All 15 phase samples passed and the parent reported unchanged source inputs. This audit inspected that record but did not execute those commands.

| Current phase | Fresh-process sample 1 / 2 / 3 |
| --- | --- |
| Formatter check | 1.015 / 0.891 / 0.859 s |
| Four existing type programs | 2.078 / 1.969 / 1.938 s |
| Type-aware lint | 1.750 / 1.594 / 1.563 s |
| Live LF and export verification | 18.156 / 8.515 / 6.125 s |
| Current Vite web build | 0.938 / 0.469 / 0.671 s |

These are preliminary local samples with existing dependencies and OS/filesystem caches retained; they are neither machine-cold measurements nor a comparison to Trigon. The LF/export scan is visibly sensitive to warming. The current warm web build is already below one second, so a full build-cache inventory may cost more than rebuilding this small app; measure the identity/output overhead before prioritizing a cache for it. Type/lint overlap can at most save a small number of seconds at these measured costs, whereas the unit split experiment and LF/export scan deserve separate evidence. The baseline/two-group/three-group unit comparison was still running when these notes were updated; no unit speed claim is recorded here.

## Concrete benchmark plan for the parent

Keep the current dependency pins fixed for the initial comparison; record root/Trigon revisions, exact source hashes, Bun/Aube/Python/Git/PowerShell versions, CPU availability, available RAM, OS/architecture, environment fingerprints (no secret values), command vectors and timing boundaries. Execute experiments serially. Preserve raw process output plus LF derivative/hash mapping and exact failed runs. Do not erase application evidence/cache roots to manufacture a cold run.

### First runnable unit comparison

Freeze the 48 discovered test paths in one deterministic order. Run the identical explicit inventory for the baseline and retain that order within each candidate batch.

- Baseline: one pinned Bun process, `test --timeout 120000 <all 48 explicit paths>`.
- Candidate two: `research-git.test.ts` alone; all remaining 47 in their baseline order.
- Candidate three: `research-git.test.ts` alone; `analysis-sync.test.ts` alone; all remaining 46 in baseline order.

Both isolated suites own private state: research Git uses `.cache/research/fixtures-<GUID>` with private local repositories and stub APIs; analysis sync uses `mkdtemp` `teamagent-analysis-*` roots with their own cache/spec/state. They do not change global environment or the actual source inventory. Other suites stay in one process to avoid unaudited reordering/splitting. Shared installed tools are read-only; filesystem/CPU contention remains an empirical risk.

Keep the research case's existing 125-second test deadline and 120-second PowerShell subprocess deadline. Preserve the current 240-second wall limit for the complete unit phase; do not multiply that into a longer allowed overall runtime. Collect all child outcomes and join/terminate owned processes before proceeding. No retries. Compare exact file/test-name multisets, 359 passing tests and 1,321 Bun assertions, not totals alone. A timeout under parallel contention is a failed candidate, not permission to weaken the limit.

Run baseline → two groups → three groups, each separately. If coverage passes, gather at least three fresh-process samples for the selected candidate and control, with alternating serial order and no simultaneous builds/benchmarks. Report median/range and phase wall time; never sum overlapping child durations as elapsed time. The three-worker variant is a candidate, not a predicted winner.

### Type/lint/build and reuse

1. Measure current formatter check, all four type programs, lint, module-layout policy, LF inventory and export verification independently (three fresh processes each; OS-warm, application cache policy stated). Then test type/lint overlap with bounded child processes, retaining the formatting barrier.
2. Compare one TS7 build-mode invocation over all four programs with the current four invocations. Use temporary configurations in the owned analysis cache that extend each original config and only redirect distinct `tsBuildInfoFile` outputs. First compare effective strict flags and file inventories. Preserve the four ambient-type boundaries. Measure first application-cache build separately from subsequent incremental builds; do not claim that the first run is OS-cold.
3. Measure current Vite web build to its existing owned `data/web` output only after confirming output ownership. For a prototype cache, give output inventory hashing its own timing; compare first build, unchanged hit, changed source, deleted chunk and corrupted chunk. Inputs include Vite/plugin/config/build-adapter/package-lock/compiler/runtime source closure. Do not silently reuse a prior web output if integrity cannot be proven.
4. Defer native build changes pending the parent's separate lifecycle/patch decisions. Later, cache the web and daemon-sidecar preparation independently while keeping Cargo's native incremental engine, target/compiler/linker/settings identity, and actual desktop acceptance.
5. For a proposed result cache, measure cold evaluation, unchanged local hit, same-source fresh checkout hit, one relevant source edit, unrelated report edit, changed argument/runtime/environment, missing dependency prerequisite, changed ignored evidence/export, failed execution, concurrent mutation and changed staged source. Prove rejection before narrowing any exception.

## Suggested migration map

| Trigon source | Teamagent target/adaptation |
| --- | --- |
| `app/trigon-check/input-cache.ts` | New host-only `app/check/input-cache.ts`; replace Trigon coupling with bounded local Git/lock/atomic-file adapters and complete helper input closure. |
| `verification-cache.ts`, `cache.ts` | Host wrapper and `cache:status`/staged receipt validation; define explicit task scopes and live external prerequisites. |
| `runner.ts`, `test-groups.ts` | `app/check/index.ts` orchestration and a new test scheduler using Teamagent's audited inventory and measured priorities. |
| `tools.ts` build-mode invocation | Preserve `app/check/tools.ts` bounded launcher and all four configs; add unique build-info files only after the parity experiment. |
| `app/build-cache.ts` | Host build-stage wrapper for web assets and later daemon preparation, with complete output validation and current target identity. |
| `.verification/*.json` format | Generate fresh Teamagent results; import no successful Trigon receipt. Exclude receipt metadata from its own identity but include its bytes in a final publication proof. |
| `.githooks/pre-commit` cache gate | Combine staged-index validation with Teamagent's existing pre-commit contract; never adopt implicit package installation or skip live LF/export/signing/acceptance requirements. |
| `spec/cache.md` / `cache-intro.md` | New Teamagent operational contract + optional human guide, cross-linked from stack/runtime/verification/AGENTS and relevant platform docs. |

## Decisions worth surfacing before implementation

- Accept tracked results as reviewed cooperative evidence, with live prerequisite checks and explicit force-fresh mode, rather than implying independent attestation.
- Retain live raw-byte LF/export verification initially; optimize only after its own measurements and an equally strong invalidation design.
- Import the safe cache/scheduling contracts with Teamagent-specific bounds and four type programs; do not copy the unbounded helpers or Trigon's browser inventory blindly.
- Any new third-party patch found necessary for these changes must be requested if it is not already provided by Trigon. Owned adapter fixes described here are repository implementation changes, not third-party patches.
