# electric

Source: [electric](https://github.com/electric-sql/electric) · Category: [ai-agents](../categories/ai-agents.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `236293974902a08990ffc9ece5ab6ce58d76cd84`; commit timestamp `2026-10-03T10:34:25-06:00`; 3,911 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/electric-sql/electric/blob/236293974902a08990ffc9ece5ab6ce58d76cd84/README.md)):

> Sync is the magic ingredient behind fast, modern software. From apps like Figma and Linear to AI agents running on live local data. Electric is a Postgres sync engine. It solves the hard problems of sync for you, including partial replication, fan-out, and data delivery. So you can build awesome software, without rolling your own sync.

Build/package evidence: [examples/.shared/package.json](https://github.com/electric-sql/electric/blob/236293974902a08990ffc9ece5ab6ce58d76cd84/examples/.shared/package.json); [examples/agents-chat-starter/package.json](https://github.com/electric-sql/electric/blob/236293974902a08990ffc9ece5ab6ce58d76cd84/examples/agents-chat-starter/package.json); [examples/agents-playground/package.json](https://github.com/electric-sql/electric/blob/236293974902a08990ffc9ece5ab6ce58d76cd84/examples/agents-playground/package.json); [examples/agents-walkthrough/package.json](https://github.com/electric-sql/electric/blob/236293974902a08990ffc9ece5ab6ce58d76cd84/examples/agents-walkthrough/package.json); [examples/bash/package.json](https://github.com/electric-sql/electric/blob/236293974902a08990ffc9ece5ab6ce58d76cd84/examples/bash/package.json)

License evidence: [LICENSE](https://github.com/electric-sql/electric/blob/236293974902a08990ffc9ece5ab6ce58d76cd84/LICENSE) Classification hint: Apache-2.0. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents**. Its category places it in the candidate set for agents, models, channels; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [models](../models.md) · [channels](../channels.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

<!-- teamagent-analysis:start -->
Analysis metadata: source [electric](https://github.com/electric-sql/electric); analyzed commit `236293974902a08990ffc9ece5ab6ce58d76cd84`; commit date 2026-10-03T10:34:25-06:00; review date unknown; depth screened. [Maintenance record](../analyses/repos/ai-agents--electric.md).
<!-- teamagent-analysis:end -->
