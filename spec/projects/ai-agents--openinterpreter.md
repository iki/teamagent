# openinterpreter

Source: [openinterpreter](https://github.com/openinterpreter/openinterpreter) · Category: [ai-agents](../categories/ai-agents.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `2767e5f20d6927500b8f1938c773c61afb823245`; commit timestamp `2026-10-02T08:44:16+01:00`; 8,682 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/openinterpreter/openinterpreter/blob/2767e5f20d6927500b8f1938c773c61afb823245/README.md)):

> Today: Kimi K3 is here.** We have reimplemented the provider-recommended Then type `i` or `interpreter` in your terminal to start a session.

Build/package evidence: [.github/actions/publish-dotslash/requirements.txt](https://github.com/openinterpreter/openinterpreter/blob/2767e5f20d6927500b8f1938c773c61afb823245/.github/actions/publish-dotslash/requirements.txt); [codex-cli/package.json](https://github.com/openinterpreter/openinterpreter/blob/2767e5f20d6927500b8f1938c773c61afb823245/codex-cli/package.json); [codex-rs/Cargo.toml](https://github.com/openinterpreter/openinterpreter/blob/2767e5f20d6927500b8f1938c773c61afb823245/codex-rs/Cargo.toml); [codex-rs/acp-server/Cargo.toml](https://github.com/openinterpreter/openinterpreter/blob/2767e5f20d6927500b8f1938c773c61afb823245/codex-rs/acp-server/Cargo.toml); [codex-rs/agent-graph-store/Cargo.toml](https://github.com/openinterpreter/openinterpreter/blob/2767e5f20d6927500b8f1938c773c61afb823245/codex-rs/agent-graph-store/Cargo.toml)

License evidence: [LICENSE](https://github.com/openinterpreter/openinterpreter/blob/2767e5f20d6927500b8f1938c773c61afb823245/LICENSE) Classification hint: Apache-2.0. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents**. Its category places it in the candidate set for agents, models, channels; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [models](../models.md) · [channels](../channels.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

<!-- teamagent-analysis:start -->
Analysis metadata: source [openinterpreter](https://github.com/openinterpreter/openinterpreter); analyzed commit `2767e5f20d6927500b8f1938c773c61afb823245`; commit date 2026-10-02T08:44:16+01:00; review date unknown; depth screened. [Maintenance record](../analyses/repos/ai-agents--openinterpreter.md).
<!-- teamagent-analysis:end -->
