# yoagent

Source: [yoagent](https://github.com/yologdev/yoagent) · [agents](../../agents.md), [models](../../models.md), [channels](../../channels.md).

Depth: **unreviewed**. Discovered 2026-10-24T06:36:54.441Z; no source code or capabilities reviewed. [Change evidence](../repos/ai-agents--yoagent.md).

## 2026-10-28 scoped update review

Reviewed commit `a03fc35ccc2c3f48ce107a7ec542d8f4700df2f9` (commit date `2026-10-26T07:41:07+01:00`). The original snapshot above remains historical evidence.

**Scope:** Initial scoped source review: complete session-tree module, sub-agent dispatch/outcome sections, Agent drop cleanup, tool exports, session fixtures and selected cancellation/partial-output fixtures. Provider transports, filesystem sandbox implementation and the complete agent loop remain unaudited.

Yoagent's [session tree](https://github.com/yologdev/yoagent/blob/a03fc35ccc2c3f48ce107a7ec542d8f4700df2f9/src/session.rs#L134-L162) rejects a new history that no longer extends the selected branch, making compaction divergence explicit instead of attaching rewritten messages silently. [JSONL loading](https://github.com/yologdev/yoagent/blob/a03fc35ccc2c3f48ce107a7ec542d8f4700df2f9/src/session.rs#L264-L319) rejects duplicate IDs and missing/forward parents. Its persistence contract is narrower than arbitrary continuation: loading always selects the last appended entry, so a seek without a subsequent append is not saved. [Session fixtures](https://github.com/yologdev/yoagent/blob/a03fc35ccc2c3f48ce107a7ec542d8f4700df2f9/tests/session_test.rs#L195-L265) exercise divergence and tree invariants. Teamagent should store the selected head explicitly alongside its own task/event identity.

[Delegation](https://github.com/yologdev/yoagent/blob/a03fc35ccc2c3f48ce107a7ec542d8f4700df2f9/src/sub_agent.rs#L581-L711) starts a fresh message context, inherits host tree extensions, propagates cancellation and reports child spend before classifying success or failure. [Outcome extraction](https://github.com/yologdev/yoagent/blob/a03fc35ccc2c3f48ce107a7ec542d8f4700df2f9/src/sub_agent.rs#L777-L864) treats aborted/looping runs as failures and appends a partial-work notice when a turn bound is reached; [fixtures](https://github.com/yologdev/yoagent/blob/a03fc35ccc2c3f48ce107a7ec542d8f4700df2f9/tests/sub_agent_test.rs#L1201-L1291) distinguish those cases. The event channel is unbounded, so this is not a bounded-backpressure implementation.

[Agent Drop](https://github.com/yologdev/yoagent/blob/a03fc35ccc2c3f48ce107a7ec542d8f4700df2f9/src/agent.rs#L1649-L1695) cancels and aborts its owned loop, while documenting partial tool effects and synchronous work that may continue. Stream closure therefore cannot count as successful completion or effect rollback. **Disposition:** Rust worker/adapter reference for truthful continuation and descendant accounting, not a replacement for Teamagent's durable task store, aggregate reservations or enforceable effect fencing.

**Verification limit:** source inspection only; no upstream tests or provider calls were executed. This scoped review does not certify every file in the repository.

<!-- teamagent-analysis:start -->
Analysis metadata: source [yoagent](https://github.com/yologdev/yoagent); analyzed commit `a03fc35ccc2c3f48ce107a7ec542d8f4700df2f9`; commit date 2026-10-26T07:41:07+01:00; review date 2026-10-28T08:26:04.502Z; depth reviewed. [Maintenance record](../repos/ai-agents--yoagent.md).
<!-- teamagent-analysis:end -->
