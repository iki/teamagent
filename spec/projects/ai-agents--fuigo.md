# fuigo

Source: [fuigo](https://github.com/FerroxLabs/fuigo) · Category: [ai-agents](../categories/ai-agents.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `2eb306e08ae24d05c15c74b6b1c1d3235e0f1d96`; commit timestamp `2026-09-17T18:52:23+07:00`; 3,794 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/FerroxLabs/fuigo/blob/2eb306e08ae24d05c15c74b6b1c1d3235e0f1d96/README.md)):

> Get started · Headless CLI · ACP integration · Memory · Documentation · Build from source Fuigo is a general-purpose, multi-provider AI agent engine. It gives models the machinery to work: tools, persistent sessions, permission controls, workspace memory, and other agents to collaborate with. Use it to research and analyze information, create documents and code, produce structured outputs, or coordinate work across connected systems.

Build/package evidence: [Cargo.toml](https://github.com/FerroxLabs/fuigo/blob/2eb306e08ae24d05c15c74b6b1c1d3235e0f1d96/Cargo.toml); [crates/build/fuigo-proto-build/Cargo.toml](https://github.com/FerroxLabs/fuigo/blob/2eb306e08ae24d05c15c74b6b1c1d3235e0f1d96/crates/build/fuigo-proto-build/Cargo.toml); [crates/codegen/fuigo-acp-lib/Cargo.toml](https://github.com/FerroxLabs/fuigo/blob/2eb306e08ae24d05c15c74b6b1c1d3235e0f1d96/crates/codegen/fuigo-acp-lib/Cargo.toml); [crates/codegen/fuigo-active-sessions/Cargo.toml](https://github.com/FerroxLabs/fuigo/blob/2eb306e08ae24d05c15c74b6b1c1d3235e0f1d96/crates/codegen/fuigo-active-sessions/Cargo.toml); [crates/codegen/fuigo-agent-lifecycle/Cargo.toml](https://github.com/FerroxLabs/fuigo/blob/2eb306e08ae24d05c15c74b6b1c1d3235e0f1d96/crates/codegen/fuigo-agent-lifecycle/Cargo.toml)

License evidence: [LICENSE](https://github.com/FerroxLabs/fuigo/blob/2eb306e08ae24d05c15c74b6b1c1d3235e0f1d96/LICENSE) Classification hint: Apache-2.0. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents**. Its category places it in the candidate set for agents, models, channels; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [models](../models.md) · [channels](../channels.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

<!-- teamagent-analysis:start -->
Analysis metadata: source [fuigo](https://github.com/FerroxLabs/fuigo); analyzed commit `2eb306e08ae24d05c15c74b6b1c1d3235e0f1d96`; commit date 2026-09-17T18:52:23+07:00; review date unknown; depth screened. [Maintenance record](../analyses/repos/ai-agents--fuigo.md).
<!-- teamagent-analysis:end -->
