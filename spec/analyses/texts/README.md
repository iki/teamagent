# Text resource evidence

Repeatable sync reads [web/social sources](../../../.urls.md.conf) and [PDF sources](../../../.urls.pdf.conf). Run `bun app/research/text-sync.ts --root .`; existing captured resources stay static by default. Append `refresh=true` immediately after a URL to allow remote refresh; use `--limit N`, `--timeout-ms N`, or `--cache path` for bounded runs and cache overrides. The cache defaults to `.cache/text`, configured by `TEAMAGENT_TEXT_CACHE` in root `.env` then `.env.local`.

Each non-comment line is a safe `.md` or `.pdf` alias followed by one or more HTTP(S) URLs. Optional per-URL tokens are `refresh=true` (or `refresh=false`) and `published=2026-10-27` or an ISO timestamp with timezone. Options apply only to their preceding URL; publication overrides are labeled configured assertions. Alias additions/renames reuse an unambiguous exact-full-URL pin; conflicting pins block without fetching, and query-redacted URL equality is insufficient. Whole-line `#` comments and individually quoted URLs are supported. Up to 16 explicitly listed URLs can share an alias for multiple posts or article parts. No automatic thread discovery, browser social session, paywall bypass, or mirror substitution is implemented.

Optional `--x-api` explicitly enables official post lookup using `X_BEARER_TOKEN` from the process environment. It may use paid API access and is never selected automatically. Numeric post URLs, long-form note text, grouped chosen posts and up to four public image assets are supported; unknown article bodies and standalone article URLs are reported as unsupported. API JSON is retained as original evidence. No authenticated live success is claimed without an actual credentialed run. [Official lookup contract](https://docs.x.com/x-api/posts/lookup/introduction) and [field dictionary](https://docs.x.com/x-api/fundamentals/data-dictionary) were checked on 2026-10-24.

Static entries with a captured version perform only local export integrity checks: no network, conversion, export rewrite or account authentication. Initial entries without any successful capture may be retried; a missing or corrupt recorded snapshot is an explicit error and never silently fetched again. A successful capture remains pinned even when local export publication failed. Source state migrates from v1 without replacing pinned versions. If the private cache ledger is absent, the portable report ledger preserves the pin. Transfer the private cache/exports separately when moving machines; historical `data/research/texts` files are not substituted. Imports reuse Teamagent memory's immutable versions, conversion, images, source provenance and size/network limits. Cached exports are checksum-verified before reuse. Reports with `failed` status retain any previous version only as stale evidence. Removed configuration entries retain their prior report and state until deliberately archived; their check time makes staleness visible.

First-captured time comes from the retained memory source creation timestamp. Source creation/publication date is separate: explicit configuration, publisher HTML metadata/Article JSON-LD, or official X created_at, with evidence recorded; absent or conflicting metadata stays unknown. Filename dates and HTTP Last-Modified never become creation dates. Existing dates survive refresh failures. Refresh-marked HTTP sources use validators when available and retained bytes are integrity-checked; assets are checked separately. Official X edit-history IDs are recorded for the exact requested post without silently following another version.

`usable-text` means at least 100 extracted characters and no detected parser warning, access shell or wrong PDF type. It is a basic content check, not complete extraction or factual verification. `partial` includes parser limitations or social content (short authenticated posts use their validated API identity rather than the 100-character web-page threshold); `blocked` covers access shells and PDF wrapper pages; `unsupported` covers inadequate text. Image count does not establish image completeness or visual fidelity. Full warnings remain in memory provenance.

Original research remains in [data/research/texts](../../../data/research/texts/). This sync does not replace historical evidence. Exact source URL query parameters stay in private memory/export manifests; public reports omit them. Extracted heading samples are untrusted source data.

Last run: 2026-10-28T07:07:39.056Z. [Machine-readable source state](source-state.json). [Changelog](CHANGELOG.md).

| Source group | Content validation | Import outcome |
| --- | --- | --- |
| [agents.260214.deterministic-core-agentic-shell.md](agents.260214.deterministic-core-agentic-shell.md.report.md) | usable-text | pinned |
| [agents.260311.equip-responses-api-computer-environment.md](agents.260311.equip-responses-api-computer-environment.md.report.md) | failed | failed |
| [agents.260607.hermes.guide.pdf](agents.260607.hermes.guide.pdf.report.md) | partial | pinned |
| [agents.260701.apps-after-agents.md](agents.260701.apps-after-agents.md.report.md) | usable-text | pinned |
| [agents.260703.agentic-autonomy-levels.addyosmani.md](agents.260703.agentic-autonomy-levels.addyosmani.md.report.md) | usable-text | pinned |
| [agents.260704.harness-self-improvement.md](agents.260704.harness-self-improvement.md.report.md) | usable-text | pinned |
| [agents.260706.testing-17-agentic-loop-engineering-techniques-for-reliable-ai-agents.md](agents.260706.testing-17-agentic-loop-engineering-techniques-for-reliable-ai-agents.md.report.md) | failed | failed |
| [agents.260720.agent-swarm-model-economics.cursor.md](agents.260720.agent-swarm-model-economics.cursor.md.report.md) | usable-text | pinned |
| [agents.260723.i-got-long.md](agents.260723.i-got-long.md.report.md) | usable-text | pinned |
| [agents.260728.camel-ai-on-durable-objects.md](agents.260728.camel-ai-on-durable-objects.md.report.md) | partial | pinned |
| [agents.260729.how-chatgpt-optimizes-its-agent-loop.md](agents.260729.how-chatgpt-optimizes-its-agent-loop.md.report.md) | usable-text | pinned |
| [agents.260731.ferrox-ffm10-graph-engineering.pdf](agents.260731.ferrox-ffm10-graph-engineering.pdf.report.md) | partial | pinned |
| [agents.260731.qm-is-trying-to-solve-the-company-agent-problem.md](agents.260731.qm-is-trying-to-solve-the-company-agent-problem.md.report.md) | failed, usable-text | failed, created |
| [agents.260803.how-we-built-the-kiro-agent-harness.md](agents.260803.how-we-built-the-kiro-agent-harness.md.report.md) | usable-text | pinned |
| [ai.260330.x-miesler-top-5-ideas-in-ai.md](ai.260330.x-miesler-top-5-ideas-in-ai.md.report.md) | partial | pinned |
| [claude.260331.claude-code-leak.kuber.md](claude.260331.claude-code-leak.kuber.md.report.md) | usable-text | pinned |
| [cx.251126.effective-harnesses-for-long-running-agents.md](cx.251126.effective-harnesses-for-long-running-agents.md.report.md) | usable-text | pinned |
| [cx.251216.evaluating-compression.md](cx.251216.evaluating-compression.md.report.md) | usable-text | pinned |
| [cx.260408.memento.pdf](cx.260408.memento.pdf.report.md) | blocked, partial | pinned, created |
| [cx.260630.the-context-layer.md](cx.260630.the-context-layer.md.report.md) | usable-text | pinned |
| [cx.260804.11-context-engineering-tips-cut-coding-agent-tokens.decodingai.md](cx.260804.11-context-engineering-tips-cut-coding-agent-tokens.decodingai.md.report.md) | usable-text | pinned |
| [cx.260818.context-engineering-2026.louisbouchard.md](cx.260818.context-engineering-2026.louisbouchard.md.report.md) | usable-text | pinned |
| [cx.260819.gisting.shopify.md](cx.260819.gisting.shopify.md.report.md) | usable-text | pinned |
| [cx.260820.no-need-to-walk-the-graph.contextandchaos.md](cx.260820.no-need-to-walk-the-graph.contextandchaos.md.report.md) | usable-text | pinned |
| [kb.260402.x-karpathy-llm-kb.md](kb.260402.x-karpathy-llm-kb.md.report.md) | partial | pinned |
| [kb.260410.mentisdb-whitepaper.md](kb.260410.mentisdb-whitepaper.md.report.md) | usable-text | pinned |
| [kb.260707.llm-wiki-agent-memory.decodingai.md](kb.260707.llm-wiki-agent-memory.decodingai.md.report.md) | usable-text | pinned |
| [mcp.260422.building-agents-that-use-mcp.claude.md](mcp.260422.building-agents-that-use-mcp.claude.md.report.md) | usable-text | pinned |
| [sandbox.260803.cloudflare-computer.md](sandbox.260803.cloudflare-computer.md.report.md) | partial | pinned |
| [security.260410.many-ih.md](security.260410.many-ih.md.report.md) | usable-text | pinned |
| [security.260413.many-ih.2604.09443.pdf](security.260413.many-ih.2604.09443.pdf.report.md) | partial | pinned |
| [security.260727.from-zero-trust-to-zero-custody.md](security.260727.from-zero-trust-to-zero-custody.md.report.md) | usable-text | pinned |
| [security.260727.hf-openai-agent-intrusion-technical-timeline.md](security.260727.hf-openai-agent-intrusion-technical-timeline.md.report.md) | usable-text | pinned |
| [security.260805.cloudflare-os-is-an-architecture-of-distrust.md](security.260805.cloudflare-os-is-an-architecture-of-distrust.md.report.md) | usable-text | pinned |
| [spec.250902.spec-driven-dev.speckit.md](spec.250902.spec-driven-dev.speckit.md.report.md) | usable-text | pinned |
| [spec.250902.spec-driven.speckit.md](spec.250902.spec-driven.speckit.md.report.md) | usable-text | pinned |
| [spec.260113.good-spec.addyosmani.md](spec.260113.good-spec.addyosmani.md.report.md) | usable-text | pinned |
| [swarm.260327.multi-agent-landscape.md](swarm.260327.multi-agent-landscape.md.report.md) | usable-text | pinned |
| [tools.260408.tanstack-ai-code-mode-blog.md](tools.260408.tanstack-ai-code-mode-blog.md.report.md) | partial | pinned |
| [tools.260624.tanstack-ai-code-mode-isolates.md](tools.260624.tanstack-ai-code-mode-isolates.md.report.md) | usable-text | pinned |
| [tools.260624.tanstack-ai-code-mode-with-skills.md](tools.260624.tanstack-ai-code-mode-with-skills.md.report.md) | failed, usable-text | failed, created |
| [tools.260624.tanstack-ai-code-mode.md](tools.260624.tanstack-ai-code-mode.md.report.md) | usable-text | pinned |
