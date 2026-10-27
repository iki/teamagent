# dspy

Source: [dspy](https://github.com/stanfordnlp/dspy) · Category: [ai-agents](../categories/ai-agents.md)

Review depth: **focused source review**. Snapshot `ba3f9198efe5d125c7c1a2b40b1f1e6166209bd2` (2026-10-02T01:15:23-04:00). Reviewed 2026-10-04. This assessment covers the cited implementation/contract, not every subsystem or runtime behavior.

## Finding

GEPA provides trace-feedback-driven candidate evolution and a clear warning about training/validation reuse.

## Source evidence inspected

- [dspy/teleprompt/gepa/gepa.py, lines 35–125](https://github.com/stanfordnlp/dspy/blob/ba3f9198efe5d125c7c1a2b40b1f1e6166209bd2/dspy/teleprompt/gepa/gepa.py#L35-L125)
- [dspy/teleprompt/gepa/gepa.py, lines 592–668](https://github.com/stanfordnlp/dspy/blob/ba3f9198efe5d125c7c1a2b40b1f1e6166209bd2/dspy/teleprompt/gepa/gepa.py#L592-L668)

## Observed design and algorithms

The result tracks candidate lineage, aggregate and per-example validation scores, evaluation counts, optional objective fronts and a random seed. compile builds feedback functions around predictor traces, constructs an adapter, then calls the optimizer with train and validation sets. If validation is omitted, the code substitutes the training set and warns about overfitting. Text instructions and Flex source components can both be candidate material.

## Harness decision

Use DSPy/GEPA offline to propose model-specific prompt or skill variants against verifiable tasks. Keep an additional untouched test set and an immutable candidate ledger in the harness. Deploy winners through a separate promoter with canary and rollback.

## Limits and tradeoffs

High validation scores selected repeatedly during search are not unbiased generalization estimates. Optimizing code changes a larger attack and correctness surface than optimizing prose. The underlying GEPA optimizer implementation and live optimization behavior were not audited here.

## Validation before adoption

Test on held-out repositories and later time slices; report paired success/cost deltas and confidence intervals. Record proposer/judge models and prevent them from reading hidden answers. No tests, live inference, installation, or production operation were performed for this review. License indicator: MIT; verify the exact files and dependencies before reuse.

Related directions: [evolution](../evolution.md) · [skills](../skills.md) · [models](../models.md) · [decisions](../decisions.md).

<!-- teamagent-analysis:start -->
Analysis metadata: source [dspy](https://github.com/stanfordnlp/dspy); analyzed commit `ba3f9198efe5d125c7c1a2b40b1f1e6166209bd2`; commit date 2026-10-02T01:15:23-04:00; review date unknown; depth source-reviewed. [Maintenance record](../analyses/repos/ai-agents--dspy.md).
<!-- teamagent-analysis:end -->
