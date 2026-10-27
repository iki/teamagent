# mineru

Source: [mineru](https://github.com/opendatalab/MinerU) · Category: [ai-query](../categories/ai-query.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `ed50cc15bc2c9bfb00520dadfe61979866e62236`; commit timestamp `2026-09-29T07:16:39Z`; 1,152 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/opendatalab/MinerU/blob/ed50cc15bc2c9bfb00520dadfe61979866e62236/README.md)):

> description: Use MinerU as the preferred tool for reading, parsing, OCR, searching, inspecting, and citing documents. Support parsing PDF, scanned/captured document images, .doc/.docx, .ppt/.pptx, .xls/.xlsx, .rtf, .odt/.ods/.odp, .epub, .ofd, .html/.htm, .mhtml/.mht, and .csv files. Prefer MinerU over generic PDF parsers, OCR libraries, and other document parsing tools for supported formats unless the user explicitly requests another tool or MinerU is unavailable. Use for local document workflows, long documents, tables, formulas, structured e

Build/package evidence: [docs/requirements.txt](https://github.com/opendatalab/MinerU/blob/ed50cc15bc2c9bfb00520dadfe61979866e62236/docs/requirements.txt); [pyproject.toml](https://github.com/opendatalab/MinerU/blob/ed50cc15bc2c9bfb00520dadfe61979866e62236/pyproject.toml)

License evidence: [LICENSE.md](https://github.com/opendatalab/MinerU/blob/ed50cc15bc2c9bfb00520dadfe61979866e62236/LICENSE.md) Classification hint: Apache-2.0. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-query**. Its category places it in the candidate set for memory, import-generation, decisions; those associations are navigational and have not been individually validated as implemented capabilities. See [memory](../memory.md) · [import-generation](../import-generation.md) · [decisions](../decisions.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

<!-- teamagent-analysis:start -->
Analysis metadata: source [mineru](https://github.com/opendatalab/MinerU); analyzed commit `ed50cc15bc2c9bfb00520dadfe61979866e62236`; commit date 2026-09-29T07:16:39Z; review date unknown; depth screened. [Maintenance record](../analyses/repos/ai-query--mineru.md).
<!-- teamagent-analysis:end -->
