# mcp-ext-apps

Source: [mcp-ext-apps](https://github.com/modelcontextprotocol/ext-apps) · Category: [ai-query](../categories/ai-query.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `82221c0c8ce7661efa6771c9d461511b1650495f`; commit timestamp `2026-09-25T15:47:56+01:00`; 503 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/modelcontextprotocol/ext-apps/blob/82221c0c8ce7661efa6771c9d461511b1650495f/README.md)):

> Build interactive UIs for MCP tools — charts, forms, dashboards — that render inline in Claude, ChatGPT and any other compliant chat client. The fastest way to build an MCP App is to let your AI coding agent do it. This

Build/package evidence: [examples/basic-host/package.json](https://github.com/modelcontextprotocol/ext-apps/blob/82221c0c8ce7661efa6771c9d461511b1650495f/examples/basic-host/package.json); [examples/basic-server-preact/package.json](https://github.com/modelcontextprotocol/ext-apps/blob/82221c0c8ce7661efa6771c9d461511b1650495f/examples/basic-server-preact/package.json); [examples/basic-server-react/package.json](https://github.com/modelcontextprotocol/ext-apps/blob/82221c0c8ce7661efa6771c9d461511b1650495f/examples/basic-server-react/package.json); [examples/basic-server-solid/package.json](https://github.com/modelcontextprotocol/ext-apps/blob/82221c0c8ce7661efa6771c9d461511b1650495f/examples/basic-server-solid/package.json); [examples/basic-server-svelte/package.json](https://github.com/modelcontextprotocol/ext-apps/blob/82221c0c8ce7661efa6771c9d461511b1650495f/examples/basic-server-svelte/package.json)

License evidence: [LICENSE](https://github.com/modelcontextprotocol/ext-apps/blob/82221c0c8ce7661efa6771c9d461511b1650495f/LICENSE) Classification hint: MIT. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-query**. Its category places it in the candidate set for memory, import-generation, decisions; those associations are navigational and have not been individually validated as implemented capabilities. See [memory](../memory.md) · [import-generation](../import-generation.md) · [decisions](../decisions.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.
