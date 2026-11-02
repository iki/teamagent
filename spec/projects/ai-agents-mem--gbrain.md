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

## Follow-up change review — 2026-10-28

**Trust promotion binds approval to the metadata that will actually be promoted.** Reviewed commit `82b7ef601fdfc449b0d242f7e61a4604aa2c8a8e` (commit date `2026-10-28T08:33:05Z`), compared with `75c64150d725c0aeceb70446131ff036746959e2`. The complete no-rename Git path inventory contains 146 changed paths.

An index-existing release now previews and hashes cell fields such as confidence, notability, validity and attribution, alongside existing checks for claim/source/context. The digest travels with the admitted intent and is compared again during preparation. A changed or removed cell produces preview_changed; successfully released rows record fields_previewed. Fixtures check edits before admission and between admission and preparation, requiring the fact to remain held with no published row. The approval callback is optional in the helper signature, so complete authorization still depends on its callers and coordinator.

Evidence: [src/core/trust/release-publish.ts:173-229](https://github.com/garrytan/gbrain/blob/82b7ef601fdfc449b0d242f7e61a4604aa2c8a8e/src/core/trust/release-publish.ts#L173-L229) · [test/trust-release-preview-binding.test.ts:120-168](https://github.com/garrytan/gbrain/blob/82b7ef601fdfc449b0d242f7e61a4604aa2c8a8e/test/trust-release-preview-binding.test.ts#L120-L168).

**Harness consequence:** Bind memory promotion to the entire reviewed claim and metadata snapshot, then revalidate at publication. Record what was actually approved and keep stale approvals from silently promoting newer content.

**Scope and limits:** Reviewed release-publish changes and selected preview-binding fixtures; the full persistence coordinator and all callers were not re-audited. This is a scoped static comparison, not a whole-project correctness or security audit. Upstream tests were read where cited, not run; no upstream code, service, model or provider operation was executed. Historical findings above remain evidence at their own revisions.

## Change review — 2026-11-01

Reviewed `1e763e28cb76655891096334d03f0883356c3ae8` (2026-11-01T08:27:16Z) against `82b7ef601fdfc449b0d242f7e61a4604aa2c8a8e`; 938 changed paths. Scoped retrieval diffs add request-local private-readable source sets using AsyncLocalStorage, rejecting the whole set if any source ID is invalid. SQL visibility widens only for that context, with pinned-question exceptions; ordinary request source filters or federation are explicitly not equivalent authority. The dispatcher establishing those grants was not audited here. [Visibility](https://github.com/garrytan/gbrain/blob/1e763e28cb76655891096334d03f0883356c3ae8/src/core/search/private-visibility.ts), [read predicates](https://github.com/garrytan/gbrain/blob/1e763e28cb76655891096334d03f0883356c3ae8/src/core/search/read-policy-sql.ts).

Evidence delivery now stamps trust, neutralizes transcript rows, redacts and counts quote fences inside packing budgets before final fencing; explicit title-header metadata accompanies date headers. This ordering is useful for preventing untrusted evidence from being represented as instructions while retaining honest token accounting. It does not by itself prove every retrieval arm applies the policy. The two inspected test diffs only adapt fixture writes to owner context, so they supply no new independent coverage of these grant/fence boundaries. [Delivery](https://github.com/garrytan/gbrain/blob/1e763e28cb76655891096334d03f0883356c3ae8/src/core/search/evidence-delivery.ts), [redaction fixture delta](https://github.com/garrytan/gbrain/blob/1e763e28cb76655891096334d03f0883356c3ae8/test/retrieval-op-redaction.test.ts). Five paths reviewed; no database, MCP request or upstream tests executed.

## External-update review - 2026-11-01

Reviewed `da6abab69d4fe08c1f2244f7dcba3b590d52c630` against `1e763e28cb76655891096334d03f0883356c3ae8`.

The 93-path range adds an explicit [missing-owner-marker refusal](https://github.com/garrytan/gbrain/blob/da6abab69d4fe08c1f2244f7dcba3b590d52c630/src/core/persistence/owner-marker.ts). The [physical-root check](https://github.com/garrytan/gbrain/blob/da6abab69d4fe08c1f2244f7dcba3b590d52c630/src/core/persistence/physical-root-record.ts) distinguishes loss of the marker only when the external reservation still matches device, inode and exact birth time; other identity mismatches retain the generic refusal. Repair is a host-admin prepare/accept self-transfer carrying expected state, epoch and manifest, not an automatic recreated marker.

The [consumer](https://github.com/garrytan/gbrain/blob/da6abab69d4fe08c1f2244f7dcba3b590d52c630/src/core/persistence/consumer.ts) settles deterministic ownership failures for still-owned, unpublished group members, releasing their outstanding-request slots. It leaves moved claims and records with publication/recovery state to their actual owner, and treats transient connection loss separately. The inspected [write-cap fixtures](https://github.com/garrytan/gbrain/blob/da6abab69d4fe08c1f2244f7dcba3b590d52c630/test/write-cap-wedge-8368.test.ts) exercise marker restoration, mismatched ownership, changed claims and capacity starvation; they are source evidence, not locally executed results. The [background fixture](https://github.com/garrytan/gbrain/blob/da6abab69d4fe08c1f2244f7dcba3b590d52c630/test/background-owner-verification.test.ts) explicitly shows that a cached admission decision can outlive marker deletion, so publication checks must still refuse the write.

**Harness consequence:** A deterministic pre-publication refusal must settle owned work rather than retry forever and consume capacity. Preserve physical identity and explicit administrative repair, and recheck ownership at publication even after earlier admission. Reviewed the marker, physical-root, consumer, terminal classifier, no-op settlement and selected fixture deltas; the remaining persistence, search-privacy and capacity-admission changes were not fully audited. No database, ownership transfer, upstream test or daemon was run.

<!-- teamagent-analysis:start -->
Analysis metadata: source [gbrain](https://github.com/garrytan/gbrain); analyzed commit `da6abab69d4fe08c1f2244f7dcba3b590d52c630`; commit date 2026-11-01T16:54:50Z; review date 2026-11-01T23:12:06.798Z; depth screened. [Maintenance record](../analyses/repos/ai-agents-mem--gbrain.md).
<!-- teamagent-analysis:end -->
