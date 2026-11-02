# ccusage

Source: [ryoppippi/ccusage](https://github.com/ryoppippi/ccusage) · Reviewed revision: `7b9e09b09f8015cf082f191cbcc7739a44c699ff` · Review date: 2026-10-04.

Depth: **source-reviewed** (static source/content inspection; repository-wide audit not claimed). Related directions: [evolution](../evolution.md) · [models](../models.md) · [agents](../agents.md) · [decisions](../decisions.md).

## Evidence inspected

- [`rust/adapters/codex/src/parser.rs` lines 23–129](https://github.com/ryoppippi/ccusage/blob/7b9e09b09f8015cf082f191cbcc7739a44c699ff/rust/adapters/codex/src/parser.rs#L23-L129)
- [`rust/crates/ccusage-core/src/pricing.rs` lines 17–97](https://github.com/ryoppippi/ccusage/blob/7b9e09b09f8015cf082f191cbcc7739a44c699ff/rust/crates/ccusage-core/src/pricing.rs#L17-L97)

## Observed architecture and behavior

The inspected Codex parser tracks current model/service tier, cumulative totals, compaction state, response IDs, and fork replay. It explicitly distinguishes replayed parent history from a child's own usage, including a fallback timing heuristic for rewritten bursts. Pricing embeds fallback snapshots and can consume schema-validated external pricing catalogs. This demonstrates that reliable usage reporting requires provider-specific semantics, not summing every token counter appearing in a log.

## Implications and tradeoffs for Teamagent

Teamagent should ingest usage into a canonical event format while preserving the raw counter type, source, model, service tier, request ID, and accounting confidence. Imported historical logs need deduplication and reconciliation with live telemetry. Compaction and forks can otherwise inflate costs and mislead route selection. Timing heuristics may fail as host log formats change, so parser versions and coverage must be visible. Token-equivalent price is distinct from actual subscription expenditure, remaining quota, or marginal cost. A pricing snapshot also needs an effective date; today's list price should not silently rewrite the meaning of historical spending.

## Adoption decision

Use ccusage as an optional local accounting adapter or cross-check, with read-only access to explicitly selected session logs. Prefer first-party structured usage events where available. Keep monetary estimates, subscription entitlement status, and observed resource use as separate fields. Add golden log fixtures for forks, compaction, model switches, partial writes, and unknown models. Unknown accounting must remain unknown rather than becoming zero in dashboards or routing decisions.

## Verification boundary

No project code, models, installers, or benchmarks were executed during this review. Tests and documentation show intended contracts; they do not establish measured performance, production readiness, or a complete security assessment. Recommendations above are design inferences from the cited snapshot. Verify current APIs, licensing, and deployment requirements before integration.

## Source update reviewed 2026-10-28

Reviewed commit: [`0c76c3e72b3a553be46f02feb9a9dbfab06e9fe9`](https://github.com/ryoppippi/ccusage/commit/0c76c3e72b3a553be46f02feb9a9dbfab06e9fe9). Scope: Full native CLI entry and JavaScript binary wrapper read. Rust usage/pricing parsers, compression tests and packaged native artifacts were not audited.

The [Rust entry](https://github.com/ryoppippi/ccusage/blob/0c76c3e72b3a553be46f02feb9a9dbfab06e9fe9/rust/crates/ccusage/src/cli.rs) parses against one configuration view, validates timezone/window choices, resolves sources for unified output and returns usage errors with exit code 2; bare invocation becomes a unified daily report. The referenced validators and parsers were not inspected, so this is dispatch-contract evidence rather than accounting correctness.

The [wrapper](https://github.com/ryoppippi/ccusage/blob/0c76c3e72b3a553be46f02feb9a9dbfab06e9fe9/apps/ccusage/src/cli.js) chooses an explicit platform/architecture native package, reports unsupported or missing artifacts, forwards arguments/signals and removes handlers on child completion. It does not silently substitute a JavaScript implementation. The missing-package guidance recommends removing release-age restrictions, which must not become a Teamagent trust-policy change; artifact identity and compatibility still require locked provenance. Non-Windows executable repair sets 0755 rather than preserving all prior mode bits. Adapt explicit unavailable-platform errors and scoped signal cleanup only; keep Teamagent's Aube/Bun launcher contract. No binary, transcript parser, package install or tests were executed.

## Follow-up change review — 2026-10-28

**Reporting code is split from core, while pricing acquisition follows a locked URL.** Reviewed commit `b8ad727170fc0dabe35cbf7b940f0a3f9fba475b` (commit date `2026-10-28T03:27:51Z`), compared with `0c76c3e72b3a553be46f02feb9a9dbfab06e9fe9`. The complete no-rename Git path inventory contains 54 changed paths.

A new report-only crate exports date/window/output/summary helpers so report changes need not rebuild all core-dependent adapters. The optional LiteLLM pricing fetch now reads the url field from the locked entry instead of constructing a raw-GitHub path from owner/repo/revision. Other paths update bundled pricing and build configuration. This establishes packaging and acquisition changes, not the accuracy or currency of any price.

Evidence: [rust/crates/ccusage-report/src/lib.rs:1-17](https://github.com/ryoppippi/ccusage/blob/b8ad727170fc0dabe35cbf7b940f0a3f9fba475b/rust/crates/ccusage-report/src/lib.rs#L1-L17) · [rust/crates/ccusage-pricing-snapshots/build.rs:113-135](https://github.com/ryoppippi/ccusage/blob/b8ad727170fc0dabe35cbf7b940f0a3f9fba475b/rust/crates/ccusage-pricing-snapshots/build.rs#L113-L135).

**Harness consequence:** Separate accounting inputs and domain calculations from presentation. Retain a source version, digest and effective date for pricing snapshots, and treat a changed fetch URL as a source-validation boundary.

**Scope and limits:** Reviewed report crate exports, pricing URL construction and the complete path inventory; moved reporting implementations and price values were not exhaustively revalidated. This is a scoped static comparison, not a whole-project correctness or security audit. Upstream tests were read where cited, not run; no upstream code, service, model or provider operation was executed. Historical findings above remain evidence at their own revisions.

## Source update reviewed 2026-11-01

Reviewed commit [`f0a8a9c38c37847e83f2d7ca18b8cadba929534a`](https://github.com/ryoppippi/ccusage/commit/f0a8a9c38c37847e83f2d7ca18b8cadba929534a), compared with `b8ad727170fc0dabe35cbf7b940f0a3f9fba475b`.

The complete inventory contains 47 changed paths. The selected [Codex parser](https://github.com/ryoppippi/ccusage/blob/f0a8a9c38c37847e83f2d7ca18b8cadba929534a/rust/adapters/codex/src/parser.rs), [aggregation](https://github.com/ryoppippi/ccusage/blob/f0a8a9c38c37847e83f2d7ca18b8cadba929534a/rust/adapters/codex/src/aggregate.rs) and [types](https://github.com/ryoppippi/ccusage/blob/f0a8a9c38c37847e83f2d7ca18b8cadba929534a/rust/adapters/codex/src/types.rs) diffs add an explicit Ultrafast tier and its usage buckets. Duplicate merging gives Standard precedence over Ultrafast, followed by Fast and Flex. The [compaction fixtures](https://github.com/ryoppippi/ccusage/blob/f0a8a9c38c37847e83f2d7ca18b8cadba929534a/rust/adapters/codex/src/compaction_tests.rs) exercise copied records across tiers while retaining a single 300-token total. These are upstream accounting rules, not evidence of a provider's billing contract.

For Teamagent, retain original service-tier provenance, identify copied usage before summing it, and make conflict precedence inspectable. Do not infer current prices or billable amounts solely from a normalized tier. Selected code and test changes were read completely; other Antigravity, pricing and build changes in this comparison were not exhaustively audited. No upstream tests, provider requests or billing reconciliation were executed.

## External-update review - 2026-11-01

Reviewed `66e18571055fda8c210fd6ec79a497707dcc37bb` against `f0a8a9c38c37847e83f2d7ca18b8cadba929534a`.

The seven-path update fixes [configuration precedence](https://github.com/ryoppippi/ccusage/blob/66e18571055fda8c210fd6ec79a497707dcc37bb/rust/crates/ccusage-config/src/config.rs): generic report settings are applied before space-form agent commands, then colon-form commands, followed by agent defaults and agent-specific report settings. Unified reports obtain the same source-specific view as focused commands. Embedded fixtures cover both spellings, their collision and preserved unrelated defaults; [CLI source tests](https://github.com/ryoppippi/ccusage/blob/66e18571055fda8c210fd6ec79a497707dcc37bb/rust/crates/ccusage/src/cli/sources.rs) distinguish unified options from an overridden Codex source.

The [generated schema implementation](https://github.com/ryoppippi/ccusage/blob/66e18571055fda8c210fd6ec79a497707dcc37bb/rust/crates/ccusage-config/src/config_schema.rs) adds weekly sections and references each supported agent/report schema for both command spellings. Its tests exclude unsupported combinations. This aligns discoverability with runtime configuration; it is not evidence that pricing or token attribution is correct.

**Harness consequence:** Resolve per-source cost policy through the same documented precedence as direct commands and test alias collisions, rather than patching aggregate options after parsing. The separate pricing snapshot and flake lock changes were inventoried but not independently price-verified. No billing data, upstream Rust build or tests were executed; review scope is the three complete Rust implementation/test deltas.

<!-- teamagent-analysis:start -->
Analysis metadata: source [ccusage](https://github.com/ryoppippi/ccusage); analyzed commit `66e18571055fda8c210fd6ec79a497707dcc37bb`; commit date 2026-11-01T18:15:37Z; review date 2026-11-01T23:12:06.798Z; depth source-reviewed. [Maintenance record](../analyses/repos/ai-agents-tokens--ccusage.md).
<!-- teamagent-analysis:end -->
