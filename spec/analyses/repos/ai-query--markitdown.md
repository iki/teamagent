# markitdown: change evidence

Source: [markitdown](https://github.com/microsoft/markitdown) · [Analysis](../../projects/ai-query--markitdown.md) · [import-generation](../../import-generation.md), [memory](../../memory.md)

Generated: 2026-10-27T18:19:07.717Z. Status: **changed**. Reviewed SHA: `18d48cb287b91610fa131fa67f5c455d6a23f19c`; commit date: 2026-10-03T11:38:13-07:00; review date: 2026-10-04; observed SHA: `7482c092d9c0074a89803c9fdb63a969e7fe17fc`.

This generated packet is a bounded change locator, not a source review or a quality measurement. [Source comparison](https://github.com/microsoft/markitdown/compare/18d48cb287b91610fa131fa67f5c455d6a23f19c...7482c092d9c0074a89803c9fdb63a969e7fe17fc). Working-tree changes: false; shallow history: false; report changed since recorded review: false.

- Git discovery: unchanged; source lifecycle: active; upstream availability: available.

## Recent commits

- [7482c092d9c0](https://github.com/microsoft/markitdown/commit/7482c092d9c0074a89803c9fdb63a969e7fe17fc) 2026-10-22T15:31:47-07:00: feat(doc-intel): expose models, features, query fields, and structured output (#1913)
- [21d9c1d01ecc](https://github.com/microsoft/markitdown/commit/21d9c1d01ecc12538dab19811fd247ef2f96ef60) 2026-10-21T12:36:53-07:00: Bump versions, prior to point-release. (#2733)
- [3cf47504c5d3](https://github.com/microsoft/markitdown/commit/3cf47504c5d372a65f821a04ef1809a42f27d69c) 2026-10-21T11:31:12-07:00: Update Black, Pillow, and Windows ARM Cryptography baselines (#2731)
- [f9affc86ea7c](https://github.com/microsoft/markitdown/commit/f9affc86ea7cc1be2e8dd03c0e78cfcd5ae6ba64) 2026-10-21T10:50:35-07:00: Require certifi>=2026.10.19 for updated CA trust (#2730)
- [c907c4cd9da1](https://github.com/microsoft/markitdown/commit/c907c4cd9da133e5fbe223160181524e40c8b699) 2026-10-21T10:34:47-07:00: Bump Mammoth dependency to >=1.12.2,<2 (#2729)
- [69e208746aa5](https://github.com/microsoft/markitdown/commit/69e208746aa5804087e9984d585eab21667e9b0f) 2026-10-20T16:32:29-07:00: Bump the magika dependency (#2722)
- [4cc9fa17653d](https://github.com/microsoft/markitdown/commit/4cc9fa17653d695d64fb9eee5b33d4de55ff84e8) 2026-10-03T20:59:49-07:00: Restore JSON regression coverage for late non-ASCII text (#2601)
- [7ccc0271ce79](https://github.com/microsoft/markitdown/commit/7ccc0271ce7986f5b3e2dc747acd56fce3a1e690) 2026-10-03T17:48:02-07:00: Test MCP input errors with real conversions (#2597)
- [331519d9c50b](https://github.com/microsoft/markitdown/commit/331519d9c50b7326cd2254f8717f89255d4860c1) 2026-10-03T16:34:47-07:00: Test PowerPoint missing text with real fixtures and shared vectors (#2594)

## Changed paths

- A: `.github/actions/build-arm-cryptography/action.yml`
- M: `.github/constraints.txt`
- M: `.github/dependabot.yml`
- M: `.github/workflows/tests.yml`
- M: `.pre-commit-config.yaml`
- M: `README.md`
- M: `packages/markitdown-mcp/pyproject.toml`
- M: `packages/markitdown-mcp/src/markitdown_mcp/__about__.py`
- M: `packages/markitdown-mcp/tests/test_http_transports.py`
- M: `packages/markitdown-mcp/tests/test_tool_errors.py`
- M: `packages/markitdown-ocr/pyproject.toml`
- M: `packages/markitdown-ocr/src/markitdown_ocr/__about__.py`
- M: `packages/markitdown-ocr/src/markitdown_ocr/_plugin.py`
- M: `packages/markitdown-ocr/tests/test_docx_inheritance.py`
- M: `packages/markitdown-ocr/tests/test_ocr_metadata.py`
- M: `packages/markitdown-ocr/tests/test_pptx_inheritance.py`
- M: `packages/markitdown-ocr/tests/test_xlsx_inheritance.py`
- M: `packages/markitdown-sample-plugin/src/markitdown_sample_plugin/_plugin.py`
- M: `packages/markitdown/pyproject.toml`
- M: `packages/markitdown/src/markitdown/__about__.py`
- M: `packages/markitdown/src/markitdown/__main__.py`
- M: `packages/markitdown/src/markitdown/_markitdown.py`
- M: `packages/markitdown/src/markitdown/_stream_info.py`
- M: `packages/markitdown/src/markitdown/converter_utils/_xlsx_images.py`
- M: `packages/markitdown/src/markitdown/converter_utils/docx/_images.py`
- M: `packages/markitdown/src/markitdown/converters/_doc_intel_converter.py`
- M: `packages/markitdown/src/markitdown/converters/_markdownify.py`
- M: `packages/markitdown/tests/_test_vectors.py`
- M: `packages/markitdown/tests/test_cli_misc.py`
- M: `packages/markitdown/tests/test_cli_vectors.py`
- M: `packages/markitdown/tests/test_csv.py`
- M: `packages/markitdown/tests/test_cu.py`
- M: `packages/markitdown/tests/test_docintel.py`
- A: `packages/markitdown/tests/test_docintel_converter.py`
- M: `packages/markitdown/tests/test_docx.py`
- M: `packages/markitdown/tests/test_epub.py`
- M: `packages/markitdown/tests/test_files/generate_pdf_cleanup_fixtures.py`
- A: `packages/markitdown/tests/test_files/generate_pptx_missing_text_fixtures.py`
- A: `packages/markitdown/tests/test_files/json_late_non_ascii.json`
- A: `packages/markitdown/tests/test_files/pptx_empty_body_run.pptx`
- A: `packages/markitdown/tests/test_files/pptx_empty_title_run.pptx`
- A: `packages/markitdown/tests/test_files/pptx_notes_empty_run.pptx`
- A: `packages/markitdown/tests/test_files/pptx_notes_missing_body_frame.pptx`
- M: `packages/markitdown/tests/test_html.py`
- M: `packages/markitdown/tests/test_image.py`
- M: `packages/markitdown/tests/test_module_misc.py`
- M: `packages/markitdown/tests/test_outlook_msg.py`
- M: `packages/markitdown/tests/test_pdf.py`
- M: `packages/markitdown/tests/test_pptx.py`
- M: `packages/markitdown/tests/test_rss.py`
- M: `packages/markitdown/tests/test_xlsx.py`
- M: `packages/markitdown/tests/test_youtube.py`
- M: `packages/markitdown/tests/test_zip.py`
