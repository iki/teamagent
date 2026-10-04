# adrian

Source: [adrian](https://github.com/secureagentics/Adrian) · Category: [ai-security](../categories/ai-security.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `73c6c1c41f2e87a9070ef4fd62a00421d8ad2fcf`; commit timestamp `2026-09-15T15:06:35+02:00`; 441 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/secureagentics/Adrian/blob/73c6c1c41f2e87a9070ef4fd62a00421d8ad2fcf/README.md)):

> Adrian catches them at runtime, by watching what the agent actually does (its actions and its reasoning) and stepping in before it acts. Open source, free forever. +35% detection accuracy · 4x more nuanced attacks caught  vs behaviour-only monitoring ( OpenAI &amp; DeepMind research )

Build/package evidence: [backend/go.mod](https://github.com/secureagentics/Adrian/blob/73c6c1c41f2e87a9070ef4fd62a00421d8ad2fcf/backend/go.mod); [frontend/package.json](https://github.com/secureagentics/Adrian/blob/73c6c1c41f2e87a9070ef4fd62a00421d8ad2fcf/frontend/package.json); [integrations/claude-code/pyproject.toml](https://github.com/secureagentics/Adrian/blob/73c6c1c41f2e87a9070ef4fd62a00421d8ad2fcf/integrations/claude-code/pyproject.toml); [sdk/python/pyproject.toml](https://github.com/secureagentics/Adrian/blob/73c6c1c41f2e87a9070ef4fd62a00421d8ad2fcf/sdk/python/pyproject.toml); [sdk/typescript/package.json](https://github.com/secureagentics/Adrian/blob/73c6c1c41f2e87a9070ef4fd62a00421d8ad2fcf/sdk/typescript/package.json)

License evidence: [LICENSE](https://github.com/secureagentics/Adrian/blob/73c6c1c41f2e87a9070ef4fd62a00421d8ad2fcf/LICENSE); [LICENSE_HEADER.txt](https://github.com/secureagentics/Adrian/blob/73c6c1c41f2e87a9070ef4fd62a00421d8ad2fcf/LICENSE_HEADER.txt) Classification hint: Apache-2.0. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-security**. Its category places it in the candidate set for agents, skills, evolution; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [skills](../skills.md) · [evolution](../evolution.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.
