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

## October source refresh: request and completion boundaries

The refreshed [Pi report](projects/ai-agents--pi.md) ([source](https://github.com/earendil-works/pi)) supports an explicit context/model preparation boundary and a second steering check after long preparation. Keep newly arrived user corrections visible before the next request. Fail tool calls emitted in a length-truncated response even when their partial arguments happen to decode; completion reason is part of the execution gate.

The refreshed [Paseo report](projects/ai-agents--paseo.md) ([source](https://github.com/getpaseo/paseo)) retains capability-specific provider contracts and named refresh activities. Distinguish deadline notification, cooperative abort, and process cleanup. A discovered provider or a resolved Promise does not independently establish equivalent policy enforcement or task correctness.

## Additional scoped review references

These catalog associations provide navigation to scoped source reviews. Each report records its inspected revision, findings and exclusions; inclusion here does not establish a capability or an adoption decision.

- [claude-code](analyses/unreviewed/ai-agents--claude-code.md)
- [hanzo-cli](analyses/unreviewed/ai-agents--hanzo-cli.md)
- [hanzo-dev](analyses/unreviewed/ai-agents--hanzo-dev.md)
- [hanzo-hips](analyses/unreviewed/ai-agents--hanzo-hips.md)
- [hanzo-sdk-ts](analyses/unreviewed/ai-agents--hanzo-sdk-ts.md)
- [hanzo-sdk](analyses/unreviewed/ai-agents--hanzo-sdk.md)
- [murage](analyses/unreviewed/ai-agents--murage.md)
- [openrig](analyses/unreviewed/ai-agents--openrig.md)
- [trellis](analyses/unreviewed/ai-agents--trellis.md)
- [deepinfer](analyses/unreviewed/ai-model-run--deepinfer.md)
- [hanzo-engine](analyses/unreviewed/ai-model-run--hanzo-engine.md)
- [rea](analyses/unreviewed/ai-security--rea.md)
- [assets-icons.better](analyses/unreviewed/ai-skills--assets-icons.better.md)
- [render-anatomy](analyses/unreviewed/ai-skills--render-anatomy.md)

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


## Source refresh: 2026-10-27 — ownership and completion

The focused [Emdash review](analyses/unreviewed/ai-agents--emdash.md) ([source](https://github.com/generalaction/emdash)) adds a host-owned conversation/workspace pattern and a concrete warning: its automation executor records success when the session is launched. Teamagent must retain distinct accepted, launched, completed and verified states, and distinguish host task IDs from provider continuation tokens. Worktree ownership checks do not establish process or network isolation.

The refreshed [Pi report](projects/ai-agents--pi.md) ([source](https://github.com/earendil-works/pi)) separates loss-tolerant streamed progress from durable state, makes handoff ordering explicit and retains known deferred provider jobs across interrupted polling. The [Paseo report](projects/ai-agents--paseo.md) ([source](https://github.com/getpaseo/paseo)) shows idle collection revalidating an entire agent family and retaining ownership until shutdown succeeds. Use these as conformance cases for the adopted adapter contract; they are not evidence of a new Teamagent runtime integration or measured advantage.

## Continued source review: 2026-10-27 — evidence classes

Treat a documentation-only release feed as a source of adapter acceptance cases, not implementation proof. The [Antigravity CLI review](projects/ai-agents--antigravity-cli.md) ([source](https://github.com/google-antigravity/antigravity-cli)) adds cases for error-classified failed tools, principal-bound OAuth state, sidecar cleanup and multi-repository isolation, while retaining an opaque-agent classification. A reported release fix does not establish account eligibility, a training exclusion or Teamagent conformance.

Deployment evidence is also separate from runtime evidence. The [Electric delta](projects/ai-agents--electric.md) ([source](https://github.com/electric-sql/electric)) changes image destinations while retaining exact source-commit propagation. Pin source revisions and artifact digests independently of registry names and mutable tags. The [Claude Code Best delta](projects/ai-agents--claude.analysis.best.cn.md) ([source](https://github.com/claude-code-best/claude-code)) changes only a contributor graphic; it cannot promote advertised workflows, channels or permissions into verified runtime capabilities. Keep passive detection separate from installer and post-install execution.

## Continued source review: 2026-10-27 — discovery, recovery and evidence

Separate discoverability, configuration, authentication and entitlement. [MMX](projects/ai-agents--mmx-cli.md) ([source](https://github.com/MiniMax-AI/cli)) offers passive PATH/environment detection and a prepared configuration transaction with conflict-aware rollback; its process-local token refresh coordination is not a shared credential store. [Open Interpreter](projects/ai-agents--openinterpreter.md) ([source](https://github.com/openinterpreter/openinterpreter)) separates product version from service compatibility profile. Neither a file, environment marker, profile string nor API key establishes the account's permitted model routes. [ClosedLoop](projects/ai-agents--closedloop-ai.md) ([source](https://github.com/closedloop-ai/closedloop-ai)) further distinguishes required plugins, installed files, enabled state and failed verification reads; optional judges/self-learning are no longer prerequisites in the reviewed onboarding lists.

Separate a submitted action from waiting for its result. [Orchard](projects/ai-agents--orchard.md) ([source](https://github.com/microsoft/Orchard)) avoids resending an ambiguous command to the same sandbox, but its evaluation retries can start a new pod. Teamagent needs durable operation identity and reconciliation before external-effect replay; a fresh filesystem does not undo a remote write. [Hydra](projects/ai-agents--hydra.md) ([source](https://github.com/timtimeshock/Hydra)) is a counterexample for defaults: its recovery may switch unavailable local/custom agents to cloud, and queue shelving is not process or filesystem isolation. Keep provider/data-policy constraints effective across fallback and recovery.

Treat inputs and evidence as versioned objects with bounds. [TypeSafe SDK](projects/ai-agents--typesafe-sdk-js.md) ([source](https://github.com/typesafe-ai/typesafe-sdk-js)) snapshots requests and asset bytes, but host-level deadlines, size limits, redaction and upload policy remain necessary. [Txcript](projects/ai-agents--skillsync-txcript.md) ([source](https://github.com/skillsynchq/txcript)) provides a cold scan and compressed-session import patterns; retain explicit source coverage and bounded decompression, and do not transfer authorization with a transcript. The [Forgecode maintenance delta](projects/ai-agents--forgecode.md) ([source](https://github.com/antinomyhq/forgecode)) also shows why comment-only implementation edits do not make dependency upgrades behavior-free.

Preserve evidence classes when synthesizing architecture guidance. The [VILA-Lab analysis update](projects/ai-agents--claude.dive-into-claude-code.md) ([source](https://github.com/VILA-Lab/Dive-into-Claude-Code)) narrows historical trust/resume claims and separates checkpoints from effect recovery. Its vendor and research citations remain secondary leads until the relevant primary versions are verified; they cannot substitute for inspected code or executed acceptance tests. These source-review consequences guide the adapter contract; they do not announce new implemented Teamagent integrations.

## Continued source review: 2026-10-28 — authority, recovery and verification

Keep authority effective on every execution branch. The [ENZO review](projects/ai-agents--enzo.md) finds a permission-error log triggering an unrestricted retry; the [FrontierAgent review](projects/ai-agents--apodex-frontier-agent.md) finds a local write fallback that does not reuse the final containment check. Neither failure nor a tool's suggested recovery grants permission. Require one host-owned policy check at the actual effect boundary, including retries and alternate transports, and measure byte limits on encoded bytes. [Gastown's registry changes](projects/ai-agents--gastown.md) provide a complementary pattern: copy nested adapter configuration on registration and retrieval so callers cannot mutate another task's policy through shared references.

Persist the selected conversation head separately from the append-only entry history. [Yoagent's session implementation](analyses/unreviewed/ai-agents--yoagent.md) retains branches but restores the final serialized entry as the head; a seek without another append is not preserved. Its cancellation and partial-result handling also reinforce explicit interrupted, bounded and unverified outcomes, aggregate child usage and bounded progress queues. An aborted future does not roll back external effects.

Keep execution verdicts distinct from independent checks. [Agentic Stack](projects/ai-agents--agentic-stack.md) can assign a successful quality value from dispatch checks, while the reviewed [math RAG example](projects/ai-agents--awesome-llm-apps.md) uses answer-token matching and returns a second unverified generation after validator failure. These are implementation examples, not calibrated correctness evidence. Bound output while reading it rather than after capture, retain structured source provenance, and isolate concurrent writers before admitting parallel work.

Diagnostics need the same confidentiality boundary as prompts. [Feynman's telemetry path](projects/ai-agents--feynman.md) can transmit tool/provider error text after only home-path replacement; a telemetry event name does not make its content non-sensitive. Apply field-level redaction and explicit collection policy. [Pentagi's maintenance delta](projects/ai-agents--pentagi.md) supplies narrower practices: resolve configuration assets relative to the selected configuration and revalidate persisted prompt overrides against current variables. These requirements derive from scoped source inspection; no upstream tests, provider calls or new Teamagent integrations were exercised.

## Continued source review: 2026-10-28 — execution contracts and measured evidence

Treat agent-call convenience APIs as trusted adapters, not authorization boundaries. The [Antigravity Python SDK](projects/ai-agents--antigravity-sdk-python.md) retains original values when argument coercion fails, while [DSPy's direct call path](projects/ai-agents--dspy.md) can resolve ambient callables and bypass its Tool wrapper. [Open Multi Agent](projects/ai-agents--open-multi-agent.md) provides useful validation/gate/cancellation ordering, but an optional hook is not mandatory host policy. Require one immutable registry and one validated effect boundary, with protected host arguments and authorization bound to the final call.

Bound every lifecycle stage independently. [AX](projects/ai-agents--ax.md) keeps its runner alive after command exit and can launch after workspace preparation fails. [Foreman's cleanup](projects/ai-agents--foreman.md) awaits termination before its grace timeout, while [Flue's local output-limit path](projects/ai-agents--flue.md) continues collecting output after sending TERM. The [Molt runner](projects/ai-agents--nvidia-nemo-labs-molt.md) preserves truncated episodes and attempts teardown even after setup failure, but cleanup has no explicit deadline there. Preparation, dispatch, output retention, cancellation, resource release and independent task verification need distinct outcomes and bounds.

Keep requested and effective permissions separate across platforms and upgrades. [Pipali](projects/ai-agents--pipali.md) recomposes stored user additions with current shipped defaults and translates policy differently by platform. [Claurst](projects/ai-agents--claude.fork.claurst.md) reports an effective sandbox mode of off when Seatbelt is unavailable. [Cloudflare AI's wrapper deprecation](projects/ai-agents--ai.cloudflare.md) documents changed fallback semantics in its replacement API. Reuse authorization only when the effective destinations, grants and protection capabilities still match its scope; these source observations do not select new Teamagent dependencies.

The [Harness2 review](analyses/unreviewed/ai-agents--harness2.md) verifies a useful separation in implementation: failed selection fallbacks remain unsuccessful, are excluded from reflection/library admission, and are not submitted to the judge. Judge failure remains ungraded rather than a zero score. Publish missing-result coverage alongside score denominators and keep full adopted trees/lessons separate from evidence of correctness or executable trust. The [Hello Agents paper example](projects/ai-agents--hello-agents.md) reinforces why generated completion and indexed-reference counts cannot establish citation support.

Preserve identity as well as content provenance. The current tree behind the [historically named Claude Code 2.1.88 source record](projects/ai-agents--xx-2604-claude.source.2-1-88.2026-03-31.md) identifies itself as Leanmcp Skills & AI Gateway; it cannot substantiate current Anthropic internals. [Agent Zero's persistence](projects/ai-agents--agent-zero.md) similarly distinguishes saved local state from attempted remote deletion. Retain source/version identity and explicit unknown results instead of transferring historical labels or cleanup intent into current evidence.

## Continued source review: 2026-10-28 — settlement, state and independent checks

Require explicit settlement beyond the end of a stream. [OpenAI Agents Python](projects/ai-agents--openai-agents-python.md) distinguishes immediate and after-turn cancellation, while [OpenAI Agents JS](projects/ai-agents--openai-agents-js.md) can return a timeout before the underlying tool finishes. [Berd](projects/ai-agents--berd.md) fences abandoned operations by backend generation; [DeepCode](projects/ai-agents--deepcode.md) distinguishes detaching observation from stopping a service-owned goal. Retain operation identity, late failures and resource-release outcomes, with separate bounds for waiting and cleanup. [Cloudflare Agents](projects/ai-agents--agents.cloudflare.md) also demonstrates why a done result must not hide logged cleanup failures.

Preserve complete evidence of cost and verification scope. [Agentfield](projects/ai-agents--agentfield.md) distinguishes missing pricing from zero but does not retain every transient attempt in its final rollup. [Open CoDesign](projects/ai-agents--open-codesign.md) separates blocking errors from advisory layout warnings, yet callback configuration alone can overstate whether a particular artifact received runtime verification. [Alibaba OpenCodeReview](projects/ai-agents--open-code-review.alibaba.md) reports some omitted files only as warnings. Record all attempts and selected-source coverage, bind checks to artifact versions, and keep unknown/skipped results explicit. [GLaDOS](projects/ai-agents--glados.md) further distinguishes detected accelerator availability from measured execution.

Treat state and extension boundaries as runtime contracts. [ADK JS](projects/ai-agents--adk-js.md) shows the limits of optional validation, namespace exemptions and shallow state references. [Nanobot](projects/ai-agents--nanobot.md) separates restrictive temporary-session policy from hook behavior: optional hooks can swallow failures and still receive private context. [ComfyUI](projects/ai-agents--comfyui.md) supplies explicit missing/incompatible/failed host states, but loading its entry point executes trusted installed code. [Anton](projects/ai-agents--anton.md) illustrates ambient process-environment ownership during session rebuilding. Use immutable validated deltas, required policy hooks, explicit confidential-data scope and versioned host capabilities rather than inferring safety from a helper's name.

Authorize network effects at the transport boundary. [Astron's outbound guard](projects/ai-agents--astron-agent.md) distinguishes checking a DNS answer from checking the address actually used to create a socket. [Vercel AI SDK OAuth](projects/ai-agents--ai-sdk.vercel.md) separately binds an existing secret to its issuing authority, preserving that binding across refresh invalidation. An endpoint allowlist does not grant authority to receive any credential, and discovery metadata cannot replace a trusted binding. These are source-derived requirements and counterexamples; no new Teamagent integration or upstream execution was verified.

## Continued source review: 2026-10-28 — validated state and durable authority

Validate the final value that will cross the effect or persistence boundary. [Eve](projects/ai-agents--eve.md) passes inputs through when local schema construction or validation fails; [ADK Python](projects/ai-agents--adk-python.md) validates assignments while nested mutation tracking can bypass schema checks or withdraw non-JSON writes from the pending delta. [God's Eye View](projects/ai-agents--gods-eye-view.md) rejects unsupported schema vocabulary and reuses one interceptor chain for nested tools, but exposed mutable schema objects and recursive calls still require ownership and work limits. Keep unsupported validation explicit, retain immutable validated values and apply one mandatory host policy at dispatch.

Keep shared-operation coordination separate from bounded admission and revocation. [ADK Go](projects/ai-agents--adk-go.md) shares lazy initialization while letting individual waiters cancel, yet a non-cooperative initializer can outlive its cancellation timer. [Future AGI](projects/ai-agents--future-agi.md) coalesces warm-cache database refreshes after launching a goroutine per hit. A single shared query does not bound queued callers, and cached credentials require explicit revocation/generation semantics. [Microsoft Agent Framework](projects/ai-agents--agent-framework.ms.md) addresses connection-acceptance ownership but also replays a tool after connection loss without establishing that the original effect did not occur. Preserve operation receipts and reconcile ambiguous effects before replay.

Separate reusable agent definitions, versioned configuration and active participants. [Dify](projects/ai-agents--dify.md) represents these separately from workspace and backend resource identity; its table comments about immutability and secret exclusion still require service-level enforcement. [gstack](projects/ai-agents--gstack.claude.garrytan.md) complements this with explicit image-save/recovery accounting and named approval targets. Bind approval to validated content/version and record failed persistence even when paid bytes were received; a recovery attempt is not a durability guarantee.

Retain source evidence classes in architecture claims. [Learn Harness Engineering](projects/ai-agents--learn-harness-engineering.md) now labels its continuity exercise as teaching simulation and withdraws unsupported earlier percentages. Its progress records, decision rationale and verification checkpoints remain useful design examples without becoming measured causal results or a reason to retain private model reasoning. [MLflow](projects/ai-agents--mlflow.md) likewise distinguishes advisory agent detection from authenticated identity, and a selected list of omitted secret fields does not prove every trace field safe. These are source-derived acceptance cases, not newly implemented or executed Teamagent integrations.

## Continued source review: 2026-10-28 — settlement and exact authority

An admission pause, cancellation request, terminal execution outcome and cleanup acknowledgement are separate facts. [Hermes Agent](projects/ai-agents--hermes-agent.md) pauses new work without killing existing work and can return an intended marker path after failed writes; [Foundry](projects/ai-agents--promptise-foundry.md) can mark a session stopped before cleanup fails. [Openbot](projects/ai-agents--openbot.md) detects lease loss without itself fencing execution or cancelling pending renewals, while [Oh My Pi](projects/ai-agents--oh-my-pi.md) records an abandoned close explicitly. Retain verified state transitions, resource ownership and uncertain effects, with bounded cleanup and independent fencing where overlapping owners are possible. A stopped waiter or dropped future does not certify that an external effect ceased.

Require one settlement owner for each run. [Mastra's ACP adapter](projects/ai-agents--mastra.md) can publish finish before a callback fails and invokes that callback again on the error path; it also substitutes stop and zero usage for unavailable outcomes. [Odysseus](projects/ai-agents--odysseus.md) instead binds subscribers to the exact run object and delays terminal delivery until the wrapped generator unwinds, but its process-local replay and predecessor wait remain unbounded. [Multica](projects/ai-agents--multica.md) usefully declares terminal observation, cleanup and supplemental-input readiness separately; provider compliance still needs implementation evidence. Preserve unavailable usage and unsupported resumptions rather than presenting defaults as measurements.

Keep canonical tool identity, arguments, policy and presentation data distinct. [Ruflo](projects/ai-agents--claude.ruflo.md) classifies a fixed set of bare tool names; [Mastra](projects/ai-agents--mastra.md) derives tool names and argument deltas from mutable titles/status. [HarnessRouter](projects/ai-agents--harnessrouter.md) auto-allows permission choices under an assumed outer isolation boundary and can silently remove arguments absent from a closed schema. None of those transformations establishes authorization. [Fuigo](projects/ai-agents--fuigo.md) exposes a mid-session policy update method that is a no-op, while [Cezar](projects/ai-agents--cezar.md) illustrates residual credential capabilities in curated environments. Reject unsupported policy changes explicitly, bind effective identity at dispatch and review inherited sockets, paths and provider variables as capabilities.

A valid review artifact is not an independent correctness verdict. [DeepSeek Harness](projects/ai-agents--deepseek-harness.md) checks canonical persistence explanations and reachable format coverage, with migration/runtime behavior outside that scope. [CodeAF](projects/ai-agents--codeaf.md) separates read and answer deadlines and locally validates an audit schema; [TanStack AI](projects/ai-agents--ai.tanstack.md) rechecks PR identity around writes but uses model/scanner verdicts without an independent test in the reviewed branch. Preserve exact input and environment provenance, validate external response shapes, and define a semantic acceptance oracle distinct from model completion. Foundry's shallow in-memory checkpoint copies also show why recovery evidence needs immutable persistent snapshots.

Budget and credential recovery need ownership and partial-state reporting. [Paperclip](projects/ai-agents--paperclip.md) binds a held reservation to company, agent, run and project, distinguishes budget-owned pauses from manual pauses, and labels its handoff recheck as supplemental rather than atomic admission. [Kilocode](projects/ai-agents--kilocode.md) compares before credential invalidation, but converts unreadable stores to empty state; a subsequent update can overwrite unavailable data. Keep reservation generations, concurrent exposure, unavailable storage and incomplete cleanup explicit. These are scoped source-derived design requirements; no upstream runtime or provider was exercised.

## Continued source review: 2026-10-28 — bounded execution and effect receipts

Bound admission, startup, execution and cleanup separately. [Codewhale](projects/ai-agents--deepseek-tui.md) starts tool timeouts after lock acquisition and bypasses locking for reentrant calls without tracking held mode; [Cline](projects/ai-agents--cline.md) starts its host timeout after startup may already have executed a turn. [bb](projects/ai-agents--bb.md) separates guest computation, memory, lifetime and host-call budgets, but aborts without joining host effects. [Jan](projects/ai-agents--jan.md) has an unbounded callback queue and a thread per host tool; an old turn handle interrupts the current session turn. Apply exact run identity, bounded admission and queues, startup deadlines and explicit resource settlement. The bb executable-input interface does not alter Teamagent's existing no-input-evaluation rule.

Retain the effect receipt even when response construction fails. [Gemini CLI](projects/ai-agents--gemini-cli.md) serializes recalculation and writing, but later display/context errors can be reported as file-write failure after bytes were already written. [Cloudflare OS](projects/ai-agents--cloudflare-os.md) awaits a step persistence hook before continuing and preserves completed steps when cancellation arrives; its transaction implementation and external effects remain outside the reviewed range. [LoopX](projects/ai-agents--loopx.md) rechecks exact goal instances and paths under coordinated locks before archive movement, but cross-filesystem movement still needs partial-state recovery. Bind approved input, effect identity, observed persistence and cleanup in one recoverable operation record without retrying an already-applied effect blindly.

Measure progress and verification with the right evidence. [Gas City's circuit breaker](projects/ai-agents--gascity.md) treats changed work-status signatures as progress and rejects stale reset generations; metadata movement is not independently accepted work, and future timestamps or retained identity history require validation and bounds. [Mercury Agent's evaluation harness](projects/ai-agents--mercury-agent.md) records which tool outputs are fixtures, but missing fixtures run real tools, auto-approval is enabled and fake timers suppress ordinary deadlines. Keep deterministic provider fixtures while separately testing authorization, timeout/cancellation and semantic acceptance. Do not label replay side-effect-free without checking every fallback.

Keep provider routing separate from model labels and discovery hints. [Codewhale](projects/ai-agents--deepseek-tui.md) requires explicit provider authority before resolving model text, while pass-through/default capabilities remain assumptions. [Kimi Code](projects/ai-agents--kimi-code.md) retains region-selection provenance, but a regional label can differ from the actual custom credential slot or relay, and some content endpoints are shared. The [OpenClaude catalog alias](projects/ai-agents--claude.fork.openclaude.md) adds a Gemini credential-helper scope at the same canonical revision as the other OpenClaude entry; it is not independent corroboration. File presence, cached ADC results, declared capabilities and region defaults must not substitute for validated account, destination, expiry and effective grant evidence.

Optional hooks and typed tool builders require a mandatory host boundary. [Buzz](projects/ai-agents--buzz.md) deliberately drops optional hook errors and delegates channel membership after authentication. [Copilot SDK's Rust adapter](projects/ai-agents--copilot-sdk.md) decodes typed arguments but can silently omit unsupported result blocks; [Codewhale](projects/ai-agents--deepseek-tui.md) stores schemas while its registry checks kind and a handler-supplied mutation flag. Treat schema support, authentication, effect authorization and result completeness as distinct checks, with explicit unsupported/partial states. These scoped reviews did not run upstream providers, runtimes or tests.
## Follow-up source review: 2026-10-28 — owned context and effective execution

Make context maintenance follow resource ownership. [ADK Python](projects/ai-agents--adk-python.md) inherits token-threshold compaction into ephemeral nested sessions while skipping summaries of sessions about to be discarded and leaving parent plugins open. [Microsoft Agent Framework](projects/ai-agents--agent-framework.ms.md) similarly separates owned and caller-supplied clients during close. [ADK Go](projects/ai-agents--adk-go.md) distinguishes caller deadlines from upload deadlines, but its wait still relies on the offloader returning. [BB](projects/ai-agents--bb.md) bounds recognized compaction-rejection retries without bounding the compaction wait itself. The host contract therefore needs separate context, execution, waiting and cleanup budgets, with unresolved cleanup retained in the result.

Preserve the original conversation separately from every provider projection. [AnythingLLM](projects/ai-agents--anything-llm.md) drops unanswered prompt/response pairs to avoid blank assistant messages; that compatibility projection must not erase uncertain turns from durable history. [CamelAI](projects/ai-agents--camelai.md) normalizes legacy model families, while [Vercel AI SDK](projects/ai-agents--ai-sdk.vercel.md) binds a search capability to exact endpoint URLs. Record requested and effective model/endpoint identity, then evaluate account access, cost and data policy again. Neither a model-name mapping nor a compatibility flag is verified entitlement or training exclusion. [OpenClaude's search changes](projects/ai-agents--claude.fork.openclaude.md) also show why private transcript excerpts must be excluded from parser/provider diagnostics.

Apply restrictions at the actual effect boundary and reject unsupported imported rules. [ADK JS](projects/ai-agents--adk-js.md) now filters MCP tools even without context, but visibility is still separate from authority. [DeepCode](projects/ai-agents--deepcode.md) refuses deny-list syntax it cannot enforce and includes restrictions in runtime identity. [Astron Agent](projects/ai-agents--astron-agent.md) validates plugin schemas with remote reference loading disabled, yet stream bounds and telemetry confidentiality remain separate requirements. [DeepSeek Harness](projects/ai-agents--deepseek-harness.md) compares requested filesystem mode with standing policy; the inspected [Codewhale REPL](projects/ai-agents--deepseek-tui.md) gives model code a process and startup protocol without establishing OS confinement. Syntax validation, a tool filter, a child process and a configured sandbox mode are different evidence classes.

Do not infer operational truth from convenient metadata. [Ruflo](projects/ai-agents--claude.ruflo.md) accounts for proposed claim transfers within a plan, but application still needs transactional capacity admission; a readable session file is not a live lease. [Gas City's cache checks](projects/ai-agents--gascity.md) include launch overrides and refuse unknown multi-store routing before writing. [Future AGI](projects/ai-agents--future-agi.md) leaves unavailable project types unknown and preserves sender hints, which must not become authenticated identity. [Dify](projects/ai-agents--dify.md) separates stop outcome labels, but successful stop signaling can coexist with unfinished cleanup. Preserve exact identities, unavailable results and the distinction between requested termination, observed termination and independently verified task completion.

These are bounded committed-source findings, not newly implemented Teamagent integrations. The [Cloudflare Agents](projects/ai-agents--agents.cloudflare.md), [Forgecode](projects/ai-agents--forgecode.md) and [Gastown](projects/ai-agents--gastown.md) follow-ups are dependency maintenance; [DSPy](projects/ai-agents--dspy.md) changes documentation indexing, and [ENZO](projects/ai-agents--enzo.md) changes only a traffic-report date. None resets earlier runtime findings or establishes measured improvement. [Gstack's restamping](projects/ai-agents--gstack.claude.garrytan.md) further reinforces refusing an unavailable diff and retaining base-owned lines, while acknowledging that text equality is not exact authorship proof.

The remaining agent reviews reinforce explicit control states. [OpenCode](https://github.com/anomalyco/opencode) ([review](projects/ai-agents--opencode.md)) permits an ask result through its not-denied assertion, so that helper cannot be used as execution authorization. [Odysseus](https://github.com/pewdiepie-archdaemon/odysseus) ([review](projects/ai-agents--odysseus.md)) closes an alternate route for agent-driven tool re-enabling; every route to the same effect needs the same authority. [OpenBot](https://github.com/CopilotKit/openbot) ([review](projects/ai-agents--openbot.md)) distinguishes a needs-conversation preflight refusal and hashes action scope/arguments. [Onyx](https://github.com/onyx-dot-app/onyx) ([review](projects/ai-agents--onyx.md)) distinguishes human results, approvals and child waits in its contract, without that declaration alone proving scheduler behavior.

Cleanup and stale-result protection need separate budgets and scope. [OpenAI Agents Python](https://github.com/openai/openai-agents-python) ([review](projects/ai-agents--openai-agents-python.md)) supplies cooperative cleanup grace rather than a hard shutdown bound. [Pipali](https://github.com/khoj-ai/pipali) ([review](projects/ai-agents--pipali.md)) fences old UI callbacks by active handle while draining a stopped run; the same predicate does not undo external effects. [World Model Optimizer](https://github.com/experientiallabs/world-model-optimizer) ([review](projects/ai-agents--world-model-optimizer.md)) retains ownership when closing is incomplete, while the inspected startup cleanup retries remain unbounded. Retain unresolved ownership, distinguish stop requested from reaped, and impose an independently enforceable outer limit where required.

Preserve provenance through compatibility repairs and memory selection. [HarnessRouter](projects/ai-agents--harnessrouter.md) associates continuation signatures with producer models even after tool-call IDs change, but its process-wide map is not tenant/session isolation. [Kimi Code](https://github.com/MoonshotAI/kimi-code) ([review](projects/ai-agents--kimi-code.md)) retains usage/provenance identifiers and absent-versus-null semantics across wire conversion. [Jan](https://github.com/janhq/jan) ([review](projects/ai-agents--jan.md)) deduplicates recalled answers against the current conversation and bounds excerpts; [Mastra](https://github.com/mastra-ai/mastra) ([review](projects/ai-agents--mastra.md)) includes effective scope/thresholds in cache identity. [Mateclaw](https://github.com/mateaix/mateclaw) ([review](projects/ai-agents--mateclaw.md)) retains multiple successful outputs, with length/prefix comparison weaker than full-content hashing. The harness must retain original evidence while identifying every projection, cache policy and deduplication rule used.
