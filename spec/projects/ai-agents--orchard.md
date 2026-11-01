# orchard

Source: [orchard](https://github.com/microsoft/Orchard) · Category: [ai-agents](../categories/ai-agents.md)

Original review depth: **inventory / README screening only**. The dated update review below has its own explicit scope. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `8cc370aef528f075741f2e1f76ab4d740cb564b2`; commit timestamp `2026-10-02T21:44:35-07:00`; 199 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/microsoft/Orchard/blob/8cc370aef528f075741f2e1f76ab4d740cb564b2/README.md)):

> Orchard-Agentic is a collection of open-source work on agentic modeling. It brings together research projects, shared infrastructure, datasets, training

Build/package evidence: [orchard_env/orchard_env/agent/requirements.txt](https://github.com/microsoft/Orchard/blob/8cc370aef528f075741f2e1f76ab4d740cb564b2/orchard_env/orchard_env/agent/requirements.txt); [orchard_env/pyproject.toml](https://github.com/microsoft/Orchard/blob/8cc370aef528f075741f2e1f76ab4d740cb564b2/orchard_env/pyproject.toml); [orchard_eval/harbor_orchard/pyproject.toml](https://github.com/microsoft/Orchard/blob/8cc370aef528f075741f2e1f76ab4d740cb564b2/orchard_eval/harbor_orchard/pyproject.toml); [orchard_eval/pyproject.toml](https://github.com/microsoft/Orchard/blob/8cc370aef528f075741f2e1f76ab4d740cb564b2/orchard_eval/pyproject.toml)

License evidence: [LICENSE](https://github.com/microsoft/Orchard/blob/8cc370aef528f075741f2e1f76ab4d740cb564b2/LICENSE) Classification hint: MIT. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents**. Its category places it in the candidate set for agents, models, channels; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [models](../models.md) · [channels](../channels.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

## 2026-10-27 scoped update review

Reviewed commit `bd8da32b3a075128700caab75bbc491fb6fdc16e` (commit date `2026-10-08T22:14:11-07:00`). The original snapshot above remains historical evidence.

**Scope:** Complete 25-path inventory; focused job transport and evaluation restart review, including JobClient, sandbox/runner integration, Harbor exec and selected transport/retry fixtures. Other evaluation adapters, result-table changes and remote deployment behavior remain outside this scope.

[JobClient](https://github.com/microsoft/Orchard/blob/bd8da32b3a075128700caab75bbc491fb6fdc16e/orchard_eval/orchard_evalkit/jobs.py#L117-L174) separates command submission from [read-only waiting by job ID](https://github.com/microsoft/Orchard/blob/bd8da32b3a075128700caab75bbc491fb6fdc16e/orchard_eval/orchard_evalkit/jobs.py#L176-L247). A disconnect or timeout after a potentially sent POST raises `ExecDispatchError` instead of resubmitting. Waiting can retry transient reads with a bounded outage window, while a missing job gets a distinct error. [Fixtures](https://github.com/microsoft/Orchard/blob/bd8da32b3a075128700caab75bbc491fb6fdc16e/orchard_eval/tests/test_jobs.py#L115-L212) assert one submit across dropped waits, no replay after ambiguous submission, and distinct known HTTP errors.

The submit loop retries connection establishment failures and HTTP 503. The latter relies on this orchestrator's asserted non-acceptance semantics; an HTTP status alone is not universal proof that an effect did not happen. The inspected client has no durable request-intent receipt or provider idempotency key, so its “exactly once” wording must not be generalized to crash recovery.

[Sandbox integration](https://github.com/microsoft/Orchard/blob/bd8da32b3a075128700caab75bbc491fb6fdc16e/orchard_eval/orchard_evalkit/sandbox.py#L250-L296) prevents further commands after a poisoned infrastructure state. [Harbor retry configuration](https://github.com/microsoft/Orchard/blob/bd8da32b3a075128700caab75bbc491fb6fdc16e/orchard_eval/orchard_evalkit/harbor_bridge.py#L264-L272) can nevertheless restart an infrastructure-failed trial in a fresh pod; [tests](https://github.com/microsoft/Orchard/blob/bd8da32b3a075128700caab75bbc491fb6fdc16e/orchard_eval/tests/test_harbor_bridge.py#L242-L280) exclude ordinary agent failure/timeouts from that default. This preserves evaluation semantics better than selecting the best retry, but a new sandbox cannot undo an external effect from an uncertain old attempt. Adopt the submit/wait/error taxonomy with durable reconciliation for Teamagent; do not import evaluation restart rules into billable media or external writes.

**Verification limit:** source inspection only; no upstream tests or provider calls were executed. This scoped review does not certify every file in the repository.

## 2026-11-01 documentation-only refresh

Reviewed the complete one-file delta from `bd8da32b3a075128700caab75bbc491fb6fdc16e` to `e048eed09c3ffe1841750de883f084e46d7cb98c`. Only [README.md](https://github.com/microsoft/Orchard/blob/e048eed09c3ffe1841750de883f084e46d7cb98c/README.md) changes; the earlier inspected execution/recovery implementation is not modified by this delta.

The catalogue now describes Self-HPO harness/policy co-evolution, AutoEnvScaling environment generation, security-focused training/evaluation, separate test/repair agents and turn-level credit assignment. These are upstream research claims and discovery leads. The linked repositories, papers, datasets and reported scores were not independently inspected or reproduced here, so this update does not validate their results or promote them into the implemented harness.

For Teamagent evolution, keep the proposed environment generator, policy/harness optimizer and independent acceptance evaluator as separate roles with frozen held-out evidence. A README addition cannot authorize self-modification or replace measured regression checks. No code, tests, training job or external service was executed.

<!-- teamagent-analysis:start -->
Analysis metadata: source [orchard](https://github.com/microsoft/Orchard); analyzed commit `e048eed09c3ffe1841750de883f084e46d7cb98c`; commit date 2026-11-01T01:29:28-07:00; review date 2026-11-01T11:33:30.893Z; depth screened. [Maintenance record](../analyses/repos/ai-agents--orchard.md).
<!-- teamagent-analysis:end -->
