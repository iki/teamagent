# Apply the shared parallel workflow to Trigon

Use this prompt in the Trigon repository after the Teamagent skills commit is
published. Resolve and record a full reviewed Teamagent commit; never substitute
an unreviewed moving branch or copy another project's task state.

> Adopt Teamagent's parallel-task workflow and the applicable reusable skills.
> Read the current AGENTS and workflow/task-lifecycle/cache/resources/launcher/
> patch specifications and installed skills first. Preserve this task's original
> baseline, existing dirty work, task records and authorization boundaries.
>
> Inspect the current implementation; the comparison baseline was Trigon
> fd399cca7dd90f3f3f8601233986a6e5ad81b578. It already creates isolated task
> worktrees and queues integrations. Replace its whole-delta replay plus signed
> --no-ff merge with linear signed integration. Each normal logical task keeps
> its checked commit; rebase a signed copy onto current main when needed, preserve
> the published task branch, and ordinary-push only a fast-forward result. Do not
> squash independent tasks, force-push, rewrite published main, bypass protection
> or silently resolve conflicts. Reject unsupported histories explicitly.
>
> Keep .cache worktrees under the canonical primary checkout even when invoked
> from a linked worktree. Keep indexes, mutable caches, dependencies and process
> ownership separate. Use common-Git coordination only for the serialized
> integration boundary. Keep stable task IDs, original baselines, explicit file
> ownership and the frozen public conversation record. Retain uncertain attempts
> and reconcile exact remote refs before retrying. Never reclaim locks by age.
>
> Add a simple local/pr policy switch. PR mode must check exact head/base,
> approval and required checks, recheck immediately before publication and use
> signed local integration where repository protection permits it. GitHub's
> native Rebase and merge cannot preserve user signatures. Do not claim PR
> creation or submission is integration. Keep release/version/bilingual-note
> rules in Trigon's local adapter.
>
> Preserve every verification input, prerequisite, live check, test and deadline.
> Reuse exact receipts on the unchanged-base fast path. Prepare an isolated
> changed-base candidate before running a cold full check, then revalidate the
> candidate and refs at publication. Do not copy mutable caches or replace
> final verification with a previous branch result.
>
> Read Teamagent spec/reusable-skills.md and its pinned distribution evidence.
> Install only task-worktrees, rebase-integration, verification-evidence,
> project-toolchain, resource-lifecycle, conversation-records, dependency-patches
> and skills-distribution from a reviewed full Teamagent SHA using the pinned
> Vercel Skills CLI through Bun, installed by Aube. Add typed-modules only if its
> contract matches the adopted stack. Extend the existing staged skills installer
> to support exact refs and explicit selected agents; preserve unrelated skills,
> their locks, local edits and rollback. Do not use wildcard/global updates or
> activate product-hook trust. Teamagent owns these skill sources; the project
> owns its commands, versions, remote and authorization. Keep patch authority as
> currently configured until a separate registry migration is approved.
>
> Test two concurrent task worktrees, main advancing, signed linear integration,
> dirty-primary preservation, conflicts, changed source/main refs, failed checks,
> lock contention, uncertain push reconciliation, policy changes and PR races.
> Run the existing full gates and relevant application acceptance. Freeze the
> exact public implementation response before final verification/publication.
> Use only the repository's existing authorized signed publication destination.
> Report measured results and any blocked protection or environment requirement.
