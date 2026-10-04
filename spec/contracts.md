# Proposed contracts and data model

[Home](README.md) · [Architecture](architecture.md) · [Agents](agents.md) · [Memory](memory.md)

These are proposed harness interfaces, not APIs verified to exist identically in the surveyed projects. Version schemas at every process/provider boundary. The control plane owns the canonical records; adapters retain opaque native identifiers as references.

## Core entities

| Entity | Required fields and invariants |
|---|---|
| Workspace | ID, tenant, owner, ACL revision, data-placement rules, default policy |
| Host | ID, device identity, owner, platform, capabilities, heartbeat, trust state |
| AgentInstallation | Adapter ID/version, host, executable identity, agent version, probe states/timestamps, credential reference, negotiated features |
| ModelBinding | Provider, endpoint reference, model ID/version, supported modalities/tools/context, account reference, entitlement observation, quota state, cost units |
| Task | ID, objective, acceptance specification, actor, workspace, parent, dependencies, priority, deadline, resource budget, state/revision |
| Attempt | ID, task, host, agent/model binding, lease epoch/expiry, context manifest, native session, start/end, terminal reason |
| Event | Task/attempt, monotonic sequence, type/version, timestamp, actor, payload or blob reference, deduplication key |
| Effect | Stable effect ID, task, tool/version, arguments hash, grant/action digest, state, provider receipt, uncertain outcome flag |
| Artifact | Content hash, type, size, storage reference, source task, producer version, ACL, retention, provenance |
| SourceVersion | Source ID, canonical locator, version/hash, retrieval time, external revision, ACL, rights metadata, parser/config digests |
| EvidenceSpan | Source version, location/page/line/time/bounding box, extracted content hash, modality, confidence, parent transform |
| MemoryClaim | Claim, type, scope, evidence IDs, observed/valid/expiry times, confidence, contradiction/supersession links, status |
| SkillVersion | Source/version/hash, manifest, triggers/negative triggers, harness/model compatibility, dependencies, permissions, eval results |
| Decision | State/candidate/schema digests, provider/model, outputs, calibration version, selected/fallback branch, outcome link |
| Promotion | Candidate/parent hashes, evaluation run IDs, decision, actor/policy, deployment scope, rollback target |

Store secrets in a credential manager, referenced by ID. Do not put them in model prompts, traces, skills, task exports or content-addressed blobs. Record both event time and observation/ingestion time; a document's claim date differs from the time the harness imported it.

## Agent and model boundaries

```ts
type ProbeState = 'unknown' | 'absent' | 'present' | 'incompatible' | 'ready';
type FeatureSupport = 'supported' | 'unsupported' | 'unknown';

interface AgentAdapter {
  probe(host: HostRef, options: { passive: boolean; timeoutMs: number }): Promise<Probe>;
  capabilities(installation: InstallationRef): Promise<AgentCapabilities>;
  start(input: AttemptStart): Promise<{ nativeSession: string }>;
  events(nativeSession: string, cursor?: string): AsyncIterable<NormalizedEvent>;
  send(nativeSession: string, command: SteeringCommand): Promise<CommandReceipt>;
  cancel(nativeSession: string, reason: string): Promise<CancelReceipt>;
  resume(input: AttemptResume): Promise<ResumeReceipt>;
  close(nativeSession: string): Promise<void>;
}

interface ModelAdapter {
  catalog(account: AccountRef): Promise<ModelCatalog>;
  infer(request: CanonicalInference, signal: AbortSignal): AsyncIterable<InferenceEvent>;
  usage(account: AccountRef): Promise<UsageObservation>;
}
```

Catalog is descriptive; `ModelBinding` records tested access separately. `CanonicalInference` must preserve provider-specific fields in a namespaced extension or reject them. Never silently discard tool-call IDs, reasoning budgets, image/file inputs, structured-output settings or cancellation semantics during translation. An installed agent can own its model selection internally and need not expose raw inference.

`AgentCapabilities` includes `effectInterception`, `approvalInterception`, `filesystemIsolation`, `networkIsolation` and `cancellationEnforcement`, each with supported/unsupported/unknown and evidence. Placement rejects an adapter when a task needs a guarantee it cannot enforce. Native opaque tool calls are not automatically protected by the harness effect gateway.

## Worker protocol

The coordinator dispatches `AttemptStart` with task, deadline, allowed workspace snapshot, read/write scope, resource limits, artifact sink, event sink, policy digest, context manifest and lease epoch. A worker first acknowledges compatibility, then starts. Host identity is authenticated independently of whatever model the worker uses.

Worker events include `accepted`, `started`, `message.delta`, `tool.intent`, `tool.result`, `approval.requested`, `artifact.created`, `usage.observed`, `checkpoint.created`, `heartbeat`, `failed` and `completed`. Terminal events include an exit reason and evidence references. The coordinator can reject a result from a stale epoch while still retaining a diagnostic record.

Commands include start, steer, cancel and request-checkpoint. Receiving a cancel command does not prove process termination; report acknowledged, terminating and terminated distinctly. If an external runtime cannot stop a paid call, the harness rejects further gateway-mediated effects and records residual usage. For opaque native effects it reports weaker cancellation and uncertain outcomes; strong confinement requires an enforceable worker sandbox.

## Knowledge and retrieval

```ts
interface ImportAdapter {
  describe(): ImportCapabilities;
  probe(source: SourceDescriptor): Promise<MatchEvidence>;
  import(input: ImportJob, signal: AbortSignal): AsyncIterable<ImportEvent>;
}
interface KnowledgeService {
  addSource(input: SourceRegistration): Promise<SourceRef>;
  refresh(source: SourceRef): Promise<JobRef>;
  retrieve(query: RetrievalRequest): Promise<EvidenceBundle>;
  expand(spans: EvidenceRef[], scope: AuthScope): Promise<EvidenceBundle>;
  proposeMemory(candidate: MemoryCandidate): Promise<CandidateRef>;
  deleteSource(source: SourceRef, revision: number): Promise<DeletionJobRef>;
}
```

An `EvidenceBundle` contains source versions and spans, rank components, authorization scope, retrieval/model/index versions, token estimate, freshness and any missing/failed source notices. Generated summaries cite their input evidence and cannot replace it. Code evidence carries repository identity, commit, path, symbol and lines; uncommitted workspace overlays carry a separate diff hash and cannot masquerade as the indexed commit.

Context compilation produces a manifest: system/policy version; current user request; task state; selected skills and tools; source spans; working diff; reserved output tokens; and omitted candidates with reasons. Preserve citation IDs through summaries. Treat trace text and OCR as untrusted data, including when they contain apparent instructions.

## Skill and tool registry

```ts
interface SkillManifest {
  id: string; version: string; contentHash: string;
  source: SourceRef; license: string | null;
  purpose: string; triggers: string[]; negativeTriggers: string[];
  variants: { harness: string; modelFamily?: string; artifact: ArtifactRef }[];
  dependencies: DependencyPin[];
  requiredCapabilities: string[]; requestedGrants: GrantRequest[];
  inputSchema?: JsonSchema; outputSchema?: JsonSchema;
  evaluations: EvaluationRef[]; status: 'quarantined'|'candidate'|'approved'|'retired';
}
```

Separate catalog metadata from full skill content and executable dependencies. Resolution is a deterministic lockfile operation after relevance selection. Variants cannot silently expand permissions. A skill activation record includes why it matched, the exact variant, added tokens, required tools and the decision/policy version. Names are not immutable identifiers; hashes and source provenance are.

The manifest `status` is artifact admission state. Workspace deployment/activation and candidate-evaluation state are separate records with the more detailed lifecycles in [skills](skills.md) and [evolution](evolution.md). Deactivation removes a skill from future context compilation; it cannot erase instructions already sent to a model or retained by a native session. Use a fresh session or a verified rebuilt checkpoint when old content must be excluded.

Tool registry entries include transport, input/output schemas, effects, scopes, credential binding, allowed hosts, idempotency support, timeout, concurrency limit, output-size limit and sandbox requirements. Tool search does not grant execution rights. A tool with hidden documentation remains subject to the same gateway checks.

## Generation

```ts
interface GenerationAdapter {
  describe(): GenerationCapabilities;
  estimate(job: GenerationRequest): Promise<ResourceEstimate>;
  submit(job: GenerationRequest, idempotencyKey: string): Promise<JobRef>;
  events(job: JobRef): AsyncIterable<GenerationEvent>;
  cancel(job: JobRef): Promise<CancelReceipt>;
  artifacts(job: JobRef): Promise<ArtifactRef[]>;
}
```

Capabilities include text/image/audio/video/vector/3D where actually supported, edit/reference inputs, output formats, local hardware requirements, provider restrictions and reproducibility settings. Output checks validate file signature, nonzero size, dimensions/duration and required content, plus task-specific human/model review where useful. Record original references, transformations, model/weights, seed, workflow, node/plugin versions and rights/consent metadata when relevant. Generation completion does not authorize publication.

## Decisions

`DecisionRequest` carries a typed question set, bounded candidates, state digest, freshness/expiry, model binding, privacy scope and cost ceiling. `DecisionResult` carries selected IDs, distributions when available, calibration metadata, elapsed cost/latency and an abstain reason. Validation rejects extra/unknown executable targets, NaN/invalid distributions, expired state or incompatible schema versions.

A decision only proposes a branch. The effect gateway independently validates current grants, resource scope, input schemas and current state. For speculative multi-head inference, only the heads relevant to the selected branch are executable.

## Versioning and compatibility

Use explicit schema versions and migration tests for durable events, manifests, embeddings, parser outputs, model catalogs and native-agent session references. Event readers tolerate unknown optional fields but reject unknown mandatory semantics. Preserve old decoder versions or migrate snapshots before changing them. Invalidate derived caches when any semantic input changes. Never backfill a new confidence score without recording the model/calibration version that produced it.
