# xx-2604-memento

Source: [xx-2604-memento](https://github.com/microsoft/memento) · Category: [ai-agents-mem](../categories/ai-agents-mem.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `d8c10e66ff313844b4b5f063dd4c075d3ea56aab`; commit timestamp `2026-04-08T19:51:52-04:00`; 81 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/microsoft/memento/blob/d8c10e66ff313844b4b5f063dd4c075d3ea56aab/README.md)):

> Memento** extends the effective output length of large language models by splitting chain-of-thought reasoning into **blocks** and **summaries** (memento). After each reasoning block, the model generates a short summary, then the block content is evicted from the KV cache. The model continues from the summary with a shorter context, enabling more reasoning within a fixed context window. See vllm/README.md for full documentation, including API usage and alternative setup options.

Build/package evidence: [data/requirements.txt](https://github.com/microsoft/memento/blob/d8c10e66ff313844b4b5f063dd4c075d3ea56aab/data/requirements.txt)

License evidence: [LICENSE](https://github.com/microsoft/memento/blob/d8c10e66ff313844b4b5f063dd4c075d3ea56aab/LICENSE) Classification hint: MIT. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents-mem**. Its category places it in the candidate set for memory, evolution; those associations are navigational and have not been individually validated as implemented capabilities. See [memory](../memory.md) · [evolution](../evolution.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

<!-- teamagent-analysis:start -->
Analysis metadata: source [memento](https://github.com/microsoft/memento); analyzed commit `d8c10e66ff313844b4b5f063dd4c075d3ea56aab`; commit date 2026-04-08T19:51:52-04:00; review date unknown; depth screened. [Maintenance record](../analyses/repos/ai-agents-mem--xx-2604-memento.md).
<!-- teamagent-analysis:end -->
