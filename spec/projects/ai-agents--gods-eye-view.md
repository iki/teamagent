# gods-eye-view

Source: [gods-eye-view](https://github.com/bilawalsidhu/gods-eye-view) · Category: [ai-agents](../categories/ai-agents.md)

Original review depth: **inventory / README screening only**. The dated update review below has its own explicit scope. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `aa16b7c3b0166a89d8c7a6089e0aff53a22faaee`; commit timestamp `2026-10-02T22:36:12-07:00`; 1,660 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/bilawalsidhu/gods-eye-view/blob/aa16b7c3b0166a89d8c7a6089e0aff53a22faaee/README.md)):

> [](https://github.com/bilawalsidhu/gods-eye-view/actions/workflows/ci.yml) [](https://x.com/bilawalsidhu/status/2093798887815348521) Photorealistic 3D globe. Live aircraft, ships, satellites, earthquakes, traffic, and public cameras. Hands-free voice control powered by a realtime AI agent.

Build/package evidence: [package.json](https://github.com/bilawalsidhu/gods-eye-view/blob/aa16b7c3b0166a89d8c7a6089e0aff53a22faaee/package.json); [pinokio/package.json](https://github.com/bilawalsidhu/gods-eye-view/blob/aa16b7c3b0166a89d8c7a6089e0aff53a22faaee/pinokio/package.json)

License evidence: [LICENSE](https://github.com/bilawalsidhu/gods-eye-view/blob/aa16b7c3b0166a89d8c7a6089e0aff53a22faaee/LICENSE) Classification hint: MIT. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents**. Its category places it in the candidate set for agents, models, channels; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [models](../models.md) · [channels](../channels.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

## 2026-10-28 scoped update review

Reviewed commit `15de9d738c4a85be1a96726c6114181caef87eeb` (commit date `2026-10-26T16:54:01-07:00`). The original snapshot above remains historical evidence.

**Scope:** Complete tool schema subset, catalog composition/dispatch and application tool-lifetime composition; voice/MCP transport authorization, service implementations, rendering cleanup internals and tests were not inspected.

The [tool catalog](https://github.com/bilawalsidhu/gods-eye-view/blob/15de9d738c4a85be1a96726c6114181caef87eeb/src/tools/catalog.js#L141-L227) rejects duplicate names unless explicitly replaceable, filters tools with missing services and routes nested calls back through the same interceptor chain with their parent tool name. Arguments are validated before the tool implementation runs. This is a useful shared dispatch seam for voice and MCP, but catalog visibility metadata is not enforced by this function, and callers may override the derived read-only annotation. Authorization therefore belongs in a trusted transport/interceptor policy, not in descriptive hints or service presence.

The [schema subset](https://github.com/bilawalsidhu/gods-eye-view/blob/15de9d738c4a85be1a96726c6114181caef87eeb/src/tools/schema.js#L36-L151) refuses unsupported keywords/types and schema-valued additionalProperties, uses own-property checks, rejects nonfinite numbers and bounds code-point counting once string constraints are decided. Its schema checker does not validate every keyword's type or cross-field meaning; recursive value traversal and pattern evaluation still need resource budgets. Tool definitions clone schemas but do not deeply freeze the clone exposed by catalog getters. Execution checks an abort signal at entry and passes it onward, while neither nested recursion nor effect settlement is centrally bounded here. Output checks establish only a minimal summary/data/image envelope.

[Application composition](https://github.com/bilawalsidhu/gods-eye-view/blob/15de9d738c4a85be1a96726c6114181caef87eeb/src/app/tools.js#L44-L211) registers scene tools, imported geo-data, pointer interactions, voice controls and event listeners with application-lifetime cleanup. Debug globals are removed only when they still refer to the same instance, avoiding deletion of a replacement's handle. Hidden-state rendering suspension also applies immediately at startup. These are useful ownership patterns, although the deferred-cleanup executor, disposal implementations and actual browser/GPU behavior were not exercised.

**Verification limit:** source inspection only; no upstream tests or provider calls were executed. This scoped review does not certify every file in the repository.

<!-- teamagent-analysis:start -->
Analysis metadata: source [gods-eye-view](https://github.com/bilawalsidhu/gods-eye-view); analyzed commit `15de9d738c4a85be1a96726c6114181caef87eeb`; commit date 2026-10-26T16:54:01-07:00; review date 2026-10-28T08:47:42.123Z; depth screened. [Maintenance record](../analyses/repos/ai-agents--gods-eye-view.md).
<!-- teamagent-analysis:end -->
