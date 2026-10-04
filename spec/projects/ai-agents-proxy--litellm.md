# LiteLLM: broad provider normalization and routing

Source: [litellm](https://github.com/BerriAI/litellm) · Category: `ai-agents-proxy`

Review depth: **source-reviewed**. Snapshot `252c71c0b22197d5dd99eac730696f28032796af`; assessed 2026-10-04. This is a focused static review of the listed files, not an audit of every code path or a reproduced benchmark. No repository code, model weights, paid endpoints, or installers were run.

## Observed architecture

The router imports dedicated strategies for lowest cost, lowest latency, least busy, token/request limits, budgets, and tags. Cooldown and health state, retry-policy resolution, fallback handling, and reservation refunding are separate dependencies. This is richer than choosing the cheapest model name: availability and request accounting participate in routing.

The inspected environment gate rejects invalid environment configuration and can suppress deployments not intended for the current environment. The stream-content helper recognizes tool calls, reasoning, audio, images, and annotations as generated content. That is a valuable pattern for deciding whether a retry is still safe before the user or a downstream tool has observed an answer.

## Harness adoption

Use LiteLLM where provider breadth and an existing Python integration ecosystem dominate. Hide it behind a harness-owned adapter contract so the application can switch gateways or call a provider directly when a specialized API is not faithfully normalized. Distinguish infrastructure routing among equivalent deployments from semantic task routing among models with different expected quality.

Attach task and attempt identifiers, budget reservations, a maximum retry count, and an absolute deadline. Keep deployment health and cost accounting outside prompts. Return typed `unsupported_capability` errors for unavailable modalities or session features rather than silently deleting request fields.

## Limitations and decision

The inspected file is large and composes many changing strategies; adoption needs pinned releases, configuration migration tests, and provider-specific contract fixtures. Native subscriptions and OAuth remain provider-specific entitlements. The [official router documentation](https://docs.litellm.ai/docs/routing), checked 2026-10-04, confirms deployment balancing, cooldowns, fallbacks, timeouts, retries, and Redis-backed usage coordination; it does not prove workload quality or a universal subscription route. Benchmark against [Bifrost](ai-agents-proxy--bifrost.md) on the intended deployment rather than repeating marketing ratios.

## Evidence read

- [Router strategy imports and reliability dependencies](https://github.com/BerriAI/litellm/blob/252c71c0b22197d5dd99eac730696f28032796af/litellm/router.py#L105-L199)
- [Environment gating and committed streaming content detection](https://github.com/BerriAI/litellm/blob/252c71c0b22197d5dd99eac730696f28032796af/litellm/router.py#L347-L430)

## Related directions

[Models](../models.md) · [Decisions](../decisions.md) · [Generation](../generation.md) · [Security](../security.md)
