# Partial text-import reconciliation — 2026-11-01

Eleven partial imports received explicitly reviewed derivative versions. Cloudflare and TanStack now pass the basic usable-text check; nine remain partial with specific limitations. The active corpus contains **34 usable-text and 9 partial sources**, with **no active failed import**. The portable state also retains one blocked and two failed predecessor identities as historical evidence; they are not silently removed or counted as active failures.

The [machine-readable review ledger](reconciliation-2026-11-01.json) records full old/new version IDs and content hashes, unchanged original-file hashes, raw/LF representations, static dates, operation scope and measurements. Each entry links an immutable before/after reconciliation receipt. Public reports contain provenance and short analysis, not the copyrighted article bodies. Private immutable memory versions, originals and image assets remain in the configured text cache.

All source entries remain static. No article body was refreshed, no source was substituted, and no authenticated or paid X lookup was attempted. Preparation explicitly retrieved supplementary public assets and checked official link destinations; this was separate from offline adoption. An API response, article wrapper, URL alias or larger text count is not treated as proof of complete source coverage.

| Source | Result | Reviewed operation and remaining limit |
| --- | --- | --- |
| [OpenAI Responses computer environment](agents.260311.equip-responses-api-computer-environment.md.report.md) | partial | Resolved eight external tool-link markers against the official article view; retained the historical tool capture. Dynamic diagrams, images and rendered-page completeness remain unverified. |
| [Hermes guide](agents.260607.hermes.guide.pdf.report.md) | partial | Added an explicit Xberg 1.3.10 representation from the unchanged 104-page PDF, retaining the prior page-structured Markdown and its assets. Layout, tables, equations and visual fidelity remain unverified. |
| [17 agent-loop techniques](agents.260706.testing-17-agentic-loop-engineering-techniques-for-reliable-ai-agents.md.report.md) | partial | Retained 60 distinct decoded image assets from the existing browser image inventory (previously two), with display-order mapping and corrected local image references. Original inline placement and complete DOM fidelity remain unverified. |
| [Camel AI on Durable Objects](agents.260728.camel-ai-on-durable-objects.md.report.md) | partial | Selected the exact retained post/article body and associated media. Unrelated replies and duplicate body material are excluded from the derivative; authenticated identity, edits and complete threads remain unverified. |
| [Ferrox graph engineering](agents.260731.ferrox-ffm10-graph-engineering.pdf.report.md) | partial | Added an explicit Xberg 1.3.10 representation from the unchanged 15-page PDF, retaining the prior page-structured Markdown and assets. Layout, table and image meaning remain unverified. |
| [Miessler five ideas](ai.260330.x-miesler-top-5-ideas-in-ai.md.report.md) | partial | Selected the exact retained post/article body and media, excluding unrelated reply content. Authenticated identity, edits and thread completeness remain unverified. |
| [Memento](cx.260408.memento.pdf.report.md) | partial | Added an explicit Xberg 1.3.10 representation from the unchanged 30-page PDF, retaining the prior page-structured Markdown and assets. Equations, reading order and visual fidelity remain unverified. |
| [Karpathy knowledge bases](kb.260402.x-karpathy-llm-kb.md.report.md) | partial | Selected the exact retained post text rather than the surrounding reply page. Full thread/edit history, authenticated identity and media completeness remain unverified. |
| [Cloudflare computer](sandbox.260803.cloudflare-computer.md.report.md) | usable-text | Selected the article title and exact article-content element; excluded outer navigation, footer and an empty lightbox template from the derivative. All retained article image references resolve. The 17 retained image files include seven tiny loading placeholders, not 17 figures. |
| [ManyIH](security.260413.many-ih.2604.09443.pdf.report.md) | partial | Added an explicit Xberg 1.3.10 representation from the unchanged 24-page PDF, retaining the prior page-structured Markdown and assets. Table, equation, reading-order and visual fidelity remain unverified. |
| [TanStack Code Mode](tools.260408.tanstack-ai-code-mode-blog.md.report.md) | usable-text | Resolved the Markdown header image against the explicitly reviewed TanStack article origin, rather than the raw GitHub host. The actual JPEG bytes were decoded and the local reference checked. |

## Evidence and measured limits

The four PDFs contain **173 physical pages** in total. Every page had text in the retained baseline. This is a page-presence check, not an OCR, layout or factual-accuracy score. The previous page-structured Markdown remains beside the alternative extraction, so combined Markdown character counts include two representations and must not be interpreted as increased content coverage. The [Xberg source review](../../projects/ai-query--xberg.md) is separate from this executable evaluation.

The configured Xberg 1.3.3 executable was absent. An already provisioned **1.3.10** executable was explicitly evaluated under a distinct cache-only profile; no installation, default-profile substitution or trust-policy change occurred. Its version probe was checked, automatic config discovery and OCR were disabled, and each invocation had a 120-second deadline. Environment settings disabling model downloads/telemetry are not an OS firewall.

| Retained PDF | Pages | Single fresh-process conversion | Normalized-word overlap with old derivative |
| --- | ---: | ---: | ---: |
| Hermes guide | 104 | 2600.4 ms | 94.72% |
| Ferrox graph engineering | 15 | 319.3 ms | 91.68% |
| Memento | 30 | 703.5 ms | 97.93% |
| ManyIH | 24 | 639.9 ms | 93.56% |

These are one-run local conversion measurements, with uncontrolled OS/model caches; there is no cold/warm repetition, extraction-accuracy evaluation or general speed ranking. The word-overlap values are bag-of-normalized-words diagnostics, not semantic coverage. Image bytes were decoded and local Markdown image references checked, but no complete visual/page-layout audit was performed. The Medium inventory totals 5,130,819 image bytes including previously retained assets; that is not a measurement of newly downloaded bytes.

Initial preparation completed in 28.38 seconds. Later PDF baseline retention, Medium link repair, Cloudflare article-scope refinement, reconciliation and verification are additional work and are excluded from that duration. Per-source preparation times in the ledger describe that initial phase; they do not measure the entire recovery. The primary Markdown excerpts and local image-reference targets were read after immutable candidate publication.

## Recovery and verification

The reusable [offline reconciliation command](../../research-sync.md) admits only one exact configured static source, an expected prior record hash and an already exported same-source candidate. It validates immutable exports and unchanged original descriptors/bytes, writes the receipt before replacing the private pin, and preserves creation/publication/capture dates and the last remote-check time. A later drifted record, ambiguous alias, refresh-enabled source, missing original or altered export is rejected. It performs no capture, conversion, authentication or source-policy change.

Two actual report-publication attempts encountered confirmed Windows EPERM replacement failures. Their saved receipts and private pins allowed exact request resumption without creating another source version. The first three sources were already applied when the final resume began; the remaining eight were applied from their existing candidates. Unchanged LF reports now avoid replacement, while changed report publication uses the repository’s bounded Windows sharing-error retry policy on the same atomic rename, never deleting the destination. Exhausted retries remain failures. A receipt-linked changelog entry is idempotent across interrupted publication.

Earlier focused runs also observed intermittent memory-export storage failures before the operation category was exposed; those exact failures were not reproduced after adding diagnostics. Only allowlisted filesystem error/operation categories are retained in memory errors, never native paths or messages. This is an observed environment limitation, not a claim that every export failure has been diagnosed.

The initial completed focused run passed **26 tests / 202 assertions** across text synchronization and reconciliation. It covered unchanged static pins, exact source/query identity, altered/missing originals, corrupt exports, grouped/conflicting aliases, tampered receipts, later-state retries, interrupted publication with one changelog entry, bounded sharing-error recovery and privacy-safe errors. Its historical receipt is retained.

After a separate correctness/privacy review, the final focused run passed **30 tests / 220 assertions** in 4.04 seconds on Bun 1.4.2. Additional checks reject mixed-case HTTP(S) query disclosure and case-insensitive aliases across source lists, preserve the later global validation time when interrupted reconciliations resume before or after pin publication, and bound maximum report warnings without altering version provenance. This was a fixture-only run; no actual source reconciliation or capture was repeated. Upstream converter tests, visual fidelity and live authenticated services were not validated by these fixtures.

A separate full static re-sync used an injected capture function that would count and fail any capture attempt. Its [receipt summary](reconciliation-2026-11-01.json) records **zero capture calls and zero imports**, unchanged source pins/static dates/configuration, and no failed active outcome. All 46 retained identities were compared, including historical predecessors; the 43 active outcomes are reported separately. The first helper assertion incorrectly compared historical records against active outcomes and failed after a successful sync; it was corrected without weakening production checks or removing historical evidence.

## Exact transitions

### OpenAI Responses computer environment

[Source](https://openai.com/index/equip-responses-api-computer-environment) · [Report](agents.260311.equip-responses-api-computer-environment.md.report.md) · [Reconciliation receipt](reconciliations/54ec26903291b7326d8affdfa3c3a7631952662558f36115689d465bd7ca649c.json).

- Previous version: `808ced5c-8d21-4ebf-8b62-d438e7e3f022`; content SHA-256: `6d8550a9db962394c94fca36d42cb4f269a7351391c5ab64f0d1931c027f5cda`. 
- Adopted version: `0ba971da-2184-4ede-b673-f4400f035ba9`; content SHA-256: `f4c4329165b49913e4f6da51a4fbe05589248dad475442ec68cbab716f67f775`.
- Unchanged original `originals/openai-tool-capture.json`: 20742 bytes; SHA-256 `a8d19375f080fc68f8ce0baf5652e3e237e84d1b82aacd60df946d2fbfd4a870`.

### Hermes guide

[Source](https://github.com/alchaincyf/hermes-agent-orange-book/raw/main/Hermes-Agent-The-Complete-Guide-v260607.pdf) · [Report](agents.260607.hermes.guide.pdf.report.md) · [Reconciliation receipt](reconciliations/6d6e8f51852b6688033f5f95e19398e3904c5a7ed088b978560ff94902b1d570.json).

- Previous version: `d6ddf7e6-c118-409a-904d-171b2a4a4728`; content SHA-256: `3b215f153c2da2249f27df6d0e21971d8a8b1e2691ae417f02f4a0dde7d76279`. 
- Adopted version: `85e5dd54-bc73-40f9-adac-2846fdd96794`; content SHA-256: `c8c2da1efa0fceac603842046b4c2beb87455752c573437ea9e25102d70577b2`.
- Unchanged original `original/Hermes-Agent-The-Complete-Guide-v260607.pdf`: 1706814 bytes; SHA-256 `250eaee552121313db913893404b9b1574c7f2ea7b06d25e8641054a51642d59`.

### 17 agent-loop techniques

[Source](https://levelup.gitconnected.com/testing-17-agentic-loop-engineering-techniques-for-reliable-ai-agents-7966adad5835) · [Report](agents.260706.testing-17-agentic-loop-engineering-techniques-for-reliable-ai-agents.md.report.md) · [Reconciliation receipt](reconciliations/aea967c8133b6a9f484643e97c4c885e406667db49ed99a37a85ffe2bbdaaaf5.json).

- Previous version: `e84c6c52-8681-45ee-8374-c31776827e84`; content SHA-256: `e4f3a64d895ff6319034ec79502777fdc84db292d6f5366ba0d4dc907181af39`. 
- Adopted version: `0a19256f-78fb-452b-93fd-a93ed504e226`; content SHA-256: `4dc0646a6fffa6b2eb0bcb60b90d47f62ca4293162ba72ec5870754626dd778c`.
- Unchanged original `originals/medium-browser-capture.json`: 76844 bytes; SHA-256 `a9eeb30f3730262d266a3cc8a3661ef62cecb52ca4265d4b724df8286bf70fbb`.

### Camel AI on Durable Objects

[Source](https://x.com/Vercantez/status/2082138839888589200) · [Report](agents.260728.camel-ai-on-durable-objects.md.report.md) · [Reconciliation receipt](reconciliations/be6ef5bc0d8c05a6b5d268da4871f4d1204d62165150e9bfd085d077e4ef5613.json).

- Previous version: `c63ca019-7a6f-48ef-a2af-f032471b5170`; content SHA-256: `e1f2d9821412de0fc470895d90055e5c486704fd6f1a9eb2c65e915fdc9478b5`. 
- Adopted version: `99323382-5b94-4e6f-9b88-42751f251cf3`; content SHA-256: `41056d704af07bd6b01bd060e56f0d254f944a431406b71d244a5742bf6a1c9f`.
- Unchanged original `original/2082138839888589200`: 349834 bytes; SHA-256 `3cf62e776888e23d97a8492ddd7eb1f0e0b100ef2e0a35612003bb6366c6ea34`.

### Ferrox graph engineering

[Source](https://dropbox.com/scl/fi/y64dzlo9lvly3hcd9vmex/Forge-Field-Manual-No10-Graph-Engineering.pdf) · [Report](agents.260731.ferrox-ffm10-graph-engineering.pdf.report.md) · [Reconciliation receipt](reconciliations/8e973a43f58d665a9fa51b03851f06e068fdc13b29662e82a56e3d9de7447f1b.json).

- Previous version: `2b94e4a3-d4ef-42ce-8b95-40238dd68ccc`; content SHA-256: `543154651900ccdc5d52abd0e8d5afcc0c8b3f1ad0ebfee691ee60999915192e`. 
- Adopted version: `c3bbcfc0-10a0-4af1-8011-32ecdb743876`; content SHA-256: `9b4538dcac42cfcf2d2fd5ea56db076b352ba912cfa68688d406092f0d07ae0d`.
- Unchanged original `original/file`: 355012 bytes; SHA-256 `edb08486a02f5ef3ab42304276db4435100ac34b2529cafb5b4deaa85c6fe241`.

### Miessler five ideas

[Source](https://x.com/DanielMiessler/status/2038432114312675669) · [Report](ai.260330.x-miesler-top-5-ideas-in-ai.md.report.md) · [Reconciliation receipt](reconciliations/4fed2919d363058b1e0973b1d8688e0971553b65e2bb112472a826fc45fe079a.json).

- Previous version: `1d40cf2a-fb70-4c67-a933-098820f2d496`; content SHA-256: `8ec690197a7ae7607c690a0b551899ac80e6e19b3691bfd438c05932a6c71b23`. 
- Adopted version: `7ed1e094-07bb-4a15-b1f8-453ae0a897de`; content SHA-256: `e7ed1afda13f2d441763768f4fd85e7bdb65665c2c046d6f2e8a71f6f9f4153a`.
- Unchanged original `original/2038432114312675669`: 392731 bytes; SHA-256 `f96c9525ac1f083792859ca1ec0a2ea61f2bce9ac53138b368996db3fe3fa990`.

### Memento

[Source](https://raw.githubusercontent.com/microsoft/memento/d8c10e66ff313844b4b5f063dd4c075d3ea56aab/docs/memento.pdf) · [Report](cx.260408.memento.pdf.report.md) · [Reconciliation receipt](reconciliations/1af5e9306f04c21505b31dabaca6a66dccf05144aa205c60b273c8145afa6558.json).

- Previous version: `60c06d9f-d037-4995-a6c9-09c84ad65e5f`; content SHA-256: `e6d92826080f8c8c46eaafab48f0231b64af93747c64550ed3fd69e4ec569a95`. 
- Adopted version: `09efc6e8-e2ea-4e85-b78d-c6b8f0fe5062`; content SHA-256: `f7eb75a7f8dcd2483ec6e4263e1d702776a1ca8a4f550edcd87d5cb1f409171d`.
- Unchanged original `original/memento.pdf`: 674225 bytes; SHA-256 `1aa388a660073e7a4bde0e0e1c4de421424e65c00d9e9935322c86b5d25485ff`.

### Karpathy knowledge bases

[Source](https://x.com/karpathy/status/2039805659525644595) · [Report](kb.260402.x-karpathy-llm-kb.md.report.md) · [Reconciliation receipt](reconciliations/2d0b37711a9136c0dc7bffc0d5d81f802c7415d7e285cb6cec61bb2d339364ef.json).

- Previous version: `4c21d3c7-0d91-4297-8a08-87736c381fc7`; content SHA-256: `c2416492e811d02fccc6da405adb6b555616388ae5a6a1abb6fbac48b919c195`. 
- Adopted version: `533758c0-ce33-424b-b841-dbf695d30e42`; content SHA-256: `cfa578482b3bb2857f631280b80dd4ae3cb4f60b809ec6eb5fc1a5f1b4e77607`.
- Unchanged original `original/2039805659525644595`: 170385 bytes; SHA-256 `27c176127aa9e7c080f59cc88bf5a913c1e2ef04b10711a944589de3caa0b0f4`.

### Cloudflare computer

[Source](https://blog.cloudflare.com/cloudflare-computer) · [Report](sandbox.260803.cloudflare-computer.md.report.md) · [Reconciliation receipt](reconciliations/6b6716c5f64b7c163866f71775760ad0b5d774d1db09ad6c6111a32e118aaa4a.json).

- Previous version: `461b90f9-dd13-4d0d-8932-dc1be2db7944`; content SHA-256: `d349883747d7e4611463f7729e9285c854343b742287b7b1571d6b7bff0b6d2b`. 
- Adopted version: `9063b2c1-efc4-4a35-b436-055eef6744b5`; content SHA-256: `a92d5459e804a183c5bb5802a6899ab3dc29159f02f922d5ee705389dca650c9`.
- Unchanged original `original/cloudflare-computer`: 334207 bytes; SHA-256 `88975aae372deb68f7e31ce74521a8d176fdc73769e4c212411534b87adb4d9c`.

### ManyIH

[Source](https://arxiv.org/pdf/2604.09443) · [Report](security.260413.many-ih.2604.09443.pdf.report.md) · [Reconciliation receipt](reconciliations/63233ad71c892357b7ac34119e36154222fd5adeacbb868b5a3861dd7026560f.json).

- Previous version: `0b8d618f-fa62-44be-9afb-ea7507bb0b17`; content SHA-256: `7691fe7a7f9d7471a597783f0ef2fde0e960b9d4ac01a958b2e661527cceb969`. 
- Adopted version: `592a795e-6a8b-4ee6-8529-dd65eadfebfb`; content SHA-256: `7a8b7e84bb868eeb9cdd103eab97b471bbf766dd47560410093cdad1c9c5ec2b`.
- Unchanged original `original/2604.09443`: 1340816 bytes; SHA-256 `9b5b55cdde76fb2b6dc6b8ccc7b4c8fc3f0db0210ebd9f6ec907fb224dbfcd09`.

### TanStack Code Mode

[Source](https://github.com/tanstack/tanstack.com/raw/refs/heads/main/src/blog/tanstack-ai-code-mode.md) · [Report](tools.260408.tanstack-ai-code-mode-blog.md.report.md) · [Reconciliation receipt](reconciliations/031b34b2b7018e51984540af2d1251a78fb42c61c2d0d37906d1b75d16066750.json).

- Previous version: `ec30d1c5-773c-4157-baba-ab9311b74c31`; content SHA-256: `0eb697287c8b8abad2896bdb3fd7f849be6ec34c6c8c3c83aaf725f41314617c`. 
- Adopted version: `04d048a6-91b0-4bf4-9648-297c264303bb`; content SHA-256: `d503faf990ee2c39cf207f19b88915d7d5e6988cb493d0e4c020ad5a59e0edaa`.
- Unchanged original `original/tanstack-ai-code-mode.md`: 15485 bytes; SHA-256 `ec0fc5b4b3f7418be05ee203fbfdcdfb11c88806f5cb4b830a2502a95a609ddc`.
