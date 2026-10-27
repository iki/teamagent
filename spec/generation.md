# Generation tools and artifact production

The detailed [media processing analysis](media-processing.md) covers STT, TTS, reference-conditioned synthesis, voice enrollment, codec provenance and backend selection. [Channel input](channel-input.md) separates recorded media from live conversational turn handling.

Generation should be an asynchronous tool ecosystem with a common artifact contract. Separate model inference, editable composition, native rendering, and delivery. Images, audio, video, documents, interfaces, and 3D outputs need different validation and resource policies; a single text-provider login does not imply access to all of them.

This direction complements [import and generation](import-generation.md), [models](models.md), [skills](skills.md), and [channels](channels.md). The source reviews are static; no media job or advertised quality benchmark was executed.

## Reviewed tool roles

| Tool | Observed role and useful idea | Decision |
|---|---|---|
| [A2UI report](projects/ai-gen--a2ui.md) · [GitHub](https://github.com/google/A2UI) | Client-owned component catalogs and catalog-scoped payload validation | Cross-client generated artifact UI; configure strict validation explicitly |
| [json-render report](projects/ai-gen--json-render.md) · [GitHub](https://github.com/vercel-labs/json-render) | Validated component-tree specs and multiple renderer targets | Good first-party UI artifact candidate; pick one protocol initially |
| [OpenDesign report](projects/ai-gen--open-design.md) · [GitHub](https://github.com/nexu-io/open-design) | Agent registry plus independent media-provider readiness | Borrow integration-state UX and native artifact workflow |
| [HyperFrames report](projects/ai-gen--hyperframes.md) · [GitHub](https://github.com/heygen-com/hyperframes) | HTML/media timeline to queued video rendering | Editable motion graphics/explainers in isolated render workers |
| [ViMax report](projects/ai-media--vimax.md) · [GitHub](https://github.com/HKUDS/ViMax) | Story, character, portrait, and clip pipeline with checkpoints | Optional creative workflow; add content-aware dependency invalidation |
| [VoiceStudio report](projects/ai-media--voicestudio.md) · [GitHub](https://github.com/debpalash/VoiceStudio) | Agent-facing speech/transcription tools and file output mode | Optional local audio worker; verify chosen engine and distribution license |
| [YuE report](projects/ai-media--yue.md) · [GitHub](https://github.com/multimodal-art-projection/YuE) | YuE2 symbolic music plan, semantic generation, hashed saved artifacts | Experimental music adapter with hardware and quality evaluation |

These tools occupy different layers. A composition renderer is not a foundation video model; a protocol for declarative UI is not arbitrary website code execution. Core orchestration should depend on capability contracts, not brand names.

## Plugin contract and lifecycle

```text
GenerationToolManifest
  id, version, publisher, source_revision, bundle_hash
  operations, input_schema, output_schema, supported_mime_types
  model_and_weight_requirements, executable_dependencies
  credential_kinds, outbound_domains, local_paths, hardware_requirements
  estimate, submit, poll_or_subscribe, cancel, fetch_artifacts, health
  supports_seed, supports_edit, supports_resume, supports_idempotency
  license_refs, retention_policy, capability_test_version
```

Tools move through **discovered → staged → inspected → configured → capability-tested → enabled → deprecated/disabled**. Downloading a model, installing a native codec, trusting a new MCP server, and giving a tool access to a private folder are distinct changes. Show the concrete capability and resource change before activation where user authorization is needed. Updates install into a new version slot and pass the same gates; running jobs retain their original version.

Store signed publisher identity where available, but bind approval to the actual bundle/model digest and granted capabilities. [SkillSpector's inspection ledger](projects/ai-security--skillspector.md) ([GitHub](https://github.com/NVIDIA/SkillSpector)) illustrates how partial inspection must remain visible; [Trivy's artifact interfaces](projects/ai-security--trivy.md) ([GitHub](https://github.com/aquasecurity/trivy)) support environment and bundle scanning. Neither scan alone establishes trust.

## Durable job and artifact model

```text
GenerationJob
  task_id, job_id, parent_job_id, tool_version, route_id
  prompt_or_spec_ref, input_artifact_ids, model_weight_identity
  seed_and_parameters, output_constraints, rights_and_consent_metadata
  resource_reservation, estimate, budget_cap, deadline, idempotency_key
  state, progress_evidence, cancellation_state, retry_lineage

Artifact
  id, content_hash, mime_type, byte_size, dimensions_or_duration
  original_inputs, transformations, producing_job, timestamps
  editable_source_ref, preview_ref, full_output_ref, captions_or_transcript
  quality_checks, access_policy, retention, provenance_manifest
```

Use an immutable object store plus a metadata database. URLs used for delivery should be scoped and expire; internal artifact identity stays stable. Keep large bytes out of model context. [VoiceStudio's file mode](projects/ai-media--voicestudio.md) ([GitHub](https://github.com/debpalash/VoiceStudio)) demonstrates why inline base64 is expensive. The model receives a concise typed result and can request a preview, transcript, or selected frames when useful.

Artifact states should distinguish draft, validated, accepted, superseded, and deleted. A failed or canceled job may have usable partial artifacts, but those must not be presented as completed output. Preserve provenance for every transformation, including resampling, transcoding, compression, OCR, captioning, and extraction into memory.

## Workflow algorithms

**Composition-first generation.** Produce an editable plan, validate it, create assets, render a low-cost preview, evaluate, and promote to final output. Use [HyperFrames](projects/ai-gen--hyperframes.md) ([GitHub](https://github.com/heygen-com/hyperframes)) for timeline-driven rendering and [YuE2](projects/ai-media--yue.md) ([GitHub](https://github.com/multimodal-art-projection/YuE)) as a reference for keeping an explicit symbolic intermediate. The same principle applies to slide outlines, diagrams, CAD scenes, and document structure, with dedicated adapters needed for those formats.

**Content-addressed dependency DAG.** Hash input content, tool version, parameters, and model identity. Each stage names its upstream artifacts. Changing a style, brief, or character reference invalidates dependent stages; accepted unrelated outputs remain reusable. [ViMax's file-based checkpoints](projects/ai-media--vimax.md) ([GitHub](https://github.com/HKUDS/ViMax)) provide a practical baseline but require this stronger invalidation model for a general harness.

**Bounded candidate selection.** Start with a small preview/candidate budget. Generate more only when expected quality improvement exceeds cost and delay, or when a specific defect requires repair. Store every judge result and selected candidate, including disagreement between deterministic checks, model critics, and user preference. See [decisions](decisions.md) for calibrated JEV-like gating; aesthetic judgment is not a deterministic correctness oracle.

**Reproducible rendering.** Pin fonts, browser/codec versions, dimensions, exact rational frame rate, locale, timestamps, random seeds where supported, and asset hashes. [HyperFrames' frame-rate parsing](projects/ai-gen--hyperframes.md) ([GitHub](https://github.com/heygen-com/hyperframes)) demonstrates a concrete detail that affects output semantics. Record nondeterministic provider behavior rather than claiming a seed guarantees identical output across versions.

## Import/generation symmetry

A generated result can enter the knowledge base through the same artifact ingestion path as a user-supplied file. Preserve the original source and derived representations separately. Index text, OCR, captions, transcripts, visual embeddings, symbolic structure, and source spans/frame times as available. Do not turn a generated image caption into an authoritative fact about the external world without provenance.

Import plugins and generation plugins should share packaging, capabilities, credentials, audit events, and job scheduling, while retaining distinct operations. Import is usually read-oriented and must defend against parser/archive/URL hazards; generation often consumes GPU/API budgets and creates outputs that require layout or perceptual checks. The detailed import pipeline belongs in [import-generation](import-generation.md).

## Generated UI and channels

Keep the fast web/desktop/mobile shell deterministic: navigation, task lists, cancel, approval, and connection status are first-party controls. Generated UI belongs inside a bounded artifact surface. [A2UI](projects/ai-gen--a2ui.md) ([GitHub](https://github.com/google/A2UI)) and [json-render](projects/ai-gen--json-render.md) ([GitHub](https://github.com/vercel-labs/json-render)) show catalog-based approaches. For A2UI, the inspected validator permits unknown elements when configuration is absent, so require explicit strict validation. For either protocol, schema-valid content still requires safe URL handling and server-side action authorization.

Channels should negotiate preview types and fall back to concise text plus a scoped artifact link. Deliver audio/video natively where the channel supports them. Defer expensive previews until requested or visible, cache thumbnails, stream real progress, and never regenerate an asset merely because another client reconnects. [Artemis](projects/ai-operate--artemis.md) ([GitHub](https://github.com/google/artemis)) controls Android devices; it is an optional operation tool, not a replacement for the harness mobile client.

## Execution and validation

Use [OpenSandbox](projects/ai-agents-sandbox--opensandbox.md) ([GitHub](https://github.com/alibaba/OpenSandbox)) or [E2B](projects/ai-agents-sandbox--e2b.md) ([GitHub](https://github.com/e2b-dev/e2b)) for disposable native rendering jobs. Reserve GPU/CPU/memory separately from inference tasks. Lightweight structured transforms can use [just-bash](projects/ai-agents-sandbox--just-bash.md) ([GitHub](https://github.com/vercel-labs/just-bash)) within its trusted-host assumptions. See [security](security.md) for boundary details.

Validation is format-specific: parse and render documents; check image size/alpha/layout; inspect audio duration, clipping, silence, and transcript alignment; validate video frame count, codec, aspect ratio, audio synchronization, and representative frames; validate UI schema and actions. Model critics supplement these checks. Store validation coverage and uncertainty instead of claiming all outputs are visually correct from a successful exit code.

## Delivery milestones

Start with one image-generation adapter, one local speech/transcription adapter, one deterministic document/rendering path, and the common artifact/job system. Add long video and music only after resumability, budgets, previews, and GPU admission are reliable. Compare tools using user task acceptance, correction cycles, reproducibility, total cost, time to preview, and time to accepted final output. No reviewed media project is declared the universal SOTA winner.

<!-- coverage:start -->
## Project coverage

Every associated project has its own report. Source-reviewed associations reflect the inspected scope; screened associations derive from the input category and are not capability claims.

| Source | Report | Depth |
|---|---|---|
| [litellm](https://github.com/BerriAI/litellm) | [Report](projects/ai-agents-proxy--litellm.md) | source-reviewed |
| [e2b](https://github.com/e2b-dev/e2b) | [Report](projects/ai-agents-sandbox--e2b.md) | source-reviewed |
| [opensandbox](https://github.com/alibaba/OpenSandbox) | [Report](projects/ai-agents-sandbox--opensandbox.md) | source-reviewed |
| [a2ui](https://github.com/google/A2UI) | [Report](projects/ai-gen--a2ui.md) | source-reviewed |
| [hyperframes](https://github.com/heygen-com/hyperframes) | [Report](projects/ai-gen--hyperframes.md) | source-reviewed |
| [json-render](https://github.com/vercel-labs/json-render) | [Report](projects/ai-gen--json-render.md) | source-reviewed |
| [open-design](https://github.com/nexu-io/open-design) | [Report](projects/ai-gen--open-design.md) | source-reviewed |
| [vimax](https://github.com/HKUDS/ViMax) | [Report](projects/ai-media--vimax.md) | source-reviewed |
| [voicestudio](https://github.com/debpalash/VoiceStudio) | [Report](projects/ai-media--voicestudio.md) | source-reviewed |
| [yue](https://github.com/multimodal-art-projection/YuE) | [Report](projects/ai-media--yue.md) | source-reviewed |
| [trivy](https://github.com/aquasecurity/trivy) | [Report](projects/ai-security--trivy.md) | source-reviewed |
<!-- coverage:end -->

## Hosted and local voice comparisons

The [voice backend expansion](media-processing.md#voice-backend-expansion-and-astra-provenance) compares direct services, managed hosts and local checkpoints, with individual reports, dated pricing, license distinctions and the confirmed Astra analysis's partial-retrieval provenance. The [comparative evaluation](media-processing.md#comparative-voice-evaluation) defines speaker-fidelity, pronunciation, latency and cost checks; [runtime documentation](media-runtime.md) records what is actually implemented.

<!-- analysis-additions:start -->
## Newly catalogued sources

These category-based links are discovery records, not reviewed capability or adoption claims. See [analysis maintenance](analyses/README.md).

- [jantt](analyses/unreviewed/ai-gen--jantt.md) ([source](https://github.com/ahmadhassan-bted/jantt)).
<!-- analysis-additions:end -->
