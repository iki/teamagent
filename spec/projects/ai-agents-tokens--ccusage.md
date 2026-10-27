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

<!-- teamagent-analysis:start -->
Analysis metadata: source [ccusage](https://github.com/ryoppippi/ccusage); analyzed commit `7b9e09b09f8015cf082f191cbcc7739a44c699ff`; commit date 2026-10-03T20:01:22Z; review date 2026-10-04; depth source-reviewed. [Maintenance record](../analyses/repos/ai-agents-tokens--ccusage.md).
<!-- teamagent-analysis:end -->
