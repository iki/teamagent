# buzz

Source: [buzz](https://github.com/block/buzz) · Category: [ai-agents](../categories/ai-agents.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `e982f70fba29cdaa9a8378f118a0e498537bd8db`; commit timestamp `2026-10-03T15:12:15-04:00`; 5,489 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/block/buzz/blob/e982f70fba29cdaa9a8378f118a0e498537bd8db/README.md)):

> A workspace where humans and agents build together, on a relay you own. Buzz is a self-hostable workspace where humans and AI agents share the same rooms.

Build/package evidence: [Cargo.toml](https://github.com/block/buzz/blob/e982f70fba29cdaa9a8378f118a0e498537bd8db/Cargo.toml); [admin-web/package.json](https://github.com/block/buzz/blob/e982f70fba29cdaa9a8378f118a0e498537bd8db/admin-web/package.json); [benchmarks/harbor-buzz-orchestra/pyproject.toml](https://github.com/block/buzz/blob/e982f70fba29cdaa9a8378f118a0e498537bd8db/benchmarks/harbor-buzz-orchestra/pyproject.toml); [benchmarks/harbor-buzz-orchestra/testbed/pyproject.toml](https://github.com/block/buzz/blob/e982f70fba29cdaa9a8378f118a0e498537bd8db/benchmarks/harbor-buzz-orchestra/testbed/pyproject.toml); [crates/buzz-acp/Cargo.toml](https://github.com/block/buzz/blob/e982f70fba29cdaa9a8378f118a0e498537bd8db/crates/buzz-acp/Cargo.toml)

License evidence: [LICENSE](https://github.com/block/buzz/blob/e982f70fba29cdaa9a8378f118a0e498537bd8db/LICENSE) Classification hint: Apache-2.0. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents**. Its category places it in the candidate set for agents, models, channels; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [models](../models.md) · [channels](../channels.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

<!-- teamagent-analysis:start -->
Analysis metadata: source [buzz](https://github.com/block/buzz); analyzed commit `e982f70fba29cdaa9a8378f118a0e498537bd8db`; commit date 2026-10-03T15:12:15-04:00; review date unknown; depth screened. [Maintenance record](../analyses/repos/ai-agents--buzz.md).
<!-- teamagent-analysis:end -->
