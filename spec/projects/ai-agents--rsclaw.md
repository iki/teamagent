# rsclaw

Source: [rsclaw](https://github.com/rsclaw-ai/rsclaw) · Category: [ai-agents](../categories/ai-agents.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `c1c53ae14e27e2b59f676711c96e512eb99c77ec`; commit timestamp `2026-09-03T08:01:16+08:00`; 1,177 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/rsclaw-ai/rsclaw/blob/c1c53ae14e27e2b59f676711c96e512eb99c77ec/README.md)):

> An AI agent engine that remembers — and gets better the more you use it. One binary, ~28MB idle RAM, ~26ms startup · No Node.js, no package manager, no cloud account · WhatsApp / LINE / Telegram / Discord / Zalo on official APIs · 15 LLM providers · Pure Rust.

Build/package evidence: [Cargo.toml](https://github.com/rsclaw-ai/rsclaw/blob/c1c53ae14e27e2b59f676711c96e512eb99c77ec/Cargo.toml); [crates/rsclaw-a2a-types/Cargo.toml](https://github.com/rsclaw-ai/rsclaw/blob/c1c53ae14e27e2b59f676711c96e512eb99c77ec/crates/rsclaw-a2a-types/Cargo.toml); [crates/rsclaw-agent/Cargo.toml](https://github.com/rsclaw-ai/rsclaw/blob/c1c53ae14e27e2b59f676711c96e512eb99c77ec/crates/rsclaw-agent/Cargo.toml); [crates/rsclaw-artifact/Cargo.toml](https://github.com/rsclaw-ai/rsclaw/blob/c1c53ae14e27e2b59f676711c96e512eb99c77ec/crates/rsclaw-artifact/Cargo.toml); [crates/rsclaw-browser/Cargo.toml](https://github.com/rsclaw-ai/rsclaw/blob/c1c53ae14e27e2b59f676711c96e512eb99c77ec/crates/rsclaw-browser/Cargo.toml)

License evidence: [LICENSE-APACHE](https://github.com/rsclaw-ai/rsclaw/blob/c1c53ae14e27e2b59f676711c96e512eb99c77ec/LICENSE-APACHE); [LICENSE-MIT](https://github.com/rsclaw-ai/rsclaw/blob/c1c53ae14e27e2b59f676711c96e512eb99c77ec/LICENSE-MIT) Classification hint: Apache-2.0. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents**. Its category places it in the candidate set for agents, models, channels; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [models](../models.md) · [channels](../channels.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

<!-- teamagent-analysis:start -->
Analysis metadata: source [rsclaw](https://github.com/rsclaw-ai/rsclaw); analyzed commit `c1c53ae14e27e2b59f676711c96e512eb99c77ec`; commit date 2026-09-03T08:01:16+08:00; review date unknown; depth screened. [Maintenance record](../analyses/repos/ai-agents--rsclaw.md).
<!-- teamagent-analysis:end -->
