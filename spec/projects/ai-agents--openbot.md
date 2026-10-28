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

<!-- teamagent-analysis:start -->
Analysis metadata: source [openbot](https://github.com/CopilotKit/openbot); analyzed commit `3592f850eff49204d0f2b46a905d38f2627f2d81`; commit date 2026-10-26T16:48:09-03:00; review date 2026-10-28T09:27:32.685Z; depth screened. [Maintenance record](../analyses/repos/ai-agents--openbot.md).
<!-- teamagent-analysis:end -->
