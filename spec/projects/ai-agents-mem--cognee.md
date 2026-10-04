# cognee

Composable document-to-knowledge pipeline with optional provenance and contradiction stages.

Source: [cognee](https://github.com/topoteretes/cognee) · Snapshot: `b32d8afc59e1064d9291b9828a8a147be9cc8bab` · Category: `ai-agents-mem`.

Evidence level: **Source-reviewed; code was read, not executed or benchmarked.** Review date: 2026-10-04. Conclusions below apply to the inspected snapshot, not an unverified latest release. License and dependency compatibility require the separate catalog/license review before adoption.

## Verified source evidence

- [cognee/api/v1/cognify/cognify.py:565-643](https://github.com/topoteretes/cognee/blob/b32d8afc59e1064d9291b9828a8a147be9cc8bab/cognee/api/v1/cognify/cognify.py#L565-L643)

The default cognify task list classifies documents, splits them into chunks, extracts graph entities/relationships plus chunk summaries, then persists data points and embeddings. Tasks declare whether they need an LLM. Provenance recording and contradiction detection are appended conditionally from configuration. Temporal contradiction resolution is appended only for relationships explicitly declared single-valued; it executes after new facts are stored and is marked as not requiring an LLM. Chunk size and batch size are resolved configuration values rather than constants buried in the extractor.

## Harness implications

Borrow the typed task graph for import orchestration: deterministic classification and chunking should remain separable from model extraction. Each stage should carry input hashes, versioned options, cost and resumable status. Model-dependent graph enrichment belongs in a later optional stage so users can search imported files before a full knowledge graph is ready. A declared functional relationship, such as one current owner in a particular scope, makes deterministic supersession possible; that rule cannot safely be inferred for every relation.

## Limitations and tradeoffs

The presence of provenance and contradiction tasks does not mean they are enabled in a deployment. The inspected code explicitly gates them. LLM-generated summaries and graphs can add unsupported relationships, so raw sources and spans remain authoritative. Batch defaults are not portable capacity guarantees. A general knowledge pipeline also needs connector permissions, deletion propagation, entity namespaces and model migration policy outside this task-list function.

## Adoption and validation

Use as an optional enrichment backend and architecture reference rather than requiring its whole stack for the first local harness. Test failed-stage replay, partial batches, provenance configuration off/on, reimport after model changes, and functional versus multi-valued relationships. Compare graph-enhanced answers with the same corpus searched through lexical/vector retrieval to measure whether enrichment actually helps.

Related directions: [memory](../memory.md) · [import-generation](../import-generation.md) · [evolution](../evolution.md).
