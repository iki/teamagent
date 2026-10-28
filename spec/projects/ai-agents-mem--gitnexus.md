# gitnexus

Structured code ingestion with optional graph phases and hybrid symbol/document retrieval.

Source: [gitnexus](https://github.com/abhigyanpatwari/GitNexus) · Snapshot: `5f9f95f22454b1f878ca549bc38b4c2ef5066b9a` · Category: `ai-agents-mem`.

Evidence level: **Source-reviewed; code was read, not executed or benchmarked.** Review date: 2026-10-04. Conclusions below apply to the inspected snapshot, not an unverified latest release. License and dependency compatibility require the separate catalog/license review before adoption.

## Verified source evidence

- [gitnexus/src/core/ingestion/pipeline.ts:318-370](https://github.com/abhigyanpatwari/GitNexus/blob/5f9f95f22454b1f878ca549bc38b4c2ef5066b9a/gitnexus/src/core/ingestion/pipeline.ts#L318-L370)
- [gitnexus/src/core/search/hybrid-search.ts:158-192](https://github.com/abhigyanpatwari/GitNexus/blob/5f9f95f22454b1f878ca549bc38b4c2ef5066b9a/gitnexus/src/core/search/hybrid-search.ts#L158-L192)

The ingestion registry orders scan, structure, configuration, Markdown, parsing, routes, tools, ORM, cross-file and scope-resolution phases, followed by additional language/framework phases. Taint and call summaries are explicitly gated by a PDG option; communities and process derivation can be skipped independently. The hybrid search function runs LadybugDB full-text retrieval and an injected semantic retriever concurrently, then merges through reciprocal-rank fusion. Both branches catch errors and return empty lists, allowing degraded operation.

## Harness implications

Represent code with several complementary views: literal text for exact symbols, syntax declarations for navigation, dependency/call relations for impact, and embeddings for conceptual discovery. The phase registry is preferable to a monolithic parser because language support and expensive analyses can be selected per repository. Preserve commit identity and symbol ranges with every graph record. Retrieval should identify whether a result came from lexical, semantic or structural evidence.

## Limitations and tradeoffs

A code graph is an approximation of actual execution: reflection, dynamic imports, generated code, macros and incomplete language support can hide dependencies. Optional PDG phases do not mean every graph contains precise dataflow. In the inspected hybrid path, failures are swallowed into empty arms; the harness must surface degradation rather than interpreting empty results as authoritative absence. The source review does not prove the correctness of all framework-specific phases or end-to-end index freshness.

## Adoption and validation

Pilot as an optional code-intelligence adapter, with plain file search and language-server references as controls. Use it to suggest impact neighborhoods, then read authoritative source before editing. Acceptance tasks should include renamed symbols, stale commits, multi-language workspaces, generated files, dynamic calls and unavailable FTS. Measure patch success and missed affected tests, not just search relevance.

Related directions: [memory](../memory.md) · [import-generation](../import-generation.md) · [agents](../agents.md).


## Change review - 2026-10-28

**Parser identities and persisted-shard receipts strengthen cache coherence while publication retains a crash window.** Reviewed commit `bad2422aa1bd6473e4cbb4da15873090944b67d6` (commit date `2026-10-27T16:46:58Z`). Compared with `5f9f95f22454b1f878ca549bc38b4c2ef5066b9a`; the complete Git comparison contains 2873 changed paths.

Chunk keys now frame sorted path/content-hash pairs with the resolved base parser identity and optional PDG identity/resolved function-line cap. This avoids delimiter ambiguity and prevents parser changes from silently replaying foreign shards. Sharded loads validate the base identity and key grammar; cache publication includes only successfully written/copied shards, chooses staged repairs over live copies and returns the exact written key set for durable ParsedFile pruning. The inspected loader still casts array-shaped V8/legacy values instead of deeply validating parser payloads.

Publication removes a fixed .tmp directory, writes a generation, removes the live directory and then renames the replacement. The source explicitly acknowledges a gap with no live cache; no writer lock or crash-atomic swap appears in this function. Hybrid search now awaits both keyword and semantic lanes with allSettled before propagating symbol-identity corruption, preventing a sibling query from outliving the shared database session. Other lane failures still become empty results, leaving degraded coverage implicit in the returned merged list.

Evidence: [gitnexus/src/storage/parse-cache.ts:180-306](https://github.com/abhigyanpatwari/GitNexus/blob/bad2422aa1bd6473e4cbb4da15873090944b67d6/gitnexus/src/storage/parse-cache.ts#L180-L306) · [gitnexus/src/storage/parse-cache.ts:385-532](https://github.com/abhigyanpatwari/GitNexus/blob/bad2422aa1bd6473e4cbb4da15873090944b67d6/gitnexus/src/storage/parse-cache.ts#L385-L532) · [gitnexus/src/core/search/hybrid-search.ts:170-201](https://github.com/abhigyanpatwari/GitNexus/blob/bad2422aa1bd6473e4cbb4da15873090944b67d6/gitnexus/src/core/search/hybrid-search.ts#L170-L201).

**Harness consequence:** Bind cache entries to actual parser/grammar/options identity and publish an exact successful-shard manifest shared by related stores. Validate cached dynamic values, serialize publication and retain the previous generation until replacement is durably committed. Drain sibling retrieval work before closing shared resources, while reporting unavailable lanes separately from a genuine empty result.

**Scope and limits:** Static scoped parser-cache identity/publication and hybrid-search failure-lifetime review within the 2,873-path comparison. Parser-identity resolver, V8 sidecar integrity, full generation orchestrator, embeddings and graph correctness were not audited or executed.

## Follow-up change review — 2026-10-28

**Unknown export semantics preserve conservative impact coverage.** Reviewed commit `51ce19d77abe86978e34d89dd77188c4dba3ba53` (commit date `2026-10-28T08:09:10Z`), compared with `bad2422aa1bd6473e4cbb4da15873090944b67d6`. The complete no-rename Git path inventory contains 16 changed paths.

The new file-private classifier declines certification for missing/truncated source, flattened line comments, declaration files, parse errors, CommonJS, ambient declarations, alias exports and type aliases. It only certifies visible module semantics; a parsing exception returns false. The fixture matrix covers those cases plus JS/TS/JSX/TSX modules. Thus a failed proof of privacy can retain the wider file seed instead of removing possibly affected code from impact analysis.

Evidence: [gitnexus/src/core/ingestion/languages/typescript/file-private-exports.ts:1-45](https://github.com/abhigyanpatwari/GitNexus/blob/51ce19d77abe86978e34d89dd77188c4dba3ba53/gitnexus/src/core/ingestion/languages/typescript/file-private-exports.ts#L1-L45) · [gitnexus/test/unit/file-private-exports.test.ts:4-53](https://github.com/abhigyanpatwari/GitNexus/blob/51ce19d77abe86978e34d89dd77188c4dba3ba53/gitnexus/test/unit/file-private-exports.test.ts#L4-L53).

**Harness consequence:** Narrow graph traversal only on positive semantic evidence. Retain conservative candidates when extraction is incomplete, and expose the reason for widened impact scope.

**Scope and limits:** Reviewed the new classifier and its fixture matrix; overall impact traversal, dependency updates and logger changes were not re-audited. This is a scoped static comparison, not a whole-project correctness or security audit. Upstream tests were read where cited, not run; no upstream code, service, model or provider operation was executed. Historical findings above remain evidence at their own revisions.

<!-- teamagent-analysis:start -->
Analysis metadata: source [gitnexus](https://github.com/abhigyanpatwari/GitNexus); analyzed commit `51ce19d77abe86978e34d89dd77188c4dba3ba53`; commit date 2026-10-28T08:09:10Z; review date 2026-10-28T14:52:35.205Z; depth source-reviewed. [Maintenance record](../analyses/repos/ai-agents-mem--gitnexus.md).
<!-- teamagent-analysis:end -->
