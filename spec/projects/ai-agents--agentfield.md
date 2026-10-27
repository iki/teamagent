# agentfield

Source: [agentfield](https://github.com/Agent-Field/agentfield) · Category: [ai-agents](../categories/ai-agents.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `ba7da28c45e1dace96250fa5914ce7ee304b320d`; commit timestamp `2026-10-01T21:51:23Z`; 2,852 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/Agent-Field/agentfield/blob/ba7da28c45e1dace96250fa5914ce7ee304b320d/README.md)):

> One request fans out to thousands of agents. The control plane queues, retries, and traces every branch. [](https://github.com/Agent-Field/agentfield/actions/workflows/coverage.yml)

Build/package evidence: [control-plane/go.mod](https://github.com/Agent-Field/agentfield/blob/ba7da28c45e1dace96250fa5914ce7ee304b320d/control-plane/go.mod); [control-plane/third_party/systray/go.mod](https://github.com/Agent-Field/agentfield/blob/ba7da28c45e1dace96250fa5914ce7ee304b320d/control-plane/third_party/systray/go.mod); [control-plane/tools/perf/requirements.txt](https://github.com/Agent-Field/agentfield/blob/ba7da28c45e1dace96250fa5914ce7ee304b320d/control-plane/tools/perf/requirements.txt); [control-plane/web/client/package.json](https://github.com/Agent-Field/agentfield/blob/ba7da28c45e1dace96250fa5914ce7ee304b320d/control-plane/web/client/package.json); [desktop/package.json](https://github.com/Agent-Field/agentfield/blob/ba7da28c45e1dace96250fa5914ce7ee304b320d/desktop/package.json)

License evidence: [LICENSE](https://github.com/Agent-Field/agentfield/blob/ba7da28c45e1dace96250fa5914ce7ee304b320d/LICENSE) Classification hint: Apache-2.0. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents**. Its category places it in the candidate set for agents, models, channels; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [models](../models.md) · [channels](../channels.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

<!-- teamagent-analysis:start -->
Analysis metadata: source [agentfield](https://github.com/Agent-Field/agentfield); analyzed commit `ba7da28c45e1dace96250fa5914ce7ee304b320d`; commit date 2026-10-01T21:51:23Z; review date unknown; depth screened. [Maintenance record](../analyses/repos/ai-agents--agentfield.md).
<!-- teamagent-analysis:end -->
