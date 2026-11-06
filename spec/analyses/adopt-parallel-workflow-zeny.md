# Apply the shared parallel workflow to Ženy z Kraje

Use this prompt in the Ženy z Kraje repository after the Teamagent skills commit
is published. Resolve and record a full reviewed Teamagent commit first.

> Adopt Teamagent's shared parallel-task workflow and selected reusable skills.
> Read current AGENTS, workflow/task-lifecycle/cache/skills/patch specifications
> and the concrete editor-data, release and preview adapters. Preserve the
> original task baseline, unrelated edits, frozen records and local authority.
>
> Inspect current code rather than assuming the old description is still true.
> The comparison baseline was 04b38512a503b0063c93898a6a00371b5851cb63: tasks
> already use codex/* branches and .cache worktrees, while integration creates a
> squashed signed source replay plus a signed --no-ff merge. Replace that shape
> with signed task commits rebased onto current main and an ordinary fast-forward
> push. Preserve published task refs and the original-to-integrated mapping;
> never force-push or silently flatten unsupported histories.
>
> Resolve .cache/worktrees from the canonical primary checkout, including calls
> from linked worktrees. Keep one isolated index, mutable cache/dependency set
> and resource owner per task. Serialize only integration in common Git state.
> Prefer explicit integration selection or a real recorded FIFO order; sorted
> hash filenames are not FIFO. Keep conflict and failed candidates for explicit
> repair. A published result must remain published if later bookkeeping fails.
>
> Preserve the editor-data adoption/claim protocol, release/version changes,
> primary preview ownership and required preview refresh as local adapters.
> They must not become universal skills or be silently omitted after successful
> Git integration. Retain exact destination, signed publication, task identity,
> scope, conversation freeze and unknown-owner lock protections. Do not use the
> generic lock's age-expiry default for integration ownership.
>
> Add a local/pr mode switch with real exact-head/base approval and required-check
> admission. Recheck before publication. Use signed local rebase and ordinary
> push where repository protection permits; GitHub's native Rebase and merge
> rewrites SHAs without user signatures. Do not bypass protection or equate a
> submitted PR with an integrated task.
>
> Preserve the existing verification coverage, deadlines, output integrity and
> staged-tree rules. Use the already-verified task checkout on an unchanged-base
> fast path. Prepare an isolated changed-base candidate before cold verification;
> final admission must match the combined source and current external state.
> Keep generated verification evidence separate from source edits without
> silently discarding tracked files or reusing another tree's successful result.
>
> Read Teamagent spec/reusable-skills.md. Reuse the existing staged Vercel Skills
> adapter, adding reviewed full-SHA refs and explicit agent selections. Use Aube
> to pin the CLI and Bun to run it. Install only task-worktrees, rebase-integration,
> verification-evidence, project-toolchain, resource-lifecycle,
> conversation-records, dependency-patches and skills-distribution; select
> typed-modules only if compatible. Preserve unrelated skills/locks/local edits,
> staged rollback and hook trust. Keep product policy local and current patch
> authority unchanged pending a separately approved registry migration.
>
> Test parallel tasks, changed main, signature/linear-history preservation,
> dirty-primary protection, editor claims, conflicts, verification failures,
> source/base/PR races, uncertain publication and preview refresh ownership.
> Run the repository gates and applicable real browser/native checks. Freeze the
> public implementation response before final verification and publish only
> through the currently authorized signed destination. Report actual outcomes.
