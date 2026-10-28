# gbrain

Source: [gbrain](https://github.com/garrytan/gbrain) · Category: [ai-agents-mem](../categories/ai-agents-mem.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `109b992172e1f49107f9de9841758c1d043a2668`; commit timestamp `2026-10-03T19:41:11Z`; 8,575 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/garrytan/gbrain/blob/109b992172e1f49107f9de9841758c1d043a2668/README.md)):

> Give the agent you already use a memory you control.** GBrain stores explicit facts with their sources, supports corrections and withdrawal, and makes the same memory available across your agents. Start with keyless memory and keyword retrieval; add semantic search, synthesis, and background enrichment when you need them. Keep skills beside knowledge.** New local brains include memory skills in their

Build/package evidence: [admin/package.json](https://github.com/garrytan/gbrain/blob/109b992172e1f49107f9de9841758c1d043a2668/admin/package.json); [package.json](https://github.com/garrytan/gbrain/blob/109b992172e1f49107f9de9841758c1d043a2668/package.json); [recipes/agent-voice/package.json](https://github.com/garrytan/gbrain/blob/109b992172e1f49107f9de9841758c1d043a2668/recipes/agent-voice/package.json); [test/fixtures/guards/check-compile-autoload.sh/bad/package.json](https://github.com/garrytan/gbrain/blob/109b992172e1f49107f9de9841758c1d043a2668/test/fixtures/guards/check-compile-autoload.sh/bad/package.json); [test/fixtures/guards/check-compile-autoload.sh/good/package.json](https://github.com/garrytan/gbrain/blob/109b992172e1f49107f9de9841758c1d043a2668/test/fixtures/guards/check-compile-autoload.sh/good/package.json)

License evidence: [LICENSE](https://github.com/garrytan/gbrain/blob/109b992172e1f49107f9de9841758c1d043a2668/LICENSE) Classification hint: MIT. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents-mem**. Its category places it in the candidate set for memory, evolution; those associations are navigational and have not been individually validated as implemented capabilities. See [memory](../memory.md) · [evolution](../evolution.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.


## Change review - 2026-10-28

**Exact query-vector caching separates from disabled semantic-result availability and request-scoped cost estimates.** Reviewed commit `75c64150d725c0aeceb70446131ff036746959e2` (commit date `2026-10-27T16:34:53Z`). Compared with `109b992172e1f49107f9de9841758c1d043a2668`; the complete Git comparison contains 7848 changed paths.

The process query-embedding cache keys recipe, model, endpoint override, dimensions and exact input; it copies vectors on read/write, caps entries at 512 and rejects a late fill after a generation clear. It does not cache in-flight promises, avoiding shared cancellation, but count/TTL bounds do not bound aggregate key/vector bytes, and this helper relies on callers for validated finite dimensions and vectors.

The semantic-cache module explicitly exposes availability=false until dependencies can be revalidated; its class remains callable and the reviewed scope does not establish every caller obeys that gate. The class filters candidates by source/knobs/TTL/generation, then fetches the winning payload in a second query by ID without rechecking those predicates. It accepts array-shaped/cast JSON without semantic decoding and maps clear/prune failures to zero. These dormant mechanics must not be described as a proven safe cache merely because the first query has guards.

Search cost tracking uses request-local storage, excludes refused calls, counts failed sent calls, labels missing usage as estimated and omits dollar totals if any rate is unknown. This is accounting, not budget reservation; output tokens without provider usage become zero, and the pricing table's accuracy was not verified.

Evidence: [src/core/ai/query-embed-cache.ts:1-50](https://github.com/garrytan/gbrain/blob/75c64150d725c0aeceb70446131ff036746959e2/src/core/ai/query-embed-cache.ts#L1-L50) · [src/core/search/search-cost.ts:1-92](https://github.com/garrytan/gbrain/blob/75c64150d725c0aeceb70446131ff036746959e2/src/core/search/search-cost.ts#L1-L92) · [src/core/search/query-cache.ts:34-35](https://github.com/garrytan/gbrain/blob/75c64150d725c0aeceb70446131ff036746959e2/src/core/search/query-cache.ts#L34-L35) · [src/core/search/query-cache.ts:208-301](https://github.com/garrytan/gbrain/blob/75c64150d725c0aeceb70446131ff036746959e2/src/core/search/query-cache.ts#L208-L301) · [src/core/search/query-cache.ts:381-475](https://github.com/garrytan/gbrain/blob/75c64150d725c0aeceb70446131ff036746959e2/src/core/search/query-cache.ts#L381-L475).

**Harness consequence:** Adopt exact embedding identity, copied cache values and generation fencing, adding tenant/provider authority and aggregate byte limits. Keep result caching unavailable until one consistent read validates all response dependencies and decoded payloads; deletion failures must remain errors. Preserve estimated/unknown cost states and enforce budgets before dispatch independently of metering.

**Scope and limits:** Static scoped cache identity/read path and search-cost review within the 7,848-path comparison. Gateway invalidation call sites, semantic-cache availability callers, generation-gate SQL, provider pricing and full retrieval/authentication were not audited or executed.

<!-- teamagent-analysis:start -->
Analysis metadata: source [gbrain](https://github.com/garrytan/gbrain); analyzed commit `75c64150d725c0aeceb70446131ff036746959e2`; commit date 2026-10-27T16:34:53Z; review date 2026-10-28T09:27:32.685Z; depth screened. [Maintenance record](../analyses/repos/ai-agents-mem--gbrain.md).
<!-- teamagent-analysis:end -->
