# xx-2604-claude.fork.claw-code

Source: [xx-2604-claude.fork.claw-code](https://github.com/ultraworkers/claw-code-parity) · Category: [ai-agents](../categories/ai-agents.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `ebef748d3e8372ea874b50b13c87c34e6a75c39a`; commit timestamp `2026-04-05T11:01:17Z`; 261 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/ultraworkers/claw-code-parity/blob/ebef748d3e8372ea874b50b13c87c34e6a75c39a/README.md)):

> ⭐ The fastest repo in history to surpass 50K stars, reaching the milestone in just 2 hours after publication ⭐ The active Rust workspace now lives in `rust/`. Start with `USAGE.md` for build, auth, CLI, session, and parity-harness workflows, then use `rust/README.md` for crate-level details.

Build/package evidence: [rust/Cargo.toml](https://github.com/ultraworkers/claw-code-parity/blob/ebef748d3e8372ea874b50b13c87c34e6a75c39a/rust/Cargo.toml); [rust/crates/api/Cargo.toml](https://github.com/ultraworkers/claw-code-parity/blob/ebef748d3e8372ea874b50b13c87c34e6a75c39a/rust/crates/api/Cargo.toml); [rust/crates/commands/Cargo.toml](https://github.com/ultraworkers/claw-code-parity/blob/ebef748d3e8372ea874b50b13c87c34e6a75c39a/rust/crates/commands/Cargo.toml); [rust/crates/compat-harness/Cargo.toml](https://github.com/ultraworkers/claw-code-parity/blob/ebef748d3e8372ea874b50b13c87c34e6a75c39a/rust/crates/compat-harness/Cargo.toml); [rust/crates/mock-anthropic-service/Cargo.toml](https://github.com/ultraworkers/claw-code-parity/blob/ebef748d3e8372ea874b50b13c87c34e6a75c39a/rust/crates/mock-anthropic-service/Cargo.toml)

License evidence: No root license file identified; reuse rights unverified. Classification hint: not classified; inspect source. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents**. Its category places it in the candidate set for agents, models, channels; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [models](../models.md) · [channels](../channels.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.
