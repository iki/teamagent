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

<!-- teamagent-analysis:start -->
Analysis metadata: source [trafilatura](https://github.com/adbar/trafilatura); analyzed commit `6c1977a00b4e82ebb7e6fad1192467adaf24d430`; commit date 2026-10-02T18:53:21+02:00; review date 2026-10-04; depth source-reviewed. [Maintenance record](../analyses/repos/ai-query--trafilatura.md).
<!-- teamagent-analysis:end -->
