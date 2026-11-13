# Parallel repository tasks

Common-repository task, registry and integration locks use the
[automatic metadata recovery protocol](resources.md#metadata-lock-recovery)
only for complete physical same-host ownership whose process is affirmatively
absent. Exact originals stay retained at one deterministic common address.
Recovery permits a fresh exclusive acquisition; it never resets task state,
replays publication, changes the destination or substitutes for reconciling an
uncertain remote result. Live, reused, foreign and unknown owners remain protected.

Use one `codex/*` branch and one registered worktree per independent logical
task. Keep related subagents inside that task with explicit file ownership.
The primary checkout remains available for inspection and coordination; another
task's dirty primary files never enter an isolated task or integration.

`.workflow.json` version two fixes Teamagent's destination and selects `local`
or `pr` integration. New tasks cannot begin on main. Version-one records stay
readable. The implementation task that introduced this contract began under
version one; its explicit policy-adoption receipt preserves its original main
baseline and permits that already-open task to finish once.

## Start and complete a task

Run `aube run --no-install task:parallel` with bounded JSON on stdin. Every
request includes the actual `sessionId` and a stable caller-selected `taskId`.
The command's help/version paths are passive.

```json
{
  "operation": "start",
  "sessionId": "session",
  "taskId": "feature-task",
  "name": "feature-task",
  "install": true
}
```

The name is 1–48 lowercase letters, digits or hyphens with an initial letter or
digit. A stable identity suffix avoids collisions. The path is beneath the
canonical primary checkout's `.cache/worktrees/`, including when the caller is
already in a linked worktree. The branch is `codex/<name>-<identity-suffix>`.
An exact retry returns the registered task; it never guesses ownership from an
existing directory or branch.

`install` defaults to false. When selected, it runs the frozen Aube install in
the new worktree. Otherwise use the explicit `install` operation before task
commands. Each checkout owns its installation and mutable caches; it must not
borrow the primary checkout's `node_modules` through upward module resolution.
Project-aware launch and optional trusted Mise follow [the launcher contract](project-launcher.md).
Aube installs JavaScript dependencies only. Provision any required Python/extractor
or native prerequisites through the existing project setup commands in each new
worktree or integration candidate; parent caches are not an implicit fallback.
Creation never copies credentials or activates agent-hook trust.

The one immutable native-supervisor exception is described in
[resource ownership](resources.md): exact physical checkouts of the same Git
repository can copy a fully keyed, validated primary artifact into their own
native cache. This is not a dependency-installation or mutable-output fallback.
It does not read or change task state, so dependency bootstrap can use it while
registration is still `creating`. Verification results retain their separate
registered ownership and complete-input contract.

Continue in the returned worktree. Use `task:run` to begin, implement, verify,
checkpoint, prepare and publish through the existing [task contract](workflow.md).
Keep the original task/session identity throughout. A normal logical task
publishes one checked, signed commit to its same-name branch, not to main.
The frozen public record is part of that commit. Branch publication and main
integration are separate outcomes.

Task verification under version two defaults to local receipt writes; final
review and pre-commit also use local writes. Version-two direct check commands also default to local writes. Set
`TEAMAGENT_VERIFICATION_CACHE_WRITE=local` explicitly when running
them in a task/candidate worktree. This avoids incidental receipt edits without
weakening receipt validation. Every source file and tracked receipt remains
part of the actual tree; integration never silently discards them.

## Integrate

```json
{ "operation": "integrate", "sessionId": "session", "taskId": "feature-task" }
```

When the signed task commit already extends current remote main, integration
uses the clean registered task checkout and retains the original commit SHA.
Exact-input verification can reuse its local receipts after live checks. No new
checkout or dependency install is needed on this fast path.

When main advanced, prepare a candidate first:

```json
{ "operation": "prepare", "sessionId": "session", "taskId": "feature-task" }
```

Preparation creates a detached integration worktree, applies the task commit on
captured current main, performs frozen dependency setup and returns its path and
staged tree. Run the ordinary complete implementation check there with local
receipt writes. Then run `integrate` from the original task/primary checkout.
The final gate must match that candidate's source, index, runtime, prerequisites,
outputs and external state. The unit phase has an explicitly approved 1,680-second
budget; workflow review retains its 300-second limit. The signed two-task
integration test has a separately approved 360-second limit. The failures,
recovery and PR integration tests retain their approved 240-second limits.
The first research maintenance scenario also has the
[180-second child and 185-second case allowance](verification.md). The pure
PR-admission test, other older tests and the 120-second runner default retain
their existing limits.
Preparation makes a separate cold check possible before the bounded final
review.

Integration signs the rebased copy, verifies its signature/tree/parent, rechecks
the exact source and main refs, and makes only an ordinary fast-forward push.
Each completed task remains a distinct commit on main. Published task branches
are never rewritten; this implementation rejects extra source commits and merge
histories instead of squashing them. Main checkout files and its local branch
are not moved automatically (`localMainUpdated` is false). Refresh a clean local
main explicitly when convenient, preserving any dirty work.

Only final integration holds the common integration lock. Independent task
implementation and candidate preparation use their own ownership. Shared state
and immutable transition receipts live under the common Git directory's
`teamagent-parallel/`; worktree-local task/check/cache state stays isolated.
There is no background queue daemon or automatic main/branch cleanup.

## PR mode

Set the committed policy's mode to `pr` in a checked policy-change task. Use the
explicit `task:run` `adopt-policy` operation for a version-two mode-only policy
change; destination fields cannot change. Its receipt retains the original
baseline/policy and invalidates verification/signing readiness. The policy-change
task integrates under the previous main policy; the new mode governs later tasks.
Finish outstanding tasks before switching modes: entries bound to an older main
policy stop for explicit reconciliation rather than gaining new authority silently.

After branch publication, `submit` creates its PR through the
installed/authenticated GitHub CLI. Submission is an explicit remote mutation,
separate from integration. Supply the known positive `prNumber` to integration
when needed. PR mode requires the exact repository, branch, source commit and
current base, approval and successful checks, and repeats admission immediately
before publication.

The resulting integration is still a signed local rebase followed by an ordinary
fast-forward push. GitHub's built-in Rebase and merge cannot preserve user
signatures. Branch protection remains authoritative: a rejected push stays
blocked, with no bypass or forced update. A rewritten commit can leave the PR
open; confirmed main integration does not claim GitHub marked the PR merged.
See [GitHub's signature guidance](https://docs.github.com/en/authentication/managing-commit-signature-verification/about-commit-signature-verification#signature-verification-for-rebase-and-merge).

## Recovery and retention

`status` is passive. `reconcile` inspects a saved uncertain publication and the
exact remote outcome; it never retries a push. A changed source/main, failed
review, conflict, unknown lock owner or uncertain cleanup retains the entry,
candidate and diagnostics. An old lock is not permission to reclaim it.

After main moves, explicit preparation may create a new candidate while retaining
the previous candidate and receipt. Do not edit a prepared candidate and then
reuse its old proof. For a true source conflict or combined-test defect, start a
distinct remediation task from current main. Explicitly replay and resolve the
original task delta plus the repair, record the original task/commit/candidate in
the remediation public record, and complete its normal checked publication and
integration. Keep the failed original task and published branch intact. This is
a recorded replacement, not a reset of the original task baseline.

Worktrees, ignored app state and failed attempts are not disposable merely
because they are under `.cache`. No automatic deletion is implemented. A later
explicit cleanup must verify registered physical containment, clean source and
index, retained evidence and stopped descendants before removing an exact owned
worktree. Temporary scratch retains the separate [resource contract](resources.md).

## Verification reuse across worktrees

Registered worktrees may share explicitly portable verification results through
`spec/cache.md`'s repository-owned result backend. They do not share build outputs,
running processes, scratch, task state, conversation records or publication proofs.
A shared running/failed generation blocks older local and tracked success for the
same complete key. A fresh successful execution can supersede an unfinished test
attempt without deleting its evidence. Superseding a result does not itself
authorize lock recovery; exact confirmed-dead metadata owners follow the separate
[resource contract](resources.md#metadata-lock-recovery).

Current installed package bytes, runtime/tool/supervisor identity and environment
remain live prerequisites. Integration candidate ownership is checked against the
native registry and physical common directory. Skill installation or a shared
success record grants no additional task or publication authority. A full store
reports reuse unavailable and runs genuine checks until explicit maintenance.
