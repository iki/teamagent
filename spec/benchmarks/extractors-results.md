# External document extractor results

The comparison uses the real import adapter and explicitly configured CLI option
sets for Xberg, Marker, MinerU, Docling and OpenDataLoader PDF, with the existing
builtin converter as a baseline. The measured versions and model setup are in
[runtime setup](extractor-runtimes.md). The [protocol](extractors-methodology.md)
defines scoring, failure accounting and reproduction; the [audit](extractors-audit.md)
distinguishes damaged information from conservative quotation-matching misses.

## Corpus and interpretation

The five reference PDFs contain 104 pages and 113 frozen annotated anchors across
34 answerable questions. They cover software architecture, memory research,
Czech prose, database transactions and financial tables. The separate repository-owned
image-only PDF has two pages and 28 anchors across 11 questions, including English
and Czech prose, identifiers, dates, numeric values and a table. Its gold was frozen
before extraction, and both pages contain no hidden text layer.

The quality percentage is **recovered annotated anchors / expected anchors**.
It is not a percentage of every fact in the PDFs, answer accuracy, factual
precision, correct table associations or visual fidelity. The digital and scanned
lanes must be compared separately. An exact miss can reflect lost text, changed
spelling, fragmented layout or an equivalent representation; consult the audit.

This is a calibration comparison, not a held-out generalization result. The
additional Xberg text-OCR option was chosen after inspecting this scan's setup
output. The gold remains frozen and the original option stays in the matrix,
but the tuned option still needs evaluation on independent scans before claiming
broader OCR superiority.

## Measured results

The [immutable final results](../../data/extractor-benchmarks/2026-10-04-full-v3/results.json)
contain **144 attempts: 142 successes and two timeouts**, covering 12 profiles,
six PDFs and an initial plus one fresh-process repetition. No engine was
unavailable. The [completion receipt](../../data/extractor-benchmarks/2026-10-04-full-v3/completion.json)
records the results digest.

The following quality scores use initial runs. Digital time is the sum for all
five reference PDFs; scan time covers the two-page scanned PDF. A zero from a
successful text-only scan conversion is distinct from a failed conversion with
null quality. Times are seconds, rounded to two decimals.

| Profile                     | Digital anchors   | Complete digital total (s) | Scan anchors    | Complete scan (s) | Successful runs |
| --------------------------- | ----------------- | -------------------------- | --------------- | ----------------- | --------------- |
| `builtin`                   | 113/113 (100.00%) | 8.38                       | 0/28 (0.00%)    | 1.18              | 12/12           |
| `xberg-native`              | 113/113 (100.00%) | 1.81                       | 0/28 (0.00%)    | 0.10              | 12/12           |
| `xberg-auto`                | 113/113 (100.00%) | 3.00                       | 17/28 (60.71%)  | 1.20              | 12/12           |
| `xberg-ocr-text`            | 113/113 (100.00%) | 3.06                       | 24/28 (85.71%)  | 1.11              | 12/12           |
| `opendataloader-xycut`      | 112/113 (99.12%)  | 8.79                       | 0/28 (0.00%)    | 1.10              | 12/12           |
| `opendataloader-structured` | 112/113 (99.12%)  | 8.26                       | 0/28 (0.00%)    | 1.38              | 12/12           |
| `mineru-flash`              | 111/113 (98.23%)  | 63.98                      | 0/28 (0.00%)    | 9.84              | 12/12           |
| `mineru-basic`              | 106/113 (93.81%)  | 211.11                     | 27/28 (96.43%)  | 17.96             | 12/12           |
| `docling-fast-text`         | 111/113 (98.23%)  | 253.91                     | 0/28 (0.00%)    | 35.49             | 12/12           |
| `docling-accurate-ocr`      | 111/113 (98.23%)  | 394.33                     | 27/28 (96.43%)  | 42.50             | 12/12           |
| `marker-fast-text`          | 110/113 (97.35%)  | 174.45                     | 0/28 (0.00%)    | 27.92             | 12/12           |
| `marker-balanced`           | 88/113 (77.88%)   | incomplete                 | 28/28 (100.00%) | 124.14            | 10/12           |

Marker balanced completed four of five digital documents: **88/89 anchors
(98.88%) conditionally on those successes**, but only **88/113 (77.88%) effective
recovery across the entire digital corpus**. Both Memento attempts exceeded the
20-minute limit. Full digital-corpus quality and successful completion time are
unmeasured; the failed paper is not dropped from the primary denominator.

## Measurement environment

This Windows x64 host uses an Intel Core Ultra 9 285H, 16 logical CPUs and
68,112,752,640 bytes of RAM. Bun is 1.4.2. The installed NVIDIA RTX 5090 Laptop
GPU has 24,463 MiB reported memory and driver 617.14. Marker requests the pinned
llama.cpp Vulkan backend. An [in-run GPU observation](../../data/extractor-benchmarks/setup/gpu-observation-1791148367289.json)
found the benchmark-owned llama-server as a C+G process on that GPU, with its
process ancestry verified. Device-wide utilization was 96%, but WDDM did not
provide per-process memory. GPU association is observed; attributable compute
load and exact layer-offload count were not measured. Docling and Marker's fast layout/error components
are configured for CPU. These are configuration-specific results, not an
equal-accelerator comparison.

All conversions run sequentially with no simultaneous repository tests, builds
or other task-owned model processes. Each document gets an initial invocation
and one fresh-process repetition. Timings include input staging, version checks,
process/model startup, conversion, output validation and cleanup. They exclude
model installation/download, scoring, result-file writes and memory database/index
publication. These are extraction measurements, not full ingestion or query latency. Existing model and
OS file caches are not evicted. No converted output or live model process is
reused between invocations. External profiles allow 20 minutes per document;
failures remain explicit rather than receiving substituted output.

## Reading the recommendations

Use `xberg-native` for known digital PDFs when OCR is unnecessary. It recovered
all 113 annotated digital anchors in the fastest completed digital run. The
explicit example configuration selects `xberg-ocr-text` as its fast mixed-input
default: the same digital recall plus 24/28 scanned anchors. Its Tesseract text
output avoided the Czech-line loss observed with the original `xberg-auto`
hOCR configuration. Imports without an external configuration still use the
builtin converter.

For the scanned fixture, `marker-balanced` recovered all 28 anchors in 124.14
seconds, the highest initial annotated recall in this comparison. Choose it when
that measured scan-recall benefit justifies its runtime and model setup; its
digital-paper timeouts and unscored text variability remain relevant limitations.
Its scanned output omitted the original large page headings, which are outside
the frozen anchors, and exported no separate images. The 28/28 score is therefore
not a claim that it preserved every important visual or textual element.
`mineru-basic` and `docling-accurate-ocr` both recovered 27/28 anchors; their remaining
miss was the spelling of a Czech proper name. MinerU basic completed that scan in
17.96 seconds, making it a faster option with higher recall than Xberg on this
fixture. Docling offers separately imported image
assets where present. MinerU's embedded data-URI images remain inside Markdown
and are reported as warnings, so a zero separate-image count does not mean that
all image bytes disappeared. Neither speed nor quotation recall alone measures
layout or table fidelity.

The audit separates representation differences from damaged information. For
example, OpenDataLoader's `15pp` instead of `15 pp` preserves the meaning but
misses the frozen exact anchor. Several MinerU and Marker math/table misses also
retain the underlying facts in another representation. The evaluator is not
retuned to erase those misses after seeing each extractor's output.
The reverse limitation also occurs: Marker's balanced database-paper output
recovered every annotated anchor but split the unannotated API name `UpdateItem`
across table cells with a control character. Full anchor recall therefore does
not certify complete text or table fidelity.
That document also produced different Markdown across fresh Marker balanced
processes while keeping the same complete anchor scores and image hashes.
Unscored bibliography text changed, including a citation label and a name's
spelling, as well as table-to-prose formatting. Equal benchmark scores therefore
do not establish deterministic or semantically identical output.
Direct inspection of the source bibliography confirmed the damaged name/citation
text. Across the entire matrix, all 71 successful pairs retained identical quality
objects, but only 70 retained identical Markdown bytes.

## Support, repetitions and artifacts

A complete evidence group contains every required anchor. Complete question
support contains every required evidence group; it does not mean that an agent
actually answered the question. Failed documents remain in the full-lane
denominators below.

| Profile                     | Digital groups | Digital questions | Scan groups | Scan questions |
| --------------------------- | -------------- | ----------------- | ----------- | -------------- |
| `builtin`                   | 39/39          | 34/34             | 0/11        | 0/11           |
| `xberg-native`              | 39/39          | 34/34             | 0/11        | 0/11           |
| `xberg-auto`                | 39/39          | 34/34             | 5/11        | 5/11           |
| `xberg-ocr-text`            | 39/39          | 34/34             | 7/11        | 7/11           |
| `opendataloader-xycut`      | 38/39          | 33/34             | 0/11        | 0/11           |
| `opendataloader-structured` | 38/39          | 33/34             | 0/11        | 0/11           |
| `mineru-flash`              | 37/39          | 32/34             | 0/11        | 0/11           |
| `mineru-basic`              | 34/39          | 29/34             | 10/11       | 10/11          |
| `docling-fast-text`         | 37/39          | 32/34             | 0/11        | 0/11           |
| `docling-accurate-ocr`      | 37/39          | 32/34             | 10/11       | 10/11          |
| `marker-fast-text`          | 36/39          | 31/34             | 0/11        | 0/11           |
| `marker-balanced`           | 31/39          | 26/34             | 11/11       | 11/11          |

Repeat elapsed totals include unsuccessful attempts explicitly. Markdown/image
sizes and image counts summarize successful **initial** conversions. A successful
pair requires both invocations to finish with a Markdown hash; two null hashes
from timeouts do not establish output stability. All eleven other profiles were
byte-stable across all six pairs. Marker balanced was stable on four of five
successful pairs; the database-paper variation is described above and in the
audit. Its failed Memento pair is excluded from the successful-pair denominator.

| Profile                     | Repeat digital elapsed, including failures (s) | Repeat scan elapsed (s) | Identical Markdown   | Initial successful Markdown (KiB) | Separate images | Images (KiB) |
| --------------------------- | ---------------------------------------------- | ----------------------- | -------------------- | --------------------------------- | --------------- | ------------ |
| `builtin`                   | 8.36                                           | 1.18                    | 6/6 successful pairs | 264.5                             | 27              | 1289.1       |
| `xberg-native`              | 1.83                                           | 0.14                    | 6/6 successful pairs | 262.5                             | 28              | 1659.0       |
| `xberg-auto`                | 3.06                                           | 1.16                    | 6/6 successful pairs | 263.8                             | 28              | 1659.0       |
| `xberg-ocr-text`            | 3.09                                           | 1.09                    | 6/6 successful pairs | 264.5                             | 28              | 1659.0       |
| `opendataloader-xycut`      | 8.00                                           | 1.13                    | 6/6 successful pairs | 259.7                             | 16              | 1157.3       |
| `opendataloader-structured` | 8.70                                           | 1.60                    | 6/6 successful pairs | 260.1                             | 16              | 1157.3       |
| `mineru-flash`              | 62.40                                          | 10.03                   | 6/6 successful pairs | 6270.0                            | 0               | 0.0          |
| `mineru-basic`              | 210.00                                         | 17.89                   | 6/6 successful pairs | 3052.8                            | 0               | 0.0          |
| `docling-fast-text`         | 254.17                                         | 34.66                   | 6/6 successful pairs | 326.2                             | 27              | 1407.1       |
| `docling-accurate-ocr`      | 393.79                                         | 41.45                   | 6/6 successful pairs | 308.7                             | 27              | 1407.1       |
| `marker-fast-text`          | 174.00                                         | 26.71                   | 6/6 successful pairs | 309.7                             | 26              | 1046.5       |
| `marker-balanced`           | 2283.07                                        | 124.36                  | 4/5 successful pairs | 198.2                             | 16              | 426.5        |

MinerU's larger Markdown includes embedded image data; zero separate-image count
does not imply that those image bytes were absent. Counts do not measure layout,
OCR fidelity or whether each image is useful. Marker balanced artifact totals
cover only its five successful initial documents.

## Initial elapsed time by document

The timeout entry is elapsed time spent before cancellation and cleanup, not a
successful extraction latency. Raw repeated per-document values and quality
objects are retained in the linked results JSON.

| Profile                     | Hermes elapsed (s) | Memento elapsed (s) | Czech elapsed (s) | DynamoDB elapsed (s) | Financial elapsed (s) | Scan elapsed (s) |
| --------------------------- | ------------------ | ------------------- | ----------------- | -------------------- | --------------------- | ---------------- |
| `builtin`                   | 1.68               | 1.96                | 1.23              | 2.21                 | 1.31                  | 1.18             |
| `xberg-native`              | 0.43               | 0.54                | 0.15              | 0.43                 | 0.25                  | 0.10             |
| `xberg-auto`                | 0.38               | 0.97                | 0.13              | 1.28                 | 0.23                  | 1.20             |
| `xberg-ocr-text`            | 0.39               | 0.95                | 0.12              | 1.33                 | 0.27                  | 1.11             |
| `opendataloader-xycut`      | 1.92               | 2.20                | 1.44              | 1.83                 | 1.41                  | 1.10             |
| `opendataloader-structured` | 1.50               | 2.35                | 0.86              | 1.93                 | 1.62                  | 1.38             |
| `mineru-flash`              | 14.64              | 14.50               | 11.18             | 11.85                | 11.81                 | 9.84             |
| `mineru-basic`              | 44.87              | 64.75               | 19.21             | 32.08                | 50.20                 | 17.96            |
| `docling-fast-text`         | 57.08              | 56.77               | 37.67             | 43.40                | 59.00                 | 35.49            |
| `docling-accurate-ocr`      | 82.23              | 113.12              | 40.28             | 49.73                | 108.97                | 42.50            |
| `marker-fast-text`          | 38.69              | 37.90               | 30.73             | 32.54                | 34.59                 | 27.92            |
| `marker-balanced`           | 455.49             | 1200.61 (timeout)   | 144.13            | 333.32               | 217.30                | 124.14           |

## Reproduction

Install the pinned runtimes and models described in [runtime setup](extractor-runtimes.md),
then adapt the absolute executable/cache paths if using another workstation.
The measured option values are preserved in
[`config-v2-2026-10-04.json`](../../data/extractor-benchmarks/config-v2-2026-10-04.json).
The public [`extractors.config.ts`](../../extractors.config.ts) contains the same
option profiles with recommendations beside their definitions.

```sh
aube run --no-install benchmark:extractors --config data/extractor-benchmarks/config-v2-2026-10-04.json --profiles builtin,xberg-native,xberg-auto,xberg-ocr-text,opendataloader-xycut,opendataloader-structured,mineru-flash,mineru-basic,docling-fast-text,docling-accurate-ocr,marker-fast-text,marker-balanced --output .cache/extractor-benchmark/new-run --repeat 1 --setup data/extractor-benchmarks/setup/runtime-final.json
```

The output directory must be new. Source/config/code/executable hashes and actual
version inspections accompany every run. Raw third-party Markdown and images
stay in the ignored local cache; checked-in evidence retains metadata and quality
outcomes. The original PDFs are not redistributed.

The exact measured implementation is retained in the
[source snapshot](../../data/extractor-benchmarks/2026-10-04-full-v3/source-snapshot.json).
During the long final profile, capture-provenance and host-interruption fixes
were prepared separately; the running Bun process had already loaded its source.
The on-disk Python converter/Marker launcher, frozen profiles and scoring code
were unchanged throughout timing. The archive therefore identifies the measured
code even when the current checkout contains later lifecycle improvements.

## Preserved earlier observations

The [first fast-profile run](../../data/extractor-benchmarks/2026-10-04-fast-v1/results.json)
used evaluator version 1. Seven cosmetic Markdown/equation-spacing misses exposed
generic evaluator defects. Version 2 fixes those classes with regression tests;
the gold quotations remain unchanged. Do not count this evaluator correction as
improved extractor quality.

The [interrupted second run](../../data/extractor-benchmarks/2026-10-04-partial-v2/archive.json)
preserves 102 completed measurements and their exact code snapshots. Real Docling
output exposed stale temporary file URLs even though the image assets were saved.
The run was stopped intentionally, and the unfinished invocation receives no
invented failure, time or score. The adapter now rebases only validated contained
assets, with one-pass replacement and Markdown-relative path precedence. A real
[Docling smoke](../../data/extractor-benchmarks/setup/docling-image-smoke-1791145516829.json)
verified the repaired image link, content hash and cleanup. A basename collision
was a separate code-review finding verified by fixtures, not an observed error
in the reference PDF output layouts.
