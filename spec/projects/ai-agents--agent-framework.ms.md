# agent-framework.ms

Source: [agent-framework.ms](https://github.com/microsoft/agent-framework) · Category: [ai-agents](../categories/ai-agents.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `e9857bd75a21843803431a2e7dfa41ee9b017ac7`; commit timestamp `2026-10-02T14:12:01Z`; 5,479 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/microsoft/agent-framework/blob/e9857bd75a21843803431a2e7dfa41ee9b017ac7/README.md)):

> Microsoft Agent Framework (MAF) is an open, multi-language framework for building **production-grade AI agents and multi-agent workflows** in **.NET and Python**. Microsoft Agent Framework is built for teams taking agents from prototype to production. It provides a consistent foundation for building, orchestrating, and operating agent systems across Python, .NET and Go, while keeping architecture choices open as requirements evolve, and supports a broad ecosystem including Microsoft Foundry, Azure OpenAI, OpenAI, and the GitHub Copilot SDK, wit

Build/package evidence: [python/packages/a2a/pyproject.toml](https://github.com/microsoft/agent-framework/blob/e9857bd75a21843803431a2e7dfa41ee9b017ac7/python/packages/a2a/pyproject.toml); [python/packages/ag-ui/pyproject.toml](https://github.com/microsoft/agent-framework/blob/e9857bd75a21843803431a2e7dfa41ee9b017ac7/python/packages/ag-ui/pyproject.toml); [python/packages/anthropic/pyproject.toml](https://github.com/microsoft/agent-framework/blob/e9857bd75a21843803431a2e7dfa41ee9b017ac7/python/packages/anthropic/pyproject.toml); [python/packages/azure-ai-search/pyproject.toml](https://github.com/microsoft/agent-framework/blob/e9857bd75a21843803431a2e7dfa41ee9b017ac7/python/packages/azure-ai-search/pyproject.toml); [python/packages/azure-contentunderstanding/pyproject.toml](https://github.com/microsoft/agent-framework/blob/e9857bd75a21843803431a2e7dfa41ee9b017ac7/python/packages/azure-contentunderstanding/pyproject.toml)

License evidence: [LICENSE](https://github.com/microsoft/agent-framework/blob/e9857bd75a21843803431a2e7dfa41ee9b017ac7/LICENSE) Classification hint: MIT. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents**. Its category places it in the candidate set for agents, models, channels; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [models](../models.md) · [channels](../channels.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

<!-- teamagent-analysis:start -->
Analysis metadata: source [agent-framework.ms](https://github.com/microsoft/agent-framework); analyzed commit `e9857bd75a21843803431a2e7dfa41ee9b017ac7`; commit date 2026-10-02T14:12:01Z; review date unknown; depth screened. [Maintenance record](../analyses/repos/ai-agents--agent-framework.ms.md).
<!-- teamagent-analysis:end -->
