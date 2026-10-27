# lightrag: change evidence

Source: [lightrag](https://github.com/HKUDS/LightRAG) · [Analysis](../../projects/ai-agents-mem--lightrag.md) · [memory](../../memory.md), [import-generation](../../import-generation.md), [models](../../models.md)

Generated: 2026-10-27T18:19:07.717Z. Status: **changed**. Reviewed SHA: `453dce83d6d0354a06e46c8d4029a0895c4e054b`; commit date: 2026-09-26T16:33:35+08:00; review date: 2026-10-04; observed SHA: `aaebfe1bb8d55deb6a4304d357a3bf4c92fcd40a`.

This generated packet is a bounded change locator, not a source review or a quality measurement. [Source comparison](https://github.com/HKUDS/LightRAG/compare/453dce83d6d0354a06e46c8d4029a0895c4e054b...aaebfe1bb8d55deb6a4304d357a3bf4c92fcd40a). Working-tree changes: false; shallow history: false; report changed since recorded review: false.

- Git discovery: unchanged; source lifecycle: active; upstream availability: available.

## Recent commits

- [aaebfe1bb8d5](https://github.com/HKUDS/LightRAG/commit/aaebfe1bb8d55deb6a4304d357a3bf4c92fcd40a) 2026-10-14T22:55:37+08:00: Merge pull request #4210 from ModestXin/fix/pgvector-filtered-ann
- [5a9200a74fba](https://github.com/HKUDS/LightRAG/commit/5a9200a74fba9fcf89ec0946d1f2f448deb2f633) 2026-10-14T22:38:01+08:00: docs(postgres): the outer transient retry still applies to the vector query
- [ff314f337605](https://github.com/HKUDS/LightRAG/commit/ff314f3376055f5e7bf1768bab94d7f9c9276785) 2026-10-14T22:21:16+08:00: refactor(postgres): keep the resort docstring to rules, restore a moved comment
- [eca55b1a8fcd](https://github.com/HKUDS/LightRAG/commit/eca55b1a8fcd7eaa2a2f0e9f448ed317d1f7248b) 2026-10-14T22:03:45+08:00: refactor(postgres): keep iterative-scan docstrings to the caller rules
- [f272c54d7cb7](https://github.com/HKUDS/LightRAG/commit/f272c54d7cb7dc9b0bffbc7652ab7b9118a6f4cc) 2026-10-14T21:27:05+08:00: docs(postgres): point the design note at the implemented helpers
- [fe14064459ef](https://github.com/HKUDS/LightRAG/commit/fe14064459ef0a437177b69820a58e9a0abd1d11) 2026-10-14T20:31:41+08:00: fix(postgres): apply iterative scan with SET LOCAL in the query transaction
- [b0df2fa7db0e](https://github.com/HKUDS/LightRAG/commit/b0df2fa7db0e267018bbed3f87f0caf19f80def0) 2026-10-14T18:39:23+08:00: docs(postgres): point many-workspace deployments at tenant-local Qdrant
- [62d932d65996](https://github.com/HKUDS/LightRAG/commit/62d932d6599605fe026087a29caf1c7884f3886b) 2026-10-14T18:34:12+08:00: fix(postgres): iterative scan for IVFFlat, re-sorted; document index choice
- [8ea255fd0d72](https://github.com/HKUDS/LightRAG/commit/8ea255fd0d725052383e5764ac853b3393225e2f) 2026-10-14T18:19:08+08:00: fix(postgres): decide hnsw iterative scan support from the pgvector version
- [19969b0cfe4c](https://github.com/HKUDS/LightRAG/commit/19969b0cfe4c504e9a1dcec22f79f91a345a040f) 2026-10-14T18:03:50+08:00: fix(postgres): apply hnsw iterative scan with a plain SET, HNSW only
- [f2f55ec42cb8](https://github.com/HKUDS/LightRAG/commit/f2f55ec42cb8aedcc6bd54191628820d562fb552) 2026-10-14T17:18:16+08:00: Merge pull request #4146 from AdalbertoDam/fix/milvus-force-create-keeps-existing
- [4d0afc1bc36e](https://github.com/HKUDS/LightRAG/commit/4d0afc1bc36e6a34d4a5895b68efe9413748627a) 2026-10-12T09:55:27+08:00: Update README.md
- [19fbd07d6a4e](https://github.com/HKUDS/LightRAG/commit/19fbd07d6a4ed130656ef9239bd63d010ece5115) 2026-10-10T23:21:38+08:00: fix(postgres): filtered ANN needs hnsw iterative scan (minority workspaces returned 0 rows)
- [b10d0b55dac7](https://github.com/HKUDS/LightRAG/commit/b10d0b55dac7a9693da2b781711ad6132d591506) 2026-10-02T10:21:02+02:00: fix(milvus): an initialization error never drops an existing collection

## Changed paths

- M: `README.md`
- A: `docs/design/PgVectorFilteredSearch.md`
- M: `env.example`
- M: `lightrag/kg/milvus_impl.py`
- M: `lightrag/kg/postgres_impl.py`
- M: `tests/kg/milvus_impl/test_milvus_migration_retry.py`
- A: `tests/kg/postgres_impl/test_postgres_iterative_scan.py`
