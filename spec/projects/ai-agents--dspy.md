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

## 2026-10-28 scoped update review

Reviewed commit `159898accc7ae83c2847309aad295468ea4da31c` (commit date `2026-10-27T12:02:11-04:00`). The original snapshot above remains historical evidence.

**Scope:** Selected tool-schema validation, sync/async dispatch, provider-call normalization and correlated-result sections; optimizer/GEPA algorithms, MCP converter, complete adapters and evaluation fixtures were not audited.

The [Tool wrapper](https://github.com/stanfordnlp/dspy/blob/159898accc7ae83c2847309aad295468ea4da31c/dspy/adapters/types/tool.py#L126-L212) validates supplied arguments against per-argument schemas when their type key is present, then uses Pydantic parsing for declared types. Its async method calls a synchronous function directly before checking whether the result is a coroutine; a blocking synchronous tool can therefore block that event loop. The synchronous bridge explicitly refuses to run a coroutine inside an already-running loop. Teamagent needs an explicit host execution adapter for blocking work, cancellation and resource ownership rather than inferring nonblocking behavior from an async API name.

A separate [ToolCall.execute path](https://github.com/stanfordnlp/dspy/blob/159898accc7ae83c2847309aad295468ea4da31c/dspy/adapters/types/tool.py#L305-L348) can look up the model-named callable in the caller's locals/globals. When passed a list of Tool wrappers it selects the raw `tool.func` and invokes it directly, bypassing that wrapper's argument-validation route. This is a trusted convenience API, not an authorization boundary suitable for arbitrary model calls. Use an explicit immutable registry and one validated, policy-checked invocation path in Teamagent.

[Provider-shaped normalization](https://github.com/stanfordnlp/dspy/blob/159898accc7ae83c2847309aad295468ea4da31c/dspy/adapters/types/tool.py#L413-L535) accepts null/empty call lists and repairs JSON argument strings, with non-dictionary non-string arguments converted to an empty map. Keep normalization provenance and reject semantically invalid calls before effects instead of silently treating repaired input as the approved request. The correlated-result builder checks list lengths and retains call IDs/error flags, a useful distinction between transport shape and outcome. This review does not evaluate DSPy's optimization quality or adopt its runtime/dependencies.

**Verification limit:** source inspection only; no upstream tests or provider calls were executed. This scoped review does not certify every file in the repository.

<!-- teamagent-analysis:start -->
Analysis metadata: source [dspy](https://github.com/stanfordnlp/dspy); analyzed commit `159898accc7ae83c2847309aad295468ea4da31c`; commit date 2026-10-27T12:02:11-04:00; review date 2026-10-28T08:47:42.123Z; depth source-reviewed. [Maintenance record](../analyses/repos/ai-agents--dspy.md).
<!-- teamagent-analysis:end -->
