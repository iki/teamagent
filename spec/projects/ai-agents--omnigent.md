# omnigent

Source: [omnigent](https://github.com/omnigent-ai/omnigent) · Category: [ai-agents](../categories/ai-agents.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `f37a484a9238d21dac71b62dd79b87e016947c19`; commit timestamp `2026-10-03T12:04:00-07:00`; 5,867 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/omnigent-ai/omnigent/blob/f37a484a9238d21dac71b62dd79b87e016947c19/README.md)):

> Omnigent is an open-source **meta-harness** that gives you a common orchestration layer over Claude Code, Codex, Cursor, OpenCode, Hermes, Pi, and the agents you write yourself: swap or combine harnesses without rewriting, enforce policies and sandboxing, and collaborate in real time from any device — terminal, browser, phone, or the native desktop app. - **📱 Work with agents from any device, including your phone.** Sessions

Build/package evidence: [.github/actions/e2e-run/claude-billing-notice/package.json](https://github.com/omnigent-ai/omnigent/blob/f37a484a9238d21dac71b62dd79b87e016947c19/.github/actions/e2e-run/claude-billing-notice/package.json); [.github/actions/setup-harness-cli/locks/claude/package.json](https://github.com/omnigent-ai/omnigent/blob/f37a484a9238d21dac71b62dd79b87e016947c19/.github/actions/setup-harness-cli/locks/claude/package.json); [.github/actions/setup-harness-cli/locks/codex/package.json](https://github.com/omnigent-ai/omnigent/blob/f37a484a9238d21dac71b62dd79b87e016947c19/.github/actions/setup-harness-cli/locks/codex/package.json); [.github/actions/setup-harness-cli/locks/pi/package.json](https://github.com/omnigent-ai/omnigent/blob/f37a484a9238d21dac71b62dd79b87e016947c19/.github/actions/setup-harness-cli/locks/pi/package.json); [.github/ci-deps/package.json](https://github.com/omnigent-ai/omnigent/blob/f37a484a9238d21dac71b62dd79b87e016947c19/.github/ci-deps/package.json)

License evidence: [LICENSE](https://github.com/omnigent-ai/omnigent/blob/f37a484a9238d21dac71b62dd79b87e016947c19/LICENSE) Classification hint: Apache-2.0. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents**. Its category places it in the candidate set for agents, models, channels; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [models](../models.md) · [channels](../channels.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

## 2026-10-28 scoped source review

Source: [omnigent](https://github.com/omnigent-ai/omnigent); inspected saved discovery revision `fd7b58b267e40ce900598222b625bf88f5d1d688`. Prior analyzed revision `f37a484a9238d21dac71b62dd79b87e016947c19` remains historical evidence.

**Scope:** Complete inner tool hierarchy plus MCP invocation/result and reconnect-classification sections (608–729, 1539–1796). Other MCP lifecycle/auth/cache code, tests and oversize runner app were not reviewed.

The [tool hierarchy](https://github.com/omnigent-ai/omnigent/blob/fd7b58b267e40ce900598222b625bf88f5d1d688/omnigent/inner/tools.py#L83-L178) generates model-facing schemas from a shallow Python type map, falling back to string for unrecognized annotations. It explicitly calls output schemas advisory, permits absent capability scopes, and describes unlimited sub-sessions when `max_sessions` is absent. These declarations require separate runtime validation, admission and bounds; a generated schema or cancellable protocol is not evidence that effects obey them.

The [MCP invocation path](https://github.com/omnigent-ai/omnigent/blob/fd7b58b267e40ce900598222b625bf88f5d1d688/omnigent/tools/mcp.py#L608-L729) serializes calls on a shared connection, binds an active session for elicitation, increments an attempt serial and clears it in a finally block. It forwards full arguments and result data to a completion observer whose retention/redaction was not reviewed. The [reconnect classifier and retry loop](https://github.com/omnigent-ai/omnigent/blob/fd7b58b267e40ce900598222b625bf88f5d1d688/omnigent/tools/mcp.py#L1539-L1728) distinguish ordinary slow-tool timeouts from missing sessions or recorded transport failure. Crucially, the source itself acknowledges that reconnecting after a lost response is at-least-once delivery and may repeat an already executed effect; without a configured read timeout, a swallowed reset can remain pending.

Teamagent should retain explicit session binding and failure classification, while requiring effect-specific retry policy and uncertain-effect receipts rather than automatic replay of arbitrary tools. The [formatter](https://github.com/omnigent-ai/omnigent/blob/fd7b58b267e40ce900598222b625bf88f5d1d688/omnigent/tools/mcp.py#L1731-L1796) preserves image envelopes and otherwise joins/serializes content without local output bounds. Schema enforcement, observer privacy, cache ownership, transport cancellation and remote idempotency remain unverified. No upstream code or tests were run.

<!-- teamagent-analysis:start -->
Analysis metadata: source [omnigent](https://github.com/omnigent-ai/omnigent); analyzed commit `fd7b58b267e40ce900598222b625bf88f5d1d688`; commit date 2026-10-27T10:48:40-07:00; review date 2026-10-28T09:27:32.685Z; depth screened. [Maintenance record](../analyses/repos/ai-agents--omnigent.md).
<!-- teamagent-analysis:end -->
