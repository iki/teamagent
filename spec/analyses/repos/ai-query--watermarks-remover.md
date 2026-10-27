# watermarks-remover: change evidence

Source: [watermarks-remover](https://github.com/guillaumemeyer/watermarks-remover) · [Analysis](../../projects/ai-query--watermarks-remover.md) · [memory](../../memory.md), [import-generation](../../import-generation.md), [decisions](../../decisions.md)

Generated: 2026-10-27T18:19:07.717Z. Status: **changed**. Reviewed SHA: `1181fd4e8cc581931a5ee672697a646721e92c78`; commit date: 2026-10-02T19:05:55+05:30; review date: unknown; observed SHA: `5c180932a00c793261177f79aee21db8929f3fe2`.

This generated packet is a bounded change locator, not a source review or a quality measurement. [Source comparison](https://github.com/guillaumemeyer/watermarks-remover/compare/1181fd4e8cc581931a5ee672697a646721e92c78...5c180932a00c793261177f79aee21db8929f3fe2). Working-tree changes: false; shallow history: false; report changed since recorded review: false.

- Git discovery: unchanged; source lifecycle: active; upstream availability: available.

## Recent commits

- [5c180932a00c](https://github.com/guillaumemeyer/watermarks-remover/commit/5c180932a00c793261177f79aee21db8929f3fe2) 2026-10-21T16:02:50-06:00: fix(container): parse HTML meta attributes without a backtracking regex (#407)
- [980c0b4c5786](https://github.com/guillaumemeyer/watermarks-remover/commit/980c0b4c5786ca710ed77276b6e55b622f340d4c) 2026-10-17T10:58:05+05:30: fix(container): value-scan Markdown frontmatter values that span lines (block scalars, wrapped values, lists) (#402)
- [0fd2ded1ff78](https://github.com/guillaumemeyer/watermarks-remover/commit/0fd2ded1ff78cc67a1ab31596c9cce5dda9f4e12) 2026-10-17T10:55:48+05:30: fix(docker): copy humanize_pass and detect_gumbel into the markllm image (#387)
- [374f003b4baa](https://github.com/guillaumemeyer/watermarks-remover/commit/374f003b4baa52e2dc126e4bc822b7c23eb2ebd8) 2026-10-17T10:49:52+05:30: fix: preserve XML-escaped OOXML relationship targets (#394)
- [6fd70ecbcd22](https://github.com/guillaumemeyer/watermarks-remover/commit/6fd70ecbcd22784eb0f33747547ee3798babdabd) 2026-10-17T10:44:58+05:30: feat(research): add DeepSeek sidecar benchmark fixture and guide (#385)
- [5b3cb35b1219](https://github.com/guillaumemeyer/watermarks-remover/commit/5b3cb35b12191838423e178b86f353d6e2679ad0) 2026-10-17T10:41:02+05:30: Inspect and clean Office web-extension metadata (#380)
- [2ce56b65e9de](https://github.com/guillaumemeyer/watermarks-remover/commit/2ce56b65e9de5630a8857e63545b32fdf1900c45) 2026-10-17T10:36:34+05:30: fix(container): honor quoted attribute values in <meta> tag scan (#401)
- [f8635e1cfab0](https://github.com/guillaumemeyer/watermarks-remover/commit/f8635e1cfab07a0e165b14dcf422b857ad21e42d) 2026-10-17T10:33:26+05:30: fix(container): require a separator in the data-ai* attribute scan (#400)
- [c5297e9e69fe](https://github.com/guillaumemeyer/watermarks-remover/commit/c5297e9e69fec0779c29127c7892427e673fafd9) 2026-10-09T06:38:52+05:30: Add OpenAI Codex skill installation support (#379)
- [bb9d6b1d5cf1](https://github.com/guillaumemeyer/watermarks-remover/commit/bb9d6b1d5cf18edfc599a3e471124361d98e5d5c) 2026-10-09T04:22:18+05:30: fix(image): gate the ISOBMFF byte-scan on an 8-byte tail, not any tail (#382)

## Changed paths

- M: `README.md`
- A: `benchmarks/providers/deepseek.json`
- A: `docs/deepseek-benchmark.md`
- M: `docs/synthid-text-benchmark.md`
- M: `install_skill.py`
- M: `service/Dockerfile.markllm`
- A: `service/scripts/bench_deepseek_smoke.py`
- M: `service/scripts/clean_file.py`
- M: `service/scripts/common.py`
- M: `service/scripts/container_meta.py`
- M: `service/scripts/image_meta.py`
- M: `skills/clean-user-facing-text/scripts/common.py`
- M: `skills/remove-ai-marks/references/removal-matrix.md`
- A: `tests/test_bench_deepseek_smoke.py`
- M: `tests/test_container_meta.py`
- A: `tests/test_dockerfile_markllm_copies.py`
- A: `tests/test_frontmatter_multiline_values.py`
- M: `tests/test_install_skill.py`
- M: `tests/test_isobmff_truncated_bytescan.py`
- M: `tests/test_ooxml_xlsx_pptx.py`
- M: `tests/test_prose_values_not_provenance.py`
- A: `tests/test_relationship_xml_entities.py`
- M: `tests/test_security_hardening.py`
