# mastra

Source: [mastra](https://github.com/mastra-ai/mastra) · Category: [ai-agents](../categories/ai-agents.md)

Review depth: **focused source review**. Snapshot `b2433eb8d90597295de0327c3756d7a2b83a65ff` (2026-10-03T13:48:39-07:00). Reviewed 2026-10-04. This assessment covers the cited implementation/contract, not every subsystem or runtime behavior.

## Finding

Durable-agent configuration exposes the difference between replayable streams and recoverable execution.

## Source evidence inspected

- [packages/core/src/agent/durable/create-durable-agent.ts, lines 38–108](https://github.com/mastra-ai/mastra/blob/b2433eb8d90597295de0327c3756d7a2b83a65ff/packages/core/src/agent/durable/create-durable-agent.ts#L38-L108)

## Observed design and algorithms

The factory contract accepts event cache, pubsub, maximum steps and snapshot policy. Cache can be disabled, and the default may be in-memory; this matters for reconnect guarantees. Pending, paused and suspended snapshots are documented as persisted by default, whereas running checkpoints require the durable-agents recovery setting. Per-topic replay can be disabled to reduce publication latency.

## Harness decision

Shortlist Mastra as an application framework alternative if its workflows, agents and memory reduce implementation effort. Independently specify the harness durability contract so an in-memory cache or disabled running checkpoint cannot silently weaken it.

## Limits and tradeoffs

This review inspected the configuration contract, not a full recovery implementation. The word durable does not imply every stream item and in-flight tool is persisted under every configuration. Remote cache latency and cleanup retention affect client catch-up.

## Validation before adoption

Kill the process during a model call, tool call, approval suspension and stream disconnect. Verify configured storage, replay retention and idempotent recovery rather than relying on type names. No tests, live inference, installation, or production operation were performed for this review. License indicator: Apache-2.0; verify the exact files and dependencies before reuse.

Related directions: [agents](../agents.md) · [memory](../memory.md) · [channels](../channels.md).

## 2026-10-28 scoped update review

Reviewed commit `cc9aff79025018752c6efceefb10d9b02c1a5075` (commit date `2026-10-27T12:48:18-05:00`). The original snapshot above remains historical evidence.

**Scope:** Complete ACP agent adapter; connection transport, MessageList/content conversion internals, authentication implementation and tests were not audited. No upstream code was executed.

The [ACP agent adapter](https://github.com/mastra-ai/mastra/blob/cc9aff79025018752c6efceefb10d9b02c1a5075/agent-sdks/acp/src/agent.ts#L125-L198) forwards a caller abort signal to the connection and handles a text promise rejection when consumers read only the stream. However, its ReadableStream has no cancel handler or pull-based backpressure, and it retains text chunks and tool results for the entire run. It emits finish chunks before awaiting onFinish; if that callback throws, the catch branch calls onFinish again with an error and errors the stream after finish was already observed. Teamagent should give completion one settlement owner, keep callback failures separate from execution outcomes and connect consumer cancellation to resource cleanup. Connection-level cancellation and cleanup were not inspected.

The [ACP event mapping](https://github.com/mastra-ai/mastra/blob/cc9aff79025018752c6efceefb10d9b02c1a5075/agent-sdks/acp/src/agent.ts#L250-L327) preserves tool-call IDs and marks failed update results as errors, but only tool_call_update emits a result: an initial tool_call carrying terminal status is translated solely as a call. Display titles take precedence when deriving tool names, and nonterminal title/status text is emitted as argsTextDelta. These fields should remain presentation/status data rather than canonical tool identity or argument bytes. The returned stream result exposes an empty toolResults array even though callback results collect actual tool outcomes, so downstream consumers need an explicit source of authoritative tool state.

The [finish helpers](https://github.com/mastra-ai/mastra/blob/cc9aff79025018752c6efceefb10d9b02c1a5075/agent-sdks/acp/src/agent.ts#L329-L380) always supply stop and zero token usage, including the callback result carrying an error. These are adapter defaults, not measured usage or proof of successful task completion. The [prompt conversion](https://github.com/mastra-ai/mastra/blob/cc9aff79025018752c6efceefb10d9b02c1a5075/agent-sdks/acp/src/agent.ts#L200-L247) flattens message contents into one newline-separated string and prepends instructions, losing role boundaries in the transmitted representation; resumptions are explicitly unsupported. A Teamagent bridge should expose such losses and unsupported operations instead of implying parity with a native agent runtime.

**Verification limit:** source inspection only; no upstream tests or provider calls were executed. This scoped review does not certify every file in the repository.

<!-- teamagent-analysis:start -->
Analysis metadata: source [mastra](https://github.com/mastra-ai/mastra); analyzed commit `cc9aff79025018752c6efceefb10d9b02c1a5075`; commit date 2026-10-27T12:48:18-05:00; review date 2026-10-28T09:27:32.685Z; depth source-reviewed. [Maintenance record](../analyses/repos/ai-agents--mastra.md).
<!-- teamagent-analysis:end -->
