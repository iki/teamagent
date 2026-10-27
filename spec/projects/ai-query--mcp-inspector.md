# mcp-inspector

Source: [mcp-inspector](https://github.com/modelcontextprotocol/inspector) · Category: [ai-query](../categories/ai-query.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `ae865a19178ddf6f375780a02e9c77c4cf4da184`; commit timestamp `2026-09-30T18:23:03-04:00`; 1,460 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/modelcontextprotocol/inspector/blob/ae865a19178ddf6f375780a02e9c77c4cf4da184/README.md)):

> A developer tool for inspecting Model Context Protocol (MCP) servers. It ships as a single package, `@modelcontextprotocol/inspector`, that provides three ways to inspect a server: - **Web** — a Vite + React + Mantine single-page app with a Node backend.

Build/package evidence: [clients/cli/package.json](https://github.com/modelcontextprotocol/inspector/blob/ae865a19178ddf6f375780a02e9c77c4cf4da184/clients/cli/package.json); [clients/launcher/package.json](https://github.com/modelcontextprotocol/inspector/blob/ae865a19178ddf6f375780a02e9c77c4cf4da184/clients/launcher/package.json); [clients/tui/package.json](https://github.com/modelcontextprotocol/inspector/blob/ae865a19178ddf6f375780a02e9c77c4cf4da184/clients/tui/package.json); [clients/web/package.json](https://github.com/modelcontextprotocol/inspector/blob/ae865a19178ddf6f375780a02e9c77c4cf4da184/clients/web/package.json); [package.json](https://github.com/modelcontextprotocol/inspector/blob/ae865a19178ddf6f375780a02e9c77c4cf4da184/package.json)

License evidence: [LICENSE](https://github.com/modelcontextprotocol/inspector/blob/ae865a19178ddf6f375780a02e9c77c4cf4da184/LICENSE) Classification hint: MIT. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-query**. Its category places it in the candidate set for memory, import-generation, decisions; those associations are navigational and have not been individually validated as implemented capabilities. See [memory](../memory.md) · [import-generation](../import-generation.md) · [decisions](../decisions.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

<!-- teamagent-analysis:start -->
Analysis metadata: source [mcp-inspector](https://github.com/modelcontextprotocol/inspector); analyzed commit `ae865a19178ddf6f375780a02e9c77c4cf4da184`; commit date 2026-09-30T18:23:03-04:00; review date unknown; depth screened. [Maintenance record](../analyses/repos/ai-query--mcp-inspector.md).
<!-- teamagent-analysis:end -->
