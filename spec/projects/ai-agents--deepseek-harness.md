# deepseek-harness

Source: [deepseek-harness](https://github.com/deepseek-ai/deepseek-harness) · Category: [ai-agents](../categories/ai-agents.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `5badb15009ae1756c3afe0ae0cef1faafc290ccc`; commit timestamp `2026-10-03T11:48:13+08:00`; 14,208 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/deepseek-ai/deepseek-harness/blob/5badb15009ae1756c3afe0ae0cef1faafc290ccc/README.md)):

> DeepSeek Harness (`dsh`) is an open-source agent harness developed by DeepSeek AI. It is built on an **everything-is-a-plugin** architecture and powered by Cordis, whose design is described in _A Programming Paradigm for Spatiotemporal Composability_.

Build/package evidence: [.github/review-ownership/requirements.txt](https://github.com/deepseek-ai/deepseek-harness/blob/5badb15009ae1756c3afe0ae0cef1faafc290ccc/.github/review-ownership/requirements.txt); [apps/cli/package.json](https://github.com/deepseek-ai/deepseek-harness/blob/5badb15009ae1756c3afe0ae0cef1faafc290ccc/apps/cli/package.json); [apps/desktop-host/package.json](https://github.com/deepseek-ai/deepseek-harness/blob/5badb15009ae1756c3afe0ae0cef1faafc290ccc/apps/desktop-host/package.json); [apps/desktop/package.json](https://github.com/deepseek-ai/deepseek-harness/blob/5badb15009ae1756c3afe0ae0cef1faafc290ccc/apps/desktop/package.json); [apps/web/package.json](https://github.com/deepseek-ai/deepseek-harness/blob/5badb15009ae1756c3afe0ae0cef1faafc290ccc/apps/web/package.json)

License evidence: [LICENSE](https://github.com/deepseek-ai/deepseek-harness/blob/5badb15009ae1756c3afe0ae0cef1faafc290ccc/LICENSE) Classification hint: MIT. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents**. Its category places it in the candidate set for agents, models, channels; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [models](../models.md) · [channels](../channels.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

<!-- teamagent-analysis:start -->
Analysis metadata: source [deepseek-harness](https://github.com/deepseek-ai/deepseek-harness); analyzed commit `5badb15009ae1756c3afe0ae0cef1faafc290ccc`; commit date 2026-10-03T11:48:13+08:00; review date unknown; depth screened. [Maintenance record](../analyses/repos/ai-agents--deepseek-harness.md).
<!-- teamagent-analysis:end -->
