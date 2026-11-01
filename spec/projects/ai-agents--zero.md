# zero

Source: [zero](https://github.com/Gitlawb/zero) · Category: [ai-agents](../categories/ai-agents.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `99721c762f37cd43ac511007a5f51d1846df959e`; commit timestamp `2026-09-16T07:58:40+08:00`; 1,539 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/Gitlawb/zero/blob/99721c762f37cd43ac511007a5f51d1846df959e/README.md)):

> Zero is an AI coding agent for your local terminal. It can inspect a repository, edit files, run commands, use browser/terminal helpers, and keep durable local

Build/package evidence: [go.mod](https://github.com/Gitlawb/zero/blob/99721c762f37cd43ac511007a5f51d1846df959e/go.mod); [internal/agenteval/testdata/fixtures/zero-mini/go.mod](https://github.com/Gitlawb/zero/blob/99721c762f37cd43ac511007a5f51d1846df959e/internal/agenteval/testdata/fixtures/zero-mini/go.mod); [internal/perfbench/testdata/edit/go.mod](https://github.com/Gitlawb/zero/blob/99721c762f37cd43ac511007a5f51d1846df959e/internal/perfbench/testdata/edit/go.mod); [internal/perfbench/testdata/fix/go.mod](https://github.com/Gitlawb/zero/blob/99721c762f37cd43ac511007a5f51d1846df959e/internal/perfbench/testdata/fix/go.mod); [internal/perfbench/testdata/nav/go.mod](https://github.com/Gitlawb/zero/blob/99721c762f37cd43ac511007a5f51d1846df959e/internal/perfbench/testdata/nav/go.mod)

License evidence: [LICENSE](https://github.com/Gitlawb/zero/blob/99721c762f37cd43ac511007a5f51d1846df959e/LICENSE) Classification hint: MIT. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents**. Its category places it in the candidate set for agents, models, channels; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [models](../models.md) · [channels](../channels.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

## 2026-10-28 scoped source review

Source: [zero](https://github.com/Gitlawb/zero); inspected saved discovery revision `4247a07aba0f89c3c2597314a33edaede56be70c`. Prior analyzed revision `99721c762f37cd43ac511007a5f51d1846df959e` remains historical evidence.

**Scope:** Complete 612-line shell tool. Path resolver, platform process cleanup, sandbox engine, spill/redaction helpers and tests were not inspected; source identity remains Gitlawb/zero despite Twigpine import paths.

The [shell entry point](https://github.com/Gitlawb/zero/blob/4247a07aba0f89c3c2597314a33edaede56be70c/internal/tools/bash.go#L88-L218) validates timeout arguments, resolves the scoped working directory, creates a deadline, records the actual execution plan, and obtains an execution outcome separately from text output. Process-group cleanup and containment are delegated to helpers. The [engine selection and direct launch](https://github.com/Gitlawb/zero/blob/4247a07aba0f89c3c2597314a33edaede56be70c/internal/tools/bash.go#L242-L335) make a nil engine explicitly unsandboxed, including the plain `Run` path; the command's working directory alone does not restrict what shell code can access. An upstream permission gate must own admission before this API is called.

[Capture and presentation](https://github.com/Gitlawb/zero/blob/4247a07aba0f89c3c2597314a33edaede56be70c/internal/tools/bash.go#L423-L602) distinguish true byte totals, retained head/tail data, emitted data and a marked capture gap. A spill contains only captured bytes, not necessarily the full original stream. The buffer appends each incoming chunk before compacting its tail, so this helper's instantaneous allocation also depends on the caller's write chunk size; its fixed retained size is not a universal peak-memory proof. Timeout paths retain structured execution evidence rather than declaring ordinary completion.

[Model-output formatting](https://github.com/Gitlawb/zero/blob/4247a07aba0f89c3c2597314a33edaede56be70c/internal/tools/bash.go#L396-L420) redacts likely secrets. Direct-call spilling occurs earlier through a separate helper whose own redaction/storage rules were not read, so this file alone cannot establish artifact privacy. Teamagent can borrow explicit enforcement receipts and truthful truncation markers, but should require a non-optional admitted execution context, bounded capture at ingress, and redaction across both display and stored artifacts. No shell, sandbox, upstream test or provider was executed.

## 2026-11-01 test-only refresh

Reviewed the complete one-file delta from `4247a07aba0f89c3c2597314a33edaede56be70c` to `2e10a4b60b5ef8ebbf18bde8aea6dbfc65c7b43b`: [the concurrency-cap fixture](https://github.com/Gitlawb/zero/blob/2e10a4b60b5ef8ebbf18bde8aea6dbfc65c7b43b/internal/swarm/lifecycle_test.go#L147-L162). Production source is unchanged in this delta.

The fixture now waits for all five task records to be done **and** for both running-member and queued-task counts to reach zero, instead of checking those counts immediately after task completion. It retains the expected launch count. This encodes the distinction between a logical terminal result and settled supervisor capacity; it does not itself establish process-tree termination or external-effect completion. Teamagent acceptance should observe owned-resource settlement in addition to task status. The supervisor implementation and wait helper were not re-audited, and the fixture was not executed.

<!-- teamagent-analysis:start -->
Analysis metadata: source [zero](https://github.com/Gitlawb/zero); analyzed commit `2e10a4b60b5ef8ebbf18bde8aea6dbfc65c7b43b`; commit date 2026-10-29T06:30:41-07:00; review date 2026-11-01T11:35:43.470Z; depth screened. [Maintenance record](../analyses/repos/ai-agents--zero.md).
<!-- teamagent-analysis:end -->
