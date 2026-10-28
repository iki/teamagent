# electric

Source: [electric](https://github.com/electric-sql/electric) · Category: [ai-agents](../categories/ai-agents.md)

Original review depth: **inventory / README screening only**. The dated update review below has its own explicit scope. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

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

## 2026-10-27 scoped update review

Reviewed commit `3f9809fb0bd894cb74470d434749673492ad7acf` (commit date `2026-10-06T10:09:42-06:00`). The original snapshot above remains historical evidence.

**Scope:** Complete one-file delta and the 164-line image-publication workflow read. No application runtime paths changed in this comparison; no container build or registry request was made.

The delta restores image publication from the temporary Docker Hub destination to `electricsql/electric`, with canary images also targeting `electricsql/electric-canary`. The [workflow's destination and tagging logic](https://github.com/electric-sql/electric/blob/3f9809fb0bd894cb74470d434749673492ad7acf/.github/workflows/sync_service_dockerhub_image.yml#L33-L35) and [release/custom/canary branches](https://github.com/electric-sql/electric/blob/3f9809fb0bd894cb74470d434749673492ad7acf/.github/workflows/sync_service_dockerhub_image.yml#L117-L132) are deployment evidence, not a change to sync semantics.

The workflow continues to resolve an exact commit and pass it to the [build job and revision labels](https://github.com/electric-sql/electric/blob/3f9809fb0bd894cb74470d434749673492ad7acf/.github/workflows/sync_service_dockerhub_image.yml#L145-L164). Teamagent should similarly retain source revision and artifact digest separately from a mutable image tag or registry destination. **Disposition:** retain Electric as a synchronization reference; this small deployment delta does not establish task scheduling, agent isolation, delivery guarantees, image availability or runtime compatibility. Existing runtime questions remain open.

**Verification limit:** source inspection only; no upstream tests or provider calls were executed. This scoped review does not certify every file in the repository.

<!-- teamagent-analysis:start -->
Analysis metadata: source [electric](https://github.com/electric-sql/electric); analyzed commit `3f9809fb0bd894cb74470d434749673492ad7acf`; commit date 2026-10-06T10:09:42-06:00; review date 2026-10-28T08:26:04.502Z; depth screened. [Maintenance record](../analyses/repos/ai-agents--electric.md).
<!-- teamagent-analysis:end -->
