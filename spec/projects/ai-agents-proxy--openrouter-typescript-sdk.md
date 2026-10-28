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

## Follow-up change review — 2026-10-28

**Configuration updates and provider options remain transport contracts, not policy evidence.** Reviewed commit `85fb336750bdf75cece817ee5facc282bae2ea8d` (commit date `2026-10-28T08:52:57Z`), compared with `548648e6956bf80260cca35975a83f62e25c0f0d`. The complete no-rename Git path inventory contains 33 changed paths.

The generated SDK adds a ConfigurationUpdate object with a required reasoning setting and outbound Zod serialization. Its comment claims a mid-conversation reasoning change can preserve preceding prompt cache entries; this review did not verify that service behavior. Image-generation options also add primalabs with arbitrary values. Neither declaration authenticates account eligibility or establishes a provider data-use exclusion.

Evidence: [src/models/configurationupdate.ts:1-42](https://github.com/OpenRouterTeam/typescript-sdk/blob/85fb336750bdf75cece817ee5facc282bae2ea8d/src/models/configurationupdate.ts#L1-L42) · [src/models/imagegenerationproviderpreferences.ts:123-135](https://github.com/OpenRouterTeam/typescript-sdk/blob/85fb336750bdf75cece817ee5facc282bae2ea8d/src/models/imagegenerationproviderpreferences.ts#L123-L135) · [src/models/imagegenerationproviderpreferences.ts:513-527](https://github.com/OpenRouterTeam/typescript-sdk/blob/85fb336750bdf75cece817ee5facc282bae2ea8d/src/models/imagegenerationproviderpreferences.ts#L513-L527).

**Harness consequence:** Keep per-turn reasoning configuration in trace provenance and evaluate effective policy for every selected provider/model route. Validate provider-specific option values before invoking permissive generated SDK schemas.

**Scope and limits:** Reviewed the new configuration-update source and image-provider option delta; actual cache behavior and service support were not measured. This is a scoped static comparison, not a whole-project correctness or security audit. Upstream tests were read where cited, not run; no upstream code, service, model or provider operation was executed. Historical findings above remain evidence at their own revisions.

<!-- teamagent-analysis:start -->
Analysis metadata: source [openrouter-typescript-sdk](https://github.com/OpenRouterTeam/typescript-sdk); analyzed commit `85fb336750bdf75cece817ee5facc282bae2ea8d`; commit date 2026-10-28T08:52:57Z; review date 2026-10-28T14:52:35.205Z; depth screened. [Maintenance record](../analyses/repos/ai-agents-proxy--openrouter-typescript-sdk.md).
<!-- teamagent-analysis:end -->
