# open-viking

Central context assembly with quotas, deduplication, tiered detail and bounded materialization.

Source: [open-viking](https://github.com/volcengine/OpenViking) · Snapshot: `9d9bc85e1f6a15afa7f23b0d7bf114a7c61cad14` · Category: `ai-agents-mem`.

Evidence level: **Source-reviewed; code was read, not executed or benchmarked.** Review date: 2026-10-04. Conclusions below apply to the inspected snapshot, not an unverified latest release. License and dependency compatibility require the separate catalog/license review before adoption.

## Verified source evidence

- [openviking/retrieve/context_assembler/pipeline.py:54-170](https://github.com/volcengine/OpenViking/blob/9d9bc85e1f6a15afa7f23b0d7bf114a7c61cad14/openviking/retrieve/context_assembler/pipeline.py#L54-L170)

The assembly path validates request options, normalizes quotas and penalties, optionally loads a session for query expansion or turn-based deduplication, and obtains an account-scoped planner when needed. It loads a recall ledger and excludes cooled-down URIs. Candidate fan-out runs inside a request-scoped embedding cache. After retrieval, it prefetches bodies only when the planned detail tier needs them, computes a per-entry cap from the overall token budget, plans entries and renders the result. Optional rewriting is separately enabled and account-resolved.

## Harness implications

This is a strong reference for the harness context compiler: retrieval, selection, body loading and rendering are different operations. Compile a task-specific packet with category quotas, source identities, selected detail level and exact token accounting. Keep a ledger of recently supplied resources to avoid repeatedly spending context on unchanged content. Share in-flight embeddings for identical request-local queries. Skills, episodic notes and reference documents can use one assembly interface while retaining different trust and permission semantics.

## Limitations and tradeoffs

A deduplication cooldown can hide information still needed after compaction or a model switch, so reuse decisions must consider what the current model actually received. Detail degradation and rewritten digests can omit critical constraints. Query planner availability depends on account configuration, and the code distinguishes some unavailable-planner failures from normal operation. This review establishes the assembly mechanics, not all storage isolation, resource import or learning guarantees advertised by the project.

## Adoption and validation

Borrow the context-assembly boundary even if the underlying stores differ. Make the selected evidence manifest inspectable and preserve a route back to full source. Start with deterministic tier selection and optional rewriting. Test small token budgets, repeated turns, model changes, ambiguous intent, planner failure, oversized abstracts and permission changes between candidate retrieval and body fetch.

Related directions: [memory](../memory.md) · [skills](../skills.md) · [evolution](../evolution.md) · [models](../models.md).


## Change review - 2026-10-28

**Context assembly records planner status and served-source dedup but model relevance remains advisory.** Reviewed commit `54d4c0fac91fae976325ebed618d7278ff9b5c77` (commit date `2026-10-27T22:31:53+08:00`). Compared with `9d9bc85e1f6a15afa7f23b0d7bf114a7c61cad14`; the complete Git comparison contains 1995 changed paths.

Context assembly resolves account-owned expansion/rewrite planners, retains expansion/rewrite usage/status, reads bodies only for planned tiers and shares a request-scoped query embedding cache across fan-out. If the rewrite declares no_relevant it blanks rendered text and does not cool those URIs in the recall ledger, avoiding dedup suppression of unseen memory. The result still returns plan.entries, so consumers must distinguish selected entries from actually served context. Session/reranker failures degrade through logs, and planner relevance is not an authorization or factual-coverage decision.

ZIP parsing delegates to safe_extract_zip and DirectoryParser, preserves extraction-temp ownership for the tree builder and filters metadata entries when choosing a root. The shown adapter provides no independent aggregate expansion/depth budget. Extraction runs in a background thread, while cleanup catches Exception rather than cancellation's BaseException path; cancellation can leave work/temp ownership unresolved unless the caller joins it. RetryEmbedder refuses double wrapping and keeps one concrete provider target, but total deadlines and retry classification remain delegated to retry helpers.

Evidence: [openviking/retrieve/context_assembler/pipeline.py:42-243](https://github.com/volcengine/OpenViking/blob/54d4c0fac91fae976325ebed618d7278ff9b5c77/openviking/retrieve/context_assembler/pipeline.py#L42-L243) · [openviking/parse/parsers/zip_parser.py:50-148](https://github.com/volcengine/OpenViking/blob/54d4c0fac91fae976325ebed618d7278ff9b5c77/openviking/parse/parsers/zip_parser.py#L50-L148) · [openviking/models/embedder/retry_embedder.py:14-58](https://github.com/volcengine/OpenViking/blob/54d4c0fac91fae976325ebed618d7278ff9b5c77/openviking/models/embedder/retry_embedder.py#L14-L58).

**Harness consequence:** Preserve selected/served source manifests and explicit degraded planner/session status; a model no-relevant verdict must not erase evidence availability. Require account-scoped retrieval/rewrites and independently bounded fan-out. Archive expansion needs joined cancellation-safe temp leases, aggregate byte/entry/nesting limits and exact source identity. Keep retry policy owned once per target with a total request deadline.

**Scope and limits:** Static scoped context orchestration, ZIP adapter and embedding retry wrapper within the 1,995-path comparison. Gather/budget/render helpers, safe ZIP extraction, directory recursion, retry algorithms and OAuth enforcement were not fully audited or executed.

## Follow-up change review — 2026-10-28

**Interactive embeddings bypass the ingestion semaphore, so global admission must remain separate.** Reviewed commit `a8e334c31c9df168983e6bd72422a3c8431715b3` (commit date `2026-10-28T17:53:09+08:00`), compared with `54d4c0fac91fae976325ebed618d7278ff9b5c77`. The complete no-rename Git path inventory contains 125 changed paths.

Async embedding calls now acquire the account/global semaphore only when is_query is false. The finally block releases only an acquired permit. Retry fixtures exercise both query and document calls, ensure cancellation preserves permit counts, and show permanent/authentication errors do not retry. Bypassing the ingestion semaphore can reduce head-of-line blocking, but this method provides no replacement query concurrency ceiling.

Evidence: [openviking/models/embedder/base.py:391-433](https://github.com/volcengine/OpenViking/blob/a8e334c31c9df168983e6bd72422a3c8431715b3/openviking/models/embedder/base.py#L391-L433) · [tests/unit/test_retry_embedder.py:123-148](https://github.com/volcengine/OpenViking/blob/a8e334c31c9df168983e6bd72422a3c8431715b3/tests/unit/test_retry_embedder.py#L123-L148) · [tests/unit/test_retry_embedder.py:159-212](https://github.com/volcengine/OpenViking/blob/a8e334c31c9df168983e6bd72422a3c8431715b3/tests/unit/test_retry_embedder.py#L159-L212).

**Harness consequence:** Reserve bounded interactive capacity independently from bulk ingestion instead of allowing unbounded query bypass. Track queue wait separately from execution latency, and release only resources owned by the current attempt.

**Scope and limits:** Reviewed the embedding admission delta and retry/cancellation fixtures; provider-specific adapters, lease changes and JEV reranking were not re-audited. This is a scoped static comparison, not a whole-project correctness or security audit. Upstream tests were read where cited, not run; no upstream code, service, model or provider operation was executed. Historical findings above remain evidence at their own revisions.

## Change review — 2026-11-01

Reviewed `24bd450d602599dcf5d1cdb947a62d6700cdec97` (2026-11-01T16:44:16+08:00) against `a8e334c31c9df168983e6bd72422a3c8431715b3`; 1,744 changed paths. Scoped semantic queue diffs pass caller context into lock-scope resolution and distinguish blocked handoff recovery from ordinary retry errors. If replacement enqueue fails, the blocked path raises so the original delivery remains recoverable rather than being acknowledged as failed; exhausted recovery is a separate terminal result. [Processor](https://github.com/volcengine/OpenViking/blob/24bd450d602599dcf5d1cdb947a62d6700cdec97/openviking/storage/queuefs/semantic_processor.py), [work](https://github.com/volcengine/OpenViking/blob/24bd450d602599dcf5d1cdb947a62d6700cdec97/openviking/storage/queuefs/semantic_work.py).

The inspected SQLite-restart fixture injects replacement-enqueue failure across five consumers, preserves logical work ID, recovers the original, later accepts a durable replacement and checks duplicate original delivery cannot rerun the substituted business action. It reads as meaningful lifecycle coverage, but was not executed here and substitutes expensive execution/lock contention. Preserve durable replacement-before-ack ordering and separate physical deliveries from logical work identity; do not generalize this to exactly-once external side effects. [Restart fixture](https://github.com/volcengine/OpenViking/blob/24bd450d602599dcf5d1cdb947a62d6700cdec97/tests/agfs/test_handoff_requeue_enqueue_failure.py). The broader lock manager, other consumers and memory split behavior remain outside this three-path static review.

## External-update review - 2026-11-01

Reviewed `4b92b30656c821712e2cf5f053963dedc66206d9` against `24bd450d602599dcf5d1cdb947a62d6700cdec97`.

The 11-path compilation change tightens [plan parsing](https://github.com/volcengine/OpenViking/blob/4b92b30656c821712e2cf5f053963dedc66206d9/bot/vikingbot/compile/plan.py): operator use is unique across both the revised suffix and already completed stages, record extraction and file outputs remain distinct, and Reduce must produce files. [Revision handling](https://github.com/volcengine/OpenViking/blob/4b92b30656c821712e2cf5f053963dedc66206d9/bot/vikingbot/compile/review.py) carries completed operators into validation. The parser operates on a bounded, whitelisted AST rather than evaluating plan text.

[Finalization](https://github.com/volcengine/OpenViking/blob/4b92b30656c821712e2cf5f053963dedc66206d9/bot/vikingbot/compile/ops/finalize.py) removes the final model-driven delivery-completeness reviewer and its repair/exclusion pass. It retains deterministic path, unique-writer, hash, nonempty-content, selected UTF-8/JSON and skill-package checks before preparing revision-bound writes. These checks cannot establish that every requested deliverable exists or that its statements are correct. The earlier final-review behavior described historically above no longer applies at this revision.

The [pipeline](https://github.com/volcengine/OpenViking/blob/4b92b30656c821712e2cf5f053963dedc66206d9/bot/vikingbot/compile/pipeline.py) now seeds sources even for directory plans. Inspected [source fixtures](https://github.com/volcengine/OpenViking/blob/4b92b30656c821712e2cf5f053963dedc66206d9/bot/tests/test_compile_sources.py) cover paginated/deduplicated source inventories and seeding before requested, budget-triggered or input-limit fallback; image transport uses simulated model responses and does not establish OCR quality.

**Harness consequence:** Keep deterministic artifact validity separate from delivery completeness and independent acceptance. Resume/replan must retain completed-operator identity and all required evidence. This scoped static review covers models, planning, revision, finalization, pipeline and source-fixture deltas; service enumeration and other operator implementations were not exhaustively audited. No upstream code, model call or test was executed.

<!-- teamagent-analysis:start -->
Analysis metadata: source [open-viking](https://github.com/volcengine/OpenViking); analyzed commit `4b92b30656c821712e2cf5f053963dedc66206d9`; commit date 2026-11-02T02:04:36+08:00; review date 2026-11-01T23:12:06.798Z; depth source-reviewed. [Maintenance record](../analyses/repos/ai-agents-mem--open-viking.md).
<!-- teamagent-analysis:end -->
