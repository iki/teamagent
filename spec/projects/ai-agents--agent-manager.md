# agent-manager

Source: [agent-manager](https://github.com/YoanWai/agent-manager) · Category: [ai-agents](../categories/ai-agents.md)

Original review depth: **inventory / README screening only**. The dated update review below has its own explicit scope. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `d1dba9fcafc7eb6756bb173e2b73508af1bf778e`; commit timestamp `2026-10-03T22:57:02+03:00`; 365 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/YoanWai/agent-manager/blob/d1dba9fcafc7eb6756bb173e2b73508af1bf778e/README.md)):

> Claude Code, Codex, OpenCode, Grok, Gemini CLI, Antigravity CLI, Pi, Command Code, Hermes Agent, Muse Code, and Oh My Pi run side by side. Each tool runs in its own persistent tmux session. agent-manager is a thin layer over the CLIs you already have. Each session launches your own installed tool as-is: your login, your subscription, your config files, your MCP servers, and every feature the tool ships all carry over, exactly as they behave in a plain terminal.

Build/package evidence: [go.mod](https://github.com/YoanWai/agent-manager/blob/d1dba9fcafc7eb6756bb173e2b73508af1bf778e/go.mod)

License evidence: [LICENSE](https://github.com/YoanWai/agent-manager/blob/d1dba9fcafc7eb6756bb173e2b73508af1bf778e/LICENSE) Classification hint: Apache-2.0. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents**. Its category places it in the candidate set for agents, models, channels; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [models](../models.md) · [channels](../channels.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

## 2026-10-28 scoped update review

Reviewed commit `e6d9ec6c3324cb67348d2c3a5114923c950acbcd` (commit date `2026-10-27T19:17:58+02:00`). The original snapshot above remains historical evidence.

**Scope:** Complete CLI session command surface plus pinned additional message delivery, mailbox facade and bounded wait modules; terminal driver, poller, identity resolver, database queue implementation and end-to-end scenarios were not audited.

The [message service](https://github.com/yoanwai/agent-manager/blob/e6d9ec6c3324cb67348d2c3a5114923c950acbcd/internal/sessioncmd/messages.go#L83-L230) queues inter-agent messages instead of typing immediately into a pane that may contain an approval dialog. It bounds message bytes, rejects undeliverable targets, preserves a message ID and exposes queued/held/delivered/dropped/answered states. A reply marks prior messages read as a heuristic; it is not proof that their requested work succeeded. External sender names are bounded labels and the no-session quick-type path is a caller convention, not authenticated cross-machine identity in these functions. The underlying caller resolver and actual delivery poller remain outside scope.

The immediate type path distinguishes a paste that may have started from a definitely failed send and avoids an automatic repeat. This is useful ambiguous-effect handling. However, queue insertion is followed by acknowledgement/count/manager-state operations that can return errors after insertion, and immediate typing can succeed before its record write fails. Teamagent needs durable partial-outcome receipts so callers do not interpret those failures as permission to replay. The [held-state check](https://github.com/yoanwai/agent-manager/blob/e6d9ec6c3324cb67348d2c3a5114923c950acbcd/internal/sessioncmd/messages.go#L282-L318) reuses the configured screen classifier to report dialogs, archived/dead sessions and errors, but this review does not establish classifier accuracy under every terminal rendering.

The [wait implementation](https://github.com/yoanwai/agent-manager/blob/e6d9ec6c3324cb67348d2c3a5114923c950acbcd/internal/sessioncmd/wait.go#L70-L193) caps requested waits at five minutes, uses a separate expiry timer, checks caller cancellation and rechecks pane liveness before returning. It prevents an old resting status from satisfying a wait while a newer handoff is still queued or has been typed since the recorded status. Reaching a terminal status remains distinct from verifying task correctness, and synchronous database/driver work can delay observation of the timer. The [CLI](https://github.com/yoanwai/agent-manager/blob/e6d9ec6c3324cb67348d2c3a5114923c950acbcd/internal/cli/session.go) preserves omitted versus explicitly empty options and returns wait data before an unsuccessful-wait error. The checkout had advanced when additional files were exported; every link and conclusion here remains scoped to the original pinned commit.

**Verification limit:** source inspection only; no upstream tests or provider calls were executed. This scoped review does not certify every file in the repository.

<!-- teamagent-analysis:start -->
Analysis metadata: source [agent-manager](https://github.com/YoanWai/agent-manager); analyzed commit `e6d9ec6c3324cb67348d2c3a5114923c950acbcd`; commit date 2026-10-27T19:17:58+02:00; review date 2026-10-28T08:47:42.123Z; depth screened. [Maintenance record](../analyses/repos/ai-agents--agent-manager.md).
<!-- teamagent-analysis:end -->
