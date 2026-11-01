# Models and provider access

The harness should support any **compatible, authorized endpoint or installed agent through an adapter**. It cannot promise every model capability through one lowest-common-denominator API. Separate inference providers, agent runtimes, credentials, subscriptions, and execution environments. Select routes from measured task quality and explicit constraints; preserve native features where they matter.

This analysis combines focused source review at pinned local snapshots with selected official documentation checked on 2026-10-04. No inference benchmark, paid API call, model download, or credential probe was performed. Performance and quality rankings below are adoption hypotheses, not measured winners.

## Recommended boundaries

| Component | Owns | Does not own |
|---|---|---|
| Model registry | Stable model identity, revision, capabilities, provider routes, discovered availability | User authentication secrets or automatic trust |
| Credential broker | Scoped secret references, approved OAuth renewal, revocation, redacted health | Prompt content or task planning |
| Inference adapter | Request/stream translation, cancellation, usage, typed provider errors | Durable task state or policy overrides |
| Agent adapter | Native session lifecycle, tool events, resume/cancel, agent-specific skills | Authority beyond the granted task |
| Gateway | Deployment balancing, rate limits, retries, accounting | Semantic memory and team coordination |
| Decision service | Eligible route choice and escalation from measured outcomes | Granting permissions or changing entitlements |

The gateway separation is supported by [Bifrost's provider queues and plugin architecture](projects/ai-agents-proxy--bifrost.md) ([GitHub](https://github.com/maximhq/bifrost)) and [LiteLLM's routing/reliability composition](projects/ai-agents-proxy--litellm.md) ([GitHub](https://github.com/BerriAI/litellm)). Agent registry design is illustrated by [OpenDesign's shipped versus local definitions](projects/ai-gen--open-design.md) ([GitHub](https://github.com/nexu-io/open-design)).

## Connection modes and subscription use

| Mode | Registration and verification | Recommended handling |
|---|---|---|
| Local inference server | Explicit endpoint, protocol, engine/model revision, hardware, health and capabilities | Prefer loopback/private transport; add authentication before remote access |
| Provider API | Documented endpoint and user/org credential | Separate budgets, retention settings, quotas, and regional constraints |
| Official subscription integration | Provider-approved OAuth/session route and applicable account entitlement | Show quota state and route limitations independently from API billing |
| Installed coding agent | Safe executable discovery and versioned adapter contract | Retain native sessions; translate events without flattening all behavior into chat completion |
| Compatibility proxy | Explicitly selected adapter, authentication mode, upstream contract | Optional; require route-specific support/entitlement checks |

**OpenAI route note, checked 2026-10-04.** Sign in with ChatGPT supports eligible ChatGPT-plan OAuth usage, including Codex app-server over stdio with Responses inference. `model/list` may return a bundled catalog; only a successfully completed inference turn verifies access for that request. The app owns token renewal, process restart, and saved-thread resume. [Official app-server integration](https://developers.openai.com/siwc/token-sharing-open-source/codex-app-server).

The current preview requires `store:false` and `stream:true`. Image generation, audio/video input, upload/transcription APIs, hosted MCP, and file search are unsupported on this route. Local shell and MCP execution through supported function/custom tools are separate capabilities. [Official preview limitations](https://developers.openai.com/siwc/token-sharing-open-source/preview-limitations). Recheck these constraints when implementing the adapter.

[CLIProxyAPI](projects/ai-agents-proxy--cli-proxy-api.md) ([GitHub](https://github.com/router-for-me/CLIProxyAPI)) defaults its inspected Codex executor to a ChatGPT backend URL. That source observation is not evidence that the proxy is equivalent to the official route above. [OpenDesign's media readiness code](projects/ai-gen--open-design.md) ([GitHub](https://github.com/nexu-io/open-design)) also illustrates why agent OAuth readiness and media API readiness must remain separate.

For other providers, store a link and verification date for the supported subscription/authentication method. Never infer that a monthly chat subscription includes general API use, or that the absence of a known connector makes such use universally prohibited. Treat availability as unknown until documented or explicitly configured.

## Adapter contract

```text
ProviderRoute
  id, adapter_version, provider, endpoint_ref, transport
  credential_ref, auth_mode, entitlement_evidence, checked_at
  model_id, model_revision, tokenizer_id, context_limit
  capabilities: text / image_input / audio / video / tools / structured_output
  streaming_semantics, cancellation_semantics, session_semantics
  locality, region, data_policy, quota_state, observed_health

InferenceAttempt
  task_id, attempt_id, idempotency_key, route_id
  input_artifact_refs, skill_variant_ids, context_manifest
  deadline, input_budget, output_budget, monetary_budget
  emitted_items, tool_call_ids, usage_actual_or_estimated
  terminal_status, provider_request_id, error_class
```

Keep a provider-extension bag for native features with validation. Unsupported fields must produce an explicit error or an approved downgrade recorded in the trace. The protocol label “OpenAI-compatible” does not establish identical tool-call serialization, reasoning semantics, vision support, stop behavior, or token counts. Native reasoning state should remain opaque where appropriate and should not become shared memory by default.

## Discovery and health

1. Inventory explicit configurations and well-known executables without reading or copying credential files into logs.
2. Inspect version/help only through safe bounded probes; distinguish “present” from “authenticated.”
3. Query documented model/capability listings where allowed. Mark listings as advertised until a relevant capability has been exercised.
4. Run consent-compatible, low-cost conformance checks in a test workspace: streaming text, JSON schema, tool calls, cancellation, resume, context overflow, and recoverable errors.
5. Cache capability results by adapter/model/account configuration version and expire them. Disable unhealthy routes without deleting user configuration.

The known-adapter plus user-profile design in [OpenDesign](projects/ai-gen--open-design.md) ([GitHub](https://github.com/nexu-io/open-design)) is preferable to treating every discovered binary as a fully supported agent. Unknown installed tools can remain generic process tools with restricted permissions until an adapter is installed.

## Routing algorithm

First apply hard constraints: permission, entitlement, input sensitivity, modality, tool protocol, context fit, locality, deadline, and budget. Then rank eligible routes using task-conditioned success estimates and observed latency/cost. Keep equivalent-deployment load balancing separate from choosing a different model family.

```text
eligible = routes satisfying all hard constraints
for each route r:
    value(r) = P(acceptable_result | task_features, r, skill_variant) * task_value
               - expected_cost(r) - latency_penalty(r) - failure_recovery_cost(r)
choose an eligible route with calibrated uncertainty handling
execute; record outcome; escalate only when expected improvement exceeds added cost
```

This is a proposed decision policy, not a benchmarked algorithm from a listed repository. See [decisions](decisions.md) for JEV-like decision models, calibration, abstention, and value of information. Deterministic rules should enforce hard constraints; learned models may rank only within them.

Use [LiteLLM](projects/ai-agents-proxy--litellm.md) ([GitHub](https://github.com/BerriAI/litellm)) or [Bifrost](projects/ai-agents-proxy--bifrost.md) ([GitHub](https://github.com/maximhq/bifrost)) for infrastructure policies after application-level selection. A retry after emitted output or tool execution requires an explicit recovery state. Preserve attempt lineage and tool idempotency keys; do not silently repeat side effects on another provider.

## Local inference choices

| Candidate | Useful source evidence | Adoption decision |
|---|---|---|
| [Colibri report](projects/ai-model-run--colibri.md) · [GitHub](https://github.com/JustVugg/colibri) | Expert-store backend registry and context/output budget logic; described finite-choice scoring | Research adapter; measure actual storage/RAM/VRAM performance and semantic fidelity |
| [FreeToken report](projects/ai-model-run--freetoken.md) · [GitHub](https://github.com/FlashML-org/FreeToken) | Explicit MoE expert/KV memory partitioning with pre-allocation checks | Pilot on supported hardware; compare cold/warm and concurrent workloads |
| [RTK report](projects/ai-agents-proxy--rtk.md) · [GitHub](https://github.com/rtk-ai/rtk) | Recoverable command-output compression and custom-filter trust | Optional context-cost optimization, independent of inference engine |
| [OBLITERATUS report](projects/ai-model-edit--obliteratus.md) · [GitHub](https://github.com/elder-plinius/OBLITERATUS) | Experimental strategy registry and reversible model mutation convention | Outside the core harness; evaluate prompts/tools/skills before model intervention |

Also support already-installed compatible servers through the generic adapter. The local corpus is not an exhaustive inventory of all inference engines, and advertised large-model support does not demonstrate interactive latency on this user's hardware. Schedule GPU and CPU capacity explicitly; avoid simultaneous media generation and inference overcommitting the same device. Engine KV caches accelerate inference but are not the [memory system](memory.md).

## Acceptance criteria

The first release should demonstrate one local server, one provider API, and one supported installed-agent/subscription route end to end. A route passes only when cancellation, resumability where promised, tool-call integrity, redacted tracing, context-limit handling, budget enforcement, and unavailable-capability errors behave correctly. Measure task success, edit/test correctness, time to first useful output, p50/p95 total latency, cost per accepted task, fallback rate, and data egress. Use fixed task sets plus held-out tasks, report uncertainty, and compare against a simple single-model baseline.

Execution boundaries belong in [security](security.md); asynchronous media providers in [generation](generation.md); adapter and skill promotion in [evolution](evolution.md).

## October source refresh: routing remains a measured choice

The current [Pi/Jev example](projects/ai-agents--pi.md) ([source](https://github.com/earendil-works/pi)) still uses a 0.5 complexity cutoff and switches after the first successful edit. The source refresh supplies no new calibration or entitlement evidence. Keep provider availability, account authorization, selected model, context revision and routing reason in separate records; evaluate re-escalation and cache-miss cost before adopting this heuristic.

## Source refresh: 2026-10-28 - resource admission and credential identity

The [FreeToken review](projects/ai-model-run--freetoken.md) separates cache-budget arithmetic from allocation and rejects a minimum plan that cannot fit. Preserve measured baseline, units, revision and headroom in resource reservations; its best-effort readiness values can substitute zero for unavailable measurement, so expose those states separately. The [Colibri review](projects/ai-model-run--colibri.md) adds a model-management MCP wrapper whose detached installs survive the request and whose cancellation notifications are ignored. Such an adapter needs bounded admission, explicit install grants and durable job reconciliation; protocol-shaped progress alone does not prove cancellation enforcement.

The initial [Hanzo Engine review](analyses/unreviewed/ai-model-run--hanzo-engine.md) traces real embedding dispatch and prefix truncation/renormalization, but finds no batch cap in the inspected handler and an informational smoke script that can finish after HTTP or dimension failures. Require bounded items/bytes/concurrency, exact output cardinality, finite vectors, private-input logging controls and retrieval evaluation for shortened dimensions before adoption. No local engine or accelerator benchmark was run.

The [Glean TypeScript](projects/ai-agents-mem--glean-api-typescript.md), [Python](projects/ai-agents-mem--glean-api-python.md) and [Go](projects/ai-agents-mem--glean-api-go.md) contracts distinguish OAuth client identity from opaque spending identity and demonstrate that generated schemas can accept filters beyond their documented semantic subset. Keep identity domains separate and validate semantics inward. [MCP Server Cards](projects/ai-query--mcp-docs.md) remain advisory discovery; runtime capabilities and tools require live negotiation under the actual identity. The [MCP authorization-extension review](projects/ai-query--mcp-ext-auth.md) also separates machine credentials from enterprise delegation and limits IdP visibility to token issuance. These documentary/SDK observations do not establish provider entitlement, token revocation behavior or permission to forward credentials.

The [MentisDB review](projects/ai-agents-mem--mentisdb.md) shares a model session and limits each inference chunk to four texts, yet retains all output vectors. Account separately for per-call activation memory, total request output and queued callers. The [Agentmemory embedding guard](projects/ai-agents-mem--agentmemory.md) rejects wrong dimensions but does not establish finite values or exact batch cardinality; validate all three alongside model revision. Upstream memory measurements remain attributed observations until reproduced under our runtime and workload.

The [Open Design catalog review](projects/ai-gen--open-design.md) distinguishes account-specific remote models from shared presets and budgets one wait per refresh. That wait does not cancel the underlying request, and cached catalogs are not current entitlements. [FastMCP's credential-store review](projects/ai-query--fastmcp.md) supports non-destructive atomic replacement and narrowly bounded Windows retries, while leaving record validation, key collisions, crash durability and platform permissions as separate obligations. Refreshed session identity must update tool authorization independently of discovery metadata.

The [TypeScript MCP review](projects/ai-query--mcp-sdk-typescript.md) leaves legacy audience enforcement opt-in and refresh-scope policy with a provider callback. Configure exact audience checks, validate scopes against recorded grants and distinguish absent from explicitly empty scope responses. [Go MCP's token lifecycle](projects/ai-query--mcp-sdk-go.md) fixes request-context cancellation during refresh, but background ownership, concurrent authorization and duplicate registration still need explicit host policies. [Rust MCP's cancellation guard](projects/ai-query--mcp-sdk-rust.md) sends best-effort cancellation after handle creation; it does not prove remote termination or cover bootstrap discovery lifetime. [Python MCP's extension binding](projects/ai-query--mcp-sdk-python.md) requires a live connection but adds no independent effect authorization.

The [PageIndex review](projects/ai-agents-mem--pageindex.md) records cutoff answers as partial and refuses an unsupported native client route; preserve those explicit states alongside model and usage identity. [Contextrie's normalized judge scores](projects/ai-agents-mem--xx-2604-contextrie.md) and [Jevgrep's scoring bounds](projects/ai-query--jevgrep.md) constrain output shape, not relevance calibration. Evaluate thresholds against task outcomes and keep model ranking separate from permission, budget and completion decisions. All refreshed SDK observations refer to the exact report pins; moved checkouts remain separate pending deltas.

The [Obliteratus snapshot review](projects/ai-model-edit--obliteratus.md) separates admission estimates, live-object identity and verified restoration: a failed copy can leave a model invalid, and estimates do not reserve memory. [Reef's reconnect path](projects/ai-agents-mem--reef.md) retains the same process instead of replaying work, but relay queues and cleanup still need owned aggregate bounds. [GFlow's renewal review](projects/ai-query--gflow-cli.md) distinguishes recognized stale credentials from unknown verdicts and places verification after browser closure; local timeouts do not establish one end-to-end deadline or atomic credential view.

The [MCP Inspector review](projects/ai-query--mcp-inspector.md) reports credential presence separately from validity and exposes limits in clear counts, host-filter scope and error-message redaction. Require validated secret-store state, transactional scope receipts and log redaction independent of response shaping. [Agent Browser's key handling](projects/ai-query--agent-browser.md) correctly refuses malformed existing keys but still needs exclusive creation and platform-private permissions. Never infer authority from stored-token presence, proxy configuration or a normalized confidence score.

The [Lightpanda auth/catalog review](projects/ai-query--lightpanda-browser.md) separates atomic credential-file replacement from serialized updates and successful refresh from durable persistence. A stale models.dev catalog filtered by tool-call metadata remains advisory, with no proof of account entitlement or measured capability. Its headless WebMCP requestUserInteraction method invokes a callback directly; that call and page-provided read-only hints cannot authorize effects. Keep model discovery, credentials, page tools and host grants in separate records.

The [Gbrain review](projects/ai-agents-mem--gbrain.md) distinguishes generation-fenced embedding reuse from estimated or incomplete search-cost accounting. [RAGFlow's embedding path](projects/ai-agents-mem--ragflow.md) narrows overlong input and isolates failed items, but still needs exact output cardinality, explicit prefix coverage and one aggregate deadline. Missing usage is unknown, not zero cost. [Stagehand's cache client](projects/ai-query--stagehand.md) bounds request bytes and validates envelopes, yet cache-hit fields do not establish answer validity; its inspected extraction benchmark checks a minimum count and two exemplars rather than complete precision/recall. Keep saved-token hints and narrow fixture success separate from verified task outcomes.

## Additional scoped review references

These catalog associations provide navigation to scoped source reviews. Each report records its inspected revision, findings and exclusions; inclusion here does not establish a capability or an adoption decision.

- [claude-code](analyses/unreviewed/ai-agents--claude-code.md)
- [hanzo-cli](analyses/unreviewed/ai-agents--hanzo-cli.md)
- [hanzo-dev](analyses/unreviewed/ai-agents--hanzo-dev.md)
- [hanzo-hips](analyses/unreviewed/ai-agents--hanzo-hips.md)
- [hanzo-sdk-ts](analyses/unreviewed/ai-agents--hanzo-sdk-ts.md)
- [hanzo-sdk](analyses/unreviewed/ai-agents--hanzo-sdk.md)
- [harness2](analyses/unreviewed/ai-agents--harness2.md)
- [murage](analyses/unreviewed/ai-agents--murage.md)
- [openrig](analyses/unreviewed/ai-agents--openrig.md)
- [trellis](analyses/unreviewed/ai-agents--trellis.md)
- [yoagent](analyses/unreviewed/ai-agents--yoagent.md)
- [jantt](analyses/unreviewed/ai-gen--jantt.md)
- [deepinfer](analyses/unreviewed/ai-model-run--deepinfer.md)

<!-- coverage:start -->
## Project coverage

Every associated project has its own report. Source-reviewed associations reflect the inspected scope; screened associations derive from the input category and are not capability claims.

| Source | Report | Depth |
|---|---|---|
| [adk-go](https://github.com/google/adk-go) | [Report](projects/ai-agents--adk-go.md) | screened |
| [adk-js](https://github.com/google/adk-js) | [Report](projects/ai-agents--adk-js.md) | screened |
| [adk-python](https://github.com/google/adk-python) | [Report](projects/ai-agents--adk-python.md) | screened |
| [agencycli](https://github.com/chenhg5/agencycli) | [Report](projects/ai-agents--agencycli.md) | screened |
| [agent-framework.ms](https://github.com/microsoft/agent-framework) | [Report](projects/ai-agents--agent-framework.ms.md) | screened |
| [agent-manager](https://github.com/YoanWai/agent-manager) | [Report](projects/ai-agents--agent-manager.md) | screened |
| [agent-orchestrator](https://github.com/ComposioHQ/agent-orchestrator) | [Report](projects/ai-agents--agent-orchestrator.md) | source-reviewed |
| [agent-zero](https://github.com/agent0ai/agent-zero) | [Report](projects/ai-agents--agent-zero.md) | screened |
| [agentbehavior](https://github.com/braintrustdata/agentbehavior) | [Report](projects/ai-agents--agentbehavior.md) | screened |
| [agentfield](https://github.com/Agent-Field/agentfield) | [Report](projects/ai-agents--agentfield.md) | screened |
| [agentic-bug-hunter](https://github.com/Awarexone/Agentic-Bug-Hunter) | [Report](projects/ai-agents--agentic-bug-hunter.md) | screened |
| [agentic-stack](https://github.com/codejunkie99/agentic-stack) | [Report](projects/ai-agents--agentic-stack.md) | screened |
| [agents-cli](https://github.com/google/agents-cli) | [Report](projects/ai-agents--agents-cli.md) | screened |
| [agents-md.ijfw](https://github.com/FerroxLabs/agents-md) | [Report](projects/ai-agents--agents-md.ijfw.md) | screened |
| [agents-starter.cloudflare](https://github.com/cloudflare/agents-starter) | [Report](projects/ai-agents--agents-starter.cloudflare.md) | screened |
| [agentspan](https://github.com/agentspan-ai/agentspan) | [Report](projects/ai-agents--agentspan.md) | screened |
| [ai-sdk.vercel](https://github.com/vercel/ai) | [Report](projects/ai-agents--ai-sdk.vercel.md) | screened |
| [ai.cloudflare](https://github.com/cloudflare/ai) | [Report](projects/ai-agents--ai.cloudflare.md) | screened |
| [aider](https://github.com/Aider-AI/aider) | [Report](projects/ai-agents--aider.md) | screened |
| [antigravity-cli](https://github.com/google-antigravity/antigravity-cli) | [Report](projects/ai-agents--antigravity-cli.md) | screened |
| [antigravity-sdk-python](https://github.com/google-antigravity/antigravity-sdk-python) | [Report](projects/ai-agents--antigravity-sdk-python.md) | screened |
| [anton](https://github.com/mindsdb/anton) | [Report](projects/ai-agents--anton.md) | screened |
| [anything-llm](https://github.com/Mintplex-Labs/anything-llm) | [Report](projects/ai-agents--anything-llm.md) | screened |
| [apodex-frontier-agent](https://github.com/ApodexAI/FrontierAgent) | [Report](projects/ai-agents--apodex-frontier-agent.md) | screened |
| [astron-agent](https://github.com/iflytek/astron-agent) | [Report](projects/ai-agents--astron-agent.md) | screened |
| [atlas-os](https://github.com/lucapohl-angel/ATLAS_OS) | [Report](projects/ai-agents--atlas-os.md) | screened |
| [awesome-llm-apps](https://github.com/Shubhamsaboo/awesome-llm-apps) | [Report](projects/ai-agents--awesome-llm-apps.md) | screened |
| [ax](https://github.com/google/ax) | [Report](projects/ai-agents--ax.md) | screened |
| [bb](https://github.com/get-bb/bb) | [Report](projects/ai-agents--bb.md) | screened |
| [berd](https://github.com/block/berd) | [Report](projects/ai-agents--berd.md) | screened |
| [bleeding-ade](https://github.com/BleedingDev/bleeding-ade) | [Report](projects/ai-agents--bleeding-ade.md) | screened |
| [buzz](https://github.com/block/buzz) | [Report](projects/ai-agents--buzz.md) | screened |
| [camelai](https://github.com/qaml-ai/camelAI) | [Report](projects/ai-agents--camelai.md) | screened |
| [cezar](https://github.com/open-mercato/cezar) | [Report](projects/ai-agents--cezar.md) | screened |
| [claude.analysis.best.cn](https://github.com/claude-code-best/claude-code) | [Report](projects/ai-agents--claude.analysis.best.cn.md) | screened |
| [claude.dive-into-claude-code](https://github.com/VILA-Lab/Dive-into-Claude-Code) | [Report](projects/ai-agents--claude.dive-into-claude-code.md) | screened |
| [claude.fork.claurst](https://github.com/Kuberwastaken/claurst) | [Report](projects/ai-agents--claude.fork.claurst.md) | screened |
| [claude.fork.openclaude](https://github.com/Gitlawb/openclaude) | [Report](projects/ai-agents--claude.fork.openclaude.md) | screened |
| [claude.ruflo](https://github.com/ruvnet/ruflo) | [Report](projects/ai-agents--claude.ruflo.md) | screened |
| [cline](https://github.com/cline/cline) | [Report](projects/ai-agents--cline.md) | screened |
| [closedloop-ai](https://github.com/closedloop-ai/closedloop-ai) | [Report](projects/ai-agents--closedloop-ai.md) | screened |
| [cloudflare-os](https://github.com/cloudflare/cloudflare-os) | [Report](projects/ai-agents--cloudflare-os.md) | screened |
| [codeaf](https://github.com/Agent-Field/CodeAF) | [Report](projects/ai-agents--codeaf.md) | screened |
| [collab-public](https://github.com/collabs-inc/collab-public) | [Report](projects/ai-agents--collab-public.md) | screened |
| [continue](https://github.com/continuedev/continue) | [Report](projects/ai-agents--continue.md) | screened |
| [copilot-engine-sdk](https://github.com/github/copilot-engine-sdk) | [Report](projects/ai-agents--copilot-engine-sdk.md) | screened |
| [copilot-sdk](https://github.com/github/copilot-sdk) | [Report](projects/ai-agents--copilot-sdk.md) | source-reviewed |
| [data-formulator](https://github.com/microsoft/data-formulator) | [Report](projects/ai-agents--data-formulator.md) | screened |
| [deepcode](https://github.com/HKUDS/DeepCode) | [Report](projects/ai-agents--deepcode.md) | screened |
| [deepscientist](https://github.com/ResearAI/DeepScientist) | [Report](projects/ai-agents--deepscientist.md) | screened |
| [deepseek-harness](https://github.com/deepseek-ai/deepseek-harness) | [Report](projects/ai-agents--deepseek-harness.md) | screened |
| [deepseek-tui](https://github.com/Hmbown/DeepSeek-TUI) | [Report](projects/ai-agents--deepseek-tui.md) | screened |
| [deeptutor](https://github.com/HKUDS/DeepTutor) | [Report](projects/ai-agents--deeptutor.md) | screened |
| [deer-flow](https://github.com/bytedance/deer-flow) | [Report](projects/ai-agents--deer-flow.md) | screened |
| [dify](https://github.com/langgenius/dify) | [Report](projects/ai-agents--dify.md) | screened |
| [dspy](https://github.com/stanfordnlp/dspy) | [Report](projects/ai-agents--dspy.md) | source-reviewed |
| [electric](https://github.com/electric-sql/electric) | [Report](projects/ai-agents--electric.md) | screened |
| [enzo](https://github.com/theguysudo/ENZO) | [Report](projects/ai-agents--enzo.md) | screened |
| [eve](https://github.com/vercel/eve) | [Report](projects/ai-agents--eve.md) | screened |
| [ferrox-factory](https://github.com/FerroxLabs/ferrox-factory) | [Report](projects/ai-agents--ferrox-factory.md) | screened |
| [feynman](https://github.com/getcompanion-ai/feynman) | [Report](projects/ai-agents--feynman.md) | screened |
| [flue](https://github.com/withastro/flue) | [Report](projects/ai-agents--flue.md) | screened |
| [foreman](https://github.com/thruwire/foreman) | [Report](projects/ai-agents--foreman.md) | screened |
| [forgecode](https://github.com/antinomyhq/forgecode) | [Report](projects/ai-agents--forgecode.md) | screened |
| [frankclaw](https://github.com/akitaonrails/FrankClaw) | [Report](projects/ai-agents--frankclaw.md) | screened |
| [fuigo](https://github.com/FerroxLabs/fuigo) | [Report](projects/ai-agents--fuigo.md) | screened |
| [future-agi](https://github.com/future-agi/future-agi) | [Report](projects/ai-agents--future-agi.md) | screened |
| [fx](https://github.com/vercel-labs/fx) | [Report](projects/ai-agents--fx.md) | screened |
| [gastown](https://github.com/gastownhall/gastown) | [Report](projects/ai-agents--gastown.md) | screened |
| [gatebench](https://github.com/FerroxLabs/gatebench) | [Report](projects/ai-agents--gatebench.md) | screened |
| [gemini-cli](https://github.com/google-gemini/gemini-cli) | [Report](projects/ai-agents--gemini-cli.md) | screened |
| [genaiscript](https://github.com/microsoft/genaiscript) | [Report](projects/ai-agents--genaiscript.md) | screened |
| [gitagent](https://github.com/open-gitagent/gitagent) | [Report](projects/ai-agents--gitagent.md) | screened |
| [glados](https://github.com/dnhkng/GLaDOS) | [Report](projects/ai-agents--glados.md) | screened |
| [gods-eye-view](https://github.com/bilawalsidhu/gods-eye-view) | [Report](projects/ai-agents--gods-eye-view.md) | screened |
| [grok-build](https://github.com/xai-org/grok-build) | [Report](projects/ai-agents--grok-build.md) | screened |
| [gstack.claude.garrytan](https://github.com/garrytan/gstack) | [Report](projects/ai-agents--gstack.claude.garrytan.md) | screened |
| [halo](https://github.com/context-labs/halo) | [Report](projects/ai-agents--halo.md) | screened |
| [harnessrouter](https://github.com/HarnessRouter/harnessrouter) | [Report](projects/ai-agents--harnessrouter.md) | screened |
| [hello-agents](https://github.com/datawhalechina/hello-agents) | [Report](projects/ai-agents--hello-agents.md) | screened |
| [hermes-desktop](https://github.com/fathah/hermes-desktop) | [Report](projects/ai-agents--hermes-desktop.md) | screened |
| [holaos](https://github.com/holaboss-ai/holaOS) | [Report](projects/ai-agents--holaos.md) | screened |
| [hydra](https://github.com/timtimeshock/Hydra) | [Report](projects/ai-agents--hydra.md) | screened |
| [ijfw](https://github.com/FerroxLabs/ijfw) | [Report](projects/ai-agents--ijfw.md) | screened |
| [jan](https://github.com/janhq/jan) | [Report](projects/ai-agents--jan.md) | screened |
| [khoj](https://github.com/khoj-ai/khoj) | [Report](projects/ai-agents--khoj.md) | screened |
| [kilocode](https://github.com/Kilo-Org/kilocode) | [Report](projects/ai-agents--kilocode.md) | screened |
| [kimi-code](https://github.com/MoonshotAI/kimi-code) | [Report](projects/ai-agents--kimi-code.md) | screened |
| [langsmith-sdk](https://github.com/langchain-ai/langsmith-sdk) | [Report](projects/ai-agents--langsmith-sdk.md) | screened |
| [learn-harness-engineering](https://github.com/walkinglabs/learn-harness-engineering) | [Report](projects/ai-agents--learn-harness-engineering.md) | screened |
| [loopx](https://github.com/huangruiteng/loopx) | [Report](projects/ai-agents--loopx.md) | screened |
| [mateclaw](https://github.com/mateaix/mateclaw) | [Report](projects/ai-agents--mateclaw.md) | screened |
| [meetily](https://github.com/Zackriya-Solutions/meetily) | [Report](projects/ai-agents--meetily.md) | screened |
| [mercury-agent](https://github.com/cosmicstack-labs/mercury-agent) | [Report](projects/ai-agents--mercury-agent.md) | screened |
| [metaharness.tools](https://github.com/nrwl/metaharness.tools) | [Report](projects/ai-agents--metaharness.tools.md) | screened |
| [mini-swe-agent](https://github.com/SWE-agent/mini-swe-agent) | [Report](projects/ai-agents--mini-swe-agent.md) | source-reviewed |
| [mission-control](https://github.com/builderz-labs/mission-control) | [Report](projects/ai-agents--mission-control.md) | screened |
| [mlflow](https://github.com/mlflow/mlflow) | [Report](projects/ai-agents--mlflow.md) | screened |
| [mmx-cli](https://github.com/MiniMax-AI/cli) | [Report](projects/ai-agents--mmx-cli.md) | screened |
| [nanochat](https://github.com/karpathy/nanochat) | [Report](projects/ai-agents--nanochat.md) | screened |
| [nvidia-nemo-labs-molt](https://github.com/NVIDIA-NeMo/labs-molt) | [Report](projects/ai-agents--nvidia-nemo-labs-molt.md) | screened |
| [nvidia-oo-agents](https://github.com/nvidia-nemo/labs-OO-Agents) | [Report](projects/ai-agents--nvidia-oo-agents.md) | screened |
| [odysseus](https://github.com/pewdiepie-archdaemon/odysseus) | [Report](projects/ai-agents--odysseus.md) | screened |
| [oh-my-openagent](https://github.com/code-yeongyu/oh-my-openagent) | [Report](projects/ai-agents--oh-my-openagent.md) | screened |
| [oh-my-pi](https://github.com/can1357/oh-my-pi) | [Report](projects/ai-agents--oh-my-pi.md) | screened |
| [omnigent](https://github.com/omnigent-ai/omnigent) | [Report](projects/ai-agents--omnigent.md) | screened |
| [onyx](https://github.com/onyx-dot-app/onyx) | [Report](projects/ai-agents--onyx.md) | screened |
| [open-agents](https://github.com/vercel-labs/open-agents) | [Report](projects/ai-agents--open-agents.md) | screened |
| [open-code-review.alibaba](https://github.com/alibaba/open-code-review) | [Report](projects/ai-agents--open-code-review.alibaba.md) | screened |
| [open-code-review.spencermarx](https://github.com/spencermarx/open-code-review) | [Report](projects/ai-agents--open-code-review.spencermarx.md) | screened |
| [open-codesign](https://github.com/OpenCoworkAI/open-codesign) | [Report](projects/ai-agents--open-codesign.md) | screened |
| [open-multi-agent](https://github.com/JackChen-me/open-multi-agent) | [Report](projects/ai-agents--open-multi-agent.md) | screened |
| [openai-agents-js](https://github.com/openai/openai-agents-js) | [Report](projects/ai-agents--openai-agents-js.md) | screened |
| [openai-agents-python](https://github.com/openai/openai-agents-python) | [Report](projects/ai-agents--openai-agents-python.md) | screened |
| [openbot](https://github.com/CopilotKit/openbot) | [Report](projects/ai-agents--openbot.md) | screened |
| [openclaude](https://github.com/Gitlawb/openclaude) | [Report](projects/ai-agents--openclaude.md) | screened |
| [opencode](https://github.com/anomalyco/opencode) | [Report](projects/ai-agents--opencode.md) | source-reviewed |
| [openfang](https://github.com/RightNow-AI/openfang) | [Report](projects/ai-agents--openfang.md) | screened |
| [openfugu](https://github.com/trotsky1997/OpenFugu) | [Report](projects/ai-agents--openfugu.md) | screened |
| [openharness](https://github.com/HKUDS/OpenHarness) | [Report](projects/ai-agents--openharness.md) | screened |
| [openhuman](https://github.com/tinyhumansai/openhuman) | [Report](projects/ai-agents--openhuman.md) | screened |
| [openinterpreter](https://github.com/openinterpreter/openinterpreter) | [Report](projects/ai-agents--openinterpreter.md) | screened |
| [openmausbot](https://github.com/milind-soni/OpenMausBot) | [Report](projects/ai-agents--openmausbot.md) | screened |
| [openrouter-spawn](https://github.com/OpenRouterTeam/spawn) | [Report](projects/ai-agents--openrouter-spawn.md) | screened |
| [opensage-adk](https://github.com/opensage-agent/opensage-adk) | [Report](projects/ai-agents--opensage-adk.md) | screened |
| [orchard](https://github.com/microsoft/Orchard) | [Report](projects/ai-agents--orchard.md) | screened |
| [paperclip](https://github.com/paperclipai/paperclip) | [Report](projects/ai-agents--paperclip.md) | source-reviewed |
| [paseo](https://github.com/getpaseo/paseo) | [Report](projects/ai-agents--paseo.md) | source-reviewed |
| [pentagi](https://github.com/vxcontrol/pentagi) | [Report](projects/ai-agents--pentagi.md) | screened |
| [pi](https://github.com/earendil-works/pi) | [Report](projects/ai-agents--pi.md) | source-reviewed |
| [pi-desktop](https://github.com/vastsa/PI-Desktop) | [Report](projects/ai-agents--pi-desktop.md) | screened |
| [picoclaw](https://github.com/sipeed/picoclaw) | [Report](projects/ai-agents--picoclaw.md) | screened |
| [pipali](https://github.com/khoj-ai/pipali) | [Report](projects/ai-agents--pipali.md) | screened |
| [prime-agent](https://github.com/PrimeIntellect-ai/prime-agent) | [Report](projects/ai-agents--prime-agent.md) | screened |
| [prometheus](https://github.com/EuniAI/Prometheus) | [Report](projects/ai-agents--prometheus.md) | screened |
| [promptise-foundry](https://github.com/promptise-com/foundry) | [Report](projects/ai-agents--promptise-foundry.md) | screened |
| [qm](https://github.com/yc-software/qm) | [Report](projects/ai-agents--qm.md) | screened |
| [reframe](https://github.com/resultkitchen/reframe) | [Report](projects/ai-agents--reframe.md) | screened |
| [rlm-code](https://github.com/SuperagenticAI/rlm-code) | [Report](projects/ai-agents--rlm-code.md) | screened |
| [rsclaw](https://github.com/rsclaw-ai/rsclaw) | [Report](projects/ai-agents--rsclaw.md) | screened |
| [sage](https://github.com/ZHangZHengEric/Sage) | [Report](projects/ai-agents--sage.md) | screened |
| [skillsync-txcript](https://github.com/skillsynchq/txcript) | [Report](projects/ai-agents--skillsync-txcript.md) | screened |
| [terminal-bench](https://github.com/harbor-framework/terminal-bench) | [Report](projects/ai-agents--terminal-bench.md) | screened |
| [terminus-kira](https://github.com/krafton-ai/kira) | [Report](projects/ai-agents--terminus-kira.md) | screened |
| [typesafe-sdk-js](https://github.com/typesafe-ai/typesafe-sdk-js) | [Report](projects/ai-agents--typesafe-sdk-js.md) | source-reviewed |
| [voltagent](https://github.com/VoltAgent/voltagent) | [Report](projects/ai-agents--voltagent.md) | screened |
| [warp](https://github.com/warpdotdev/warp) | [Report](projects/ai-agents--warp.md) | screened |
| [wayland](https://github.com/FerroxLabs/wayland) | [Report](projects/ai-agents--wayland.md) | screened |
| [wayland-core](https://github.com/FerroxLabs/wayland-core) | [Report](projects/ai-agents--wayland-core.md) | screened |
| [world-model-optimizer](https://github.com/experientiallabs/world-model-optimizer) | [Report](projects/ai-agents--world-model-optimizer.md) | screened |
| [xx-2602-py-gpt](https://github.com/szczyglis-dev/py-gpt) | [Report](projects/ai-agents--xx-2602-py-gpt.md) | screened |
| [xx-2603-autoresearch.karpathy](https://github.com/karpathy/autoresearch) | [Report](projects/ai-agents--xx-2603-autoresearch.karpathy.md) | screened |
| [xx-2603-pepagi](https://github.com/Promptlab37/PEPAGI) | [Report](projects/ai-agents--xx-2603-pepagi.md) | screened |
| [xx-2603-sudocode](https://github.com/sudocode-ai/sudocode) | [Report](projects/ai-agents--xx-2603-sudocode.md) | screened |
| [xx-2603-superturtle](https://github.com/Rigos0/superturtle) | [Report](projects/ai-agents--xx-2603-superturtle.md) | screened |
| [xx-2604-claude.fork.claw-code](https://github.com/ultraworkers/claw-code-parity) | [Report](projects/ai-agents--xx-2604-claude.fork.claw-code.md) | screened |
| [xx-2604-claude.source.2-1-88.2026-03-31](https://github.com/chatgptprojects/claude-code) | [Report](projects/ai-agents--xx-2604-claude.source.2-1-88.2026-03-31.md) | screened |
| [xx-2604-frosty-snowflake](https://github.com/Gyrus-Dev/frosty) | [Report](projects/ai-agents--xx-2604-frosty-snowflake.md) | screened |
| [xx-2604-spawn-agent](https://github.com/millionco/spawn-agent) | [Report](projects/ai-agents--xx-2604-spawn-agent.md) | screened |
| [xx-2609-kimi-cli](https://github.com/MoonshotAI/kimi-cli) | [Report](projects/ai-agents--xx-2609-kimi-cli.md) | screened |
| [xyops](https://github.com/pixlcore/xyops) | [Report](projects/ai-agents--xyops.md) | screened |
| [zcode](https://github.com/zai-org/ZCode) | [Report](projects/ai-agents--zcode.md) | screened |
| [zero](https://github.com/Gitlawb/zero) | [Report](projects/ai-agents--zero.md) | screened |
| [zeroclaw](https://github.com/zeroclaw-labs/zeroclaw) | [Report](projects/ai-agents--zeroclaw.md) | screened |
| [zz-2607-agentmark](https://github.com/iki/zz-2607-agentmark) | [Report](projects/ai-agents--zz-2607-agentmark.md) | screened |
| [context-mode](https://github.com/mksglu/context-mode) | [Report](projects/ai-agents-mem--context-mode.md) | source-reviewed |
| [graphrag](https://github.com/microsoft/graphrag) | [Report](projects/ai-agents-mem--graphrag.md) | source-reviewed |
| [lightrag](https://github.com/HKUDS/LightRAG) | [Report](projects/ai-agents-mem--lightrag.md) | source-reviewed |
| [open-viking](https://github.com/volcengine/OpenViking) | [Report](projects/ai-agents-mem--open-viking.md) | source-reviewed |
| [anex](https://github.com/anex-sh/anex) | [Report](projects/ai-agents-proxy--anex.md) | screened |
| [bifrost](https://github.com/maximhq/bifrost) | [Report](projects/ai-agents-proxy--bifrost.md) | source-reviewed |
| [cli-proxy-api](https://github.com/router-for-me/CLIProxyAPI) | [Report](projects/ai-agents-proxy--cli-proxy-api.md) | source-reviewed |
| [cockpit-tools](https://github.com/jlcodes99/cockpit-tools) | [Report](projects/ai-agents-proxy--cockpit-tools.md) | screened |
| [codexsaver](https://github.com/fendouai/CodexSaver) | [Report](projects/ai-agents-proxy--codexsaver.md) | screened |
| [litellm](https://github.com/BerriAI/litellm) | [Report](projects/ai-agents-proxy--litellm.md) | source-reviewed |
| [llm-observer-proxy-go](https://github.com/xxyyue/llm-observer-proxy-go) | [Report](projects/ai-agents-proxy--llm-observer-proxy-go.md) | screened |
| [openrouter-ai-sdk-provider](https://github.com/OpenRouterTeam/ai-sdk-provider) | [Report](projects/ai-agents-proxy--openrouter-ai-sdk-provider.md) | screened |
| [openrouter-go-sdk](https://github.com/OpenRouterTeam/go-sdk) | [Report](projects/ai-agents-proxy--openrouter-go-sdk.md) | screened |
| [openrouter-python-sdk](https://github.com/OpenRouterTeam/python-sdk) | [Report](projects/ai-agents-proxy--openrouter-python-sdk.md) | screened |
| [openrouter-typescript-sdk](https://github.com/OpenRouterTeam/typescript-sdk) | [Report](projects/ai-agents-proxy--openrouter-typescript-sdk.md) | screened |
| [proxypilot-win](https://github.com/Finesssee/ProxyPilot) | [Report](projects/ai-agents-proxy--proxypilot-win.md) | screened |
| [rtk](https://github.com/rtk-ai/rtk) | [Report](projects/ai-agents-proxy--rtk.md) | source-reviewed |
| [switchyard](https://github.com/NVIDIA-NeMo/Switchyard) | [Report](projects/ai-agents-proxy--switchyard.md) | screened |
| [anthropic-sandbox-runtime](https://github.com/anthropic-experimental/sandbox-runtime) | [Report](projects/ai-agents-sandbox--anthropic-sandbox-runtime.md) | source-reviewed |
| [opensandbox](https://github.com/alibaba/OpenSandbox) | [Report](projects/ai-agents-sandbox--opensandbox.md) | source-reviewed |
| [cc-aio-mon](https://github.com/iM3SK/cc-aio-mon) | [Report](projects/ai-agents-tokens--cc-aio-mon.md) | screened |
| [ccusage](https://github.com/ryoppippi/ccusage) | [Report](projects/ai-agents-tokens--ccusage.md) | source-reviewed |
| [claude-powerline](https://github.com/Owloops/claude-powerline) | [Report](projects/ai-agents-tokens--claude-powerline.md) | screened |
| [codeburn](https://github.com/getagentseal/codeburn) | [Report](projects/ai-agents-tokens--codeburn.md) | source-reviewed |
| [codexbar-win](https://github.com/nesszer/Win-CodexBar) | [Report](projects/ai-agents-tokens--codexbar-win.md) | screened |
| [tokenu](https://github.com/lirantal/tokenu) | [Report](projects/ai-agents-tokens--tokenu.md) | screened |
| [xx-2604-rimuru](https://github.com/rohitg00/rimuru) | [Report](projects/ai-agents-tokens--xx-2604-rimuru.md) | screened |
| [xx-2604-tokuin](https://github.com/nooscraft/tokuin) | [Report](projects/ai-agents-tokens--xx-2604-tokuin.md) | screened |
| [frontier-harness-eval](https://github.com/frontier-harness-eval/eval) | [Report](projects/ai-eval--frontier-harness-eval.md) | source-reviewed |
| [open-design](https://github.com/nexu-io/open-design) | [Report](projects/ai-gen--open-design.md) | source-reviewed |
| [rearchitecting-llms](https://github.com/peremartra/Rearchitecting-LLMs) | [Report](projects/ai-info--rearchitecting-llms.md) | source-reviewed |
| [voicestudio](https://github.com/debpalash/VoiceStudio) | [Report](projects/ai-media--voicestudio.md) | source-reviewed |
| [yue](https://github.com/multimodal-art-projection/YuE) | [Report](projects/ai-media--yue.md) | source-reviewed |
| [obliteratus](https://github.com/elder-plinius/OBLITERATUS) | [Report](projects/ai-model-edit--obliteratus.md) | source-reviewed |
| [colibri](https://github.com/JustVugg/colibri) | [Report](projects/ai-model-run--colibri.md) | source-reviewed |
| [freetoken](https://github.com/FlashML-org/FreeToken) | [Report](projects/ai-model-run--freetoken.md) | source-reviewed |
| [xx-2604-agent-opt](https://github.com/future-agi/agent-opt) | [Report](projects/ai-prompts--xx-2604-agent-opt.md) | source-reviewed |
| [docling](https://github.com/docling-project/docling) | [Report](projects/ai-query--docling.md) | source-reviewed |
| [jev-ultrafast](https://github.com/browser-use/jev-ultrafast) | [Report](projects/ai-query--jev-ultrafast.md) | source-reviewed |
| [jevgrep](https://github.com/dzhng/jevgrep) | [Report](projects/ai-query--jevgrep.md) | source-reviewed |
| [leann](https://github.com/yichuan-w/LEANN) | [Report](projects/ai-query--leann.md) | source-reviewed |
| [magika](https://github.com/google/magika) | [Report](projects/ai-query--magika.md) | source-reviewed |
| [qmd](https://github.com/tobi/qmd) | [Report](projects/ai-query--qmd.md) | source-reviewed |
| [rag-anything](https://github.com/HKUDS/RAG-Anything) | [Report](projects/ai-query--rag-anything.md) | source-reviewed |
<!-- coverage:end -->


## Source refresh: 2026-10-27 — readiness evidence and provider jobs

The [Emdash review](analyses/unreviewed/ai-agents--emdash.md) ([source](https://github.com/generalaction/emdash)) demonstrates why credential presence, authenticated identity, model access and account data policy need separate fields: its inspected helper can report authentication from an environment value alone. Passive catalogs must disclose the evidence level; an explicit diagnostic may verify only the capabilities its actual request exercised. Neither subscription presence nor an API key establishes training exclusion.

The [Pi refresh](projects/ai-agents--pi.md) ([source](https://github.com/earendil-works/pi)) preserves a deferred response handle when a poll is interrupted, while ordinary request retry and clean-close behavior remain distinct. Model routing should retain provider/model identity, attempt policy and recoverable job identity rather than silently resubmit work. The [Paseo refresh](projects/ai-agents--paseo.md) ([source](https://github.com/getpaseo/paseo)) also distinguishes provider-specific background-work evidence from a baseline-only fallback. None of these source reviews changes Teamagent's media training gate, free/paid model choice or prohibition on blindly retrying ambiguous provider actions.

## Follow-up source review: 2026-10-28 — route evidence and composed runs

Discovery, authentication, entitlement and data policy remain independent. [Helix Foundry](https://github.com/helixdb/helix-foundry) ([review](analyses/unreviewed/ai-agents-mem--helix-foundry.md#follow-up-change-review--2026-10-28)) bounds provider discovery but can still select a configured key after authentication failure; such a result is discovered and unready, not a usable default. [Graphiti](https://github.com/getzep/graphiti) ([review](projects/ai-agents-mem--graphiti.md#follow-up-change-review--2026-10-28)) changes source-maintained model names/limits without independently establishing current service support. The generated [OpenRouter Go](https://github.com/OpenRouterTeam/go-sdk) ([review](projects/ai-agents-proxy--openrouter-go-sdk.md#follow-up-change-review--2026-10-28)), [Python](https://github.com/OpenRouterTeam/python-sdk) ([review](projects/ai-agents-proxy--openrouter-python-sdk.md#follow-up-change-review--2026-10-28)) and [TypeScript](https://github.com/OpenRouterTeam/typescript-sdk) ([review](projects/ai-agents-proxy--openrouter-typescript-sdk.md#follow-up-change-review--2026-10-28)) schemas add provider option shapes, not permission or non-training evidence. Apply the mandatory account/model/operation/host policy gate before ranking, explicitly constrain provider fallback, and keep unknown routes blocked. A generated cache-preservation comment is not measured service behavior.

[Bifrost](https://github.com/maximhq/bifrost) ([review](projects/ai-agents-proxy--bifrost.md#follow-up-change-review--2026-10-28)) fences tool-list refresh to both connection object and generation, including notifications arriving during discovery. Carry equivalent generation identity through dynamic capability catalogs; discovery never grants execution authority. [LiteLLM](https://github.com/BerriAI/litellm) ([review](projects/ai-agents-proxy--litellm.md#follow-up-change-review--2026-10-28)) composes multiple MCP/model rounds into one public lifecycle while retaining output offsets, final continuation identity and round billing hooks. Preserve those lower-level receipts and usage even when the client sees one run. Require scoped close/cancellation and billing reconciliation; a destructor is only a fallback. [Switchyard](https://github.com/NVIDIA-NeMo/Switchyard) ([review](projects/ai-agents-proxy--switchyard.md#follow-up-change-review--2026-10-28)) makes reasoning replay policy explicit: encrypted or stored continuation belongs to a compatible provider context, not universally portable conversation content.

Local model resources need the same recovery rigor as hosted jobs. [OBLITERATUS](https://github.com/elder-plinius/OBLITERATUS) ([review](projects/ai-model-edit--obliteratus.md#follow-up-change-review--2026-10-28)) verifies candidate/layout receipts, regular files, bytes and tensor headers before restored shards are reused; candidate identity still depends on a trusted live-weight attestation. [FreeToken](https://github.com/FlashML-org/FreeToken) ([review](projects/ai-model-run--freetoken.md#follow-up-change-review--2026-10-28)) returns speculative tail pages only after committed-token boundaries are known and producing device work has drained. Separate reproducible artifact integrity and resource ownership from model quality, throughput or permission to activate the result.

[ccusage](https://github.com/ryoppippi/ccusage) ([review](projects/ai-agents-tokens--ccusage.md#follow-up-change-review--2026-10-28)) separates report compilation and reads a locked pricing URL; neither change validates the prices. [CodexBar Win](https://github.com/nesszer/Win-CodexBar) ([review](projects/ai-agents-tokens--codexbar-win.md#follow-up-change-review--2026-10-28)) improves estimated/unknown usage display without changing collection, and [cc-aio-mon](https://github.com/iM3SK/cc-aio-mon) ([review](projects/ai-agents-tokens--cc-aio-mon.md#follow-up-change-review--2026-10-28)) changes only a security-workflow dependency in this interval. Retain dated pricing provenance and disclose estimated or missing usage. These static reviews do not extend any provider approval or demonstrate a live call; the LiteLLM and Go SDK aggregate diffs were capped, with scoped complete file reads recorded in their reports.

## Source refresh: 2026-11-01 — eligibility, inference and accounting

Apply hard account/host/operation/model admission before scoring and again before
upload. The generated [OpenRouter Go](https://github.com/OpenRouterTeam/go-sdk)
([review](projects/ai-agents-proxy--openrouter-go-sdk.md)),
[Python](https://github.com/OpenRouterTeam/python-sdk)
([review](projects/ai-agents-proxy--openrouter-python-sdk.md)) and
[TypeScript](https://github.com/OpenRouterTeam/typescript-sdk)
([review](projects/ai-agents-proxy--openrouter-typescript-sdk.md)) shapes do not
make a routing preference a hard allowlist. Keep omission, explicit values,
fallback and semantic limits visible. [Experiential](https://github.com/experientiallabs/experiential)
([review](analyses/unreviewed/ai-agents-proxy--experiential.md)) and
[Switchyard](https://github.com/NVIDIA-NeMo/Switchyard)
([review](projects/ai-agents-proxy--switchyard.md)) motivate separate policy,
feature, pricing and evaluation fingerprints, with calibrated score meanings;
schema acceptance alone does not establish routing benefit. No candidate changes
the implemented [non-training default](media-training.md).

Local inference needs effective resource and capability evidence.
[Colibri](https://github.com/JustVugg/colibri)
([review](projects/ai-model-run--colibri.md)) distinguishes supplied-digest checks
from size-only completeness across split storage. [FreeToken](https://github.com/FlashML-org/FreeToken)
([review](projects/ai-model-run--freetoken.md)) rejects unsupported completion
options before dispatch. [YuE](https://github.com/multimodal-art-projection/YuE)
([review](projects/ai-media--yue.md)), [Jan](https://github.com/janhq/jan)
([review](projects/ai-agents--jan.md)) and [OBLITERATUS](https://github.com/elder-plinius/OBLITERATUS)
([review](projects/ai-model-edit--obliteratus.md)) reinforce device identity,
actual implementation coverage and unknown resource estimates. Allocation-bearing
probes must not become passive list behavior. [Edge0](https://github.com/edge0-ai/edge0)
([review](analyses/unreviewed/ai-model-run--edge0.md)) is a model-specific MoE
prerouting candidate: matching staged experts to predicted routing is distinct
from preserving the original model's choices or answer quality.

Keep accounting provenance separate from authority. [ccusage](https://github.com/ryoppippi/ccusage)
([review](projects/ai-agents-tokens--ccusage.md)) carries service-tier and merge
precedence, [CodexBar Win](https://github.com/nesszer/Win-CodexBar)
([review](projects/ai-agents-tokens--codexbar-win.md)) retains quota-window
denominators, and [RTK](https://github.com/rtk-ai/rtk)
([review](projects/ai-agents-proxy--rtk.md)) compares compression against the same
requested window. None establishes provider billing, entitlement or quality.
These are scoped source findings; no new model/provider or hardware benchmark
was executed and no new inference backend was integrated.

### Additional scoped reviews from November 1

These newly reviewed sources complement the themes above. Each report states its selected source scope and limitations; listing it does not imply runtime integration or comparative quality.

- [cindy](https://github.com/makecindy/cindy) ([scoped report](analyses/unreviewed/ai-agents--cindy.md)).
- [oh-my-hermes](https://github.com/rlaope/oh-my-hermes) ([scoped report](analyses/unreviewed/ai-agents--oh-my-hermes.md)).
- [thinkrail](https://github.com/jetbrains/thinkrail) ([scoped report](analyses/unreviewed/ai-agents--thinkrail.md)).
- [diffmap](https://github.com/tanishqkancharla/diffmap) ([scoped report](analyses/unreviewed/ai-gen--diffmap.md)).
- [yue2-studio](https://github.com/timoncool/yue2-studio) ([scoped report](analyses/unreviewed/ai-gen--yue2-studio.md)).
