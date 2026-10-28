# openrouter-typescript-sdk

Source: [openrouter-typescript-sdk](https://github.com/OpenRouterTeam/typescript-sdk) · Category: [ai-agents-proxy](../categories/ai-agents-proxy.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `d64d57612ceb227b1211ea08cf6577923e62e0e6`; commit timestamp `2026-10-02T21:49:21Z`; 3,646 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/OpenRouterTeam/typescript-sdk/blob/d64d57612ceb227b1211ea08cf6577923e62e0e6/README.md)):

> The OpenRouter TypeScript SDK is the official type-safe toolkit designed to build AI-powered features and solutions in any JS or TS runtime. It provides seamless access to 400+ leading AI models across providers combined with first-class TypeScript support. To learn more about how to use the OpenRouter SDK, check out our API Reference and Documentation.

Build/package evidence: [examples/nextjs-example/package.json](https://github.com/OpenRouterTeam/typescript-sdk/blob/d64d57612ceb227b1211ea08cf6577923e62e0e6/examples/nextjs-example/package.json); [examples/package.json](https://github.com/OpenRouterTeam/typescript-sdk/blob/d64d57612ceb227b1211ea08cf6577923e62e0e6/examples/package.json); [package.json](https://github.com/OpenRouterTeam/typescript-sdk/blob/d64d57612ceb227b1211ea08cf6577923e62e0e6/package.json)

License evidence: [LICENSE.md](https://github.com/OpenRouterTeam/typescript-sdk/blob/d64d57612ceb227b1211ea08cf6577923e62e0e6/LICENSE.md) Classification hint: Apache-2.0. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents-proxy**. Its category places it in the candidate set for models, decisions; those associations are navigational and have not been individually validated as implemented capabilities. See [models](../models.md) · [decisions](../decisions.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

## Source update reviewed 2026-10-28

Reviewed commit: [`548648e6956bf80260cca35975a83f62e25c0f0d`](https://github.com/OpenRouterTeam/typescript-sdk/commit/548648e6956bf80260cca35975a83f62e25c0f0d). Scope: Full generated deferred-tool, namespace-function and computer-use configuration models read. Network client, referenced union schemas and provider runtime were not audited.

The [deferred-tool model](https://github.com/OpenRouterTeam/typescript-sdk/blob/548648e6956bf80260cca35975a83f62e25c0f0d/src/models/deferredtoolscontrol.ts) encodes a versioned portable profile and runtime validation mode and documents stable catalog/reasoning continuation. Those comments are router-contract claims, not a local enforcement implementation. The [namespace model](https://github.com/OpenRouterTeam/typescript-sdk/blob/548648e6956bf80260cca35975a83f62e25c0f0d/src/models/namespacefunctiontool.ts) preserves async, deferred-loading, caller and output-schema fields while documenting that async remains client-executed and provider-dependent.

The generated Zod boundaries validate outer shapes, but parameters/output_schema use arbitrary values and computer-use dimensions in [the configuration model](https://github.com/OpenRouterTeam/typescript-sdk/blob/548648e6956bf80260cca35975a83f62e25c0f0d/src/models/computeruseservertool.ts) are integers without positive/max bounds. Open enums retain forward-compatible values, which Teamagent must explicitly classify as unsupported before executing capabilities. Adapt field-preserving translation and continuation identity behind our narrower Effect Schema plus authorization/size rules; do not infer server support or tool safety from schema availability. No SDK invocation, tool execution or tests were run.

<!-- teamagent-analysis:start -->
Analysis metadata: source [openrouter-typescript-sdk](https://github.com/OpenRouterTeam/typescript-sdk); analyzed commit `548648e6956bf80260cca35975a83f62e25c0f0d`; commit date 2026-10-27T17:45:32Z; review date 2026-10-28T09:45:33.667Z; depth screened. [Maintenance record](../analyses/repos/ai-agents-proxy--openrouter-typescript-sdk.md).
<!-- teamagent-analysis:end -->
