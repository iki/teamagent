# get-md

Source: [get-md](https://github.com/Nano-Collective/get-md) · Category: [ai-query](../categories/ai-query.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `fdd24fd8d010557ad14de224c15da0f16f4e78c8`; commit timestamp `2026-10-02T03:06:40Z`; 124 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/Nano-Collective/get-md/blob/fdd24fd8d010557ad14de224c15da0f16f4e78c8/README.md)):

> A fast, lightweight HTML, PDF, DOCX, and Markdown to Markdown converter optimized for LLM consumption — built by the Nano Collective, a community collective building AI tooling not for profit, but for the community. Everything we build is open, transparent, and driven by the people who use it. Lightning-fast (<100ms) with optional AI-powered conversion using a local LLM model. Pass in HTML, PDF, DOCX, Markdown files, or a URL and get clean, structured Markdown back — as a library or from the command line.

Build/package evidence: [package.json](https://github.com/Nano-Collective/get-md/blob/fdd24fd8d010557ad14de224c15da0f16f4e78c8/package.json)

License evidence: [LICENSE](https://github.com/Nano-Collective/get-md/blob/fdd24fd8d010557ad14de224c15da0f16f4e78c8/LICENSE) Classification hint: MIT. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-query**. Its category places it in the candidate set for memory, import-generation, decisions; those associations are navigational and have not been individually validated as implemented capabilities. See [memory](../memory.md) · [import-generation](../import-generation.md) · [decisions](../decisions.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.


## Change review — 2026-10-27

**Badge regeneration is not converter evidence.** Reviewed commit `0678c564ed98ac2f706c1c495b1cb317888fcc51` (commit date `2026-10-27T02:52:48Z`) against `fdd24fd8d010557ad14de224c15da0f16f4e78c8`. The complete Git comparison contains 2 changed paths.

The complete two-path comparison changes only the npm-download and star SVG badges. README, package metadata and conversion implementation are outside the changed-path set. This clears revision drift for the existing screening record without upgrading its evidence depth or validating the advertised conversion latency.

Evidence: [badges/npm-downloads-monthly.svg:1-1](https://github.com/Nano-Collective/get-md/blob/0678c564ed98ac2f706c1c495b1cb317888fcc51/badges/npm-downloads-monthly.svg#L1-L1) · [badges/stars.svg:1-1](https://github.com/Nano-Collective/get-md/blob/0678c564ed98ac2f706c1c495b1cb317888fcc51/badges/stars.svg#L1-L1).

**Harness consequence:** Continue to select conversion backends by measured content fidelity, bounded execution and provenance. Popularity counters are operational metadata and must not become quality-ranking features by default.

**Scope and limits:** Badge/changed-path reconciliation only; the prior inventory/README screening remains a screening, not a source correctness audit or benchmark.

## Follow-up change review — 2026-10-28

**Only the monthly-download badge changes.** Reviewed commit `30e80f5d38d471985cbd7fd729f76ebfc99f58ac` (commit date `2026-10-28T03:00:56Z`), compared with `0678c564ed98ac2f706c1c495b1cb317888fcc51`. The complete no-rename Git path inventory contains 1 changed paths.

The complete single-file diff changes a generated SVG's displayed monthly-download count and its matching geometry/accessibility label. No importer, request policy, parser or resource-refresh behavior changes. The badge is upstream popularity data and was not measured here.

Evidence: [badges/npm-downloads-monthly.svg:1-1](https://github.com/Nano-Collective/get-md/blob/30e80f5d38d471985cbd7fd729f76ebfc99f58ac/badges/npm-downloads-monthly.svg#L1-L1).

**Harness consequence:** Keep popularity metadata outside import-quality and safety evidence. Continue using the prior implementation review for extraction and network boundaries.

**Scope and limits:** Reviewed the complete one-line SVG delta as text; the image was not rendered. This is a scoped static comparison, not a whole-project correctness or security audit. Upstream tests were read where cited, not run; no upstream code, service, model or provider operation was executed. Historical findings above remain evidence at their own revisions.

<!-- teamagent-analysis:start -->
Analysis metadata: source [get-md](https://github.com/Nano-Collective/get-md); analyzed commit `30e80f5d38d471985cbd7fd729f76ebfc99f58ac`; commit date 2026-10-28T03:00:56Z; review date 2026-10-28T14:52:35.205Z; depth screened. [Maintenance record](../analyses/repos/ai-query--get-md.md).
<!-- teamagent-analysis:end -->
