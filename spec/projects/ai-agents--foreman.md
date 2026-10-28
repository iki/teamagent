# foreman

Source: [foreman](https://github.com/thruwire/foreman) · Category: [ai-agents](../categories/ai-agents.md)

Original review depth: **inventory / README screening only**. The dated update review below has its own explicit scope. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `e5d1aa45183382390e388512dcbfebd747ec89ba`; commit timestamp `2026-09-28T19:44:20-04:00`; 95 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/thruwire/foreman/blob/e5d1aa45183382390e388512dcbfebd747ec89ba/README.md)):

> Foreman watches the software factory floor with TypeSafe AI's Jev, Give it a ticket, specification, bug report, or any free-form software job. A

Build/package evidence: [pyproject.toml](https://github.com/thruwire/foreman/blob/e5d1aa45183382390e388512dcbfebd747ec89ba/pyproject.toml)

License evidence: [LICENSE](https://github.com/thruwire/foreman/blob/e5d1aa45183382390e388512dcbfebd747ec89ba/LICENSE) Classification hint: MIT. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents**. Its category places it in the candidate set for agents, models, channels; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [models](../models.md) · [channels](../channels.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

## 2026-10-28 scoped update review

Reviewed commit `c3142ef636617f32f772140125aa310d81ceece9` (commit date `2026-10-15T08:58:59-04:00`). The original snapshot above remains historical evidence.

**Scope:** Changed-path inventory, persistence implementation, supervisor assessment/cleanup branches and runtime fixtures; provider implementations and complete recovery semantics were not audited.

The [run store](https://github.com/thruwire/foreman/blob/c3142ef636617f32f772140125aa310d81ceece9/src/foreman/persistence.py#L67-L158) writes state through a flushed/fsynced temporary file and atomic replacement, and appends events separately with fsync. Those are useful local durability primitives, but state replacement and event append are not one transaction; the supervisor saves state before emitting its event. Legacy migration also sets the schema version to 4, while tolerant event reads and run listing can skip malformed records. Teamagent needs explicit unsupported-version and incomplete-recovery outcomes, plus reconciliation of state/event divergence rather than a claim of crash-proof workflow history.

The [assessment path](https://github.com/thruwire/foreman/blob/c3142ef636617f32f772140125aa310d81ceece9/src/foreman/runtime.py#L389-L460) checks configuration failures separately and applies a deterministic policy to model assessments. A bounded consecutive-failure budget can tolerate transient assessment errors before escalation. The [runtime fixtures](https://github.com/thruwire/foreman/blob/c3142ef636617f32f772140125aa310d81ceece9/tests/test_runtime.py) exercise fake workers/models, timeout, cancellation, configuration errors and independent worker/decision-model selection; these are source evidence, not executed provider or OS results.

The [shutdown sequence](https://github.com/thruwire/foreman/blob/c3142ef636617f32f772140125aa310d81ceece9/src/foreman/runtime.py#L574-L660) attempts to terminate active workers before waiting with its grace timeout. The initial gather of `worker.terminate()` has no timeout at that call site, so the later grace period does not bound every possible cleanup implementation. Adopt explicit assessment/error states and the model/policy separation, but require an outer cleanup deadline, preserved cleanup failures and independently checked deliverables.

**Verification limit:** source inspection only; no upstream tests or provider calls were executed. This scoped review does not certify every file in the repository.

<!-- teamagent-analysis:start -->
Analysis metadata: source [foreman](https://github.com/thruwire/foreman); analyzed commit `c3142ef636617f32f772140125aa310d81ceece9`; commit date 2026-10-15T08:58:59-04:00; review date 2026-10-28T08:47:42.123Z; depth screened. [Maintenance record](../analyses/repos/ai-agents--foreman.md).
<!-- teamagent-analysis:end -->
