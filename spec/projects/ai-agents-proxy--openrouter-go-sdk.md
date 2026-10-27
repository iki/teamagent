# openrouter-go-sdk

Source: [openrouter-go-sdk](https://github.com/OpenRouterTeam/go-sdk) · Category: [ai-agents-proxy](../categories/ai-agents-proxy.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `b6813fe66149d84ea00758cb2f8b233ccbc76e29`; commit timestamp `2026-10-02T21:54:29Z`; 3,415 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/OpenRouterTeam/go-sdk/blob/b6813fe66149d84ea00758cb2f8b233ccbc76e29/README.md)):

> The OpenRouter SDK is a Go client for building AI-powered features with OpenRouter. It gives you type-safe access to 400+ models across providers through an OpenAI-compatible API, plus OpenRouter-specific features like provider routing, guardrails, and analytics. [](https://www.speakeasy.com/?utm_source=openrouter&utm_campaign=go)

Build/package evidence: [examples/chat-stream/go.mod](https://github.com/OpenRouterTeam/go-sdk/blob/b6813fe66149d84ea00758cb2f8b233ccbc76e29/examples/chat-stream/go.mod); [examples/chat/go.mod](https://github.com/OpenRouterTeam/go-sdk/blob/b6813fe66149d84ea00758cb2f8b233ccbc76e29/examples/chat/go.mod); [examples/embed/go.mod](https://github.com/OpenRouterTeam/go-sdk/blob/b6813fe66149d84ea00758cb2f8b233ccbc76e29/examples/embed/go.mod); [examples/generation/go.mod](https://github.com/OpenRouterTeam/go-sdk/blob/b6813fe66149d84ea00758cb2f8b233ccbc76e29/examples/generation/go.mod); [examples/model/go.mod](https://github.com/OpenRouterTeam/go-sdk/blob/b6813fe66149d84ea00758cb2f8b233ccbc76e29/examples/model/go.mod)

License evidence: [LICENSE](https://github.com/OpenRouterTeam/go-sdk/blob/b6813fe66149d84ea00758cb2f8b233ccbc76e29/LICENSE) Classification hint: Apache-2.0. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents-proxy**. Its category places it in the candidate set for models, decisions; those associations are navigational and have not been individually validated as implemented capabilities. See [models](../models.md) · [decisions](../decisions.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

<!-- teamagent-analysis:start -->
Analysis metadata: source [openrouter-go-sdk](https://github.com/OpenRouterTeam/go-sdk); analyzed commit `b6813fe66149d84ea00758cb2f8b233ccbc76e29`; commit date 2026-10-02T21:54:29Z; review date unknown; depth screened. [Maintenance record](../analyses/repos/ai-agents-proxy--openrouter-go-sdk.md).
<!-- teamagent-analysis:end -->
