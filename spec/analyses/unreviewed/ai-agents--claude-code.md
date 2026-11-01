# claude-code

Source: [claude-code](https://github.com/anthropics/claude-code) · [agents](../../agents.md), [models](../../models.md), [channels](../../channels.md).

Historical discovery: 2026-10-24T06:36:54.441Z, initially unreviewed. Dated scoped reviews below supersede that discovery-only status; they do not establish runtime validation. [Change evidence](../repos/ai-agents--claude-code.md).

## 2026-10-28 scoped source review

Source: [claude-code](https://github.com/anthropics/claude-code); inspected saved discovery revision `08c6a4f5121ae140d3c1b5c96e3e5ae53587b54b`. This is an initial scoped review of this newly catalogued source.

**Scope:** Full AGENTS.md hook registrar and its register tests read. Files/Frames/Modes helpers, host hook implementation, instruction trust policy, nested-read tests and installed product behavior were not audited.

The [hook registrar](https://github.com/anthropics/claude-code/blob/08c6a4f5121ae140d3c1b5c96e3e5ae53587b54b/mods/agents-md/hooks/register.ts) selects among CLAUDE-only, managed-only, fallback and combined instruction-file modes. Fallback checks the ancestor walk as well as already handed files, so withholding a loaded CLAUDE.md does not automatically make AGENTS.md eligible. It respects attachment-disable settings on each read and avoids adding instructions after a denied or failed Read. Forks inherit their parent's seen-file set; resumed forks retain their own set.

The [register tests](https://github.com/anthropics/claude-code/blob/08c6a4f5121ae140d3c1b5c96e3e5ae53587b54b/mods/agents-md/tests/register.test.ts) cover an AGENTS-only project, CLAUDE precedence, failed discovery preserving existing context and optional telemetry. Failed walks can therefore leave instructions unadded, and nested discovery also suppresses failures into empty sets. Teamagent should preserve an unavailable-discovery state instead of treating it as proof that no policy exists. Seen entries are tracked by path in this registrar, so content-version semantics and host refresh need separate review. Managed-only filtering and path helpers are delegated, not enforcement verified here. Adapt explicit source precedence, per-agent context ownership and versioned provenance; no hooks, engine or tests were executed.

## 2026-10-28 follow-up source review

Reviewed the frozen update from `08c6a4f5121ae140d3c1b5c96e3e5ae53587b54b` to `58d6da1e34d6cd1c6379dcbf568bd66f5f9b6102`. Earlier findings above remain historical evidence; this review is limited to the cited source and delta.

In [mods/diff/hooks/turns/turn-of/file-edit-of/file-edit-of.ts](https://github.com/anthropics/claude-code/blob/58d6da1e34d6cd1c6379dcbf568bd66f5f9b6102/mods/diff/hooks/turns/turn-of/file-edit-of/file-edit-of.ts#L17-L58), The transcript-to-diff projection now returns null for staged:true before reading structured patches or synthesizing a create-file hunk. Other results still require a record with filePath and either parsed hunks or create content.

**Harness implication and limits:** A proposed patch held for review is not a filesystem change. Preserve proposal, approval and application states separately in event schemas and UI counts. This display helper trusts the transcript's staged marker; it does not verify filesystem hashes, effect execution or patch completeness. The broader changed files and producer of staged results were not audited, and no upstream tests were run. This static review does not certify other changed subsystems.

## 2026-11-01 scoped source review

Reviewed commit `80c6959d28c4c30ecd14fc1cdf172f19d9adad81` (commit date `2026-10-31T01:01:10Z`), compared with `58d6da1e34d6cd1c6379dcbf568bd66f5f9b6102`. Earlier observations remain historical evidence.

**Scope:** Complete new refreshRestOf helper and comment-only security/fetch-hook diffs; 22 changed paths inventoried. Scheduling call sites, constants and wider tests not audited.

The public [diff helper](https://github.com/anthropics/claude-code/blob/80c6959d28c4c30ecd14fc1cdf172f19d9adad81/mods/diff/hooks/refresh-rest-of/refresh-rest-of.ts) derives refresh rest time from the previous listing duration and bounded exponential delay after repeated timeouts, returning zero when the existing debounce already covers the rest. The [security hook](https://github.com/anthropics/claude-code/blob/80c6959d28c4c30ecd14fc1cdf172f19d9adad81/mods/sec-default/hooks/register.ts) change only clarifies an engine-side no-op hook optimization; its claimed engine test is outside this public source slice. Neither establishes measured responsiveness or complete hook enforcement.

**Teamagent implication (inference):** Use measured refresh cost and explicit timeout state to avoid repeated expensive background work, while retaining a freshness indicator and live invalidation. Optimize proven no-op hooks only under versioned contracts and regression coverage, not comments alone.

**Verification limit:** committed-source inspection only; no upstream code, tests or provider calls were executed. Review scope is the cited implementation or authored guidance, not whole-project correctness, licensing clearance or measured performance. Source passages were redacted for review; exact URL literals were not byte-validated.

<!-- teamagent-analysis:start -->
Analysis metadata: source [claude-code](https://github.com/anthropics/claude-code); analyzed commit `80c6959d28c4c30ecd14fc1cdf172f19d9adad81`; commit date 2026-10-31T01:01:10Z; review date 2026-11-01T11:33:30.893Z; depth reviewed. [Maintenance record](../repos/ai-agents--claude-code.md).
<!-- teamagent-analysis:end -->
