# Autoharness

Source: [tigerless-labs/autoharness](https://github.com/tigerless-labs/autoharness) · Reviewed revision: `6bf36182dcdb95a55bc8fd8b522ce845f855cbc6` · Review date: 2026-10-04.

Depth: **source-reviewed** (static source/content inspection; repository-wide audit not claimed). Related directions: [skills](../skills.md) · [evolution](../evolution.md) · [memory](../memory.md) · [decisions](../decisions.md).

## Evidence inspected

- [`src/autoharness/hook/promoter.py` lines 1–105](https://github.com/tigerless-labs/autoharness/blob/6bf36182dcdb95a55bc8fd8b522ce845f855cbc6/src/autoharness/hook/promoter.py#L1-L105)
- [`src/autoharness/lib/lifecycle.py` lines 1–41](https://github.com/tigerless-labs/autoharness/blob/6bf36182dcdb95a55bc8fd8b522ce845f855cbc6/src/autoharness/lib/lifecycle.py#L1-L41)
- [`src/autoharness/config.py` lines 1–65](https://github.com/tigerless-labs/autoharness/blob/6bf36182dcdb95a55bc8fd8b522ce845f855cbc6/src/autoharness/config.py#L1-L65)

## Observed architecture and behavior

Autoharness implements a useful separation between model-generated intents and a deterministic promoter that validates before writing. The promoter redacts and content-addresses evidence, lands supporting files before SKILL.md, checks resolved paths, and appends a ledger. Lifecycle code ranks mature skills by use divided by exposure since creation, protects probationary entries, and archives unused or low-rate members under capacity pressure. Configuration comments explicitly identify calibration placeholders. Promoter comments also acknowledge remaining cross-process locking and duplicate-ledger crash-window issues.

## Implications and tradeoffs for Teamagent

This is a strong procedural-memory design reference with a weak quality proxy if adopted unchanged. Usage shows visibility and selection, not whether the skill caused success. Bad instructions can become popular, while a rare recovery skill can remain valuable. Teamagent should retain its proposal/admission boundary, evidence lineage, probation, and reversible archive, then add held-out task outcomes and negative-trigger tests. Track eligibility, retrieval, exposure, activation, and successful execution separately so a retrieval defect does not look like a useless skill. Distinguish project procedures from global habits and require broader evidence for global promotion.

## Adoption decision

Adopt the lifecycle architecture selectively; do not enable automatic global self-modification as the default. Replace placeholder thresholds with workload measurements. Use a durable single-writer service or transactional store and idempotent proposal IDs. A candidate must pass independent evaluation before canary activation; subsequent regressions restore the previous digest. Retain infrequently used emergency procedures under an explicit protected policy.

## Verification boundary

No project code, models, installers, or benchmarks were executed during this review. Tests and documentation show intended contracts; they do not establish measured performance, production readiness, or a complete security assessment. Recommendations above are design inferences from the cited snapshot. Verify current APIs, licensing, and deployment requirements before integration.

<!-- teamagent-analysis:start -->
Analysis metadata: source [evolve-claude.autoharness](https://github.com/tigerless-labs/autoharness); analyzed commit `6bf36182dcdb95a55bc8fd8b522ce845f855cbc6`; commit date 2026-10-02T17:43:38+08:00; review date 2026-10-04; depth source-reviewed. [Maintenance record](../analyses/repos/ai-agents-skills--evolve-claude.autoharness.md).
<!-- teamagent-analysis:end -->
