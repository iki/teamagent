# berd

Source: [berd](https://github.com/block/berd) · Category: [ai-agents](../categories/ai-agents.md)

Original review depth: **inventory / README screening only**. The dated update review below has its own explicit scope. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `81ca89585f68f4d85e7dccf3a4842e401acf18e4`; commit timestamp `2026-09-28T16:21:25-07:00`; 2,559 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/block/berd/blob/81ca89585f68f4d85e7dccf3a4842e401acf18e4/README.md)):

> Berd is an open-source desktop app for working with AI agents. It is built with Tauri 2 and React 19 and talks to the upstream Goose backend through the ACP

Build/package evidence: [bb-cli/Cargo.toml](https://github.com/block/berd/blob/81ca89585f68f4d85e7dccf3a4842e401acf18e4/bb-cli/Cargo.toml); [crates/builderbot-auth/Cargo.toml](https://github.com/block/berd/blob/81ca89585f68f4d85e7dccf3a4842e401acf18e4/crates/builderbot-auth/Cargo.toml); [package.json](https://github.com/block/berd/blob/81ca89585f68f4d85e7dccf3a4842e401acf18e4/package.json); [scripts/release/updater-signature-verifier/Cargo.toml](https://github.com/block/berd/blob/81ca89585f68f4d85e7dccf3a4842e401acf18e4/scripts/release/updater-signature-verifier/Cargo.toml); [sdk/package.json](https://github.com/block/berd/blob/81ca89585f68f4d85e7dccf3a4842e401acf18e4/sdk/package.json)

License evidence: [LICENSE](https://github.com/block/berd/blob/81ca89585f68f4d85e7dccf3a4842e401acf18e4/LICENSE) Classification hint: Apache-2.0. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents**. Its category places it in the candidate set for agents, models, channels; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [models](../models.md) · [channels](../channels.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

## 2026-10-28 scoped update review

Reviewed commit `5b500297447917c978dda517641ed8370db4c33b` (commit date `2026-10-27T06:42:20-04:00`). The original snapshot above remains historical evidence.

**Scope:** Runtime-config IPC wrapper and selected schema/fixtures, plus ACP registry timeout/replay code and selected changed hunks; native resolver, connection-generation implementation and wire API internals were not audited.

The [ACP registry](https://github.com/block/berd/blob/5b500297447917c978dda517641ed8370db4c33b/src/shared/api/acpSessionRegistry.ts#L67-L149) serializes per-session mutations and combines a sixty-second timeout with a captured backend generation. Its `assertActive` checks fence later wire calls/local commits once the transport or operation is abandoned; timeout clears prepared state and starts best-effort generation-specific invalidation without holding the queue. This is the right distinction to preserve in Teamagent: racing a timeout does not cancel the underlying operation, so stale continuations need explicit fences and uncertain remote effects still need reconciliation. The connection-generation and wire implementations were not inspected here.

[History replay](https://github.com/block/berd/blob/5b500297447917c978dda517641ed8370db4c33b/src/shared/api/acpSessionRegistry.ts#L438-L517) captures ownership after entering the queue, bounds metadata recovery separately and preserves spaces in working-directory names. Home-prefix expansion is restricted to the local backend, avoiding interpretation of remote paths against the local user's home. Replay itself is intentionally not subject to the configuration timeout. A separate invocation selector requires both an observed provider and model before prompting; this does not establish current account entitlement or provider-side authorization.

The [runtime-config wrapper](https://github.com/block/berd/blob/5b500297447917c978dda517641ed8370db4c33b/src/shared/api/runtimeConfig.ts) parses unknown native results and validates fake configuration before invoking persistence. The inspected [schema](https://github.com/block/berd/blob/5b500297447917c978dda517641ed8370db4c33b/src/shared/runtime-config/schema.ts#L465-L516) distinguishes ready from unavailable with explicit source/reason and rejects unsupported schema versions/extra top-level fields. Secret-looking-string checks are heuristics, not complete credential detection. Mocked fixtures cover malformed results and bounded startup retries; no packaged Tauri, native resolver or ACP transport test was run.

**Verification limit:** source inspection only; no upstream tests or provider calls were executed. This scoped review does not certify every file in the repository.

<!-- teamagent-analysis:start -->
Analysis metadata: source [berd](https://github.com/block/berd); analyzed commit `5b500297447917c978dda517641ed8370db4c33b`; commit date 2026-10-27T06:42:20-04:00; review date 2026-10-28T08:47:42.123Z; depth screened. [Maintenance record](../analyses/repos/ai-agents--berd.md).
<!-- teamagent-analysis:end -->
