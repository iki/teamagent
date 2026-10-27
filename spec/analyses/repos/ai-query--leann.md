# leann: change evidence

Source: [leann](https://github.com/yichuan-w/LEANN) · [Analysis](../../projects/ai-query--leann.md) · [memory](../../memory.md), [models](../../models.md), [import-generation](../../import-generation.md)

Generated: 2026-10-27T18:19:07.717Z. Status: **changed**. Reviewed SHA: `37c5ae3b7a3fc42f73b16f2a834452c8f1d36b2e`; commit date: 2026-09-29T14:04:06-07:00; review date: 2026-10-04; observed SHA: `c443fc418417f7f2f84d6e1a30115f5e13376ed3`.

This generated packet is a bounded change locator, not a source review or a quality measurement. [Source comparison](https://github.com/yichuan-w/LEANN/compare/37c5ae3b7a3fc42f73b16f2a834452c8f1d36b2e...c443fc418417f7f2f84d6e1a30115f5e13376ed3). Working-tree changes: false; shallow history: false; report changed since recorded review: false.

- Git discovery: updated; source lifecycle: active; upstream availability: available.

## Recent commits

- [c443fc418417](https://github.com/yichuan-w/LEANN/commit/c443fc418417f7f2f84d6e1a30115f5e13376ed3) 2026-10-27T23:34:38+08:00: fix(release): install uv before lockfile update
- [a5f3bbc935ee](https://github.com/yichuan-w/LEANN/commit/a5f3bbc935eed3161a6f1bd6251fa334893a1036) 2026-10-27T23:34:12+08:00: chore: release v0.3.9
- [a63f484a0b00](https://github.com/yichuan-w/LEANN/commit/a63f484a0b00627fbc641b500ee377d35344eb72) 2026-10-26T15:36:18-07:00: fix(release): publish all backends and test loopback bind (#447)
- [0463b761916d](https://github.com/yichuan-w/LEANN/commit/0463b761916d87cb737462b2c87f102f333953bc) 2026-10-26T15:35:47-07:00: fix(core): refuse to load a custom encoder as a vanilla BertModel (#445)
- [37795892341d](https://github.com/yichuan-w/LEANN/commit/37795892341d698ec09ad2ce1eb23cda3d39227f) 2026-10-26T15:35:35-07:00: fix: compare numeric metadata strings by value (#446)
- [b51ddc0b1f80](https://github.com/yichuan-w/LEANN/commit/b51ddc0b1f8085eefe6d4c3209d5cdb71ddecba1) 2026-10-23T23:58:25-07:00: fix(chunking): keep first line of AST chunks that contains '\|' (#444)
- [db2609817e7b](https://github.com/yichuan-w/LEANN/commit/db2609817e7b1d0dec48adad38f6bbc7d5d73b26) 2026-10-23T23:57:01-07:00: fix(core): drop the build template from query embeddings on the fallback path (#442)
- [25141f6c93b0](https://github.com/yichuan-w/LEANN/commit/25141f6c93b046812d434218ed543b05210ab32d) 2026-10-23T23:55:26-07:00: docs(search): restore ZMQ thread-safety warning (#441)
- [287859de0b53](https://github.com/yichuan-w/LEANN/commit/287859de0b53cc313259948195563b83237b584c) 2026-10-23T23:54:54-07:00: Fix --use-ocr PDF loading (#440)
- [b415df84ec49](https://github.com/yichuan-w/LEANN/commit/b415df84ec49fc13c36e3142fba3e8494216d4d1) 2026-10-21T00:16:04-07:00: Implement OCR support and benchmark evaluation for PDF extraction (#190)
- [c6fa59b33b78](https://github.com/yichuan-w/LEANN/commit/c6fa59b33b78bf4cb294cf3ba354d40b6e031607) 2026-10-20T22:06:31-07:00: polish runner and add result (#318)
- [ae9fa67bc8dc](https://github.com/yichuan-w/LEANN/commit/ae9fa67bc8dcbca1606a6eea950478c3957cd413) 2026-10-20T22:02:42-07:00: docs: update repository URLs to StarTrail-org/LEANN (#426)
- [1add62fa8114](https://github.com/yichuan-w/LEANN/commit/1add62fa811400ff96f6b9e32e47087f47165fc5) 2026-10-20T22:02:39-07:00: chore: untrack the generated .leann index store (#439)
- [115254ebe89b](https://github.com/yichuan-w/LEANN/commit/115254ebe89bf650372a3d5a34e5c3f2ee1af81f) 2026-10-20T16:47:28-07:00: feat(search): cache query embeddings per searcher (#436)
- [0710a9e136a8](https://github.com/yichuan-w/LEANN/commit/0710a9e136a8a02ff0a404adc1ca51510129c675) 2026-10-20T16:11:23-07:00: fix(deps): pin pymupdf below 2.0 (#438)
- [bcd8ac3d2a61](https://github.com/yichuan-w/LEANN/commit/bcd8ac3d2a61f0b30606e9dc6c483d4e5b6b3664) 2026-10-20T12:41:36-07:00: perf: lazy-load the public API so importing leann.mcp stays lightweight (#437)
- [7fcb3b548fe2](https://github.com/yichuan-w/LEANN/commit/7fcb3b548fe274e981e492624f9206a151819150) 2026-10-15T20:50:53-07:00: Optimize recompute latency: Add query embedding cache and reusable ZMQ connections (#226)
- [00710edff4ab](https://github.com/yichuan-w/LEANN/commit/00710edff4aba84c41f4adfc75b79175b28132f2) 2026-10-12T14:15:10-07:00: fix(core): fit chunk sizes to the embedding model's sequence limit (#434)
- [035a92c64a7c](https://github.com/yichuan-w/LEANN/commit/035a92c64a7cc5cc7a8bb0554455eabdd8589a83) 2026-10-12T13:22:22-07:00: feat: add an opt-in Parallel MCP web document reader (#433)
- [7f51f6cfcf70](https://github.com/yichuan-w/LEANN/commit/7f51f6cfcf70646a249fa9f3be002ae08128cb61) 2026-10-08T20:25:51-07:00: fix(core): keep index metadata when MCP status counts passages (#430)
- [b9da860e80ca](https://github.com/yichuan-w/LEANN/commit/b9da860e80ca4542547c7c7915c47e94e27d85f0) 2026-10-08T20:25:37-07:00: fix(core): let update_index choose passage IDs for unclaimed chunks (#428)

## Changed paths

- M: `.github/workflows/build-reusable.yml`
- M: `.github/workflows/release-manual.yml`
- M: `.gitignore`
- M: `CLAUDE.md`
- M: `README.md`
- M: `apps/document_rag.py`
- M: `apps/multimodal/vision-based-pdf-multi-vector/colqwen_forward.py`
- A: `apps/parallel_data/__init__.py`
- A: `apps/parallel_data/__main__.py`
- A: `apps/parallel_data/parallel_mcp_reader.py`
- A: `apps/parallel_data/requirements.txt`
- A: `apps/parallel_rag.py`
- M: `benchmarks/contextbench/README.md`
- M: `benchmarks/contextbench/scripts/auto_run.py`
- M: `benchmarks/contextbench/scripts/batch_run_random.py`
- M: `benchmarks/contextbench/scripts/batch_run_selected.py`
- A: `benchmarks/contextbench/scripts/contextbench_official_eval_claude_baseline.jsonl`
- A: `benchmarks/contextbench/scripts/contextbench_official_eval_claude_leann.jsonl`
- M: `benchmarks/contextbench/scripts/prepare_repos_with_leann.py`
- M: `benchmarks/financebench/verify_recall.py`
- M: `benchmarks/update/bench_hnsw_rng_recompute.py`
- M: `benchmarks/update/bench_update_vs_offline_search.py`
- M: `demo.ipynb`
- M: `docker/Dockerfile`
- M: `docker/Dockerfile.cpu`
- M: `docker/README.md`
- M: `docs/CHANGELOG.md`
- M: `docs/COLQWEN_GUIDE.md`
- M: `docs/CONTRIBUTING.md`
- M: `docs/RELEASE.md`
- M: `docs/ast_chunking_guide.md`
- M: `docs/configuration-guide.md`
- M: `docs/metadata_filtering.md`
- A: `docs/parallel-mcp.md`
- M: `docs/user-scripts-tr.md`
- M: `docs/user-scripts.md`
- M: `llms.txt`
- M: `packages/leann-backend-diskann/leann_backend_diskann/diskann_backend.py`
- M: `packages/leann-backend-diskann/leann_backend_diskann/diskann_embedding_server.py`
- M: `packages/leann-backend-diskann/pyproject.toml`
- M: `packages/leann-backend-flashlib-ivf/pyproject.toml`
- M: `packages/leann-backend-flashlib/pyproject.toml`
- M: `packages/leann-backend-hnsw/leann_backend_hnsw/hnsw_embedding_server.py`
- M: `packages/leann-backend-hnsw/pyproject.toml`
- M: `packages/leann-backend-ivf/pyproject.toml`
- M: `packages/leann-core/README.md`
- M: `packages/leann-core/pyproject.toml`
- M: `packages/leann-core/src/leann/__init__.py`
- M: `packages/leann-core/src/leann/api.py`
- M: `packages/leann-core/src/leann/chunking_utils.py`
- M: `packages/leann-core/src/leann/cli.py`
- M: `packages/leann-core/src/leann/embedding_compute.py`
- A: `packages/leann-core/src/leann/embedding_server_endpoint.py`
- M: `packages/leann-core/src/leann/mcp.py`
- M: `packages/leann-core/src/leann/metadata_filter.py`
- M: `packages/leann-core/src/leann/searcher_base.py`
- M: `packages/leann-mcp/README.md`
- M: `packages/leann/pyproject.toml`
- M: `pyproject.toml`
- M: `scripts/bump_version.sh`
- M: `skills/leann-memory/README.md`
- M: `tests/test_astchunk_integration.py`
- A: `tests/test_chunk_size_cap.py`
- M: `tests/test_cli_prompt_template.py`
- M: `tests/test_cli_verbosity.py`
- A: `tests/test_document_rag_ocr.py`
- A: `tests/test_embedding_server_bind.py`
- M: `tests/test_incremental_build.py`
- A: `tests/test_lazy_package_import.py`
- A: `tests/test_mcp_status_metadata.py`
- A: `tests/test_metadata_filter_numeric_strings.py`
- A: `tests/test_parallel_mcp_reader.py`
- M: `tests/test_prompt_template_persistence.py`
- A: `tests/test_query_embedding_cache.py`
- A: `tests/test_trust_remote_code.py`
- A: `tests/test_update_index_auto_passage_ids.py`
- M: `uv.lock`
