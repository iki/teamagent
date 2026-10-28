# Channels, local/cloud operation and fast clients

The detailed [channel input and speech analysis](channel-input.md) defines authenticated envelopes, audio sequence ownership, endpointing, barge-in and transport acceptance boundaries. [Media processing](media-processing.md) compares provisioned local and hosted speech backends.

[Home](README.md) · [Architecture](architecture.md) · [Contracts](contracts.md)

## One task service, many clients

Web, desktop, mobile, Telegram, Slack and Discord should share task IDs, event cursors, permissions and artifact references. A chat message is an input surface, not a new autonomous state store. The desktop package starts or connects to a local daemon; mobile and web connect to an authenticated host or cloud coordinator. Losing a foreground app must not terminate work.

[Paseo](https://github.com/getpaseo/paseo) ([review](projects/ai-agents--paseo.md)) is the strongest inspected adapter/daemon reference; its cross-device product claims still require UI and transport validation. [Multica](https://github.com/multica-ai/multica) ([review](projects/ai-agents--multica.md)) supplies a concrete multi-replica channel lease pattern. [Nanobot](https://github.com/HKUDS/nanobot) ([review](projects/ai-agents--nanobot.md)) and [Hermes](https://github.com/NousResearch/hermes-agent) ([review](projects/ai-agents--hermes-agent.md)) supply channel configuration and plugin lifecycle patterns.

## Client architecture

Start with a responsive web application and progressive web app support. Use a desktop wrapper when local process management, filesystem selection, tray/background integration and OS credential storage are needed. Add a dedicated mobile shell only when native notifications, camera/files or background behavior justify it. Keep server computation out of render paths.

The UI has five primary surfaces: conversations/tasks, knowledge sources/import status, agents/models/connections, skills/tools, and artifacts/history. Advanced traces and policy diagnostics are expandable. Show an immediate accepted/queued state, optimistic input echo with a server acknowledgment, and clear disconnected/reconnecting status.

Use a snapshot plus monotonic cursor for initial load, then streamed deltas over SSE or WebSocket. Reconnection resumes from the cursor or obtains a fresh snapshot after retention expiry. Virtualize long lists, coalesce token deltas, render heavy media lazily and avoid reparsing the whole transcript on every token. Artifact payloads use authenticated blob fetches instead of base64 in the conversation stream.

These are proposed performance budgets, not measured results: warm local shell visible within 1 second; p95 local input acknowledgment below 100 ms; p95 event-to-visible update below 150 ms; usable reconnect below 2 seconds on a healthy network. Measure desktop startup separately from daemon cold start and model first-token latency. Test on an ordinary Windows laptop and a midrange phone, with 10,000 transcript items and 100 background tasks.

## Channel contract

Normalize an inbound envelope containing channel, installation/account, workspace, conversation/thread, actor, message ID, timestamp, text, attachment references and source capabilities. Resolve it to an internal principal and explicit project/task scope. Never use a display name as identity. A channel admin and the harness workspace owner may have different authority.

| Surface | Required adaptation |
|---|---|
| Telegram | Bot identity, chat/thread binding, update deduplication, attachment lifecycle, reconnect mode |
| Slack | Workspace installation, event signature checks, thread binding, bot-loop prevention, rate-limited updates |
| Discord | Guild/channel/thread binding, interaction acknowledgment, permission-aware responses, reconnect/replay |
| Web/mobile/desktop | Authenticated sessions, device registration/revocation, cursor replay, offline drafts |

This table specifies implementation requirements, not exact current platform limits. Read the platform's official API documentation when implementing each adapter; message-size, acknowledgment and rate limits are versioned adapter configuration rather than constants inferred from memory.

## Delivery and authority

Store inbound IDs in a unique inbox before scheduling. Store outbound logical effects in an outbox transaction with the task event that caused them. Retry with provider idempotency where available. Where it is unavailable, record sent provider IDs and reconcile ambiguous timeouts; exactly-once external delivery cannot be guaranteed merely by an outbox.

Serialize updates per conversation, allow bounded parallel work across conversations, and batch intermediate progress to meet channel rate limits. Persist only meaningful final/completion/failure/approval notifications; avoid forwarding every agent token to a chat platform. An approval button binds action digest, task, principal, expiry and current lease epoch; replaying an old button cannot approve a different action.

Respect existing authorization: routine read-only or already authorized work proceeds. Ask for a new decision only when task scope, external effects or permission policy actually require it. Display the concrete proposed action and the source of any policy block. Do not replace useful task progress with repetitive approval prompts.

## Deployment profiles

| Profile | State and execution | Tradeoff |
|---|---|---|
| Local only | Daemon, SQLite, blobs, local agents/models | Best offline/privacy path; remote channels depend on host availability |
| Local with remote access | Local state + authenticated relay/direct connection | Relay reachability does not confer worker authority |
| Cloud coordinator + local workers | Cloud task state, host-local credentials and tools | Must respect disconnected hosts and source privacy placement |
| Cloud only | Hosted state, isolated CPU/GPU/agent workers | Requires explicit upload scope, hosted credentials and cost controls |

Avoid split-brain local/cloud stores claiming authority over the same task. Multiple server replicas may write one authoritative database using transactions and task leases. Offline clients queue commands with idempotency keys; they do not invent authoritative task completion. Moving a running task across hosts requires a checkpoint/handoff plus verified artifacts and supported agent resume semantics. A cloud worker cannot simply reuse a local OAuth token or filesystem path.

[Cloudflare Agents](https://github.com/cloudflare/agents) ([review](projects/ai-agents--agents.cloudflare.md)) is a deployment-specific option, while [Mastra](https://github.com/mastra-ai/mastra) ([review](projects/ai-agents--mastra.md)) exposes replay/cache choices. Keep the common task contract independent of either hosting model.

## Tests that matter

Exercise duplicate webhooks, event reordering, device revocation, expired approval actions, lost acknowledgments, large attachments, host sleep and server restart. Verify tenant/conversation isolation with identical external thread IDs in two workspaces. Measure reconnect catch-up, mobile rendering and cancellation while a media job is running. Test that a replica losing its lease cannot continue publishing accepted task state or repeat a channel effect.

## October source refresh: responsive discovery and reconnects

The refreshed [Paseo report](projects/ai-agents--paseo.md) ([source](https://github.com/getpaseo/paseo)) exposes named pending provider-refresh phases and abort signals. Surface bounded discovery progress in web/desktop/mobile clients while the daemon owns work. A client deadline or disconnect is not evidence that the runtime was stopped; report cancellation completion only after the owning adapter confirms cleanup. This is a protocol recommendation, not a measured UI-speed result.

## Additional scoped review references

These catalog associations provide navigation to scoped source reviews. Each report records its inspected revision, findings and exclusions; inclusion here does not establish a capability or an adoption decision.

- [claude-code](analyses/unreviewed/ai-agents--claude-code.md)
- [hanzo-cli](analyses/unreviewed/ai-agents--hanzo-cli.md)
- [hanzo-dev](analyses/unreviewed/ai-agents--hanzo-dev.md)
- [hanzo-hips](analyses/unreviewed/ai-agents--hanzo-hips.md)
- [hanzo-sdk-ts](analyses/unreviewed/ai-agents--hanzo-sdk-ts.md)
- [hanzo-sdk](analyses/unreviewed/ai-agents--hanzo-sdk.md)
- [harness2](analyses/unreviewed/ai-agents--harness2.md)
- [trellis](analyses/unreviewed/ai-agents--trellis.md)

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
| [agents.cloudflare](https://github.com/cloudflare/agents) | [Report](projects/ai-agents--agents.cloudflare.md) | source-reviewed |
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
| [data-formulator](https://github.com/microsoft/data-formulator) | [Report](projects/ai-agents--data-formulator.md) | screened |
| [deepcode](https://github.com/HKUDS/DeepCode) | [Report](projects/ai-agents--deepcode.md) | screened |
| [deepscientist](https://github.com/ResearAI/DeepScientist) | [Report](projects/ai-agents--deepscientist.md) | screened |
| [deepseek-harness](https://github.com/deepseek-ai/deepseek-harness) | [Report](projects/ai-agents--deepseek-harness.md) | screened |
| [deepseek-tui](https://github.com/Hmbown/DeepSeek-TUI) | [Report](projects/ai-agents--deepseek-tui.md) | screened |
| [deeptutor](https://github.com/HKUDS/DeepTutor) | [Report](projects/ai-agents--deeptutor.md) | screened |
| [deer-flow](https://github.com/bytedance/deer-flow) | [Report](projects/ai-agents--deer-flow.md) | screened |
| [dify](https://github.com/langgenius/dify) | [Report](projects/ai-agents--dify.md) | screened |
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
| [hermes-agent](https://github.com/NousResearch/hermes-agent) | [Report](projects/ai-agents--hermes-agent.md) | source-reviewed |
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
| [mastra](https://github.com/mastra-ai/mastra) | [Report](projects/ai-agents--mastra.md) | source-reviewed |
| [mateclaw](https://github.com/mateaix/mateclaw) | [Report](projects/ai-agents--mateclaw.md) | screened |
| [meetily](https://github.com/Zackriya-Solutions/meetily) | [Report](projects/ai-agents--meetily.md) | screened |
| [mercury-agent](https://github.com/cosmicstack-labs/mercury-agent) | [Report](projects/ai-agents--mercury-agent.md) | screened |
| [metaharness.tools](https://github.com/nrwl/metaharness.tools) | [Report](projects/ai-agents--metaharness.tools.md) | screened |
| [mission-control](https://github.com/builderz-labs/mission-control) | [Report](projects/ai-agents--mission-control.md) | screened |
| [mlflow](https://github.com/mlflow/mlflow) | [Report](projects/ai-agents--mlflow.md) | screened |
| [mmx-cli](https://github.com/MiniMax-AI/cli) | [Report](projects/ai-agents--mmx-cli.md) | screened |
| [multica](https://github.com/multica-ai/multica) | [Report](projects/ai-agents--multica.md) | source-reviewed |
| [nanobot](https://github.com/HKUDS/nanobot) | [Report](projects/ai-agents--nanobot.md) | source-reviewed |
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
| [paseo](https://github.com/getpaseo/paseo) | [Report](projects/ai-agents--paseo.md) | source-reviewed |
| [pentagi](https://github.com/vxcontrol/pentagi) | [Report](projects/ai-agents--pentagi.md) | screened |
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
| [symphony](https://github.com/openai/symphony) | [Report](projects/ai-agents--symphony.md) | source-reviewed |
| [terminal-bench](https://github.com/harbor-framework/terminal-bench) | [Report](projects/ai-agents--terminal-bench.md) | screened |
| [terminus-kira](https://github.com/krafton-ai/kira) | [Report](projects/ai-agents--terminus-kira.md) | screened |
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
| [agent-governance-toolkit](https://github.com/microsoft/agent-governance-toolkit) | [Report](projects/ai-agents-sandbox--agent-governance-toolkit.md) | screened |
| [agentenv](https://github.com/kvcache-ai/AgentEnv) | [Report](projects/ai-agents-sandbox--agentenv.md) | screened |
| [cloudflare-computer](https://github.com/cloudflare/computer) | [Report](projects/ai-agents-sandbox--cloudflare-computer.md) | screened |
| [sandbox](https://github.com/agent-infra/sandbox) | [Report](projects/ai-agents-sandbox--sandbox.md) | screened |
| [tank-os](https://github.com/LobsterTrap/tank-os) | [Report](projects/ai-agents-sandbox--tank-os.md) | screened |
| [xx-2504-e2b-sdk](https://github.com/e2b-dev/sdk) | [Report](projects/ai-agents-sandbox--xx-2504-e2b-sdk.md) | screened |
| [xx-2603-iii-sandbox](https://github.com/iii-hq/sandbox) | [Report](projects/ai-agents-sandbox--xx-2603-iii-sandbox.md) | screened |
| [langwatch](https://github.com/langwatch/langwatch) | [Report](projects/ai-eval--langwatch.md) | source-reviewed |
| [a2ui](https://github.com/google/A2UI) | [Report](projects/ai-gen--a2ui.md) | source-reviewed |
| [diagram-design](https://github.com/cathrynlavery/diagram-design) | [Report](projects/ai-gen--diagram-design.md) | screened |
| [flint-chart](https://github.com/microsoft/flint-chart) | [Report](projects/ai-gen--flint-chart.md) | screened |
| [genui.flutter](https://github.com/flutter/genui) | [Report](projects/ai-gen--genui.flutter.md) | screened |
| [json-render](https://github.com/vercel-labs/json-render) | [Report](projects/ai-gen--json-render.md) | source-reviewed |
| [open-design](https://github.com/nexu-io/open-design) | [Report](projects/ai-gen--open-design.md) | source-reviewed |
| [quarkdown](https://github.com/iamgio/quarkdown) | [Report](projects/ai-gen--quarkdown.md) | screened |
| [tera](https://github.com/Keats/tera) | [Report](projects/ai-gen--tera.md) | screened |
| [xx-2601-davia](https://github.com/davialabs/davia) | [Report](projects/ai-gen--xx-2601-davia.md) | screened |
| [voicestudio](https://github.com/debpalash/VoiceStudio) | [Report](projects/ai-media--voicestudio.md) | source-reviewed |
| [artemis](https://github.com/google/artemis) | [Report](projects/ai-operate--artemis.md) | source-reviewed |
| [jev-ultrafast](https://github.com/browser-use/jev-ultrafast) | [Report](projects/ai-query--jev-ultrafast.md) | source-reviewed |
<!-- coverage:end -->


## Source refresh: 2026-10-27 — client lifetime and observable progress

The [Paseo refresh](projects/ai-agents--paseo.md) ([source](https://github.com/getpaseo/paseo)) provides an ownership pattern for keeping durable agent sessions independent of client connections. Idle collection checks pending permissions, active descendants and provider background work, then revalidates before shutdown. Retain a resumable session reference and expose whether closure completed or failed; a disconnected mobile or web client does not prove that its worker is idle.

The [Pi refresh](projects/ai-agents--pi.md) ([source](https://github.com/earendil-works/pi)) makes visible progress and stored checkpoints separate states. Clients may receive coalesced ephemeral progress, but must not describe it as crash-safe until stored. The [Emdash review](analyses/unreviewed/ai-agents--emdash.md) ([source](https://github.com/generalaction/emdash)) reinforces the separation of host conversation IDs and provider session IDs and of launch acknowledgment from completed work. These findings supplement the existing [speech input](channel-input.md) analysis; no fresh microphone, voice-provider or cross-device acceptance test was performed.

## Continued source review: 2026-10-27 — truthful adapter outcomes

The [Antigravity CLI release review](projects/ai-agents--antigravity-cli.md) ([source](https://github.com/google-antigravity/antigravity-cli)) is documentary evidence for additional channel/adapter tests: failed or cancelled tool calls must retain error status; a temporary transport failure must not masquerade as credential revocation; and user changes must invalidate another principal's OAuth connection. Parent/child workspace labels must describe actual isolated repositories. These remain acceptance requirements for Teamagent and independently tested adapter implementations; the upstream changelog alone does not establish shipped behavior or a new integration.

## Continued source review: 2026-10-27 — readiness and resumable delivery

A channel should expose presence, authentication, model access and operation completion as separate states. [MMX discovery](projects/ai-agents--mmx-cli.md) ([source](https://github.com/MiniMax-AI/cli)) recognizes binaries and runtime markers without launching them; [Open Interpreter's profile](projects/ai-agents--openinterpreter.md) ([source](https://github.com/openinterpreter/openinterpreter)) identifies a service contract rather than verified account access. [ClosedLoop health checks](projects/ai-agents--closedloop-ai.md) ([source](https://github.com/closedloop-ai/closedloop-ai)) retain unknown verification instead of prescribing another write. Present the evidence and its scope in channel status.

[Orchard's job client](projects/ai-agents--orchard.md) ([source](https://github.com/microsoft/Orchard)) provides a concrete submit-versus-wait separation for resumable work. A broken wait is not a failed generation, and cancellation of the UI's wait is not proof of remote cancellation. Persist the operation/artifact reference before downstream delivery and reconcile uncertainty before any repeat action. [Hydra's local-to-cloud fallback](projects/ai-agents--hydra.md) ([source](https://github.com/timtimeshock/Hydra)) must not be copied across explicit provider or non-training boundaries. [TypeSafe's multimodal transport](projects/ai-agents--typesafe-sdk-js.md) ([source](https://github.com/typesafe-ai/typesafe-sdk-js)) illustrates request snapshots and identical retry bytes, but cancellation and compression still need whole-operation bounds and confidential diagnostics.

## Continued source review: 2026-10-28 — preserved intent and bounded delivery

Resuming a channel must preserve the user's selected branch as well as the message entries. The [Yoagent session review](analyses/unreviewed/ai-agents--yoagent.md) shows why serializing an entry log alone can restore a different head after a seek. Store explicit selection and operation identity, expose partial and interrupted outcomes, and keep progress buffering bounded even when a client is slow or absent. Cancellation acknowledgment must describe what actually stopped and leave unresolved external effects visible.

Present a permission failure as a failure requiring an authorized remedy. [ENZO's launcher](projects/ai-agents--enzo.md) and [FrontierAgent's write fallback](projects/ai-agents--apodex-frontier-agent.md) provide source-level counterexamples to preserving the same boundary across recovery paths. A device header or legacy project identifier is also not evidence of a verified principal. Channel diagnostics must not forward confidential tool/provider errors merely because they are labeled telemetry, as illustrated by the [Feynman review](projects/ai-agents--feynman.md). These findings define adapter acceptance cases; they do not establish tested operating-system isolation or delivered channel behavior.

## Continued source review: 2026-10-28 — remote identity and effective capability

Retain operation identity when a transport reconnects. [LangSmith's command handle](projects/ai-agents--langsmith-sdk.md) resumes by command ID and UTF-8 output offsets, while [xyOps terminals](projects/ai-agents--xyops.md) distinguish detached clients, requested closure and the server's close event. Bound total reconnect lifetime and retained output separately from consecutive retry counts. Sending kill/close or losing a socket does not establish remote completion; persist uncertain outcomes for reconciliation before replaying an effect.

Display the effective protection and principal evidence, not just configured availability. [Pipali](projects/ai-agents--pipali.md) separates supported/enabled/ready sandbox states; [Claurst](projects/ai-agents--claude.fork.claurst.md) has no effective Seatbelt protection on unsupported hosts. [CamelAI's OAuth helper](projects/ai-agents--camelai.md) obtains verified-email evidence but its fetch timeout does not cover later body consumption. Channel adapters need schema-validated identities and responses, whole-operation deadlines and explicit unsupported protection. A browser service link, token-bearing URL, valid session or discovered model name conveys different authority; none should be silently substituted for another.

## Continued source review: 2026-10-28 — authenticated identity and delivery receipts

Separate permission to converse from permission to perform an effect. [Rsclaw](projects/ai-agents--rsclaw.md) makes that distinction, but deriving recovered ownership from channel labels still depends on authenticated provenance and account-specific identity. [Agent Orchestrator](projects/ai-agents--agent-orchestrator.md) separates preview-cookie and bearer contexts and preserves provider failure during identity migration; its plaintext LAN and trusted-loopback assumptions must not become general transport guarantees. [OpenMausBot](projects/ai-agents--openmausbot.md) supplies a concrete frontend counterexample: an unknown successful session response falls back to local-owner UI state. Require explicit validated trust variants, and keep UI labels separate from server grants.

Bound delivery independently from durable processing. [NVIDIA OO Agents](projects/ai-agents--nvidia-oo-agents.md) preserves queued items across waiter cancellation and restores race losers, but queue/waiter growth and registration-order fairness remain separate concerns. [Open CoDesign's JSONL session](projects/ai-agents--open-codesign.md) adds byte/request/step limits and unique request IDs; host operations must still cooperate with cancellation and output writers need their own bounds. A received event, completed stream or close response does not certify durable work or released resources.

Keep credential authority across reconnection and fallback. [Vercel AI SDK](projects/ai-agents--ai-sdk.vercel.md) validates issuer/server/token-endpoint bindings before reusing secrets, while [Cloudflare Agents](projects/ai-agents--agents.cloudflare.md) explicitly replaces provider headers at its gateway and tests fallback with mocked responses. Neither fixtures nor configured provider names establish live account access or retention policy. Preserve principal, credential version, exact destination and operation identity across retries; expose unknown entitlement, incomplete cleanup and partial usage rather than converting them to a successful channel status.

## Continued source review: 2026-10-28 — identity generations and uncertain handoffs

Treat cross-tab signals as invalidation hints and refresh identity from an authenticated source. [DeepTutor](projects/ai-agents--deeptutor.md) fences old authentication responses with a generation counter and broadcasts no principal through storage, while its mounted hook and unvalidated JSON show why every consumer must participate in that boundary. [Google Agents CLI](projects/ai-agents--agents-cli.md) distinguishes configuration, token acquisition and interactive setup, but a nonempty key is not verified access and fallback can change the effective principal or audience. Keep unknown authentication separate from disabled authentication, and settle pending callers when identity changes.

Preserve ambiguous delivery outcomes and approval-aware queuing. [Agent Manager](projects/ai-agents--agent-manager.md) queues messages around terminal dialogs, exposes held states and prevents a status predating a handoff from satisfying a wait. It also distinguishes a paste that may have reached the target from a definite failure. Queue insertion or typing can precede a later bookkeeping failure; retain a durable operation reference and do not replay from the error alone. A reply heuristic, terminal resting state or externally supplied sender label does not establish task correctness or authenticated authority.

Bind credentials to effective session identity and the exact destination independently of presentation metadata. [Microsoft Agent Framework](projects/ai-agents--agent-framework.ms.md) serializes dynamic-header identity changes and rejects repurposing caller-owned sessions; [FX](projects/ai-agents--fx.md) defines exact endpoint matches and conservative non-idempotent MCP tools. [Eve](projects/ai-agents--eve.md) distinguishes authentication display/flow keys from provider scope and CORS configuration from caller identity. Retain these separations through reconnects, and verify whole-operation bounds: bounded pages, post-capture byte checks and emitted cancellation observations do not establish bounded ingress or completed effect termination.

## Continued source review: 2026-10-28 — truthful outcomes and bound delivery

Expose the outcome that the adapter actually observed. [Kilocode](projects/ai-agents--kilocode.md) can render an empty partial search as no files found; [Sage](projects/ai-agents--sage.md) reports workspace deletion after ignoring a false result; [Mastra](projects/ai-agents--mastra.md) supplies stop and zero usage while translating ACP streams. [Mateclaw's presentation fixture](projects/ai-agents--mateclaw.md) distinguishes stopped, interrupted and incomplete answers even when the enclosing status is completed. Preserve structured partial/error/unavailable fields through rendering and keep terminal observation separate from verified task acceptance and cleanup acknowledgement.

Bind reconnects, approvals and replay to stable operation identity. [Odysseus](projects/ai-agents--odysseus.md) prevents stale subscriptions or cancellation from targeting a replacement run, while [Omnigent](projects/ai-agents--omnigent.md) explicitly identifies reconnect retries as at-least-once delivery that may repeat effects. [Murage](analyses/unreviewed/ai-agents--murage.md) binds a signed approval retry to its decision/card and joins concurrent allows without establishing new authority. Require effect-specific retry policy, bounded replay storage and uncertain-effect reconciliation. Client signatures and joined promises still depend on separately verified server admission, expiry and revocation.

Names and connection hints do not authenticate a user or service. [OpenRig](analyses/unreviewed/ai-agents--openrig.md) separates lexical human/external session classification from gateway admission; [Hermes Desktop](projects/ai-agents--hermes-desktop.md) infers sign-in from cookie-name presence and uses a protected health response as a routing hint. Recheck the selected connection before applying results, preserve profile/database identity in caches, and distinguish unavailable data from freshness. Bound response bodies as they arrive, keep diagnostics confidential, and bind authenticated request helpers to an authorized destination rather than accepting arbitrary URLs under ambient cookies.

Keep rich output and transport capabilities behind trusted projection. [Mateclaw](projects/ai-agents--mateclaw.md) maps versioned UI blocks to installed components but checks only shallow payload shapes; [Pi Desktop](projects/ai-agents--pi-desktop.md) renders links and images inert inside question cards. [ZeroClaw](projects/ai-agents--zeroclaw.md) projects structured artifact metadata instead of scraping free-form tool output, but a nonempty path still needs containment, identity and delivery authorization. Its channel planner also distinguishes declared egress from grants and does not expand existing grant rows. Validate complete values and enforce bounds before serialization/rendering, rather than treating a typed envelope as final authority.

Unattended delivery needs current authority at both creation and execution. [QM](projects/ai-agents--qm.md) checks live owner/admin authority and private delivery when creating grants; firing-time revocation remains outside that reviewed helper. [Paperclip's approval page](projects/ai-agents--paperclip.md) distinguishes audit organization context from the actual broad grant, but carries sensitive challenge state in URLs. Keep such state outside public URLs, revalidate the effective destination and principal at dispatch, and make unsupported policy refresh visible as illustrated by [Fuigo](projects/ai-agents--fuigo.md). [Pi Desktop's callback regression](projects/ai-agents--pi-desktop.md) is useful because it wires real IPC handling into the bridge; its fake sender and sidecar still leave native authority and durable settlement to separate acceptance checks.

## Continued source review: 2026-10-28 — transport parity and delivered results

Bind interaction authority consistently across transports. [Mercury Agent](projects/ai-agents--mercury-agent.md) validates one-shot values and cloud request identity, but stores normal SSE interactions without the same target binding and broadcasts before registering pending state. [Jan](projects/ai-agents--jan.md) avoids callback-reader deadlock with a separate dispatcher, while its old turn handle can target a newer active turn. Register owned state before notification, attach the exact request/run generation to decisions and cancellations, and test cross-client rejection independently from UI behavior. An authenticated connection still needs channel/resource authorization, as [Buzz](projects/ai-agents--buzz.md) explicitly delegates to membership enforcement.

Separate saved answers, previews and delivery acknowledgements. [AnythingLLM](projects/ai-agents--anything-llm.md) reconciles Unicode-aware final chunks after pending preview edits and persists the answer before delivery; its mocked bot fixtures cover long and shorter answers without proving live transport delivery. [DeerFlow](projects/ai-agents--deer-flow.md) reports unsupported attachments in the same conversation and owns cross-thread tasks, yet logged send failures and callback return do not establish successful delivery. Retain per-message partial outcomes, bounded preview chains and durable retry identity. Stop timers through a closed-state guard and an awaited owner, because an in-flight flush can schedule another timer after simple timer clearing.

Show missing and unsupported results explicitly. [Copilot SDK](projects/ai-agents--copilot-sdk.md) can turn an all-unrecognized MCP content array into empty success; [Jan](projects/ai-agents--jan.md) defaults a missing stop reason to completed and converts entire local image files before any local size or containment check. Keep unknown terminal states, malformed media, dropped events and partial output visible. Typed artifacts require authorized handles and byte limits, while diagnostic tool arguments, error excerpts and result previews need their own redaction policy.

Authentication UI must track verified state and the current session generation. [Cloudflare OS](projects/ai-agents--cloudflare-os.md) invalidates stale telemetry-identity callbacks but marks a pipelined auth stub as authenticated before acceptance; [Gemini CLI](projects/ai-agents--gemini-cli.md) awaits refresh but lacks a generation guard on its asynchronous hook. A disposed stub, cleared UI or chosen region is not a revocation receipt. [Kimi Code](projects/ai-agents--kimi-code.md) demonstrates why effective credential/relay endpoints and provenance should be visible separately from a coarse region label. Bound logout/notification cleanup and reject late identity results without silently retaining unavailable credentials or stale destinations.
## Follow-up source review: 2026-10-28 — delivery identity and visible protection

Keep uncertain delivery recoverable beyond the UI that initiated it. [Agent Orchestrator](projects/ai-agents--agent-orchestrator.md) retains exact edit payloads and delivery IDs after ambiguous outcomes; its component state alone does not establish durable server deduplication. [Cline](projects/ai-agents--cline.md) joins concurrent cloud publications by account generation and request ID but removes the promise after settlement, so a later retry needs a durable receipt. [Eve](projects/ai-agents--eve.md) gives scheduled sends their own authority and continuation namespace; its recent-key window and schedule-scoped keys require explicit occurrence semantics. The channel contract must distinguish local queuing, accepted delivery, completed processing and published artifacts, and reconcile ambiguous effects before replay.

Show effective protection and the identity evidence behind every action. [AX](projects/ai-agents--ax.md) can fall back to a plaintext router connection, while [Cezar](projects/ai-agents--cezar.md) separates wildcard bind addresses from dialable loopback and treats port probes as advisory. Neither a displayed HTTPS-like endpoint nor a successful probe proves the final transport. [Buzz](projects/ai-agents--buzz.md) attributes authorization diagnostics to the proven key rather than an asserted key. [Copilot SDK](projects/ai-agents--copilot-sdk.md) forwards a readable elicitation source label, which still depends on upstream trust. Bind approvals to authenticated principal, exact destination, current generation and operation ID; keep labels and configured capabilities separate.

Preserve proposed and observed content as different states. [Cloudflare OS's Outlook reader](projects/ai-agents--cloudflare-os.md) guards named reads, exposes pending draft changes, and marks encrypted content unavailable; cached hierarchy, observation approval and final write authorization remain separate. [Agent Manager](projects/ai-agents--agent-manager.md) limits kill confirmations to the visible live targets and disables them in archived views, with worker revalidation still required. [DingTalk in DeerFlow](projects/ai-agents--deer-flow.md) supplies an already acquired token to an SDK helper so hidden synchronous refresh cannot block the event loop, but token availability does not establish delivery or a whole-operation deadline. [FX](projects/ai-agents--fx.md) preserves HTTP failure classes; retain bounded/redacted response evidence and uncertainty alongside those classes rather than treating them as permission to retry.

Maintain source bytes, language and presentation provenance independently. [Gemini CLI](projects/ai-agents--gemini-cli.md) normalizes CRLF only for comparison and registers terminal wrapping cleanup; those helpers do not implement a repository-wide LF policy or verify native rendering. [God's Eye View](projects/ai-agents--gods-eye-view.md) separates script-aware locale selection and localized labels from numeric/coordinate meaning. [Antigravity's release notes](projects/ai-agents--antigravity-cli.md) supply unverified acceptance cases for clipboard media, exact sensitive-host approvals and invalid-image rejection. [ComfyUI](projects/ai-agents--comfyui.md) supplies exact release lookup and anonymous-file handling, while [Agentic Bug Hunter](projects/ai-agents--agentic-bug-hunter.md) shows lexical URL canonicalization. None replaces approved wording preservation, original/LF hash records, actual media inspection, exact download rules or operating-system/network isolation tests.

An approval has one authoritative request even when multiple clients observe it. [Hermes](https://github.com/NousResearch/hermes-agent) ([review](projects/ai-agents--hermes-agent.md)) separates acknowledgement, withdrawal and settlement observers; delivery to a screen must not count as a grant. [Kilo Code](https://github.com/Kilo-Org/kilocode) ([review](projects/ai-agents--kilocode.md)) binds native routing to the exact attached session and separates its cloud system feed, while [Multica](https://github.com/multica-ai/multica) ([review](projects/ai-agents--multica.md)) selects ACP versus run transport explicitly and repairs version-specific tool-call IDs. Expose capabilities and observability per effective transport, retaining the original call/session identity across repairs.

Represent lifecycle events precisely. [Paseo](https://github.com/getpaseo/paseo) ([review](projects/ai-agents--paseo.md)) names before/after hooks explicitly; [Pi](https://github.com/earendil-works/pi) ([review](projects/ai-agents--pi.md)) uses explicit document change/retire discriminants instead of an ambiguous null tombstone. [Pipali](https://github.com/khoj-ai/pipali) ([review](projects/ai-agents--pipali.md)) prevents stale run callbacks from updating the current UI but does not thereby cancel every remote effect. [Claude Code](https://github.com/anthropics/claude-code) ([review](analyses/unreviewed/ai-agents--claude-code.md)) distinguishes a staged patch from an applied one. The channel ledger must retain proposal, dispatch, completion and independently observed effect as separate events.

Media and screen events need verified dimensions and a current viewport identity. [PI-Desktop](https://github.com/vastsa/PI-Desktop) ([review](projects/ai-agents--pi-desktop.md)) bounds bytes and known pixel dimensions, but an unknown dimension probe passes the inspected branch. [OpenMausBot](https://github.com/milind-soni/OpenMausBot) ([review](projects/ai-agents--openmausbot.md)) motivates carrying screenshot dimensions and viewport generation with later actions. Unknown geometry must remain visible, and resized screenshots cannot silently retain stale coordinate meaning. These additions remain source-review findings; no native client, browser or channel service was executed.
