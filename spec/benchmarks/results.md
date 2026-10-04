# Memory benchmark results — 2026-10-04

Teamagent's original search returned no evidence for any of the 74 answerable
natural-language questions. After repairing retrieval and PDF extraction, it
finds relevant evidence in the top five for **59/74 questions**. The held-out
portion is **30/41**, compared with **31/41 for context-mode** and **27/41 for
MemPalace hybrid**. This is a substantial improvement over our starting point,
not a universal win: context-mode supplies more complete held-out evidence,
MemPalace hybrid performs better with short document passages, and the dense
substrate has lower query latency.

These measurements evaluate evidence retrieval for coding-agent tasks and
document questions. They do not measure autonomous patches, generated answers,
live model quality or successful completion of an agent objective.

## Corpus and comparison

Independent corpus authors froze **88 questions: 74 answerable and 14 hard
negatives** before seeing retrieval rankings. The development split has 40
questions, including 33 answerable; holdout has 48, including 41 answerable.
The source and task manifests retain hashes, exact evidence, rationale and
development/holdout assignments.

| Source           | Selected material                                                     | Coding questions |
| ---------------- | --------------------------------------------------------------------- | ---------------: |
| Hermes           | 37 committed files; context/memory, deadlines and file safety         |               12 |
| Pi               | 47 committed files; execution loop, tools, queues and lifecycle       |               12 |
| Wayland          | 40 committed files; capability evidence, approval cache and redaction |               12 |
| DeepSeek Harness | 55 committed files; ACP/MCP and session/model lifecycle               |               12 |

The **179 files contain 3,378,076 bytes**. They are named subsystems with
distractors, not the complete repositories. Exact commit bytes were obtained
without using unrelated working-tree changes. Coding tasks cover exact symbols,
natural-language investigation, multi-file evidence, configuration precedence,
security boundaries and lifecycle behavior. See the [coding corpus](code-corpus.md).

The **five PDFs contain 104 pages and 40 questions**: Hermes Kanban specification,
the Czech NCM document, Microsoft's MEMENTO paper, DynamoDB Transactions and
Disney FY25 Q1 earnings. They cover multilingual retrieval, table values,
equations, cross-section synthesis and absent information. Gold evidence has
113 quote anchors in 39 groups. Physical pages and selected figures/tables were
inspected independently. See the [document corpus](document-corpus.md).

We inspected the 70-directory memory-reference inventory and ran two relevant
local implementations: **context-mode 1.0.169** and **MemPalace 3.11.0**. We also
ran MemPalace's lexical ablation and its actual **Chroma 1.5.7 / MiniLM dense
substrate**. Those ablations are not additional independent memory products.
[Selection and exclusions](../benchmark-competitors.md) record exact commits,
licenses and why graph/generation-dependent systems were not represented by
surrogate implementations. No paid model, synthetic embedding or LLM judge was used.

Every engine received identical text, source headers and questions, searched the
whole corpus, and returned at most ten passage IDs. The main repaired corpus has
3,700 passages, bounded to 30 lines / 1,600 body characters. A second common corpus
has 7,401 passages bounded by the actual MiniLM tokenizer to 256 tokens including
headers and special tokens. It eliminates embedding truncation for every passage.
All timing runs were sequential on Windows x64, Intel Core Ultra 9 285H,
16 logical processors, approximately 68.1 GB physical memory, Bun 1.4.2 and
Python 3.12.15.

## Improvements and retained iterations

| Iteration                                   | Development Hit@5 | Held-out Hit@5 | Change                                                                                          |
| ------------------------------------------- | ----------------: | -------------: | ----------------------------------------------------------------------------------------------- |
| Original implementation                     |              0/33 |           0/41 | All query terms were required, including natural-language grammar words                         |
| Retrieval repair, original extracted corpus |             25/33 |          21/41 | Informative terms, OR candidates, stemming, identifier splitting and bounded coverage reranking |
| Retrieval plus PDF repair                   |             29/33 |          30/41 | Physical-page text extraction restores spacing and removes damaging guessed table serialization |

The original competitor advantage came from real query processing and semantic
retrieval. Teamagent now uses Porter stemming, original plus camel/snake/path
identifier terms, and BM25 candidates moderated by informative term coverage.
It considers at most 200 candidates; workspace/source authorization remains in
the database query. No corpus names, answer phrases or task-specific synonyms
were added. Schema 1 indexes migrate transactionally to schema 2 while preserving
source versions, manifests and original blobs. Regression tests exercise natural
questions, identifier lookup and migration integrity.

The extraction audit exposed a separate defect: only **66/113 PDF anchors**
survived the original converter. The repaired page-text path retains
**113/113 anchors and all 39 evidence groups** in full Markdown, preserves embedded
images, and emits explicit physical-page headings. A generic positioned-text PDF
fixture demonstrably failed the previous converter and passes now. Parser identity
advanced to `teamagent-import/2`; the existing pinned dependencies were sufficient.
This is text extraction, not OCR or proof of perfect visual table reconstruction.

All systems were rerun on the repaired text. Otherwise a parser improvement could
be mistaken for a ranking advantage exclusive to Teamagent. The
[before](../../data/benchmarks/document-extraction-audit.json) and
[after](../../data/benchmarks/document-extraction-audit-v2.json) audits preserve the
failure classifications and every anchor outcome.

The [tuning freeze](../../data/benchmarks/tuning-freeze.json) preceded inspection
of any holdout retrieval scores. However, extraction availability was audited on
all five PDFs. Parser validation used a synthetic fixture and development PDFs;
this is therefore not a fully blind end-to-end parser holdout. No ranking changes
were made after opening holdout. The subsequent Git capacity optimization affects
acquisition failure handling, not retrieval ranking.

## Held-out main results

Hit@5 requires at least one complete annotated evidence group in a single returned
passage. **Collective complete@5** instead requires all gold anchors across the
five returned passages, with correct source/path and annotated coding span.
It is an exploratory secondary measure added when the extraction audit revealed
legitimate chunk boundaries. It can exceed strict Hit@5 for document questions
whose anchors span passages. Original metrics and gold labels remain preserved.

| System                 | Hit@1 |         Hit@5 | Hit@10 | Collective complete@5 | MRR@10 | Warm p95 |
| ---------------------- | ----: | ------------: | -----: | --------------------: | -----: | -------: |
| Teamagent              | 20/41 | 30/41 (73.2%) |  34/41 |                 27/41 |  0.598 | 19.29 ms |
| context-mode           | 17/41 | 31/41 (75.6%) |  32/41 |                 30/41 |  0.534 | 28.85 ms |
| MemPalace hybrid       | 21/41 | 27/41 (65.9%) |  31/41 |                 28/41 |  0.565 | 79.25 ms |
| MemPalace lexical      | 17/41 | 28/41 (68.3%) |  31/41 |                 24/41 |  0.532 | 84.96 ms |
| Chroma dense substrate | 19/41 | 29/41 (70.7%) |  31/41 |                 26/41 |  0.558 | 14.77 ms |

Wilson 95% Hit@5 intervals are Teamagent **58.1–84.3%**, context-mode
**60.7–86.2%**, MemPalace hybrid **50.5–78.4%**, lexical **53.0–80.4%**, and
dense **55.5–82.4%**. They overlap widely. These small, correlated source families
do not establish statistically reliable superiority. Against context-mode,
Teamagent has zero unique Hit@5 wins and one loss on this split; against MemPalace
hybrid it has six wins and three losses. Full paired outcomes and source/category
slices are in the [held-out report](../../data/benchmarks/reports/main-holdout.json).

| Held-out slice                  | Teamagent | context-mode | MemPalace hybrid | MemPalace lexical | Dense |
| ------------------------------- | --------: | -----------: | ---------------: | ----------------: | ----: |
| Coding Hit@5                    |     16/20 |        16/20 |            12/20 |             15/20 | 14/20 |
| Documents Hit@5                 |     14/21 |        15/21 |            15/21 |             13/21 | 15/21 |
| Coding collective complete@5    |      8/20 |        10/20 |             9/20 |              7/20 |  8/20 |
| Documents collective complete@5 |     19/21 |        20/21 |            19/21 |             17/21 | 18/21 |

Across development and holdout combined, main Hit@5 is **59/74 Teamagent,
58/74 context-mode, 53/74 hybrid, 52/74 lexical, 54/74 dense**. Teamagent has
the highest combined MRR, 0.637. Context-mode has one more completely supported
top-five answer, 52 versus 51; at ten passages Teamagent has 61 versus 60.
The combined score includes tuned development tasks and must not replace the
held-out comparison. [Full main report](../../data/benchmarks/reports/main-all.json).

## Token-budget sensitivity and remaining advantages

The main corpus truncates **3,296/3,700 inputs (89.1%)** in the actual MiniLM
encoder. Lexical paths retain the entire text. The short lane removes this
confounder and also makes each retrieved context smaller, so it is a separate
comparison, not a drop-in identical context budget.

| System, short holdout  | Hit@5 | Collective complete@5 | Collective complete@10 | Mean characters@5 | Warm p95 |
| ---------------------- | ----: | --------------------: | ---------------------: | ----------------: | -------: |
| Teamagent              | 27/41 |                 24/41 |                  32/41 |             4,376 | 21.12 ms |
| context-mode           | 27/41 |                 26/41 |                  31/41 |             4,187 | 37.57 ms |
| MemPalace hybrid       | 28/41 |                 29/41 |                  31/41 |             4,278 | 70.35 ms |
| MemPalace lexical      | 21/41 |                 21/41 |                  26/41 |             4,423 | 83.99 ms |
| Chroma dense substrate | 25/41 |                 22/41 |                  31/41 |             4,005 | 14.76 ms |

MemPalace hybrid's short held-out document completeness is **20/21 versus
Teamagent's 17/21**. Across all 74 answerable short-lane questions, it supplies
complete top-five support for **50**, versus Teamagent's **43**, even though
Teamagent has more strict Hit@5 results, 53 versus 52. Increasing the budget to
ten short passages changes complete support to Teamagent 55 versus hybrid 52.
The result depends on evidence granularity and context budget; semantic retrieval
is useful even when its aggregate strict hit count is lower.
[Short held-out report](../../data/benchmarks/reports/short-holdout.json),
[full short report](../../data/benchmarks/reports/short-all.json).

Concrete remaining differences explain the next research direction:

- context-mode retrieves complementary implementation/definition evidence for
  Hermes deadlines and configuration, and DeepSeek provider-default selection.
  Teamagent sometimes spends its top five on only one part of a multi-file answer.
- MemPalace hybrid retrieves Pi's concurrent-prompt diagnostic under a paraphrase
  that Teamagent misses at ten, and complementary DeepSeek teardown regression
  evidence. Its vector candidate union adds useful semantic coverage.
- Every reference ranks the MEMENTO dual-channel improvement paragraph fourth or
  fifth; Teamagent ranks it sixth. That single threshold crossing explains
  context-mode's extra main held-out Hit@5 success.
- The dense substrate's warm query p95 is approximately 15 ms, below Teamagent's
  approximately 20 ms. context-mode uses less peak resident memory. Those remain
  measured advantages even where other quality or setup costs favor Teamagent.

The detailed [independent competitor analysis](competitor-findings.md) retains
task IDs and evidence. An optional semantic candidate service and bounded evidence
diversification are justified experiments, not demonstrated product improvements.
They require a new held-out set after this one has been inspected. We retained
the measured lexical improvement rather than tune these now-open answers into
production or claim that every competitor advantage has disappeared.

## Resource costs and source lifecycle

| Main corpus worker             |  Ingest | Stored data | Peak resident memory | Separately measured startup |
| ------------------------------ | ------: | ----------: | -------------------: | --------------------------: |
| Teamagent                      | 14.21 s |    24.89 MB |            251.23 MB |                       22 ms |
| context-mode                   | 28.23 s |    36.46 MB |            192.93 MB |                       23 ms |
| MemPalace/Chroma shared worker | 52.43 s |    50.06 MB |            829.40 MB |                      2.34 s |

MB uses decimal bytes. Teamagent storage includes its retained passage sources,
versions and blobs; the stores are not feature-equivalent. The Python worker's
three modes share one index and encoder: neither its ingestion nor its footprint
should be multiplied by three or attributed to standalone lexical search.
The separate initial Python environment occupied 423.57 MB, and model setup
downloaded an 83.18 MB archive containing a 90.39 MB ONNX model. Download/setup
took 29.78 seconds in the recorded setup, outside query timing.

The short lane roughly doubles ingestion work: **30.39 s Teamagent,
66.41 s context-mode, 104.62 s shared Python**. Disk is respectively
28.66 / 42.08 / 57.29 MB; peak RSS is 254.99 / 195.58 / 816.73 MB.
No memory stress, concurrent load, long-duration soak or distributed scaling
claim follows from these single-machine measurements.

The native acquisition/lifecycle lane uses the actual import API, separate from
equal-passage ranking. Its final rerun passed **35/35 checks**, retaining
**179 originals, 179 Markdown derivatives and all 79 coding evidence spans**.
It checks unchanged/changed sync, immutable historical reads, index replacement,
deletion, scope isolation, cancellation, cleanup and explicit capacity failure.
Committed subsystem bytes are staged as folders with their commit provenance in
the benchmark manifest; this is not successful full-repository Git ingestion.

The full Pi repository exceeds the current 256 eligible-file capture limit.
Originally the importer read blobs before discovering that limit and rejected it
in **24,044 ms**. Preflighting the pinned tree now rejects the same repository in
**98 ms**, approximately **245× faster in these single samples**. Four regression
tests preserve exclusions/order and prove rejection precedes blob reads with a
real Git tree whose blobs are deliberately unavailable. The failure is typed
`capacity`, leaves no published source, and does not raise existing size limits.
[Before](../../data/benchmarks/runs/lifecycle-v2.json) and
[after](../../data/benchmarks/runs/lifecycle-preflight.json) retain the actual trials.

## Reliability and interpretation limits

All revised retrieval modes returned stable IDs across all four observations of
each question, with **zero query errors** in both main and short lanes. Baseline,
intermediate and final artifacts retain **5,632 actual search calls**; repeats
measure timing/stability, not independent quality samples. Warm means three
immediate repeated calls. OS caches were not flushed, and the initial observation
is not cold-disk or unloaded-model latency.

Every revised engine returned candidates for all 14 hard negatives. This is
neither verified answer abstention nor proof that a model would answer falsely.
The original engine's empty negatives were accompanied by empty positives.

Strict passage scoring has a document ceiling: six repaired evidence groups cross
main passage boundaries, so only 28/34 document cases have all groups individually
extractable from single passages. Full Markdown supports all 34. The collective
metric helps characterize this without changing labels. Evidence-page annotations
were audited against PDFs but the rank scorer enforces source/path/quotes and
coding spans, not physical PDF-page citation accuracy. Gold supports are sufficient
but not exhaustive; useful neighboring context can be uncredited. Images are
retained and inspected for corpus annotation, not searched through a vision model.

The assembled step gate passed **122 tests across 18 files**, 473 assertions,
formatting, architecture checks, four strict TypeScript programs and type-aware
Oxlint. Dedicated tokenizer fixtures validate Unicode offsets and token budgets.
Final delivery verification is recorded in [verification](../harness-verification.md).
No reference checkout, production memory store, global agent installation or
provider account was changed.

## Reproduction and artifacts

Use the [protocol](methodology.md), exact source manifests and
[competitor setup](../benchmark-competitors.md). Aube owns JavaScript installation;
the model stack is isolated in its own pinned Python environment. Run measurement
processes sequentially. Output paths are exclusive: use fresh names on every run.
Current product runs reproduce the repaired variant; the initial raw baseline is
preserved rather than relabeled as current behavior.

```powershell
aube run --no-install imports:setup
aube run --no-install benchmark:memory prepare --output .cache/memory-benchmark/repro-corpus.json
aube run --no-install benchmark:memory teamagent --label repro --corpus .cache/memory-benchmark/repro-corpus.json
aube run --no-install benchmark:memory competitor-input --corpus .cache/memory-benchmark/repro-corpus.json --label repro-competitors --output .cache/memory-benchmark/competitor-input-repro.json
New-Item -ItemType Directory .cache/memory-benchmark/repro-competitors
bun app/benchmark/competitors/context-mode.ts .cache/memory-benchmark/competitor-input-repro.json .cache/memory-benchmark/repro-context.json
.cache/benchmark-python/Scripts/python.exe -I app/benchmark/competitors/mempalace.py .cache/memory-benchmark/competitor-input-repro.json .cache/memory-benchmark/repro-mempalace.json
aube run --no-install benchmark:memory report .cache/memory-benchmark/repro/result.json .cache/memory-benchmark/repro-context.json .cache/memory-benchmark/repro-mempalace.json --corpus .cache/memory-benchmark/repro-corpus.json --split all --output .cache/memory-benchmark/repro-report.json
bun app/benchmark/lifecycle.ts --output .cache/memory-benchmark/repro-lifecycle.json
```

For the short lane, run `short-passages.py INPUT_CORPUS NEW_SHORT_CORPUS`, then all
three drivers again with fresh labels and that same short corpus. The reference
adapters require an existing empty output directory named in their input; create
`.cache/memory-benchmark/repro-competitors` before invoking them. Preparation reads
exact committed source paths and uses the real isolated converter. It does not
download replacement repositories or PDFs when a source is absent.

Raw rankings/timings are under [runs](../../data/benchmarks/runs), nine scored
reports under [reports](../../data/benchmarks/reports), and dependency/model hashes
under [setup](../../data/benchmarks/setup). The [artifact inventory](../../data/benchmarks/manifest.json)
records corpus identities and file hashes. Canonical source bodies, copyrighted
PDFs and model weights remain local and are not redistributed. Retain matching
local corpora and competitor input files to rescore old raw measurements; the
reporter rejects mismatched corpus identities instead of silently comparing IDs
from different text versions.
