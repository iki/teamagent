# Trigon process synchronization analysis — 2026-10-28

This review preceded the user's policy decisions and the implementation now in progress. Source: [Trigon](https://github.com/iki/trigon), commit `454e372cbc6bb75eafbbc4795391c492bc4fbf96` dated 2026-10-28T14:02:13+01:00. Teamagent comparison baseline: `176569773159e4eb907fb11feda252ecc307e8f7`.

[Workflow/rules audit](trigon-process-sync/workflow.md) · [Dependency/patch audit](trigon-process-sync/dependencies.md) · [Build/cache audit](trigon-process-sync/verification.md) · [Implementation map](trigon-process-sync/implementation-plan.md) · [Source inventory](../data/trigon-process-source-2026-10-28.json) · [Measurements](../benchmarks/trigon-process-sync-2026-10-28.json)

## Implementation review status

### Current result — 2026-10-29

The combined publication-boundary repairs passed the full step check in
246.844 seconds: 444 Bun tests across 54 files, 1,483 expectations, all four
type programs, lint, formatting and live LF/export integrity. An actual
isolated Git-hook probe now exactly matches direct execution for all seven
prerequisite identities and four receipt definitions. The required final
`review:check` then passed in 235.750 seconds, again running all 444 tests.
The user subsequently loaded the configured signing key, and a read-only
agent check confirmed its presence. A new guarded publication attempt is now
ready to prepare; the separate 18-pin alignment follows confirmed publication.

The following publication attempt completed its full review and staged-receipt
checks, but Git rejected signing because the Windows SSH agent held no keys.
Read-only reconciliation confirmed local and remote refs still at the original
baseline. The attempt and diagnostics are retained; no commit or push occurred.
The configured signing key must be made available before another signed attempt.

That attempt also exposed receipt drift across ordinary and Git-hook launches.
An isolated real-hook probe reproduced all four changed receipt definitions:
only native-tool identity differed, because Git for Windows selected its core
executable inside a hook and its `cmd` launcher outside it. Environment, runtime
arguments, installed packages and the other prerequisite identities matched.
The correction keeps executable hashing and gives actual verification a
consistent Git invocation. A separate pre-commit guard now rejects any review
that changes staged or working trees. Its six fixture tests cover receipt,
source and index changes, preserved unstaged work and alternate-index binding;
four type programs and type-aware lint passed. The assembled step result above
supersedes that focused evidence; signed publication is still pending.

The final staging fix passed the complete step check in 251.687 seconds with
434 Bun tests and 1,459 expectations across 52 files. A new regression first
reproduced Git's rejection of an already-staged deletion, then verified a signed
commit and isolated remote push with that deletion and a new file. Publication
now stages only existing or still-indexed scope paths, preserving staged deletions;
the exact post-stage scope, tree, receipt and signature checks remain mandatory.
The second stopped attempt was reconciled without a commit or remote change and
remains retained. The next explicitly linked attempt uses the shared helper and
requires a fresh proof; neither old attempt is silently reset or retried.

The subsequent staging repair passed the complete step check in 230.594 seconds:
433 Bun tests, 1,459 expectations and the same 52-file coverage. Git now treats
only hash-verified retained-original directories as binary for diff purposes;
their exact bytes, `-text` setting and LF/hash checks remain intact. A real Git
regression rejects active-text whitespace and changed originals. Root editor,
Git-attribute and ignore policies are now explicit verification cache inputs.
The previous staging attempt stopped before a commit and was reconciled against
unchanged local/remote refs; its journal remains blocked and preserved. A linked
new attempt requires fresh preparation and the unchanged frozen task record.

The current-pin full review passed in 291.937 seconds after memory became
available. Its existing three-worker schedule ran all 432 Bun tests across
52 files with 1,456 Bun expectations, plus the Python fixtures. Formatting,
all four type programs, lint, installed-prerequisite checks and live LF/export
integrity passed. The unchanged unit deadline remains 240 seconds. The earlier
Stop-repair attempt failed at that deadline after 321 passing tests with one
worker; no individual assertion failure was reported before cancellation.
These are separately retained outcomes in the [dated result receipt](trigon-process-sync-2026-10-29-results.json),
not edits to the original benchmark evidence.

The publication audit found every changed path within the process-transfer
scope and independently verified all 86 archive renames and retained originals
against their baseline bytes. Actual signing and remote publication follow the
frozen task record and final preparation. The approved 18-pin alignment remains
a separate step after that publication. Browser/native acceptance and citation
validation retain their earlier dated evidence below.

An isolated Aube workspace-root experiment did not reproduce the suspected
root-admission error with Teamagent's exact allowBuilds-only configuration.
Both variants reached local-file linking and failed there with Windows error
183; neither is a successful installation. No speculative option change or
dependency patch was applied, and real Teamagent dependencies were untouched.

### Earlier implementation evidence

The current-pin process transfer is being assembled before the separately
approved 18-pin alignment. Focused workflow/archive/hook fixtures passed 31
tests, including actual local SSH signatures, isolated bare-remote publication,
explicit checkpoint repair and interrupted receipt/state reconciliation. They
do not establish publication to the real Teamagent remote. Strict type checks
retain all four distinct programs. Dependency fixtures include 160 actual
Tauri version invocations; browser/native application acceptance remains a
separate gate.

Independent review corrected missing test-cache inputs (`spec/tools` and the
memory skill), ignored compiler inputs, source changes during cache hits,
late rejection of unrelated changes, incomplete archive retry identity and
race-prone stale-lock reclamation. Checkpoint repair now has an explicit
immutable receipt instead of silently replacing frozen source hashes.
The 86 historical archive renames were independently checked against their
retained original hashes. Full assembled checks and real publication are still
pending; do not interpret these focused results as
completion of the whole transfer.

Two assembled checks reached the unchanged 240-second unit deadline under
one-worker memory admission after 394 and 401 passing tests respectively.
Their outer captures took 327.766 and 317.515 seconds. These are failed full
checks, not partial success receipts. The revised grouped schedule retains every
test and requires a complete run with sufficient available memory.

The local citation validator passed on 2026-10-28: 11,581 relative links and
4,267 pinned references to 3,716 unique Git blobs across 1,221 Markdown documents,
with no issues or unmapped external sources. This checks retained object bytes
and cited locations, not public network reachability or semantic correctness.

An actual opt-in web build exposed a host-adapter defect absent from the initial
synthetic fixtures: Vite initialized `NODE_ENV` after the cache fingerprint,
causing the post-build prerequisite guard to reject completed output. A diagnostic
confirmed that only the environment component changed. The fix retains that
guard, initializes the documented defaults first, fingerprints the actual
`app/web` dotenv inputs and resolved expansions, and blocks Vite debug output
that could expose values. All four TypeScript programs, type-aware lint and
20 cache tests (113 Bun expectations, 26.24 seconds) pass after this correction.
Independent source review found no further blocker within the current production
configuration scope. Actual build reruns remain separate evidence.

The corrected production web entry subsequently passed uncached, force-fresh,
unchanged-hit, missing-output and corrupt-output checks with identical complete
output inventories. Measured command times were 1.000, 55.031, 44.109, 48.969 and
53.953 seconds respectively. The measured cache hit is slower than this small
uncached build, so opt-in remains the appropriate default. These single samples
are not a repeated performance comparison.

The desktop production test entry also passed force-fresh and reused-daemon
paths, with identical daemon bytes and live Vite/Cargo tests (125.469 and 72.031
seconds overall). Native incremental compilation prevents attributing the whole
difference to this new cache. Actual browser acceptance passed with Chromium
153.0.8010.12; the built Windows app passed WebView2 workflow/shutdown with
156.0.4314.50. Their full commands took 10.563 and 49.282 seconds. The first
desktop measurement stopped before building because a version-manager warning
contaminated the combined target probe; the successful attempt used the already
installed Rust 1.99.1 executables directly. The failed probe is retained.

See the [portable measurement summary](../benchmarks/trigon-process-implementation-2026-10-28.json).
The user selected continuing independent checks while memory remains limited.
The full unit/step/review gate, real signed publication and separate 18-pin
alignment remain pending. No focused result or application acceptance substitutes
for the incomplete combined gate.

## Stop repair continuation

The observed root Stop failure left an orphan unit process and a dead-owner
verification lock without enough retained diagnostics to prove its original
cause. The orphan exited before the strictly guarded termination attempt.
Host inspection confirmed both recorded processes absent, and the exact lock
was preserved before explicit recovery. No process was terminated or unrelated
work removed by that recovery.

The hook now awaits bounded asynchronous actions and retains pending/completed
receipts, redacted LF logs and confirmed exit/timeout/cancellation distinctions.
Windows cleanup resolves the system utility independently of PATH. New diagnostics
use a separate 64-MiB budget with short atomic reservations; abandoned reservations
remain charged. These changes do not provide a transactional reservation for the
main workflow cache's separate per-operation inventory checks. All ten focused
hook tests, four type programs and lint passed, including real detached-process
cleanup with an empty PATH. POSIX detached-descendant cleanup remains unverified.

Document and OmniVoice workers now explicitly use Python `-I -B`. Isolated mode
ignores environment bytecode settings; `-B` prevents writes while allowing reads
of provisioned bytecode already included in the prerequisite fingerprint.
Ignored repository bytecode is rejected, and direct repository-import fixtures
use temporary prefixes. Three pre-existing files (36,940 bytes) were preserved
with exact hashes before quarantine. The six affected files passed 56 tests;
all four type programs and scoped lint also passed.

Installed package hashing now binds initial, open-handle and final-path identities,
checks precise metadata and EOF, and binds parsed manifests to the inventory and
later graph visits. Twelve targeted tests passed, with twenty unrelated tests
explicitly filtered in that focused command. Four type programs and full lint
passed. Two independent source reviews found no blocker. The serial 64-KiB reader
and stable digest representation are retained; parallel hashing is deferred.

A setup-only workflow fixture experiment was rejected. Its unchanged baseline
passed all fifteen tests in 85.703 seconds; the candidate passed thirteen, with
one unchanged 30-second timeout and a subsequent transport failure (119.672
seconds overall). Both starts had 99% memory load. The original fixture was
restored byte-for-byte. Both source versions, captures and resource measurements
are retained in the [implementation evidence](../benchmarks/trigon-process-implementation-2026-10-28.json).
This establishes no performance benefit and does not justify relaxing deadlines
or the resource floor. The required full review follows these focused checks;
publication and dependency alignment still require that gate to pass.

## Proposed adoption

| Direction | Reuse | Teamagent-specific treatment |
| --- | --- | --- |
| Workflow | Stable logical task identity, preserved initial baseline, explicit file ownership, grouped begin/checkpoint/verify/prepare operations, safe publication/reconciliation | Settle signed push, archive and integration scope. Never inherit Trigon's hardcoded repository or historical authorization. |
| Rules/specification | Compact operational rules, scoped reading, explicit red/green guards, operational/human documentation layers | Keep the research corpus and historical evidence separate. Preserve existing English, strict typing, Effect, LF and privacy requirements. |
| Dependencies | Aube-owned staged update planning, receipts, failure classification, patch review and scoped skills maintenance | Add explicit process/read bounds. Preserve runtime/development dependency roles, existing deny-builds, Teamagent-only packages and Cargo lock. Decide whether to align shared pins now. |
| Patches | Trigon-owned, immutable fixes with exact versions, hashes, prerequisites, regression and removal evidence | Store byte-identical portable installation artifacts with provenance. An absent or incompatible Trigon fix must block and ask the user, including agent/CI/repair paths. No independent workaround may be silently created. |
| Verification | Declared input identities, independent result groups, exact checked-worktree reuse, staged-index validation | Preserve all four TypeScript programs, every assertion, process limits and live LF/export coverage. Measure Teamagent grouping rather than copying Trigon's timing assumptions. |
| Build cache | Complete input and output inventories, atomic local receipts, before/after source stability | Cache only when measured overhead is worthwhile. Preserve Cargo's native incremental compilation and real platform acceptance. |
| Git-stored results | Compact `.verification` success evidence with Git-history provenance and explicit force-fresh mode | Generate Teamagent results; never copy Trigon successes. These are cooperative reviewed receipts, not independent attestations or publication approval. |

## Dependencies and supplied fixes

There are 24 shared direct JavaScript dependencies and 18 different pins, including Effect `4.0.0-rc.118` → `4.0.6`. Bun 1.4.2, Aube 2.5.1 and the TS7 preview already match. [The exact comparison](../data/trigon-dependency-comparison-2026-10-28.json) distinguishes shared, Teamagent-only and unrelated Trigon packages.

Of Trigon's eight active fixes, only its supplied conservative Tauri native-lifetime adapter directly applies to a current Teamagent dependency. The other fixes concern absent tools/codecs and should not introduce those packages by themselves. [The patch inventory](../data/trigon-patch-inventory-2026-10-28.json) records sources, fork heads, prerequisites and applicability. Remote fork/status claims have not been independently refreshed by this local audit.

Both native manifests already pin Tauri 2.12.1 and tauri-build 2.7.1. Four shared locked crates are newer in Teamagent; retain its Cargo lock. Trigon's Rust 1.99.0 setup pin differs from the [observed installed Rust 1.99.1](../data/trigon-process-readiness-2026-10-28.json) and Teamagent's declared 1.90 minimum. Do not silently downgrade or change the edition. [Native comparison](../data/trigon-native-comparison-2026-10-28.json).

## Review issues to correct before reuse

1. **Live locks:** Trigon's ordinary task lock can be reclaimed on age alone while an owner remains alive or foreign. Reclaim only confirmed dead ownership; preserve unknown owners for explicit recovery.
2. **Signing boundary:** direct publication relies on earlier configuration checks but does not explicitly require and verify the created signature before push. Enforce signing at the actual publication boundary.
3. **Process/size limits:** some source runners and inventory readers lack Teamagent's timeout, output, path/depth and cancellation bounds. Compact displayed output does not bound the underlying log or child process.
4. **Archive privacy/LF:** retain Teamagent's write-boundary redaction, public-message-only content, LF normalization, byte limits and session/fork checks. Do not copy source behavior that includes command scripts or relies on callers to redact.
5. **Cache completeness:** include execution-helper dependencies, arguments, runtime/tool identity, installed prerequisites and relevant ignored/external bytes. Git's canonical text identity cannot certify actual LF bytes. Signing, remote state, credentials and live device/service acceptance remain live checks.
6. **Passive inspection:** suppress optional Git writes and filesystem monitors. Treat clean filters and repository attributes as executable trusted configuration rather than assuming every Git read is passive.
7. **Scope differences:** do not import Trigon's product release/localization rules, dev-only dependency lists, astronomical assets, browser suite grouping, historical authorizations or successful receipts as Teamagent requirements.

These are static source review findings; this audit has not demonstrated a live Trigon signing failure, lock race or provider defect. The proposed transfer must add rejecting fixtures before adopting the corrected behavior.

## Measurements so far

The fixed-pin Windows experiment uses fresh processes with existing dependencies and OS/filesystem caches retained. It is not a machine-cold benchmark. All 15 initial phase samples passed with unchanged source inputs:

| Phase | First / second / third sample |
| --- | --- |
| Formatting check | 1.015 / 0.891 / 0.859 s |
| Four strict type programs | 2.078 / 1.969 / 1.938 s |
| Type-aware lint | 1.750 / 1.594 / 1.563 s |
| Raw LF and export verification | 18.156 / 8.515 / 6.125 s |
| Existing web build | 0.938 / 0.469 / 0.671 s |

The full 48-file test baseline passed 359 tests and 1,321 Bun expectations in 207.281 s. A two-process experiment completed its two successful child suites in 151.016 s. Its benchmark parser initially rejected Bun's omitted zero-expectation line for the node:assert-only Git suite; exact retained log hashes and coverage were reconciled without rerunning successful tests. The original instrumentation failure remains in the record. The three-process experiment passed the identical file/test/assertion inventory in 128.109 s. Repeated selected/control samples remain pending. No scheduling or cache speedup is adopted from a single preliminary pair.

These runs encountered 97–98% memory load, with only about 1.3 GiB available at the grouped starts. They establish successful coverage under pressure, not a stable speed estimate or justification for unconditional three-worker concurrency. The original grouped timing also includes a small collection/hash/manifest overhead that the baseline timing excludes; repeats must record comparable child-phase boundaries separately from collection overhead.

The repeated comparison was refused before any child launched: available physical memory was 1,152,897,024 bytes, below the conservative 4 GiB experiment floor. That floor is an analysis admission rule, not an empirically established production scheduler threshold. The initial baseline did not record available memory. The initial grouped measurements must therefore remain separate from any later lower-pressure sample set; no median or reliable percentage improvement is claimed yet. Bun's expectation count does not include every assertion executed through Node's assertion library.

The primary opportunity is avoiding unchanged repeated verification and improving the expensive test phase. The warm web build is already below one second, so cache inventory overhead must be measured before claiming a benefit. Source Trigon timings remain separately labeled historical evidence in the detailed audit.

## Decisions and implementation order

- **Publication — approved:** the user selected automatic signed commits and ordinary pushes to Teamagent's configured upstream after review. Current configuration has SSH signing enabled and an allowed-signers setting; actual signing and remote access have not been tested. No force, amend, tags or deployment are implied.
- **Archives — approved with amendment:** one frozen public record per changed logical task, with global numbering removed from new and old filenames. The 86 historical records were renamed without changing their contents; eight name collisions received stable identity suffixes. The [migration map and original hashes](conversation-names.json) retain their lineage. Teamagent's privacy/LF protections remain required. Later verification/publication outcomes belong to receipts.
- **Dependency scope — approved:** align the 18 reviewed shared JavaScript pins, including stable Effect, in a separate implementation step after the process changes pass their current-pin gate. Require fresh compatibility and browser/native acceptance; retain Teamagent-only packages and Cargo lock.
- **Extra product policies:** recommendation is to defer Trigon's mandatory EN/CZ releases, product version graph and source-replay integration until their Teamagent-specific semantics are selected. Ordinary scoped task work, explicit publication and future worktree-safe state can be adopted without inventing product release policy.

No dependency workaround currently required by this proposal is missing from Trigon. If implementation reveals one, pause that dependent change, prepare its reproduction and central-source evidence, and ask before applying or authoring it.

## Source verification boundary

The credential-free exact-commit fetch failed, and the current GitHub connector returned 404 for the repository. That does not establish whether the repository is private, unavailable or outside the connection's access. Source inspection therefore uses the existing local Git repository, with its canonical configured origin and exact commit identity.

The cited local objects were copied into an independent, bounded citation cache without a checkout, source execution, hooks, filters, credentials, network access, alternates or source modification. The [transfer receipt](../data/trigon-citation-objects-2026-10-28.json) verified 55 original Git objects, totaling 355,060 bytes, covering 41 cited paths. It retains the commit, necessary ancestor trees and cited blobs, not an entire clone or history. Every object ID and read-back byte sequence matched. This establishes local Git-object identity; online availability, signature validity and semantic correctness remain separate claims.
