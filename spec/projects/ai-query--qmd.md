# qmd

Local hybrid document retrieval with typed expansion, weighted rank fusion and bounded reranking.

Source: [qmd](https://github.com/tobi/qmd) · Snapshot: `26b703c5daa8037df089a8104cbf7eeab4e51874` · Category: `ai-query`.

Evidence level: **Source-reviewed; code was read, not executed or benchmarked.** Review date: 2026-10-04. Conclusions below apply to the inspected snapshot, not an unverified latest release. License and dependency compatibility require the separate catalog/license review before adoption.

## Verified source evidence

- [src/store.ts:5544-5726](https://github.com/tobi/qmd/blob/26b703c5daa8037df089a8104cbf7eeab4e51874/src/store.ts#L5544-L5726)

The hybrid query implementation first runs lexical search with collection and metadata filters already applied. A strong top lexical score and score gap skip query expansion, except when the caller supplied an explicit intent. Expansion results are typed: lex goes to full-text search, while vec and hyde go to vector search. The original query also reaches vector retrieval. Embeddings for the vector queries are batched, and original-query lists receive twice the reciprocal-rank-fusion weight of expansion lists. Expansion cache entries that produce no results are invalidated. Candidates are capped before documents are chunked for reranking; this avoids passing every full document through the expensive stage.

## Harness implications

This is the strongest inspected reference for a local document-search baseline and a cost-aware retrieval ladder. Preserve explicit query intent, backend contribution traces, document identity and source offsets in the harness result contract. Expose lexical-only, hybrid and high-recall modes so routing can select the cheapest sufficient path. Generated hypothetical text is a retrieval probe, never evidence to cite. Collection/context metadata should supplement content rather than become hidden authorization.

## Limitations and tradeoffs

The examined function demonstrates pipeline mechanics, not measured superiority on this user's corpora. The lexical confidence thresholds, fusion weights and candidate limit need calibration for multilingual notes, OCR noise and source code. Best-chunk selection by keyword overlap can miss an answer requiring two distant sections. Local model availability still consumes disk, memory and cold-start time; a local search claim does not make every optional provider configuration private.

## Adoption and validation

Adopt the algorithm and expose QMD as an optional retrieval adapter. Start with keyword retrieval and add vectors/reranking only when measured recall or paraphrase handling justifies them. Require stale-index detection, embedding-version compatibility and a separate permission filter. Validate against exact-name lookups, paraphrases, mixed Czech/English content, deleted documents, and unanswerable questions.

Related directions: [memory](../memory.md) · [decisions](../decisions.md) · [models](../models.md).
