# Extractor result audit

This audit distinguishes absent or altered information from conservative
exact-anchor matching failures. Numerical rankings belong to the
[results report](extractors-results.md); scoring, failure accounting and the
separate source lanes follow the [benchmark protocol](extractors-methodology.md).
The audit does not change gold anchors or silently add credits to measured scores.

The final `2026-10-04-full-v3` matrix completed 144 attempts: 142 successful
conversions and two Marker balanced timeouts on the same document. Among 71
successful initial/repeat pairs, 70 have identical Markdown hashes and every
pair has identical quality objects. The one text difference is audited below;
matching timeout outcomes are excluded from successful-output stability.

## Interrupted adapter run

The first quality-version-2 matrix, `2026-10-04-full-v2`, was intentionally
stopped after **102 successful measurements**: eight complete profiles and both
repetitions of the first three Docling fast-text documents. Its exact provenance
and every completed measurement are preserved under
`data/extractor-benchmarks/2026-10-04-partial-v2/`, with file digests and the stop
reason in `archive.json`. The unfinished active invocation is not labeled a
failure and has no fabricated quality or timing result.

The stop followed observed absolute temporary image references in Docling output
and a separate code-review finding about a possible output/source basename
collision. The basename risk was confirmed by a regression fixture, not observed
in the measured outputs. A corrected full rerun
supersedes that partial matrix while retaining the same quality evaluator and
gold. Findings below identify those issues explicitly; the partial timings are
not substituted for missing observations in the corrected matrix.

## Preserved evaluator correction

The initial five-profile run used quality evaluator version 1. Its seven Xberg
reference-document misses all retained the relevant information in Markdown:
four were escaped tilde characters, one was whitespace before a comma following
bold text, and two were whitespace around unchanged equation operators or
parentheses. These were evaluator defects rather than evidence loss.

Quality evaluator version 2 fixes those general cosmetic classes, with regression
fixtures that continue to reject altered signs, operators, decimal values,
numeric-token merges and identifier changes. Fresh conversions use the corrected
evaluator. The original results remain under
`data/extractor-benchmarks/2026-10-04-fast-v1/`; the archived original scorer
`extractors-metrics.ts.txt` matches the original measurement's SHA-256
`2335dd51500e83f99b4f3625664ec76dcc76c334c977d8d7d0c7161035b0f826`.

OpenDataLoader's initial single reference miss preserves the quantity and unit
as `15pp`, while the frozen anchor spells it `15 pp`. This is an audited
equivalence. Version 2 deliberately does not join arbitrary alphanumeric tokens
or add a source-specific exception; measured exact-anchor recall retains the
miss. This distinction must accompany any apparent one-anchor quality ranking.

## OCR options and information retention

The original Xberg automatic OCR option produced real losses on the two-page
English/Czech scan, including most Czech paragraphs and one table quantity.
Upstream logs report removal of eleven OCR lines by its dictionary filter.
The inspected Xberg 1.3.3 source applies `DictionaryLineFilter` unconditionally
when the Tesseract intermediate output format is Markdown, before both flat and
structured paragraph rendering. The filter's default rejects a line when more
than 60% of at least two dictionary-checkable words are rejected. It is not
controlled by the general `--quality` flag.

The additional `xberg-ocr-text` profile selects Tesseract's text intermediate
format while retaining the outer Markdown output. This is an evaluated option
change, not a patch to the external source or a substitute OCR implementation.
The original automatic profile remains in the matrix. Setup observations
motivated the additional option but are not used as benchmark timing results.

Source evidence: the checked-out Xberg reference at
`../ai-query/xberg/crates/xberg/src/ocr/processor/execution.rs` applies the filter
around lines 1980–2000; `ocr/hocr_parser.rs` defines its threshold and line filter
around lines 455–548. The local source snapshot is recorded by the existing
[reference review](../projects/ai-query--xberg.md). Runtime behavior is established
by the retained output and setup diagnostics, rather than by source inspection
alone.

## Version-2 output findings

The builtin profile and all three Xberg profiles recover all 113 reference-PDF
anchors. Both OpenDataLoader profiles recover 112, with the one quantity/unit
formatting miss described above. This does not establish a factual quality gap
between those complete digital-text outputs.

On the image-only scan, builtin, Xberg native-text and the two OpenDataLoader
profiles return no annotated searchable text, even when they retain page images.
Those are successful conversions with zero text recall, rather than crashed or
unavailable engines. They should not be recommended for OCR on this evidence.

Xberg automatic OCR recovers 17/28 scan anchors: 16/17 English anchors and 1/11
Czech anchors. Its Markdown omits the Quartz quantity and most Czech paragraphs;
the dictionary-filter diagnostic supports the loss mechanism. The text
intermediate option recovers 24/28. Its four remaining exact-anchor misses are:

- `scan-table-values`: the Quartz quantity is absent, an actual numeric omission.
- `scan-czech-identity`: the record label loses diacritics; its record identifier
  remains present. This is orthographic damage, not loss of the identifier value.
- `scan-czech-policy`: the approval statement survives but loses its final
  period. This is a conservative exact-anchor miss, not loss of the policy.
- `scan-czech-provenance`: spaces replace underscores in the filename. This
  changes an exact identifier and should not receive automatic equivalence credit.

The OCR-text option therefore retains substantially more Czech evidence, while
its exact score still understates one punctuation-equivalent statement. Preserve
the measured 24/28 and this audit distinction; do not silently rewrite the score.

MinerU Flash's `doc-hermes-kanban-02` miss retains a line-wrap hyphen inside a
table word (`iso-lated`). The matcher only rejoins hyphens at actual newlines and
does not remove arbitrary hyphens within words, since that could alter meaningful
compound terms or identifiers. This is visible text fragmentation rather than
an absent table row.

MinerU Flash's other reference miss, `doc-disney-q1-fy25-02`, splits the EPS label
and value into separate column-wise text runs. The strings survive, but the
annotated label/value adjacency does not. Treat this as a table-structure issue,
not proof that the value itself vanished or that its association remains correct.
The Flash profile explicitly disables OCR. Its scan output is primarily embedded
data-URI page images, with zero separate imported raster assets and explicit
adapter warnings. Those embedded bytes remain in Markdown, so a zero `imageCount`
does not mean every image byte was discarded. It means no supported contained
raster file was imported as a separate asset.

A read-only contamination check removed only embedded `data:image` base64
targets from all twelve initial MinerU outputs in the partial matrix and rescored
the remaining text with the unchanged version-2 evaluator. Eight outputs contained
such images; **no recovered-anchor count changed**. The check's per-document
hashes/counts are retained in
`data/extractor-benchmarks/2026-10-04-partial-v2/embedded-image-audit.json`.
This rules out observed accidental credit from encoded image bytes in those
measurements; it does not turn embedded images into searchable OCR text. The
corrected full rerun preserves identical Markdown hashes for all twelve initial
MinerU outputs, so the same contamination check applies to those outputs too.

MinerU Basic recovers 106/113 reference anchors. Its seven misses comprise the
same table-word hyphen, three Memento expressions serialized with LaTeX commands
and spaced decimal digits, and three financial-table labels interrupted by HTML
cell boundaries and footnote structure. The underlying labels/numeric values
are present in those financial rows, but the frozen matcher does not render
HTML tables or interpret LaTeX. These scores therefore cannot be described as
seven missing facts. Some generated table structure also misplaces currency
symbols or adjoining year labels, so mere presence of the values does not prove
that every table relationship is correct.

Its scan result is 27/28: all annotated numeric, table, policy and filename
evidence survives; one Czech place name substitutes `d'` for the character `ď`.
That is an exact orthographic mismatch in a proper name. The result demonstrates
better annotated scan recovery than the tested Xberg options on this fixture,
while not establishing general OCR accuracy on arbitrary Czech documents.

Docling fast-text recovers 111/113 reference anchors. Its initial Hermes miss
contains `iso- lated` inside its table row, and its initial Memento miss joins a
percentage to the following word (`54%math`). Both retain readable information
but fail the exact phrase boundary.
The scorer does not silently repair arbitrary word joins or splits. All annotated
financial-table anchors are recovered. On the image-only scan, the OCR-disabled
profile returns an empty Markdown document with zero images and zero text recall;
this is a successful empty conversion, not an unavailable engine.

In the interrupted run, Docling emitted absolute `file://` image links containing
the converter's random temporary directory. In the observed Hermes repetitions
the imported image payload hashes are identical, but those temporary paths make
Markdown hashes differ. The earlier adapter retained these unresolved links with
explicit warnings;
separately imported image assets do not make the stale original links valid.
Classify this as an image-reference integration limitation and cosmetic
byte-level nondeterminism, not changed text facts. Those paths point to temporary
outputs that the converter adapter cleaned up. The corrected adapter maps only
validated contained image files to their imported asset paths. In the corrected
full rerun, both Hermes outputs have identical Markdown hashes, both retain the
same two image hashes, every image link targets an existing `assets/` file, and
both warnings lists are empty. The 21/22 anchor score is unchanged. This confirms
restored link validity and repeat stability for that observed pair without
reinterpreting the preserved partial-run measurements. All six completed
fast-text document pairs have identical Markdown hashes and empty warning lists.

Docling's accurate-table/RapidOCR profile also recovers 111/113 reference
anchors, with the same two word-fragmentation misses. It recovers 27/28 scan
anchors: the only miss is the same Czech proper-name spelling (`Žd'ár` instead of
`Žďár`) seen in MinerU Basic. Its numeric, table, policy and filename anchors all
survive. This profile exports no image assets from the synthetic scan but does
retain its annotated searchable text. All six accurate-profile document pairs
have identical Markdown hashes and empty warning lists.

Marker fast-text recovers 110/113 reference anchors. Its Hermes table breaks
`isolated` across separate table rows and inserts a U+0002 control character after
the first fragment. The row's readable content remains, but this is damaged text
structure. Both Memento misses preserve the complete mathematical statements:
Marker italicizes individual symbols as `*σ*/*µ*` and `(*β*=0.001)`. The frozen
evaluator strips single emphasis only when whitespace-bounded, so these adjacent
italic delimiters are conservative representation-equivalent misses, not absent
coefficients or parameter values. No new normalization or credits are added after
inspection. All annotated financial-table anchors are recovered.

With OCR explicitly disabled, Marker fast-text returns empty Markdown and no
image assets for the scan, scoring zero. Its six document pairs are byte-stable.
Each conversion reports one unimported sidecar; this records the import adapter's
Markdown/raster-only contract, not a failed conversion or evidence that a scored
fact was discarded.

In Marker's balanced Hermes pair, the same table is reconstructed into
single rows and the control character is gone, but the word remains `iso-lated`.
Its 21/22 score therefore does not capture that structural improvement over
fast-text. The content is readable, while the exact word is still fragmented;
both repetitions have identical Markdown hashes.

The balanced profile's initial and repeated Memento conversions both reach the
configured 20-minute timeout. Quality, output hash and image count are null
because neither invocation returned a completed conversion. These are coverage
failures under this runtime budget, not evidence of zero factual accuracy or
completed low-quality output. The initial anchors stay in the effective-recovery
denominator. Matching timeout outcomes do not establish stable Markdown output.

The balanced Czech pair recovers all 19 anchors with identical Markdown hashes.
Its initial DynamoDB output recovers all 22 anchors and retains fourteen valid
image links. However, an unscored table splits the API name `UpdateItem` across
cells and inserts U+0002 after `Up`. This is a concrete example of table/text
damage outside the selected anchors: full annotated recall does not establish
complete information or layout fidelity. The recorded 22/22 remains unchanged.

The balanced DynamoDB repeat also recovers 22/22 and retains the same fourteen
image hashes, but its Markdown hash differs. The diff changes a bibliography
continuation from a table to prose and also changes content: a generated citation
label changes from `[5]` to `[7]`, while `G. Qinlan` becomes `G. Quinlan`. These
changes between repetitions are directly observed. After timing ended, visual
inspection of original PDF pages 13–14 confirmed that reference `[5]` starts on
page 13 and continues on page 14 with `S. Quinlan`; `[7]` identifies the separate
G-store reference. The author/citation damage is therefore confirmed against the
PDF, as well as the agreeing builtin and OpenDataLoader text. This is unscored
text/citation nondeterminism, not merely an image-path or whitespace difference.
Identical gold quality objects must not be presented as evidence that the complete
document is deterministic.

The balanced financial pair recovers all 26 anchors with identical Markdown
hashes. Its synthetic scan pair recovers all 28 anchors, including the Czech
proper name that the other OCR profiles alter, with identical Markdown hashes
and quality objects. Initial/repeat scan times are 124.14/124.36 seconds. It
exports no image assets and omits the large source-page headings, which are not
gold anchors. The 28/28 therefore establishes complete selected-anchor recovery,
not preservation of every source string. This profile has four byte-stable
successful pairs, one successful pair with unscored text changes and one pair
of timeouts.

## Interpretation limits

Recovery of separate numeric cells does not prove correct table associations.
The synthetic table's eight anchors verify retained strings, not whether an
agent will attach the right quantity or amount to the right row. Likewise,
recovering the words and operators of an equation does not prove preservation
of mathematical layout, subscripts or semantics.

An image count is asset-retention evidence, not an OCR quality score. A full-page
scan retained as an image can coexist with zero searchable text; a converter
that returns Markdown and no images may recover all annotated text. Compare
these capabilities separately when choosing a profile.

The important-information percentage is recall over frozen annotated source
quotes. It is not factual precision, a measure of every fact in each document,
generated-answer accuracy, reading-order correctness or a universal extractor
ranking. A perfect result on clean digital PDFs cannot establish quality on
scanned handwriting, camera captures or damaged documents. The synthetic OCR
lane is clean and deliberately controlled; it does not represent those harder
settings.

Repeated conversions are independent CLI invocations with existing model and OS
file caches, not reuse of one hot inference process. Initial quality and repeat
quality remain separate; a later successful conversion cannot erase a failed
first run. Output hashes reveal byte-level repeat differences, which can be
cosmetic even when all scored anchors are stable. Any such difference requires
inspection before attributing it to factual nondeterminism.
The runner's `repeatStable` compares both status and Markdown hash. Matching
timeouts with null hashes are stable failure outcomes, not evidence of repeatable
extracted text; successful-output stability must be reported separately.
