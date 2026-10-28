# mlflow

Source: [mlflow](https://github.com/mlflow/mlflow) · Category: [ai-agents](../categories/ai-agents.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `6edc856ef7f2778bb8b29ba3b7c7ffa74cd3e23c`; commit timestamp `2026-10-04T01:23:27+08:00`; 9,698 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/mlflow/mlflow/blob/6edc856ef7f2778bb8b29ba3b7c7ffa74cd3e23c/README.md)):

> MLflow is the largest open source **AI engineering platform for agents, LLMs, and ML models**. MLflow enables teams of all sizes to debug, evaluate, monitor, and optimize production-quality AI applications while

Build/package evidence: [.claude/skills/pyproject.toml](https://github.com/mlflow/mlflow/blob/6edc856ef7f2778bb8b29ba3b7c7ffa74cd3e23c/.claude/skills/pyproject.toml); [dev/clint/pyproject.toml](https://github.com/mlflow/mlflow/blob/6edc856ef7f2778bb8b29ba3b7c7ffa74cd3e23c/dev/clint/pyproject.toml); [dev/flavors/pyproject.toml](https://github.com/mlflow/mlflow/blob/6edc856ef7f2778bb8b29ba3b7c7ffa74cd3e23c/dev/flavors/pyproject.toml); [dev/pypi/pyproject.toml](https://github.com/mlflow/mlflow/blob/6edc856ef7f2778bb8b29ba3b7c7ffa74cd3e23c/dev/pypi/pyproject.toml); [dev/requirements.txt](https://github.com/mlflow/mlflow/blob/6edc856ef7f2778bb8b29ba3b7c7ffa74cd3e23c/dev/requirements.txt)

License evidence: [LICENSE.txt](https://github.com/mlflow/mlflow/blob/6edc856ef7f2778bb8b29ba3b7c7ffa74cd3e23c/LICENSE.txt) Classification hint: Apache-2.0. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents**. Its category places it in the candidate set for agents, models, channels; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [models](../models.md) · [channels](../channels.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.
