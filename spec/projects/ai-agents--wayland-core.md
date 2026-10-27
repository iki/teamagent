# wayland-core

Source: [wayland-core](https://github.com/FerroxLabs/wayland-core) · Category: [ai-agents](../categories/ai-agents.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `3d3856d40994705fe623903ab3587dc87fbf5421`; commit timestamp `2026-09-09T19:32:18+07:00`; 7,507 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/FerroxLabs/wayland-core/blob/3d3856d40994705fe623903ab3587dc87fbf5421/README.md)):

> Most AI tools are as good as they'll ever be the day you install them. Wayland Core isn't — it convenes a council of rival models on your hardest problems, fuses their best answer into one, and rewrites and re-scores its own skill prompts against an eval harness, keeping only what wins. Terminal-first, on your keys, in Rust. Terminal-first · Multi-provider · Self-evolving · MCP-native · Embeddable · Apache-2.0

Build/package evidence: [.planning/intel/evidence/F21-04-01-serde-probe/Cargo.toml](https://github.com/FerroxLabs/wayland-core/blob/3d3856d40994705fe623903ab3587dc87fbf5421/.planning/intel/evidence/F21-04-01-serde-probe/Cargo.toml); [Cargo.toml](https://github.com/FerroxLabs/wayland-core/blob/3d3856d40994705fe623903ab3587dc87fbf5421/Cargo.toml); [crates/wayland-browser/Cargo.toml](https://github.com/FerroxLabs/wayland-core/blob/3d3856d40994705fe623903ab3587dc87fbf5421/crates/wayland-browser/Cargo.toml); [crates/wayland-cua/Cargo.toml](https://github.com/FerroxLabs/wayland-core/blob/3d3856d40994705fe623903ab3587dc87fbf5421/crates/wayland-cua/Cargo.toml); [crates/wayland-honcho/Cargo.toml](https://github.com/FerroxLabs/wayland-core/blob/3d3856d40994705fe623903ab3587dc87fbf5421/crates/wayland-honcho/Cargo.toml)

License evidence: [LICENSE](https://github.com/FerroxLabs/wayland-core/blob/3d3856d40994705fe623903ab3587dc87fbf5421/LICENSE) Classification hint: Apache-2.0. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents**. Its category places it in the candidate set for agents, models, channels; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [models](../models.md) · [channels](../channels.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

<!-- teamagent-analysis:start -->
Analysis metadata: source [wayland-core](https://github.com/FerroxLabs/wayland-core); analyzed commit `3d3856d40994705fe623903ab3587dc87fbf5421`; commit date 2026-09-09T19:32:18+07:00; review date unknown; depth screened. [Maintenance record](../analyses/repos/ai-agents--wayland-core.md).
<!-- teamagent-analysis:end -->
