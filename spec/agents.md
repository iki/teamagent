# Agents and team execution

[Home](README.md) · [Architecture](architecture.md) · [Models](models.md) · [Contracts](contracts.md)

## Separate an agent from a model

A model produces inference outputs. An agent runtime manages a loop, tools, permissions, context, sessions and cancellation. A team harness schedules and supervises those runtimes. Normalize these three layers independently so using a subscription-backed coding agent does not require pretending its private backend is a generic API.

The requested “any installed agent” should mean **detect known agents and protocol-compatible unknown agents; explicitly report unsupported ones**. There is no reliable way to infer arbitrary executable semantics from a filename. Adapter registration in [Agent Orchestrator](https://github.com/ComposioHQ/agent-orchestrator) ([review](projects/ai-agents--agent-orchestrator.md)) and provider-specific clients in [Paseo](https://github.com/getpaseo/paseo) ([review](projects/ai-agents--paseo.md)) are concrete references.

## Discovery and connection algorithm

1. Search a maintained command manifest in the process PATH and supported installation locations. Accept user-added executable paths without recursive disk scans. Respect Windows aliases, package shims and WSL/remote host boundaries.
2. Perform passive checks first: executable existence, platform, package identity and cached version. Never install packages or start background services from a status page. [Hermes](https://github.com/NousResearch/hermes-agent) ([review](projects/ai-agents--hermes-agent.md)) explicitly separates passive dependency probes from active installers.
3. Run a bounded, known-safe version/protocol handshake only for a recognized adapter. A timeout is unknown, not absent. Do not read or export raw credential stores to discover authentication.
4. Record `discovered → compatible → authenticated → usable` separately. Catalog entries are not entitlement proofs; track the last successful task/inference check and current quota state.
5. Negotiate streaming, tool approval, attachments, native sessions, resume, steering, working directory, usage accounting and cancellation. Unsupported features stay false/unknown.
6. Present a concrete connect/install/upgrade action if needed. Installation is a separate mutation with a pinned package and source record.

This environment's passive PATH scan found `codex`, `omp`, `hermes` and `docker`; the other probed command names were not found in this sandbox's PATH. No agent was launched and authentication/model availability was not tested. This is a narrow observation, not a complete host installation inventory.

## Adapter contract and protocol preference

Prefer the provider's maintained SDK or native RPC, then ACP where supported, then a documented noninteractive CLI with structured events. PTY/terminal scraping is a degraded compatibility mode, not the foundation of task success detection. [Copilot SDK](https://github.com/github/copilot-sdk) ([review](projects/ai-agents--copilot-sdk.md)) illustrates explicit auth/catalog RPCs; [OpenCode](https://github.com/anomalyco/opencode) ([review](projects/ai-agents--opencode.md)) illustrates a narrow recorded-history continuation contract.

ACP addresses client-to-agent communication; MCP addresses tool/context integration. Neither alone is a complete team scheduler or permission system. The official ACP introduction still describes full remote support as in progress; pin actual negotiated versions and features rather than assuming local and remote parity. [ACP introduction](https://agentclientprotocol.com/get-started/introduction), [MCP specification](https://modelcontextprotocol.io/specification/2026-07-28).

The adapter should implement `probe`, `capabilities`, `start`, `events`, `send`, `cancel`, `resume` and `close`; unsupported operations return typed errors. Native session IDs remain opaque. One active input writer owns a session, while several UI clients may subscribe. User steering is serialized with worker events and retained across disconnection.

Record whether native tools and approval requests can actually be intercepted. Adapters with opaque side effects need OS-level filesystem/network confinement for strong isolation, and may still have weaker cancellation guarantees. Mark these limits in the UI and placement rules. The harness cannot fence an arbitrary external write merely by rejecting the agent's final event.

## Team scheduling algorithm

Represent a task as a DAG of bounded subtasks with acceptance checks, inputs, output schema, estimated resources and declared read/write scopes. Default to one worker. Delegate only independent work with enough benefit to cover coordination, context transfer, review and merge cost.

```text
ready := dependency-complete tasks whose grants and inputs are valid
eligible := filter(ready, compatible host + agent + quota + memory/GPU limits)
ordered := stable_sort(eligible, priority + aging + critical-path estimate)
wave := greedy_pairwise_compatible(ordered, resource_conflicts)
admit := reserve_budget_and_lease(wave, concurrency_limits)
dispatch(admit)
on_completion: verify artifacts; unblock successors; reconcile budget
```

The conflict-free wave function is directly supported by [OpenSwarm](https://github.com/unohee/OpenSwarm) ([review](projects/ai-agents-swarm--openswarm.md)). Greedy admission is deterministic and cheap, but not globally optimal. Add aging to avoid starvation. Directory overlap is insufficient: schema changes, lockfiles, generated files and shared external systems also need conflict scopes.

For coding, give each writing worker a separate Git worktree/branch or isolated checkout. Read-only analysis can share an immutable snapshot. An integrator owns merges, resolves semantic conflicts and runs acceptance checks on the combined result. A worktree is not a security sandbox. Late worker results are accepted only if their base revision and lease epoch are still valid.

## Coordination patterns and their limits

| Pattern | Use when | Avoid when |
|---|---|---|
| Single agent + deterministic tools | Task is cohesive or context transfer dominates | Independent work is demonstrably on the critical path |
| Supervisor + bounded specialists | Distinct source reviews, independent modules, testable subtasks | Manager cannot define outputs or keeps delegating recursively |
| Map/reduce | Many independent documents or repositories | Cross-item dependencies require shared mutable state |
| Planner/executor/verifier | Execution can be mechanically checked | Verifier is the same biased self-report with no external evidence |
| Debate/ensemble | High uncertainty warrants diversity and cost | Simple tasks or tightly correlated models |
| Persistent issue workers | Work comes from a durable backlog | Open-ended conversational exploration without acceptance criteria |

[CrewAI](https://github.com/crewAIInc/crewAI) ([review](projects/ai-agents-swarm--crewai.md)) contributes checkpoint/fork and role-workflow patterns. [Symphony](https://github.com/openai/symphony) ([review](projects/ai-agents--symphony.md)) contributes issue-backed supervision. Neither removes the need to measure whether the team improves on a minimal worker such as [mini-swe-agent](https://github.com/SWE-agent/mini-swe-agent) ([review](projects/ai-agents--mini-swe-agent.md)).

## Persistence, budgets and recovery

Persist task state separately from transcripts. Suggested states: queued, ready, leased, running, waiting-input, waiting-host, verifying, succeeded, failed, cancelled and uncertain-effect. Retries create new attempts under the same task. Completion requires acceptance evidence, not a worker's “done” message.

Use a supervisor reconciliation loop with exponential backoff, jitter, maximum attempts and a no-progress circuit breaker. [Gas City](https://github.com/gastownhall/gascity) ([review](projects/ai-agents--gascity.md)) provides the circuit-breaker pattern. [Paperclip](https://github.com/paperclipai/paperclip) ([review](projects/ai-agents--paperclip.md)) provides scoped budget concepts; add reservation accounting to prevent concurrent workers overspending unobserved usage.

The runtime must distinguish a recoverable stream from a recoverable in-flight computation. [Mastra](https://github.com/mastra-ai/mastra) ([review](projects/ai-agents--mastra.md)) makes checkpoint/cache configuration explicit. Crash tests must verify the selected configuration, including side effects that finish before a checkpoint commits.

## Acceptance criteria

- A missing, incompatible or unauthenticated agent produces an actionable state without guessing success.
- Cancelling a task cancels descendants; gateway-mediated or sandbox-enforced effects reject stale epochs. Opaque adapters report residual/uncertain effects and cannot claim the same guarantee.
- Host/process restart preserves task identity and produces neither duplicate external writes nor unreported uncertain outcomes.
- Three concurrent coding workers cannot modify the same checkout or exceed shared budget reservations.
- A user can switch agent implementations through a cited handoff package and see which capabilities change.
- Every worker output has a source revision, agent/model identity, policy digest, trace reference and independent outcome check.

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
| [ai.tanstack](https://github.com/tanstack/ai) | [Report](projects/ai-agents--ai.tanstack.md) | source-reviewed |
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
| [comfyui](https://github.com/comfy-org/comfyui) | [Report](projects/ai-agents--comfyui.md) | source-reviewed |
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
| [gascity](https://github.com/gastownhall/gascity) | [Report](projects/ai-agents--gascity.md) | source-reviewed |
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
| [metaharness](https://github.com/SuperagenticAI/metaharness) | [Report](projects/ai-agents--metaharness.md) | source-reviewed |
| [metaharness.tools](https://github.com/nrwl/metaharness.tools) | [Report](projects/ai-agents--metaharness.tools.md) | screened |
| [mini-swe-agent](https://github.com/SWE-agent/mini-swe-agent) | [Report](projects/ai-agents--mini-swe-agent.md) | source-reviewed |
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
| [context-mode](https://github.com/mksglu/context-mode) | [Report](projects/ai-agents-mem--context-mode.md) | source-reviewed |
| [gitnexus](https://github.com/abhigyanpatwari/GitNexus) | [Report](projects/ai-agents-mem--gitnexus.md) | source-reviewed |
| [mem0](https://github.com/mem0ai/mem0) | [Report](projects/ai-agents-mem--mem0.md) | source-reviewed |
| [mentisdb](https://github.com/CloudLLM-ai/mentisdb) | [Report](projects/ai-agents-mem--mentisdb.md) | source-reviewed |
| [bifrost](https://github.com/maximhq/bifrost) | [Report](projects/ai-agents-proxy--bifrost.md) | source-reviewed |
| [cli-proxy-api](https://github.com/router-for-me/CLIProxyAPI) | [Report](projects/ai-agents-proxy--cli-proxy-api.md) | source-reviewed |
| [rtk](https://github.com/rtk-ai/rtk) | [Report](projects/ai-agents-proxy--rtk.md) | source-reviewed |
| [agent-governance-toolkit](https://github.com/microsoft/agent-governance-toolkit) | [Report](projects/ai-agents-sandbox--agent-governance-toolkit.md) | screened |
| [agentenv](https://github.com/kvcache-ai/AgentEnv) | [Report](projects/ai-agents-sandbox--agentenv.md) | screened |
| [anthropic-sandbox-runtime](https://github.com/anthropic-experimental/sandbox-runtime) | [Report](projects/ai-agents-sandbox--anthropic-sandbox-runtime.md) | source-reviewed |
| [cloudflare-computer](https://github.com/cloudflare/computer) | [Report](projects/ai-agents-sandbox--cloudflare-computer.md) | screened |
| [e2b](https://github.com/e2b-dev/e2b) | [Report](projects/ai-agents-sandbox--e2b.md) | source-reviewed |
| [just-bash](https://github.com/vercel-labs/just-bash) | [Report](projects/ai-agents-sandbox--just-bash.md) | source-reviewed |
| [opensandbox](https://github.com/alibaba/OpenSandbox) | [Report](projects/ai-agents-sandbox--opensandbox.md) | source-reviewed |
| [sandbox](https://github.com/agent-infra/sandbox) | [Report](projects/ai-agents-sandbox--sandbox.md) | screened |
| [tank-os](https://github.com/LobsterTrap/tank-os) | [Report](projects/ai-agents-sandbox--tank-os.md) | screened |
| [xx-2504-e2b-sdk](https://github.com/e2b-dev/sdk) | [Report](projects/ai-agents-sandbox--xx-2504-e2b-sdk.md) | screened |
| [xx-2603-iii-sandbox](https://github.com/iii-hq/sandbox) | [Report](projects/ai-agents-sandbox--xx-2603-iii-sandbox.md) | screened |
| [manage.skillware](https://github.com/ARPAHLS/skillware) | [Report](projects/ai-agents-skills--manage.skillware.md) | source-reviewed |
| [search.skillkit](https://github.com/rohitg00/skillkit) | [Report](projects/ai-agents-skills--search.skillkit.md) | source-reviewed |
| [search.vercel](https://github.com/vercel-labs/skills) | [Report](projects/ai-agents-skills--search.vercel.md) | source-reviewed |
| [agentnexus](https://github.com/kevinkaylie/AgentNexus) | [Report](projects/ai-agents-swarm--agentnexus.md) | screened |
| [crewai](https://github.com/crewAIInc/crewAI) | [Report](projects/ai-agents-swarm--crewai.md) | source-reviewed |
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
| [frontier-harness-eval](https://github.com/frontier-harness-eval/eval) | [Report](projects/ai-eval--frontier-harness-eval.md) | source-reviewed |
| [hyperframes](https://github.com/heygen-com/hyperframes) | [Report](projects/ai-gen--hyperframes.md) | source-reviewed |
| [open-design](https://github.com/nexu-io/open-design) | [Report](projects/ai-gen--open-design.md) | source-reviewed |
| [ai-agent-tools](https://github.com/cporter202/ai-agent-tools) | [Report](projects/ai-info--ai-agent-tools.md) | screened |
| [ai-engineering-from-scratch](https://github.com/rohitg00/ai-engineering-from-scratch) | [Report](projects/ai-info--ai-engineering-from-scratch.md) | screened |
| [ai-interaction-atlas](https://github.com/quietloudlab/ai-interaction-atlas) | [Report](projects/ai-info--ai-interaction-atlas.md) | screened |
| [awesome-artificial-intelligence-regulation](https://github.com/EthicalML/awesome-artificial-intelligence-regulation) | [Report](projects/ai-info--awesome-artificial-intelligence-regulation.md) | screened |
| [awesome-design-md](https://github.com/VoltAgent/awesome-design-md) | [Report](projects/ai-info--awesome-design-md.md) | screened |
| [awesome-llm-apps](https://github.com/Shubhamsaboo/awesome-llm-apps) | [Report](projects/ai-info--awesome-llm-apps.md) | screened |
| [awesome-mcp-servers](https://github.com/punkpeye/awesome-mcp-servers) | [Report](projects/ai-info--awesome-mcp-servers.md) | screened |
| [awesome-openrouter](https://github.com/OpenRouterTeam/awesome-openrouter) | [Report](projects/ai-info--awesome-openrouter.md) | screened |
| [awesome-production-machine-learning](https://github.com/EthicalML/awesome-production-machine-learning) | [Report](projects/ai-info--awesome-production-machine-learning.md) | screened |
| [blog-dnhkng](https://github.com/dnhkng/dnhkng.github.io) | [Report](projects/ai-info--blog-dnhkng.md) | screened |
| [game-schema-harness](https://github.com/schema-harness/schema-harness.github.io) | [Report](projects/ai-info--game-schema-harness.md) | source-reviewed |
| [hermes-agent-orange-book](https://github.com/alchaincyf/hermes-agent-orange-book) | [Report](projects/ai-info--hermes-agent-orange-book.md) | screened |
| [xx-2604-dspy-0to1-guide](https://github.com/evalops/dspy-0to1-guide) | [Report](projects/ai-info--xx-2604-dspy-0to1-guide.md) | screened |
| [xx-2604-seeaifirst](https://github.com/BARONFANTHE/seeaifirst) | [Report](projects/ai-info--xx-2604-seeaifirst.md) | screened |
| [vimax](https://github.com/HKUDS/ViMax) | [Report](projects/ai-media--vimax.md) | source-reviewed |
| [colibri](https://github.com/JustVugg/colibri) | [Report](projects/ai-model-run--colibri.md) | source-reviewed |
| [artemis](https://github.com/google/artemis) | [Report](projects/ai-operate--artemis.md) | source-reviewed |
| [jev-ultrafast](https://github.com/browser-use/jev-ultrafast) | [Report](projects/ai-query--jev-ultrafast.md) | source-reviewed |
| [jevgrep](https://github.com/dzhng/jevgrep) | [Report](projects/ai-query--jevgrep.md) | source-reviewed |
| [adrian](https://github.com/secureagentics/Adrian) | [Report](projects/ai-security--adrian.md) | screened |
| [aisoc](https://github.com/beenuar/AiSOC) | [Report](projects/ai-security--aisoc.md) | screened |
| [bumblebee](https://github.com/perplexityai/bumblebee) | [Report](projects/ai-security--bumblebee.md) | screened |
| [clawseccheck](https://github.com/gl0di/clawseccheck) | [Report](projects/ai-security--clawseccheck.md) | source-reviewed |
| [codeql](https://github.com/github/codeql) | [Report](projects/ai-security--codeql.md) | source-reviewed |
| [codex-security](https://github.com/openai/codex-security) | [Report](projects/ai-security--codex-security.md) | screened |
| [cpguard](https://github.com/KimJeju/cpguard) | [Report](projects/ai-security--cpguard.md) | screened |
| [deepsec](https://github.com/vercel-labs/deepsec) | [Report](projects/ai-security--deepsec.md) | screened |
| [fengarde](https://github.com/supermhel/fengarde) | [Report](projects/ai-security--fengarde.md) | screened |
| [ghidra](https://github.com/NationalSecurityAgency/ghidra) | [Report](projects/ai-security--ghidra.md) | screened |
| [mantis](https://github.com/google/mantis) | [Report](projects/ai-security--mantis.md) | screened |
| [osv-scanner](https://github.com/google/osv-scanner) | [Report](projects/ai-security--osv-scanner.md) | source-reviewed |
| [osv.dev](https://github.com/google/osv.dev) | [Report](projects/ai-security--osv.dev.md) | screened |
| [paper.2604.security.many-ih](https://github.com/JHU-CLSP/ManyIH) | [Report](projects/ai-security--paper.2604.security.many-ih.md) | screened |
| [trivy](https://github.com/aquasecurity/trivy) | [Report](projects/ai-security--trivy.md) | source-reviewed |
| [agent-codex](https://github.com/openai/skills) | [Report](projects/ai-skills--agent-codex.md) | source-reviewed |
| [plan.obra-superpowers](https://github.com/obra/superpowers) | [Report](projects/ai-skills--plan.obra-superpowers.md) | source-reviewed |
| [security.trailofbits](https://github.com/trailofbits/skills) | [Report](projects/ai-skills--security.trailofbits.md) | source-reviewed |
| [get-shit-done](https://github.com/gsd-build/get-shit-done) | [Report](projects/ai-spec--get-shit-done.md) | source-reviewed |
| [openspec](https://github.com/Fission-AI/OpenSpec) | [Report](projects/ai-spec--openspec.md) | source-reviewed |
| [spec-kit](https://github.com/github/spec-kit) | [Report](projects/ai-spec--spec-kit.md) | source-reviewed |
<!-- coverage:end -->
