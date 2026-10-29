# Repository task workflow

This contract governs development of Teamagent. It is separate from the product's durable agent tasks in [the harness](harness.md). The [process comparison](analyses/trigon-process-sync-2026-10-28.md) records the inspected Trigon revision, decisions and review issues. The host adapters and focused fixtures are implemented; assembled verification and real repository publication are recorded separately. File presence alone does not establish that a product hook is trusted or active.

## Authority and scope

The user authorized automatic signed commits and ordinary pushes after a changed logical task passes review. The committed, non-secret publication policy names Teamagent's exact remote and branch. It does not authorize force pushes, amended history, integration merges, tags, releases, deployments, permission changes or hook trust changes. Recheck the destination and signature at the publication boundary even when preflight passed.

Preserve the original task identity and baseline through clarification, interruptions and continuation. Declare the task's literal relative file scope. Pre-existing changes require explicit adoption; unrelated staged or changed files must not enter a commit. Never infer ownership from everything currently dirty. A missing upstream, detached HEAD, unmerged index or changed destination stops publication with a recoverable local state.

The current helper requires the complete checked working tree to equal the
intended commit. It rejects every changed path outside the checkpoint scope
before freezing the record, including unchanged pre-existing dirt. Preserve
that work and isolate the task in a suitable checkout, or explicitly adopt
only changes already authorized for this task. It does not temporarily stash
unrelated work or certify a filtered tree using checks run on different bytes.

## Lifecycle

1. Begin with a stable task ID, original Git baseline and explicit ownership scope.
2. Implement the authorized work, preserving unrelated changes and private settings. Follow the relevant stack/platform specifications and dependency policy.
3. Run the required implementation checks. Fix defects before advancing; do not relabel a failed or missing check as a cache hit.
4. Prepare one public task record with the actual prompts, visible progress and exact implementation response. Apply the archive privacy/LF boundary and freeze its path and content hash before final verification.
5. Review the final inputs and exact publication scope. Reusable verification evidence follows [the cache contract](cache.md); live LF/export, destination, signing and external-state checks remain required.
6. Prepare a bounded commit message and immutable scope. Create an explicitly signed commit, verify its signature and expected content, then push the exact commit to the allowed ref without force.
7. Verify the remote ref. Preserve separate local-commit, uncertain-transport and confirmed-publication outcomes. Later verification/publication results belong in receipts rather than rewriting the frozen public record.

A failed transport does not prove that a remote update failed. Reconcile the saved attempt and remote ref before any retry. If an outcome cannot be confirmed, retain the commit, attempt and diagnostics and report the uncertainty. No entry point may silently restart a committing or pushing attempt.

The pre-commit hook also compares the staged tree and complete non-ignored
working tree before and after review. A successful check that rewrites a
verification receipt, source file or index still stops the commit. Review and
stage those changes, then obtain a fresh proof. The hook preserves existing
unstaged work and binds Git's validated active index, including an alternate
index; this does not replace the workflow's separate requirement that the
verified working tree equal the intended commit. Configured public signing
metadata does not establish that an SSH agent currently holds the private key.

## Commands and repair

Run `aube run --no-install task:run` with a JSON object on stdin. Every operation
has `sessionId` and a stable caller-selected `taskId`; never invent an earlier
baseline by beginning after implementation. `--help` and `--version` do not read
stdin or execute task work.

| Operation           | Additional fields and behavior                                                                                                                                     |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `begin`             | Capture the actual initial HEAD, target and pre-existing file hashes; preserve an existing task on retry                                                           |
| `status`            | Read state, baseline, scope, archive, commit, `checkpointHash` and `revisionReceipt` without taking the writer lock                                                |
| `verify`            | `phase`: `step`, `review` or `final`; step may format, while review/final preserve source bytes and record a fresh proof                                           |
| `checkpoint`        | `record` follows [the public record schema](conversation-logging.md); `message`, complete `files`, and optional `approvedExistingFiles` define ownership           |
| `revise-checkpoint` | `revisionId`, `expectedCheckpointHash`, bounded non-secret `reason`, complete `files`, and optional `approvedExistingFiles` explicitly renew a repaired checkpoint |
| `prepare`           | Require the frozen record, current proof, exact scope, hooks, signing identity and unchanged remote baseline                                                       |
| `publish`           | Recheck those boundaries, sign and verify the exact commit, push its exact ref, then verify the remote result                                                      |
| `cancel`            | Close an open/checkpointed/ready task; retain evidence and reject cancellation after publication has begun                                                         |

For example, an initial request is data, not executable configuration:

```json
{ "operation": "begin", "sessionId": "actual-session-id", "taskId": "chosen-stable-task-id" }
```

A checkpoint includes every changed path. Include an already existing open
task archive explicitly; a newly created archive is appended automatically.
Pre-existing verification receipts also require explicit adoption. Commit
subjects use `type: Capitalized imperative summary`, at most 100 characters,
without a final period. Supported types are `feat`, `fix`, `perf`, `refactor`,
`docs`, `spec`, `test`, `build`, `ci`, `chore` and `data`; breaking changes require
`BREAKING CHANGE:` guidance. The helper owns its task trailer.

If final verification finds an owned-source defect, repair it and explicitly
revise the checkpoint before verifying again. A revision preserves the original
baseline, message, frozen record and response hash. It renews only the complete
explicit scope, retains immutable old/new checkpoint evidence, and clears the
verification and signing readiness. The archive must remain in scope and
byte-identical. Changing the public implementation response requires a separate
recording decision; revision never rewrites it.

Use `status` to obtain the expected checkpoint hash and choose one stable
revision ID. Exact retries reconcile an already persisted revision receipt;
changed requests or stale hashes fail. Receipts survive an interruption between
their exclusive publication and the task-state update. Revisions are forbidden
after committing/pushing starts. This repair path is distinct from reconciling
an uncertain external publication, which remains an explicit operator task.

## Ownership and diagnostics

Task state and diagnostic logs stay in owned ignored caches. Bound their sizes, versions, paths, queue depths and lifetimes. Use exclusive locks and token-checked release. Lock age alone never proves that a live, foreign or unknown owner is dead. Recovery requires evidence or an explicit operator decision.

The implementation does not automatically reclaim any leftover lock, including
a dead owner's lock, or prune evidence. Inspect ownership before explicit
recovery. State files are limited to 8 MiB. The workflow cache is bounded by
256 MiB, 20,000 files, 128 directories and depth four. Each task permits at most
64 revision receipts, each at most 16 MiB, within that aggregate budget. Limit
failures retain existing evidence. The archive has its own 8 MiB input/output
and 128 MiB aggregate inventory bounds.

Run fixed executable/argument vectors without a shell. Time, byte and line limits must apply to the underlying process and retained output, not only the displayed tail. Cancel and reap owned children. Redact diagnostics before persistence and public summaries; never include credentials, environment dumps, private payloads or uploaded content.

Workflow subprocesses have a 16 MiB combined output bound, 1 MiB line bound and
8 MiB stdin bound. Default commands have 60 seconds; reviewed verification has
300 seconds and the commit wrapper allows its nested hook to finish within
600 seconds. Failed cleanup is reported as unconfirmed, not successful
termination. Review proofs expire after 30 minutes and bind the exact tree,
source/prerequisite key and runtime; live LF/export checks still run before use.

Keep `.env.local`, signing configuration, runtime paths and account credentials local. Never copy source-repository configuration, task state, successful verification receipts or historical authorizations. A cache receipt reports input equivalence and successful local checks; it does not grant publication authority.

## Archives and hooks

The selected archive policy is one frozen public record per changed logical task, using descriptive names without global numeric prefixes. Existing records remain preserved. The authorized [filename migration](analyses/conversation-names.json) maps old names to new names and retains exact originals. Stable identity suffixes resolve collisions without overwriting records.

Root task completion and explicit commands must share the same guards. Subagents do not publish the shared checkout. Preserve manual operation until the actual host supports and trusts the configured hooks; never change product trust or permission mode as part of installation. [Conversation logging](conversation-logging.md) owns the exact public-content and fallback protocol.

Trigon's source-replay integration, worktree queue, release version graph and mandatory bilingual release notes are deferred. The operational documentation set stays compact; this does not impose product documentation quotas on Teamagent's research corpus or historical evidence.
