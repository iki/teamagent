# Future AGI Agent-Opt

Source: [future-agi/agent-opt](https://github.com/future-agi/agent-opt) · Reviewed revision: `b28657e8b5407edebea32da9ab47211033816884` · Review date: 2026-10-04.

Depth: **source-reviewed** (static source/content inspection; repository-wide audit not claimed). Related directions: [evolution](../evolution.md) · [skills](../skills.md) · [models](../models.md) · [decisions](../decisions.md).

## Evidence inspected

- [`src/fi/opt/optimizers/bayesian_search.py` lines 152–275](https://github.com/future-agi/agent-opt/blob/b28657e8b5407edebea32da9ab47211033816884/src/fi/opt/optimizers/bayesian_search.py#L152-L275)

## Observed architecture and behavior

The Bayesian-search optimizer uses Optuna to select a few-shot example count and a random seed that determines sampled examples. It formats those demonstrations into the initial prompt, evaluates the resulting prompt, records iteration scores, supports early stopping, and returns a generator with the best prompt. The inspected function draws demonstrations from the dataset argument and also passes that dataset into scoring. It does not itself establish an independent held-out test set in this path.

## Implications and tradeoffs for Teamagent

This is an actionable optimization pattern for model/harness-specific skill variants: search a bounded configuration space, score candidates, retain evidence, and stop when improvement no longer justifies cost. However, using development examples as demonstrations and scoring on related records can create optimistic estimates. Teamagent must own dataset partitions, grouping by repository/task family, and a locked final evaluation suite outside the optimizer. Search over random seeds is an indirect way to select subsets and does not guarantee a smooth or interpretable optimization landscape. Track failed trials and all evaluation expenditure, not only the winning prompt's inference cost.

## Adoption decision

Use as an optional offline optimizer adapter, alongside simpler random search and the separately reviewed DSPy/GEPA approach. Restrict the initial search space to description wording, examples, tool-order policy, and context budget. Require reproducible input hashes, explicit trials budget, and comparison against no-skill and upstream-skill baselines. Promote a winner only after independent validation and a small canary; a higher optimizer score alone must not rewrite the active team library.

## Verification boundary

No project code, models, installers, or benchmarks were executed during this review. Tests and documentation show intended contracts; they do not establish measured performance, production readiness, or a complete security assessment. Recommendations above are design inferences from the cited snapshot. Verify current APIs, licensing, and deployment requirements before integration.

<!-- teamagent-analysis:start -->
Analysis metadata: source [agent-opt](https://github.com/future-agi/agent-opt); analyzed commit `b28657e8b5407edebea32da9ab47211033816884`; commit date 2026-04-27T16:22:23+05:30; review date 2026-10-04; depth source-reviewed. [Maintenance record](../analyses/repos/ai-prompts--xx-2604-agent-opt.md).
<!-- teamagent-analysis:end -->
