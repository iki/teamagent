# codeaf

Source: [codeaf](https://github.com/Agent-Field/CodeAF) · Category: [ai-agents](../categories/ai-agents.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `06a3283dd74385bf3c86ffc799c47b51b24fb0f7`; commit timestamp `2026-10-02T14:23:42-04:00`; 6,783 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/Agent-Field/CodeAF/blob/06a3283dd74385bf3c86ffc799c47b51b24fb0f7/README.md)):

> CodeAF is a coding harness built for open models, to get the most out of every dollar. It is also a different way to work once more than one thing is going on:

Build/package evidence: [bench/bashloop/fixtures/c1-small-fix/go.mod](https://github.com/Agent-Field/CodeAF/blob/06a3283dd74385bf3c86ffc799c47b51b24fb0f7/bench/bashloop/fixtures/c1-small-fix/go.mod); [bench/bashloop/fixtures/c2-feature/go.mod](https://github.com/Agent-Field/CodeAF/blob/06a3283dd74385bf3c86ffc799c47b51b24fb0f7/bench/bashloop/fixtures/c2-feature/go.mod); [bench/bashloop/fixtures/c3-refactor/go.mod](https://github.com/Agent-Field/CodeAF/blob/06a3283dd74385bf3c86ffc799c47b51b24fb0f7/bench/bashloop/fixtures/c3-refactor/go.mod); [bench/bashloop/fixtures/c5-wide/go.mod](https://github.com/Agent-Field/CodeAF/blob/06a3283dd74385bf3c86ffc799c47b51b24fb0f7/bench/bashloop/fixtures/c5-wide/go.mod); [go.mod](https://github.com/Agent-Field/CodeAF/blob/06a3283dd74385bf3c86ffc799c47b51b24fb0f7/go.mod)

License evidence: [LICENSE](https://github.com/Agent-Field/CodeAF/blob/06a3283dd74385bf3c86ffc799c47b51b24fb0f7/LICENSE) Classification hint: Apache-2.0. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents**. Its category places it in the candidate set for agents, models, channels; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [models](../models.md) · [channels](../channels.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

## 2026-10-28 divergent-history investigation and scoped source review

Source: [codeaf](https://github.com/Agent-Field/CodeAF); inspected snapshot `3bf6072fdd8a64f6497634191fa20f23730fe8cb`; prior analyzed commit `06a3283dd74385bf3c86ffc799c47b51b24fb0f7`. The inspected snapshot is the saved discovery version, not a claim about the checkout's latest HEAD.

**Scope:** Complete committed path inventory (6,262 paths); full approvalmemory.go (323 lines) and agentsession/session.go (351 lines). No upstream tests or providers executed.

**History outcome:** both full commits are available, but the analyzed commit is not an ancestor and the complete trees differ. The two-tree comparison contains 6,262 changed paths; common ancestor: `4a4ca21f15ff0c5e842f638d6aacb7b68fa50095`. These counts establish comparison coverage, not semantic review of every file. The prior analyzed baseline and findings remain preserved as historical evidence. A separately acknowledged, guarded reconciliation records the inspected revision as a new scoped analysis baseline; it does not establish ancestry, publisher intent or whole-project correctness. The managed metadata below is authoritative for whether that acknowledgment has been recorded.

[Approval memory](https://github.com/Agent-Field/CodeAF/blob/3bf6072fdd8a64f6497634191fa20f23730fe8cb/internal/config/approvalmemory.go) rejects malformed existing rules, preserves ordering and avoids duplicate grants. Remembering a Bash pattern refuses compound/empty command shapes and standing deny/prompt matches through delegated policy functions. Its comments explicitly distinguish a user-config write from a session decision and explain that a repository layer can override the user's row. The full matcher and atomic writer were outside this scope; do not equate these checks with shell isolation.

The [bounded audit session](https://github.com/Agent-Field/CodeAF/blob/3bf6072fdd8a64f6497634191fa20f23730fe8cb/internal/agentsession/session.go) validates required turn/policy limits and locally validates output JSON. It reserves at most half of the remaining deadline for answering, removes tool definitions at the answer phase and retains provider failures separately from a schema-invalid completed response. An explicit unsupported-format refusal can retry without that provider format while retaining local validation and consuming a turn. ContextChars is a coarse running byte count of selected prompt/tool data, not an exact token or complete transcript budget; response.Choices[0] assumes a provider response shape here. Adopt the separate read/answer budgets and independent schema checks, while validating external response shape and measuring acceptance rather than assuming a well-formed audit is correct.

<!-- teamagent-analysis:start -->
Analysis metadata: source [codeaf](https://github.com/Agent-Field/CodeAF); analyzed commit `3bf6072fdd8a64f6497634191fa20f23730fe8cb`; commit date 2026-10-27T11:49:16-04:00; review date 2026-10-28T09:45:33.667Z; depth screened. [Maintenance record](../analyses/repos/ai-agents--codeaf.md).
<!-- teamagent-analysis:end -->
