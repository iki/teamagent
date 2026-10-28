# xberg

Source: [xberg](https://github.com/xberg-io/xberg) · Category: [ai-query](../categories/ai-query.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `536311f2f9eff39c3e8834b3a90ca8df715d33ba`; commit timestamp `2026-10-03T12:40:17+02:00`; 8,796 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/xberg-io/xberg/blob/536311f2f9eff39c3e8834b3a90ca8df715d33ba/README.md)):

> The fast, precise document-intelligence engine — for every language. Point Xberg at anything — a PDF, a scanned image, a spreadsheet, an audio file, a URL, a whole archive, or a source tree — and get back clean text, tables, metadata, and structured data. One engine handles format detection, reading, OCR, and extraction, so you never stitch a pipeline together from a dozen libraries.

Build/package evidence: [Cargo.toml](https://github.com/xberg-io/xberg/blob/536311f2f9eff39c3e8834b3a90ca8df715d33ba/Cargo.toml); [cli-proxy/npm/package.json](https://github.com/xberg-io/xberg/blob/536311f2f9eff39c3e8834b3a90ca8df715d33ba/cli-proxy/npm/package.json); [cli-proxy/pypi/pyproject.toml](https://github.com/xberg-io/xberg/blob/536311f2f9eff39c3e8834b3a90ca8df715d33ba/cli-proxy/pypi/pyproject.toml); [crates/xberg-candle-ocr/Cargo.toml](https://github.com/xberg-io/xberg/blob/536311f2f9eff39c3e8834b3a90ca8df715d33ba/crates/xberg-candle-ocr/Cargo.toml); [crates/xberg-cli/Cargo.toml](https://github.com/xberg-io/xberg/blob/536311f2f9eff39c3e8834b3a90ca8df715d33ba/crates/xberg-cli/Cargo.toml)

License evidence: [LICENSE](https://github.com/xberg-io/xberg/blob/536311f2f9eff39c3e8834b3a90ca8df715d33ba/LICENSE) Classification hint: MIT. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-query**. Its category places it in the candidate set for memory, import-generation, decisions; those associations are navigational and have not been individually validated as implemented capabilities. See [memory](../memory.md) · [import-generation](../import-generation.md) · [decisions](../decisions.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.


## Change review - 2026-10-28

**RTF extraction preserves more source text but parser loss must stay visible.** Reviewed commit `92ec93de51dc8a8ea764b11c0424e429a3d14a59` (commit date `2026-10-27T18:42:39+02:00`). Compared with `536311f2f9eff39c3e8834b3a90ca8df715d33ba`; the complete Git comparison contains 2075 changed paths.

The RTF text parser keeps group-scoped codepage/font/hidden state, sends escaped literal and hex-decoded text to the current table cell, and remaps formatting and hyperlink offsets through whitespace normalization. Fixtures cover nested shape text, labeled comments, nonbreaking symbols and escaped table literals. These are concrete fidelity improvements, not a generic file-conversion claim. The inspected loop grows several stacks for every group without a local depth cap or malformed-group error result. In captured auxiliary destinations, Unicode control values are converted separately with char::from_u32, so UTF-16 surrogate pairs are not combined and their surrogate values are discarded in that path; uc values are narrowed to u8 without an upper-bound check.

The strict-parse fixtures explicitly distinguish structured parsing from a plain-text fallback and require parse-fallback warnings, including a CSV table-cell limit and character-boundary truncation at a content-size cap. That is a useful degraded-result contract, but those tests do not themselves establish how every extractor enforces limits. A success containing fallback text must not imply that tables, images or structure were fully recovered.

Evidence: [crates/xberg/src/extractors/rtf/parser/text_extract.rs:193-290](https://github.com/xberg-io/xberg/blob/92ec93de51dc8a8ea764b11c0424e429a3d14a59/crates/xberg/src/extractors/rtf/parser/text_extract.rs#L193-L290) · [crates/xberg/src/extractors/rtf/parser/text_extract.rs:464-494](https://github.com/xberg-io/xberg/blob/92ec93de51dc8a8ea764b11c0424e429a3d14a59/crates/xberg/src/extractors/rtf/parser/text_extract.rs#L464-L494) · [crates/xberg/src/extractors/rtf/parser/text_extract.rs:572-666](https://github.com/xberg-io/xberg/blob/92ec93de51dc8a8ea764b11c0424e429a3d14a59/crates/xberg/src/extractors/rtf/parser/text_extract.rs#L572-L666) · [crates/xberg/src/extractors/rtf/parser/text_extract.rs:783-910](https://github.com/xberg-io/xberg/blob/92ec93de51dc8a8ea764b11c0424e429a3d14a59/crates/xberg/src/extractors/rtf/parser/text_extract.rs#L783-L910) · [crates/xberg/src/extractors/rtf/parser/text_extract_tests.rs:1-90](https://github.com/xberg-io/xberg/blob/92ec93de51dc8a8ea764b11c0424e429a3d14a59/crates/xberg/src/extractors/rtf/parser/text_extract_tests.rs#L1-L90) · [crates/xberg/tests/strict_parse_fallback.rs:1-119](https://github.com/xberg-io/xberg/blob/92ec93de51dc8a8ea764b11c0424e429a3d14a59/crates/xberg/tests/strict_parse_fallback.rs#L1-L119) · [crates/xberg/tests/strict_parse_fallback.rs:190-209](https://github.com/xberg-io/xberg/blob/92ec93de51dc8a8ea764b11c0424e429a3d14a59/crates/xberg/tests/strict_parse_fallback.rs#L190-L209).

**Harness consequence:** Preserve source-coordinate mappings and per-feature fidelity in extraction receipts. Add bounded group depth/work, correct surrogate handling and explicit malformed/unsupported outcomes before using this parser on untrusted data. Carry fallback/truncation warnings into retrieval and citation coverage rather than presenting degraded text as a complete structured import.

**Scope and limits:** Scoped static review of selected RTF parser paths and fidelity/fallback fixtures in the 2,075-path comparison. Parser helper internals, whole-engine security admission, PDF/OCR, other formats and the implementation behind strict-parse fixtures were not fully audited. No upstream tests, extraction binaries or benchmarks were run.

<!-- teamagent-analysis:start -->
Analysis metadata: source [xberg](https://github.com/xberg-io/xberg); analyzed commit `92ec93de51dc8a8ea764b11c0424e429a3d14a59`; commit date 2026-10-27T18:42:39+02:00; review date 2026-10-28T09:27:32.685Z; depth screened. [Maintenance record](../analyses/repos/ai-query--xberg.md).
<!-- teamagent-analysis:end -->
