# agents-cli

Source: [agents-cli](https://github.com/google/agents-cli) · Category: [ai-agents](../categories/ai-agents.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `2c3945901e8e5cc933fa94fa44d1d4aaf644b596`; commit timestamp `2026-09-30T11:14:13Z`; 469 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/google/agents-cli/blob/2c3945901e8e5cc933fa94fa44d1d4aaf644b596/README.md)):

> The CLI and skills for building agents on Gemini Enterprise Agent Platform. Turn your favorite coding assistant into an expert at building and deploying agents on Google Cloud.

Build/package evidence: [docs/pyproject.toml](https://github.com/google/agents-cli/blob/2c3945901e8e5cc933fa94fa44d1d4aaf644b596/docs/pyproject.toml); [extensions/langchain/template/pyproject.toml](https://github.com/google/agents-cli/blob/2c3945901e8e5cc933fa94fa44d1d4aaf644b596/extensions/langchain/template/pyproject.toml); [src/google/agents/cli/scaffold/agents/adk_go/go.mod](https://github.com/google/agents-cli/blob/2c3945901e8e5cc933fa94fa44d1d4aaf644b596/src/google/agents/cli/scaffold/agents/adk_go/go.mod); [src/google/agents/cli/scaffold/agents/adk_java/pom.xml](https://github.com/google/agents-cli/blob/2c3945901e8e5cc933fa94fa44d1d4aaf644b596/src/google/agents/cli/scaffold/agents/adk_java/pom.xml); [src/google/agents/cli/scaffold/agents/adk_ts/package.json](https://github.com/google/agents-cli/blob/2c3945901e8e5cc933fa94fa44d1d4aaf644b596/src/google/agents/cli/scaffold/agents/adk_ts/package.json)

License evidence: [LICENSE](https://github.com/google/agents-cli/blob/2c3945901e8e5cc933fa94fa44d1d4aaf644b596/LICENSE) Classification hint: Apache-2.0. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents**. Its category places it in the candidate set for agents, models, channels; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [models](../models.md) · [channels](../channels.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

<!-- teamagent-analysis:start -->
Analysis metadata: source [agents-cli](https://github.com/google/agents-cli); analyzed commit `2c3945901e8e5cc933fa94fa44d1d4aaf644b596`; commit date 2026-09-30T11:14:13Z; review date unknown; depth screened. [Maintenance record](../analyses/repos/ai-agents--agents-cli.md).
<!-- teamagent-analysis:end -->
