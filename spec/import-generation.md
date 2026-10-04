# Resource import and media generation

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
