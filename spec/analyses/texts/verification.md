# Text resource verification

## Measured live runs

Two complete default public-source runs attempted all 42 configured URLs, with none skipped. The second run started at `2026-10-24T06:15:20.620Z` using Bun `1.4.2` (`744846f84`). Both runs produced the same validation totals:

| Validation | Sources | Meaning |
| --- | ---: | --- |
| Usable text | 29 | Basic substantive-text check passed; completeness and factual accuracy remain unverified. |
| Partial | 8 | Text was captured, with explicit social, parser or image limitations. |
| Blocked | 1 | A configured PDF URL returned a GitHub HTML viewer. |
| Failed | 4 | No current content was validated; the source importer returned its generic `invalid` failure. |
| Unsupported | 0 | No additional source fell into the inadequate-text category. |

The second run retained 25 unchanged versions, created 13 updated versions, and preserved four failed outcomes. A changed webpage capture can include changing navigation or page metadata; these counts do not establish that the substantive article changed. Evidence: [current source state](source-state.json), [changelog](CHANGELOG.md), [first run](../../../.cache/research/text-live-result.json), and [second run](../../../.cache/research/text-live-result-final.json). The cache is local evidence, not a distributable source bundle; export manifests can contain exact private URL parameters.

The captured parser provenance identifies `teamagent-import/2`, MarkItDown `0.1.8`, pypdf `6.11.0`, and markdown-it `4.0.0`. Original bytes, Markdown, available image files, source versions and hashes are retained by the existing memory importer. This verification does not turn a successful import or hash check into independent source correctness.

## Content inspection

The checks included reading actual exported Markdown, not just import success codes or character counts. Five representative source classes were inspected. The following version IDs identify the latest sampled exports; earlier samples from the first run were also read.

| Source report | Inspected version | Observed content and limits |
| --- | --- | --- |
| [Deterministic Core, Agentic Shell](agents.260214.deterministic-core-agentic-shell.md.report.md) | `2c28a965-b4a9-463e-8392-20a65224f101` | Intended article prose and code are present, with site navigation also retained. No complete original-versus-conversion comparison was performed. |
| [TanStack Code Mode blog](tools.260408.tanstack-ai-code-mode-blog.md.report.md) | `ec30d1c5-773c-4157-baba-ab9311b74c31` | Frontmatter, explanatory prose and TypeScript examples are present. The lead image has an explicit unavailable placeholder; zero captured images must not be read as an image-free original. |
| [Karpathy LLM Knowledge Bases post](kb.260402.x-karpathy-llm-kb.md.report.md) | `933c9034-3d59-4d43-a517-ea8dbcdf730c` | The intended long post is present in public HTML, alongside repeated text, navigation and login material. The capture does not establish a complete conversation, article attachment or authenticated account view. |
| [Ferrox graph engineering PDF](agents.260731.ferrox-ffm10-graph-engineering.pdf.report.md) | `26ff2981-fc03-4e72-9e98-c0f583e308c1` | Substantive text is separated by physical page headings. Some word spacing is merged or split; the same three image resources recur across sampled pages. Page-layout fidelity, image placement and diagram interpretation were not visually checked. |
| [Memento PDF configuration](cx.260408.memento.pdf.report.md) | `2c83ffbf-39f5-41d2-add9-35347b77ab84` | The retained original has `text/html` media type and the derivative contains GitHub navigation. It is correctly blocked as a PDF import. No alternative raw URL was silently substituted. |

All three actual PDFs remain partial because the built-in extraction does not reconstruct full reading order, table layout, equations, vector artwork or OCR. The other PDF reports are the [Hermes guide](agents.260607.hermes.guide.pdf.report.md) and [Many IH paper](security.260413.many-ih.2604.09443.pdf.report.md). The [Cloudflare computer page](sandbox.260803.cloudflare-computer.md.report.md) also reports omitted images with missing static sources or unsupported schemes. Image counts are measured file counts, not assertions of completeness or visual fidelity.

The three X URLs in the supplied configuration yielded substantial public HTML and available images. They remain partial: public-page access does not establish full thread or article coverage. The explicit official X adapter has deterministic fixtures for numeric post lookup, long note text, selected media, grouped chosen URLs, raw JSON retention, malformed responses and unsupported article shapes. No authenticated live `--x-api` run was performed. Unknown article body schemas and standalone article URLs remain unsupported; no complete thread discovery or video download is implemented. See the [official lookup contract](https://docs.x.com/x-api/posts/lookup/introduction) and [field dictionary](https://docs.x.com/x-api/fundamentals/data-dictionary).

## Failed sources

The four configured sources below failed in both complete import runs. The importer suppresses raw transport/parser exceptions, so the stored sync outcomes correctly retain their original generic `invalid` code. A separate bounded probe on 2026-10-24 used the same `retrieveHttp` implementation against each exact configured URL. It observed these transport failures:

| Source report | Direct importer-network result |
| --- | --- |
| [QM company-agent article](agents.260731.qm-is-trying-to-solve-the-company-agent-problem.md.report.md) | `https_downgrade`: the source redirected from HTTPS to HTTP, which the importer rejects. |
| [17 agentic loop techniques](agents.260706.testing-17-agentic-loop-engineering-techniques-for-reliable-ai-agents.md.report.md) | `http_403`: the exact source returned HTTP 403 to the importer. |
| [Responses API computer environment](agents.260311.equip-responses-api-computer-environment.md.report.md) | `http_403`: the exact source returned HTTP 403 to the importer. |
| [TanStack Code Mode with Skills](tools.260624.tanstack-ai-code-mode-with-skills.md.report.md) | `http_404`: the exact GitHub raw URL returned HTTP 404 to the importer. |

Evidence: [sanitized direct-probe results](transport-probes-2026-10-24.jsonl). The probes did not convert or publish replacement content. HTTP 403 alone does not identify whether credentials, access policy or automated-request filtering caused the rejection. The HTTPS downgrade policy remains enforced. No configured URL was changed and no alternative source content was substituted.

A separate web retrieval reached the Magnus919 and OpenAI articles and a member-only Level Up preview, while its TanStack request returned a cache miss. Those observations came from another retrieval environment, are not local importer success, and were not used to fill the local memory store.
## Regression and preservation checks

All nine targeted text/X tests passed under Bun 1.4.2 after the ordering and report-rendering fixes. The [text tests](../../../test/research-text.test.ts) exercise strict source configuration, per-source failure continuation, exact-key stale-version retention, configured group ordering despite reversed worker completion, shared-URL deduplication across aliases, immutable exports and tamper rejection, query redaction, locks and cancellation deadlines. The [X tests](../../../test/research-x.test.ts) use deterministic responses rather than credentials. Source headings and warnings render as inert text; fixtures include relative-image syntax, a script-scheme link, raw HTML and a private query parameter. The source Markdown and original files remain available in version evidence without being embedded as executable report markup. Final repository checks are recorded in [verification](../../verification.md).

The migration verified all 239 original resource files against the [preservation manifest](../../archive/legacy-research/migration-manifest.json) before removing the obsolete `resources` directory. Original texts, PDFs and images remain under [data/research/texts](../../../data/research/texts/); earlier generated reports and helper scripts remain under [legacy research](../../archive/legacy-research/README.md), explicitly unverified. Root URL configuration filenames and bytes were preserved. No configured source was silently replaced.