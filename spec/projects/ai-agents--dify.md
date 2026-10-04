# dify

Source: [dify](https://github.com/langgenius/dify) · Category: [ai-agents](../categories/ai-agents.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

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
