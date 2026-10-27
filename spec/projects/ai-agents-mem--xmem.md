# xmem

Source: [xmem](https://github.com/XortexAI/Xmem) · Category: [ai-agents-mem](../categories/ai-agents-mem.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `ed518422bf0971023b63c0734a4be2664d2f12ee`; commit timestamp `2026-06-03T19:15:57+05:30`; 420 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/XortexAI/Xmem/blob/ed518422bf0971023b63c0734a4be2664d2f12ee/README.md)):

> Give every AI agent and LLM interface persistent, cross-platform memory out of the box. - **[1 June 2026]** XMem now has a native Golang implementation of its memory layer. Built for higher throughput, lower latency, and production-scale deployments where memory needs to operate reliably across millions of interactions.

Build/package evidence: [package.json](https://github.com/XortexAI/Xmem/blob/ed518422bf0971023b63c0734a4be2664d2f12ee/package.json); [packages/create-xmem/package.json](https://github.com/XortexAI/Xmem/blob/ed518422bf0971023b63c0734a4be2664d2f12ee/packages/create-xmem/package.json); [plugin/xmem-antigravity/package.json](https://github.com/XortexAI/Xmem/blob/ed518422bf0971023b63c0734a4be2664d2f12ee/plugin/xmem-antigravity/package.json); [plugin/xmem-claude/package.json](https://github.com/XortexAI/Xmem/blob/ed518422bf0971023b63c0734a4be2664d2f12ee/plugin/xmem-claude/package.json); [plugin/xmem-codex/package.json](https://github.com/XortexAI/Xmem/blob/ed518422bf0971023b63c0734a4be2664d2f12ee/plugin/xmem-codex/package.json)

License evidence: [LICENSE](https://github.com/XortexAI/Xmem/blob/ed518422bf0971023b63c0734a4be2664d2f12ee/LICENSE) Classification hint: BSD; inspect variant. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents-mem**. Its category places it in the candidate set for memory, evolution; those associations are navigational and have not been individually validated as implemented capabilities. See [memory](../memory.md) · [evolution](../evolution.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

<!-- teamagent-analysis:start -->
Analysis metadata: source [xmem](https://github.com/XortexAI/Xmem); analyzed commit `ed518422bf0971023b63c0734a4be2664d2f12ee`; commit date 2026-06-03T19:15:57+05:30; review date unknown; depth screened. [Maintenance record](../analyses/repos/ai-agents-mem--xmem.md).
<!-- teamagent-analysis:end -->
