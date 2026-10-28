# agent-framework.ms

Source: [agent-framework.ms](https://github.com/microsoft/agent-framework) · Category: [ai-agents](../categories/ai-agents.md)

Original review depth: **inventory / README screening only**. The dated update review below has its own explicit scope. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

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

## 2026-10-28 scoped update review

Reviewed commit `981f70e3c7bb9d8062dd5e7eafbca1684c6a9a86` (commit date `2026-10-27T15:46:45Z`). The original snapshot above remains historical evidence.

**Scope:** Selected Python MCP lifecycle-owner, payload retention, tool retry and dynamic HTTP identity branches with selected SDK migration hunks; complete discovery/subscription code, transport hooks, telemetry exporter and regression suites were not audited.

The [MCP lifecycle owner](https://github.com/microsoft/agent-framework/blob/981f70e3c7bb9d8062dd5e7eafbca1684c6a9a86/python/packages/core/agent_framework/_mcp.py#L2048-L2190) distinguishes completing a connection future from the caller actually accepting it. If the caller stops waiting before acceptance, the owner closes a newly created connection; pending requests fail when the owner exits. This addresses a real cancellation/ownership gap. The queue is unbounded and cleanup is awaited without a deadline in the reviewed branch, so Teamagent still needs bounded admission and an independently observed cleanup outcome.

[HTTP session identity](https://github.com/microsoft/agent-framework/blob/981f70e3c7bb9d8062dd5e7eafbca1684c6a9a86/python/packages/core/agent_framework/_mcp.py#L4384-L4569) derives effective headers from static and host runtime inputs, serializes calls under a lock and reconnects before using a changed identity. Low-level caller-supplied sessions reject unknown/changed identity rather than being silently repurposed. Pending headers are promoted only after reconnect/discovery succeeds. This is a useful boundary between model arguments and authentication context, but it does not prove those runtime inputs are authenticated or that uninspected HTTP hooks enforce destination scope.

The [tool retry loop](https://github.com/microsoft/agent-framework/blob/981f70e3c7bb9d8062dd5e7eafbca1684c6a9a86/python/packages/core/agent_framework/_mcp.py#L3380-L3459) reconnects a framework-owned connection then reissues the tool call once on a closed-resource/session-terminated error. A lost response does not establish that the first effect never happened, and this branch does not gate replay on idempotency or an operation receipt. Caller-owned connections correctly require their owner to replace them, but ownership alone does not make effect replay safe. Teamagent must reconcile ambiguous outcomes before repeating a non-idempotent tool.

[Host payload capture](https://github.com/microsoft/agent-framework/blob/981f70e3c7bb9d8062dd5e7eafbca1684c6a9a86/python/packages/core/agent_framework/_mcp.py#L245-L512) separates host-only result data from model-visible items and applies per-result/aggregate encoded-size checks, with explicit omission warnings. Those retention limits occur after transport parsing and do not cap network input or replace depth/type validation. Exception logging has a separate sensitive-data setting, while calls to the uninspected span-error helper still receive error text; this review does not certify every telemetry sink. No MCP server, provider, upstream fixture or SDK code was executed.

**Verification limit:** source inspection only; no upstream tests or provider calls were executed. This scoped review does not certify every file in the repository.

## 2026-10-28 follow-up source review

Reviewed commit `4a272d2b8e96242a1e00783e833d42922a618d23` (commit date `2026-10-28T06:27:42Z`), compared with `981f70e3c7bb9d8062dd5e7eafbca1684c6a9a86`. Earlier findings remain historical evidence.

**Scope:** Python chat-client context management and owned Gemini/Ollama transport cleanup. The complete changed-path inventory contains 34 paths; the assessment below is limited to the cited branches.

The base chat client now exposes async context management, awaits asynchronous close implementations and permits legacy synchronous close hooks without suppressing exceptions. Its default close is a no-op and explicitly leaves caller-supplied resources open. The Gemini adapter records whether it created the client, closes both asynchronous and synchronous transports, and marks completion only after cleanup returns. See [python/packages/core/agent_framework/_clients.py](https://github.com/microsoft/agent-framework/blob/4a272d2b8e96242a1e00783e833d42922a618d23/python/packages/core/agent_framework/_clients.py#L319-L343) and [python/packages/gemini/agent_framework_gemini/_chat_client.py](https://github.com/microsoft/agent-framework/blob/4a272d2b8e96242a1e00783e833d42922a618d23/python/packages/gemini/agent_framework_gemini/_chat_client.py#L344-L361). The inspected Ollama delta applies the same ownership distinction to its underlying HTTP client.

For Teamagent, express transport ownership in scoped services and preserve cleanup failures separately from task completion. These boolean closed flags are not concurrency locks and supply no independent deadline for an uncooperative SDK. Other provider adapters, concurrent requests and real transport release were not exercised.

**Verification limit:** committed-source inspection only; no upstream code, tests or provider calls were executed. This review does not certify every changed file or establish a Teamagent integration.

<!-- teamagent-analysis:start -->
Analysis metadata: source [agent-framework.ms](https://github.com/microsoft/agent-framework); analyzed commit `4a272d2b8e96242a1e00783e833d42922a618d23`; commit date 2026-10-28T06:27:42Z; review date 2026-10-28T14:29:27.414Z; depth screened. [Maintenance record](../analyses/repos/ai-agents--agent-framework.ms.md).
<!-- teamagent-analysis:end -->
