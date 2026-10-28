# anything-llm

Source: [anything-llm](https://github.com/Mintplex-Labs/anything-llm) · Category: [ai-agents](../categories/ai-agents.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `09e68e357a90973fd2b143b318b31640bee50a0b`; commit timestamp `2026-10-03T13:42:58-07:00`; 5,716 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/Mintplex-Labs/anything-llm/blob/09e68e357a90973fd2b143b318b31640bee50a0b/README.md)):

> Chat with your docs, use AI Agents, hyper-configurable, multi-user, & no frustrating setup required. Chat with your docs. Automate complex workflows with AI Agents. Hyper-configurable, multi-user ready, battle-tested—and runs locally by default with zero setup friction.

Build/package evidence: [collector/package.json](https://github.com/Mintplex-Labs/anything-llm/blob/09e68e357a90973fd2b143b318b31640bee50a0b/collector/package.json); [frontend/package.json](https://github.com/Mintplex-Labs/anything-llm/blob/09e68e357a90973fd2b143b318b31640bee50a0b/frontend/package.json); [open-computer/cli/package.json](https://github.com/Mintplex-Labs/anything-llm/blob/09e68e357a90973fd2b143b318b31640bee50a0b/open-computer/cli/package.json); [open-computer/services/interface-service/package.json](https://github.com/Mintplex-Labs/anything-llm/blob/09e68e357a90973fd2b143b318b31640bee50a0b/open-computer/services/interface-service/package.json); [open-computer/services/memory-manager/package.json](https://github.com/Mintplex-Labs/anything-llm/blob/09e68e357a90973fd2b143b318b31640bee50a0b/open-computer/services/memory-manager/package.json)

License evidence: [LICENSE](https://github.com/Mintplex-Labs/anything-llm/blob/09e68e357a90973fd2b143b318b31640bee50a0b/LICENSE) Classification hint: MIT. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents**. Its category places it in the candidate set for agents, models, channels; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [models](../models.md) · [channels](../channels.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

## 2026-10-28 scoped source review

Source: [anything-llm](https://github.com/Mintplex-Labs/anything-llm); inspected saved discovery revision `9b1fcab141000eaba9f78ed131151de04904454b`. Prior analyzed revision `09e68e357a90973fd2b143b318b31640bee50a0b` remains historical evidence.

**Scope:** Complete Telegram agent response adapter and its 267-line final-answer delivery test. Ephemeral agent implementation, sender/workspace admission, generated-file storage, formatter internals and live Telegram behavior were not audited.

The [Telegram response adapter](https://github.com/Mintplex-Labs/anything-llm/blob/9b1fcab141000eaba9f78ed131151de04904454b/server/utils/telegramBot/chat/agent.js#L282-L387) awaits pending preview sends and edits, prefers the explicit final answer over draft chunks, persists the selected text, then reconciles previews with Unicode-aware final chunks. It retries malformed HTML as plain text and removes superseded previews only after replacements are sent. Persistence precedes final delivery, so stored completion is not a delivery receipt; partial channel failure can still leave a saved answer and an incomplete visible result.

The [delivery tests](https://github.com/Mintplex-Labs/anything-llm/blob/9b1fcab141000eaba9f78ed131151de04904454b/server/__tests__/utils/telegramBot/agent.test.js#L87-L267) use a fake bot to cover late preview edits, long answers, surrogate pairs, shorter final answers, HTML expansion and failed final sends. They do not exercise real Telegram rate limits, transport ambiguity or durable replay. The adapter's streamed text, event arrays and chained edits have no local aggregate bound. Its [thought flush](https://github.com/Mintplex-Labs/anything-llm/blob/9b1fcab141000eaba9f78ed131151de04904454b/server/utils/telegramBot/chat/agent.js#L184-L220) reschedules in finally; clearing the current timer at overall completion does not stop an already in-flight flush from scheduling another timer. There is no closed-state guard or awaited flush join in this file.

Agent events are parsed without a structural schema here, and generated files are delivered by delegated storage lookup rather than a visible owner-bound handle. Teamagent should retain final-versus-preview reconciliation with bounded queues, explicit delivery states and owned cancellation, then separately validate source events, sender authority and attachment access. No agent, bot, chart renderer, filesystem export or upstream test was executed.

<!-- teamagent-analysis:start -->
Analysis metadata: source [anything-llm](https://github.com/Mintplex-Labs/anything-llm); analyzed commit `9b1fcab141000eaba9f78ed131151de04904454b`; commit date 2026-10-25T11:20:42-07:00; review date 2026-10-28T09:27:32.685Z; depth screened. [Maintenance record](../analyses/repos/ai-agents--anything-llm.md).
<!-- teamagent-analysis:end -->
