# adk-go

Source: [adk-go](https://github.com/google/adk-go) · Category: [ai-agents](../categories/ai-agents.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `33377de49cf24da7cda478250708460f5e6479fe`; commit timestamp `2026-10-03T15:56:25+02:00`; 1,074 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/google/adk-go/blob/33377de49cf24da7cda478250708460f5e6479fe/README.md)):

> [](https://github.com/google/adk-go/actions/workflows/nightly.yml) An open-source, code-first Go toolkit for building, evaluating, and deploying sophisticated AI agents with flexibility and control.

Build/package evidence: [go.mod](https://github.com/google/adk-go/blob/33377de49cf24da7cda478250708460f5e6479fe/go.mod); [plugin/agentanalytics/go.mod](https://github.com/google/adk-go/blob/33377de49cf24da7cda478250708460f5e6479fe/plugin/agentanalytics/go.mod)

License evidence: [LICENSE](https://github.com/google/adk-go/blob/33377de49cf24da7cda478250708460f5e6479fe/LICENSE) Classification hint: Apache-2.0. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents**. Its category places it in the candidate set for agents, models, channels; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [models](../models.md) · [channels](../channels.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

<!-- teamagent-analysis:start -->
Analysis metadata: source [adk-go](https://github.com/google/adk-go); analyzed commit `33377de49cf24da7cda478250708460f5e6479fe`; commit date 2026-10-03T15:56:25+02:00; review date unknown; depth screened. [Maintenance record](../analyses/repos/ai-agents--adk-go.md).
<!-- teamagent-analysis:end -->
