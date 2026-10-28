# awesome-mcp-servers

Source: [awesome-mcp-servers](https://github.com/punkpeye/awesome-mcp-servers) · Category: [ai-info](../categories/ai-info.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `3c30195615095be4f22ac120a7cee82f215cf547`; commit timestamp `2026-09-26T19:12:09-07:00`; 12 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/punkpeye/awesome-mcp-servers/blob/3c30195615095be4f22ac120a7cee82f215cf547/README.md)):

> ray.run – from idea to a production-grade MCP server in under a minute! 🦜 MCP is an open protocol that enables AI models to securely interact with local and remote resources through standardized server implementations. This list focuses on production-ready and experimental MCP servers that extend AI capabilities through file access, database connections, API integrations, and other contextual services.

Build/package evidence: No common build manifest identified.

License evidence: [LICENSE](https://github.com/punkpeye/awesome-mcp-servers/blob/3c30195615095be4f22ac120a7cee82f215cf547/LICENSE) Classification hint: MIT. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-info**. Its category places it in the candidate set for agents, evolution; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [evolution](../evolution.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

## Source update reviewed 2026-10-28

Reviewed commit: [`f225f117f92626e6b7d5d2912746d9269e3d037b`](https://github.com/punkpeye/awesome-mcp-servers/commit/f225f117f92626e6b7d5d2912746d9269e3d037b). Scope: README delta from 3c30195615095be4f22ac120a7cee82f215cf547 to the pinned revision: all 551 nonblank added lines across 208 hunks were inspected as catalog text, with repeated image-badge link markup removed for readability. There were no removed lines. Unchanged context, badge assets, translations and linked server implementations were not re-reviewed; the full README exceeded the 512 KiB capture limit, while the complete 920,102-byte diff was retained and hash-checked.

The [README additions](https://github.com/punkpeye/awesome-mcp-servers/blob/f225f117f92626e6b7d5d2912746d9269e3d037b/README.md) widen discovery across browser control, agent coordination, memory, observability, policy proxies, communications and paid services. This is a catalog-content review, not source-code review of the listed servers. The retained diff makes the delta auditable despite the full-blob capture limit; it does not establish the linked projects' current implementation, package identity, maintenance, licensing, availability or platform support.

Several descriptions are useful leads for narrowly scoped implementation reviews: [Terse's reversible encoding and result deltas](https://github.com/punkpeye/awesome-mcp-servers/blob/f225f117f92626e6b7d5d2912746d9269e3d037b/README.md#L143) would need round-trip fixtures, baseline/session identity and recovery after missed deltas; [Lauther's distinct denied and unanswered states](https://github.com/punkpeye/awesome-mcp-servers/blob/f225f117f92626e6b7d5d2912746d9269e3d037b/README.md#L1014) fit a fail-closed approval contract; and [MCP Pin's tool-definition fingerprint](https://github.com/punkpeye/awesome-mcp-servers/blob/f225f117f92626e6b7d5d2912746d9269e3d037b/README.md#L4127) motivates binding approval to a versioned tool contract. None of those implementations or advertised guarantees was inspected here. A signature or unchanged tool schema also cannot establish that remote behavior is unchanged.

Descriptions must not become automatic verdicts. [ZeroDOM's entry](https://github.com/punkpeye/awesome-mcp-servers/blob/f225f117f92626e6b7d5d2912746d9269e3d037b/README.md#L563) describes byte-identical responses for two users as a cross-tenant IDOR signal; equality alone does not prove unauthorized disclosure, because shared/public responses can be legitimate and authorization context matters. [MCP Laya's entry](https://github.com/punkpeye/awesome-mcp-servers/blob/f225f117f92626e6b7d5d2912746d9269e3d037b/README.md#L2014) ties lack of text generation to absence of hallucination; a typed classifier can still be wrong or miscalibrated. Claims of token reduction, formal isolation, complete test coverage, no secret leakage or unbypassable audit logging require scoped evidence, reproducible cases and failure-path inspection. The badges and numeric claims are not independent measurements in this review.

Read-only/local labels need separate capability and privacy checks. [Logged-in browser access](https://github.com/punkpeye/awesome-mcp-servers/blob/f225f117f92626e6b7d5d2912746d9269e3d037b/README.md#L579) can expose session data without mutating it; remote email, publishing, deployments and [wallet operations](https://github.com/punkpeye/awesome-mcp-servers/blob/f225f117f92626e6b7d5d2912746d9269e3d037b/README.md#L2296) can act on other systems. A model-supplied confirmation flag, catalog claim of approval, preview or quoted price does not itself prove a human authorized the exact effect. Inspect principal/resource binding, redirects and outbound destinations, credential handling, limits, cancellation and ambiguous retry outcomes before integration. Catalog installation snippets and mutable package runners were not executed or adopted.

The same [OperatorNest repository appears at one location](https://github.com/punkpeye/awesome-mcp-servers/blob/f225f117f92626e6b7d5d2912746d9269e3d037b/README.md#L4728) and [again later](https://github.com/punkpeye/awesome-mcp-servers/blob/f225f117f92626e6b7d5d2912746d9269e3d037b/README.md#L4764), illustrating why entry counts and unique candidates must be reported separately. Preserve exact source links and discovery provenance, deduplicate by repository/package identity, and retain advertised capabilities as unverified attributes. Disposition: retain as a discovery index; select an individual project only after a pinned implementation and test review, then run bounded, authorized acceptance checks.

<!-- teamagent-analysis:start -->
Analysis metadata: source [awesome-mcp-servers](https://github.com/punkpeye/awesome-mcp-servers); analyzed commit `f225f117f92626e6b7d5d2912746d9269e3d037b`; commit date 2026-10-23T11:57:43-07:00; review date 2026-10-28T09:45:33.667Z; depth screened. [Maintenance record](../analyses/repos/ai-info--awesome-mcp-servers.md).
<!-- teamagent-analysis:end -->
