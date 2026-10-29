<!-- conversation: 6d060fb156468acd3348f5d0cc9616a712699e66e002a8acefc3aec047a27412 -->

Date: 2026-10-04T19:57:40.000Z
Session: 01a10857-fde4-7272-a6d5-873209cf57cc
Turn: 01a10857-ffab-7352-bcb4-b72bdcd089a4
Parent session: 01a1057a-5094-7063-9553-be5107e5adc2
Parent turn: 01a10857-ffab-7352-bcb4-b72bdcd089a4
Agent: codex-01a10857-fde4-7272-a6d5-873209cf57cc
Model: gpt-6-astra
Reasoning level: ultra

Public transcript only. Recognized credentials and requested literal redactions are replaced with [redacted] markers.

## Prompt

[Delegated prompt unavailable in native subagent transcript; consult the parent conversation.]

## Response

Runtime setup is ready for the full 12-profile benchmark.

- Verified installed Xberg 1.3.3, Marker 2.0.0, MinerU 4.0.10, Docling 2.132.0 and OpenDataLoader PDF 2.5.12.
- Prepared 72 model assets with hashes; preserved package inventories, reference commits and all setup failures.
- Actual importer probes pass for MinerU, Docling and both Marker profiles. Final Marker balanced probe: 63.944 seconds; no helper processes remained.
- Added `xberg-ocr-text`, which retains Czech lines discarded by Xberg's Markdown OCR dictionary filter.

Candidates: [.cache/extractor-candidates.json](../../.cache/extractor-candidates.json).
Documentation: [extractor-runtimes.md](../benchmarks/extractor-runtimes.md).
Frozen provenance: [runtime-final.json](../../data/extractor-benchmarks/setup/runtime-final.json).

All setup downloads and extractor processes are stopped. These smoke observations are separate from corpus benchmark results.

## Processing Log
