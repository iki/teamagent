# dify

Source: [dify](https://github.com/langgenius/dify) · Category: [ai-agents](../categories/ai-agents.md)

Original review depth: **inventory / README screening only**. The dated update review below has its own explicit scope. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `1cbb6dc385878c950e2252f17f1954211fd1e763`; commit timestamp `2026-10-03T15:44:24Z`; 14,157 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/langgenius/dify/blob/1cbb6dc385878c950e2252f17f1954211fd1e763/README.md)):

> Dify is an open-source LLM app development platform. Its intuitive interface combines AI workflow, RAG pipeline, agent capabilities, model management, observability features (including Opik, Langfuse, and Arize Phoenix) and more, letting you quickly go from prototype to production. Here's a list of the core features: Before installing Dify, make sure your machine meets the following minimum system requirements:

Build/package evidence: [api/providers/trace/trace-aliyun/pyproject.toml](https://github.com/langgenius/dify/blob/1cbb6dc385878c950e2252f17f1954211fd1e763/api/providers/trace/trace-aliyun/pyproject.toml); [api/providers/trace/trace-arize-phoenix/pyproject.toml](https://github.com/langgenius/dify/blob/1cbb6dc385878c950e2252f17f1954211fd1e763/api/providers/trace/trace-arize-phoenix/pyproject.toml); [api/providers/trace/trace-langfuse/pyproject.toml](https://github.com/langgenius/dify/blob/1cbb6dc385878c950e2252f17f1954211fd1e763/api/providers/trace/trace-langfuse/pyproject.toml); [api/providers/trace/trace-langsmith/pyproject.toml](https://github.com/langgenius/dify/blob/1cbb6dc385878c950e2252f17f1954211fd1e763/api/providers/trace/trace-langsmith/pyproject.toml); [api/providers/trace/trace-mlflow/pyproject.toml](https://github.com/langgenius/dify/blob/1cbb6dc385878c950e2252f17f1954211fd1e763/api/providers/trace/trace-mlflow/pyproject.toml)

License evidence: [LICENSE](https://github.com/langgenius/dify/blob/1cbb6dc385878c950e2252f17f1954211fd1e763/LICENSE) Classification hint: Apache-2.0. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents**. Its category places it in the candidate set for agents, models, channels; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [models](../models.md) · [channels](../channels.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

## 2026-10-28 scoped update review

Reviewed commit `60429fd39ff6f4fb97ead5331c32d38b0d77c8a1` (commit date `2026-10-27T16:52:15Z`). The original snapshot above remains historical evidence.

**Scope:** Selected Agent model ownership/snapshot/revision/workspace definitions and migration hunks, complete agent entities, tool error classes and web tool-service adapter; backend authorization, JSON model column, migrations, lifecycle services and tests were not audited.

The [Agent persistence model](https://github.com/langgenius/dify/blob/60429fd39ff6f4fb97ead5331c32d38b0d77c8a1/api/models/agent.py#L338-L467) separates editable drafts, versioned configuration snapshots and revision edges that reference those snapshots. The [workspace and participant records](https://github.com/langgenius/dify/blob/60429fd39ff6f4fb97ead5331c32d38b0d77c8a1/api/models/agent.py#L525-L599) distinguish source-agent identity from a materialized participant, carry tenant/owner scope and retain retired resources independently through logical associations. This is useful for Teamagent's definition-versus-instance model. Comments declaring immutable snapshot bytes or plaintext-secret exclusion are requirements, however; these table definitions alone do not enforce those claims, cross-tenant access policy or cleanup ordering. The dataclass migration preserves explicit IDs and adds constructor defaults, but no database migration or lifecycle transaction was executed.

The [web tool adapter](https://github.com/langgenius/dify/blob/60429fd39ff6f4fb97ead5331c32d38b0d77c8a1/web/service/tools.ts#L19-L174) routes migrated operations through the typed current-workspace client and explicitly keeps a legacy built-in credential path separate. Free-form schema type and parameter form strings are cast to narrower types with backend validation asserted in comments; the adapter itself does not validate them. A required workflow tool ID is checked locally before updating. The presence of [SSRF and credential-policy exception classes](https://github.com/langgenius/dify/blob/60429fd39ff6f4fb97ead5331c32d38b0d77c8a1/api/core/tools/errors.py#L24-L48) is not evidence that every remote schema import or tool call applies the corresponding checks.

The [scratchpad entity](https://github.com/langgenius/dify/blob/60429fd39ff6f4fb97ead5331c32d38b0d77c8a1/api/core/agent/entities.py#L31-L86) marks a step final when it has no action or when the action name contains both final and answer. That is a parser/control-flow heuristic, not an independent success evaluator. Its declared iteration default likewise does not establish runtime budget enforcement. Teamagent should keep explicit typed terminal outcomes, resource ownership and verified effect receipts separate from model-generated names and persisted schema declarations.

**Verification limit:** source inspection only; no upstream tests or provider calls were executed. This scoped review does not certify every file in the repository.

<!-- teamagent-analysis:start -->
Analysis metadata: source [dify](https://github.com/langgenius/dify); analyzed commit `60429fd39ff6f4fb97ead5331c32d38b0d77c8a1`; commit date 2026-10-27T16:52:15Z; review date 2026-10-28T08:47:42.123Z; depth screened. [Maintenance record](../analyses/repos/ai-agents--dify.md).
<!-- teamagent-analysis:end -->
