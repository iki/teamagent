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

## Source update reviewed 2026-10-28

Reviewed commit: [`1817a54ddc2a43786412bf0fb7802868f19d35e1`](https://github.com/OpenRouterTeam/go-sdk/commit/1817a54ddc2a43786412bf0fb7802868f19d35e1). Scope: Full generated deferred-tool and computer-use model files read. Serializer utility, tool-search unions, transport and example requests were not audited.

The [deferred-tool model](https://github.com/OpenRouterTeam/go-sdk/blob/1817a54ddc2a43786412bf0fb7802868f19d35e1/models/components/deferredtoolscontrol.go) rejects unknown profile/protocol/validation strings during enum JSON decoding and exposes router search strategies. Go string aliases can still be directly constructed, and this file provides no corresponding outbound semantic validator; a declared runtime-validation mode is not evidence of executed server validation. Stable catalog and continuation requirements belong in an adapter contract with tests.

The [computer-use model](https://github.com/OpenRouterTeam/go-sdk/blob/1817a54ddc2a43786412bf0fb7802868f19d35e1/models/components/computeruseservertool.go) preserves unknown environment strings via an explicit IsExact check, but stores dimensions as unconstrained int64 values and delegates JSON handling to an unread utility. Nil getters return zero/empty values, which must not collapse missing configuration into a valid display. Adapt explicit unsupported-enum handling and missing-value semantics; do not select the SDK or trust provider capability based on generated fields. No network, computer-use action, SDK example or tests were executed.

## Follow-up change review — 2026-10-28

**Generated route options describe transport shape, not route eligibility.** Reviewed commit `3b873ba1a1286a8c604b36ec0e409e4e7e257b57` (commit date `2026-10-28T08:58:35Z`), compared with `1817a54ddc2a43786412bf0fb7802868f19d35e1`. The complete no-rename Git path inventory contains 1,282 changed paths. The aggregate diff exceeded the 8 MiB capture bound; the selected files were expanded separately, and no completeness claim is made for that diff.

The target revision's image-generation preferences include a permissive Primalabs map and generated getter. The same generated schema documents fallback as enabled by default and represents account-merged allow/ignore lists and arbitrary provider options. These are serialized provider preferences, not authenticated evidence of model access, non-training coverage or commercial terms. The changed-path inventory confirms this generated file changed; the capped aggregate diff does not establish that every contextual field was newly introduced.

Evidence: [models/components/imagegenerationproviderpreferences.go:285-310](https://github.com/OpenRouterTeam/go-sdk/blob/3b873ba1a1286a8c604b36ec0e409e4e7e257b57/models/components/imagegenerationproviderpreferences.go#L285-L310) · [models/components/imagegenerationproviderpreferences.go:1089-1094](https://github.com/OpenRouterTeam/go-sdk/blob/3b873ba1a1286a8c604b36ec0e409e4e7e257b57/models/components/imagegenerationproviderpreferences.go#L1089-L1094) · [models/components/imagegenerationproviderpreferences.go:1576-1595](https://github.com/OpenRouterTeam/go-sdk/blob/3b873ba1a1286a8c604b36ec0e409e4e7e257b57/models/components/imagegenerationproviderpreferences.go#L1576-L1595).

**Harness consequence:** Evaluate effective account/model/host policy before constructing SDK preferences. Explicitly constrain fallback to eligible routes and retain unknown policy as blocked; generated provider enumeration cannot substitute for a reviewed policy record.

**Scope and limits:** Reviewed complete target-revision preference fields/getter and fallback context in the generated SDK; no network call or full generated release audit was performed. This is a scoped static comparison, not a whole-project correctness or security audit. Upstream tests were read where cited, not run; no upstream code, service, model or provider operation was executed. Historical findings above remain evidence at their own revisions.

<!-- teamagent-analysis:start -->
Analysis metadata: source [openrouter-go-sdk](https://github.com/OpenRouterTeam/go-sdk); analyzed commit `3b873ba1a1286a8c604b36ec0e409e4e7e257b57`; commit date 2026-10-28T08:58:35Z; review date 2026-10-28T14:52:35.205Z; depth screened. [Maintenance record](../analyses/repos/ai-agents-proxy--openrouter-go-sdk.md).
<!-- teamagent-analysis:end -->
