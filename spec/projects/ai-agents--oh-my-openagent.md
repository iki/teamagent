# oh-my-openagent

Source: [oh-my-openagent](https://github.com/code-yeongyu/oh-my-openagent) · Category: [ai-agents](../categories/ai-agents.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `94e954721ccb02fbcbc8bb583f9da1d244a0a06b`; commit timestamp `2026-08-17T06:41:22+09:00`; 8,286 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/code-yeongyu/oh-my-openagent/blob/94e954721ccb02fbcbc8bb583f9da1d244a0a06b/README.md)):

> We loved Anthropic models enough to get blocked. Now we are backing Codex. If you are an OmO fan but the setup felt like too much, use LazyCodex. OmO for Codex has shipped:

Build/package evidence: [package.json](https://github.com/code-yeongyu/oh-my-openagent/blob/94e954721ccb02fbcbc8bb583f9da1d244a0a06b/package.json); [packages/agents-md-core/package.json](https://github.com/code-yeongyu/oh-my-openagent/blob/94e954721ccb02fbcbc8bb583f9da1d244a0a06b/packages/agents-md-core/package.json); [packages/ast-grep-mcp/package.json](https://github.com/code-yeongyu/oh-my-openagent/blob/94e954721ccb02fbcbc8bb583f9da1d244a0a06b/packages/ast-grep-mcp/package.json); [packages/boulder-state/package.json](https://github.com/code-yeongyu/oh-my-openagent/blob/94e954721ccb02fbcbc8bb583f9da1d244a0a06b/packages/boulder-state/package.json); [packages/claude-code-compat-core/package.json](https://github.com/code-yeongyu/oh-my-openagent/blob/94e954721ccb02fbcbc8bb583f9da1d244a0a06b/packages/claude-code-compat-core/package.json)

License evidence: [LICENSE.md](https://github.com/code-yeongyu/oh-my-openagent/blob/94e954721ccb02fbcbc8bb583f9da1d244a0a06b/LICENSE.md) Classification hint: not classified; inspect source. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents**. Its category places it in the candidate set for agents, models, channels; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [models](../models.md) · [channels](../channels.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

## 2026-10-28 scoped source review

Source: [oh-my-openagent](https://github.com/code-yeongyu/oh-my-openagent); inspected saved discovery revision `43eec3ddaf64c52dceb14b3c7898195a7525e257`. Prior analyzed revision `94e954721ccb02fbcbc8bb583f9da1d244a0a06b` remains historical evidence.

**Scope:** Full tool-name normalizer, development-runtime pruner and agent-environment tests read. Runtime-pruner tests, actual hook dispatch, bootstrap/isolation scripts and source-agent loop were not audited.

The [runtime pruner](https://github.com/code-yeongyu/oh-my-openagent/blob/43eec3ddaf64c52dceb14b3c7898195a7525e257/script/omob-runtime-prune.ts) computes a separate plan, reserves a slot for the runtime being provisioned, preserves names identified as in use and skips deletion if process enumeration fails. Its ownership test is a string prefix over one process-list snapshot. That leaves enumeration completeness, executable-path representation and process-start races outside the guarantee; the child process has no explicit timeout, and the helper does not validate directory ownership through a manifest before recursive removal. This is useful lifecycle design evidence, not proof that every live runtime is protected.

The [tool-name normalizer](https://github.com/code-yeongyu/oh-my-openagent/blob/43eec3ddaf64c52dceb14b3c7898195a7525e257/packages/utils/src/tool-name.ts#L15-L27) uses the in operator on an ordinary object: inherited names such as constructor can take the special-mapping branch and return a non-string despite the declared return type. Normalize display names separately from tool identity and use own-property lookup with validated output at dispatch boundaries. The [environment tests](https://github.com/code-yeongyu/oh-my-openagent/blob/43eec3ddaf64c52dceb14b3c7898195a7525e257/script/agent-env.test.ts) check pin consistency and script text, including credential-injection markers; they do not execute isolation or establish that secrets cannot escape. No pruning, bootstrap or tests were executed.

## 2026-10-28 follow-up source review

Reviewed the frozen update from `43eec3ddaf64c52dceb14b3c7898195a7525e257` to `4c87d16a7393927afa3fbd22277e60f17ca2db81`. Earlier findings above remain historical evidence; this review is limited to the cited source and delta.

In [packages/omo-opencode/src/cli/run/runner.ts](https://github.com/code-yeongyu/oh-my-openagent/blob/4c87d16a7393927afa3fbd22277e60f17ca2db81/packages/omo-opencode/src/cli/run/runner.ts#L47-L74), The CLI runner now passes only a run-started event to its telemetry wrapper instead of resolving and passing a distinct ID itself. Telemetry is constructed with the loaded configuration flag, and its synchronous tracking exception is isolated from subsequent server connection setup. This is a narrow telemetry-boundary change.

**Harness implication and limits:** Keep reporting failures independent of task startup and own consent/identity policy in one host boundary. The wrapper implementation was not reviewed, so this call site does not establish what is transmitted, whether the configuration fully disables collection, or whether identifiers are retained. No inference, server launch, telemetry transmission or upstream tests were executed. This review is static and does not certify other changed subsystems.

## 2026-11-01 scoped source review

Reviewed frozen commit `ebaf17c7fa891322900dcc48ea5b013dcb077e34` against prior analyzed commit `4c87d16a7393927afa3fbd22277e60f17ca2db81`. Historical reviews above remain separate evidence.

The new [intervention record](https://github.com/code-yeongyu/oh-my-openagent/blob/ebaf17c7fa891322900dcc48ea5b013dcb077e34/crates/senpi-desktop-session/src/intervention/record.rs) maintains per-application input counters and a monotonic last-input timestamp. A delivered read begun after a five-second quiet period clears the unread record; waiting alone never authorizes input. Unknown/dropped events affect every watched application, and PID reuse resets state only when both known start times differ. The [worker adapter](https://github.com/code-yeongyu/oh-my-openagent/blob/ebaf17c7fa891322900dcc48ea5b013dcb077e34/crates/senpi-desktop-session/src/intervention/mod.rs) installs a check before each backend press and polls cancellation/stop while waiting. It explicitly admits unobserved paths when no input feed or app identity exists; clipboard writes are outside this app-intervention guard.

The selected [fixtures](https://github.com/code-yeongyu/oh-my-openagent/blob/ebaf17c7fa891322900dcc48ea5b013dcb077e34/crates/senpi-desktop-session/src/intervention/tests.rs) check quiet-period reads, deadline-bounded refusal, PID reuse, dropped-event effects, unknown start times, event ordering and undelivered reads. Helper-process routing exists in the record but is explicitly marked as lacking a production caller. Reuse the observation-generation and delivered-read requirement for human/agent coexistence, while exposing unavailable observation capability. Do not advertise this as universal prevention of concurrent input or a Windows/macOS backend guarantee.

**Coverage:** Read both complete new implementation modules (238 and 218 lines), fixture cases corresponding to selected diff offsets 31–190 and 418–507, and the broader test inventory. The randomized model-test body and remaining fixture cases, backend watchers and dispatch wiring were not fully reviewed. Source inspection only; no upstream tests, source programs or live providers were executed. This is a scoped architecture review, not a whole-repository correctness or security certification.

## External-update review - 2026-11-01

Reviewed `9d35580941b19d4cbe7e03710c4b5eebd1631d6a` against `ebaf17c7fa891322900dcc48ea5b013dcb077e34`.

The initial four-path expansion contains metadata changes only in the selected memory files: the [supervisor bundle](https://github.com/code-yeongyu/oh-my-openagent/blob/9d35580941b19d4cbe7e03710c4b5eebd1631d6a/packages/omo-senpi/plugin/extensions/memory-run-supervisor.mjs) changes its provenance header, while [sensitive-output](https://github.com/code-yeongyu/oh-my-openagent/blob/9d35580941b19d4cbe7e03710c4b5eebd1631d6a/packages/omo-senpi/src/components/memory/kibitzer/sensitive-output.ts), [lexer](https://github.com/code-yeongyu/oh-my-openagent/blob/9d35580941b19d4cbe7e03710c4b5eebd1631d6a/packages/omo-senpi/src/components/memory/kibitzer/sensitive-output-lexer.ts) and [shape matcher](https://github.com/code-yeongyu/oh-my-openagent/blob/9d35580941b19d4cbe7e03710c4b5eebd1631d6a/packages/omo-senpi/src/components/memory/kibitzer/sensitive-output-shapes.ts) update mirrored-version comments. The long minified supervisor line is unchanged diff context. This slice does not demonstrate a new redaction algorithm or changed runtime behavior.

A second complete targeted expansion reviews the actual [account-inventory change](https://github.com/code-yeongyu/oh-my-openagent/blob/9d35580941b19d4cbe7e03710c4b5eebd1631d6a/packages/omo-senpi/src/components/telemetry/account-inventory.ts) and [fixtures](https://github.com/code-yeongyu/oh-my-openagent/blob/9d35580941b19d4cbe7e03710c4b5eebd1631d6a/packages/omo-senpi/src/components/telemetry/account-inventory.test.ts). Claude inventory now counts stored slots marked `store: "claude-cli"`, including accounts awaiting sign-in, plus present environment slots. Empty managed-sentinel lists and retired token-based sign-in slots no longer count as accounts. Non-Claude counting remains separate. Fixtures pin the new shapes, missing/invalid engine tables, omitted personal names/emails/tokens and engine-listing parity intent.

**Harness consequence:** Model account inventory, credential presence and authenticated readiness as different observations. A counted CLI account may still require sign-in, and an environment slot is not an authenticated credential. Mirrored private engine rules need pinned-version parity fixtures; provider normalization and aggregate counts should avoid leaking account identifiers. This scoped review covers six complete selected deltas; the earlier four are metadata-only, and remaining bundled/plugin/telemetry changes were not audited. Capture provenance includes original diff hashes and frozen before/after commits, but redacted presentation is not a byte-identical source archive. No installed engine, fixture, source program or provider was executed, and no training-policy or entitlement conclusion follows from inventory.

<!-- teamagent-analysis:start -->
Analysis metadata: source [oh-my-openagent](https://github.com/code-yeongyu/oh-my-openagent); analyzed commit `9d35580941b19d4cbe7e03710c4b5eebd1631d6a`; commit date 2026-11-02T05:15:18+09:00; review date 2026-11-01T23:12:06.798Z; depth screened. [Maintenance record](../analyses/repos/ai-agents--oh-my-openagent.md).
<!-- teamagent-analysis:end -->
