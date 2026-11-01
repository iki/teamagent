# bb

Source: [bb](https://github.com/get-bb/bb) · Category: [ai-agents](../categories/ai-agents.md)

Original review depth: **inventory / README screening only**. The dated update review below has its own explicit scope. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `76a1ebcaf5fa038d8638daaad7aad3dafe2ae709`; commit timestamp `2026-10-03T10:32:25-07:00`; 7,180 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/get-bb/bb/blob/76a1ebcaf5fa038d8638daaad7aad3dafe2ae709/README.md)):

> bb is an agentic IDE that builds itself. It can control, customize, and automate Every surface — the desktop app, web app, CLI, and HTTP API — is a first-class

Build/package evidence: [apps/ai-gateway/package.json](https://github.com/get-bb/bb/blob/76a1ebcaf5fa038d8638daaad7aad3dafe2ae709/apps/ai-gateway/package.json); [apps/app/package.json](https://github.com/get-bb/bb/blob/76a1ebcaf5fa038d8638daaad7aad3dafe2ae709/apps/app/package.json); [apps/cli/package.json](https://github.com/get-bb/bb/blob/76a1ebcaf5fa038d8638daaad7aad3dafe2ae709/apps/cli/package.json); [apps/connect/package.json](https://github.com/get-bb/bb/blob/76a1ebcaf5fa038d8638daaad7aad3dafe2ae709/apps/connect/package.json); [apps/demo-server/package.json](https://github.com/get-bb/bb/blob/76a1ebcaf5fa038d8638daaad7aad3dafe2ae709/apps/demo-server/package.json)

License evidence: [LICENSE](https://github.com/get-bb/bb/blob/76a1ebcaf5fa038d8638daaad7aad3dafe2ae709/LICENSE) Classification hint: MIT. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents**. Its category places it in the candidate set for agents, models, channels; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [models](../models.md) · [channels](../channels.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

## 2026-10-28 scoped update review

Reviewed commit `f15275b83134efcbb94623a0689c9b07a24e0a7d` (commit date `2026-10-27T10:43:13-07:00`). The original snapshot above remains historical evidence.

**Scope:** Complete MCP tool adapters, QuickJS bridge and bridge fixtures. CLI policy, limiter, subprocess runner, QuickJS/WASM internals and OAuth/connect sessions were not audited.

The [QuickJS bridge](https://github.com/get-bb/bb/blob/f15275b83134efcbb94623a0689c9b07a24e0a7d/plugins/mcp/src/sandbox.ts#L172-L246) separates stack/memory limits, per-entry computation, aggregate computation, wall-clock lifetime and host-call count. The [host dispatcher](https://github.com/get-bb/bb/blob/f15275b83134efcbb94623a0689c9b07a24e0a7d/plugins/mcp/src/sandbox.ts#L318-L379) uses own-property lookup, sends an abort signal to pending calls and ignores settlements after closure. These are useful ownership/budget patterns, but module acquisition occurs before the total timer, computation accounting uses Date.now rather than a monotonic clock, and closure does not await host cleanup. A non-cooperative host effect can remain active after the guest has stopped. Guest memory limits also do not bound host allocations made while serializing returned values.

The [CLI tool bridge](https://github.com/get-bb/bb/blob/f15275b83134efcbb94623a0689c9b07a24e0a7d/plugins/mcp/src/tools.ts#L107-L159) validates the argv container, evaluates mode-aware access before invoking the runner, caps CLI concurrency at four and forwards a timeout and abort signal. Actual policy classification, queue behavior, environment inheritance and subprocess termination were outside this scope. Result truncation happens after serialization and uses string units; it preserves a visible truncation message but supplies no structured truncation field at the outer tool result. CLI stdout/stderr and script logs require separate confidentiality controls. A successful script can catch a failed host call and return normally, so script success is not a task or effect verdict.

The [fixture suite](https://github.com/get-bb/bb/blob/f15275b83134efcbb94623a0689c9b07a24e0a7d/plugins/mcp/src/sandbox.test.ts#L104-L362) specifies busy-loop/microtask interruption, memory exhaustion, unknown/inherited host-name refusal, cancellation signaling, bounded logs and no context-state reuse. It uses synthetic host functions and was not executed. These cases do not establish operating-system containment, actual CLI cleanup or resistance to every engine failure. The bridge executes supplied source with QuickJS evalCode even while disabling guest eval/Function constructors; Teamagent's existing no-input-evaluation rule remains unchanged. Reuse the explicit budgets and scoped host-effect concepts without adopting this executable-input interface or treating guest-controlled completion as independent verification.

**Verification limit:** source inspection only; no upstream tests or provider calls were executed. This scoped review does not certify every file in the repository.

## 2026-10-28 follow-up source review

Reviewed commit `f8c0701e94ba74a09bf48b1dcc4f49aa22ce81b7` (commit date `2026-10-27T22:42:15-07:00`), compared with `f15275b83134efcbb94623a0689c9b07a24e0a7d`. Earlier findings remain historical evidence.

**Scope:** Pi bridge prompt handling while manual compaction is active. The complete changed-path inventory contains 338 paths; the assessment below is limited to the cited branches.

The bridge waits for manual compaction, releases those waiters on close/child exit, and retries only the recognized prompt-rejection message up to eight retries. Other failures propagate. See [plugins/provider-pi/src/bridge/rpc-session.ts](https://github.com/get-bb/bb/blob/f8c0701e94ba74a09bf48b1dcc4f49aa22ce81b7/plugins/provider-pi/src/bridge/rpc-session.ts#L119-L133), [plugins/provider-pi/src/bridge/rpc-session.ts](https://github.com/get-bb/bb/blob/f8c0701e94ba74a09bf48b1dcc4f49aa22ce81b7/plugins/provider-pi/src/bridge/rpc-session.ts#L589-L641) and [plugins/provider-pi/src/bridge/rpc-session.ts](https://github.com/get-bb/bb/blob/f8c0701e94ba74a09bf48b1dcc4f49aa22ce81b7/plugins/provider-pi/src/bridge/rpc-session.ts#L1120-L1157). This distinguishes a known refusal before prompt acceptance from generic uncertain transport errors.

For Teamagent, preserve queued input and exact operation identity while context maintenance runs. A retry count does not bound the compaction waiter, whose array and wait lifetime have no local limit in these methods; dispatch uses NO_REQUEST_TIMEOUT. Resolving input-consumption tracking before dispatch is not provider acceptance. The Codex bridge, network preparation helper and full delivery settlement were outside this review.

**Verification limit:** committed-source inspection only; no upstream code, tests or provider calls were executed. This review does not certify every changed file or establish a Teamagent integration.

## 2026-11-01 scoped source review

Reviewed commit `916d684ac23d0b0de82c09cfc7553a50287d2188` (commit date `2026-10-30T23:10:24-07:00`), compared with `f8c0701e94ba74a09bf48b1dcc4f49aa22ce81b7`. Earlier observations remain historical evidence.

**Scope:** Expanded complete session-model catalog handler and fixture. Whole-repository diff was oversized; event transport authentication, catalog persistence and provider health internals not audited.

The [catalog handler](https://github.com/get-bb/bb/blob/916d684ac23d0b0de82c09cfc7553a50287d2188/apps/server/src/services/providers/session-model-catalog.ts) accepts schema-valid catalog updates only for a thread with an environment and the current provider session, then stores them with host/provider/working-directory context. The [fixture](https://github.com/get-bb/bb/blob/916d684ac23d0b0de82c09cfc7553a50287d2188/apps/server/test/providers/session-model-catalog.test.ts) contrasts current and retired sessions and expects reuse without another list-models RPC. This is session fencing, not independent verification that listed models are currently usable.

**Teamagent implication (inference):** Bind discovered models to account/host/workspace and session generation so stale asynchronous events cannot replace current routing evidence. Keep freshness, authenticated readiness and data-policy eligibility separate from a reusable catalog; revalidate route conditions before content upload.

**Verification limit:** committed-source inspection only; no upstream code, tests or provider calls were executed. Review scope is the cited implementation or authored guidance, not whole-project correctness, licensing clearance or measured performance. Source passages were redacted for review; exact URL literals were not byte-validated.

<!-- teamagent-analysis:start -->
Analysis metadata: source [bb](https://github.com/get-bb/bb); analyzed commit `916d684ac23d0b0de82c09cfc7553a50287d2188`; commit date 2026-10-30T23:10:24-07:00; review date 2026-11-01T11:33:30.893Z; depth screened. [Maintenance record](../analyses/repos/ai-agents--bb.md).
<!-- teamagent-analysis:end -->
