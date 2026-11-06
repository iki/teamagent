# Parallel task workflow review

Reviewed local checkouts on 2026-11-06. This is a source audit and implementation
decision, not a remote freshness claim or a throughput benchmark. Teamagent's
original task baseline is `e127a83f50fe7b7396e0b0e02c2f0a2759d03721`.

| Repository | Inspected revision | Existing behavior |
| --- | --- | --- |
| Teamagent | `e127a83f50fe7b7396e0b0e02c2f0a2759d03721` | One checked, signed commit and ordinary push from the configured main checkout; explicit file scope, frozen public record, exact-input verification and uncertain-publication state. |
| Trigon | `fd399cca7dd90f3f3f8601233986a6e5ad81b578` | Main publication plus isolated `codex/*` task worktrees; published task branches enter a common-Git integration queue. Integration squashes the source delta into a signed replay commit and adds a signed non-fast-forward merge commit. |
| Ženy z Kraje | `04b38512a503b0063c93898a6a00371b5851cb63` | Isolated task worktrees and shared integration state; the same signed source replay plus explicit merge shape, with project-specific editor data, release and preview duties. |

The neighboring repositories already have worktree support. Neither inspected
integration implementation produces the requested linear, commit-preserving
history. Both expose a PR backend interface but do not implement a PR backend.
No neighboring files, trust settings or repositories were changed by this task.

## Evidence

- Trigon's [task lifecycle](https://github.com/iki/trigon/blob/fd399cca7dd90f3f3f8601233986a6e5ad81b578/spec/task-lifecycle.md),
  [worktree creation](https://github.com/iki/trigon/blob/fd399cca7dd90f3f3f8601233986a6e5ad81b578/app/trigon-conversations/task-worktree.ts),
  and [integration](https://github.com/iki/trigon/blob/fd399cca7dd90f3f3f8601233986a6e5ad81b578/app/trigon-conversations/task-integration.ts).
- Ženy's [worktree creation](https://github.com/iki/x-zeny-z-kraje/blob/04b38512a503b0063c93898a6a00371b5851cb63/app/conversations/task-worktree.ts),
  [integration](https://github.com/iki/x-zeny-z-kraje/blob/04b38512a503b0063c93898a6a00371b5851cb63/app/conversations/task-integration.ts),
  and [queue](https://github.com/iki/x-zeny-z-kraje/blob/04b38512a503b0063c93898a6a00371b5851cb63/app/conversations/integration-queue.ts).
- Teamagent's [workflow](../workflow.md), [cache](../cache.md),
  [resources](../resources.md) and [launcher](../project-launcher.md) contracts.

Ženy's queue sorts hash filenames, which is deterministic but not FIFO. Its
worktree root follows the invoking checkout, allowing nested worktree paths.
The new design uses a canonical primary checkout and explicit integration
selection under one shared lock. It does not claim a fair background scheduler.

## Selected design

Each independent task has a stable ID, branch, worktree, index, dependencies,
temporary ownership and mutable caches. Subagents cooperate inside that task
with declared file ownership; independent tasks use different worktrees.
The primary checkout is an administration and inspection surface. It need not
be clean for another isolated task to start, and integration must preserve its
dirty files.

Each logical task currently publishes one final checked, signed commit. This
is the existing task contract, not an automatic squash of a multi-commit range.
Integration retains that commit when main has not advanced; otherwise it replays
and signs a copy on current main. Each task remains a distinct commit on main.
Published task refs remain unchanged. Extra source commits and merge histories
are rejected rather than silently flattened.

Only integration is serialized. An explicit prepare stage gives a changed-base
candidate its own checkout and frozen dependencies, so a cold verification run
can finish under the existing unit budget before bounded final review. A fast
path uses the clean task worktree when its signed commit already extends main.
Reuse remains subject to exact source, prerequisites, runtime, output and staged
tree validation. No verification deadline or coverage reduction is part of this
design. No measured speedup is claimed.

PR mode adds review and check admission for the exact branch/head/base. GitHub's
built-in rebase button rewrites SHAs without retaining user signatures. Therefore
the signed workflow integrates locally and makes an ordinary fast-forward push
after the PR gate. Repository protection can reject that push; the tool cannot
bypass it. See [GitHub's signature limitation](https://docs.github.com/en/authentication/managing-commit-signature-verification/about-commit-signature-verification#signature-verification-for-rebase-and-merge).

## Reuse boundary

[Nine selectable skills](../reusable-skills.md) carry portable procedures.
Project policy retains exact destinations, authorization, scripts, pins,
platform acceptance, limits and product-specific side effects. A skill never
grants publication rights, activates hooks or supplies a successful receipt.

Git mutation, locks, process ownership, schema decoding and verification remain
tested executable code. Replacing that code with prose would weaken enforcement.
If several consumers need identical executable behavior, extract one versioned
tooling package with injected project adapters after the APIs stabilize; do not
copy a full engine into each skill. This increment distributes guidance through
Vercel Skills and implements the engine in Teamagent. The adoption prompts ask
consumers to adapt and verify their existing enforcement.

## Shared patch ownership

Recommend a small dedicated repository, such as `stack-patches`, for the shared
registry and immutable patch bundles. Patch applicability, upstream fixes and
retirement have a different lifecycle from harness releases. Keep the procedure
skill in Teamagent. Keep actual fixes on their appropriate upstream forks when
possible; registry entries identify exact commits, package versions, artifact
hashes, licenses, regressions and removal conditions. Consumers vendor only the
selected immutable artifacts so normal integrity checks stay offline.

Teamagent is a reasonable temporary registry owner if avoiding a fourth repository
is more valuable than release separation. Choose one owner at a time. This task
does not transfer current Trigon authority or copy a competing registry. A later
migration must preserve existing artifact bytes/provenance, update every consumer,
run consumer regressions and leave forwarding records at the former owner.

Adoption prompts: [Trigon](adopt-parallel-workflow-trigon.md) and
[Ženy z Kraje](adopt-parallel-workflow-zeny.md). Runtime validation and publication
outcomes belong in the task receipts; source inspection alone is not execution
evidence.
