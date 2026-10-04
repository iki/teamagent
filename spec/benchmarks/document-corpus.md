# Document-query corpus

This is a locally authored, evidence-grounded retrieval benchmark using five real
PDFs already present in the sibling reference checkouts. It evaluates whether a
memory system can supply the evidence needed for document questions. It does not
measure an answering model's reasoning accuracy, establish the scientific claims
in the papers, or turn a retrieved passage into proof that an agent completed a
task correctly.

The executable source and case manifest is
[cases-documents.json](../../app/benchmark/cases-documents.json). PDF files and
their converted full text remain in the sibling checkouts or ignored benchmark
state; the repository contains provenance, questions, answer facts and short
evidence anchors only.

## Selection and provenance

Discovery was confined to `../ai-agents`, `../ai-agents-mem`, `../ai-info` and
`../ai-eval`. Selection favors substantive public reference documents rather than
synthetic one-page fixtures, private user documents, or only documents that a
particular parser handles well. No reference was downloaded or replaced. The
manifest pins the exact local bytes with SHA-256, file size, PDF page count, local
relative path, repository commit and origin URL. Reproduction must fail visibly
on a missing file or hash mismatch; it must not silently substitute a newer PDF.

| Source ID                   | Document                                                                                     | Pages |   Bytes | Split       | Why included                                                                                        |
| --------------------------- | -------------------------------------------------------------------------------------------- | ----: | ------: | ----------- | --------------------------------------------------------------------------------------------------- |
| `pdf-hermes-kanban`         | Hermes Kanban, design spec revision 01, April 25, 2026                                       |    33 | 213,669 | Development | Architecture, SQL, recovery, workspace tables, security limitations                                 |
| `pdf-memento`               | MEMENTO: Teaching LLMs to Manage Their Own Context                                           |    30 | 674,225 | Holdout     | Definitions, an equation, training procedures, figure captions, numeric ablations                   |
| `pdf-ncm-czech`             | Zpráva o výsledcích testů Neuromorfní Kognitivní Paměti na reálných datech, January 27, 2026 |     5 | 126,685 | Development | Czech morphology/diacritics, one English-to-Czech query, tables, references, contradictory evidence |
| `pdf-dynamodb-transactions` | Distributed Transactions at Scale in Amazon DynamoDB, USENIX ATC 2023                        |    14 | 378,686 | Holdout     | Dense two-column technical prose, protocols, failure recovery, graphs without absolute numeric axes |
| `pdf-disney-q1-fy25`        | The Walt Disney Company Q1 fiscal 2025 earnings release, February 5, 2025                    |    22 | 101,417 | Holdout     | Financial tables, units, date disambiguation, reconciliation, footnotes, explicit non-disclosure    |

The corpus has **104 pages and 1,494,682 input bytes**. PDF page numbers in gold
evidence are one-based physical PDF pages, including cover pages. For example,
DynamoDB PDF page 11 carries proceedings page 714. Printed page numbers are not
substituted for physical page identity.

The first-party Hermes and Microsoft documents are accompanied by repository MIT
licenses. The Czech NCM report is accompanied by CC BY-NC 4.0, attributed to Michal
Seidl and OpenTechLab Jablonec nad Nisou s.r.o.; retain its noncommercial and
attribution conditions if reusing that corpus. The USENIX paper and Disney
release are third-party documents: the MIT licenses of containing code
repositories are not assumed to cover them. The manifest records those caveats.
No PDF redistribution is part of this benchmark.

## Questions and split discipline

There are **40 questions: 34 answerable and six hard negatives**. Each PDF has
eight questions, so a long paper does not dominate the benchmark merely by
having more pages. Categories cover:

- Factual retrieval and exact technical terminology, including dates, percentages,
  protocol fields and numeric experimental settings.
- Definitions and limitations, including design versus implementation and
  non-GAAP versus GAAP measures.
- Multi-part and cross-page synthesis, such as a deletion-ordering mechanism plus
  its drawback, or a cash-flow definition plus its reconciliation.
- Tables, figures, a mathematical objective, footnotes and exact citation IDs.
- Czech queries, one cross-language query, and distinguishing a report's expected
  answer from its incorrect retrieved answer.
- Plausible but unanswerable details, rather than easy random-token negatives.

Development contains all 16 Hermes/NCM questions. Holdout contains all 24
MEMENTO/DynamoDB/Disney questions. Splitting by document family avoids near-duplicate
questions about the same paragraph crossing the boundary. The holdout must remain
unseen during retrieval tuning. Once its first results are inspected, further
changes require a new, independently authored holdout before making fresh
generalization claims. Repeating the old holdout remains useful as a regression
check but is no longer a fresh evaluation.

The corpus was annotated before observing any memory-system retrieval output.
The frozen canonical manifest SHA-256 is
`5a0c3aeb53f929c37b149fe8834461f61b18b8417c63d4ebda40c65de3cb405b`.
Canonicalization uses UTF-8 JSON, sorted object keys, preserved array order,
unescaped Unicode, and compact separators (`ensure_ascii=False`, `sort_keys=True`,
`separators=(",", ":")` in Python). Formatting whitespace therefore does not
change the freeze identity. Any question, answer, evidence, source or split change
requires a new version and explicit explanation; never alter gold merely to
improve a score.

## Gold annotation and extraction audit

Gold facts and evidence anchors were independently read from the original PDFs
using the project's Python 3.12.15 environment and pypdf 6.11.0. Every anchor was
checked against its named original PDF page before the freeze. Matching normalizes
Unicode with NFKC, removes soft hyphens, joins word fragments split by a line-end
hyphen, and collapses whitespace. These are textual equivalence operations;
matching must not paraphrase, supply absent numbers, translate evidence, or use
the gold answer to expand a query.

Poppler renders were visually inspected for Hermes page 10; MEMENTO page 5; NCM
pages 1, 2 and 4; DynamoDB page 11; and Disney pages 3, 18 and 20. This establishes
row/column alignment, equation structure, figure labels and the reported
discrepancies independently from converter output. Renders and working page text
are ignored scratch artifacts under `.cache/benchmark-documents/`.

The primary retrieval comparison should feed every system the same neutral
passages from the actual selected conversion path. This controls parser and
chunker differences while comparing retrieval. Separately audit every gold anchor
against that converted corpus and report missing or damaged anchors as extraction
losses. Publish both end-to-end evidence coverage and retrieval conditional on
available evidence. A missing anchor is not permission to remove the question,
invent replacement text, choose a different source, or award retrieval success.

Page references are source-grounding metadata. They are not proof that the
memory system currently exposes accurate page citations; assess exported or
returned citation fidelity separately. Similarly, finding prose around an
equation does not prove mathematical layout is preserved. The MEMENTO equation
question can be supported by nearby prose, but equation reconstruction remains a
distinct capability. Figure questions intentionally have textual supporting
captions or descriptions. This corpus does not establish image-only chart
understanding or OCR performance.

For answerable cases, evidence groups are required supporting spans. A multi-part
question is fully supported only when the returned context collectively covers
all required facts; a passage containing one easy keyword is insufficient. Report
partial evidence recall separately from complete support, ranking quality and
context size. Keep the query fixed across systems, use the same top-k/context-byte
budget, record latency distributions and preserve cold versus warm separation.

Negative questions have no positive evidence spans. They test whether an answer
would have support, not whether a lexical search API is obliged to return zero
results. Relevant-looking retrieval for a negative is not automatically an error:
some negatives require retrieving an explicit statement that the information is
not provided. An abstention metric needs a declared decision rule and threshold
calibrated on development data. Without an answering stage or calibrated
abstention policy, report negative retrieval/context behavior and leave answer
abstention unmeasured.

## Deliberate difficult cases

| Case                           | Required care                                                                                                                               |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `doc-hermes-kanban-06`         | A tenant namespace is not automatically access control; v1 assumes one owner.                                                               |
| `doc-hermes-kanban-07`         | A proposed cron interval is not measured p99 latency or throughput.                                                                         |
| `doc-ncm-czech-04`             | The four table counts sum to 75 while the text says 76. Preserve the mismatch; do not invent the missing case.                              |
| `doc-ncm-czech-05`             | The correct expected answer is 206 bones; 46 chromosomes is the report's wrong retrieved answer.                                            |
| `doc-ncm-czech-06`             | Query language is English and source evidence is Czech; no pretranslated duplicate document is supplied.                                    |
| `doc-memento-03`               | Preserve lambda, coefficient of variation and the minimum block-size constraint; prose retrieval alone does not certify equation rendering. |
| `doc-dynamodb-transactions-07` | The paper's ratios and workload conditions are reported results, not measurements taken in this repository.                                 |
| `doc-dynamodb-transactions-08` | Figure 8 lacks a numerical latency axis; an exact p99 millisecond value is not available.                                                   |
| `doc-disney-q1-fy25-03`        | Units are millions and the subtraction is $3,205 minus $2,466, not a sum or a cross-year comparison.                                        |
| `doc-disney-q1-fy25-08`        | Adjusted-EPS growth guidance must not replace the explicitly unavailable forward-looking GAAP EPS forecast.                                 |

## Initial extraction findings and repair

The [initial extraction audit](../../data/benchmarks/document-extraction-audit.json)
records the exact immutable converted-file hashes and neutral corpus hash. It
uses no search rankings. With importer version 1, only **66 of 113 gold anchors**
remain exact under the scorer's normalization. Ten more are separated by
Markdown table syntax, 28 have spacing or punctuation damage, and nine are
missing or reordered. Compact-character checks are diagnostic only and do not
count as retrieval success. Of 39 required evidence groups, 15 are complete in
the full converted Markdown and 14 fit a single neutral passage. Only 12 of 34
answerable cases retain all their exact anchors in the complete converted
documents; the single-passage-group constraint reduces that oracle to 11.

| Source                | Answerable cases with all exact anchors in full converted Markdown |
| --------------------- | -----------------------------------------------------------------: |
| Hermes Kanban         |                                                              1 / 6 |
| MEMENTO               |                                                              0 / 7 |
| NCM Czech             |                                                              6 / 7 |
| DynamoDB transactions |                                                              0 / 7 |
| Disney earnings       |                                                              5 / 7 |

The observed failure comes before retrieval: the pinned MarkItDown PDF converter
infers borderless tables from word positions and can classify normal prose as
cells while collapsing typographic word gaps. Its table reconstruction can also
separate labels from numeric values. This motivated importer version 2 to use
the already pinned pypdf plain-text extraction path for PDFs, retain explicit
physical page headings and embedded images, and warn that reading order, table
layout, equations, vector art and OCR are not reconstructed. It does not invent
spaces with a dictionary or silently rewrite document facts. Other document
formats retain their selected converters.

The repair's regression fixture is independent of this gold corpus: three small
synthetic pages contain positioned-word text, two prose columns, numeric rows,
and an empty page. Implementation validation uses that fixture plus the two
development PDFs. Original PDFs, gold labels, initial converted corpus and
initial results are retained for comparison.

[Development validation](../../data/benchmarks/document-parser-dev-validation.json)
confirms all 41 development anchors and all 38 physical page headings with
importer version 2. The generic fixture fails the old converter's prose-preservation
check and produces spurious pipe rows there; it passes the repaired importer.
The focused import suite passed 17 tests with 76 assertions. These validation
durations are not benchmark measurements. An initial invocation used Bun's
five-second default timeout and cut off the existing Git fixture; rerunning with
a longer integration timeout passed without changing that fixture or its checks.

The [version 2 extraction audit](../../data/benchmarks/document-extraction-audit-v2.json)
on the rebuilt neutral corpus finds **113 / 113 exact anchors**, all **39 / 39
evidence groups** and all **34 / 34 answerable cases** in the full converted
Markdown. This raises exact anchor availability from 58.4% to 100%, and complete
case availability from 35.3% to 100%. These are extraction-coverage measurements,
not answer-accuracy or retrieval-success scores.

Six groups still span more than one neutral passage: `doc-hermes-kanban-05`,
`doc-memento-06`, `doc-dynamodb-transactions-02`,
`doc-dynamodb-transactions-05`, `doc-dynamodb-transactions-06` and
`doc-disney-q1-fy25-07`. Consequently, a metric requiring every anchor of a group
to coexist in one passage has an oracle ceiling of 33 / 39 groups and 28 / 34
complete document cases (82.4%). This is a chunk/co-location constraint, not a
remaining extraction failure. Keep the original strict metric for comparability
and report collective anchor support across returned passages as a separately
labeled sensitivity analysis; do not loosen or rewrite the frozen gold labels.

The document holdout remains unseen for **retrieval ranking** during tuning.
However, its extraction coverage was inspected to diagnose the conversion
problem. It therefore cannot support a claim of fully blind end-to-end parser
evaluation. Stronger parser generalization claims would require a newly selected
document family after the repair is fixed.

The set is extensive enough to expose multiple retrieval and extraction failures,
but small and purposefully selected. It is not a representative sample of all
documents, languages, document layouts or agent workloads. Report per-source and
per-category results alongside aggregate scores, and do not rank all memory
systems universally from this local corpus.
