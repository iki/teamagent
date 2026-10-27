# Schema Harness launch-site repository

Source: [schema-harness/schema-harness.github.io](https://github.com/schema-harness/schema-harness.github.io) · Reviewed revision: `62dd126bc0f6329f789e484a74dc05ff8ab19ed7` · Review date: 2026-10-04.

Depth: **source-reviewed** (static source/content inspection; repository-wide audit not claimed). Related directions: [decisions](../decisions.md) · [memory](../memory.md) · [evolution](../evolution.md) · [agents](../agents.md).

## Evidence inspected

- [`README.md` lines 1–10](https://github.com/schema-harness/schema-harness.github.io/blob/62dd126bc0f6329f789e484a74dc05ff8ab19ed7/README.md#L1-L10)
- [`index.html` lines 1123–1126](https://github.com/schema-harness/schema-harness.github.io/blob/62dd126bc0f6329f789e484a74dc05ff8ab19ed7/index.html#L1123-L1126)
- [`index.html` lines 1166–1197](https://github.com/schema-harness/schema-harness.github.io/blob/62dd126bc0f6329f789e484a74dc05ff8ab19ed7/index.html#L1166-L1197)

## Observed architecture and behavior

This checkout is a static article website, not the executable harness. Its own verification note describes the public-game scores as self-reported, not independently verified, and states that held-out performance is unknown. The article retains the better result from paired model runs per game. It describes logging all real transitions, backtesting an induced program against history, and planning with breadth-first search inside a reusable simulator. These are content-reviewed design claims, not locally reproduced implementation behavior.

## Implications and tradeoffs for Teamagent

The useful concept is to compile repeated observations into a falsifiable executable model and spend real actions on resolving model uncertainty. In a coding harness, analogous artifacts include reproductions, test fixtures, dependency models, and deterministic simulators for reversible workflows. The system should distinguish observation, hypothesis, validated model, and prediction. Passing historical tests does not prove unseen correctness, especially where several models fit the same observations. Retaining best-of-two runs also changes compute and selection budget, so the public score should not be compared directly with a single-run system without normalization.

## Adoption decision

Adopt as an experimental decision and memory pattern, not as a dependency or a general SOTA result. Build a small controlled study comparing direct tool use against hypothesis/backtest/planning on representative tasks. Include held-out transitions, explicit compute accounting, and adversarial counterexamples. Preserve simulator uncertainty and fall back to direct observation when predictions fail. Do not imply the website contains deployable harness source or that near-ceiling public-game performance transfers to team coding work.

## Verification boundary

No project code, models, installers, or benchmarks were executed during this review. Tests and documentation show intended contracts; they do not establish measured performance, production readiness, or a complete security assessment. Recommendations above are design inferences from the cited snapshot. Verify current APIs, licensing, and deployment requirements before integration.

<!-- teamagent-analysis:start -->
Analysis metadata: source [game-schema-harness](https://github.com/schema-harness/schema-harness.github.io); analyzed commit `62dd126bc0f6329f789e484a74dc05ff8ab19ed7`; commit date 2026-09-30T21:30:29-04:00; review date 2026-10-04; depth source-reviewed. [Maintenance record](../analyses/repos/ai-info--game-schema-harness.md).
<!-- teamagent-analysis:end -->
