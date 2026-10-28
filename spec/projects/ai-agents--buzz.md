# buzz

Source: [buzz](https://github.com/block/buzz) · Category: [ai-agents](../categories/ai-agents.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `e982f70fba29cdaa9a8378f118a0e498537bd8db`; commit timestamp `2026-10-03T15:12:15-04:00`; 5,489 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/block/buzz/blob/e982f70fba29cdaa9a8378f118a0e498537bd8db/README.md)):

> A workspace where humans and agents build together, on a relay you own. Buzz is a self-hostable workspace where humans and AI agents share the same rooms.

Build/package evidence: [Cargo.toml](https://github.com/block/buzz/blob/e982f70fba29cdaa9a8378f118a0e498537bd8db/Cargo.toml); [admin-web/package.json](https://github.com/block/buzz/blob/e982f70fba29cdaa9a8378f118a0e498537bd8db/admin-web/package.json); [benchmarks/harbor-buzz-orchestra/pyproject.toml](https://github.com/block/buzz/blob/e982f70fba29cdaa9a8378f118a0e498537bd8db/benchmarks/harbor-buzz-orchestra/pyproject.toml); [benchmarks/harbor-buzz-orchestra/testbed/pyproject.toml](https://github.com/block/buzz/blob/e982f70fba29cdaa9a8378f118a0e498537bd8db/benchmarks/harbor-buzz-orchestra/testbed/pyproject.toml); [crates/buzz-acp/Cargo.toml](https://github.com/block/buzz/blob/e982f70fba29cdaa9a8378f118a0e498537bd8db/crates/buzz-acp/Cargo.toml)

License evidence: [LICENSE](https://github.com/block/buzz/blob/e982f70fba29cdaa9a8378f118a0e498537bd8db/LICENSE) Classification hint: Apache-2.0. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents**. Its category places it in the candidate set for agents, models, channels; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [models](../models.md) · [channels](../channels.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

## 2026-10-28 scoped source review

Source: [buzz](https://github.com/block/buzz); inspected saved discovery revision `ff9eb8f4dc56c312983287321ea8748b93c62145`. Prior analyzed revision `e982f70fba29cdaa9a8378f118a0e498537bd8db` remains historical evidence.

**Scope:** Complete auth service with embedded tests, plus MCP hook dispatch 340–449 and regular dispatch/restart 515–729. Signature verifier internals, replay/membership enforcement, process-kill helpers and provider loop were not audited.

The [auth service](https://github.com/block/buzz/blob/ff9eb8f4dc56c312983287321ea8748b93c62145/crates/buzz-auth/src/lib.rs#L129-L168) delegates NIP-42 verification to blocking CPU work, then grants all known scopes and no channel restriction; its comment explicitly assigns channel access to relay membership checks. Authentication alone therefore does not prove channel authority. Embedded tests cover scope lookup, accepted auth, wrong challenge and wrong event kind. Deterministic username-derived keys are gated by test/dev compilation, whose production feature selection was not inspected.

The [MCP dispatch](https://github.com/block/buzz/blob/ff9eb8f4dc56c312983287321ea8748b93c62145/crates/buzz-agent/src/mcp.rs#L515-L666) rechecks tool availability after restart, distinguishes application errors from broken transport, and prefers cancellation when its response and cancel branch are both ready. The first cancellation-state check happens after sending the request; cancellation cannot be interpreted as proof that the remote tool never started. Cancellation notification is delegated and fire-and-forget, and this regular call path provides no explicit local timeout. A broken current call returns an error rather than automatically replaying it within that invocation.

[Hook calls](https://github.com/block/buzz/blob/ff9eb8f4dc56c312983287321ea8748b93c62145/crates/buzz-agent/src/mcp.rs#L340-L444) run allowed servers concurrently, bound each call, restore configuration order and intentionally drop errors/empty output. The implementation kills on the second consecutive timeout, more narrowly than the nearby general comment. This fail-open hook contract is unsuitable as an authorization gate, and output caps do not bound the number of concurrent servers. Teamagent should distinguish optional context hooks, deterministic policy, remote cancellation acknowledgement and uncertain effects. No Rust build, relay, MCP process, provider or upstream test was executed.

<!-- teamagent-analysis:start -->
Analysis metadata: source [buzz](https://github.com/block/buzz); analyzed commit `ff9eb8f4dc56c312983287321ea8748b93c62145`; commit date 2026-10-27T16:32:04Z; review date 2026-10-28T09:27:32.685Z; depth screened. [Maintenance record](../analyses/repos/ai-agents--buzz.md).
<!-- teamagent-analysis:end -->
