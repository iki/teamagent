# fastmcp

Source: [fastmcp](https://github.com/punkpeye/fastmcp) · Category: [ai-query](../categories/ai-query.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `3cc03cfea6ca74dd5b0c004de498a3083e8f2348`; commit timestamp `2026-09-29T22:32:15-07:00`; 164 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/punkpeye/fastmcp/blob/3cc03cfea6ca74dd5b0c004de498a3083e8f2348/README.md)):

> A TypeScript framework for building MCP servers capable of handling client sessions. FastMCP implements the legacy, handshake-based MCP revisions (`2025-11-25` and earlier). It does not support the current specification, `2026-07-28`, which made the protocol stateless — no `initialize` handshake and no `Mcp-Session-Id`. For a framework targeting the current spec, use ViteMCP.

Build/package evidence: [package.json](https://github.com/punkpeye/fastmcp/blob/3cc03cfea6ca74dd5b0c004de498a3083e8f2348/package.json)

License evidence: [LICENSE](https://github.com/punkpeye/fastmcp/blob/3cc03cfea6ca74dd5b0c004de498a3083e8f2348/LICENSE) Classification hint: MIT. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-query**. Its category places it in the candidate set for memory, import-generation, decisions; those associations are navigational and have not been individually validated as implemented capabilities. See [memory](../memory.md) · [import-generation](../import-generation.md) · [decisions](../decisions.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.
