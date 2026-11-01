# Memory and context architecture

The harness should own durable source records and compile task-specific context from replaceable search and memory adapters. A single vector database, a giant conversation transcript, or an automatically edited memory file cannot meet all the requirements for coding, temporal knowledge, images, team permissions and reliable evolution.

This is an architecture recommendation derived from the inspected snapshots. It is not a claim that one project is universally state of the art. The project reports distinguish implementation evidence, design-only sources and unmeasured performance claims. See [import and generation](import-generation.md), [decisions](decisions.md), [skills](skills.md), [agents](agents.md), [models](models.md) and [evolution](evolution.md) for adjacent contracts.

## 1. Separate evidence, derived knowledge and context

| Plane | Canonical records | Purpose | Mutation policy |
| --- | --- | --- | --- |
| Source evidence | Original files/assets, fetched responses, repository snapshots, permitted conversation/tool events | Reproducible evidence and reprocessing | Versioned bytes; explicit retention/deletion |
| Episodic memory | Public actions, outcomes, decisions, corrections, task/session links | Resume work and learn from actual results | Append events; correct through new attributed records |
| Semantic memory | Assertions, preferences, entity relations, concepts, maintained topic pages | Reuse knowledge across tasks | Derived versions with evidence and validity intervals |
| Code intelligence | File text, symbols, AST ranges, references, dependency/call edges | Navigate and change code accurately | Bound to repository tree/commit and parser version |
| Procedural memory | Skills, policies, tested recipes, failure patterns | Improve task execution | Versioned candidates promoted by evaluation |
| Working context | Current objective, plan state, compact evidence packet, recent tool handles | Fit the current task/model budget | Ephemeral; rebuildable from durable records |

Store observable traces and concise public conclusions. Do not require hidden model chain-of-thought, credentials, private browser/session tokens or unrestricted dumps of tool environments. A trace's retention permission and its eligibility for skill training are distinct fields.

The evidence-first design is informed by [MentisDB](https://github.com/CloudLLM-ai/mentisdb) ([report](projects/ai-agents-mem--mentisdb.md)), whose append path persists an attributed record before updating derived indexes. Its hash chain supports integrity checks, not truth or authorization. The wiki layer follows the [LLM Wiki design](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f) ([design report](projects/ai-agents-mem--xx-2604-llm-wiki.karpathy.md)) and the implemented snapshot discipline in [llm-wiki-compiler](https://github.com/atomicmemory/llm-wiki-compiler) ([report](projects/ai-agents-mem--llm-wiki-compiler.md)). Generated prose remains a materialized view over evidence.

## 2. Canonical data contracts

The [Delta article](https://delta.dev/blog/fine-grained-version-control-for-agents)
([review](analyses/delta-fine-grained-version-control-2026-11-01.md)) suggests an
optional finer-grained evidence experiment. Our design inference is to link exact
artifact versions to permitted public actions and conclusions, with independent
retention and current access checks. Historical fidelity does not justify storing
hidden model reasoning or retaining deleted private content. Existing source and
derived-view contracts remain authoritative; no replicated history is claimed.

Keep these records portable across local and cloud storage:

```text
SourceVersion {
  source_id, version_id, content_hash, locator, media_type,
  retrieved_at, source_modified_at?, repository_commit?, parser_version,
  tenant_id, workspace_id, owner_id, acl_version, provenance, status
}
EvidenceSpan {
  span_id, source_version_id, text_range?, file_lines?, page?, bbox?, time_range?,
  asset_ref?, extraction_kind, extractor_version, quality_flags
}
MemoryClaim {
  assertion_id, subject, predicate, object, scope, evidence_span_ids[],
  observed_at, valid_from?, valid_until?, confidence_kind, confidence_value?,
  author_kind, derivation_run_id?, supersedes[], contradicts[], status
}
DerivedArtifact {
  artifact_id, version, kind, dependencies[], transformation_fingerprint,
  parent_version?, source_watermark, validation_receipt, status
}
ContextPacket {
  task_id, model_profile_version, policy_version, token_budget,
  selected_evidence[], source_versions[], omissions[], degraded_backends[],
  rendered_tokens, created_at
}
```

Identity must include scope. The same document title or entity name in two teams is not the same entity. Preserve multiple source supports rather than deduplicating away provenance. Distinguish observed source statements, model inferences, user-confirmed preferences and external measurements. A model-provided confidence is not a calibrated probability unless an evaluation established that interpretation.

Use separate event time and knowledge time. [Graphiti](https://github.com/getzep/graphiti) ([report](projects/ai-agents-mem--graphiti.md)) explicitly models episode provenance and relation validity/invalidation. This is valuable for “who owned this then?” and “what changed?” questions. Store uncertainty when a source gives no exact date; do not invent precision.

The refreshed [Graphiti report](projects/ai-agents-mem--graphiti.md) also distinguishes ingestion progress from event-time recency when summarizing episodes. Keep separate watermarks and a deterministic source-ID/offset cursor. A bounded prompt and a timestamp alone do not prove that a truncated episode, late-arriving event, or timestamp tie was consumed completely.

## 3. Local and cloud persistence

The recommended first implementation is a local service with SQLite metadata/FTS and a content-addressed asset directory, plus an optional vector index. The cloud variant can use PostgreSQL and object storage behind the same contracts. These are proposed deployment choices, not measured winners. Keep backend-specific objects behind adapters and export canonical records in documented formats.

Use a transactional outbox to schedule parsing, indexing, graph enrichment and wiki updates after source registration. A durable event is the recovery anchor; derived indexes can be rebuilt. Each job has an idempotency key derived from source version, transformation version and scope. Retrying a failed vector write must not duplicate the original source or record a second successful import.

A single reducer per memory scope can serialize materialization while independent parsing and embedding jobs run concurrently. Publish a new derived artifact with optimistic comparison against its parent version. If another job changed the source or parent, retry from the new state instead of overwriting it. Maintain a source watermark and expose “searchable text ready; graph enrichment pending” as legitimate progress states.

Permission checks apply during candidate generation, before body fetch, and before returning the final packet. ACL changes and deletions invalidate derived summaries, vectors, cached context and generated wiki pages that depend on the source. Content hashes do not substitute for authorization. Do not deduplicate private content across tenants in a way that leaks its existence. Local/cloud synchronization needs explicit conflict and retention policy; an append log alone is not a complete synchronization protocol.

## 4. Retrieval should be a cost ladder

Start from cheap authoritative evidence and escalate when uncertainty or task complexity justifies it:

1. Resolve explicit file paths, resource IDs, source versions and exact identifiers.
2. Run lexical search and structured metadata filters; for code, include symbol/reference lookup.
3. Add dense retrieval for paraphrases, then fuse ranked results.
4. Expand the query only when initial evidence is weak or the task demands broader coverage.
5. Rerank a bounded candidate set using relevant chunks, not full documents.
6. Traverse temporal/entity/code relations or model-guided source units for relational questions.
7. Use broad corpus synthesis only for questions that need it.

[QMD](https://github.com/tobi/qmd) ([report](projects/ai-query--qmd.md)) provides an inspected implementation of lexical probing, typed lex/vec/hyde expansion, weighted reciprocal-rank fusion and bounded chunk reranking. Hypothetical generated text can find evidence but must never be cited as evidence. Preserve both original-query and expansion contributions in traces.

Use reciprocal-rank fusion when backend score scales differ:

```text
fused_score(document) = sum_over_retrieval_arms(weight_arm / (k + rank_arm))
```

Weights and cutoffs require corpus-specific evaluation. Rank fusion rewards cross-arm agreement; that is not always appropriate. [Hindsight](https://github.com/vectorize-io/hindsight) ([report](projects/ai-agents-mem--hindsight.md)) implements interleaving for consolidation recall, preserving a strong semantic-only duplicate candidate that fusion could bury. Use separate policies for answering, duplicate detection, contradiction detection and background consolidation.

For code, combine structured ingestion and hybrid search from [GitNexus](https://github.com/abhigyanpatwari/GitNexus) ([report](projects/ai-agents-mem--gitnexus.md)) with exact file reads. Graph impact results are suggestions; dynamic execution may not appear in static edges. [jevgrep](https://github.com/dzhng/jevgrep) ([report](projects/ai-query--jevgrep.md)) demonstrates bounded model-guided traversal, source hashes and byte/line evidence spans. It is an optional escalation path, not a reason to classify an entire repository for every query.

For entity/relationship questions, [LightRAG](https://github.com/HKUDS/LightRAG) ([report](projects/ai-agents-mem--lightrag.md)) combines low/high-level keyword retrieval and optional direct chunks. For corpus-wide themes, [GraphRAG](https://github.com/microsoft/graphrag) ([report](projects/ai-agents-mem--graphrag.md)) implements community-context map/reduce with explicit usage accounting. Neither strategy should replace precise lexical/source lookup.

## 5. Compile context for the actual model

The context compiler receives a task, model capability profile, permission scope and budget. It reserves space for the user request, durable task state, selected skill instructions, tool schemas and the expected answer/tool exchange. The remainder goes to evidence. Budget using the target tokenizer where available, with a conservative fallback; a character count is not a universal token count.

Select diverse evidence rather than many near-duplicate chunks. Keep source identity, freshness and relevance visible. Use detail tiers: resource header/abstract, focused excerpt, full body or native asset. Constraints necessary for correctness cannot be dropped merely because their source ranks lower. Hard exclusions such as permissions are applied before optimization; soft utility scores never override them.

[OpenViking](https://github.com/volcengine/OpenViking) ([report](projects/ai-agents-mem--open-viking.md)) centralizes quotas, a recall ledger, request-local embedding sharing, selective body loading and token-bounded detail planning. Borrow that boundary. A recall ledger must be tied to what the current model actually saw: compaction, switching models or resuming in another agent can invalidate assumptions about prior context.

[context-mode](https://github.com/mksglu/context-mode) ([report](projects/ai-agents-mem--context-mode.md)) shows a practical lexical buffer for tool outputs. Store large outputs as artifacts and provide searchable handles. Retain errors and status separately from content: “backend failed” cannot become “no matching knowledge.” [LEANN](https://github.com/yichuan-w/LEANN) ([report](projects/ai-query--leann.md)) is an optional local vector-backend experiment; embedding recomputation and warmup trade disk usage against compute and startup cost and need hardware-specific measurements.

## 6. Evolving memory without accumulating mistakes

At task completion, propose memory candidates from observable outcomes: stable preferences, verified decisions, successful procedures and unresolved limitations. Do not promote every chat sentence. Use explicit stages: candidate → source-validated → conflict-checked → evaluated/approved where required → published. Retention and approval thresholds differ for personal notes, team architecture and executable skills.

Consolidation groups related records, retrieves possible duplicates and contradictions, and creates a new version with links to all supports. Preserve negative evidence and disagreements. A new assertion may supersede an old one only with matching scope and temporal meaning. Similar wording alone is insufficient; the lexical deduplication option in [MentisDB](https://github.com/CloudLLM-ai/mentisdb) ([report](projects/ai-agents-mem--mentisdb.md)) illustrates why similarity and semantic replacement must remain distinct.

[Mem0](https://github.com/mem0ai/mem0) ([report](projects/ai-agents-mem--mem0.md)) provides a compact scoped raw/inferred memory path; the inspected version uses additive extraction. [Cognee](https://github.com/topoteretes/cognee) ([updated report](projects/ai-agents-mem--cognee.md)) now separates normal ingestion from opt-in conflict review through `improve(review_conflicts=True)`; the old `functional_relationships` path is rejected. Treat conflict review as a separately recorded operation with its own model and evidence requirements, not an automatic property of graph ingestion.

Failed refreshes must preserve the previous materialized artifact. If a retrieval provider fails, a summary saying “there is no information” must not replace years of accumulated knowledge. [Hindsight](https://github.com/vectorize-io/hindsight) ([report](projects/ai-agents-mem--hindsight.md)) explicitly separates these failure cases. [llm-wiki-compiler](https://github.com/atomicmemory/llm-wiki-compiler) ([report](projects/ai-agents-mem--llm-wiki-compiler.md)) binds extraction reuse to source bytes and the provider/model/prompt contract. Apply the same versioning discipline to captions, embeddings, summaries and skill candidates.

## 7. Multimodal knowledge and ingestion boundary

Keep the image, document page, audio interval or video frame as a first-class asset. OCR, captions, transcripts and generated graph entities are derived representations with quality flags. An answer about a diagram or table should be able to reopen the native evidence. The [RAG-Anything](https://github.com/HKUDS/RAG-Anything) ([report](projects/ai-query--rag-anything.md)) source connects modal descriptions to chunks and entity records; extend that with exact page/region/time coordinates and multi-source provenance.

Use [Docling](https://github.com/docling-project/docling) ([report](projects/ai-query--docling.md)) for structured rich-document conversion, [MarkItDown](https://github.com/microsoft/markitdown) ([report](projects/ai-query--markitdown.md)) for a broad lightweight Markdown path, [Trafilatura](https://github.com/adbar/trafilatura) ([report](projects/ai-query--trafilatura.md)) for static web extraction, [Magika](https://github.com/google/magika) ([report](projects/ai-query--magika.md)) as a type-routing signal and [Repomix](https://github.com/yamadashy/repomix) ([report](projects/ai-query--repomix.md)) for bounded repository packaging. Detailed contracts and limits belong in [import and generation](import-generation.md).

## 8. Validation and phased adoption

The baseline must be strong enough to expose whether advanced memory pays for itself. Evaluate the same tasks with no persistent memory, lexical memory, hybrid retrieval, and graph/consolidation additions at comparable budgets. Split by project/user/time so the system cannot simply memorize evaluation answers.

| Task family | Required measurements |
| --- | --- |
| Exact and paraphrase queries | Recall@k, nDCG, source attribution, answer correctness, abstention |
| Coding | Relevant-file recall, patch/test success, missed impact, stale-source rate |
| Temporal memory | Correct as-of answer, correction handling, entity disambiguation |
| Consolidation | Duplicate rate, unsupported claims, contradiction retention, rollback success |
| Multimodal | OCR/table accuracy, native-evidence citation, numerical fidelity |
| Permissions/deletion | Cross-scope leakage, revocation latency, stale-derived exposure |
| Operations | Cold/warm p50/p95 latency, cost per successful task, disk/RAM, recovery |

First ship immutable source versions, imports, lexical search, evidence spans and a context packet. Next add dense retrieval/reranking and code navigation. Then pilot temporal relations, curated wiki compilation and consolidation on workloads that demonstrate need. Keep advanced backends optional until they improve outcome quality or operating cost on the held-out suite. Promote changes through the [evolution workflow](evolution.md), with rollback to the previous parser, index and policy versions.

## Source refresh: 2026-10-28 - recovery, coverage and decision evidence

The [GraphRAG cache review](projects/ai-agents-mem--graphrag.md) supports namespace-aware bulk reads and compare-before-delete cleanup of corrupt entries. SQLite's 500-key SQL batches bound statement parameters; the generic outer gather and total decoded results still need independent input, concurrency and byte limits. The [LightRAG review](projects/ai-agents-mem--lightrag.md) reinforces non-destructive recovery: an initialization error does not authorize dropping a collection, and legacy/migration state must be reconciled before creating an empty replacement. Evaluate recall after tenant filtering separately from successful query transport; transaction-local iterative scans trade bounded work for coverage and do not guarantee full recall.

The [bbolt review](projects/ai-agents-mem--bbolt.md) adds a narrower maintenance lesson: moving a hierarchy node must preserve live identity and metadata, reject cycles and protect compaction sources against path aliases. This does not select bbolt for Teamagent. The [LEANN review](projects/ai-query--leann.md) likewise supports model/template-scoped cache identity and owned connections while retaining byte budgets and explicit thread-sharing limits. Exact model revisions and source permissions remain part of Teamagent's stronger cache contract.

Memory delivery and judgment are separate from instructions to produce them. The [bs_cortex refresh](projects/ai-agents-mem--bs_cortex.md) describes planned client-side answer ingestion without demonstrating successful delivery. The [TencentDB review](projects/ai-agents-mem--tencentdb-agent-memory.md) shows why an unavailable model judgment must remain distinct from false: its parser coerces values with `Boolean`, and its parse-failure branch returns negative flags. Teamagent should require typed decisions and observed ingestion receipts. Similarly, [Wigolo's citation mapper](projects/ai-query--wigolo.md) gives an in-range citation marker a high label without checking support; citation syntax and lexical overlap cannot substitute for exact evidence spans and claim validation. These source findings are static review evidence, not new implemented Teamagent capabilities or measured retrieval gains.

The [Agentmemory review](projects/ai-agents-mem--agentmemory.md) provides a concrete derived-index pattern: bounded projections retain incomplete-coverage flags, pending journals block readers, and final generation/revision checks reject stale views. Its byte accounting happens after the storage read, so transport allocation and aggregate request admission still need separate limits. Its source-authorization callback is optional; Teamagent must make ownership checks mandatory. [Utopia's historical retrieval](projects/ai-agents-mem--utopia.md) exposes another coverage limit: filtering current lexical results by an old timestamp cannot recover superseded chunks absent from the lexical index. Report channel availability, historical completeness and snapshot identity separately from ranking scores.

The [Mem0 review](projects/ai-agents-mem--mem0.md) rejects blank entity IDs before deletion, yet omitted `deleteUsers` scope still deletes every listed entity. Require an explicit ownership scope and a separate grant for broad deletion. [Open Design's extraction-origin snapshot](projects/ai-gen--open-design.md) correctly copies caller identity before asynchronous work, but its small in-memory history is a UI aid rather than a durable source receipt. Preserve attribution and observed write status in the evidence store independently of presentation history.

The [QMD migration review](projects/ai-query--qmd.md) requires a separate recovery decision for readable legacy data whose key/dimension cannot be identified: the inspected branch can drop that table without copying or final verification. Preserve the original index and migration manifest until semantic coverage is proven. [Turbovec's conversion review](projects/ai-agents-mem--turbovec.md) validates container geometry and stages replacement, but full input/output buffering and last-writer-wins replacement still require memory admission and writer ownership. Neither container parity nor a successful migration establishes embedding-space compatibility or retrieval recall.

The [Jevgrep refresh](projects/ai-query--jevgrep.md) qualifies its bounded-traversal pattern: active scoring is capped, but retained results and confident navigation can exceed the low-confidence byte budget, and a `Set.add` return-value check can recount snapshot bytes. Require independent hard budgets and accurate unique-source receipts. The [Contextrie scoped review](projects/ai-agents-mem--xx-2604-contextrie.md) similarly finds unrestricted judge fan-out and a composer whose tightness is prompt guidance; it returns context text without the selected-source manifest. Preserve source/version IDs through composition, verify claims separately and calibrate score thresholds on held-out tasks. Its reconciled commits have identical tracked trees despite unrelated ancestry, which supports content equivalence at those pins rather than current-head coverage.

The [RAG-Anything review](projects/ai-query--rag-anything.md) separates queued text work from completed ingestion and attempts exact chunk/page replay. Missing or unexpected status must not become successful completion, and annotation warnings need explicit incomplete-provenance receipts. [MemPalace's media search](projects/ai-agents-mem--mempalace.md) provides bounded candidate pools and missing-asset flags; require exact embedding identity, result cardinality and asset containment in addition to cosine ranking. [Honcho's schema review](projects/ai-agents-mem--honcho.md) adds deletion-generation fields but does not establish the full reader/worker erasure barrier. Treat unavailable caches, stale workers and partial retrieval as distinct states.

The [Commonplace review](projects/ai-agents-mem--commonplace.md) retains fenced-text offsets and copies cached parse output, but its fallback link selection and directory rendering still need exact containment, escaping and output limits. [GNO's source reads](projects/ai-agents-mem--gno.md) illustrate the separate need for post-read byte checks and immutable input snapshots. [Graphify's manifest cache](projects/ai-agents-mem--graphify.md) cannot substitute a hash hit for a verified, atomically published graph. Keep missing supersession information and failed manifest recovery explicit.

The [Stash refresh](projects/ai-agents-mem--stash.md) distinguishes guarded page-embedding updates from other ID-only writes that can publish stale vectors. [FokosDB's tombstone protocol](projects/ai-agents-mem--fokosdb.md) provides revision/reader-position ideas, but callers still own transactional ordering. [Beads' remote-cache review](projects/ai-agents-mem--beads.md) adds a related ownership requirement: a lock's age does not establish that its holder is dead, and reader/eviction lifetimes must participate in the lease. [Leanctx's policy store](projects/ai-agents-mem--lean-ctx.md) also shows why successful persistence and successful validation must be separate receipts; invalid saved policy must not silently appear as the default policy.

The [memory-techniques notebooks](projects/ai-agents-mem--agent-memory-techniques.md) are educational examples: optional version checks, mutable shared entries and graph queries without user scope do not meet the memory authority contract. Their judgment failures and unexamined cross-batch contradiction pairs must remain missing coverage, never neutral scores or evidence of consistency. [Cognee's batch retrieval](projects/ai-agents-mem--cognee-rs.md) preserves graph provenance, yet searches full collections and usually loads the full graph; a final top-k limit does not bound retrieval work. Unsupported retrieval modes require explicit results, and raw rendered query/context logging is excluded.

The [Tolaria search review](projects/ai-agents-mem--tolaria.md) makes source-coordinate and coverage requirements concrete: removing front matter/code without an offset map shifts returned snippets, while failed incremental reads can leave a current head with missing notes. [TraceDecay's read cache](projects/ai-agents-mem--tracedecay.md) trusts modification time even though it retains a digest. Bind every published index and cache entry to immutable bytes, exact normalization mappings and a complete source manifest; freshness of a revision label does not prove completeness. Its reconciliation owner states are useful lifecycle evidence, but a wrapper accepting a terminal status does not itself prove joined cancellation.

The [GitNexus cache review](projects/ai-agents-mem--gitnexus.md) verifies base identity before reuse and drains both hybrid-search lanes before propagating identity corruption, while other lane failures still become empty results. [Omnigraph's persisted graph](projects/ai-agents-mem--omnigraph.md) checks bounded sections, digests, endpoints and trailing bytes, but delegates atomic storage publication to its adapter. [Dolt's chunk checks](projects/ai-agents-mem--dolt.md) distinguish content integrity from optional reference checks and whole-value allocation. Combine these ideas with explicit degraded-lane receipts, bounded input/output and fenced publication; structural validity is not semantic retrieval coverage.

The [Neo4j agent-memory merger](projects/ai-agents-mem--agent-memory.neo4j.md) retains survivor mention identity, yet the TypeScript extractor can call a high caller-confidence value confirmed and swallow partial relationship failures. [Hindsight's reflection path](projects/ai-agents-mem--hindsight.md) validates citation-ID membership but does not establish entailment, and its map/tool fan-out still needs aggregate bounds. Preserve per-stage lineage and partial-write receipts; confirmation requires its own evidence. [LLM Wiki Compiler's snapshot](projects/ai-agents-mem--llm-wiki-compiler.md) binds extraction to a recipe and supplied content identity, while evaluation-cache JSON still needs semantic validation.

The [OpenViking review](projects/ai-agents-mem--open-viking.md) distinguishes selected entries from rendered context when a model judges them irrelevant. [PAI's memory graph](projects/ai-agents-mem--pai-personal-ai-infrastructure.md) similarly shows why a thresholded relationship score and an exported graph view need separate identity and consistency checks. Return exactly what the consuming model saw, retain original evidence and record advisory judgments separately. [Kanban Code's distributed search](projects/ai-query--kanban-code.md) keeps truncation and unreachable peers in its UI but drops them in CLI JSON; every harness result format must retain those coverage fields.

## Additional scoped review references

These catalog associations provide navigation to scoped source reviews. Each report records its inspected revision, findings and exclusions; inclusion here does not establish a capability or an adoption decision.

- [gittifacts](analyses/unreviewed/ai-agents-mem--gittifacts.md)
- [helix-foundry](analyses/unreviewed/ai-agents-mem--helix-foundry.md)
- [xerj](analyses/unreviewed/ai-agents-mem--xerj.md)
- [awesome-jev-live](analyses/unreviewed/ai-info--awesome-jev-live.md)
- [best-of-agent-harnesses](analyses/unreviewed/ai-info--best-of-agent-harnesses.md)
- [better-icons](analyses/unreviewed/ai-query--better-icons.md)
- [dbx](analyses/unreviewed/ai-query--dbx.md)
- [yt-dlp](analyses/unreviewed/ai-query--yt-dlp.md)

## Source refresh: 2026-11-01 — durable lineage and admitted context

These are architecture requirements inferred from scoped source reviews, not newly implemented memory features or measured improvements. The [runtime contract](memory-imports.md) remains the authority for current CLI behavior.

**Track continuation, publication and deletion independently.** [Utopia](https://github.com/deeplethe/utopia) ([review](projects/ai-agents-mem--utopia.md)) exposes the consumed source checkpoint separately from sync time; [Omnigraph](https://github.com/ModernRelay/omnigraph) ([review](projects/ai-agents-mem--omnigraph.md)) carries the identity of an uncertain publication through error wrappers. A continuation must bind source generation, complete accepted boundary and durable publication. Retain uncertain attempt identity before replay and reconcile the existing result. [OpenViking](https://github.com/volcengine/OpenViking) ([review](projects/ai-agents-mem--open-viking.md)) supplies a durable replacement-before-acknowledgment example. Acknowledgment of scheduling or cleanup initiation must never stand in for durable admission or joined resource shutdown.

**Keep evidence supports after deduplication, and invalidate their conclusions deliberately.** [Honcho](https://github.com/plastic-labs/honcho) ([review](projects/ai-agents-mem--honcho.md)) preserves unknown legacy citation attribution instead of inventing a backfill, but deleting a citation edge does not delete its conclusion. [Mem0](https://github.com/mem0ai/mem0) ([review](projects/ai-agents-mem--mem0.md)) adds explicit missing-update outcomes to prevent publishing successful history after a concurrent deletion; compatibility with older unknown-return backends remains relevant. The memory reducer must distinguish missing, changed and unknown effects and propagate revocation/deletion through derived claims, indexes and cached packets. [Beads](https://github.com/gastownhall/beads) ([review](projects/ai-agents-mem--beads.md)) additionally motivates binding retention selection to its authoritative configuration and reporting partial cleanup item by item.

**Admit before ranking and preserve the delivered projection.** [AnythingLLM](https://github.com/Mintplex-Labs/anything-llm) ([review](projects/ai-agents--anything-llm.md)) filters candidate eligibility before paid reranking/top-k; [Lean Context](https://github.com/yvgude/lean-ctx) ([review](projects/ai-agents-mem--lean-ctx.md)) distinguishes original, admitted and delivered context. Keep zero scores distinct from missing scores, record the source/ACL/transformation versions of the actual packet and recheck access before opening retained evidence. Compaction should disclose which level and spans were delivered, not silently replace originals. [DeepTutor](https://github.com/HKUDS/DeepTutor) ([review](projects/ai-agents--deeptutor.md)) illustrates that rendered-text correspondence is weaker than exact original offset, line-break or subtitle-cue preservation.

**Version graph identity and evaluate coverage honestly.** [Graphify](https://github.com/safishamsi/graphify) ([review](projects/ai-agents-mem--graphify.md)) distinguishes ambiguous language declarations and advances extractor cache identity; [CodeGraph](https://github.com/colbymchenry/codegraph) ([review](projects/ai-agents-mem--codegraph.md)) discloses stale extraction versions. Preserve ambiguity rather than narrowing an edit/search to an invented edge. [GitNexus](https://github.com/abhigyanpatwari/GitNexus) ([review](projects/ai-agents-mem--gitnexus.md)) separates unobserved cases from empty retrieval and limits what partial relevance labels can measure. Evaluate source recall, reranking, packet fidelity and final answer correctness separately. A pinned digest authenticates captured bytes, not their truth or benchmark success.

Static articles retain publication/creation evidence and their captured version under [text maintenance](research-sync.md). Source authoring time, acquisition time, refresh validation time and derived-index time are separate clocks. None of these source reviews authorizes refreshing an article that lacks an explicit refresh policy.

<!-- coverage:start -->
## Project coverage

Every associated project has its own report. Source-reviewed associations reflect the inspected scope; screened associations derive from the input category and are not capability claims.

| Source | Report | Depth |
|---|---|---|
| [hermes-agent](https://github.com/NousResearch/hermes-agent) | [Report](projects/ai-agents--hermes-agent.md) | source-reviewed |
| [mastra](https://github.com/mastra-ai/mastra) | [Report](projects/ai-agents--mastra.md) | source-reviewed |
| [agent-beacon](https://github.com/Asymptote-Labs/agent-beacon) | [Report](projects/ai-agents-mem--agent-beacon.md) | screened |
| [agent-memory-techniques](https://github.com/NirDiamant/Agent_Memory_Techniques) | [Report](projects/ai-agents-mem--agent-memory-techniques.md) | screened |
| [agent-memory.neo4j](https://github.com/neo4j-labs/agent-memory) | [Report](projects/ai-agents-mem--agent-memory.neo4j.md) | screened |
| [agentmemory](https://github.com/rohitg00/agentmemory) | [Report](projects/ai-agents-mem--agentmemory.md) | screened |
| [bbolt](https://github.com/etcd-io/bbolt) | [Report](projects/ai-agents-mem--bbolt.md) | screened |
| [beads](https://github.com/gastownhall/beads) | [Report](projects/ai-agents-mem--beads.md) | screened |
| [bs_cortex](https://github.com/novotapeter-bs/bs_cortex) | [Report](projects/ai-agents-mem--bs_cortex.md) | screened |
| [cabinet](https://github.com/hilash/cabinet) | [Report](projects/ai-agents-mem--cabinet.md) | screened |
| [code-review-graph](https://github.com/tirth8205/code-review-graph) | [Report](projects/ai-agents-mem--code-review-graph.md) | screened |
| [codegraph](https://github.com/colbymchenry/codegraph) | [Report](projects/ai-agents-mem--codegraph.md) | screened |
| [cognee](https://github.com/topoteretes/cognee) | [Report](projects/ai-agents-mem--cognee.md) | source-reviewed |
| [cognee-rs](https://github.com/topoteretes/cognee-rs) | [Report](projects/ai-agents-mem--cognee-rs.md) | screened |
| [commonplace](https://github.com/zby/commonplace) | [Report](projects/ai-agents-mem--commonplace.md) | screened |
| [context-engine](https://github.com/Emmimal/context-engine) | [Report](projects/ai-agents-mem--context-engine.md) | screened |
| [context-engineering-intro](https://github.com/coleam00/context-engineering-intro) | [Report](projects/ai-agents-mem--context-engineering-intro.md) | screened |
| [context-hub](https://github.com/andrewyng/context-hub) | [Report](projects/ai-agents-mem--context-hub.md) | screened |
| [context-mode](https://github.com/mksglu/context-mode) | [Report](projects/ai-agents-mem--context-mode.md) | source-reviewed |
| [core-memory](https://github.com/JohnnyFiv3r/Core-Memory) | [Report](projects/ai-agents-mem--core-memory.md) | screened |
| [dolt](https://github.com/dolthub/dolt) | [Report](projects/ai-agents-mem--dolt.md) | screened |
| [enterprise-rag-patterns](https://github.com/ashutoshrana/enterprise-rag-patterns) | [Report](projects/ai-agents-mem--enterprise-rag-patterns.md) | screened |
| [flock](https://github.com/whiteducksoftware/flock) | [Report](projects/ai-agents-mem--flock.md) | screened |
| [fokosdb](https://github.com/lambrospetrou/fokosdb) | [Report](projects/ai-agents-mem--fokosdb.md) | screened |
| [gbrain](https://github.com/garrytan/gbrain) | [Report](projects/ai-agents-mem--gbrain.md) | screened |
| [gitnexus](https://github.com/abhigyanpatwari/GitNexus) | [Report](projects/ai-agents-mem--gitnexus.md) | source-reviewed |
| [glean-api-go](https://github.com/gleanwork/api-client-go) | [Report](projects/ai-agents-mem--glean-api-go.md) | screened |
| [glean-api-python](https://github.com/gleanwork/api-client-python) | [Report](projects/ai-agents-mem--glean-api-python.md) | screened |
| [glean-api-typescript](https://github.com/gleanwork/api-client-typescript) | [Report](projects/ai-agents-mem--glean-api-typescript.md) | screened |
| [glean-cli](https://github.com/gleanwork/glean-cli) | [Report](projects/ai-agents-mem--glean-cli.md) | screened |
| [glean-configure-mcp](https://github.com/gleanwork/configure-mcp-server) | [Report](projects/ai-agents-mem--glean-configure-mcp.md) | screened |
| [gno](https://github.com/gmickel/gno) | [Report](projects/ai-agents-mem--gno.md) | screened |
| [graft](https://github.com/NanoNets/Graft) | [Report](projects/ai-agents-mem--graft.md) | screened |
| [graphify](https://github.com/safishamsi/graphify) | [Report](projects/ai-agents-mem--graphify.md) | screened |
| [graphiti](https://github.com/getzep/graphiti) | [Report](projects/ai-agents-mem--graphiti.md) | source-reviewed |
| [graphrag](https://github.com/microsoft/graphrag) | [Report](projects/ai-agents-mem--graphrag.md) | source-reviewed |
| [hindsight](https://github.com/vectorize-io/hindsight) | [Report](projects/ai-agents-mem--hindsight.md) | source-reviewed |
| [honcho](https://github.com/plastic-labs/honcho) | [Report](projects/ai-agents-mem--honcho.md) | screened |
| [lean-ctx](https://github.com/yvgude/lean-ctx) | [Report](projects/ai-agents-mem--lean-ctx.md) | screened |
| [lightrag](https://github.com/HKUDS/LightRAG) | [Report](projects/ai-agents-mem--lightrag.md) | source-reviewed |
| [llm-wiki-compiler](https://github.com/atomicmemory/llm-wiki-compiler) | [Report](projects/ai-agents-mem--llm-wiki-compiler.md) | source-reviewed |
| [llm-wiki-v2.rohitg00](https://gist.github.com/rohitg00/2067ab416f7bbe447c1977edaaa681e2) | [Report](projects/ai-agents-mem--llm-wiki-v2.rohitg00.md) | screened |
| [mcp-memory-graphdb](https://github.com/pavex/mcp-memory-graphdb) | [Report](projects/ai-agents-mem--mcp-memory-graphdb.md) | screened |
| [mem0](https://github.com/mem0ai/mem0) | [Report](projects/ai-agents-mem--mem0.md) | source-reviewed |
| [mempalace](https://github.com/milla-jovovich/mempalace) | [Report](projects/ai-agents-mem--mempalace.md) | screened |
| [memvid](https://github.com/memvid/memvid) | [Report](projects/ai-agents-mem--memvid.md) | screened |
| [mentisdb](https://github.com/CloudLLM-ai/mentisdb) | [Report](projects/ai-agents-mem--mentisdb.md) | source-reviewed |
| [my-brain-is-full-crew](https://github.com/gnekt/my-brain-is-full-crew) | [Report](projects/ai-agents-mem--my-brain-is-full-crew.md) | screened |
| [neo4j-graphrag-python](https://github.com/neo4j/neo4j-graphrag-python) | [Report](projects/ai-agents-mem--neo4j-graphrag-python.md) | screened |
| [omnigraph](https://github.com/ModernRelay/omnigraph) | [Report](projects/ai-agents-mem--omnigraph.md) | screened |
| [open-viking](https://github.com/volcengine/OpenViking) | [Report](projects/ai-agents-mem--open-viking.md) | source-reviewed |
| [opencontext](https://github.com/0xranx/OpenContext) | [Report](projects/ai-agents-mem--opencontext.md) | screened |
| [pageindex](https://github.com/VectifyAI/PageIndex) | [Report](projects/ai-agents-mem--pageindex.md) | screened |
| [pai-personal-ai-infrastructure](https://github.com/danielmiessler/Personal_AI_Infrastructure) | [Report](projects/ai-agents-mem--pai-personal-ai-infrastructure.md) | screened |
| [pi-self-learning](https://github.com/mcollina/pi-self-learning) | [Report](projects/ai-agents-mem--pi-self-learning.md) | screened |
| [ragflow](https://github.com/infiniflow/ragflow) | [Report](projects/ai-agents-mem--ragflow.md) | screened |
| [reef](https://github.com/Human-Agent-Society/reef) | [Report](projects/ai-agents-mem--reef.md) | screened |
| [socrati-code](https://github.com/giancarloerra/SocratiCode) | [Report](projects/ai-agents-mem--socrati-code.md) | screened |
| [stash](https://github.com/fergana-labs/stash) | [Report](projects/ai-agents-mem--stash.md) | screened |
| [tencentdb-agent-memory](https://github.com/TencentCloud/TencentDB-Agent-Memory) | [Report](projects/ai-agents-mem--tencentdb-agent-memory.md) | screened |
| [tolaria](https://github.com/refactoringhq/tolaria) | [Report](projects/ai-agents-mem--tolaria.md) | screened |
| [tracedecay](https://github.com/ScriptedAlchemy/tracedecay) | [Report](projects/ai-agents-mem--tracedecay.md) | screened |
| [turbovec](https://github.com/RyanCodrai/turbovec) | [Report](projects/ai-agents-mem--turbovec.md) | screened |
| [utopia](https://github.com/deeplethe/utopia) | [Report](projects/ai-agents-mem--utopia.md) | screened |
| [xmem](https://github.com/XortexAI/Xmem) | [Report](projects/ai-agents-mem--xmem.md) | screened |
| [xx-2601-cognitive-memory](https://github.com/OpenTechLab/cognitive-memory) | [Report](projects/ai-agents-mem--xx-2601-cognitive-memory.md) | screened |
| [xx-2602-arscontexta](https://github.com/agenticnotetaking/arscontexta) | [Report](projects/ai-agents-mem--xx-2602-arscontexta.md) | screened |
| [xx-2604-cognisync](https://github.com/shrijacked/Cognisync) | [Report](projects/ai-agents-mem--xx-2604-cognisync.md) | screened |
| [xx-2604-contextrie](https://github.com/feuersteiner/contextrie) | [Report](projects/ai-agents-mem--xx-2604-contextrie.md) | screened |
| [xx-2604-llm-wiki.karpathy](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f) | [Report](projects/ai-agents-mem--xx-2604-llm-wiki.karpathy.md) | design-reviewed |
| [xx-2604-memento](https://github.com/microsoft/memento) | [Report](projects/ai-agents-mem--xx-2604-memento.md) | screened |
| [xx-2604-mgp.memory-governance-protocol](https://github.com/HKUDS/MGP) | [Report](projects/ai-agents-mem--xx-2604-mgp.memory-governance-protocol.md) | screened |
| [rtk](https://github.com/rtk-ai/rtk) | [Report](projects/ai-agents-proxy--rtk.md) | source-reviewed |
| [create.skill-seekers](https://github.com/yusufkaraaslan/Skill_Seekers) | [Report](projects/ai-agents-skills--create.skill-seekers.md) | source-reviewed |
| [evolve-claude.autoharness](https://github.com/tigerless-labs/autoharness) | [Report](projects/ai-agents-skills--evolve-claude.autoharness.md) | source-reviewed |
| [crewai](https://github.com/crewAIInc/crewAI) | [Report](projects/ai-agents-swarm--crewai.md) | source-reviewed |
| [langwatch](https://github.com/langwatch/langwatch) | [Report](projects/ai-eval--langwatch.md) | source-reviewed |
| [xx-2602-ragas](https://github.com/vibrantlabsai/ragas) | [Report](projects/ai-eval--xx-2602-ragas.md) | source-reviewed |
| [game-schema-harness](https://github.com/schema-harness/schema-harness.github.io) | [Report](projects/ai-info--game-schema-harness.md) | source-reviewed |
| [vimax](https://github.com/HKUDS/ViMax) | [Report](projects/ai-media--vimax.md) | source-reviewed |
| [yue](https://github.com/multimodal-art-projection/YuE) | [Report](projects/ai-media--yue.md) | source-reviewed |
| [freetoken](https://github.com/FlashML-org/FreeToken) | [Report](projects/ai-model-run--freetoken.md) | source-reviewed |
| [aci](https://github.com/aipotheosis-labs/aci) | [Report](projects/ai-query--aci.md) | screened |
| [agent-browser](https://github.com/vercel-labs/agent-browser) | [Report](projects/ai-query--agent-browser.md) | screened |
| [anydoc](https://github.com/firecrawl/anydoc) | [Report](projects/ai-query--anydoc.md) | screened |
| [book-to-skill](https://github.com/virgiliojr94/book-to-skill) | [Report](projects/ai-query--book-to-skill.md) | screened |
| [browser-harness](https://github.com/browser-use/browser-harness) | [Report](projects/ai-query--browser-harness.md) | screened |
| [clawpatrol](https://github.com/denoland/clawpatrol) | [Report](projects/ai-query--clawpatrol.md) | screened |
| [codebase-radar](https://github.com/BleedingDev/codebase-radar) | [Report](projects/ai-query--codebase-radar.md) | screened |
| [codeflow](https://github.com/braedonsaunders/codeflow) | [Report](projects/ai-query--codeflow.md) | screened |
| [cowork-aion-ui](https://github.com/iOfficeAI/AionUi) | [Report](projects/ai-query--cowork-aion-ui.md) | screened |
| [docling](https://github.com/docling-project/docling) | [Report](projects/ai-query--docling.md) | source-reviewed |
| [fastmcp](https://github.com/punkpeye/fastmcp) | [Report](projects/ai-query--fastmcp.md) | screened |
| [get-md](https://github.com/Nano-Collective/get-md) | [Report](projects/ai-query--get-md.md) | screened |
| [gflow-cli](https://github.com/ffroliva/gflow-cli) | [Report](projects/ai-query--gflow-cli.md) | screened |
| [hyper-extract](https://github.com/yifanfeng97/Hyper-Extract) | [Report](projects/ai-query--hyper-extract.md) | screened |
| [jevgrep](https://github.com/dzhng/jevgrep) | [Report](projects/ai-query--jevgrep.md) | source-reviewed |
| [kanban-code](https://github.com/langwatch/kanban-code) | [Report](projects/ai-query--kanban-code.md) | screened |
| [leaf](https://github.com/RivoLink/leaf) | [Report](projects/ai-query--leaf.md) | screened |
| [leann](https://github.com/yichuan-w/LEANN) | [Report](projects/ai-query--leann.md) | source-reviewed |
| [lightpanda-browser](https://github.com/lightpanda-io/browser) | [Report](projects/ai-query--lightpanda-browser.md) | screened |
| [litho-deepwiki-rs](https://github.com/sopaco/deepwiki-rs) | [Report](projects/ai-query--litho-deepwiki-rs.md) | screened |
| [mantic.sh](https://github.com/marcoaapfortes/Mantic.sh) | [Report](projects/ai-query--mantic.sh.md) | screened |
| [marker](https://github.com/datalab-to/marker) | [Report](projects/ai-query--marker.md) | screened |
| [markitdown](https://github.com/microsoft/markitdown) | [Report](projects/ai-query--markitdown.md) | source-reviewed |
| [mcp-docs](https://github.com/modelcontextprotocol/modelcontextprotocol) | [Report](projects/ai-query--mcp-docs.md) | screened |
| [mcp-ext-apps](https://github.com/modelcontextprotocol/ext-apps) | [Report](projects/ai-query--mcp-ext-apps.md) | screened |
| [mcp-ext-auth](https://github.com/modelcontextprotocol/ext-auth) | [Report](projects/ai-query--mcp-ext-auth.md) | screened |
| [mcp-inspector](https://github.com/modelcontextprotocol/inspector) | [Report](projects/ai-query--mcp-inspector.md) | screened |
| [mcp-sdk-go](https://github.com/modelcontextprotocol/go-sdk) | [Report](projects/ai-query--mcp-sdk-go.md) | screened |
| [mcp-sdk-python](https://github.com/modelcontextprotocol/python-sdk) | [Report](projects/ai-query--mcp-sdk-python.md) | screened |
| [mcp-sdk-rust](https://github.com/modelcontextprotocol/rust-sdk) | [Report](projects/ai-query--mcp-sdk-rust.md) | screened |
| [mcp-sdk-typescript](https://github.com/modelcontextprotocol/typescript-sdk) | [Report](projects/ai-query--mcp-sdk-typescript.md) | screened |
| [md-page-extension](https://github.com/Ademking/MD-This-Page) | [Report](projects/ai-query--md-page-extension.md) | screened |
| [mineru](https://github.com/opendatalab/MinerU) | [Report](projects/ai-query--mineru.md) | screened |
| [office-parser](https://github.com/harshankur/officeParser) | [Report](projects/ai-query--office-parser.md) | screened |
| [officecli](https://github.com/iOfficeAI/OfficeCLI) | [Report](projects/ai-query--officecli.md) | screened |
| [omniparser](https://github.com/microsoft/OmniParser) | [Report](projects/ai-query--omniparser.md) | screened |
| [oneglanse](https://github.com/aryamantodkar/oneglanse) | [Report](projects/ai-query--oneglanse.md) | screened |
| [opendataloader-pdf](https://github.com/opendataloader-project/opendataloader-pdf) | [Report](projects/ai-query--opendataloader-pdf.md) | screened |
| [pdf-inspector](https://github.com/firecrawl/pdf-inspector) | [Report](projects/ai-query--pdf-inspector.md) | screened |
| [playwright](https://github.com/microsoft/playwright) | [Report](projects/ai-query--playwright.md) | screened |
| [qmd](https://github.com/tobi/qmd) | [Report](projects/ai-query--qmd.md) | source-reviewed |
| [rag-anything](https://github.com/HKUDS/RAG-Anything) | [Report](projects/ai-query--rag-anything.md) | source-reviewed |
| [regulated-ai-governance](https://github.com/ashutoshrana/regulated-ai-governance) | [Report](projects/ai-query--regulated-ai-governance.md) | screened |
| [repomix](https://github.com/yamadashy/repomix) | [Report](projects/ai-query--repomix.md) | source-reviewed |
| [spotify-portal-ai-plugins](https://github.com/spotify/portal-ai-plugins) | [Report](projects/ai-query--spotify-portal-ai-plugins.md) | screened |
| [stagehand](https://github.com/browserbase/stagehand) | [Report](projects/ai-query--stagehand.md) | screened |
| [trafilatura](https://github.com/adbar/trafilatura) | [Report](projects/ai-query--trafilatura.md) | source-reviewed |
| [understand-anything](https://github.com/Lum1104/Understand-Anything) | [Report](projects/ai-query--understand-anything.md) | screened |
| [use-webmcp-tool](https://github.com/GoogleChromeLabs/use-webmcp-tool) | [Report](projects/ai-query--use-webmcp-tool.md) | screened |
| [watermarks-remover](https://github.com/guillaumemeyer/watermarks-remover) | [Report](projects/ai-query--watermarks-remover.md) | screened |
| [wigolo](https://github.com/KnockOutEZ/wigolo) | [Report](projects/ai-query--wigolo.md) | screened |
| [xberg](https://github.com/xberg-io/xberg) | [Report](projects/ai-query--xberg.md) | screened |
| [xx-2602-markform](https://github.com/jlevy/markform) | [Report](projects/ai-query--xx-2602-markform.md) | screened |
| [bundle-claude.ecc.affaan-m](https://github.com/affaan-m/everything-claude-code) | [Report](projects/ai-skills--bundle-claude.ecc.affaan-m.md) | source-reviewed |
| [context-hub.andrewyng](https://github.com/andrewyng/context-hub) | [Report](projects/ai-skills--context-hub.andrewyng.md) | source-reviewed |
| [security.trailofbits](https://github.com/trailofbits/skills) | [Report](projects/ai-skills--security.trailofbits.md) | source-reviewed |
| [get-shit-done](https://github.com/gsd-build/get-shit-done) | [Report](projects/ai-spec--get-shit-done.md) | source-reviewed |
| [openspec](https://github.com/Fission-AI/OpenSpec) | [Report](projects/ai-spec--openspec.md) | source-reviewed |
<!-- coverage:end -->

## Follow-up source review: 2026-10-28 — memory admission and recoverability

The reviewed changes reinforce versioned evidence and explicit admission. [Gbrain](https://github.com/garrytan/gbrain) ([review](projects/ai-agents-mem--gbrain.md#follow-up-change-review--2026-10-28)) binds release to the fields actually previewed and checks them again before publication; [Stash](https://github.com/fergana-labs/stash) ([review](projects/ai-agents-mem--stash.md#follow-up-change-review--2026-10-28)) filters publication eligibility before ranking and limiting. Bind approvals to content, source, scope and policy versions, retain changed candidates as held, and recheck access when opening a result. Neither helper's existence proves every caller enforces authorization. [FokosDB](https://github.com/lambrospetrou/fokosdb) ([review](projects/ai-agents-mem--fokosdb.md#follow-up-change-review--2026-10-28)) adds topology ownership to cache keys, but optional caller scope still requires harness enforcement. [Beads](https://github.com/gastownhall/beads) ([review](projects/ai-agents-mem--beads.md#follow-up-change-review--2026-10-28)) retains retired IDs in tombstones; deletion and tombstone publication must share a transaction so retries cannot resurrect retired identities. [Dolt](https://github.com/dolthub/dolt) ([review](projects/ai-agents-mem--dolt.md#follow-up-change-review--2026-10-28)) supplies a narrower validation/builder-reuse example, not proof of the surrounding transaction's atomicity.

Incremental source cursors must survive interruption without mistaking rewritten bytes for appended evidence. [Tracedecay](https://github.com/ScriptedAlchemy/tracedecay) ([review](projects/ai-agents-mem--tracedecay.md#follow-up-change-review--2026-10-28)) binds a resume witness to a complete first frame and prefix; its compact durable fingerprint is not full resumable SHA state. [Kanban Code](https://github.com/langwatch/kanban-code) ([review](projects/ai-query--kanban-code.md#follow-up-change-review--2026-10-28)) restarts on transcript shrink but cannot detect a same-size rewrite and suppresses append errors. Require source-generation identity, confirmed durable writes and an explicit partial cursor. LF conversion changes offsets and hashes: retain the original bytes, record the migration and rebuild or translate cursors before resuming. [Graphify](https://github.com/safishamsi/graphify) ([review](projects/ai-agents-mem--graphify.md#follow-up-change-review--2026-10-28)) also demonstrates why a case-only path change must distinguish the same file from a distinct stale twin.

Code intelligence should narrow impact only after a positive proof. [CodeGraph](https://github.com/colbymchenry/codegraph) ([review](projects/ai-agents-mem--codegraph.md#follow-up-change-review--2026-10-28)) distinguishes valid empty alias captures from overlapping prefix/suffix matches; [GitNexus](https://github.com/abhigyanpatwari/GitNexus) ([review](projects/ai-agents-mem--gitnexus.md#follow-up-change-review--2026-10-28)) declines private-export certification on incomplete or ambiguous syntax. Preserve wider candidates when parsing cannot establish visibility. [Graft](https://github.com/NanoNets/Graft) ([review](projects/ai-agents-mem--graft.md#follow-up-change-review--2026-10-28)) pins runtime and grammar artifacts and frees parser trees; portability still requires target-runtime parity fixtures. [Commonplace](https://github.com/zby/commonplace) ([review](projects/ai-agents-mem--commonplace.md#follow-up-change-review--2026-10-28)) similarly separates near-verbatim resemblance from an exact quotation. A paraphrase and an exact quote need different verification claims.

Budgets must cover hidden work. [Cognee-rs](https://github.com/topoteretes/cognee-rs) ([review](projects/ai-agents-mem--cognee-rs.md#follow-up-change-review--2026-10-28)) bounds decomposition count but can invoke a model during context-only retrieval and load the whole graph in its batched path. [Hindsight](https://github.com/vectorize-io/hindsight) ([review](projects/ai-agents-mem--hindsight.md#follow-up-change-review--2026-10-28)) bounds concurrent refresh decisions but omits those decisions from reported usage; [OpenViking](https://github.com/volcengine/OpenViking) ([review](projects/ai-agents-mem--open-viking.md#follow-up-change-review--2026-10-28)) exempts queries from ingestion throttling without supplying a query ceiling there. Use separate bounded interactive/background pools and account for classification, expansion and retries. [OmniGraph](https://github.com/ModernRelay/omnigraph) ([review](projects/ai-agents-mem--omnigraph.md#follow-up-change-review--2026-10-28)) tracks import shares but intentionally delegates sink accounting; compose all pools before claiming a process-wide memory ceiling.

Keep configuration, derived content and activation distinct. [RAGFlow](https://github.com/infiniflow/ragflow) ([review](projects/ai-agents-mem--ragflow.md#follow-up-change-review--2026-10-28)) updates parser settings while explicitly preserving old extraction and requesting a reparse. [PAI](https://github.com/danielmiessler/Personal_AI_Infrastructure) ([review](projects/ai-agents-mem--pai-personal-ai-infrastructure.md#follow-up-change-review--2026-10-28)) supplies source hashes and deferred-memory instructions, but displayed caps and prompts do not enforce a budget. [Reef](https://github.com/Human-Agent-Society/reef) ([review](projects/ai-agents-mem--reef.md#follow-up-change-review--2026-10-28)) separates produced candidates from activation; Teamagent must apply its own review/regression rule instead of inheriting an always-activate default. [Tolaria](https://github.com/refactoringhq/tolaria) ([review](projects/ai-agents-mem--tolaria.md#follow-up-change-review--2026-10-28)) checks structured selection, text serialization and undo when formatting knowledge. [AgentMemory](https://github.com/rohitg00/agentmemory) ([review](projects/ai-agents-mem--agentmemory.md#follow-up-change-review--2026-10-28)) distinguishes registered from enabled and unknown health from success; that distinction belongs in passive catalogs. Counter-only changes in [Context Mode](https://github.com/mksglu/context-mode) ([review](projects/ai-agents-mem--context-mode.md#follow-up-change-review--2026-10-28)) and [Xerj](https://github.com/xerj-org/xerj) ([review](analyses/unreviewed/ai-agents-mem--xerj.md#follow-up-change-review--2026-10-28)) supply no new retrieval-quality evidence.

These are scoped static source/fixture reviews at the full commits linked in each report. No upstream runtime, inference, provider or benchmark was executed. The PAI aggregate diff was capped and selected files were expanded; the report preserves that scope.

### Additional scoped reviews from November 1

These newly reviewed sources complement the themes above. Each report states its selected source scope and limitations; listing it does not imply runtime integration or comparative quality.

- [midbrain-memory-mcp](https://github.com/midbrainai/midbrain-memory-mcp) ([scoped report](analyses/unreviewed/ai-agents-mem--midbrain-memory-mcp.md)).
- [building-a-coding-agent-from-scratch-course](https://github.com/decodingai-magazine/building-a-coding-agent-from-scratch-course) ([scoped report](analyses/unreviewed/ai-info--building-a-coding-agent-from-scratch-course.md)).
- [minipcm-ocr](https://github.com/openbmb/minicpm-ocr) ([scoped report](analyses/unreviewed/ai-query--minipcm-ocr.md)).
