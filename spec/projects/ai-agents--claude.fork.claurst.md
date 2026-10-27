# claude.fork.claurst

Source: [claude.fork.claurst](https://github.com/Kuberwastaken/claurst) · Category: [ai-agents](../categories/ai-agents.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `b0637c97ec34144387cbf2f74f65df6d16a6cef1`; commit timestamp `2026-09-02T23:57:57+08:00`; 395 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/Kuberwastaken/claurst/blob/b0637c97ec34144387cbf2f74f65df6d16a6cef1/README.md)):

> Claurst is an **open-source, multi-provider terminal coding agent** built from the ground up in Rust. It started as a clean-room reimplementation of Claude Code's behavior (from spec) and has since evolved into an amazing TUI pair programmer with multi-provider support, a rich UI, plugin system, a companion named Rustle, chat forking, memory consolidation, and much more. It's fast, it's memory-efficient, it's yours to run however you want, and there's no tracking or telemetry.

Build/package evidence: [editors/vscode/package.json](https://github.com/Kuberwastaken/claurst/blob/b0637c97ec34144387cbf2f74f65df6d16a6cef1/editors/vscode/package.json); [npm/package.json](https://github.com/Kuberwastaken/claurst/blob/b0637c97ec34144387cbf2f74f65df6d16a6cef1/npm/package.json); [src-rust/Cargo.toml](https://github.com/Kuberwastaken/claurst/blob/b0637c97ec34144387cbf2f74f65df6d16a6cef1/src-rust/Cargo.toml); [src-rust/crates/acp/Cargo.toml](https://github.com/Kuberwastaken/claurst/blob/b0637c97ec34144387cbf2f74f65df6d16a6cef1/src-rust/crates/acp/Cargo.toml); [src-rust/crates/api/Cargo.toml](https://github.com/Kuberwastaken/claurst/blob/b0637c97ec34144387cbf2f74f65df6d16a6cef1/src-rust/crates/api/Cargo.toml)

License evidence: [LICENSE.md](https://github.com/Kuberwastaken/claurst/blob/b0637c97ec34144387cbf2f74f65df6d16a6cef1/LICENSE.md) Classification hint: GPL; inspect version. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents**. Its category places it in the candidate set for agents, models, channels; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [models](../models.md) · [channels](../channels.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

<!-- teamagent-analysis:start -->
Analysis metadata: source [claude.fork.claurst](https://github.com/Kuberwastaken/claurst); analyzed commit `b0637c97ec34144387cbf2f74f65df6d16a6cef1`; commit date 2026-09-02T23:57:57+08:00; review date unknown; depth screened. [Maintenance record](../analyses/repos/ai-agents--claude.fork.claurst.md).
<!-- teamagent-analysis:end -->
