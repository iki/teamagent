# Verification reuse alignment — 2026-10-30

This review adapts the applicable parts of Trigon's verification/deployment
correction to Teamagent's development tooling. The authoritative Teamagent
contracts remain [cache reuse](../cache.md), [verification](../verification.md)
and [repository publication](../workflow.md).

## Source and baseline

- Teamagent's original task baseline is
  `403a908d95a8db61c03e240642cb56bbf1f53e26`.
- The reviewed source is [Trigon commit
  `cdfb49aa5a3a6e227afae93014e9224ed159b77f`](https://github.com/iki/trigon/commit/cdfb49aa5a3a6e227afae93014e9224ed159b77f),
  **fix(deploy): Reuse verification without blocking deployment**, committed
  on 2026-10-29 at 12:49:22 +01:00.
- Read-only inspection confirmed a clean source working tree and local HEAD,
  local `origin/main` and the live remote `refs/heads/main` at that exact commit
  on 2026-10-30. This is a point-in-time remote observation, not future freshness.
- The source checkout was not modified or fetched. No source deployment,
  credentials, private configuration, successful verification receipts or
  publication authorization were imported.

These Git blob identities pin the principal source files inside that commit:

| Source path | Git blob ID |
| --- | --- |
| `app/trigon-check/input-cache.ts` | `c3ec53a4cc4d4fd73cd8930c1b29edace0dfcbb0` |
| `app/trigon-check/verification-environment.ts` | `b9e56cde32d60870395a05818c34e7eea3615200` |
| `app/trigon-check/verification-cache.ts` | `d2739c16f844f57a40953f4608be97f6494ce344` |
| `app/trigon-release/deploy-host.ts` | `7248b7756994337dff7276842619591d71a0c4d4` |
| `app/trigon-release/deploy-recovery.ts` | `7773fbae408bc6d963ac401d12730b0f43108676` |

The scoped source diff also changes verification entry points
`app/trigon-check/index.ts`, `tool.ts` and `test.ts`, child environment handling
in `app/trigon-conversations/compact-run.ts`, and the early cleanliness check in
`app/trigon-release/deploy.ts`. The corresponding source contracts are
`spec/cache.md` and `spec/release-channels.md`. Unrelated release versions,
changelogs, product code and previously generated result files are outside
the transfer.

## Applicable behavior

| Source correction | Teamagent adaptation |
| --- | --- |
| Verification reads matching tracked evidence before matching local evidence. | Preserve tracked cooperative receipts and add ignored local receipt storage without changing the task's input identity. |
| Operational checks write only local evidence. | Provide an explicit local write policy for checks whose callers must preserve tracked bytes; ordinary verification retains tracked writes by default. |
| Ordinary review promotes matching local evidence. | Atomically publish a valid local success into the tracked receipt path after existing live validation and final input/output identity checks, without rerunning the verified action. |
| Verification CLI locale is normalized before work. | Execute verification with `LANG=C.UTF-8` and `LC_ALL=C.UTF-8`, rather than only rewriting those values in the cache key. |
| Actual runtime locale and timezone remain inputs. | Include actual `Intl` defaults as well as relevant environment identity. Changing environment variables after startup does not prove those runtime defaults changed. |
| Test workers do not inherit the outer receipt-placement policy. | Remove only the write-policy variable from isolated worker environments, preserving Python isolation and other relevant inputs. |

The implemented control is `TEAMAGENT_VERIFICATION_CACHE_WRITE=tracked|local`.
Only this storage-policy variable is excluded from Teamagent's otherwise relevant
`TEAMAGENT_*` environment identity. An invalid value must fail explicitly.
Changing receipt placement alone must neither force a new verification identity
nor grant a hit when actual inputs differ.

Teamagent's cache boundary is already stronger than the reviewed source in
several areas. Preserve bounded Schema decoding, safe contained paths, per-task
locks, atomic LF writes, source and prerequisite revalidation, output inventories,
force-fresh execution and rejection markers. A failed forced or live validation
must invalidate matching success across both stores while retaining historical
tracked bytes. Reuse and promotion must not evade the staged-index/mode checks.
LF/export integrity and external-state checks remain live.

This is a repository-owned adapter change. It does not modify a third-party
dependency or introduce an independently maintained dependency patch.

Pre-commit review and the workflow's final verification select local writes.
Ordinary step/review checks default to tracked writes, including validated
promotion. Complete staged/working-tree comparisons and all publication guards
remain in place. The build adapter separately binds its unnormalized `LANG`
and `LC_ALL`, because normalizing verification does not change build execution.

The dual-store review also identified failure resurrection across different
input versions. Local rejection history now retains up to 256 failed keys,
accepts legacy single-key records and fails closed at capacity. Invalidation
revokes current and both retained receipt keys; unreadable current inputs still
revoke retained successes. The gate attempts all four group invalidations even
if one fails. These safeguards are Teamagent adaptations, not claims about the
source implementation.

## Deployment-specific behavior deferred

Trigon's deployment host selects local receipt writes. Its cleanliness guard
allows only regular result files matching `.verification/<safe-task-id>.json`
to differ; malformed result content still cannot prove verification. The guard
continues to reject source/configuration/release changes, nested or non-result
paths, symlinks and submodules. Its recovery path accepts result-only additions,
changes or removals across commits after checking file modes in both Git trees.

Teamagent has no equivalent implemented deployment/recovery adapter to receive
that exception. Do not apply it to signed repository publication: the complete
checked working tree, explicit task scope, staged contents, signatures and exact
destination must still satisfy [the workflow contract](../workflow.md). Existing
generated receipt changes do not become implicitly owned or publishable.

A future explicitly authorized deployment implementation can adopt the narrow
regular-result-file exception with its own positive and negative fixtures.
This task grants no new deployment, release, tag, force-push or hook-trust
authorization.

## Regression and verification scope

The reviewed source adds coverage in `test/input-cache.test.ts`,
`test/verification-environment.test.ts`, `test/workflow-runner.test.ts`,
`test/deployment-cache.test.ts` and `test/deployment-recovery.test.ts`.
The applicable Teamagent coverage must establish:

- Tracked-first/local-second reuse, local misses that preserve tracked bytes,
  and promotion of valid local evidence without rerunning the action.
- Missing, malformed, mismatched and failed evidence never claiming success;
  failures/rejection markers apply across both stores.
- Receipt-placement changes leave identity unchanged, while source, definition,
  runtime, timezone and relevant environment changes invalidate reuse.
- Locale normalization affects the executed command, and worker isolation removes
  only receipt-placement control without changing coverage or deadlines.
- Promotion retains live validation, concurrent-mutation checks and staged-index
  validation; existing force-fresh and output-integrity behavior remains covered.

## Observed implementation checks

On 2026-10-30, Windows x64 with Aube `2.5.1` and Bun `1.4.2`:

- `aube run --no-install step:check` passed formatting, all four TypeScript
  programs, strict type-aware lint and **464 Bun tests across 55 files**.
  The scheduler used three processes and retained its 240-second unit deadline.
- `TEAMAGENT_VERIFICATION_CACHE_WRITE=local` with
  `aube run --no-install review:check` passed and reused all four groups.
  SHA-256 comparisons before and after confirmed that every tracked verification
  receipt remained byte-identical.
- Both complete gates passed live LF/export integrity, including 78 text
  exports comprising 933 files, with no missing or linked inventory entries.
- Focused policy/pre-commit coverage passed all 12 tests before the full gate.
  An initial cache test caught JSON property reordering during promotion; the
  implementation now preserves the exact validated LF receipt bytes and rejects
  undeclared fields. The full gate includes the repaired original assertion and
  additional whitespace, non-LF and undeclared-field cases.
- An initial step gate caught an unsafe inferred rejection type in the new
  error aggregation. The corrected implementation accepts rejection reasons as
  `unknown`; the complete gate above passed without changing lint strictness.

Local diagnostics are retained under `.cache/verification/` with the
`verification-reuse-2026-10-30-` prefix. The local-review JSON records timestamps,
tool versions, all four before/after hashes, four hits and exit code zero.
The four pre-existing tracked receipt versions were retained byte-for-byte in
`baseline-verification-reuse-2026-10-30/` with a hash manifest before regeneration;
their task adoption is explicit, not implicit ownership of initial dirt.

These observations establish successful checks and receipt preservation, not
a controlled speedup measurement. No deployment was run. Final verification,
signature and remote-publication outcomes belong in the task workflow receipts
after the implementation response is frozen; this report does not anticipate
those outcomes.
