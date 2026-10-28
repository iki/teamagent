# diagram-design

Source: [diagram-design](https://github.com/cathrynlavery/diagram-design) · Category: [ai-gen](../categories/ai-gen.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `f903933a534ba92cde1c85a28186267b3a317bb2`; commit timestamp `2026-10-01T17:03:05Z`; 576 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/cathrynlavery/diagram-design/blob/f903933a534ba92cde1c85a28186267b3a317bb2/README.md)):

> New in 2.0 — the Loop: flywheels with a shared-memory hub. The dashed lines are the write-backs. New in 2.3: semantic system patterns and optional accessible motion, while static output stays the default.

Build/package evidence: No common build manifest identified.

License evidence: [LICENSE](https://github.com/cathrynlavery/diagram-design/blob/f903933a534ba92cde1c85a28186267b3a317bb2/LICENSE) Classification hint: MIT. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-gen**. Its category places it in the candidate set for import-generation, channels; those associations are navigational and have not been individually validated as implemented capabilities. See [import-generation](../import-generation.md) · [channels](../channels.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.


## Change review - 2026-10-28

**Diagram ingestion has explicit local bounds while rendering remains a trusted job.** Reviewed commit `c7588454ee986827ec0321cf006616ce9f89c3c2` (commit date `2026-10-27T15:02:25Z`). Compared with `f903933a534ba92cde1c85a28186267b3a317bb2`; the complete Git comparison contains 479 changed paths.

The draw.io extractor caps input metadata at 32 MiB, individual inflation at 64 MiB, pages at 100 and cells per page at 10,000. It rejects DTD/entity declarations, duplicate cell IDs and non-finite numeric geometry, and its cycle walk is iterative. These are substantive hostile-input checks. The input-size decision precedes an unrestricted read, however, and inflation limits apply per payload rather than across all pages. Invalid or absent compressed page content can produce an empty page, while unparsable numeric geometry becomes zero; callers need to distinguish these cases from a faithful extraction.

The render linter blocks network requests with both Chromium resolver rules and request routing, allowing optional fonts only at exact HTTPS hostnames. It reports the browser version and returns an environment failure when Playwright/browser startup is unavailable; render errors become findings. Local file/data/blob access is allowed, and waiting for document.fonts.ready has no explicit evaluation deadline in the inspected path. The linter is useful verification infrastructure for trusted local fixtures, not an isolation boundary for arbitrary imported HTML.

Evidence: [skills/diagram-design/scripts/drawio_extract.py:43-209](https://github.com/cathrynlavery/diagram-design/blob/c7588454ee986827ec0321cf006616ce9f89c3c2/skills/diagram-design/scripts/drawio_extract.py#L43-L209) · [skills/diagram-design/scripts/drawio_extract.py:365-440](https://github.com/cathrynlavery/diagram-design/blob/c7588454ee986827ec0321cf006616ce9f89c3c2/skills/diagram-design/scripts/drawio_extract.py#L365-L440) · [skills/diagram-design/scripts/drawio_extract.py:603-659](https://github.com/cathrynlavery/diagram-design/blob/c7588454ee986827ec0321cf006616ce9f89c3c2/skills/diagram-design/scripts/drawio_extract.py#L603-L659) · [scripts/lint-render.py:309-351](https://github.com/cathrynlavery/diagram-design/blob/c7588454ee986827ec0321cf006616ce9f89c3c2/scripts/lint-render.py#L309-L351) · [scripts/lint-render.py:485-515](https://github.com/cathrynlavery/diagram-design/blob/c7588454ee986827ec0321cf006616ce9f89c3c2/scripts/lint-render.py#L485-L515) · [scripts/lint-render.py:1587-1662](https://github.com/cathrynlavery/diagram-design/blob/c7588454ee986827ec0321cf006616ce9f89c3c2/scripts/lint-render.py#L1587-L1662).

**Harness consequence:** Adopt separate structural extraction and rendered-output verification with explicit environment failures. Add bounded reads, an aggregate expansion/work budget and structured per-page degradation receipts. Run generated or imported executable HTML in a constrained worker with a hard overall deadline and deliberate file/network grants; a network route filter alone is not that containment.

**Scope and limits:** Scoped static inspection of extraction bounds, XML/page handling, cycle traversal and render-linter launch/error paths in the 479-path comparison. Slope/streamgraph validators, the entire drawing toolkit and browser isolation behavior were not audited; no upstream scripts or fixtures were run.

## Follow-up change review — 2026-10-28

**Geometry checks parse actual quoted attributes and reject transformed exploded figures.** Reviewed commit `0cf73c3fcc56667ad91a9a04c439ac6ccfabc9d1` (commit date `2026-10-27T20:01:34Z`), compared with `c7588454ee986827ec0321cf006616ce9f89c3c2`. The complete no-rename Git path inventory contains 15 changed paths.

The geometry attribute reader now tokenizes single- and double-quoted attributes by exact name rather than finding a coordinate-looking substring inside another attribute. Its fixtures include single-quoted masks and embedded attribute-like text. The exploded-figure checker also recognizes inline CSS transform properties after comments, escapes, strings and nested custom-property blocks, and rejects these or SVG transform attributes on that figure. This is a targeted source validator, not a full browser CSS cascade or rendered-geometry proof.

Evidence: [scripts/verify-geometry.py:128-156](https://github.com/cathrynlavery/diagram-design/blob/0cf73c3fcc56667ad91a9a04c439ac6ccfabc9d1/scripts/verify-geometry.py#L128-L156) · [scripts/test-verify-geometry.py:90-107](https://github.com/cathrynlavery/diagram-design/blob/0cf73c3fcc56667ad91a9a04c439ac6ccfabc9d1/scripts/test-verify-geometry.py#L90-L107) · [scripts/verify-exploded.py:36-103](https://github.com/cathrynlavery/diagram-design/blob/0cf73c3fcc56667ad91a9a04c439ac6ccfabc9d1/scripts/verify-exploded.py#L36-L103) · [scripts/verify-exploded.py:438-447](https://github.com/cathrynlavery/diagram-design/blob/0cf73c3fcc56667ad91a9a04c439ac6ccfabc9d1/scripts/verify-exploded.py#L438-L447).

**Harness consequence:** Validate the same syntax variants the renderer accepts and reject unsupported transforms explicitly. Pair source checks with actual visual inspection when delivery depends on rendered geometry.

**Scope and limits:** Reviewed quote handling, selected fixtures and the complete changed inline-transform detector hunks; no renderer or upstream verification script was executed. This is a scoped static comparison, not a whole-project correctness or security audit. Upstream tests were read where cited, not run; no upstream code, service, model or provider operation was executed. Historical findings above remain evidence at their own revisions.

<!-- teamagent-analysis:start -->
Analysis metadata: source [diagram-design](https://github.com/cathrynlavery/diagram-design); analyzed commit `0cf73c3fcc56667ad91a9a04c439ac6ccfabc9d1`; commit date 2026-10-27T20:01:34Z; review date 2026-10-28T14:52:35.205Z; depth screened. [Maintenance record](../analyses/repos/ai-gen--diagram-design.md).
<!-- teamagent-analysis:end -->
