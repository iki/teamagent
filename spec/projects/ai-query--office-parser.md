# office-parser

Source: [office-parser](https://github.com/harshankur/officeParser) · Category: [ai-query](../categories/ai-query.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `43124945d65b90fd89ec942fdb5c6a3e8413649e`; commit timestamp `2026-09-29T23:24:28+02:00`; 522 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/harshankur/officeParser/blob/43124945d65b90fd89ec942fdb5c6a3e8413649e/README.md)):

> A robust, strictly-typed **Node.js and Browser** library for parsing office files into a rich **Abstract Syntax Tree (AST)** and generating high-fidelity output in multiple formats. Parses:** `docx` · `pptx` · `xlsx` · `odt` · `odp` · `ods` · `odg` · `pdf` · `rtf` · `csv` · `md` · `html` · `epub` · `tex` (LaTeX, including Overleaf project zips)

Build/package evidence: [package.json](https://github.com/harshankur/officeParser/blob/43124945d65b90fd89ec942fdb5c6a3e8413649e/package.json)

License evidence: [LICENSE](https://github.com/harshankur/officeParser/blob/43124945d65b90fd89ec942fdb5c6a3e8413649e/LICENSE) Classification hint: MIT. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-query**. Its category places it in the candidate set for memory, import-generation, decisions; those associations are navigational and have not been individually validated as implemented capabilities. See [memory](../memory.md) · [import-generation](../import-generation.md) · [decisions](../decisions.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.


## Change review - 2026-10-28

**CSV delimiter inference and PDF work budgets expose distinct partial-result and cancellation limits.** Reviewed commit `57f2d144916191ef0cca8677f40cf169195a66d7` (commit date `2026-10-26T23:11:44+01:00`). Compared with `43124945d65b90fd89ec942fdb5c6a3e8413649e`; the complete Git comparison contains 639 changed paths.

CSV parsing now sniffs comma, semicolon, tab or pipe over at most 50 records and 64 KiB of JavaScript characters, with a decimal-comma tie rule. It writes the chosen delimiter back into the supplied configuration, so reusing that object can carry one document's inference into another. The full input is still decoded and parsed synchronously after a single entry abort check, retaining both record arrays and AST nodes; the sample cap is not an input, memory or cancellation bound. Unclosed quotes are accepted, bare carriage returns are ignored outside quotes and empty cells are omitted while retained cells carry original row/column indices.

The reviewed PDF budget code weights long text items, separates annotation/operator limits, races requests against a stop signal and reports limit warnings. Its elapsed-work timer applies to the dedicated process's CPU clock, not same-process wall time. Operator filtering hooks private _renderPageChunk only when its expected shape is present; otherwise getOperatorList remains unbounded. Even the hooked path receives a whole chunk before filtering, counts selected operators rather than all upstream work, and admits bounded free path operators. These are useful partial-extraction controls, not a complete hostile-document resource envelope.

Evidence: [src/parsers/CsvParser.ts:1-167](https://github.com/harshankur/officeParser/blob/57f2d144916191ef0cca8677f40cf169195a66d7/src/parsers/CsvParser.ts#L1-L167) · [src/parsers/PdfParser.ts:800-947](https://github.com/harshankur/officeParser/blob/57f2d144916191ef0cca8677f40cf169195a66d7/src/parsers/PdfParser.ts#L800-L947) · [src/parsers/PdfParser.ts:949-1066](https://github.com/harshankur/officeParser/blob/57f2d144916191ef0cca8677f40cf169195a66d7/src/parsers/PdfParser.ts#L949-L1066).

**Harness consequence:** Use fresh per-document parser configuration and record inferred delimiter/ambiguity plus retained cell coordinates. Enforce actual input bytes, output nodes and cancellation in a host-owned worker/process. Pin and test any PDF.js private hook, reject an unavailable bounded mode or mark it explicitly, and retain per-page limit warnings/coverage instead of presenting partial text as a complete source.

**Scope and limits:** Static scoped CSV parser and PDF work-budget review within the 639-path comparison. Other format parsers, PDF process implementation, complete layout/OCR pipeline and integration fixtures were not audited or executed; no extraction-quality or resource benchmark is claimed.

## Follow-up change review — 2026-10-28

**Auxiliary PDF assets have shared wait budgets and visible missing-asset outcomes.** Reviewed commit `15f1f22d668f631859440f916b252b4879edcf3b` (commit date `2026-10-28T08:24:38+01:00`), compared with `57f2d144916191ef0cca8677f40cf169195a66d7`. The complete no-rename Git path inventory contains 329 changed paths. The aggregate diff exceeded the 8 MiB capture bound; the selected files were expanded separately, and no completeness claim is made for that diff.

The target asset loader restricts names to configured CMaps/decoders, shares in-flight reads, caches unavailable assets and enforces a 15-second cumulative waiting budget per folder per document. Local and streamed remote assets have a 4 MiB byte check, and parse cancellation/end aborts waits. However the inspected remote fetch uses default redirect behavior, and local containment is lexical rather than a verified no-symlink boundary. These limits do not by themselves satisfy Teamagent's network/path policy.

Evidence: [src/parsers/pdf/pdfAssets.ts:31-42](https://github.com/harshankur/officeParser/blob/15f1f22d668f631859440f916b252b4879edcf3b/src/parsers/pdf/pdfAssets.ts#L31-L42) · [src/parsers/pdf/pdfAssets.ts:201-255](https://github.com/harshankur/officeParser/blob/15f1f22d668f631859440f916b252b4879edcf3b/src/parsers/pdf/pdfAssets.ts#L201-L255) · [src/parsers/pdf/pdfAssets.ts:328-408](https://github.com/harshankur/officeParser/blob/15f1f22d668f631859440f916b252b4879edcf3b/src/parsers/pdf/pdfAssets.ts#L328-L408).

**Harness consequence:** Provision trusted parser resources, reject unapproved egress/redirects and retain explicit partial-extraction warnings. Bound shared auxiliary work as well as document bytes; an exhausted asset budget must not look like complete successful extraction.

**Scope and limits:** Reviewed complete selected target-revision asset code after the capped aggregate diff; worker isolation, every parser and network containment were not certified. This is a scoped static comparison, not a whole-project correctness or security audit. Upstream tests were read where cited, not run; no upstream code, service, model or provider operation was executed. Historical findings above remain evidence at their own revisions.

## Change review - 2026-11-01

Reviewed `2c1bb5e3db111d8f9531249460b783e2bd76063f` against `15f1f22d668f631859440f916b252b4879edcf3b`. The selected [ActualText handling](https://github.com/harshankur/officeParser/blob/2c1bb5e3db111d8f9531249460b783e2bd76063f/src/parsers/pdf/actualText.ts) delegates file/program reading to a shared PDF reader, retains per-page/document event budgets, caches form events by resources and falls back to glyph text when marked content cannot be read. It marks text whose control characters were removed. Selected [glyph matching](https://github.com/harshankur/officeParser/blob/2c1bb5e3db111d8f9531249460b783e2bd76063f/src/parsers/pdf/textGlyphs.ts) hunks bound local candidate inspection and conditionally recover glyph-name text only when ordered correspondence can be established. The [types](https://github.com/harshankur/officeParser/blob/2c1bb5e3db111d8f9531249460b783e2bd76063f/src/parsers/pdf/pdfTypes.ts) distinguish form-field text and PNG/JPEG image payloads.

**Harness consequence:** Preserve transformation and fallback provenance alongside extracted text; unavailable structure is not proof that no semantic text exists. Keep original document bytes and geometry for later reconciliation and separate form values from headings. Shared-reader bounds require their own validation, not trust transferred from this caller.

**Scope and limits:** Selected surviving ActualText hunks, glyph matching/recovery and type changes; deleted reader internals, replacement reader and full extraction tests were not audited. No PDF was rendered or parsed and no upstream tests were executed; no general language-fidelity improvement is claimed.

<!-- teamagent-analysis:start -->
Analysis metadata: source [office-parser](https://github.com/harshankur/officeParser); analyzed commit `2c1bb5e3db111d8f9531249460b783e2bd76063f`; commit date 2026-11-01T00:13:03+01:00; review date 2026-11-01T11:37:37.120Z; depth screened. [Maintenance record](../analyses/repos/ai-query--office-parser.md).
<!-- teamagent-analysis:end -->
