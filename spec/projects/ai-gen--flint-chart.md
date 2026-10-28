# flint-chart

Source: [flint-chart](https://github.com/microsoft/flint-chart) · Category: [ai-gen](../categories/ai-gen.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `683d5de1ffd0c1a76001ca5aa044f297276d7734`; commit timestamp `2026-09-23T08:57:32-07:00`; 3,456 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/microsoft/flint-chart/blob/683d5de1ffd0c1a76001ca5aa044f297276d7734/README.md)):

> [](https://github.com/microsoft/flint-chart/actions/workflows/ci.yml) Please visit:** **Flint Project Site** | **Visual Themes** | **MCP Server Guide** | **中文主页

Build/package evidence: [package.json](https://github.com/microsoft/flint-chart/blob/683d5de1ffd0c1a76001ca5aa044f297276d7734/package.json); [packages/flint-js/package.json](https://github.com/microsoft/flint-chart/blob/683d5de1ffd0c1a76001ca5aa044f297276d7734/packages/flint-js/package.json); [packages/flint-mcp/package.json](https://github.com/microsoft/flint-chart/blob/683d5de1ffd0c1a76001ca5aa044f297276d7734/packages/flint-mcp/package.json); [packages/flint-py/pyproject.toml](https://github.com/microsoft/flint-chart/blob/683d5de1ffd0c1a76001ca5aa044f297276d7734/packages/flint-py/pyproject.toml); [site/package.json](https://github.com/microsoft/flint-chart/blob/683d5de1ffd0c1a76001ca5aa044f297276d7734/site/package.json)

License evidence: [LICENSE](https://github.com/microsoft/flint-chart/blob/683d5de1ffd0c1a76001ca5aa044f297276d7734/LICENSE) Classification hint: MIT. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-gen**. Its category places it in the candidate set for import-generation, channels; those associations are navigational and have not been individually validated as implemented capabilities. See [import-generation](../import-generation.md) · [channels](../channels.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.


## Change review - 2026-10-28

**Validated chart snapshots and explicit backend capabilities still require isolated rendering boundaries.** Reviewed commit `a794557384adcc3293a77043f6b9aff1c33d152c` (commit date `2026-10-21T16:39:01-07:00`). Compared with `683d5de1ffd0c1a76001ca5aa044f297276d7734`; the complete Git comparison contains 866 changed paths.

The MCP server reassembles and validates the submitted chart/board for show, returns isError and no board snapshot when any chart fails, and emits independent snapshots for later cards. Fixtures check malformed encodings, unknown chart types, malformed update operations and preservation of earlier cards. Static rendering explicitly rejects Chart.js SVG and unsupported backends; the MCP scale schema is limited to 0.5-4, but the directly exported renderer only substitutes a default for nonpositive scale and does not enforce that same upper bound. SVG rendering finalizes Vega views and disposes ECharts instances. The optional Vega expression interpreter supports hosts that forbid dynamic evaluation, but it is caller-supplied rather than enforced. Client file roots are cached and refreshed on roots-change notification, with failures reduced to an empty list; actual file containment and parsing are delegated to uninspected helpers. Demo host methods are no-ops, so the site preview does not prove live host-tool behavior.

Evidence: [packages/flint-mcp/src/server.ts:245-318](https://github.com/microsoft/flint-chart/blob/a794557384adcc3293a77043f6b9aff1c33d152c/packages/flint-mcp/src/server.ts#L245-L318) · [packages/flint-mcp/src/server.ts:484-555](https://github.com/microsoft/flint-chart/blob/a794557384adcc3293a77043f6b9aff1c33d152c/packages/flint-mcp/src/server.ts#L484-L555) · [packages/flint-mcp/tests/server.test.ts:183-223](https://github.com/microsoft/flint-chart/blob/a794557384adcc3293a77043f6b9aff1c33d152c/packages/flint-mcp/tests/server.test.ts#L183-L223) · [packages/flint-mcp/tests/server.test.ts:346-406](https://github.com/microsoft/flint-chart/blob/a794557384adcc3293a77043f6b9aff1c33d152c/packages/flint-mcp/tests/server.test.ts#L346-L406) · [packages/flint-mcp/src/render/index.ts:41-118](https://github.com/microsoft/flint-chart/blob/a794557384adcc3293a77043f6b9aff1c33d152c/packages/flint-mcp/src/render/index.ts#L41-L118) · [packages/flint-js/src/render/index.ts:8-58](https://github.com/microsoft/flint-chart/blob/a794557384adcc3293a77043f6b9aff1c33d152c/packages/flint-js/src/render/index.ts#L8-L58) · [site/src/components/mcp-embed.tsx:48-65](https://github.com/microsoft/flint-chart/blob/a794557384adcc3293a77043f6b9aff1c33d152c/site/src/components/mcp-embed.tsx#L48-L65).

**Harness consequence:** Keep declarative chart validation separate from rendering and from host action authorization. Apply identical size/pixel/scale and resource limits at every public entry point, isolate rendering work, require a non-eval expression path and verify data-file containment. Store input/data hashes, warnings, renderer/version and rendered artifact together; a returned card snapshot does not prove visual accuracy or a host interaction succeeded.

**Scope and limits:** Scoped static review of MCP validation/render dispatch, renderer ownership and related server fixtures in the 866-path comparison. Assembly semantics, file-data resolver, full UI/board interaction implementation and temporal parser were not audited. Tests were read, not run; no render, host action or performance measurement was performed.

<!-- teamagent-analysis:start -->
Analysis metadata: source [flint-chart](https://github.com/microsoft/flint-chart); analyzed commit `a794557384adcc3293a77043f6b9aff1c33d152c`; commit date 2026-10-21T16:39:01-07:00; review date 2026-10-28T08:47:42.123Z; depth screened. [Maintenance record](../analyses/repos/ai-gen--flint-chart.md).
<!-- teamagent-analysis:end -->
