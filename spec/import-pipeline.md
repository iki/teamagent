# Resource import and knowledge production

This document specifies the import half of [import and generation](import-generation.md). Importing a resource should create a versioned, inspectable knowledge object and a durable job. Parsing, indexing and model enrichment may complete at different times. The user should be able to search the first useful representation quickly and see whether richer processing is still pending.

The architecture below is proposed. The linked reports provide the inspected code evidence and adoption limits; none of the parser quality or throughput claims have been benchmarked in this review.

## 1. One resource interface, several acquisition adapters

```text
ImportRequest {
  source: url | repository | file | folder | document_connector | native_asset,
  destination_scope, authorization_ref?, include_policy, refresh_policy,
  processing_profile, privacy_policy, budget, idempotency_key
}
ImportResult {
  resource_id, source_version_id, job_id, status,
  discovered_items, accepted_items, excluded_items, failed_items,
  available_representations, quality_flags, next_actions
}
```

The public action is “add resource.” Internally, acquisition is separate from interpretation. A URL adapter fetches bytes and headers; a repository adapter resolves a revision and file tree; a folder adapter enumerates approved paths; a document connector exports a version with permission metadata. The same source can later be interpreted by a new parser without reacquiring or mutating the original evidence.

Articles and posts default to a static captured version. Record source creation/publication time with its precision, assertion type and original metadata field; keep first acquisition and later local validation dates separate. Only explicit per-source refresh authority enables network revalidation. The implemented research-list spelling is `refresh=true` on the individual URL; optional `published=` is a labeled user assertion, not authenticated evidence. Missing/corrupt retained bytes require restoration or an explicit refresh decision, never a silent fetch. See [text maintenance](research-sync.md) for the current implementation and [memory imports](memory-imports.md) for the separate explicit runtime sync operation.

| Input | Required retained identity | First useful representation | Optional enrichment |
| --- | --- | --- | --- |
| URL | Requested/final URL, fetch time, response metadata, byte hash | Main text and links | Rendered DOM, screenshot, extracted entities |
| Repository | Upstream URL, commit/tree, file paths and hashes | File text and symbol inventory | Dependency/call graph, summaries, semantic index |
| File/document | Original bytes, media type, document version | Text/document tree | OCR, layout, table structure, captions |
| Image | Original bytes, dimensions, hash, source relationship | Metadata and thumbnail | OCR, caption, regions, visual embedding |
| Audio/video | Original asset and timeline | Transcript/segment index | Speakers, keyframes, audiovisual descriptions |
| Folder | Root resource ID, include/exclude policy, per-file versions | Incremental file catalog | Per-type parsing and indexes |
| Connected document | Provider item/version, permission scope and export identity | Provider-native structure or export | Derived formats and knowledge extraction |

Large collections should retain a manifest of excluded, unsupported, failed and pending items. “Import complete” must not mean “the parser quietly skipped some files.” Preserve partial success as a first-class status.

## 2. Resumable pipeline and source lineage

```text
discover -> authorize -> acquire -> fingerprint -> detect type -> parse
       -> normalize -> quality check -> chunk -> index -> enrich -> publish
```

Each transition stores an input hash, tool/version/options fingerprint, output references, status, retryability and diagnostics. Acquisition is idempotent for a source version. Parse and enrichment jobs are independently repeatable. A crash after writing assets but before index completion must leave a recoverable job, not an unexplained empty resource.

A continuation additionally binds the source generation, consumed complete boundary and admitted representation. [Utopia](https://github.com/deeplethe/utopia) ([review](projects/ai-agents-mem--utopia.md)) separates a consumed checkpoint from the time a sync ran; [Omnigraph](https://github.com/ModernRelay/omnigraph) ([review](projects/ai-agents-mem--omnigraph.md)) retains publication identity when an acknowledgment is uncertain. Never advance past a partially consumed timestamp group or recreate an ambiguous publication under a fresh identity. These upstream patterns define acceptance cases, not implementation claims for this proposed pipeline.

The canonical representation should contain a document tree and evidence spans. Preserve headings, lists, table cells, code blocks, page regions and media timestamps when available. Markdown is an accessible export, not a sufficient substitute for native structure. Chunk IDs should include source version and structural range; deduplicated text can share storage while retaining every origin.

Cache by content plus transformation contract. [RAG-Anything](https://github.com/HKUDS/RAG-Anything) ([report](projects/ai-query--rag-anything.md)) fingerprints content and parser configuration; its path/mtime-inclusive identity is conservative but reduces reuse after a move. [llm-wiki-compiler](https://github.com/atomicmemory/llm-wiki-compiler) ([report](projects/ai-agents-mem--llm-wiki-compiler.md)) additionally binds semantic extraction reuse to provider, model, prompt and schema. Use separate fingerprints for deterministic parsing, OCR, captioning, embeddings and concept extraction.

A generated caption, source summary, wiki page or graph relation must point to its source asset/spans and derivation run. Source deletion or permission revocation creates tombstones and schedules removal/recomputation of dependent views. Deleting the raw file while leaving its generated summary searchable is an incomplete deletion.

After parsing, validate coverage and asset closure independently of process success. [MinerU](https://github.com/opendatalab/MinerU) ([review](projects/ai-query--mineru.md)) distinguishes page previews and verifies referenced images; [Docling](https://github.com/docling-project/docling) ([review](projects/ai-query--docling.md)) retains unspecified/incomplete model endings; [OfficeParser](https://github.com/harshankur/officeParser) ([review](projects/ai-query--office-parser.md)) illustrates fallback when richer PDF structure cannot be recovered. Preserve unsupported spans and exact text-to-source mappings. [DeepTutor](https://github.com/HKUDS/DeepTutor) ([review](projects/ai-agents--deeptutor.md)) demonstrates that rendered quotation matching alone does not retain original offsets or exact subtitle cues. Published status requires validated output references, exclusive atomic storage and a manifest identifying any partial representation.

## 3. Manage import tools through a capability registry

Use a common manifest for built-in libraries, local executables, remote APIs and connector tools:

```text
ImportTool {
  id, version, origin, license_metadata, executable_or_endpoint,
  accepted_types, output_schema_version, deterministic,
  offline, requires_gpu, requires_model, credentials_ref?,
  network_scope, resource_limits, concurrency_limit,
  quality_profiles, probe, healthcheck, cancellation, timeout,
  cost_estimate, known_limitations, fixtures, promotion_status
}
```

Discovery should report available, installed-but-unhealthy, authenticated, unsupported and unknown separately. An executable on PATH is not proof that dependencies, OCR models or credentials work. Probe using bounded fixture inputs and record exact versions. Installation, upgrades and external-provider credentials are distinct lifecycle operations, not hidden side effects of reading a document.

Select tools using deterministic type/size rules first. [Magika](https://github.com/google/magika) ([report](projects/ai-query--magika.md)) contributes content-based type classification, including raw/final labels and overwrite reasons. It is a routing signal, not malware detection or a guarantee of parser compatibility. Confirm uncertain types through bounded parser acceptance and retain an unknown result when evidence conflicts.

For ambiguous choices, a small finite decision model can select among eligible parser profiles. The approach in [jev-ultrafast](https://github.com/browser-use/jev-ultrafast) ([report](projects/ai-query--jev-ultrafast.md)) validates bounded choices and probability structure. The harness must additionally calibrate confidence, support abstention, and enforce authorization before execution. Do not spend a general model call on a deterministic MIME dispatch.

## 4. Parser portfolio and adoption choices

| Role | Inspected candidate | Adoption decision |
| --- | --- | --- |
| Rich structured documents | [Docling](https://github.com/docling-project/docling), [report](projects/ai-query--docling.md) | Preferred optional adapter for layout/OCR/table-sensitive inputs |
| Broad lightweight conversion | [MarkItDown](https://github.com/microsoft/markitdown), [report](projects/ai-query--markitdown.md) | Baseline/fallback Markdown conversion with attempt diagnostics |
| Main-content HTML extraction | [Trafilatura](https://github.com/adbar/trafilatura), [report](projects/ai-query--trafilatura.md) | Default static-page extraction with coverage-driven escalation |
| Repository snapshot packaging | [Repomix](https://github.com/yamadashy/repomix), [report](projects/ai-query--repomix.md) | Explicit package/export helper with path confinement enabled |
| Structural code index | [GitNexus](https://github.com/abhigyanpatwari/GitNexus), [report](projects/ai-agents-mem--gitnexus.md) | Optional symbol/graph enrichment tied to exact source version |
| Multimodal graph enrichment | [RAG-Anything](https://github.com/HKUDS/RAG-Anything), [report](projects/ai-query--rag-anything.md) | Pilot for figures/tables; retain native assets and coordinates |
| Generic knowledge ETL | [Cognee](https://github.com/topoteretes/cognee), [report](projects/ai-agents-mem--cognee.md) | Optional graph/summary stages with provenance explicitly enabled |
| Compiled knowledge pages | [llm-wiki-compiler](https://github.com/atomicmemory/llm-wiki-compiler), [report](projects/ai-agents-mem--llm-wiki-compiler.md) | Adopt incremental compilation/versioning pattern; bounded pilot |

Do not install all candidates into the core process. Wrap them behind the common contract and compare representative fixtures. A plain text file should not trigger OCR or a vision model. A digital PDF with extractable text should reach search before optional visual analysis. Tables requiring exact numerical answers should retain structured cells and page evidence rather than only prose descriptions.

[Docling](https://github.com/docling-project/docling) ([report](projects/ai-query--docling.md)) exposes page/file limits and partial-success outcomes, but its inspected default limits are effectively unbounded. Set harness quotas. [MarkItDown](https://github.com/microsoft/markitdown) ([report](projects/ai-query--markitdown.md)) provides explicit acceptance/priority/fallback behavior; preserve failed converter diagnostics so a successful generic fallback does not hide quality loss.

[Trafilatura](https://github.com/adbar/trafilatura) ([report](projects/ai-query--trafilatura.md)) escalates when extraction appears inadequate. Extend that pattern to a wider ladder: static fetch → extraction → rendered browser → OCR/vision. A larger extracted body is not necessarily better; consent screens, related articles and navigation can inflate length. Keep document-specific quality checks.

## 5. Repository and folder handling

Treat repositories as code data during import. Do not execute repository setup, build scripts, plugins or imported instructions merely to inspect source. Resolve a snapshot and apply include/exclude policy before parsing. Preserve exact bytes for source citations; any compressed package is a derived representation.

[Repomix](https://github.com/yamadashy/repomix) ([report](projects/ai-query--repomix.md)) includes safety hooks and omission/token accounting, but its confinement option is off by default for ordinary callers. Enable confinement for the harness, resolve symlinks/junctions before access, and reject traversal outside the authorized resource. Secret scanning reduces accidental disclosure but cannot guarantee a bundle is safe to send to a model.

Use file hashes to skip unchanged content and path-plus-symbol identities to update code indexes. Renames should preserve lineage where determinable. Parser/language versions belong in the index fingerprint. [GitNexus](https://github.com/abhigyanpatwari/GitNexus) ([report](projects/ai-agents-mem--gitnexus.md)) separates ingestion phases, including optional expensive graph analyses. [jevgrep](https://github.com/dzhng/jevgrep) ([report](projects/ai-query--jevgrep.md)) demonstrates rechecking hashes before using model-selected source evidence. Apply the same freshness check before edits.

Folder refresh is a declared policy: manual refresh, periodic reconciliation or filesystem events with debounce. Event watchers are hints; periodically reconcile against an authoritative manifest because events can be lost. Bound depth, file count, archive expansion, file size and concurrent jobs. Retain why a file was excluded so changing a policy can schedule it later without guessing.

## 6. Network, permissions and untrusted content

Acquisition adapters must preserve provider authorization and content scope. Follow redirects under the same destination policy, constrain local/private network access for remote URL imports, limit response size/time, and keep credentials in references rather than in job payloads or derived documents. Connector revocation must disable refresh and new reads even if local metadata remains.

Validate the actual connection destination, not only a preflight DNS answer. [MCP Inspector](https://github.com/modelcontextprotocol/inspector) ([review](projects/ai-query--mcp-inspector.md)) pins direct lookup results and checks redirects while explicitly acknowledging proxy-controlled DNS as a separate boundary. Do not inherit its intentionally broad local-network policy into arbitrary URL import. Final-URL provenance from [Trafilatura](https://github.com/adbar/trafilatura) ([review](projects/ai-query--trafilatura.md)) records what was fetched; it does not authorize that destination or turn a static article into a refreshable source.

Imported text, embedded document prompts and repository instructions are source material. They cannot change the harness system policy, authorize a new destination or request tool execution. Tag prompt-like content as data and keep it out of skill/system instruction channels. Parsing workers need bounded filesystem/network access, resource limits and cancellation; parser extensibility expands the worker's attack surface.

Rights, license and sensitivity metadata should flow with the resource. Reusing imported content for retrieval, displaying an excerpt, training a skill, generating media and publishing an artifact are distinct purposes. This architecture records policy decisions rather than assuming one import permission authorizes every later use.

## 7. Search publication and knowledge compilation

Publish representations in stages: metadata registered, basic text searchable, semantic index ready, enrichment ready. The UI should show a concise resource card with source, freshness, accessible representations and unresolved issues. Users can retry one stage, choose a different parser, inspect extracted output or remove a resource.

[QMD](https://github.com/tobi/qmd) ([report](projects/ai-query--qmd.md)) is a suitable local retrieval adapter after text normalization. [LightRAG](https://github.com/HKUDS/LightRAG) ([report](projects/ai-agents-mem--lightrag.md)) and [GraphRAG](https://github.com/microsoft/graphrag) ([report](projects/ai-agents-mem--graphrag.md)) are optional derived indexes for relational and broad corpus questions. [LEANN](https://github.com/yichuan-w/LEANN) ([report](projects/ai-query--leann.md)) is a vector-backend experiment whose disk/compute tradeoff must be measured.

The [LLM Wiki pattern](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f) ([design report](projects/ai-agents-mem--xx-2604-llm-wiki.karpathy.md)) suggests maintaining topic pages and a content index. Implement those as dependency-aware derived artifacts, with explicit citation validation and conflict handling. Good generated answers may become candidate knowledge; they should not automatically count as independent evidence supporting themselves.

## 8. Acceptance suite and delivery order

Build a fixture corpus containing digital/scanned PDFs, complex tables, diagrams, slides, spreadsheets, multilingual documents, malformed inputs, misleading file extensions, static/dynamic pages, archives and mixed-language repositories. Include exact expected evidence spans for a representative subset.

Measure acquisition completeness, extraction coverage, table/numerical fidelity, citation accuracy, parser failure visibility, time to first searchable text, total completion time, memory/GPU use and cost. Test retries, cancellation, restart, source updates, permission revocation and deletion propagation. Separate cold-model startup from warm throughput. Require every candidate parser to pass the same contract tests before promotion.

Ship text/URL/file/folder import and manifest search first. Add rich documents and code structure next. Add multimodal extraction and compiled wiki/graph enrichment when a task suite demonstrates benefit. The [memory architecture](memory.md) owns canonical evidence and derived-state semantics; [evolution](evolution.md) owns evaluation and promotion of better parser profiles. Generation should reuse this registry/job/artifact model while tracking prompts, seeds, provider/model versions and output rights in its own contracts.

## October source refresh: parser status and options

The refreshed [Docling report](projects/ai-query--docling.md) ([source](https://github.com/docling-project/docling)) distinguishes partial success from failure: `raises_on_error=True` does not make every returned result complete. Inspect result status and covered units before publication. Pipeline-cache identity must retain concrete nested backend/options types; use a separate cryptographic hash for source bytes and exported artifacts.

[Text maintenance](research-sync.md) retains explicit selected-post grouping and versioned image exports. Optional official X API lookup requests post/article fields from the source service; an undocumented article object is retained as evidence with an unsupported-body result rather than guessed into a successful conversion. See the [official data dictionary](https://docs.x.com/x-api/fundamentals/data-dictionary) and [lookup contract](https://docs.x.com/x-api/posts/lookup/introduction).

## External-update synthesis: 2026-11-01 — representation fidelity and static repair

[Docling](https://github.com/docling-project/docling) ([review](projects/ai-query--docling.md)) preserves link targets, numbering overrides and encoding distinctions in the inspected converters. [Browser Harness](https://github.com/browser-use/browser-harness) ([review](projects/ai-query--browser-harness.md)) distinguishes RSS subsets from larger page datasets and labels pagination/traffic limitations. Preserve structural provenance alongside text, including unresolved links and omitted images; extracted links are data, not authority to fetch them. Claimed upstream field tests are not our reproduced measurements.

For static articles, use the explicit offline derivative reconciliation in [source maintenance](research-sync.md#explicit-local-derivative-reconciliation). Verify original-byte equality, source identity, exact prior record and new export before adopting a repaired version. Preserve warning-level social/PDF limits and immutable prior versions. The [eleven-source reconciliation](analyses/texts/reconciliation-2026-11-01.md) distinguishes recovered assets, alternate extraction and heuristics; no text-volume score upgrades fidelity automatically.

[Last30Days](https://github.com/mvanhorn/last30days-skill) ([review](projects/ai-skills--query-last30days.md)) validates supplied plans before deriving cache identity, rejects invalid plans without invoking its paid internal planner, and reports unavailable requested sources explicitly. Recheck stop conditions after queue admission, reserve downstream time explicitly, and retain an outer input/deadline bound independent of a stage's timing heuristic.

[Open Notebook](https://github.com/lfnovo/open-notebook) ([review](analyses/unreviewed/ai-agents--open-notebook.md)) validates supplied upload paths and records processing state before enqueue, but the inspected upload path still reads the body into memory. Its network policy deliberately allows local/private services, while actual source fetching is delegated to another package. Keep public-URL import policy distinct from authorized local-service access, and verify the effective converter, connection-time destination and size/resource bounds.

[Sim](https://github.com/simstudioai/sim) ([review](analyses/unreviewed/ai-agents-swarm--sim.md)) provides a concrete provenance-based split: content-fetch input does not inherit private-host, loopback or HTTP allowances from operator-configured services, and unknown profiles take the strict content-fetch policy. Its configuration cache invalidates on relevant policy changes. Preserve the approved DNS address through the actual transport; reviewing the validator without its classifier and callers does not establish end-to-end rebinding protection. Import extraction must not promote a discovered URL into operator authority, and policy changes must invalidate cached admission independently of static article content.
