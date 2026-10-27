# CLIProxyAPI: compatibility bridge with authentication coupling

Source: [cli-proxy-api](https://github.com/router-for-me/CLIProxyAPI) · Category: `ai-agents-proxy`

Review depth: **source-reviewed**. Snapshot `d7914afdedca7af95ee974a42453dc49fc1388ce`; assessed 2026-10-04. This is a focused static review of the listed files, not an audit of every code path or a reproduced benchmark. No repository code, model weights, paid endpoints, or installers were run.

## Observed architecture

The Codex executor implements a provider-specific contract, advertises an apply-patch capability, and retains configuration for model-level cooling. The execution path obtains credentials and a configurable base URL, falling back to `https://chatgpt.com/backend-api/codex`, then sends Responses requests. Source search also shows dedicated refresh handling and provider request headers. This establishes the mechanics of a compatibility bridge; it does not establish that every authentication or endpoint combination is an approved third-party integration.

This distinction is important for a harness promising subscription use. A local agent process, an official app-server session, a provider's documented token-sharing integration, and a proxy that replays private backend traffic have different support and failure properties even when their outputs look OpenAI-compatible.

## Harness adoption

Prefer documented provider integration paths, including eligible Sign in with ChatGPT integrations where available; [models](../models.md) and the [agents direction](../agents.md) describe the separation. Keep CLIProxyAPI optional for explicitly selected compatibility experiments. Do not make it the universal credential or entitlement broker.

Model the integration as `transport + authentication_mode + entitlement + capability_version`. Conformance tests should exercise streamed tool calls, cancellation, interrupted responses, context limits, usage accounting, and session renewal. Never infer media generation entitlement from a working text endpoint.

## Limitations and decision

The default URL is coupled to a provider backend that can change independently of an OpenAI-compatible API surface. Translation can lose native reasoning/session semantics. Credentials must remain in a local vault or tightly scoped worker, and account pooling should not be treated as a substitute for authorized capacity. Study its adapters and failure fixtures; defer making it a default until the selected route is verified against current provider documentation.

## Evidence read

- [Small Codex executor contract](https://github.com/router-for-me/CLIProxyAPI/blob/d7914afdedca7af95ee974a42453dc49fc1388ce/internal/runtime/executor/codex_executor.go#L1-L20)
- [Default Codex upstream and request endpoint](https://github.com/router-for-me/CLIProxyAPI/blob/d7914afdedca7af95ee974a42453dc49fc1388ce/internal/runtime/executor/codex_executor_execute.go#L21-L79)

## Related directions

[Models](../models.md) · [Agents](../agents.md) · [Security](../security.md)

<!-- teamagent-analysis:start -->
Analysis metadata: source [cli-proxy-api](https://github.com/router-for-me/CLIProxyAPI); analyzed commit `d7914afdedca7af95ee974a42453dc49fc1388ce`; commit date 2026-10-03T17:01:12+08:00; review date unknown; depth source-reviewed. [Maintenance record](../analyses/repos/ai-agents-proxy--cli-proxy-api.md).
<!-- teamagent-analysis:end -->
