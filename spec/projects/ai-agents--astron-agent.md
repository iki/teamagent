# astron-agent

Source: [astron-agent](https://github.com/iflytek/astron-agent) · Category: [ai-agents](../categories/ai-agents.md)

Original review depth: **inventory / README screening only**. The dated update review below has its own explicit scope. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `be42c25e45c760f2aa21ed5c6f652dfa33e4bdf1`; commit timestamp `2026-10-03T17:21:34+08:00`; 4,865 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/iflytek/astron-agent/blob/be42c25e45c760f2aa21ed5c6f652dfa33e4bdf1/README.md)):

> Astron Agent is an **enterprise-grade, commercial-friendly** Agentic Workflow development platform that integrates AI workflow orchestration, model management, AI and MCP tool integration, RPA automation, and team collaboration features. The platform supports **high-availability** deployment, enabling organizations to rapidly build **scalable, production-ready** intelligent agent applications and establish their AI foundation for the future.

Build/package evidence: [console/backend/commons/pom.xml](https://github.com/iflytek/astron-agent/blob/be42c25e45c760f2aa21ed5c6f652dfa33e4bdf1/console/backend/commons/pom.xml); [console/backend/hub/pom.xml](https://github.com/iflytek/astron-agent/blob/be42c25e45c760f2aa21ed5c6f652dfa33e4bdf1/console/backend/hub/pom.xml); [console/backend/pom.xml](https://github.com/iflytek/astron-agent/blob/be42c25e45c760f2aa21ed5c6f652dfa33e4bdf1/console/backend/pom.xml); [console/backend/toolkit/pom.xml](https://github.com/iflytek/astron-agent/blob/be42c25e45c760f2aa21ed5c6f652dfa33e4bdf1/console/backend/toolkit/pom.xml); [console/frontend/package.json](https://github.com/iflytek/astron-agent/blob/be42c25e45c760f2aa21ed5c6f652dfa33e4bdf1/console/frontend/package.json)

License evidence: [LICENSE](https://github.com/iflytek/astron-agent/blob/be42c25e45c760f2aa21ed5c6f652dfa33e4bdf1/LICENSE) Classification hint: Apache-2.0. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents**. Its category places it in the candidate set for agents, models, channels; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [models](../models.md) · [channels](../channels.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

## 2026-10-28 scoped update review

Reviewed commit `468a676f2d8408a41d95ec0ee37cd4b8f028fef2` (commit date `2026-10-21T11:06:13+08:00`). The original snapshot above remains historical evidence.

**Scope:** Complete outbound SSRF policy helper at the pinned revision; actual HTTP/MCP call sites, Java policy implementation, redirect handling and live DNS/network tests were not audited.

The [outbound guard](https://github.com/iflytek/astron-agent/blob/468a676f2d8408a41d95ec0ee37cd4b8f028fef2/core/plugin/link/infra/tool_exector/ssrf_guard.py#L50-L168) parses immutable deployment policy, restricts URL schemes, rejects credential-bearing/invalid authority forms and validates literal destinations. Private-endpoint exceptions compare normalized scheme, host, port and path; configured entries reject query/semicolon forms, while requests with a semicolon path cannot match the exception. Blocked networks take precedence over literal-network exceptions, and domain rules match label boundaries with the same host-normalization library used by the intended HTTP client.

The socket factory validates the actual resolved socket address immediately before creating the socket. That is a stronger pattern than checking one DNS lookup then allowing the transport to resolve again. The [separate DNS helpers](https://github.com/iflytek/astron-agent/blob/468a676f2d8408a41d95ec0ee37cd4b8f028fef2/core/plugin/link/infra/tool_exector/ssrf_guard.py#L171-L243) check all returned addresses, but explicitly document that the MCP/httpx path can resolve again and retains a rebinding gap. Offloading DNS to a thread avoids blocking the event loop; it does not impose a whole-operation deadline or cancel an in-progress resolver thread.

Teamagent can reuse the separation between normalized origin policy, explicit deployment exceptions and effect-time address enforcement. This helper-only review does not establish that every transport installs the factory, that redirects are revalidated, or that its literal exception list is suitable for a given deployment. Preserve those unknowns, require transport-specific tests and prevent model-generated endpoints from changing trusted policy.

**Verification limit:** source inspection only; no upstream tests or provider calls were executed. This scoped review does not certify every file in the repository.

<!-- teamagent-analysis:start -->
Analysis metadata: source [astron-agent](https://github.com/iflytek/astron-agent); analyzed commit `468a676f2d8408a41d95ec0ee37cd4b8f028fef2`; commit date 2026-10-21T11:06:13+08:00; review date 2026-10-28T08:47:42.123Z; depth screened. [Maintenance record](../analyses/repos/ai-agents--astron-agent.md).
<!-- teamagent-analysis:end -->
