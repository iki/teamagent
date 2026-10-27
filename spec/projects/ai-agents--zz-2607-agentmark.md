# zz-2607-agentmark

Source: [zz-2607-agentmark](https://github.com/iki/zz-2607-agentmark) · Category: [ai-agents](../categories/ai-agents.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `624c18817e53be47900698d28adb0c4fd2207e04`; commit timestamp `2026-07-01T04:32:09Z`; 1,124 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/iki/zz-2607-agentmark/blob/624c18817e53be47900698d28adb0c4fd2207e04/README.md)):

> Prompts and datasets in your repo. Evals in CI. Traces in your OTEL backend. AgentMark is an open-source platform for building reliable AI agents. Define prompts in Markdown, run them with the SDK you already use, evaluate against datasets locally or in CI, and trace every call with OpenTelemetry.

Build/package evidence: [package.json](https://github.com/iki/zz-2607-agentmark/blob/624c18817e53be47900698d28adb0c4fd2207e04/package.json); [packages/api-schemas/package.json](https://github.com/iki/zz-2607-agentmark/blob/624c18817e53be47900698d28adb0c4fd2207e04/packages/api-schemas/package.json); [packages/api-types/package.json](https://github.com/iki/zz-2607-agentmark/blob/624c18817e53be47900698d28adb0c4fd2207e04/packages/api-types/package.json); [packages/cli/package.json](https://github.com/iki/zz-2607-agentmark/blob/624c18817e53be47900698d28adb0c4fd2207e04/packages/cli/package.json); [packages/conformance-vectors/package.json](https://github.com/iki/zz-2607-agentmark/blob/624c18817e53be47900698d28adb0c4fd2207e04/packages/conformance-vectors/package.json)

License evidence: [LICENSE.md](https://github.com/iki/zz-2607-agentmark/blob/624c18817e53be47900698d28adb0c4fd2207e04/LICENSE.md) Classification hint: AGPL; inspect version. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents**. Its category places it in the candidate set for agents, models, channels; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [models](../models.md) · [channels](../channels.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

<!-- teamagent-analysis:start -->
Analysis metadata: source [agentmark](https://github.com/iki/zz-2607-agentmark); analyzed commit `624c18817e53be47900698d28adb0c4fd2207e04`; commit date 2026-07-01T04:32:09Z; review date unknown; depth screened. [Maintenance record](../analyses/repos/ai-agents--zz-2607-agentmark.md).
<!-- teamagent-analysis:end -->
