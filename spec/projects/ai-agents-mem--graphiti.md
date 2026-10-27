# graphiti

Episode-grounded temporal relationships and bounded incremental saga summaries.

Source: [graphiti](https://github.com/getzep/graphiti) · Snapshot: `8ce6d633bdcd3d178b3a47bc25b105dce106a754` · Category: `ai-agents-mem`.

Evidence level: **Source-reviewed; the files below were read, not executed or benchmarked.** Review date: 2026-10-24. The inspected checkout was clean. This updates the 2026-10-04 review of `3c427640abf909f12f71f963fce15eb514a3c493`; the previous report is preserved in [review history](../analyses/history/ai-agents-mem--graphiti/). License and dependency compatibility still require a separate adoption review.

## Verified source evidence

- [Relationship evidence and temporal fields](https://github.com/getzep/graphiti/blob/8ce6d633bdcd3d178b3a47bc25b105dce106a754/graphiti_core/edges.py#L263-L287).
- [Incremental saga watermark semantics](https://github.com/getzep/graphiti/blob/8ce6d633bdcd3d178b3a47bc25b105dce106a754/graphiti_core/graphiti.py#L590-L608) and [prompt bounding, coverage counters and persistence](https://github.com/getzep/graphiti/blob/8ce6d633bdcd3d178b3a47bc25b105dce106a754/graphiti_core/graphiti.py#L727-L799).
- [Bulk entity and relationship resolution](https://github.com/getzep/graphiti/blob/8ce6d633bdcd3d178b3a47bc25b105dce106a754/graphiti_core/graphiti.py#L1140-L1248) and [persistence of resolved plus invalidated relationships](https://github.com/getzep/graphiti/blob/8ce6d633bdcd3d178b3a47bc25b105dce106a754/graphiti_core/graphiti.py#L1747-L1783).

EntityEdge retains supporting episode IDs and distinct validity, invalidation, expiration and reference timestamps. The field descriptions distinguish future plans from their future occurrence date and exclude soft deadlines from automatic invalidation. These are model/schema instructions, not proof that extraction reliably follows them. The bulk path calls relationship resolution and persists `resolved_edges + invalidated_edges`, so temporal invalidation is not restricted to single-episode imports in this inspected implementation.

Saga summarization uses separate ingestion-time and event-time watermarks. It measures rendered UTF-8 prompt bytes including schema overhead, removes later episodes that do not fit, records selected/skipped episode counts, and can truncate a single oversized episode. After generation it advances the ingestion watermark through selected episodes and advances the event watermark monotonically to the latest selected reference time. This is stronger bookkeeping than treating summary creation time as source recency.

## Harness implications

Use temporal graph enrichment for changing relationships, not as a prerequisite for all document or code retrieval. Keep episode evidence and extracted assertions distinct. A derived summary should retain both ingestion progress and the event-time range of its sources, plus explicit source coverage. For Teamagent, use a deterministic continuation key including source identity and position; a timestamp alone cannot establish complete processing. Record truncation offsets or coverage intervals so a later run can recover the unprocessed suffix of a large episode.

## Limitations and adoption

The inspected summary path truncates oversized content and advances a timestamp; this review does not establish lossless handling of an omitted suffix or equal-timestamp episodes. An existing summary in the prompt also does not guarantee facts survive repeated summarization. Extraction, identity resolution and contradiction judgments remain model-dependent. Graph databases, embeddings and optional community processing add ingest cost and operational state.

Prototype the temporal adapter after immutable source versions and lexical retrieval. Require tests for contradictory dates, future commitments, same-name entities across workspaces, out-of-order imports, identical ingestion timestamps, oversized UTF-8 episodes and interrupted persistence. Measure relational-answer benefit separately from basic lookup. Do not advertise automatic conflict correctness or lossless evolving memory based only on these fields and control-flow checks.

Related directions: [memory](../memory.md) · [evolution](../evolution.md).

<!-- teamagent-analysis:start -->
Analysis metadata: source [graphiti](https://github.com/getzep/graphiti); analyzed commit `8ce6d633bdcd3d178b3a47bc25b105dce106a754`; commit date 2026-10-24T05:17:10Z; review date 2026-10-24T06:36:54.441Z; depth source-reviewed. [Maintenance record](../analyses/repos/ai-agents-mem--graphiti.md).
<!-- teamagent-analysis:end -->
