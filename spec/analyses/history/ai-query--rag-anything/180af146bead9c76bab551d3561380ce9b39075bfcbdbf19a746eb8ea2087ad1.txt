# rag-anything

Multimodal-derived chunks and graph entities with content/configuration-aware parse caching.

Source: [rag-anything](https://github.com/HKUDS/RAG-Anything) · Snapshot: `1f73f0154c48b3d616674608af98748585b856f3` · Category: `ai-query`.

Evidence level: **Source-reviewed; code was read, not executed or benchmarked.** Review date: 2026-10-04. Conclusions below apply to the inspected snapshot, not an unverified latest release. License and dependency compatibility require the separate catalog/license review before adoption.

## Verified source evidence

- [raganything/processor.py:54-125](https://github.com/HKUDS/RAG-Anything/blob/1f73f0154c48b3d616674608af98748585b856f3/raganything/processor.py#L54-L125)
- [raganything/modalprocessors.py:532-612](https://github.com/HKUDS/RAG-Anything/blob/1f73f0154c48b3d616674608af98748585b856f3/raganything/modalprocessors.py#L532-L612)

The parse cache key incorporates absolute source path, modification time, a streaming SHA-256 content fingerprint, parser identity, parse method and relevant parser options; this configuration is serialized into a cache-key digest. The multimodal processor creates a token-counted text chunk, writes it to chunk and vector stores, then writes a graph entity whose source_id points back to that chunk. Entity vectors include a generated name and summary. The method finally invokes additional extraction over the chunk.

## Harness implications

Multimodal knowledge should have both native assets and searchable derived descriptions. Index an image region, table or equation through OCR/caption/structured data, but keep a link to the original page, asset and coordinates. The code illustrates why provenance must connect modal-derived entities to retrievable source chunks. Parsing and semantic enrichment need distinct caches: changing the parser or vision model can invalidate a description even if the source bytes remain identical.

## Limitations and tradeoffs

Generated descriptions can hallucinate visible details or lose table relationships, and content-only chunk identity can merge identical descriptions from different sources unless provenance remains multi-valued. The examined upserts occur across several stores; a partial failure requires reconciliation. Path-inclusive cache identity reduces reuse after moving an unchanged document. Neither a content fingerprint nor a successful embedding proves extraction correctness or safe model access to private assets.

## Adoption and validation

Pilot for image/table-heavy knowledge collections after text ingestion is stable. Keep modality-specific schemas and an optional direct-vision retrieval path for evidence verification. Test duplicate captions in different documents, moved files, parser-version changes, failed graph writes, figure captions that contradict images and exact numerical table questions. Compare derived-text-only answers with answers that reopen the native asset.

Related directions: [import-generation](../import-generation.md) · [memory](../memory.md) · [models](../models.md).
