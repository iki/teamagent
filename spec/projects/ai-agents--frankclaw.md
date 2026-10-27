# frankclaw

Source: [frankclaw](https://github.com/akitaonrails/FrankClaw) · Category: [ai-agents](../categories/ai-agents.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `d9812e9a3800bf8a54a100a3ec98be211e18efc4`; commit timestamp `2026-05-11T19:40:40-03:00`; 198 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/akitaonrails/FrankClaw/blob/d9812e9a3800bf8a54a100a3ec98be211e18efc4/README.md)):

> A security-hardened personal AI assistant gateway written in Rust. Connects messaging channels to AI model providers through a local WebSocket control plane. FrankClaw is a ground-up Rust rewrite of OpenClaw, achieving **functional parity** with the core feature set while providing **stronger security guarantees** through Rust's memory safety, encryption at rest, stricter input validation, and defense-in-depth hardening at every layer.

Build/package evidence: [Cargo.toml](https://github.com/akitaonrails/FrankClaw/blob/d9812e9a3800bf8a54a100a3ec98be211e18efc4/Cargo.toml); [crates/frankclaw-channels/Cargo.toml](https://github.com/akitaonrails/FrankClaw/blob/d9812e9a3800bf8a54a100a3ec98be211e18efc4/crates/frankclaw-channels/Cargo.toml); [crates/frankclaw-cli/Cargo.toml](https://github.com/akitaonrails/FrankClaw/blob/d9812e9a3800bf8a54a100a3ec98be211e18efc4/crates/frankclaw-cli/Cargo.toml); [crates/frankclaw-core/Cargo.toml](https://github.com/akitaonrails/FrankClaw/blob/d9812e9a3800bf8a54a100a3ec98be211e18efc4/crates/frankclaw-core/Cargo.toml); [crates/frankclaw-cron/Cargo.toml](https://github.com/akitaonrails/FrankClaw/blob/d9812e9a3800bf8a54a100a3ec98be211e18efc4/crates/frankclaw-cron/Cargo.toml)

License evidence: [LICENSE](https://github.com/akitaonrails/FrankClaw/blob/d9812e9a3800bf8a54a100a3ec98be211e18efc4/LICENSE) Classification hint: AGPL; inspect version. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents**. Its category places it in the candidate set for agents, models, channels; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [models](../models.md) · [channels](../channels.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

<!-- teamagent-analysis:start -->
Analysis metadata: source [frankclaw](https://github.com/akitaonrails/FrankClaw); analyzed commit `d9812e9a3800bf8a54a100a3ec98be211e18efc4`; commit date 2026-05-11T19:40:40-03:00; review date unknown; depth screened. [Maintenance record](../analyses/repos/ai-agents--frankclaw.md).
<!-- teamagent-analysis:end -->
