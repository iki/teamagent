# fokosdb

Source: [fokosdb](https://github.com/lambrospetrou/fokosdb) · Category: [ai-agents-mem](../categories/ai-agents-mem.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `01c82a26189c545a7ef75d07ebdf35f20d074a55`; commit timestamp `2026-10-03T21:35:09+01:00`; 359 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/lambrospetrou/fokosdb/blob/01c82a26189c545a7ef75d07ebdf35f20d074a55/README.md)):

> FokosDB: A strongly consistent bottomless storage database ontop of Cloudflare Durable Objects Read the article introducing FokosDB and explaining the reasoning behind its architecture:

Build/package evidence: [examples/http-api/package.json](https://github.com/lambrospetrou/fokosdb/blob/01c82a26189c545a7ef75d07ebdf35f20d074a55/examples/http-api/package.json); [examples/typed-keys/package.json](https://github.com/lambrospetrou/fokosdb/blob/01c82a26189c545a7ef75d07ebdf35f20d074a55/examples/typed-keys/package.json); [package.json](https://github.com/lambrospetrou/fokosdb/blob/01c82a26189c545a7ef75d07ebdf35f20d074a55/package.json); [packages/fokosdb/package.json](https://github.com/lambrospetrou/fokosdb/blob/01c82a26189c545a7ef75d07ebdf35f20d074a55/packages/fokosdb/package.json)

License evidence: [LICENSE](https://github.com/lambrospetrou/fokosdb/blob/01c82a26189c545a7ef75d07ebdf35f20d074a55/LICENSE) Classification hint: MIT. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents-mem**. Its category places it in the candidate set for memory, evolution; those associations are navigational and have not been individually validated as implemented capabilities. See [memory](../memory.md) · [evolution](../evolution.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.


## Change review - 2026-10-28

**Materialization positions protect lagging consumers and topology fallback distinguishes pre-handler misses.** Reviewed commit `bc71c29c6d7fe33e219b8f019219491019ac7964` (commit date `2026-10-26T14:57:46Z`). Compared with `01c82a26189c545a7ef75d07ebdf35f20d074a55`; the complete Git comparison contains 288 changed paths.

The materialization store retains latest images/tombstones plus change positions tied to each target's committed cursor and in-flight read position. It reuses or moves a newest position only when consumers will still observe the new image; fixtures exercise lagging consumers, in-flight batches and cursors beyond cleaned positions. Producer epochs only increase. Cleanup bounds include promotion snapshots, and tombstone deletion refuses remaining retry/violation rows or index keys.

These primitives rely on callers: putLatestImage's SQL overwrites revision without a newer-than predicate, its comment assumes an already accepted image, and deleteTombstone delegates the all-targets-have-read check. TransactionSync is exposed but those multi-statement helpers do not open their own transaction. Thus the store alone does not establish stale-write rejection or atomic cleanup. The sharding client uses cached topology for deeper entry, falls back only on designated pre-handler missing/awaiting-data errors and limits topology fallback before returning to root. Ordinary operation retries remain caller policy, preserving the distinction between routing miss and uncertain execution; this layer has no independent overall deadline.

Evidence: [packages/fokosdb/src/server/materialization/materialization-store.ts:221-374](https://github.com/lambrospetrou/fokosdb/blob/bc71c29c6d7fe33e219b8f019219491019ac7964/packages/fokosdb/src/server/materialization/materialization-store.ts#L221-L374) · [packages/fokosdb/src/server/materialization/materialization-store.ts:735-810](https://github.com/lambrospetrou/fokosdb/blob/bc71c29c6d7fe33e219b8f019219491019ac7964/packages/fokosdb/src/server/materialization/materialization-store.ts#L735-L810) · [packages/fokosdb/src/server/materialization/materialization-store.test.ts:1-116](https://github.com/lambrospetrou/fokosdb/blob/bc71c29c6d7fe33e219b8f019219491019ac7964/packages/fokosdb/src/server/materialization/materialization-store.test.ts#L1-L116) · [packages/fokosdb/src/sharding/client.ts:93-228](https://github.com/lambrospetrou/fokosdb/blob/bc71c29c6d7fe33e219b8f019219491019ac7964/packages/fokosdb/src/sharding/client.ts#L93-L228) · [packages/fokosdb/src/sharding/client.ts:280-334](https://github.com/lambrospetrou/fokosdb/blob/bc71c29c6d7fe33e219b8f019219491019ac7964/packages/fokosdb/src/sharding/client.ts#L280-L334).

**Harness consequence:** Reuse explicit cursor/read positions and monotone producer generations for derived-index delivery, but enforce admission, revision comparison, transaction ownership and tombstone retention in one reviewed boundary. Keep routing hints advisory and permit transparent replay only for verified pre-effect failures; give caller retries a hard time/attempt budget and record routing cost. Run actual Durable Object restart/migration tests before adopting distributed consistency claims.

**Scope and limits:** Static scoped review of new materialization primitives, selected Cloudflare fixture bodies and topology-routing changes within the 288-path comparison. Ingest caller validation, transaction orchestration, topology cache codec, complete migration protocol and real workerd behavior were not fully audited or executed.

## Follow-up change review — 2026-10-28

**Topology cache identity includes the source scope, not only the shard group.** Reviewed commit `3ec80287b0b30251245c72212e0de2b23b9bf9d1` (commit date `2026-10-27T23:06:49Z`), compared with `bc71c29c6d7fe33e219b8f019219491019ac7964`. The complete no-rename Git path inventory contains 27 changed paths.

Hash and range cache keys now include a JSON-encoded scope, representing the admin binding/jurisdiction that supplies topology. The WeakMap memo also checks scope when the same topology object is reused. A fixture gives two explicit scopes and the default scope different versions and verifies six independent hash/range fetches. The option remains optional, so callers that omit distinct ownership scopes still share the default namespace.

Evidence: [packages/fokosdb/src/sharding/topology-cache.ts:27-39](https://github.com/lambrospetrou/fokosdb/blob/3ec80287b0b30251245c72212e0de2b23b9bf9d1/packages/fokosdb/src/sharding/topology-cache.ts#L27-L39) · [packages/fokosdb/src/sharding/topology-cache.ts:90-139](https://github.com/lambrospetrou/fokosdb/blob/3ec80287b0b30251245c72212e0de2b23b9bf9d1/packages/fokosdb/src/sharding/topology-cache.ts#L90-L139) · [packages/fokosdb/src/sharding/topology-cache.test.ts:213-241](https://github.com/lambrospetrou/fokosdb/blob/3ec80287b0b30251245c72212e0de2b23b9bf9d1/packages/fokosdb/src/sharding/topology-cache.test.ts#L213-L241).

**Harness consequence:** Include tenant, backend/account and deployment boundary in cache identity. Make required scope explicit at the Teamagent adapter boundary; a source-level optional string is not an authorization mechanism.

**Scope and limits:** Reviewed topology key construction and scope-separation fixtures; the separate materialization-target changes were not audited. This is a scoped static comparison, not a whole-project correctness or security audit. Upstream tests were read where cited, not run; no upstream code, service, model or provider operation was executed. Historical findings above remain evidence at their own revisions.

## Change review - 2026-11-01

Reviewed `4629dc71f52887bcd5702c1fcb3f5d8cdc9526fd` against `3ec80287b0b30251245c72212e0de2b23b9bf9d1` (41 changed paths). The [partition implementation](https://github.com/lambrospetrou/fokosdb/blob/4629dc71f52887bcd5702c1fcb3f5d8cdc9526fd/packages/fokosdb/src/server/do-partition.ts) retains initialization failure as state and rejects guarded work with a typed initialization error, while leaving diagnostic status and destruction available. Its alarm path schedules a later alarm while initialization remains failed; the shown path does not rerun migration or clear that error in the same instance. Scheduling is consequently not evidence of repair. Inspected initial [failure fixtures](https://github.com/lambrospetrou/fokosdb/blob/4629dc71f52887bcd5702c1fcb3f5d8cdc9526fd/packages/fokosdb/test/partition-do/init-failure.test.ts) poison schema state separately from an aborting call and exercise degraded operation.

**Harness consequence:** Keep failed resources inspectable without admitting normal work; record retry scheduling separately from successful recovery. Destruction still needs independent authority and preserved evidence. Avoid exposing raw initialization exceptions in general diagnostics.

**Scope and limits:** Selected partition diff and initial fixture portion only; no workerd/Durable Object execution or database repair was performed, and broader namespace changes were not audited.

<!-- teamagent-analysis:start -->
Analysis metadata: source [fokosdb](https://github.com/lambrospetrou/fokosdb); analyzed commit `4629dc71f52887bcd5702c1fcb3f5d8cdc9526fd`; commit date 2026-11-01T02:02:07Z; review date 2026-11-01T11:35:43.470Z; depth screened. [Maintenance record](../analyses/repos/ai-agents-mem--fokosdb.md).
<!-- teamagent-analysis:end -->
