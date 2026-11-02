# Resource import and media generation

For speech and audiovisual input, see [channel input](channel-input.md) and [media processing](media-processing.md): preserve original recordings, transcript revisions, timing and speaker-method provenance, while generated voices remain distinct from imported evidence.

[Home](README.md) · [Import pipeline](import-pipeline.md) · [Generation](generation.md) · [Memory](memory.md) · [Security](security.md)

## Shared architecture, different jobs

Import converts an external resource into versioned evidence and searchable derivatives. Generation converts a request and optional reference artifacts into new media. Both need a tool registry, isolated workers, resource budgets, progress, cancellation, provenance and a durable job record. Keep their outputs distinct: generated text or imagery is not an authoritative external source merely because it can be indexed.

The detailed [import analysis](import-pipeline.md) covers source capture, conversion, incremental indexing and extraction tradeoffs. The detailed [generation analysis](generation.md) covers media/job backends and artifact handling. Their project reports link inspected source files and limits.

## “Add anything” user flow

The user drops files/folders/images or pastes URLs/repository locations, chooses a workspace and optionally a privacy/refresh policy, then sees a source card with progress and indexed coverage. A source card displays source identity, last successful version, parser used, extraction warnings, access scope and available actions: refresh, pause, retry with another tool, inspect original, export and delete.

Unsupported resources remain registered with an explanation; they are not falsely marked indexed. Large folder imports need a preview of included/excluded paths, total size and limits. Repository imports preserve the commit and exclude secrets/dependencies/generated artifacts by default, with configurable inclusion. Authenticated sources use a bound credential reference and must not expand access through redirects, submodules or linked resources silently.

## Tool management lifecycle

```text
discover -> verify publisher/source/version -> inspect capabilities and dependencies
         -> quarantine/install -> isolated health check -> evaluate on fixtures
         -> enable for a workspace -> invoke with per-job grant
         -> observe -> upgrade candidate -> promote or rollback -> retire
```

Passive discovery does not install or execute. Package installation, model downloads and service startup are separate visible actions. Each tool registry entry records supported MIME/modalities, input/output schema, size/time/resource ceilings, operating system/hardware, credential binding, data egress, license and dependency digests, idempotency/cancellation behavior and recent measured reliability.

Use deterministic magic/MIME checks to shortlist importers; use a decision model only when several compatible tools have meaningful quality/cost tradeoffs. Prefer a parser's successful fidelity checks over its confidence self-report. Run fallback converters on failed pages/blocks instead of necessarily reprocessing a whole corpus. [Decision design](decisions.md).

## Import candidates

| Function | Inspected source and report | Selection guidance |
|---|---|---|
| Structured documents | [Docling](https://github.com/docling-project/docling) · [report](projects/ai-query--docling.md) | Preserve layout and impose harness-level size/time limits |
| Broad lightweight conversion | [MarkItDown](https://github.com/microsoft/markitdown) · [report](projects/ai-query--markitdown.md) | Fast fallback for supported formats; preserve original evidence |
| Repository packaging | [Repomix](https://github.com/yamadashy/repomix) · [report](projects/ai-query--repomix.md) | Context export/input preparation, not a substitute for a versioned code index |
| Web extraction | [Trafilatura](https://github.com/adbar/trafilatura) · [report](projects/ai-query--trafilatura.md) | Article extraction with fetch/network policy outside the parser |
| Multimodal retrieval | [RAG-Anything](https://github.com/HKUDS/RAG-Anything) · [report](projects/ai-query--rag-anything.md) | Evaluate cross-modal integration; do not assume it solves source ACL/lifecycle |

## Generation candidates

The [generation analysis](generation.md) compares local inference/workflow tools, audio/video applications and schema-constrained UI generation. [ComfyUI](https://github.com/Comfy-Org/ComfyUI) ([review](projects/ai-agents--comfyui.md)) is an optional graph-based local worker; verify the origin recorded in its report and pin workflow/node/weight versions. Use an API generation adapter when local hardware or model quality is insufficient, with explicit cost/data-placement policy.

Image, audio, video, vector and 3D capabilities are independently advertised; a text-chat subscription does not imply all media endpoints are available. A media job should support reference attachments, previews, resumable progress where possible, output validation and a clear partial/failed state. Artifact publication or messaging is a separate effect with the task's actual authorization.

## Common invariants

- Every artifact/source derivative traces to original inputs and exact converter/generator versions.
- Importing files never runs repository install scripts, document macros or embedded commands implicitly.
- Extraction/classification failure does not corrupt a previously successful source version.
- Secrets and private attachments do not enter public caches or unrelated workspace search results.
- Duplicate job submission reuses a receipt or explicitly reports uncertainty; expensive provider/GPU work is not blindly restarted.
- Binary media stays in artifact storage; model context receives concise metadata and supported reference inputs.
- Deleting a source cancels pending derivatives and invalidates indexed or distilled knowledge that depends on it.

## Success measures

Measure supported-format coverage, extraction fidelity, citation/location fidelity, ingest freshness, invalid-file rejection and cost per usable source. For generation, measure accepted artifacts, reference adherence, time/cost to accepted output, cancellation/recovery and provenance completeness. A larger tool catalog is useful only if selection and failure handling remain predictable.

## October source refresh: conversion results and cache identity

The refreshed [Docling report](projects/ai-query--docling.md) ([source](https://github.com/docling-project/docling)) requires adapters to inspect result status even when exception-on-error is enabled: partial conversion can still return a result. Include concrete parser/backend subtype and options in cache identity, and retain a separate content-integrity hash.

The implemented [text synchronization workflow](research-sync.md) uses this distinction for web, PDF and explicitly selected social posts. Store originals, Markdown and images with source-version provenance; report unsupported article shapes, access shells, failed images and parser limits. The same principle applies to generated media: receiving a file is not evidence of complete or visually correct output.

## Source refresh: 2026-10-28 - route policy and complete extraction

The [Docling refresh](projects/ai-query--docling.md) now rejects multi-document sources through its single-result API, and preserves surviving OCR text beside native table words with distinct token IDs. Import jobs must enumerate members and retain per-member status; detecting a second result after conversion starts does not replace archive admission limits. Preserve coordinate, DPI and OCR/native provenance, then verify table numbers against original pages. Optional provider imports and successful parser construction are separate from permission to transmit source content.

Hosted policy statements need route-specific evidence. The [Marker refresh](projects/ai-query--marker.md) describes zero-data-retention as an opt-in hosted assertion, not proof of an account's configured policy. The [HyperExtract review](projects/ai-query--hyper-extract.md) identifies a foreign-endpoint fallback to `OPENAI_API_KEY` that Teamagent must reject: bind credentials to their approved endpoint rather than inferring authority from protocol compatibility. The [AnyDoc review](projects/ai-query--anydoc.md) supplies useful explicit OCR routing and typed table evidence, but whole-document egress, retention and account terms still require independent evidence. These observations refine adapter requirements; they do not enable a new route or change the implemented training-policy gate.

The [MarkItDown review](projects/ai-query--markitdown.md) makes Document Intelligence add-ons explicit and preserves separate extracted-document fields, but its presentation front matter omits confidence and source spans. Retain the raw extraction response and page coordinates with conversion diagnostics. [Trafilatura's feed/normalization review](projects/ai-query--trafilatura.md) similarly distinguishes useful retrieval text from lossless evidence: replacement decoding and whitespace normalization require the original bytes to remain available, and candidate caps must cover JSON feeds as well as RSS/Atom.

The [Magika review](projects/ai-query--magika.md) shows why bounded channels are insufficient on their own: an ordered-result buffer can accumulate later results behind one slow input. Bound admission, retained results and native-work lifetime together. Type classification remains routing evidence, with actual backend/model/rule provenance; it does not establish that a document is valid or safe to execute.

The [Book-to-Skill review](projects/ai-query--book-to-skill.md) preserves input order/duplicates in converter identity, but a post-conversion hash does not establish that the converter read one stable file snapshot. [RAG-Anything's cache review](projects/ai-query--rag-anything.md) normalizes parser options and source hashes while omitting an explicit parser/model build identity in the inspected key. Own immutable input bytes and include converter/model revisions; keep fallback, partial conversion and provenance gaps visible.

The [MinerU task adapter](projects/ai-query--mineru.md) retains background job identity after a synchronous wait expires and reports partial file results. Its per-file limits do not bound total uploads or expanded ZIP output. Enforce total input/result/archive budgets, tenant ownership and cancellation-safe source leases before dispatch. [OpenDataLoader's failure wrapper](projects/ai-query--opendataloader-pdf.md) returns bounded cause types while still logging exception details; apply privacy controls to both responses and logs and verify actual JVM cleanup. [Repomix's cancellation path](projects/ai-query--repomix.md) settles started output before cleanup, but not every phase receives the signal and a shutdown timeout exits successfully. Receipts must distinguish partial output, cancellation and forced shutdown.

The [Watermarks Remover review](projects/ai-query--watermarks-remover.md) is a boundary warning for ordinary memory import: vendor metadata is not proof of AI authorship, and cleanup removes provenance/add-ins rather than merely extracting content. Preserve originals and annotations; do not adopt that cleanup as an implicit ingestion step. [OfficeCLI's resident-process review](projects/ai-query--officecli.md) also requires observed retirement rather than a printed success message before direct-file fallback. The [Leaf parser](projects/ai-query--leaf.md) is a tolerant display model, so recovered ranges and lossy decoded paths need independent verification before becoming exact citations or patch inputs.

The [OfficeParser review](projects/ai-query--office-parser.md) separates a bounded delimiter sample from the synchronous full CSV parse and finds that PDF operator filtering depends on a private PDF.js hook. Require fresh per-document options, actual byte/node budgets, effective cancellation and explicit bounded-mode availability. [Codegraph's ordered parse dispatch](projects/ai-agents-mem--codegraph.md) offers useful backpressure on both active and completed work, while its synchronous fallback and differing symlink policies need stronger host contracts. Preserve embedded-block warnings even when a health view excludes them from fatal parse errors.

The [Codeflow review](projects/ai-query--codeflow.md) treats conservative patch generation as a reviewable proposal tied to source identity; fixture expectations and no-write checks do not establish runtime isolation. [Agent Beacon's corpus installation](projects/ai-agents-mem--agent-beacon.md) validates rule data before staging, but ignored rollback failures and concurrent publication still need durable recovery receipts. Explicitly distinguish unreadable stores from empty stores and unsupported rule versions from successful coverage.

The [Xberg RTF review](projects/ai-query--xberg.md) supplies useful whitespace-to-offset remapping and table-literal fidelity fixes, while auxiliary Unicode capture and group-depth bounds need further work. Its strict-parse fixtures distinguish fallback text and truncation warnings from structured success. [Diagram Design's draw.io importer](projects/ai-gen--diagram-design.md) rejects unsafe XML declarations and bounds individual inflation, pages and cells, but still needs bounded actual reads and an aggregate expansion budget. Preserve feature-level loss and fallback warnings in import receipts and citations; a successful conversion does not establish complete structure.

The initial [yt-dlp review](analyses/unreviewed/ai-query--yt-dlp.md) treats delegated URLs and wrapper referers as separate provenance edges, with worker-level redirect, byte, page and output limits. Its process-global token cache is bounded by entry count, which does not establish byte limits or account isolation. Provider documentation and executable examples are evidence to inspect, not trusted instructions. [CareerOps' provider-cache review](projects/ai-media--career-ops.md) adds a related freshness rule: a failed recheck can reuse an old ID indefinitely, so return age and degradation explicitly and validate newly resolved values before storing them. DNS pacing still requires bounded admission and cancellation.

## Additional scoped review references

These catalog associations provide navigation to scoped source reviews. Each report records its inspected revision, findings and exclusions; inclusion here does not establish a capability or an adoption decision.

- [gittifacts](analyses/unreviewed/ai-agents-mem--gittifacts.md)
- [helix-foundry](analyses/unreviewed/ai-agents-mem--helix-foundry.md)
- [xerj](analyses/unreviewed/ai-agents-mem--xerj.md)
- [jantt](analyses/unreviewed/ai-gen--jantt.md)
- [better-icons](analyses/unreviewed/ai-query--better-icons.md)
- [dbx](analyses/unreviewed/ai-query--dbx.md)

## Source refresh: 2026-11-01 — coverage before successful publication

The following refinements are proposed architecture and acceptance requirements. Current implemented behavior is documented in [memory imports](memory-imports.md) and [media processing](media-processing.md); inspected upstream fixtures were not executed during this source refresh.

Import results need independent acquisition, interpretation and publication states. [Docling](https://github.com/docling-project/docling) ([review](projects/ai-query--docling.md)) preserves unknown and incomplete generation stop reasons, but normal model termination cannot prove complete document extraction. [MinerU](https://github.com/opendatalab/MinerU) ([review](projects/ai-query--mineru.md)) exposes preview page coverage and validates image closure before returning a multiformat result. [OfficeParser](https://github.com/harshankur/officeParser) ([review](projects/ai-query--office-parser.md)) retains glyph fallbacks when richer structure is unavailable. Record missing pages, unknown glyph mappings, omitted assets and fallback transformations rather than reducing all of them to a successful Markdown file.

Resource bounds must describe the actual protected stage. [Xberg](https://github.com/xberg-io/xberg) ([review](projects/ai-query--xberg.md)) checks actual stored image bytes before copying, while object loading remains outside that copy bound. [Kanban Code](https://github.com/langwatch/kanban-code) ([review](projects/ai-query--kanban-code.md)) demonstrates chunked attachment transport, but per-request limits and a preliminary file size do not establish total transfer bounds or final integrity. Apply cumulative input/expanded-byte, page/pixel, queue, memory and total-time limits; verify the final manifest and content hashes before admitting assets to model context.

Completed generation and successful delivery remain different outcomes. [GFlow CLI](https://github.com/ffroliva/gflow-cli) ([review](projects/ai-query--gflow-cli.md)) supports cross-filesystem relocation through copy/delete fallback; that convenience is not exclusive atomic publication. Preserve the generated artifact reference, copy into a destination-local owned staging file, validate bytes and media properties, then publish without overwrite. Download, relocation or local format failure must resume the existing result rather than silently requesting generation again. The [PageIndex retry review](projects/ai-agents-mem--pageindex.md) ([source](https://github.com/VectifyAI/PageIndex)) reinforces why generic transport retries cannot determine whether a billable operation already ran.

Keep research articles static after their first successful capture. Only an explicit per-URL refresh declaration enables remote revalidation, including image validators; an updated parser can derive a new representation from retained evidence without fetching another article version. Retain creation/publication assertions, precision and source field separately from acquisition/validation dates. See the exact [text-source policy](research-sync.md) and [pipeline requirements](import-pipeline.md).

<!-- coverage:start -->
## Project coverage

Every associated project has its own report. Source-reviewed associations reflect the inspected scope; screened associations derive from the input category and are not capability claims.

| Source | Report | Depth |
|---|---|---|
| [comfyui](https://github.com/comfy-org/comfyui) | [Report](projects/ai-agents--comfyui.md) | source-reviewed |
| [cognee](https://github.com/topoteretes/cognee) | [Report](projects/ai-agents-mem--cognee.md) | source-reviewed |
| [gitnexus](https://github.com/abhigyanpatwari/GitNexus) | [Report](projects/ai-agents-mem--gitnexus.md) | source-reviewed |
| [graphrag](https://github.com/microsoft/graphrag) | [Report](projects/ai-agents-mem--graphrag.md) | source-reviewed |
| [lightrag](https://github.com/HKUDS/LightRAG) | [Report](projects/ai-agents-mem--lightrag.md) | source-reviewed |
| [llm-wiki-compiler](https://github.com/atomicmemory/llm-wiki-compiler) | [Report](projects/ai-agents-mem--llm-wiki-compiler.md) | source-reviewed |
| [xx-2604-llm-wiki.karpathy](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f) | [Report](projects/ai-agents-mem--xx-2604-llm-wiki.karpathy.md) | design-reviewed |
| [just-bash](https://github.com/vercel-labs/just-bash) | [Report](projects/ai-agents-sandbox--just-bash.md) | source-reviewed |
| [create.skill-seekers](https://github.com/yusufkaraaslan/Skill_Seekers) | [Report](projects/ai-agents-skills--create.skill-seekers.md) | source-reviewed |
| [docs.2603.skills-discovery-rfc.cloudflare](https://github.com/cloudflare/agent-skills-discovery-rfc) | [Report](projects/ai-agents-skills--docs.2603.skills-discovery-rfc.cloudflare.md) | source-reviewed |
| [manage.skillware](https://github.com/ARPAHLS/skillware) | [Report](projects/ai-agents-skills--manage.skillware.md) | source-reviewed |
| [diagram-design](https://github.com/cathrynlavery/diagram-design) | [Report](projects/ai-gen--diagram-design.md) | screened |
| [flint-chart](https://github.com/microsoft/flint-chart) | [Report](projects/ai-gen--flint-chart.md) | screened |
| [genui.flutter](https://github.com/flutter/genui) | [Report](projects/ai-gen--genui.flutter.md) | screened |
| [quarkdown](https://github.com/iamgio/quarkdown) | [Report](projects/ai-gen--quarkdown.md) | screened |
| [tera](https://github.com/Keats/tera) | [Report](projects/ai-gen--tera.md) | screened |
| [xx-2601-davia](https://github.com/davialabs/davia) | [Report](projects/ai-gen--xx-2601-davia.md) | screened |
| [career-ops](https://github.com/santifer/career-ops) | [Report](projects/ai-media--career-ops.md) | screened |
| [finger-frame-effect](https://github.com/sophiamyang/finger-frame-effect) | [Report](projects/ai-media--finger-frame-effect.md) | screened |
| [personalive](https://github.com/GVCLab/PersonaLive) | [Report](projects/ai-media--personalive.md) | screened |
| [streambert](https://github.com/truelockmc/streambert) | [Report](projects/ai-media--streambert.md) | screened |
| [prompts.chat](https://github.com/f/prompts.chat) | [Report](projects/ai-prompts--prompts.chat.md) | source-reviewed |
| [aci](https://github.com/aipotheosis-labs/aci) | [Report](projects/ai-query--aci.md) | screened |
| [agent-browser](https://github.com/vercel-labs/agent-browser) | [Report](projects/ai-query--agent-browser.md) | screened |
| [anydoc](https://github.com/firecrawl/anydoc) | [Report](projects/ai-query--anydoc.md) | screened |
| [book-to-skill](https://github.com/virgiliojr94/book-to-skill) | [Report](projects/ai-query--book-to-skill.md) | screened |
| [browser-harness](https://github.com/browser-use/browser-harness) | [Report](projects/ai-query--browser-harness.md) | screened |
| [clawpatrol](https://github.com/denoland/clawpatrol) | [Report](projects/ai-query--clawpatrol.md) | screened |
| [codebase-radar](https://github.com/BleedingDev/codebase-radar) | [Report](projects/ai-query--codebase-radar.md) | screened |
| [codeflow](https://github.com/braedonsaunders/codeflow) | [Report](projects/ai-query--codeflow.md) | screened |
| [cowork-aion-ui](https://github.com/iOfficeAI/AionUi) | [Report](projects/ai-query--cowork-aion-ui.md) | screened |
| [docling](https://github.com/docling-project/docling) | [Report](projects/ai-query--docling.md) | source-reviewed |
| [fastmcp](https://github.com/punkpeye/fastmcp) | [Report](projects/ai-query--fastmcp.md) | screened |
| [get-md](https://github.com/Nano-Collective/get-md) | [Report](projects/ai-query--get-md.md) | screened |
| [gflow-cli](https://github.com/ffroliva/gflow-cli) | [Report](projects/ai-query--gflow-cli.md) | screened |
| [hyper-extract](https://github.com/yifanfeng97/Hyper-Extract) | [Report](projects/ai-query--hyper-extract.md) | screened |
| [kanban-code](https://github.com/langwatch/kanban-code) | [Report](projects/ai-query--kanban-code.md) | screened |
| [leaf](https://github.com/RivoLink/leaf) | [Report](projects/ai-query--leaf.md) | screened |
| [leann](https://github.com/yichuan-w/LEANN) | [Report](projects/ai-query--leann.md) | source-reviewed |
| [lightpanda-browser](https://github.com/lightpanda-io/browser) | [Report](projects/ai-query--lightpanda-browser.md) | screened |
| [litho-deepwiki-rs](https://github.com/sopaco/deepwiki-rs) | [Report](projects/ai-query--litho-deepwiki-rs.md) | screened |
| [magika](https://github.com/google/magika) | [Report](projects/ai-query--magika.md) | source-reviewed |
| [mantic.sh](https://github.com/marcoaapfortes/Mantic.sh) | [Report](projects/ai-query--mantic.sh.md) | screened |
| [marker](https://github.com/datalab-to/marker) | [Report](projects/ai-query--marker.md) | screened |
| [markitdown](https://github.com/microsoft/markitdown) | [Report](projects/ai-query--markitdown.md) | source-reviewed |
| [mcp-docs](https://github.com/modelcontextprotocol/modelcontextprotocol) | [Report](projects/ai-query--mcp-docs.md) | screened |
| [mcp-ext-apps](https://github.com/modelcontextprotocol/ext-apps) | [Report](projects/ai-query--mcp-ext-apps.md) | screened |
| [mcp-ext-auth](https://github.com/modelcontextprotocol/ext-auth) | [Report](projects/ai-query--mcp-ext-auth.md) | screened |
| [mcp-inspector](https://github.com/modelcontextprotocol/inspector) | [Report](projects/ai-query--mcp-inspector.md) | screened |
| [mcp-sdk-go](https://github.com/modelcontextprotocol/go-sdk) | [Report](projects/ai-query--mcp-sdk-go.md) | screened |
| [mcp-sdk-python](https://github.com/modelcontextprotocol/python-sdk) | [Report](projects/ai-query--mcp-sdk-python.md) | screened |
| [mcp-sdk-rust](https://github.com/modelcontextprotocol/rust-sdk) | [Report](projects/ai-query--mcp-sdk-rust.md) | screened |
| [mcp-sdk-typescript](https://github.com/modelcontextprotocol/typescript-sdk) | [Report](projects/ai-query--mcp-sdk-typescript.md) | screened |
| [md-page-extension](https://github.com/Ademking/MD-This-Page) | [Report](projects/ai-query--md-page-extension.md) | screened |
| [mineru](https://github.com/opendatalab/MinerU) | [Report](projects/ai-query--mineru.md) | screened |
| [office-parser](https://github.com/harshankur/officeParser) | [Report](projects/ai-query--office-parser.md) | screened |
| [officecli](https://github.com/iOfficeAI/OfficeCLI) | [Report](projects/ai-query--officecli.md) | screened |
| [omniparser](https://github.com/microsoft/OmniParser) | [Report](projects/ai-query--omniparser.md) | screened |
| [oneglanse](https://github.com/aryamantodkar/oneglanse) | [Report](projects/ai-query--oneglanse.md) | screened |
| [opendataloader-pdf](https://github.com/opendataloader-project/opendataloader-pdf) | [Report](projects/ai-query--opendataloader-pdf.md) | screened |
| [pdf-inspector](https://github.com/firecrawl/pdf-inspector) | [Report](projects/ai-query--pdf-inspector.md) | screened |
| [playwright](https://github.com/microsoft/playwright) | [Report](projects/ai-query--playwright.md) | screened |
| [rag-anything](https://github.com/HKUDS/RAG-Anything) | [Report](projects/ai-query--rag-anything.md) | source-reviewed |
| [regulated-ai-governance](https://github.com/ashutoshrana/regulated-ai-governance) | [Report](projects/ai-query--regulated-ai-governance.md) | screened |
| [repomix](https://github.com/yamadashy/repomix) | [Report](projects/ai-query--repomix.md) | source-reviewed |
| [spotify-portal-ai-plugins](https://github.com/spotify/portal-ai-plugins) | [Report](projects/ai-query--spotify-portal-ai-plugins.md) | screened |
| [stagehand](https://github.com/browserbase/stagehand) | [Report](projects/ai-query--stagehand.md) | screened |
| [trafilatura](https://github.com/adbar/trafilatura) | [Report](projects/ai-query--trafilatura.md) | source-reviewed |
| [understand-anything](https://github.com/Lum1104/Understand-Anything) | [Report](projects/ai-query--understand-anything.md) | screened |
| [use-webmcp-tool](https://github.com/GoogleChromeLabs/use-webmcp-tool) | [Report](projects/ai-query--use-webmcp-tool.md) | screened |
| [watermarks-remover](https://github.com/guillaumemeyer/watermarks-remover) | [Report](projects/ai-query--watermarks-remover.md) | screened |
| [wigolo](https://github.com/KnockOutEZ/wigolo) | [Report](projects/ai-query--wigolo.md) | screened |
| [xberg](https://github.com/xberg-io/xberg) | [Report](projects/ai-query--xberg.md) | screened |
| [xx-2602-markform](https://github.com/jlevy/markform) | [Report](projects/ai-query--xx-2602-markform.md) | screened |
| [osv-scanner](https://github.com/google/osv-scanner) | [Report](projects/ai-security--osv-scanner.md) | source-reviewed |
| [skillspector](https://github.com/NVIDIA/SkillSpector) | [Report](projects/ai-security--skillspector.md) | source-reviewed |
| [agent-codex](https://github.com/openai/skills) | [Report](projects/ai-skills--agent-codex.md) | source-reviewed |
| [context-hub.andrewyng](https://github.com/andrewyng/context-hub) | [Report](projects/ai-skills--context-hub.andrewyng.md) | source-reviewed |
<!-- coverage:end -->

## Hosted and local voice comparisons

The [voice backend expansion](media-processing.md#voice-backend-expansion-and-astra-provenance) compares direct services, managed hosts and local checkpoints, with individual reports, dated pricing, license distinctions and the confirmed Astra analysis's partial-retrieval provenance. The [comparative evaluation](media-processing.md#comparative-voice-evaluation) defines speaker-fidelity, pronunciation, latency and cost checks; [runtime documentation](media-runtime.md) records what is actually implemented.

## Follow-up source review: 2026-10-28 — extraction coverage and trustworthy recovery

Import success needs coverage and quality evidence. [Docling](https://github.com/docling-project/docling) ([review](projects/ai-query--docling.md#follow-up-change-review--2026-10-28)) detects suspicious PDF text using conservative text heuristics; those signals cannot establish agreement with the rendered page. [OpenDataLoader PDF](https://github.com/opendataloader-project/opendataloader-pdf) ([review](projects/ai-query--opendataloader-pdf.md#follow-up-change-review--2026-10-28)) removes artifact text only when painted operators establish it and preserves ambiguous untagged content. Keep original text, filtered structure, images and OCR as separately versioned views with reasons for each transformation. [RAG-Anything](https://github.com/HKUDS/RAG-Anything) ([review](projects/ai-query--rag-anything.md#follow-up-change-review--2026-10-28)) routes rendered charts as images while retaining original document identity, captions, page and bounds in its fixtures. Validate actual image bytes and gate cloud use before dispatching such derived views.

Auxiliary resources and native bindings are part of the import boundary. [officeParser](https://github.com/harshankur/officeParser) ([review](projects/ai-query--office-parser.md#follow-up-change-review--2026-10-28)) shares asset reads and cumulative waiting budgets, but inspected default redirects and lexical local containment do not satisfy Teamagent's own network/path policy. Provision trusted resources and expose missing-asset/partial-extraction warnings. [Magika](https://github.com/google/magika) ([review](projects/ai-query--magika.md#follow-up-change-review--2026-10-28)) combines deterministic format evidence and model vetoes; its 4 KiB prefix does not bound central-directory expansion, so total I/O remains a host responsibility. [Xberg](https://github.com/xberg-io/xberg) ([review](projects/ai-query--xberg.md#follow-up-change-review--2026-10-28)) corrects borrowed native string ownership and keeps native qualification separate from ordinary fixtures. A successful pure test cannot certify the installed OCR binary/model combination.

Use the same validated operation contract across surfaces. [OfficeCLI](https://github.com/iOfficeAI/OfficeCLI) ([review](projects/ai-query--officecli.md#follow-up-change-review--2026-10-28)) shares view preflight between its resident and CLI, rejecting options that would otherwise be ignored. [DBX](https://github.com/t8y2/dbx) ([review](analyses/unreviewed/ai-query--dbx.md#follow-up-change-review--2026-10-28)) propagates connection query timeouts, including explicit unlimited execution; the harness still needs an outer finite task budget and cancellation. [Lightpanda](https://github.com/lightpanda-io/browser) ([review](projects/ai-query--lightpanda-browser.md#follow-up-change-review--2026-10-28)) changes selector semantics and matching cost, so choose browser backends from task-specific compatibility fixtures rather than a general speed claim. [agent-browser](https://github.com/vercel-labs/agent-browser) ([review](projects/ai-query--agent-browser.md#follow-up-change-review--2026-10-28)) scopes generated mock CORS to an allowed origin while preserving explicit overrides; a mock is not real-site permission. [Playwright](https://github.com/microsoft/playwright) ([review](projects/ai-query--playwright.md#follow-up-change-review--2026-10-28)) correctly marks test-writing tools as actions and chooses trace frames without assuming arrival-time order.

[Stagehand](https://github.com/browserbase/stagehand) ([review](projects/ai-query--stagehand.md#follow-up-change-review--2026-10-28)) changes generated schema metadata and removes some examples; preserve version-specific supported integrations. [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk) ([review](projects/ai-query--mcp-sdk-typescript.md#follow-up-change-review--2026-10-28)) updates a URI dependency with upstream release claims that require local boundary fixtures; [MCP Go SDK](https://github.com/modelcontextprotocol/go-sdk) ([review](projects/ai-query--mcp-sdk-go.md#follow-up-change-review--2026-10-28)) changes contributor/security guidance only in this interval. [get-md](https://github.com/Nano-Collective/get-md) ([review](projects/ai-query--get-md.md#follow-up-change-review--2026-10-28)) changes a download badge only. None of those changes justifies a new extraction-accuracy or authentication claim.

Recovery after generation must reuse evidence, not repeat a costly action. [gflow-cli](https://github.com/ffroliva/gflow-cli) ([review](projects/ai-query--gflow-cli.md#follow-up-change-review--2026-10-28)) reconciles lost image replies against a pre-submit grid and refuses ambiguous counts; the inspected settle check does not compare tile-ID sets, so stronger request identity is required for concurrent writers. Preserve the unknown outcome when attribution cannot be proved. Source reviews here did not run providers, browsers, OCR or converters; the officeParser aggregate diff was capped and the selected asset implementation was expanded separately.

### Additional scoped reviews from November 1

These newly reviewed sources complement the themes above. Each report states its selected source scope and limitations; listing it does not imply runtime integration or comparative quality.

- [midbrain-memory-mcp](https://github.com/midbrainai/midbrain-memory-mcp) ([scoped report](analyses/unreviewed/ai-agents-mem--midbrain-memory-mcp.md)).
- [diffmap](https://github.com/tanishqkancharla/diffmap) ([scoped report](analyses/unreviewed/ai-gen--diffmap.md)).
- [yue2-studio](https://github.com/timoncool/yue2-studio) ([scoped report](analyses/unreviewed/ai-gen--yue2-studio.md)).
- [minipcm-ocr](https://github.com/openbmb/minicpm-ocr) ([scoped report](analyses/unreviewed/ai-query--minipcm-ocr.md)).

## External-update synthesis: 2026-11-01 — static originals, explicit derivatives and recovery

Treat an imported static article as a captured source version. Improving extraction from retained bytes is a distinct, explicit derivative reconciliation, not a remote refresh. Preserve original hashes, creation/capture dates, old derivative versions, exact locator and warnings. Require expected old/new pins and a durable receipt; recover publication from that receipt without refetching. The implemented research procedure is documented in [source maintenance](research-sync.md); [text analyses](analyses/texts/README.md) retain incomplete coverage instead of upgrading it from image counts or text overlap alone.

Git organization and source identity also differ. Import regenerated declarations into the owned inventory, observe moved checkouts without changing remote freshness, and require independent identity plus full commit continuity for changed upstream URLs. [Hermes Agent](https://github.com/NousResearch/hermes-agent) ([review](projects/ai-agents--hermes-agent.md)) supplies useful fixed-target collision/stash reasoning; its destructive discard option is not a Teamagent default. [LoopX](https://github.com/huangruiteng/loopx) ([review](projects/ai-agents--loopx.md)) reinforces platform-aware physical containment separately from logical scope normalization. A point-in-time path check does not eliminate replacement races.

Generation progress, completed artifacts and cleanup need separate receipts. [ComfyUI](https://github.com/comfy-org/comfyui) ([review](projects/ai-agents--comfyui.md)) attempts independent cleanup after failure without treating cleared ownership markers as proof of GPU release. [Murage](https://github.com/ferroxlabs/murage) ([review](analyses/unreviewed/ai-agents--murage.md)) keeps backup progress outside the authoritative final result. These scoped source findings do not establish media quality, device compatibility or a successful native run.

[Open Notebook](https://github.com/lfnovo/open-notebook) ([review](analyses/unreviewed/ai-agents--open-notebook.md)) retains source identity before queuing extraction and preserves podcast transcript/outline when later audio assembly fails. Its optional extraction-runtime fallback may change the actual processing engine. Import/generation plans must therefore disclose effective routes and preserve partial artifacts without substituting a notebook identifier for unavailable content or purchasing generation again automatically.

The November 1 [AgentTeams](https://github.com/agentscope-ai/agentteams) ([review](analyses/unreviewed/ai-agents--agentscope-agentteams.md)) inspection reinforces payload-before-metadata publication and explicit locally saved versus remotely published outcomes. Its modification-time guard does not prevent stale-copy edits overwriting newer remote content, and failed remote-time probes can permit copying. Require the retained read-baseline version/hash and conditional publication; preserve successful local artifacts while reconciling uncertain remote state. No object-store or Matrix operation was executed.

[MaxKB](https://github.com/1panel-dev/maxkb) ([review](analyses/unreviewed/ai-agents-mem--maxkb.md)) distinguishes document web synchronization from vector refresh, while embedding preparation transforms source text and knowledge-wide rebuilding removes old indexes before replacement jobs finish. Preserve static originals and explicit derivative/refresh operations, build complete replacement versions before switching, and report all omitted jobs. Source fields and queue deduplication alone establish neither immutable lineage nor safe provider retries; the underlying extractors and complete authorization implementation were outside this review.

Duplicate declarations must retain provenance without inflating coverage. [Yue2 Studio](https://github.com/timoncool/yue2-studio)'s [archived media-category report](analyses/unreviewed/ai-media--yue2-studio.md) explicitly points to its [primary generation-category review](analyses/unreviewed/ai-gen--yue2-studio.md): both configured checkouts are preserved, and the observed canonical origin and commit match. A later revision mismatch requires reconciliation rather than inheriting the primary findings automatically. The primary review's explicit audio preparation remains separate from model provenance, rights and runtime validation; the latest popularity-chart delta supplies none of that missing evidence.

## Source addition: 2026-11-02 — preview, approved bytes and publication

[OpenWorker](https://github.com/andrewyng/openworker) ([scoped review](analyses/unreviewed/ai-agents--openworker.md)) offers staged skill upload and verified model-download concepts, but its reviewed skill confirmation lacks an immutable approved digest and archive expansion quotas. The STT installer checks size/hash after transfer and removes the prior model before rename; this is not atomic old-or-new resource publication. Bound downloads and expansion before allocation, preserve originals and exact candidate versions, and activate only a complete approved result. A local speech model, imported procedure and hosted generation route have different provenance and authority requirements. This source review added no extractor/generator backend or provider call and does not alter static article retention.
