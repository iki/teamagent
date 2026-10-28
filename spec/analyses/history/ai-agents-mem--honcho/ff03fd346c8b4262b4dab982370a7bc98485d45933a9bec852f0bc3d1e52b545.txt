# honcho

Source: [honcho](https://github.com/plastic-labs/honcho) · Category: [ai-agents-mem](../categories/ai-agents-mem.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `8e4df990d974c146a100e96ab4b3957a6591ceab`; commit timestamp `2026-10-02T17:21:22-04:00`; 1,111 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/plastic-labs/honcho/blob/8e4df990d974c146a100e96ab4b3957a6591ceab/README.md)):

> Honcho is memory infrastructure for building stateful agents that understand changing people, agents, groups, projects, and ideas over time. Store messages and events, let Honcho reason in the background, then query peer representations, session context, search results, or natural-language insights from any model or framework. Use it managed at api.honcho.dev, run a local stack with `honcho start`, or self-host the FastAPI server yourself.

Build/package evidence: [docs/package.json](https://github.com/plastic-labs/honcho/blob/8e4df990d974c146a100e96ab4b3957a6591ceab/docs/package.json); [examples/crewai/python/pyproject.toml](https://github.com/plastic-labs/honcho/blob/8e4df990d974c146a100e96ab4b3957a6591ceab/examples/crewai/python/pyproject.toml); [examples/langgraph/python/pyproject.toml](https://github.com/plastic-labs/honcho/blob/8e4df990d974c146a100e96ab4b3957a6591ceab/examples/langgraph/python/pyproject.toml); [examples/langgraph/typescript/package.json](https://github.com/plastic-labs/honcho/blob/8e4df990d974c146a100e96ab4b3957a6591ceab/examples/langgraph/typescript/package.json); [examples/zo/pyproject.toml](https://github.com/plastic-labs/honcho/blob/8e4df990d974c146a100e96ab4b3957a6591ceab/examples/zo/pyproject.toml)

License evidence: [LICENSE](https://github.com/plastic-labs/honcho/blob/8e4df990d974c146a100e96ab4b3957a6591ceab/LICENSE) Classification hint: AGPL; inspect version. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents-mem**. Its category places it in the candidate set for memory, evolution; those associations are navigational and have not been individually validated as implemented capabilities. See [memory](../memory.md) · [evolution](../evolution.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.
