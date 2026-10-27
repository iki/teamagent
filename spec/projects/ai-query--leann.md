# leann

Configurable local ANN search with embedding recomputation, warmup and daemon lifecycle controls.

Source: [leann](https://github.com/yichuan-w/LEANN) · Snapshot: `37c5ae3b7a3fc42f73b16f2a834452c8f1d36b2e` · Category: `ai-query`.

Evidence level: **Source-reviewed; code was read, not executed or benchmarked.** Review date: 2026-10-04. Conclusions below apply to the inspected snapshot, not an unverified latest release. License and dependency compatibility require the separate catalog/license review before adoption.

## Verified source evidence

- [packages/leann-core/src/leann/api.py:1213-1315](https://github.com/yichuan-w/LEANN/blob/37c5ae3b7a3fc42f73b16f2a834452c8f1d36b2e/packages/leann-core/src/leann/api.py#L1213-L1315)

LeannSearcher loads index metadata containing backend, embedding model/mode/options and passage sources, resolves a registered search backend, and passes through warmup, daemon and backend configuration. Embedding recomputation is an explicit default-enabled flag. The constructor can warm the query embedding path; warmup failure is logged without preventing construction. Search exposes top-k, complexity, beam width, pruning ratio/strategy, metadata filters and vector weight. Optional query logging records query, embedding and result identifiers for replay.

## Harness implications

This is a candidate for storage-conscious local semantic retrieval, with an important systems tradeoff: reducing stored vector material can shift work into query-time embedding recomputation. The harness should treat index backend and embedding recipe as a compatibility contract and keep cold/warm measurements separate. A shared embedding daemon can reduce repeated startup but needs ownership, shutdown and resource accounting. Query replay can support evaluation if logs respect the same privacy scope as the source corpus.

## Limitations and tradeoffs

The reviewed constructor and search API expose the knobs; they do not establish claimed compression ratios or recall/latency advantages. Recomputing embeddings may be expensive on CPU-only laptops and depends on stable model artifacts. A warmup failure can leave the first real query slow or broken. Metadata filters need correctness checks at the actual backend boundary. Logging queries and embeddings is potentially sensitive and should remain an explicit option.

## Adoption and validation

Benchmark as an alternative vector backend after the initial SQLite/lexical path is established. Use representative laptop hardware, corpus sizes and churn rates; measure disk size, peak RAM, cold/warm p95 latency, energy and recall. Test missing metadata, moved passages, unavailable embedding models, backend migration, update consistency and permission filters. Adopt only if the measured storage benefit outweighs operational complexity.

Related directions: [memory](../memory.md) · [models](../models.md) · [import-generation](../import-generation.md).

<!-- teamagent-analysis:start -->
Analysis metadata: source [leann](https://github.com/yichuan-w/LEANN); analyzed commit `37c5ae3b7a3fc42f73b16f2a834452c8f1d36b2e`; commit date 2026-09-29T14:04:06-07:00; review date 2026-10-04; depth source-reviewed. [Maintenance record](../analyses/repos/ai-query--leann.md).
<!-- teamagent-analysis:end -->
