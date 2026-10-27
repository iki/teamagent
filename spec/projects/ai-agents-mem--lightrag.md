# lightrag

Entity/relation retrieval with separate low/high-level keywords and optional direct chunk retrieval.

Source: [lightrag](https://github.com/HKUDS/LightRAG) · Snapshot: `453dce83d6d0354a06e46c8d4029a0895c4e054b` · Category: `ai-agents-mem`.

Evidence level: **Source-reviewed; code was read, not executed or benchmarked.** Review date: 2026-10-04. Conclusions below apply to the inspected snapshot, not an unverified latest release. License and dependency compatibility require the separate catalog/license review before adoption.

## Verified source evidence

- [lightrag/operate.py:5320-5428](https://github.com/HKUDS/LightRAG/blob/453dce83d6d0354a06e46c8d4029a0895c4e054b/lightrag/operate.py#L5320-L5428)

The inspected query path distinguishes low-level keywords used for entity retrieval from high-level keywords used for relationship retrieval. Depending on mode, it embeds the original query and required keyword strings together, then dispatches to entity, relationship or both retrieval paths. Mix mode additionally retrieves vector chunks directly and records their source metadata. Local/global/hybrid/mix therefore designate materially different evidence paths rather than presentation options.

## Harness implications

Use graph-enriched retrieval as an optional arm alongside source chunks. Entity descriptions can help locate concepts and relationships, while direct chunks recover details omitted from an extracted graph. Cache shared embeddings within the query and keep arm contribution metadata. Expose a task-level choice between narrow entity questions, broad relationship questions and mixed retrieval; the answer generator should receive original source references in every mode.

## Limitations and tradeoffs

Graph extraction and keyword generation may lose exact identifiers, negative statements and numerical details. Modes named global here should not be assumed identical to another project's global community-summary search. This excerpt batches embeddings, but the local/global retrieval calls shown in the mixed branch are sequential; do not infer end-to-end parallelism from the batch optimization. A failed precompute logs a warning and downstream behavior depends on the called functions. No quality, cost or latency benchmark was reproduced.

## Adoption and validation

Keep as an alternative enrichment/retrieval backend, especially where multimodal processing already uses its stores. Compare it against the same source corpus under a lexical/vector baseline before adopting graph extraction broadly. Test exact code names, entity ambiguity, contradictory sources, sparse graphs, absent keywords and retrieval failures. Preserve raw chunks so rebuilding graph views under a new model never requires recovering data from generated summaries.

Related directions: [memory](../memory.md) · [import-generation](../import-generation.md) · [models](../models.md).

<!-- teamagent-analysis:start -->
Analysis metadata: source [lightrag](https://github.com/HKUDS/LightRAG); analyzed commit `453dce83d6d0354a06e46c8d4029a0895c4e054b`; commit date 2026-09-26T16:33:35+08:00; review date 2026-10-04; depth source-reviewed. [Maintenance record](../analyses/repos/ai-agents-mem--lightrag.md).
<!-- teamagent-analysis:end -->
