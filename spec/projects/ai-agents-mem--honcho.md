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


## Change review - 2026-10-28

**The MCP bridge surfaces upstream token rejection while cache failures remain indistinguishable from misses.** Reviewed commit `bcaf722a9f9077593e0c89a0bb644061c43481b3` (commit date `2026-10-27T12:38:39-04:00`). Compared with `8e4df990d974c146a100e96ab4b3957a6591ceab`; the complete Git comparison contains 447 changed paths.

The Worker bridge now requests a single JSON response and records an onUnauthorized callback while the tool handler runs. If upstream rejects the token, the bridge replaces that response with an HTTP 401 so the client can refresh; this is decided after tool handling, not a universal pre-execution authentication guarantee. It also forwards plugin identity headers and wraps the entry in Sentry. Its catch captures the exception and returns its message to the caller, so telemetry and error privacy depend on uninspected configuration and exception content.

safe_cache_get adds an optional timeout but defaults to no deadline; all ordinary exceptions become None, identical to a cache miss, with the key and traceback logged. Existing set/delete wrappers retry transient errors at most three times but suppress final failure. Model changes add deletion timestamps and generation counters plus lookup indexes, which are useful deletion-barrier inputs but do not by themselves establish query exclusion, stale-worker fencing or complete physical deletion. OAuth URL construction now extends an existing query and applies attribution helpers; those helper privacy semantics were outside this scope.

Evidence: [mcp/src/index.ts:74-162](https://github.com/plastic-labs/honcho/blob/bcaf722a9f9077593e0c89a0bb644061c43481b3/mcp/src/index.ts#L74-L162) · [src/cache/client.py:411-448](https://github.com/plastic-labs/honcho/blob/bcaf722a9f9077593e0c89a0bb644061c43481b3/src/cache/client.py#L411-L448) · [src/models.py:104-135](https://github.com/plastic-labs/honcho/blob/bcaf722a9f9077593e0c89a0bb644061c43481b3/src/models.py#L104-L135) · [src/models.py:180-218](https://github.com/plastic-labs/honcho/blob/bcaf722a9f9077593e0c89a0bb644061c43481b3/src/models.py#L180-L218) · [src/models.py:653-689](https://github.com/plastic-labs/honcho/blob/bcaf722a9f9077593e0c89a0bb644061c43481b3/src/models.py#L653-L689) · [hermes-plugin-honcho/oauth_flow.py:101-126](https://github.com/plastic-labs/honcho/blob/bcaf722a9f9077593e0c89a0bb644061c43481b3/hermes-plugin-honcho/oauth_flow.py#L101-L126) · [hermes-plugin-honcho/oauth_flow.py:284-309](https://github.com/plastic-labs/honcho/blob/bcaf722a9f9077593e0c89a0bb644061c43481b3/hermes-plugin-honcho/oauth_flow.py#L284-L309).

**Harness consequence:** Retain explicit transport authentication outcomes, but do not replay mutations merely because a proxy eventually returned 401 unless pre-effect rejection or idempotency is proven. Separate cache miss from cache unavailable in operational receipts, set deadlines and redact keys/exception chains. Verify the full deletion state machine and all readers/workers before adopting generation counters as an erasure guarantee; review telemetry capture and outbound attribution independently.

**Scope and limits:** Static scoped review of the MCP wrapper, cache helpers, deletion-schema additions and OAuth URL call sites within the 447-path comparison. Underlying tool handlers, Sentry/attribution configuration, deletion workers/migrations and real authorization/Redis behavior were not exhaustively audited or executed.

<!-- teamagent-analysis:start -->
Analysis metadata: source [honcho](https://github.com/plastic-labs/honcho); analyzed commit `bcaf722a9f9077593e0c89a0bb644061c43481b3`; commit date 2026-10-27T12:38:39-04:00; review date 2026-10-28T08:47:42.123Z; depth screened. [Maintenance record](../analyses/repos/ai-agents-mem--honcho.md).
<!-- teamagent-analysis:end -->
