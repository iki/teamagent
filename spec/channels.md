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

<!-- analysis-additions:start -->
## Newly catalogued sources

These category-based links are discovery records, not reviewed capability or adoption claims. See [analysis maintenance](analyses/README.md).

- [claude-code](analyses/unreviewed/ai-agents--claude-code.md) ([source](https://github.com/anthropics/claude-code)).
- [hanzo-cli](analyses/unreviewed/ai-agents--hanzo-cli.md) ([source](https://github.com/hanzoai/cli)).
- [hanzo-dev](analyses/unreviewed/ai-agents--hanzo-dev.md) ([source](https://github.com/hanzoai/dev)).
- [hanzo-hips](analyses/unreviewed/ai-agents--hanzo-hips.md) ([source](https://github.com/hanzoai/hips)).
- [hanzo-sdk](analyses/unreviewed/ai-agents--hanzo-sdk.md) ([source](https://github.com/hanzoai/sdk)).
- [hanzo-sdk-ts](analyses/unreviewed/ai-agents--hanzo-sdk-ts.md) ([source](https://github.com/hanzoai/js-sdk)).
- [harness2](analyses/unreviewed/ai-agents--harness2.md) ([source](https://github.com/google-research/harness2)).
- [murage](analyses/unreviewed/ai-agents--murage.md) ([source](https://github.com/ferroxlabs/murage)).
- [openrig](analyses/unreviewed/ai-agents--openrig.md) ([source](https://github.com/mvschwarz/openrig)).
- [trellis](analyses/unreviewed/ai-agents--trellis.md) ([source](https://github.com/mindfold-ai/trellis)).
- [yoagent](analyses/unreviewed/ai-agents--yoagent.md) ([source](https://github.com/yologdev/yoagent)).
<!-- analysis-additions:end -->
