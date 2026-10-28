# openinterpreter

Source: [openinterpreter](https://github.com/openinterpreter/openinterpreter) · Category: [ai-agents](../categories/ai-agents.md)

Original review depth: **inventory / README screening only**. The dated update review below has its own explicit scope. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

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

## 2026-10-27 scoped update review

Reviewed commit `ac1fcc8fe57aba51fcc3c79afd57a0883237fe87` (commit date `2026-10-11T01:37:07+01:00`). The original snapshot above remains historical evidence.

**Scope:** Complete five-path inventory; full changed model-manager and product-identity modules with embedded tests, manifest diff and the new release note. Lockfile internals and the rest of the agent loop remain outside this review.

The [product identity module](https://github.com/openinterpreter/openinterpreter/blob/ac1fcc8fe57aba51fcc3c79afd57a0883237fe87/codex-rs/product-info/src/lib.rs#L6-L12) explicitly separates its product version from a service compatibility profile, now `0.159.0`. [Model-manager normalization](https://github.com/openinterpreter/openinterpreter/blob/ac1fcc8fe57aba51fcc3c79afd57a0883237fe87/codex-rs/models-manager/src/lib.rs#L20-L31) obtains that profile and strips prerelease suffixes. Its [catalog tests](https://github.com/openinterpreter/openinterpreter/blob/ac1fcc8fe57aba51fcc3c79afd57a0883237fe87/codex-rs/models-manager/src/lib.rs#L37-L71) check bundled minimum-client versions and the expected profile; the [product test](https://github.com/openinterpreter/openinterpreter/blob/ac1fcc8fe57aba51fcc3c79afd57a0883237fe87/codex-rs/product-info/src/lib.rs#L277-L289) asserts the constant differs from its package version.

These are local consistency assertions. Comments saying account discovery and a model/tool turn were verified are upstream claims, not provider tests performed in this review. The [release note](https://github.com/openinterpreter/openinterpreter/blob/ac1fcc8fe57aba51fcc3c79afd57a0883237fe87/.github/release-notes/0.0.56.md) also describes catalog and resume work; do not attribute every release-note feature to this five-file interval or infer entitlement from a version string.

For Teamagent discovery, retain distinct fields for installed product/build, service protocol profile, catalog snapshot and authenticated account/model readiness. Never copy a compatibility number merely to expose another account's model list. Keep updates/installation separate from passive identity detection; source-selected update commands in the product module are executable operations, not diagnostics.

**Verification limit:** source inspection only; no upstream tests or provider calls were executed. This scoped review does not certify every file in the repository.

<!-- teamagent-analysis:start -->
Analysis metadata: source [openinterpreter](https://github.com/openinterpreter/openinterpreter); analyzed commit `ac1fcc8fe57aba51fcc3c79afd57a0883237fe87`; commit date 2026-10-11T01:37:07+01:00; review date 2026-10-28T08:26:04.502Z; depth screened. [Maintenance record](../analyses/repos/ai-agents--openinterpreter.md).
<!-- teamagent-analysis:end -->
