# External extractor runtimes

The October 2026 extractor comparison uses the already installed local tools,
with model downloads completed separately from extraction measurements. Package
inventories, installed wheel RECORD hashes, executable hashes, reference commits
and model checksums are retained in
[runtime-inventory.json](../../data/extractor-benchmarks/setup/runtime-inventory.json).
The [setup follow-up](../../data/extractor-benchmarks/setup/runtime-followup.json)
retains downloaded model revisions and subsequent Windows lifecycle observations.
The [final setup record](../../data/extractor-benchmarks/setup/runtime-final.json)
links the preserved earlier inventories, final candidate configuration, pinned
Windows launcher and actual importer smoke receipts.
The measured profile configuration is retained alongside the benchmark results.

| Requested tool | Measured runtime            | Local reference                  | Version probe                     |
| -------------- | --------------------------- | -------------------------------- | --------------------------------- |
| Xberg          | `xberg` 1.3.3               | `../ai-query/xberg`              | `xberg --version`                 |
| Marker         | `marker-pdf` 2.0.0          | `../ai-query/marker`             | Installed Python package metadata |
| MinerU         | `mineru` 4.0.10             | `../ai-query/mineru`             | `mineru-kit --version`            |
| Docling        | `docling-slim` 2.132.0      | `../ai-query/docling`            | `docling convert --version`       |
| openpdfloader  | `opendataloader-pdf` 2.5.12 | `../ai-query/opendataloader-pdf` | Installed Python package metadata |

The last name is resolved to **OpenDataLoader PDF**, the matching reference
project. Xberg is the current project and executable; the old Kreuzberg CLI was
not substituted. These names identify implementations, not an assumed quality
ranking. The comparison uses measured evidence coverage.

## Profile choices

Xberg's native profile disables OCR and quality postprocessing. The automatic
profile enables quality processing and Tesseract OCR with English and Czech
language data. Both export Markdown and images, disable extraction-result
caching, and limit threads to four. The automatic profile also disables the OCR
cache through an explicit Tesseract configuration. A follow-up third profile
selects Tesseract text output before rendering the final Markdown. The initial
scan probe showed that the Markdown OCR path's dictionary filter removed eleven
lines, including important Czech information. Text output retained those lines;
it can change table presentation, while the benchmark separately measures evidence
coverage. A base64 JSON argument avoids shell quoting and placeholder
ambiguity. Layout-model and remote VLM settings remain configurable, but these
profiles do not enable them. See the official
[CLI reference](https://docs.xberg.io/reference/cli/).

Marker compares its fast layout/text-layer pipeline with OCR disabled against
balanced mode using the local Surya 2 model. Both retain image extraction. Fast
layout and the OCR error detector are configured for CPU. Balanced mode uses the
pinned llama.cpp Vulkan binary and local GGUF model, with Surya's default request
to offload 99 model layers. The retained setup logs do not identify the inference
device or confirm GPU offload. The
[device evidence audit](../../data/extractor-benchmarks/setup/device-evidence.json)
records the source defaults, log hashes and available excerpts. A later
[full-v3 observation](../../data/extractor-benchmarks/setup/gpu-observation-1791148367289.json)
listed the benchmark-owned llama-server as a C+G process on the RTX 5090 Laptop
GPU and verified its process ancestry. WDDM per-process memory was unavailable;
the observed 96% utilization is device-wide. This establishes GPU association,
not an exact offloaded-layer count or attributable compute measurement. There is no
external LLM service or `--use_llm`. Speed comparisons must retain this acceleration
configuration and its verification limit. Marker 2's architecture
differs substantially from older examples: see the
[official repository](https://github.com/datalab-to/marker).

MinerU 4 uses the stateless `mineru-kit parse` command. Flash with text extraction
is compared with basic automatic OCR and its ONNX small-model pipeline. Every
PDF page is requested explicitly. Neither profile uses the hosted service or
the standard/advanced VLM tiers. The old `mineru -p ... -o ...` syntax is not the
installed version's contract. See its
[CLI documentation](https://opendatalab.github.io/MinerU/usage/cli_tools/).

Docling compares standard-pipeline fast tables with OCR disabled against
accurate tables with RapidOCR and its Czech/Latin-script recognizer. Both use
CPU, four inference threads, referenced images and explicit local model assets.
Docling 2.132 introduces the `convert` subcommand; the full `docling` package is
a convenience package over `docling-slim` and selected extras. The installed
runtime already contains the needed components. See the
[CLI reference](https://docling-project.github.io/docling/reference/cli/).

OpenDataLoader compares single-threaded XY-Cut reading order and default table
detection with structure-tree reading order and cluster table detection.
Structure-tree behavior depends on whether the input contains usable tags;
the setting does not manufacture tags. Both retain external images and native
local processing; hybrid remote backends are disabled. Java is Temurin
21.0.12+8.0.LTS. See the
[Python/CLI guide](https://opendataloader.org/docs/quick-start-python).

## Reproducing setup

The profile file uses absolute local executable paths. Other machines must
install the same package versions and update paths explicitly. The checked-in
inventory describes the installed dependency set; it is not a claim that a
fresh unconstrained package install will resolve to the same dependencies.

Models are under `.cache/extractors-models`; no model weights are committed.
The recorded set contains 72 files totaling 3,696,830,852 bytes, including
auxiliary configuration, model licenses and assets fetched during setup. It
includes both TableFormer generations downloaded by the setup command; not all
downloaded assets are necessarily executed by every profile.

Setup commands used the installed version's tools:

```text
mineru-kit models download --tier basic --small-backend onnx --source huggingface
docling-tools models download layout tableformer tableformerv2 --output-dir CACHE/docling
docling-tools models download rapidocr --rapidocr-backend-lang onnxruntime:en --output-dir CACHE/docling
docling-tools models download rapidocr --rapidocr-backend-lang onnxruntime:cs --output-dir CACHE/docling
```

Set `MINERU_HOME` and `HF_HOME` to the workspace cache before model preparation.
Marker's `datalab-to/surya_layout2` and `datalab-to/surya-ocr-2-gguf` assets were
downloaded with the installed Hugging Face client. The latter was revision
`6a3a4c30e5e74446d4f8b6afd05b2f2da970f470`. The existing OCR error model was copied
from the local cache rather than downloaded again. Use the inventory's per-file
hashes to verify all reused or downloaded assets.

The additional inference binary is the official
[llama.cpp b11146 Windows Vulkan archive](https://github.com/ggml-org/llama.cpp/releases/download/b11146/llama-b11146-bin-win-vulkan-x64.zip),
SHA-256 `55a378aa095b466979d85075234f66d7655c7a7483222af0c006c0e55b4d7bd6`.
It is unpacked in `.cache/extractors-llama-b11146`; no global install is needed.
Model licenses are distinct from extractor code licenses and are retained with
the downloaded assets.

The final profiles select local model paths and disable Hugging Face network
lookups during extraction. Xberg uses `XBERG_CACHE_DIR`; MinerU uses
`MINERU_HOME`; Marker uses explicit model paths and a workspace-only child
`USERPROFILE` because its server registry otherwise uses a hardcoded home cache.
This is configuration isolation, not an operating-system network sandbox.

## Setup observations

One-page probes exercised actual CLI commands and produced Markdown for all
five tools. These setup measurements include interpreter and model startup;
they are not the corpus benchmark. The raw successful probes are included in
the setup inventory. Xberg's separate two-page scanned-fixture probe took
3.125 seconds and exercised both language packs.

The first direct Marker balanced probe produced Markdown, then exposed an
upstream Windows cleanup issue: Surya calls `os.kill(pid, 0)` as if it were a
POSIX existence check. On Windows that value is a console control event. The
import adapter now gives extractors a separate hidden process group, and its
timeout path terminates descendant processes. A subsequent direct probe in a
hidden process group exited successfully in 57.625 seconds but warned about
cleanup; a separate importer probe failed and was retained as a failure.
Neither is a successful timed corpus run. Surya's small-model servers are
persistent by design, independent of its VLM keep-alive setting. Benchmark-owned
helper processes were inspected and stopped before timing. The final measured
configuration records the
[Windows Marker launcher](../../app/imports/marker-windows.py) separately from
these initial probes. It accepts only the pinned Marker/Surya versions, assigns
the invocation to a Windows job whose lifetime owns all subprocesses, and
preserves the CLI's exit status. It avoids the upstream interpreter-exit cleanup
after conversion; closing the job terminates owned helpers. Installed packages
and extraction/model logic are unchanged. The importer retries only transient
staging-deletion failures within a bounded delay, because Windows can retain
file locks briefly after helper termination. The earlier failed attempts remain
in the setup receipts.

The final one-page balanced importer probe succeeded in 63.944 seconds, including
version verification, model startup, conversion and staging cleanup. The fast
profile also passed through the actual importer. No Marker, Surya or llama.cpp
helper processes remained after the final probe. These figures are setup
observations, not the quality/speed result for the full corpus. Final isolated
Python commands explicitly use `-B` because `-I` ignores the
`PYTHONDONTWRITEBYTECODE` environment variable.

Setup smokes and model preparation are intentionally separate from first
measured and repeated extraction. A warmed file/model cache is not a cold boot,
and an on-demand local inference server may still have startup cost per CLI
invocation. Report this distinction with the corpus results.
