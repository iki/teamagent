# Jev-like decisions and deterministic control

[Home](README.md) · [Models](models.md) · [Skills](skills.md) · [Evaluation](evaluation.md)

## Meaning of “Jev-like”

Use a model to answer bounded typed questions about observed state; execute the chosen branch in ordinary code. TypeSafe describes Jev's Choice, Score and Noul primitives, including distributions/confidence for some outputs. Its fan-out pattern asks several independent questions against one shared state and ignores answers irrelevant to the selected branch. These are provider-described capabilities, not evidence that every probability is calibrated on our tasks. [TypeSafe introduction](https://docs.typesafe.ai/introduction), [fan-out pattern](https://docs.typesafe.ai/patterns/fan-out).

The inspected [TypeSafe SDK](https://github.com/typesafe-ai/typesafe-sdk-js) ([review](projects/ai-agents--typesafe-sdk-js.md)), [Jev Ultrafast](https://github.com/browser-use/jev-ultrafast) ([review](projects/ai-query--jev-ultrafast.md)) and [Jevgrep](https://github.com/dzhng/jevgrep) ([review](projects/ai-query--jevgrep.md)) make this concrete. Jev is not a generic term for embeddings or a substitute for every reasoning task. Local classifiers, cross-encoders and constrained-output models may implement a comparable decision contract, but must be evaluated separately.

## Where the pattern fits

| Decision | Candidate set / state | Executor and fallback |
|---|---|---|
| Task routing | Eligible agent/model pairs, goal, modalities, privacy, budget | Deterministic eligibility first; select among feasible options; fallback to configured reliable agent |
| Retrieval depth | Exact/lexical/hybrid/rerank/graph/no retrieval | Bounded cost ladder; expand when insufficient evidence |
| Skill selection | Retrieved compatible skill IDs + trigger descriptions | Load only selected pinned variants; abstain on uncertainty |
| Importer selection | MIME/magic bytes, language, document features | Deterministic file-type filter, then specialized converter; retry alternate on extraction failure |
| Memory candidate classification | Evidence, source trust, novelty, contradiction, retention policy | Propose a memory operation; deterministic schema/ACL/provenance gate commits it |
| Browser action | Fresh indexed elements and legal operations | Check state hash, target validity and policy before action |
| Progress triage | Task objective, recent trace, checks and resource use | Suggest retry/replan/escalate; deterministic retry ceiling |
| Generation routing | Modality, references, rights, hardware, quality/cost targets | Select compatible generator; job system owns execution and artifact checks |

Do not put permission enforcement, account entitlement, path containment, source authentication, secrets redaction or destructive-effect approval solely behind a probabilistic model. A model may flag a risk or suggest an action; policy validates authority independently. Do not use classification when a reliable deterministic rule already decides the case.

## Decision pipeline

```text
observe -> build versioned state -> deterministic eligibility filter
        -> retrieve/rank a bounded candidate set
        -> ask atomic typed questions (optionally one batched request)
        -> validate response/schema/legal choices/probabilities
        -> confidence and expected-loss gate
        -> revalidate state freshness and permissions
        -> execute exactly the relevant branch
        -> independently verify outcome and record feedback
```

Always include `unknown`, `none` or an explicit abstain path when no candidate may fit. Candidate recall is an upper bound on decision success: a perfect classifier cannot select an omitted skill or DOM element. Separate shortlist evaluation from final-choice evaluation. Limit candidate payloads by tokens and preserve readable stable IDs with their observation generation.

Jev Ultrafast checks finite normalized probabilities, legal membership and argmax consistency, requests an operation and operation-specific target heads together, and validates the selected target head. This avoids treating all speculative outputs as executable. Its small live demonstrations are not a broad browser benchmark; unsupported DOM patterns and independent completion checks remain material. See the [source review](projects/ai-query--jev-ultrafast.md) and [GitHub repository](https://github.com/browser-use/jev-ultrafast).

## Cost-sensitive routing and abstention

For an action `a`, estimate `U(a|x) = P(success|x,a) × value - inference_cost - execution_cost - latency_penalty - expected_failure_loss`. Choose the highest-utility eligible action only if its conservative advantage over fallback is positive. Costs include classifier overhead, extra retrieval, retries, cache disruption and coordination. This is a proposed objective, not a calibrated score supplied by the inspected systems.

Thresholds must follow labeled validation, not a universal 0.5 or 0.9. Evaluate Brier score/log loss, reliability bins, top-k recall, abstention coverage and selective risk. Choose operating thresholds against task-specific failure budgets. Recalibrate for model, prompt/schema, candidate-set and distribution changes. Confidence, entropy and a top-two margin are signals; none is a proof of correctness. A separate conformal risk-control experiment may help when its distribution assumptions are defensible, but is not a claimed guarantee here.

Cache only decisions whose key includes state digest, candidate IDs/versions, question schema, model/version, policy scope and relevant timestamp. Revalidate permissions and freshness at execution even on a cache hit. Do not share private state across tenants to improve cache hit rate.

## Planning and model switching

[Pi's router example](projects/ai-agents--pi.md) ([source](https://github.com/earendil-works/pi)) classifies complexity, chooses a planning model and switches after the first successful edit. It preserves phase state through session branches. The useful idea is explicit phase state with limited switching; the unproven assumption is that first edit means hard reasoning is over.

The harness should permit escalation again after failed acceptance checks, rising uncertainty or a changed task. Add hysteresis/minimum useful phase duration to avoid rapid switching and cache loss. Serialize a source-grounded handoff and do not transfer provider-private reasoning fields as ordinary context. Benchmark fixed-model, rules-only routing and learned routing before enabling automatic selection.

## Decision models in skill and memory evolution

Use decision outputs as logged proposals with outcome labels. Do not train directly on “the agent chose this, therefore it was right.” Human correction, independently verified tests and source-backed retrieval judgments provide stronger labels. Selection propensities and skipped cases should be retained if comparing adaptive policies; otherwise feedback is biased toward already favored choices.

[DSPy](https://github.com/stanfordnlp/dspy) ([review](projects/ai-agents--dspy.md)) and [MetaHarness](https://github.com/SuperagenticAI/metaharness) ([review](projects/ai-agents--metaharness.md)) can propose prompt/router variants offline. Freeze hidden tests, guard the evaluator and separate proposer from promoter. Start with deterministic routing plus a classifier in shadow mode; introduce contextual-bandit exploration only for reversible low-risk choices and within an explicit exploration budget.

## Acceptance criteria

Decision-service outage leaves a functioning deterministic fallback. Malformed output, stale state, unsupported choice and low confidence produce no side effect. Compare rules, constrained local model and Jev on the same state snapshots with total latency/cost, accuracy, abstention and downstream task success. No benchmark result from another task is accepted as a replacement for this evaluation.

## October source refresh: validate decisions before effects

[Pi's refreshed loop and Jev example](projects/ai-agents--pi.md) ([source](https://github.com/earendil-works/pi)) reinforce two separate gates: complete, schema-valid tool output before execution, and evaluated routing thresholds before model selection. Do not derive permission from a classifier score.

The refreshed [OpenSpec report](projects/ai-spec--openspec.md) ([source](https://github.com/Fission-AI/OpenSpec)) distinguishes hard prerequisite identity checks from uncertain progress-display paths. Reject unknown dependencies, cycles and unsafe paths deterministically. Keep an unresolved display/progress observation visible without silently converting it into a hard authorization decision.

## Follow-up control boundaries: 2026-10-28

Keep decision, permission, acknowledgement and verified effect as separate records. [Onyx](https://github.com/onyx-dot-app/onyx) ([review](projects/ai-agents--onyx.md)) makes result, pending-human and child-wait decisions distinct in its examined protocol. [Hermes Agent](https://github.com/NousResearch/hermes-agent) ([review](projects/ai-agents--hermes-agent.md)) separates approval acknowledgement, withdrawal and settlement observers. Those source contracts motivate explicit state transitions; they do not prove that every executor enforces them. [OpenCode](https://github.com/anomalyco/opencode) ([review](projects/ai-agents--opencode.md)) also shows why a helper that rejects only `deny` must not be mistaken for permission to execute an `ask` action.

Cache identity and execution freshness must include the effective state, not just a stable request name. [OpenBot](https://github.com/CopilotKit/openbot) ([review](projects/ai-agents--openbot.md)) binds an examined action digest to actor, bot, effect, scope, arguments and target. [Nanobot](https://github.com/HKUDS/nanobot) ([review](projects/ai-agents--nanobot.md)) caches native bindings while rechecking process identity. [Mastra](https://github.com/mastra-ai/mastra) ([review](projects/ai-agents--mastra.md)) ties examined cache reuse to effective configuration and thread scope. Apply these as design inputs for stale approvals, reused request IDs and changed routes; validate each actual executor independently.

Discovery labels and status messages remain evidence with a limited scope. [awesome-jev-live](https://github.com/wh000wh000/awesome-jev-live) ([review](analyses/unreviewed/ai-info--awesome-jev-live.md)) distinguishes official, observed, inferred and unverified catalog entries, but those are publisher labels, not independent verification or calibrated routing scores. [Optio](https://github.com/jonwiggins/optio) ([review](projects/ai-agents-swarm--optio.md)) parses bounded process status messages; a valid status payload still cannot authorize an effect or prove completion. [E2B](https://github.com/e2b-dev/e2b) ([review](projects/ai-agents-sandbox--e2b.md)) motivates retaining whether a discovery list is complete before interpreting a missing candidate. Missing, unknown, denied, pending and completed states must remain distinct through deterministic eligibility, model ranking and user-visible plans.

These refinements come from static source review. They are operational design and acceptance requirements, not a claim that Teamagent has implemented or benchmarked each pattern.

## Additional scoped review references

These catalog associations provide navigation to scoped source reviews. Each report records its inspected revision, findings and exclusions; inclusion here does not establish a capability or an adoption decision.

- [awesome-jev-live](analyses/unreviewed/ai-info--awesome-jev-live.md)
- [best-of-agent-harnesses](analyses/unreviewed/ai-info--best-of-agent-harnesses.md)

## Source refresh: 2026-11-01 — decision semantics and admission

[ADK Go](https://github.com/google/adk-go) ([review](projects/ai-agents--adk-go.md)) adds a typed Jev adapter with answer-label validation, bounded response reads and returned model identity. Its individual probability range checks do not establish a normalized distribution or calibration. [ADK Python](https://github.com/google/adk-python) ([review](projects/ai-agents--adk-python.md)) preserves refusal as a distinct answer and rejects it at a routing node. [Switchyard](https://github.com/NVIDIA-NeMo/Switchyard) ([review](projects/ai-agents-proxy--switchyard.md)) distinguishes the scored proposition, selected choice, confidence and application cutoff. Version all four with model/schema/context identity; refusal and unknown must not silently become a negative label or an allowed default route.

Hard eligibility precedes both ranking and any upload. Generated SDK types and model preferences can still permit external fallback, as the [OpenRouter TypeScript SDK review](projects/ai-agents-proxy--openrouter-typescript-sdk.md) ([source](https://github.com/OpenRouterTeam/typescript-sdk)) illustrates. Apply current account, operation, host, training-data, cost and capability evidence before shortlist construction and again at execution. An override, fallback, cached choice or high confidence must not bypass that gate. Keep policy exclusions visible in passive plans; authenticated diagnostics and allocation-bearing probes are separate operations.

Scoring must retain its meaning. [Xerj](https://github.com/xerj-org/xerj) ([review](analyses/unreviewed/ai-agents-mem--xerj.md)) improves CJK lexical reranking while its fixture deliberately holds candidates fixed; that establishes neither first-stage recall nor calibrated semantic probability. [GitNexus](https://github.com/abhigyanpatwari/GitNexus) ([review](projects/ai-agents-mem--gitnexus.md)) preserves missing observation and incomplete coverage, and [AnythingLLM](https://github.com/Mintplex-Labs/anything-llm) ([review](projects/ai-agents--anything-llm.md)) motivates filtering before top-k rather than spending rank slots on ineligible entries. Preserve zero, missing, refused, unavailable and truncated states through metrics and UI.

Action verification must use a new observation without manufacturing authority. [Lightpanda](https://github.com/lightpanda-io/browser) ([review](projects/ai-query--lightpanda-browser.md)) combines consent-wall and control classification, then rereads the page after bounded model-driven clicks. Its accept default and separately unbounded selector replay must not become Teamagent policy. User consent, replay identity and execution limits remain deterministic; classifier confidence and a vanished banner prove neither authorization nor acceptance of the intended legal/data terms.

Evolution must freeze the evaluation rule with its evidence. [Reef](https://github.com/Human-Agent-Society/reef) ([review](projects/ai-agents-mem--reef.md)) treats failed repeats differently for paired wins, independent means, floors and no-evaluation selection. Report the admitted/dropped population and failure rate beside the score. These are source-grounded requirements, not newly implemented routers, independently reproduced upstream results or authorization to change an active default.

<!-- coverage:start -->
## Project coverage

Every associated project has its own report. Source-reviewed associations reflect the inspected scope; screened associations derive from the input category and are not capability claims.

| Source | Report | Depth |
|---|---|---|
| [ai.tanstack](https://github.com/tanstack/ai) | [Report](projects/ai-agents--ai.tanstack.md) | source-reviewed |
| [dspy](https://github.com/stanfordnlp/dspy) | [Report](projects/ai-agents--dspy.md) | source-reviewed |
| [pi](https://github.com/earendil-works/pi) | [Report](projects/ai-agents--pi.md) | source-reviewed |
| [typesafe-sdk-js](https://github.com/typesafe-ai/typesafe-sdk-js) | [Report](projects/ai-agents--typesafe-sdk-js.md) | source-reviewed |
| [hindsight](https://github.com/vectorize-io/hindsight) | [Report](projects/ai-agents-mem--hindsight.md) | source-reviewed |
| [anex](https://github.com/anex-sh/anex) | [Report](projects/ai-agents-proxy--anex.md) | screened |
| [bifrost](https://github.com/maximhq/bifrost) | [Report](projects/ai-agents-proxy--bifrost.md) | source-reviewed |
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
| [evolve-claude.autoharness](https://github.com/tigerless-labs/autoharness) | [Report](projects/ai-agents-skills--evolve-claude.autoharness.md) | source-reviewed |
| [agentnexus](https://github.com/kevinkaylie/AgentNexus) | [Report](projects/ai-agents-swarm--agentnexus.md) | screened |
| [mirofish](https://github.com/666ghj/MiroFish) | [Report](projects/ai-agents-swarm--mirofish.md) | screened |
| [miroshark](https://github.com/aaronjmars/MiroShark) | [Report](projects/ai-agents-swarm--miroshark.md) | screened |
| [multi-fleet](https://github.com/supportersimulator/multi-fleet) | [Report](projects/ai-agents-swarm--multi-fleet.md) | screened |
| [oasis](https://github.com/camel-ai/oasis) | [Report](projects/ai-agents-swarm--oasis.md) | screened |
| [openswarm](https://github.com/unohee/OpenSwarm) | [Report](projects/ai-agents-swarm--openswarm.md) | source-reviewed |
| [optio](https://github.com/jonwiggins/optio) | [Report](projects/ai-agents-swarm--optio.md) | screened |
| [orca](https://github.com/stablyai/orca) | [Report](projects/ai-agents-swarm--orca.md) | screened |
| [shadowbroker](https://github.com/BigBodyCobain/Shadowbroker) | [Report](projects/ai-agents-swarm--shadowbroker.md) | screened |
| [xx-2603-mirofish-offline](https://github.com/nikmcfly/MiroFish-Offline) | [Report](projects/ai-agents-swarm--xx-2603-mirofish-offline.md) | screened |
| [ccusage](https://github.com/ryoppippi/ccusage) | [Report](projects/ai-agents-tokens--ccusage.md) | source-reviewed |
| [codeburn](https://github.com/getagentseal/codeburn) | [Report](projects/ai-agents-tokens--codeburn.md) | source-reviewed |
| [falsify](https://github.com/studio-11-co/falsify) | [Report](projects/ai-eval--falsify.md) | screened |
| [frontier-harness-eval](https://github.com/frontier-harness-eval/eval) | [Report](projects/ai-eval--frontier-harness-eval.md) | source-reviewed |
| [ifixai](https://github.com/ifixai-ai/iFixAi) | [Report](projects/ai-eval--ifixai.md) | screened |
| [langwatch](https://github.com/langwatch/langwatch) | [Report](projects/ai-eval--langwatch.md) | source-reviewed |
| [mirrorcode](https://github.com/epoch-research/MirrorCode) | [Report](projects/ai-eval--mirrorcode.md) | screened |
| [openeval](https://github.com/Hona/openeval) | [Report](projects/ai-eval--openeval.md) | screened |
| [smevals](https://github.com/prime-radiant-inc/smevals) | [Report](projects/ai-eval--smevals.md) | screened |
| [xx-2602-ragas](https://github.com/vibrantlabsai/ragas) | [Report](projects/ai-eval--xx-2602-ragas.md) | source-reviewed |
| [game-schema-harness](https://github.com/schema-harness/schema-harness.github.io) | [Report](projects/ai-info--game-schema-harness.md) | source-reviewed |
| [rearchitecting-llms](https://github.com/peremartra/Rearchitecting-LLMs) | [Report](projects/ai-info--rearchitecting-llms.md) | source-reviewed |
| [vimax](https://github.com/HKUDS/ViMax) | [Report](projects/ai-media--vimax.md) | source-reviewed |
| [yue](https://github.com/multimodal-art-projection/YuE) | [Report](projects/ai-media--yue.md) | source-reviewed |
| [colibri](https://github.com/JustVugg/colibri) | [Report](projects/ai-model-run--colibri.md) | source-reviewed |
| [freetoken](https://github.com/FlashML-org/FreeToken) | [Report](projects/ai-model-run--freetoken.md) | source-reviewed |
| [artemis](https://github.com/google/artemis) | [Report](projects/ai-operate--artemis.md) | source-reviewed |
| [xx-2604-agent-opt](https://github.com/future-agi/agent-opt) | [Report](projects/ai-prompts--xx-2604-agent-opt.md) | source-reviewed |
| [aci](https://github.com/aipotheosis-labs/aci) | [Report](projects/ai-query--aci.md) | screened |
| [agent-browser](https://github.com/vercel-labs/agent-browser) | [Report](projects/ai-query--agent-browser.md) | screened |
| [anydoc](https://github.com/firecrawl/anydoc) | [Report](projects/ai-query--anydoc.md) | screened |
| [book-to-skill](https://github.com/virgiliojr94/book-to-skill) | [Report](projects/ai-query--book-to-skill.md) | screened |
| [browser-harness](https://github.com/browser-use/browser-harness) | [Report](projects/ai-query--browser-harness.md) | screened |
| [clawpatrol](https://github.com/denoland/clawpatrol) | [Report](projects/ai-query--clawpatrol.md) | screened |
| [codebase-radar](https://github.com/BleedingDev/codebase-radar) | [Report](projects/ai-query--codebase-radar.md) | screened |
| [codeflow](https://github.com/braedonsaunders/codeflow) | [Report](projects/ai-query--codeflow.md) | screened |
| [cowork-aion-ui](https://github.com/iOfficeAI/AionUi) | [Report](projects/ai-query--cowork-aion-ui.md) | screened |
| [fastmcp](https://github.com/punkpeye/fastmcp) | [Report](projects/ai-query--fastmcp.md) | screened |
| [get-md](https://github.com/Nano-Collective/get-md) | [Report](projects/ai-query--get-md.md) | screened |
| [gflow-cli](https://github.com/ffroliva/gflow-cli) | [Report](projects/ai-query--gflow-cli.md) | screened |
| [hyper-extract](https://github.com/yifanfeng97/Hyper-Extract) | [Report](projects/ai-query--hyper-extract.md) | screened |
| [jev-ultrafast](https://github.com/browser-use/jev-ultrafast) | [Report](projects/ai-query--jev-ultrafast.md) | source-reviewed |
| [jevgrep](https://github.com/dzhng/jevgrep) | [Report](projects/ai-query--jevgrep.md) | source-reviewed |
| [kanban-code](https://github.com/langwatch/kanban-code) | [Report](projects/ai-query--kanban-code.md) | screened |
| [leaf](https://github.com/RivoLink/leaf) | [Report](projects/ai-query--leaf.md) | screened |
| [lightpanda-browser](https://github.com/lightpanda-io/browser) | [Report](projects/ai-query--lightpanda-browser.md) | screened |
| [litho-deepwiki-rs](https://github.com/sopaco/deepwiki-rs) | [Report](projects/ai-query--litho-deepwiki-rs.md) | screened |
| [magika](https://github.com/google/magika) | [Report](projects/ai-query--magika.md) | source-reviewed |
| [mantic.sh](https://github.com/marcoaapfortes/Mantic.sh) | [Report](projects/ai-query--mantic.sh.md) | screened |
| [marker](https://github.com/datalab-to/marker) | [Report](projects/ai-query--marker.md) | screened |
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
| [qmd](https://github.com/tobi/qmd) | [Report](projects/ai-query--qmd.md) | source-reviewed |
| [regulated-ai-governance](https://github.com/ashutoshrana/regulated-ai-governance) | [Report](projects/ai-query--regulated-ai-governance.md) | screened |
| [spotify-portal-ai-plugins](https://github.com/spotify/portal-ai-plugins) | [Report](projects/ai-query--spotify-portal-ai-plugins.md) | screened |
| [stagehand](https://github.com/browserbase/stagehand) | [Report](projects/ai-query--stagehand.md) | screened |
| [trafilatura](https://github.com/adbar/trafilatura) | [Report](projects/ai-query--trafilatura.md) | source-reviewed |
| [understand-anything](https://github.com/Lum1104/Understand-Anything) | [Report](projects/ai-query--understand-anything.md) | screened |
| [use-webmcp-tool](https://github.com/GoogleChromeLabs/use-webmcp-tool) | [Report](projects/ai-query--use-webmcp-tool.md) | screened |
| [watermarks-remover](https://github.com/guillaumemeyer/watermarks-remover) | [Report](projects/ai-query--watermarks-remover.md) | screened |
| [wigolo](https://github.com/KnockOutEZ/wigolo) | [Report](projects/ai-query--wigolo.md) | screened |
| [xberg](https://github.com/xberg-io/xberg) | [Report](projects/ai-query--xberg.md) | screened |
| [xx-2602-markform](https://github.com/jlevy/markform) | [Report](projects/ai-query--xx-2602-markform.md) | screened |
<!-- coverage:end -->


## Source refresh: 2026-10-27 — evidence before optimization

The refreshed [Pi report](projects/ai-agents--pi.md) ([source](https://github.com/earendil-works/pi)) finds no change to the reviewed Jev router in this interval; its 0.5 complexity threshold and first-successful-edit phase transition remain uncalibrated heuristics. New durable progress and restart mechanisms offer test cases, not measured utility gains. Keep authorization, durable receipts and ambiguous-action reconciliation outside probabilistic routing and loss-tolerant progress storage.

The [Paseo review](projects/ai-agents--paseo.md) ([source](https://github.com/getpaseo/paseo)) illustrates deterministic eligibility checks before an idle-resource optimization. Its baseline-only behavior when a provider probe is absent must be reported rather than promoted to verified safety. The [Emdash review](analyses/unreviewed/ai-agents--emdash.md) ([source](https://github.com/generalaction/emdash)) similarly requires explicit evidence levels for authentication and task completion. Measure end-to-end correct outcomes, latency, resource use and recovery costs before ranking these architecture choices.

## Source refresh: 2026-10-28 — decision evidence and effect boundaries

[Contextrie](https://github.com/feuersteiner/contextrie) ([review](projects/ai-agents-mem--xx-2604-contextrie.md)) validates score shape but does not establish calibration. Its composed text omits a returned selected-source manifest. A Jev-like router should rank only authorized candidates, preserve the input/output evidence versions, abstain when evidence is missing and be evaluated on held-out decisions. Prompt instructions about tightness are not an enforced inference budget.

[LangWatch](https://github.com/langwatch/langwatch) ([review](projects/ai-eval--langwatch.md)) separates evaluator execution from cost-row deduplication. Judge/evaluation scheduling must account for repeated provider effects even when local billing receipts are unique. [Orca](https://github.com/stablyai/orca) ([review](projects/ai-agents-swarm--orca.md)) likewise shows that permission-handler cancellation and session cancellation can have different owners. Deterministic authorization, receipt reconciliation and resource settlement remain outside model ranking.

### Additional scoped reviews from November 1

These newly reviewed sources complement the themes above. Each report states its selected source scope and limitations; listing it does not imply runtime integration or comparative quality.

- [building-a-coding-agent-from-scratch-course](https://github.com/decodingai-magazine/building-a-coding-agent-from-scratch-course) ([scoped report](analyses/unreviewed/ai-info--building-a-coding-agent-from-scratch-course.md)).

## External-update synthesis: 2026-11-01 — eligibility before optimization

A decision score cannot replace deterministic admission. Bind the operation's exact principal, resource scope, policy and account evidence before applying cost/quality/latency preferences. [Gas City](https://github.com/gastownhall/gascity) ([review](projects/ai-agents--gascity.md)) preserves verified versus asserted attribution; [Agent Orchestrator](https://github.com/ComposioHQ/agent-orchestrator) ([review](projects/ai-agents--agent-orchestrator.md)) separates CLI compatibility from catalog visibility. Unknown states must remain visible rather than becoming favorable score defaults.

Separate process completion, observed verification and integration readiness, following the scoped [Oh-my-Hermes review](analyses/unreviewed/ai-agents--oh-my-hermes.md) ([source](https://github.com/rlaope/oh-my-hermes)). [Commonplace](https://github.com/zby/commonplace) ([review](projects/ai-agents-mem--commonplace.md)) also reinforces retaining causal uncertainty when evidence shares a condition without establishing a mechanism. Jev-style decision models remain candidates requiring task-specific calibration; no new comparative benchmark or causal performance claim follows from this refresh.

[Open Notebook](https://github.com/lfnovo/open-notebook) ([review](analyses/unreviewed/ai-agents--open-notebook.md)) provides useful stage-specific routing and rendered-context budgeting, with a token-count fallback that remains an estimate. Its schema description of up to five searches is not a deterministic list bound. Apply source coverage, account policy and explicit model constraints before optimization; neither a text estimate nor a proposed fan-out establishes admission.

[GitHub Agentics](https://github.com/githubnext/agentics) ([review](analyses/unreviewed/ai-agents-swarm--gh-agentics.md)) combines seeded, bounded task sampling with scheduled maintenance capacity and explicit invocation exemptions. Retain the seed, eligible set and observed outcomes for evaluation; reproducibility is not calibration, and a final capacity check is not an atomic reservation across external writers. [GitHub Agentic Workflows](https://github.com/github/gh-aw) ([review](analyses/unreviewed/ai-agents-swarm--gh-aw.md)) compiles an optional admission stage whose skipped state can permit continuation. Record whether admission is configured and required before interpreting a successful workflow or optimizing its next action. Neither source was executed in this review.

The November 1 [AgentScope](https://github.com/agentscope-ai/agentscope) ([review](analyses/unreviewed/ai-agents--agentscope.md)) review supplies a concrete Jev TypeSafe integration for binary, choice and score questions, preserving confidence/probabilities and usage. The model router uses the selected name without a confidence threshold and falls back to the original model on several failures. This is decision plumbing, not calibrated abstention or an account/training gate. Admit classifier content, all candidate routes and fallbacks first; retain reply decisions only while their evidence remains valid. Its after-call budget accumulation is termination feedback, not a pre-call reservation.

[goose](https://github.com/aaif-goose/goose) ([review](analyses/unreviewed/ai-agents--goose.md)) labels tool arguments as untrusted input to its permission judge and has fixtures where denial dominates approval suggestions regardless of inspection order. Keep deterministic denial authoritative over model classification. [MaxKB](https://github.com/1panel-dev/maxkb) ([review](analyses/unreviewed/ai-agents-mem--maxkb.md)) separately illustrates why similarity-based direct return is not answer truth and why retrieval surfaces need equivalent authorization before embedding. Neither classifier calibration, ranking quality nor runtime security was measured in these scoped reviews.

[Orca](https://github.com/stablyai/orca) ([scoped review](projects/ai-agents-swarm--orca.md)) offers an explicit completion decision boundary: consult child-work obligations before announcing lead success, require a known outcome, and establish an epoch/history baseline instead of replaying old completions to late subscribers. Notification eligibility remains a channel policy, and a success event is not independent artifact acceptance.

Recompute deterministic eligibility when a proposed target or policy changes. [Agent Tincan](https://github.com/mvanhorn/agent-tincan) ([review](analyses/unreviewed/ai-agents-swarm--agent-tincan.md)) rechecks lineage, hops and approval on target movement, but a missing approval file disables that explicit gate while independent default holds remain. [Sim](https://github.com/simstudioai/sim) ([review](analyses/unreviewed/ai-agents-swarm--sim.md)) separates content-fetch policy from configurable endpoint allowances and invalidates cached policy settings. A Jev-style choice must follow effective policy admission and disclose absent policy evidence; neither a target score nor an authenticated relay identity can supply missing action consent.

Resource availability and trust recovery are admission inputs, not favorable ranking defaults. [Simlock](https://github.com/callstackincubator/simlock) ([review](analyses/unreviewed/ai-agents-swarm--simlock.md)) separates release acknowledgment, reclamation and reuse, and distinguishes one worker's decline from the aggregate request outcome. [uniTerm](https://github.com/ys-ll/uniterm) ([review](analyses/unreviewed/ai-agents-swarm--uniterm.md)) rejects changed known host keys, while corrupt/unreadable trust storage can re-enter first-use acceptance in the inspected source and fixtures. Teamagent should keep failed cleanup and lost trust evidence ineligible pending explicit recovery; this is a static source concern, not a demonstrated exploit or a complete SSH authorization audit.

Educational guidance can propose decision tests without determining authority. The [AI Engineering Interview Questions catalogue](https://github.com/pallavi-shekhar/ai-engineering-interview-questions-company-wise) ([review](analyses/unreviewed/ai-info--ai-engineering-interview-questions-company-wise.md)) raises bounded cost, reversible action and permission-aware retrieval questions but supplies no calibrated rubric or measured router. [Claude How To](https://github.com/luongnv89/claude-howto) ([review](analyses/unreviewed/ai-info--claude-howto.md)) supplies review roles and hook examples, whose tool grants and executable helpers require separate checks. Preserve these as candidate acceptance questions; labels such as reviewer or read-only intent cannot narrow an actual command grant, and a generic publication template cannot override Teamagent's task ownership and reconciliation rules.

## Source addition: 2026-11-02 — action reviewers and finite scores

[OpenWorker](https://github.com/andrewyng/openworker) ([scoped review](analyses/unreviewed/ai-agents--openworker.md)) implements a pinned Jev adapter and a separate decision-service adapter behind named questions and deterministic allow/unsure/deny combination. Its engine excludes hard denies and human-only asks from model review and rechecks reviewer settings and owner/delegated context after reviewer waits. The source also has a material validation gap: float coercion and range comparisons do not reject NaN, which can suppress risk/stop comparisons. Require finite probabilities, exact question coverage and semantic validation before combining scores. Derived products are heuristics without demonstrated dependency/calibration assumptions; upstream evaluation comments were not reproduced.

Treat the decision-model request as its own content upload subject to route/account/training admission and resource reservation. Model-generated tool arguments remain untrusted even in a structured evidence object. Retain the questions, model, thresholds, policy and input versions for replay; classify provider failure separately from a model's uncertainty. This review supplies design candidates and adverse fixtures, not a calibrated approval policy or an integrated decision backend.
