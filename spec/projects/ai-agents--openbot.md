# openbot

Source: [openbot](https://github.com/CopilotKit/openbot) · Category: [ai-agents](../categories/ai-agents.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `cb5dc32a44517622c6db4e527e61d3abb389b43c`; commit timestamp `2026-10-02T17:17:11-07:00`; 1,643 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/CopilotKit/openbot/blob/cb5dc32a44517622c6db4e527e61d3abb389b43c/README.md)):

> The AI assistant your company can actually own.** Same shape as ChatGPT, Claude or Grok, with one difference that matters: it runs on your infrastructure and you can change anything about it. Any agent stack, through AG-UI. Each coworker gets a computer of its own: a real browser with its own logins, its own files, and only the tools you grant. Every action decided before it happens and recorded after.

Build/package evidence: [agent-adk/requirements.txt](https://github.com/CopilotKit/openbot/blob/cb5dc32a44517622c6db4e527e61d3abb389b43c/agent-adk/requirements.txt); [agent-ag2/requirements.txt](https://github.com/CopilotKit/openbot/blob/cb5dc32a44517622c6db4e527e61d3abb389b43c/agent-ag2/requirements.txt); [agent-agno/requirements.txt](https://github.com/CopilotKit/openbot/blob/cb5dc32a44517622c6db4e527e61d3abb389b43c/agent-agno/requirements.txt); [agent-bot/package.json](https://github.com/CopilotKit/openbot/blob/cb5dc32a44517622c6db4e527e61d3abb389b43c/agent-bot/package.json); [agent-claude-sdk/requirements.txt](https://github.com/CopilotKit/openbot/blob/cb5dc32a44517622c6db4e527e61d3abb389b43c/agent-claude-sdk/requirements.txt)

License evidence: [LICENSE](https://github.com/CopilotKit/openbot/blob/cb5dc32a44517622c6db4e527e61d3abb389b43c/LICENSE) Classification hint: MIT. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents**. Its category places it in the candidate set for agents, models, channels; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [models](../models.md) · [channels](../channels.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

## 2026-10-28 scoped source review

Source: [openbot](https://github.com/CopilotKit/openbot); inspected saved discovery revision `3592f850eff49204d0f2b46a905d38f2627f2d81`. Prior analyzed revision `cb5dc32a44517622c6db4e527e61d3abb389b43c` remains historical evidence.

**Scope:** Full lease keeper, shared turn-limit constants and lease tests read. Run-turn integration, remote lock service, lock fencing and real cancellation were not audited.

The [lease keeper](https://github.com/CopilotKit/openbot/blob/3592f850eff49204d0f2b46a905d38f2627f2d81/toolkit/src/lease.ts#L55-L97) stops its heartbeat and reports loss once on a platform-shaped 409 or excessive time since successful renewal. It records the request-start time rather than completion time, so a late response cannot pretend the lease was renewed later than requested. The [tests](https://github.com/CopilotKit/openbot/blob/3592f850eff49204d0f2b46a905d38f2627f2d81/toolkit/tests/lease.test.ts) cover transient failures, conflicts, a hanging renewal and repeated success; they use local callbacks and synthetic clock progression, not a remote lock service.

This helper does not establish execution fencing. Its interval can launch overlapping renewals, stop does not cancel pending requests, and the strict greater-than cutoff can detect loss at the actual expiry tick when lifetime and interval divide evenly. The [120-second lifetime and 15-second interval](https://github.com/CopilotKit/openbot/blob/3592f850eff49204d0f2b46a905d38f2627f2d81/toolkit/src/limits.ts#L22-L43) therefore do not by themselves guarantee a full interval of safety before expiry. The grace-period comment also explicitly distinguishes settling a promise from stopping an unfinished agent build. Adapt a monotonic deadline, bounded in-flight renewal, ownership fencing and independently observed cancellation; no upstream code or tests were executed.

## 2026-10-28 follow-up source review

Reviewed the frozen update from `3592f850eff49204d0f2b46a905d38f2627f2d81` to `da9a3caf5784074baa779110dd7e9d1338c8871b`. Earlier findings above remain historical evidence; this review is limited to the cited source and delta.

In [server/src/approvals/types.ts](https://github.com/CopilotKit/openbot/blob/da9a3caf5784074baa779110dd7e9d1338c8871b/server/src/approvals/types.ts#L317-L355), Approval construction now throws a distinct needs-conversation error when run/thread/tool-call continuation is absent. It checks required identity strings and hashes a canonical projection of actor, bot, tool, effect, scope, arguments and target before returning the action linked to the continuation.

**Harness implication and limits:** Expose missing approval context as a recoverable pre-execution state rather than a generic refusal; a route may request the same unexecuted action through an authenticated conversation. Preserve the action digest and do not assume that a new conversation creates approval. This helper does not verify ownership or execute effects, and its preview redaction is heuristic; approval persistence, resume deduplication and transport authorization were not audited. No upstream runtime or live provider behavior was verified.

## 2026-11-01 scoped source review

Reviewed frozen commit `c396a5f68c817043846f1ca3c2b42061ee73ceb5` against prior analyzed commit `da9a3caf5784074baa779110dd7e9d1338c8871b`. Historical reviews above remain separate evidence.

The [browser-session registry](https://github.com/CopilotKit/openbot/blob/c396a5f68c817043846f1ca3c2b42061ee73ceb5/agent-computer/src/sessions.ts) centralizes whether a human holds control or a handoff is waiting, preserves those sessions during idle trimming, and exposes a passive query that does not create a session. Renewing a browser run always retires prior references; explicit `keepWheel` preserves human control while incrementing snapshot generation. A callback reports the control transition. The [new fixture](https://github.com/CopilotKit/openbot/blob/c396a5f68c817043846f1ca3c2b42061ee73ceb5/agent-computer/tests/sessions.test.ts) checks absent-session lookup, waiting, takeover and release.

Adopt a distinct human-control lease in desktop/browser resource retention, separate from agent liveness. A changed run/snapshot identity must invalidate old automation references even when the human keeps control. The inspected code calls the control object's expiration logic but does not establish its expiry implementation, browser-close callers or real browser safety.

**Coverage:** Read the complete 159-line selected sessions/cookie-test/session-test expansion. Cookie changes in this selection are import ordering only; control implementation and browser eviction callers were not audited. Source inspection only; no upstream tests, source programs or live providers were executed. This is a scoped architecture review, not a whole-repository correctness or security certification.

<!-- teamagent-analysis:start -->
Analysis metadata: source [openbot](https://github.com/CopilotKit/openbot); analyzed commit `c396a5f68c817043846f1ca3c2b42061ee73ceb5`; commit date 2026-10-31T10:17:48-07:00; review date 2026-11-01T11:33:30.893Z; depth screened. [Maintenance record](../analyses/repos/ai-agents--openbot.md).
<!-- teamagent-analysis:end -->
