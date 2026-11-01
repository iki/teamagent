# book-to-skill

Source: [book-to-skill](https://github.com/virgiliojr94/book-to-skill) · Category: [ai-query](../categories/ai-query.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `c108d25b0cb58e1bdc361f3de02ed9f37075152f`; commit timestamp `2026-09-29T10:08:28-04:00`; 119 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/virgiliojr94/book-to-skill/blob/c108d25b0cb58e1bdc361f3de02ed9f37075152f/README.md)):

> Turn any technical book, document folder, or collection of sources into a unified agent skill — ready to study, reference, and use while you work in GitHub Copilot CLI, Amp, Claude Code, Hermes Agent, OpenCode, or OpenClaw. 24×–51× fewer tokens than dumping the book into context  to answer one question, measured on real books ( how it's measured ).

Build/package evidence: [pyproject.toml](https://github.com/virgiliojr94/book-to-skill/blob/c108d25b0cb58e1bdc361f3de02ed9f37075152f/pyproject.toml)

License evidence: [LICENSE.md](https://github.com/virgiliojr94/book-to-skill/blob/c108d25b0cb58e1bdc361f3de02ed9f37075152f/LICENSE.md) Classification hint: MIT. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-query**. Its category places it in the candidate set for memory, import-generation, decisions; those associations are navigational and have not been individually validated as implemented capabilities. See [memory](../memory.md) · [import-generation](../import-generation.md) · [decisions](../decisions.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.


## Change review - 2026-10-28

**Ordered source fingerprints and recorded PDF fallback improve resumable extraction, with identity and decoding limits.** Reviewed commit `fece258123879acf4ac6535dc4986b32e13df0c9` (commit date `2026-10-27T10:53:55-04:00`). Compared with `c108d25b0cb58e1bdc361f3de02ed9f37075152f`; the complete Git comparison contains 43 changed paths.

The resume check now compares the ordered sequence of `(basename, SHA-256)` pairs, retaining duplicate-name multiplicity and distinguishing reordered sources from changed content. Its fixtures cover replacement, duplicates, reorder rejection and output ordering. The hash helper streams 1 MiB chunks, but extraction computes the recorded hash after reading/converting the source; this is not a stable-snapshot guarantee against a concurrent file change. Basenames plus content also do not preserve distinct source locations when otherwise identical inputs move. Metadata type validation remains shallow: individual source records are assumed to be mappings.

Docling import absence, an empty result and an operational exception now produce different fallback reasons, which are returned in source metadata. Operational exceptions reach the caller instead of masquerading as a missing dependency, although its warning prints the exception text. Technical-mode conversion disables OCR and enables table structure; fallback to a text extractor changes the effective method and may lose layout. The RTF changes combine adjacent UTF-16 surrogate escapes and park escaped literal characters before interpreting controls; BOM-signaled text decode errors stop that parser instead of silently switching encoding. The skill validator now reads indented literal/folded block descriptions before enforcing the length limit, backed by oversized and empty block-scalar cases; it remains a small frontmatter parser rather than a complete YAML implementation.

Evidence: [book_to_skill/utils.py:1108-1189](https://github.com/virgiliojr94/book-to-skill/blob/fece258123879acf4ac6535dc4986b32e13df0c9/book_to_skill/utils.py#L1108-L1189) · [book_to_skill/utils.py:1250-1335](https://github.com/virgiliojr94/book-to-skill/blob/fece258123879acf4ac6535dc4986b32e13df0c9/book_to_skill/utils.py#L1250-L1335) · [book_to_skill/utils.py:1400-1438](https://github.com/virgiliojr94/book-to-skill/blob/fece258123879acf4ac6535dc4986b32e13df0c9/book_to_skill/utils.py#L1400-L1438) · [book_to_skill/parsers/pdf.py:145-165](https://github.com/virgiliojr94/book-to-skill/blob/fece258123879acf4ac6535dc4986b32e13df0c9/book_to_skill/parsers/pdf.py#L145-L165) · [book_to_skill/parsers/rtf.py:1-202](https://github.com/virgiliojr94/book-to-skill/blob/fece258123879acf4ac6535dc4986b32e13df0c9/book_to_skill/parsers/rtf.py#L1-L202) · [book_to_skill/parsers/text.py:1-41](https://github.com/virgiliojr94/book-to-skill/blob/fece258123879acf4ac6535dc4986b32e13df0c9/book_to_skill/parsers/text.py#L1-L41) · [tools/validate_skill.py:159-185](https://github.com/virgiliojr94/book-to-skill/blob/fece258123879acf4ac6535dc4986b32e13df0c9/tools/validate_skill.py#L159-L185) · [tests/test_fingerprint.py:185-294](https://github.com/virgiliojr94/book-to-skill/blob/fece258123879acf4ac6535dc4986b32e13df0c9/tests/test_fingerprint.py#L185-L294) · [tests/test_validate_skill.py:235-277](https://github.com/virgiliojr94/book-to-skill/blob/fece258123879acf4ac6535dc4986b32e13df0c9/tests/test_validate_skill.py#L235-L277).

**Harness consequence:** Reuse the ordered, multiplicity-preserving content identity and explicit fallback provenance, while binding import receipts to a stable source snapshot, canonical source identity, requested/effective converter and converter version. Treat text-only fallback and discarded image/layout content as partial extraction; require typed metadata, size/time limits, safe diagnostics and a standards-compliant frontmatter boundary before adopting the workflow.

**Scope and limits:** Static review of selected extraction/resume/parser changes and related fixtures within the 43-path comparison. Not a complete review of chapter detection, the sanitizer implementation, dependency installation, PDF Inspector integration or all converters; no source code, extraction job or upstream tests executed.

## Change review — 2026-11-01

**BOM-aware EPUB decoding preserves chapter order across UTF-16 package and content files.** Reviewed `7540eefbe74933f5fc84c86becac52486b347778` (commit date `2026-10-28T09:26:03-04:00`) against `fece258123879acf4ac6535dc4986b32e13df0c9`. The two-path delta introduces a shared decoder for container, package and chapter bytes, including chapter counting. It recognizes UTF-16 LE/BE byte-order marks and explicitly excludes the overlapping UTF-32 LE mark; other inputs keep the UTF-8 replacement path. Both decoders use replacement on errors, so successful extraction is still potentially lossy.

The added synthetic fixtures exercise UTF-16 in each XML role, non-ASCII chapter text, package spine order/counts, a decoy OPF to expose failed container lookup, unchanged UTF-8 and UTF-32 exclusion. A subprocess fixture specifies a dependency-free CLI extraction and checks its text and source metadata; its presence is not evidence that it ran here. Evidence: [book_to_skill/parsers/epub.py:29-44](https://github.com/virgiliojr94/book-to-skill/blob/7540eefbe74933f5fc84c86becac52486b347778/book_to_skill/parsers/epub.py#L29-L44), [book_to_skill/parsers/epub.py:95-201](https://github.com/virgiliojr94/book-to-skill/blob/7540eefbe74933f5fc84c86becac52486b347778/book_to_skill/parsers/epub.py#L95-L201) and [tests/test_epub_utf16.py:1-128](https://github.com/virgiliojr94/book-to-skill/blob/7540eefbe74933f5fc84c86becac52486b347778/tests/test_epub_utf16.py#L1-L128).

**Harness consequence:** Retain byte-level encoding provenance, original assets and a decoding-loss signal alongside extracted text and reading order. Test misleading package candidates rather than letting a permissive fallback accidentally satisfy a fixture. This decoding fix supplies no archive expansion or input-allocation bound.

**Scope and limits:** Complete parser/test delta read statically. No EPUB, optional parser, installer or subprocess fixture was executed; broader ZIP/parser safety and malformed unmarked encodings remain outside this review.

<!-- teamagent-analysis:start -->
Analysis metadata: source [book-to-skill](https://github.com/virgiliojr94/book-to-skill); analyzed commit `7540eefbe74933f5fc84c86becac52486b347778`; commit date 2026-10-28T09:26:03-04:00; review date 2026-11-01T11:35:43.470Z; depth screened. [Maintenance record](../analyses/repos/ai-query--book-to-skill.md).
<!-- teamagent-analysis:end -->
