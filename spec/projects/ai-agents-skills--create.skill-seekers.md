# Skill Seekers

Source: [yusufkaraaslan/Skill_Seekers](https://github.com/yusufkaraaslan/Skill_Seekers) · Reviewed revision: `5b5d8dfca263fa76e6daae9f292890b311ef36aa` · Review date: 2026-10-04.

Depth: **source-reviewed** (static source/content inspection; repository-wide audit not claimed). Related directions: [skills](../skills.md) · [import-generation](../import-generation.md) · [memory](../memory.md) · [evolution](../evolution.md).

## Evidence inspected

- [`src/skill_seekers/cli/unified_scraper.py` lines 1–105](https://github.com/yusufkaraaslan/Skill_Seekers/blob/5b5d8dfca263fa76e6daae9f292890b311ef36aa/src/skill_seekers/cli/unified_scraper.py#L1-L105)
- [`src/skill_seekers/cli/adaptors/base.py` lines 56–149](https://github.com/yusufkaraaslan/Skill_Seekers/blob/5b5d8dfca263fa76e6daae9f292890b311ef36aa/src/skill_seekers/cli/adaptors/base.py#L56-L149)

## Observed architecture and behavior

UnifiedScraper explicitly separates configuration validation, source extraction, conflict detection, merging, and skill building. Its dispatch map covers documentation, GitHub, PDF, Word, video, local files, EPUB, notebooks, HTML, OpenAPI, presentations, and several services. The platform adaptor interface separates formatting, packaging, and upload, including chunk size and overlap controls. These concrete extension seams are more useful than treating the project as one opaque scraping command. A dispatch entry establishes an intended path, not a successfully tested connector.

## Implications and tradeoffs for Teamagent

Teamagent should adopt a comparable importer protocol but keep raw immutable objects and extraction provenance outside generated skills. A knowledge import is not automatically an instruction import: documentation content may be untrusted, obsolete, contradictory, or copyrighted. Retain source spans, parser version, observed timestamp, source revision, permissions, and conflict records through normalization. Only a separately evaluated procedure should become a skill. Packaging for a model vendor is also distinct from proving that its current API supports that format; historical adapter comments can become stale. Treat extraction, merging, synthesis, and publication as independently retryable jobs.

## Adoption decision

Use as a candidate importer worker and a source of adapter patterns, initially for a small verified subset such as repository, HTML, and PDF. Run extraction in a restricted process with byte/time limits. Compare resulting text and provenance against fixtures before expanding formats. Keep conflict preservation mandatory when AI-assisted merging proposes a convenient single answer, and never execute imported scripts during discovery.

## Verification boundary

No project code, models, installers, or benchmarks were executed during this review. Tests and documentation show intended contracts; they do not establish measured performance, production readiness, or a complete security assessment. Recommendations above are design inferences from the cited snapshot. Verify current APIs, licensing, and deployment requirements before integration.

<!-- teamagent-analysis:start -->
Analysis metadata: source [create.skill-seekers](https://github.com/yusufkaraaslan/Skill_Seekers); analyzed commit `5b5d8dfca263fa76e6daae9f292890b311ef36aa`; commit date 2026-09-30T21:49:15+03:00; review date 2026-10-04; depth source-reviewed. [Maintenance record](../analyses/repos/ai-agents-skills--create.skill-seekers.md).
<!-- teamagent-analysis:end -->
