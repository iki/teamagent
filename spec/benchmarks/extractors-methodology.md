# Document extractor benchmark

This benchmark measures document import through the same configured extractor
adapter used by memory. Its primary quality measure is **the percentage of
independently annotated important-information anchors recovered**. It does not
estimate the percentage of every fact in a document, answer accuracy, visual
fidelity, or a universal ranking of document extractors.

## Frozen corpus and quality

Reuse `app/benchmark/cases-documents.json` unchanged: five reference PDFs,
104 pages, 40 questions, 34 answerable questions, 39 evidence groups and
113 source quotation anchors. The source bytes and SHA-256 digests must match
before any extractor runs. The five documents cover a software design,
memory research, Czech prose, database transactions and a financial release.
The [document corpus](document-corpus.md) records source selection, provenance,
licenses and independently inspected evidence. The original PDFs and full
extracted text remain local rather than being redistributed with the results.

All profiles see the same complete PDF bytes. No page ranges, oracle questions,
gold anchors, search results or expected answers enter the extraction commands.
Profiles and option sets are explicit trusted local configuration. The runner
rejects a selected profile whose media types would delegate PDFs to the builtin
converter. Extraction has no silent fallback to another engine.

For each document, score every nonempty anchor in its complete returned Markdown
and retain the individual question/group/anchor outcome. The primary matcher
normalizes NFKC, soft hyphens, line-wrap hyphenation, whitespace, typographic
quotes/dashes and cosmetic Markdown code/emphasis/table delimiters. It preserves
word order, accents, numbers, decimal points, signs, identifiers and operators.
Word/identifier/numeric boundaries prevent an anchor from matching inside a
different value. There are no fuzzy matches, synonyms, language-model judges or
gold-specific replacements. A stricter metric using the previous memory
benchmark's Unicode/whitespace normalization is retained alongside it.
Both metrics apply the same numeric/identifier boundaries; neither credits
`100` from `100.5` or an unsigned value from a negative value. A sentence-ending
period remains valid punctuation after a complete number.

The current evaluator is `teamagent-extractor-quality/2`, recorded with its code
hash in every run. Version 1 omitted four common Markdown-escape matches, one
space-before-comma match and two unchanged mathematical-expression spacing
matches in one extractor's reference output. Version 2 generically decodes
CommonMark ASCII punctuation escapes and normalizes whitespace around `=`, `/`,
parentheses and punctuation after words. It does not change operators, signs,
decimal punctuation, whitespace between numeric tokens or quantity/unit
separation. Initial version-1 runs remain immutable and are superseded by
fresh version-2 measurements. These were evaluator defects, not extractor
improvements or changes to gold evidence. Exact-anchor matching can still miss
equivalent layout, such as a quantity joined to its unit; report audited
equivalences separately instead of adding document-specific replacements.

Report these separate quantities:

- **Annotated important information:** recovered anchors / expected anchors.
  Each pre-existing annotated anchor receives equal weight; short and long
  anchors are not independent or equally difficult factual units.
- **Complete evidence groups:** all anchors in an annotated group recovered.
- **Complete question support:** every required evidence group recovered.
- Per-source and per-category diagnostics, including every missing anchor's
  source, question, evidence group and index in the frozen gold manifest.
- Markdown bytes, retained image count and bytes, parser identity, warnings and
  exact output hashes. Image count measures retained assets, not correct OCR or
  visual interpretation.

The six unanswerable questions have no positive extraction gold and are excluded
from quality denominators. The extractor cannot answer a question, so this is
not an abstention evaluation. The matcher does not enforce page localization,
table cell associations, layout order between separate anchors, equation
semantics or image meaning. Existing PDFs are predominantly born-digital;
their high baseline text recall can create a ceiling and does not establish
quality on scanned handwriting or degraded images. Corpus-specific results
must not justify a general “best quality” claim.

### Separate synthetic OCR lane

The default runner also includes `data/extractor-benchmarks/fixtures/manifest.json`:
one repository-owned two-page image-only PDF with **28 frozen anchors in 11
groups/questions**. The first page contains English invoice identity/dates,
numeric table cells, a total, negative policy statements and signed/decimal
sensor limits. The second contains Czech prose, diacritics, decimal commas,
dates, a filename and approval/provenance requirements. No real personal or
transaction data is used. Table anchors test retained cell values rather than
correct associations between rows and columns.

The generator `app/benchmark/extractors/scanned-fixture.py` fixes the page raster
at 1654 × 2339 pixels, 200 DPI, JPEG quality 95 with no chroma subsampling,
Pillow 12.3.0, exact recorded Arial font digests and PDF metadata time. It uses no
randomness, verifies identical bytes across two generations, and asserts that
both PDF pages expose zero text. The images decoded from the final PDF were
visually inspected for readable English/Czech glyphs, aligned tables and no
clipped text before any engine ran. The manifest records PDF/generator/font
hashes and fixed expected anchors. This is a clean synthetic scan, not evidence
about camera distortion, handwriting, historical scripts or heavily degraded
documents.

Report this lane separately from the five reference PDFs. The runner's
`qualityByLane` contains separate denominators and coverage; a mixed-corpus
aggregate is available only as a diagnostic and must not replace these two
quality results. `--sources synthetic-scanned-en-cs` selects just the OCR lane.

## Failure accounting

Each completed document/run is preserved as `success`, `timeout`, `unavailable`
or `error`. Failed runs have **null extraction quality**, not an invented zero
quality measurement. Empty successfully returned Markdown does score zero.
Configured version mismatches or failed probes remain unavailable rather than
silently testing a different declared version.

For an incomplete profile, report successful-document coverage and conditional
quality on those documents. Also report **effective recovery across the entire
selected corpus**, keeping all selected gold anchors in its denominator and
crediting only anchors actually recovered from successful initial runs. This
prevents failing hard documents from inflating a profile to 100%. An unavailable
profile may have 0% effective coverage, but its intrinsic quality remains
unmeasured. A complete-corpus quality/time is null unless every initial document
conversion succeeds. Repeat failures remain visible and never earn a fast
successful latency.
Initial-run quality is the primary summary; every repeated-run quality remains
in the raw measurements. Repeated success cannot retroactively repair a failed
initial result. Output stability is null when no repetitions were requested.

Operator cancellation is separate from an extractor timeout or failure.
`runExtractorBenchmark` accepts an optional parent `AbortSignal`; its CLI owns
delivered SIGINT, Windows SIGBREAK and POSIX SIGTERM interruption. Cancellation
aborts the current operation and awaits its process and staging cleanup before
returning. Completed immutable measurements remain available, the interrupted
active invocation receives no measurement, elapsed time or quality score, and
the runner does not start another case or publish a completed summary. Signal
handlers remain installed through cleanup and are then removed. Forced process
termination, crashes and power loss cannot run this asynchronous cleanup;
Windows `process.kill(..., "SIGTERM")` is force termination, not a graceful
console interruption. On the measured Windows host, Aube 2.5.1 suppressed Ctrl+C
delivery in the real memory-CLI launcher probe, while Ctrl+Break reached Bun's
cleanup. Use Ctrl+Break through that launcher, or run
`bun app/benchmark/extractors.ts ...` directly in a console that enables Ctrl+C.
See the [CLI interruption limits](../memory-imports.md#external-document-extractors).
The [launcher probe receipt](../../data/extractor-benchmarks/setup/windows-interruption.json)
retains the exact tested launcher, events and observed process cleanup.

## Timing and provenance

Run profiles sequentially on the same host, with no parallel extractor,
benchmark, repository test or model process. For each document/profile, perform
one initial conversion followed by the configured number of repetitions
(default one; zero to three additional runs are allowed). Each call starts a
fresh process and writes to a fresh directory; extracted output is never reused.
This is a CLI application measurement, not a persistent warm inference server.

Time the public document-conversion operation with a monotonic clock. This
includes staging input, verifying the executable version, process startup,
model loading, conversion, adapter output validation and cleanup. Exclude
pre-reading/hashing sources, evaluating quality and writing benchmark artifacts.
Record installation and model-download setup separately; run setup before
timing and retain its provenance hash with `--setup`. When model downloads occur
unexpectedly inside a conversion, that observation is contaminated and must be
labeled before running a new immutable post-download measurement.

OS file caches and model-weight caches are not evicted. The first observation
is not described as cold disk or fresh-model download. Repeated invocations
reload model state in separate CLI processes, so “repeat” does not mean a live
model remains in GPU memory. GPU/CPU placement, OCR/backend and table options
belong to the recorded profile/setup. Report per-document times, total initial
corpus time and successful repetition distributions; samples over a handful of
heterogeneous documents are descriptive, not a reliable throughput service-level
guarantee. Setup, imports and conversion are not equivalent costs.

Record the actual Bun/platform/CPU/RAM, source/config/resolved-profile/code hashes,
declared and verified observed extractor versions, command executable hash when
resolvable, builtin Python/package inspection and a linked setup manifest.
Configuration environment values and CLI argument values are hashed rather than
copied into operational results. Reproduction uses the trusted config whose
exact file digest is retained. Actual hardware/model setup evidence must be
provided separately; a configured GPU option alone does not prove GPU execution.

## Reproduction and immutable artifacts

Install the requested external runtimes/models separately and inspect their
actual version/help commands. Never modify dependency trust policy or fabricate
an unavailable executable to obtain a comparison. Different option sets use
different profile IDs, so their options and results remain attributable.

```sh
aube run --no-install benchmark:extractors --config extractors.config.ts --profiles builtin,xberg-native --output .cache/extractor-benchmark/run-001 --repeat 1 --setup data/extractor-benchmarks/setup/runtime-final.json
```

The entry point is `app/benchmark/extractors.ts`. `--sources` accepts an explicit
comma-separated subset of the frozen source IDs for a separately labeled smoke
run; omit it for a full corpus run. `--repeat 1` means two fresh conversions per
document/profile. Select a new output directory for each run. Existing output
directories and JSON/Markdown artifacts are never overwritten.

The checked-in synthetic fixture needs no generation during a benchmark.
To reproduce it into a new directory for a byte comparison, use the pinned
import Python runtime:

```sh
.cache/import-python/Scripts/python.exe -I app/benchmark/extractors/scanned-fixture.py --output .cache/extractor-benchmark/fixture-reproduction
```

The generated manifest retains the canonical fixture path; compare the generated
PDF SHA-256 against the checked-in manifest rather than changing the gold source
selection. Exact byte reproduction requires the recorded fonts and runtime.

The runner writes `provenance.json` before conversion, one immutable
`PROFILE/SOURCE/REPEAT/measurement.json` immediately after each observation, local
`extracted.md` and `assets/` for inspection, then `results.json` with raw
measurements and summaries. Partial measurements survive a later interruption.
Checked-in reports retain measurement/provenance metadata and evidence IDs;
full third-party document outputs remain in the ignored local cache. Preserve
failed initial runs when changing options and rerunning. Recommendations and
config comments must cite the measured run, exact option-set ID, quality,
coverage and speed, while clearly marking unsupported or unmeasured profiles.

Normal repository tests run scorer, adapter and cancellation fixtures only. They do not
download models or include long hardware-dependent benchmark runs. Run the
explicit corpus benchmark after the normal reliability gates pass.
