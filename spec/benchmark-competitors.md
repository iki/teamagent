# Memory benchmark reference selection

The sibling `ai-agents-mem` inventory contained 70 directories on 2026-10-04.
Selection is based on runnable, inspected retrieval paths relevant to source code
and documents. It is not a claim that these projects lead every memory benchmark.
Published vendor scores, especially conversation-memory scores, are not substituted
for measurements on this corpus.

## Measured implementations

| System                       | Exact implementation                                                                                                                                                        | Reference and license                                                                                                 | Why selected                                                                                                                                       |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| context-mode 1.0.169         | `ContentStore.index` and `searchWithFallback`; upstream Bun SQLite adapter, Porter and trigram FTS5 retrieval, reciprocal-rank fusion, proximity ranking and fuzzy fallback | [80d4e823](https://github.com/mksglu/context-mode/tree/80d4e823adebbe1e758b558522e3da20312a66cc), Elastic License 2.0 | A strong directly runnable lexical/context retrieval reference, with query processing absent from Teamagent's initial literal-term baseline.       |
| MemPalace 3.11.0 hybrid      | `mempalace.palace.get_collection` and `mempalace.searcher.search_memories(candidate_strategy="union", lang="en")`; Chroma backend and the actual local MiniLM encoder       | [43122aef](https://github.com/MemPalace/mempalace/tree/43122aefb8ed58e9fa4e1953e15ce70026339ec2), MIT                 | A directly runnable hybrid memory implementation combining dense retrieval with lexical candidates and ranking. No generation API is required.     |
| MemPalace lexical ablation   | The same collection and upstream `search_memories(vector_disabled=True, lang="en")`                                                                                         | Same commit and license                                                                                               | Separates lexical behavior from the semantic component. It is an ablation of MemPalace, not another independent memory system.                     |
| Chroma 1.5.7 dense substrate | The actual upstream Chroma HNSW/cosine query through MemPalace's collection, using the same MiniLM embeddings and stored passages                                           | [Chroma](https://github.com/chroma-core/chroma), Apache-2.0; package wheel digest recorded below                      | Isolates dense retrieval from MemPalace's hybrid ranking. It is a storage/retrieval substrate baseline, not a third complete agent-memory product. |

Both source checkouts must have the exact commit above and a clean working tree
before a driver executes. The reference source is imported in a trusted host
adapter, never copied into production or rewritten to resemble the competitor.
Upstream context-mode code is used locally under ELv2; it is not embedded in the
Teamagent product or offered as a hosted service. MemPalace's internal Python
fragment loader executes its own checked source, never benchmark input.

## Fair comparison and scope

Every measured engine receives the same immutable passage array and query strings,
including the same source/path prefix. Ground-truth labels and source-selection
oracles are not supplied to adapters. Search spans the entire corpus; the limit is
ten results. The adapter maps upstream result identities back to common passage IDs
and preserves upstream order. It does not implement a competing ranking algorithm.

Context-mode can subdivide a common passage by its own Markdown heading logic.
Repeated subchunks are collapsed to their original passage ID after retrieval.
MemPalace receives each common passage as one drawer with a unique `source_file`
identity so its per-source deduplication does not discard independent evidence
passages from the same original file. No generated closets or facts are created.
Thus this lane compares evidence retrieval over equal chunks, not each system's
native document parser, source synchronization, model-assisted consolidation or
end-to-end answer generator. Teamagent import/versioning checks are a separate lane.

The English MiniLM encoder has a 256-token input ceiling. The worker records the
number of common passages exceeding that limit; those embeddings are truncated
by the real upstream encoder, while lexical retrieval retains their full text.
Neither this model choice nor the English stopword setting is optimized against
held-out query scores. Multilingual model quality is not measured.

Each query records one initial observation and three warm repetitions. Initial
means the first measured invocation for that query after ingestion. It does not
mean a cold operating-system cache or an unloaded model. Python setup, including
MemPalace's model identity witness, is measured separately from ingestion.
Ingestion includes document embedding. The three Python modes share one index,
one embedding process and the same ingestion cost; do not sum or compare their
duplicated index timings as independent installations. Every query still runs the
actual encoder when required. No synthetic embeddings or cached answers are used.
Errors are recorded explicitly and cannot become successful empty results.

## Other candidates considered

| Reference           | Evidence and reason not selected for this local retrieval run                                                                                                                                                                                                                  |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| GNO 2.9.0           | Its package includes `node-llama-cpp` 3.20.0, native model/runtime setup and hybrid/reranking paths. It is a relevant further comparison; installing and validating another native inference stack was outside this run's bounded local setup. No lower-quality claim is made. |
| GitNexus            | The source package combines a native graph database, language-specific tree-sitter parsers and an ONNX embedding stack. Its code graph/impact analysis merits a separate native ingestion lane; reducing it to text search here would omit its distinctive behavior.           |
| Memvid 2.0.140      | The inspected Rust crate offers Tantivy lexical and optional ONNX/HNSW vector retrieval. A separate locked native build plus its own import pipeline is needed for a faithful comparison. It is not represented by a hand-written Tantivy imitation.                           |
| Mem0                | The inspected README requires an LLM for normal extraction, with a hosted default. No paid provider or substitute fake fact extractor was introduced.                                                                                                                          |
| Graphiti            | Its inspected README requires graph storage and LLM/embedding services, with optional local servers. The temporal knowledge-graph behavior is a different workload from immutable passage retrieval and needs a real configured generation model.                              |
| LightRAG / GraphRAG | Their graph/entity extraction and summary paths require a generation model. A dense-only surrogate would not constitute a benchmark of their main algorithms.                                                                                                                  |
| Hindsight           | Retain/recall/reflect, consolidation and temporal memory are relevant future tasks. Its published conversation-memory results are not measurements on these coding/document queries. No configured equivalent local generation stack was available in this run.                |
| PageIndex           | Its local mode still uses an LLM to refine/summarize and reason over the document tree. A fake deterministic LLM would invalidate the intended comparison.                                                                                                                     |

This selection leaves graph, generated semantic facts, model-based reranking,
multi-session user memory, distributed scaling and multilingual performance open.
Wins reported by this benchmark apply to the measured modes, corpus and machine.

## Reproduction and provenance

JavaScript dependencies remain owned by Aube. The Python stack is isolated in
`.cache/benchmark-python`, not the document converter environment. Setup uses
binary wheels only; no reference repository is installed editable or modified.

```powershell
python -m venv .cache/benchmark-python
.cache/benchmark-python/Scripts/python.exe -m pip install --only-binary=:all: --no-deps -r app/benchmark/competitors/requirements.lock
.cache/benchmark-python/Scripts/python.exe -I app/benchmark/competitors/setup.py
bun app/benchmark/competitors/context-mode.ts input.json context-mode-result.json
.cache/benchmark-python/Scripts/python.exe -I app/benchmark/competitors/mempalace.py input.json mempalace-result.json
```

Use Python 3.12.15 and Bun 1.4.2 for the recorded environment. The initial wheel
installation occupied 423,570,794 bytes. Exact installed versions, wheel URLs and
SHA-256 digests are retained in
[`data/benchmarks/setup/python-wheels.json`](../data/benchmarks/setup/python-wheels.json).
The exact dependency pins are in
[`requirements.lock`](../app/benchmark/competitors/requirements.lock).

The public Chroma ONNX `all-MiniLM-L6-v2` archive is 83,178,821 bytes, SHA-256
`913d7300ceae3b2dbc2c50d1de4baacab4be7b9380491c27fab7418616a16ec3`.
The 90,387,606-byte ONNX model is SHA-256
`4f148ba8ae9c2c7fbee4af2b132db8d06c6a6545b47fc83bbb98c3d22b8393e6`.
The tokenizer is pinned as well. Source URL, individual model asset hashes and
the observed 29,784.47 ms download/setup/witness time are retained in
[`data/benchmarks/setup/model.json`](../data/benchmarks/setup/model.json).
[MiniLM's model card](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2)
identifies the Apache-2.0 license and 256-token limit; no model weights are checked
into this project.

Telemetry is disabled, CPU inference is selected explicitly, and a Python audit
hook rejects outbound socket connection/DNS/send operations during measurement.
Model download occurs only in the separate explicit setup command. No credentials,
paid APIs, agent installations or production memory stores are used.

Peak resident memory is recorded for each complete worker process. The Python
measurement is explicitly shared across the three modes and their one encoder/index;
it is not three independent mode footprints. Index disk bytes are measured after
closing the upstream store. The Python audit guard covers Python socket operations,
not arbitrary native-extension traffic at an operating-system firewall boundary.

### Token-budget sensitivity

The initial corpus caused 3,356 of 3,747 passages to exceed MiniLM's 256-token
limit. Preserve that result and run a second input lane through
`app/benchmark/competitors/short-passages.py` to measure that limitation explicitly.
The preparer uses the exact pinned tokenizer offsets, preserves the source header,
counts special tokens, and limits the complete input to 256 tokens with at most 32
body tokens of overlap. It never inspects questions, relevance labels or answers.
All engines receive the resulting same shorter corpus. Parent-relative character
offsets and source line ranges remain recorded; unknown source byte columns are
not invented. Gold labels remain unchanged, so strict evidence groups split across
windows must be reported separately from aggregate anchor coverage.

```powershell
.cache/benchmark-python/Scripts/python.exe -I app/benchmark/competitors/test_short_passages.py
.cache/benchmark-python/Scripts/python.exe -I app/benchmark/competitors/short-passages.py corpus.json corpus-short.json
```

Before corpus execution, two independent fixture passages exercised all four
retrieval modes. Each returned the expected relevant passage first on both queries
with no adapter errors. That smoke check validates invocation and ID mapping; it
does not establish retrieval quality on the benchmark corpus.
