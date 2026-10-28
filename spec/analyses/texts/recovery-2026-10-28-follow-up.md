# Explicit article recovery — 2026-10-28

[Text index](README.md) · [Earlier HTTP repair](repair-2026-10-28.md) · [Maintenance contract](../../research-sync.md)

The two remaining configured articles now have retained **partial** captures. Earlier HTTP 403 responses remain failure evidence. Neither recovery changes the configured source identity, enables refresh, authenticates to a publisher, or claims that a challenge page was a successful article response.

| Configured article | Publisher date | Acquisition | Retained coverage |
| --- | --- | --- | --- |
| [OpenAI computer environment article](https://openai.com/index/equip-responses-api-computer-environment/) | 2026-03-11 | Explicit web-tool extraction of the same canonical article | Raw tool representation plus article-body Markdown; no images/dynamic diagrams or original HTTP HTML |
| [Testing 17 agentic loop techniques](https://levelup.gitconnected.com/testing-17-agentic-loop-engineering-techniques-for-reliable-ai-agents-7966adad5835) | 2026-07-06 | Browser-rendered article reached through the author's public same-article free-reading link | 67,632 visible article characters, 61 image elements/60 distinct displayed image URLs inventoried; two image assets saved, including the author avatar |

The Medium capture was transferred through the supported local editor interface and validated as JSON. Its title, canonical identity, ending, text length and image inventory matched the observed page. The retained representation preserves visible text/code indentation; it does not preserve DOM structure, original link targets or layout. Saved images are appended with an explicit placement limitation. The author's access-link query is omitted from the capture and public reports.

The OpenAI extraction retains the exact tool output separately from the derived article-body selection (tool lines 13–123). The publisher-displayed dates are now explicit `published=` settings, recorded as configured evidence rather than authenticated account evidence or inferred filename dates. Capture timestamps remain separate. Both records carry warnings that force partial quality; neither is described as a full-fidelity archive.

The existing `SourceCapture`/`openMemory` host seam accepted these two deliberately selected representations. A cache-only adapter validates exact source/method pairs, contained files, SHA-256, byte limits, LF text and the allowed image origin before constructing typed capture results. Parser/extraction identity and the acquisition JSON participate in immutable version provenance. Unknown source requests fail without network fallback. This was an explicit operator recovery using the existing library contract, not a newly advertised general snapshot-import CLI command.

The six prepared files were independently checked (457,303 bytes total); the initial import made exactly two capture calls. All 40 previously retained configured resources stayed pinned. The active 42-resource corpus now contains 31 usable-text records and 11 partial records, with zero failed, blocked or unsupported active records. Historical removed-source failures remain in the ledger and must not be counted as active failures. No existing static source was remotely refreshed or silently substituted.

A repeat run made zero capture calls and retained all 42 versions. Local export verification checked 78 retained exports containing 933 files; that inventory includes historical versions and is distinct from the active resource count.

The one CRLF introduced by the local editor was normalized to LF with its original bytes retained privately. Original snapshot SHA-256: `e59ea865b583d7043cc7b065f732fb7253d429e1cd58cbddcad4cca09f704aa9`; LF snapshot SHA-256: `a9eeb30f3730262d266a3cc8a3661ef62cecb52ca4265d4b724df8286bf70fbb`. The OpenAI retained extraction JSON was already LF, SHA-256 `a8d19375f080fc68f8ce0baf5652e3e237e84d1b82aacd60df946d2fbfd4a870`. Private acquisition receipts and raw/LF mappings remain under the owned research cache; public reports contain no access-link token.
