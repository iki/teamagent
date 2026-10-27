# mcp-sdk-python

Source: [mcp-sdk-python](https://github.com/modelcontextprotocol/python-sdk) · Category: [ai-query](../categories/ai-query.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `2118f14f8a19bc158d8a1cf90af58d85d187f849`; commit timestamp `2026-10-02T22:56:10+01:00`; 1,717 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/modelcontextprotocol/python-sdk/blob/2118f14f8a19bc158d8a1cf90af58d85d187f849/README.md)):

> It has a Get started guide, What's new in v2, the API reference, and the migration guide. The Model Context Protocol lets you build servers that expose data and functionality to LLM applications in a secure, standardized way. Think of it like a web API, but designed for LLM interactions. With this SDK you can:

Build/package evidence: [examples/clients/simple-auth-client/pyproject.toml](https://github.com/modelcontextprotocol/python-sdk/blob/2118f14f8a19bc158d8a1cf90af58d85d187f849/examples/clients/simple-auth-client/pyproject.toml); [examples/clients/simple-chatbot/mcp_simple_chatbot/requirements.txt](https://github.com/modelcontextprotocol/python-sdk/blob/2118f14f8a19bc158d8a1cf90af58d85d187f849/examples/clients/simple-chatbot/mcp_simple_chatbot/requirements.txt); [examples/clients/simple-chatbot/pyproject.toml](https://github.com/modelcontextprotocol/python-sdk/blob/2118f14f8a19bc158d8a1cf90af58d85d187f849/examples/clients/simple-chatbot/pyproject.toml); [examples/clients/sse-polling-client/pyproject.toml](https://github.com/modelcontextprotocol/python-sdk/blob/2118f14f8a19bc158d8a1cf90af58d85d187f849/examples/clients/sse-polling-client/pyproject.toml); [examples/pyproject.toml](https://github.com/modelcontextprotocol/python-sdk/blob/2118f14f8a19bc158d8a1cf90af58d85d187f849/examples/pyproject.toml)

License evidence: [LICENSE](https://github.com/modelcontextprotocol/python-sdk/blob/2118f14f8a19bc158d8a1cf90af58d85d187f849/LICENSE) Classification hint: MIT. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-query**. Its category places it in the candidate set for memory, import-generation, decisions; those associations are navigational and have not been individually validated as implemented capabilities. See [memory](../memory.md) · [import-generation](../import-generation.md) · [decisions](../decisions.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

<!-- teamagent-analysis:start -->
Analysis metadata: source [mcp-sdk-python](https://github.com/modelcontextprotocol/python-sdk); analyzed commit `2118f14f8a19bc158d8a1cf90af58d85d187f849`; commit date 2026-10-02T22:56:10+01:00; review date unknown; depth screened. [Maintenance record](../analyses/repos/ai-query--mcp-sdk-python.md).
<!-- teamagent-analysis:end -->
