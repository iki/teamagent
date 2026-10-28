# anton

Source: [anton](https://github.com/mindsdb/anton) · Category: [ai-agents](../categories/ai-agents.md)

Original review depth: **inventory / README screening only**. The dated update review below has its own explicit scope. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `6240f81afd3c113286dce8dc28e018ac65b0082c`; commit timestamp `2026-09-28T10:40:18+13:00`; 502 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/mindsdb/anton/blob/6240f81afd3c113286dce8dc28e018ac65b0082c/README.md)):

> Anton is the open-source agentic harness that powers **MindsHub Cowork** — a self-improving AI agent you can hand any task to. Built and maintained by the MindsHub team, Anton runs as the **default agent** inside Cowork, and just as well **standalone** in your terminal — anywhere, with any model. Hand it real work: create and send reports, clear your inbox, manage your calendar and CRM, book flights, and more. You describe the outcome — Anton figures out the steps.

Build/package evidence: [docs/package.json](https://github.com/mindsdb/anton/blob/6240f81afd3c113286dce8dc28e018ac65b0082c/docs/package.json); [pyproject.toml](https://github.com/mindsdb/anton/blob/6240f81afd3c113286dce8dc28e018ac65b0082c/pyproject.toml)

License evidence: [LICENSE](https://github.com/mindsdb/anton/blob/6240f81afd3c113286dce8dc28e018ac65b0082c/LICENSE) Classification hint: not classified; inspect source. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents**. Its category places it in the candidate set for agents, models, channels; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [models](../models.md) · [channels](../channels.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

## 2026-10-28 scoped update review

Reviewed commit `161d2ddefcd10411ec3edbb43ace3a4788758a0a` (commit date `2026-10-26T05:19:52-07:00`). The original snapshot above remains historical evidence.

**Scope:** Shared session builder, CLI rebuild branch and error redactor; full session engine, data-vault implementation, tool authorization and provider transport were not audited.

The [shared builder](https://github.com/mindsdb/anton/blob/161d2ddefcd10411ec3edbb43ace3a4788758a0a/anton/core/runtime.py#L116-L205) constructs workspace, project/global memory and resumed history around a stable session ID. It also applies workspace environment to the process and injects data-vault connection variables; stale-variable clearing and individual injection failures are logged at debug level while setup continues. In a long-lived multi-workspace host, this ambient state requires explicit ownership/isolation and observable partial readiness. Path normalization and a session ID alone do not provide tenant or filesystem isolation.

The [CLI rebuild branch](https://github.com/mindsdb/anton/blob/161d2ddefcd10411ec3edbb43ace3a4788758a0a/anton/chat_session.py#L56-L130) closes the outgoing model client's HTTP pools, reconnects memory to the new client, supplies a fresh vault and restores default tools. These are useful conformance cases for keeping fresh and resumed sessions equivalent. The shared builder separately tolerates a missing vault import; that fallback must not silently weaken Teamagent credential/environment boundaries. Cleanup is awaited without an outer timeout in this branch, and complete failure rollback was not inspected.

The [error redactor](https://github.com/mindsdb/anton/blob/161d2ddefcd10411ec3edbb43ace3a4788758a0a/anton/core/runtime.py#L24-L48) replaces values from five currently set environment keys. It does not establish removal of credentials supplied through settings, other secret fields or private query/payload content. Require structured confidential diagnostics and explicitly scoped credential injection; do not equate a helper named safe-redact with a complete privacy boundary. No provider or vault calls were performed.

**Verification limit:** source inspection only; no upstream tests or provider calls were executed. This scoped review does not certify every file in the repository.

<!-- teamagent-analysis:start -->
Analysis metadata: source [anton](https://github.com/mindsdb/anton); analyzed commit `161d2ddefcd10411ec3edbb43ace3a4788758a0a`; commit date 2026-10-26T05:19:52-07:00; review date 2026-10-28T08:47:42.123Z; depth screened. [Maintenance record](../analyses/repos/ai-agents--anton.md).
<!-- teamagent-analysis:end -->
