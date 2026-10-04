# anton

Source: [anton](https://github.com/mindsdb/anton) · Category: [ai-agents](../categories/ai-agents.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

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
