# trafilatura

HTML extraction cascade that escalates from a primary pass to alternative and recall-oriented recovery.

Source: [trafilatura](https://github.com/adbar/trafilatura) · Snapshot: `6c1977a00b4e82ebb7e6fad1192467adaf24d430` · Category: `ai-query`.

Evidence level: **Source-reviewed; code was read, not executed or benchmarked.** Review date: 2026-10-04. Conclusions below apply to the inspected snapshot, not an unverified latest release. License and dependency compatibility require the separate catalog/license review before adoption.

## Verified source evidence

- [trafilatura/core.py:165-259](https://github.com/adbar/trafilatura/blob/6c1977a00b4e82ebb7e6fad1192467adaf24d430/trafilatura/core.py#L165-L259)

The extraction sequence cleans the HTML tree, prunes appended articles/share widgets, and handles comments with special logic for forum threads. It compares the main extractor with alternative extractors unless fast mode is selected. A too-short result can trigger baseline extraction from the original tree. In balanced mode, a short extraction covering a small share of the page triggers a recall-focused retry and optionally a jusText candidate. Size ratios and minimum output thresholds choose whether to replace the previous extraction.

## Harness implications

This is a strong default for fetched article-like HTML and a useful example of deterministic quality-based escalation. Import should first fetch and retain the response, then extract main content, then escalate only when coverage signals show an inadequate result. Separate body text, comments and metadata because each may have different relevance and trust. The same cost ladder can route dynamic pages to a browser or vision parser only after cheap HTML extraction fails.

## Limitations and tradeoffs

Output length is a quality heuristic, not evidence that the correct article was selected. Recall escalation can add navigation, unrelated recommendations or comments; precision mode may omit important content. JavaScript-only pages still need an appropriate rendered source. The code's benchmark-calibration comments are not independently verified performance measurements. Crawling permissions, authentication, URL normalization, network restrictions and source refresh policy belong to the connector around the extractor.

## Adoption and validation

Adopt for static web content behind a bounded fetch adapter. Keep response headers, retrieval time, canonical URL, original HTML and extraction version. Test article pages, documentation, forums, multilingual content, paywalls/consent shells and pages with long related-content sections. Expose incomplete extraction to the user and retrieval layer rather than indexing a consent banner as if it were the requested source.

Related directions: [import-generation](../import-generation.md) · [memory](../memory.md) · [decisions](../decisions.md).


## Change review - 2026-10-28

**RSS root detection avoids embedded-HTML confusion while extraction remains lossy.** Reviewed commit `e14c0334488f208c313c349e6a2cc6761fa31ef9` (commit date `2026-10-27T18:14:09+01:00`). Compared with `6c1977a00b4e82ebb7e6fad1192467adaf24d430`; the complete Git comparison contains 37 changed paths.

RSS link extraction now checks the document root before Atom-style link attributes, avoiding stylesheet links embedded in RSS item HTML. The root helper advances through declarations/comments/doctype without nested regex backtracking; fixtures include RSS/RDF roots, BOM/comments and 50,000 malformed preambles. RSS/Atom paths cap matched links with MAX_LINKS, whereas the inspected JSON-feed branch builds candidates from every parsed item without that local cap. Utility changes normalize whitespace, strip invalid XML characters conditionally and use plain HtmlElement classes instead of specialized form helpers. The existing decode path still falls back to UTF-8 replacement when guesses fail, and string input bypasses its decompression-size parameter, so output text alone is not lossless source evidence. CLI directory processing now propagates the pipeline exit status; URL-derived naming is restricted to compatible input/output combinations.

Evidence: [trafilatura/feeds.py:98-176](https://github.com/adbar/trafilatura/blob/e14c0334488f208c313c349e6a2cc6761fa31ef9/trafilatura/feeds.py#L98-L176) · [tests/feeds_tests.py:144-166](https://github.com/adbar/trafilatura/blob/e14c0334488f208c313c349e6a2cc6761fa31ef9/tests/feeds_tests.py#L144-L166) · [trafilatura/utils.py:267-288](https://github.com/adbar/trafilatura/blob/e14c0334488f208c313c349e6a2cc6761fa31ef9/trafilatura/utils.py#L267-L288) · [trafilatura/utils.py:293-343](https://github.com/adbar/trafilatura/blob/e14c0334488f208c313c349e6a2cc6761fa31ef9/trafilatura/utils.py#L293-L343) · [trafilatura/utils.py:398-432](https://github.com/adbar/trafilatura/blob/e14c0334488f208c313c349e6a2cc6761fa31ef9/trafilatura/utils.py#L398-L432) · [trafilatura/cli.py:175-196](https://github.com/adbar/trafilatura/blob/e14c0334488f208c313c349e6a2cc6761fa31ef9/trafilatura/cli.py#L175-L196) · [trafilatura/cli.py:246-262](https://github.com/adbar/trafilatura/blob/e14c0334488f208c313c349e6a2cc6761fa31ef9/trafilatura/cli.py#L246-L262).

**Harness consequence:** Keep downloaded bytes and decoding/conversion diagnostics alongside extracted text. Apply byte and candidate-count bounds consistently across JSON/RSS/Atom feeds, and validate fetch destinations independently of domain-similarity heuristics. Use normalized article text for retrieval while citing stable source snapshots and retaining explicit partial/failure outcomes; do not let successful text output erase decoding loss.

**Scope and limits:** Scoped static review of feed detection, normalization/decode helpers and CLI control-flow changes in the 37-path comparison. Core article extraction, XML serialization and URL-filename implementation were not fully audited. Fixtures were read, not run, and no crawl, malformed-input timing or extraction-quality measurement was performed.

## Change review — 2026-11-01

Reviewed `43ca3d4d656d7a5495708f1fca159cdbd5715b5d` (2026-10-30T18:05:47+01:00); 30 paths changed from `e14c0334488f208c313c349e6a2cc6761fa31ef9`. The selected downloader delta resolves the final response location against the last redirecting hop from retry history, preserving final source identity after cross-host relative redirects or a retried last hop. Its local-server regression covers absolute-path, relative-path and transient-failure cases. [Downloader](https://github.com/adbar/trafilatura/blob/43ca3d4d656d7a5495708f1fca159cdbd5715b5d/trafilatura/downloads.py), [fixtures](https://github.com/adbar/trafilatura/blob/43ca3d4d656d7a5495708f1fca159cdbd5715b5d/tests/downloads_tests.py).

Keep requested URL, redirect provenance and final artifact origin distinct. Correct final-URL attribution does not authorize intermediate targets; the fixture explicitly disables SSRF protection for loopback tests. Preserve Teamagent's static-article default and refresh eligibility independently of URL identity. Scope: downloader/focused fixtures, not extraction algorithm changes; no network import or upstream tests executed.

<!-- teamagent-analysis:start -->
Analysis metadata: source [trafilatura](https://github.com/adbar/trafilatura); analyzed commit `43ca3d4d656d7a5495708f1fca159cdbd5715b5d`; commit date 2026-10-30T18:05:47+01:00; review date 2026-11-01T11:37:37.120Z; depth source-reviewed. [Maintenance record](../analyses/repos/ai-query--trafilatura.md).
<!-- teamagent-analysis:end -->
