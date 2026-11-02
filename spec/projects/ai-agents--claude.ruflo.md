# claude.ruflo

Source: [claude.ruflo](https://github.com/ruvnet/ruflo) · Category: [ai-agents](../categories/ai-agents.md)

Original review depth: **inventory / README screening only**. The dated update review below has its own explicit scope. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `d46358a3bc0678e01b2b102c1af4f1017b487a36`; commit timestamp `2026-10-03T11:53:50-07:00`; 6,361 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/ruvnet/ruflo/blob/d46358a3bc0678e01b2b102c1af4f1017b487a36/README.md)):

> [](https://github.com/ruvnet/ruflo/blob/main/data/clone-data.proof.json) [](https://github.com/ruvnet/ruflo/blob/main/data/clone-data.ledger.json)

Build/package evidence: [Cargo.toml](https://github.com/ruvnet/ruflo/blob/d46358a3bc0678e01b2b102c1af4f1017b487a36/Cargo.toml); [package.json](https://github.com/ruvnet/ruflo/blob/d46358a3bc0678e01b2b102c1af4f1017b487a36/package.json); [plugins/ruflo-ai-team/package.json](https://github.com/ruvnet/ruflo/blob/d46358a3bc0678e01b2b102c1af4f1017b487a36/plugins/ruflo-ai-team/package.json); [plugins/ruflo-arena/package.json](https://github.com/ruvnet/ruflo/blob/d46358a3bc0678e01b2b102c1af4f1017b487a36/plugins/ruflo-arena/package.json); [plugins/ruflo-chatgpt-federation/package.json](https://github.com/ruvnet/ruflo/blob/d46358a3bc0678e01b2b102c1af4f1017b487a36/plugins/ruflo-chatgpt-federation/package.json)

License evidence: [LICENSE](https://github.com/ruvnet/ruflo/blob/d46358a3bc0678e01b2b102c1af4f1017b487a36/LICENSE) Classification hint: MIT. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents**. Its category places it in the candidate set for agents, models, channels; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [models](../models.md) · [channels](../channels.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

## 2026-10-28 scoped update review

Reviewed commit `b49078cc40945d2a81ab1dd9d0faeccd04f827f5` (commit date `2026-10-27T10:39:12-04:00`). The original snapshot above remains historical evidence.

**Scope:** Complete agent guard/name classifier, RVF writer classifier, agent/offer-trimming fixtures and live AgentDB writer-check script; secret-scanner implementation, installed hook admission, persistence backends and live execution were not audited.

The [agent guard](https://github.com/ruvnet/ruflo/blob/b49078cc40945d2a81ab1dd9d0faeccd04f827f5/plugins/ruflo-agent/hooks/guard.ts#L5-L23) applies secret screening to a finite list of agent-runtime tool names and returns a generic refusal without copying the value. The [RVF classifier](https://github.com/ruvnet/ruflo/blob/b49078cc40945d2a81ab1dd9d0faeccd04f827f5/plugins/ruflo-rvf/hooks/tools.ts#L1-L45) separately lists durable writers. Both strip the MCP server prefix and classify the bare tool name; this is a coverage heuristic, not canonical server/tool authority. Unlisted operations pass this predicate, and the selected agent fixture explicitly demonstrates guard-off behavior. The scanner itself and all durable write paths were not inspected, so these modules cannot establish comprehensive secret prevention.

The [live writer-check script](https://github.com/ruvnet/ruflo/blob/b49078cc40945d2a81ab1dd9d0faeccd04f827f5/scripts/live-agentdb-writers.sh#L1-L106) is an executable experiment definition, not a recorded result. It uses synthetic token-shaped fixtures, checks refusal text for leakage and deliberately includes unguarded operations. For benign/open cases, however, a detected call plus absence of the refusal phrase can pass even when no successful durable result was observed. A timed-out ask can also leave a prior turn running while the next request begins, because result routing is not tied to that turn in the local driver. The shell wrapper logs driver failure but ends with exit zero. Teamagent should require correlated receipts, successful effect/readback evidence and propagated failure status before calling such an experiment passed.

The [offer-trimming fixture](https://github.com/ruvnet/ruflo/blob/b49078cc40945d2a81ab1dd9d0faeccd04f827f5/plugins/ruflo-mods/tests/agents.test.ts#L14-L75) specifies default-off filtering, preservation of another hook's hidden decision, named/pinned agent retention and a bounded usage age. These are discovery semantics, not authorization, and the implementation behind the fixture was not audited. No package launcher, headless agent, MCP server, live provider or test suite was run; script defaults pointing at mutable latest packages are not adopted dependencies.

**Verification limit:** source inspection only; no upstream tests or provider calls were executed. This scoped review does not certify every file in the repository.

## 2026-10-28 follow-up source review

Reviewed commit `5ae2d6527b24f1ae6d907a29b91d320cdc447d2d` (commit date `2026-10-28T06:08:24-04:00`), compared with `b49078cc40945d2a81ab1dd9d0faeccd04f827f5`. Earlier findings remain historical evidence.

**Scope:** Claim redistribution planning and mixed-format session identity reads. The complete changed-path inventory contains 80 paths; the assessment below is limited to the cited branches.

Redistribution now counts already suggested moves so a target cannot receive more than maxClaims within one plan. See [v3/@claude-flow/cli/src/mcp-tools/claims-tools.ts](https://github.com/ruvnet/ruflo/blob/5ae2d6527b24f1ae6d907a29b91d320cdc447d2d/v3/@claude-flow/cli/src/mcp-tools/claims-tools.ts#L864-L893). Session tools accept both save-record and hook-record identity/time fields, fall back to the filename and report absent stats as null. See [v3/@claude-flow/cli/src/mcp-tools/session-tools.ts](https://github.com/ruvnet/ruflo/blob/5ae2d6527b24f1ae6d907a29b91d320cdc447d2d/v3/@claude-flow/cli/src/mcp-tools/session-tools.ts#L84-L103).

For Teamagent, reserve capacity transactionally when applying a plan; an in-memory planned count does not prevent concurrent schedulers from oversubscribing a worker. Legacy session-shape compatibility also needs explicit schema/version provenance. The inspected current-session path labels a readable newest record active, which is not evidence of a live process or ownership lease. See [v3/@claude-flow/cli/src/mcp-tools/session-tools.ts](https://github.com/ruvnet/ruflo/blob/5ae2d6527b24f1ae6d907a29b91d320cdc447d2d/v3/@claude-flow/cli/src/mcp-tools/session-tools.ts#L718-L739). Hook builds, model tooling and scheduler execution were not audited.

**Verification limit:** committed-source inspection only; no upstream code, tests or provider calls were executed. This review does not certify every changed file or establish a Teamagent integration.

## 2026-11-01 scoped source review

Reviewed commit `e580bbc8204874f762d132fe441b18192979211b` (commit date `2026-11-01T06:29:40Z`), compared with `5ae2d6527b24f1ae6d907a29b91d320cdc447d2d`. Earlier observations remain historical evidence.

**Scope:** Complete new verified-guards.ts; 429 changed paths inventoried. Ingestion, verifier execution and lesson publication call sites not audited.

The [learning guards](https://github.com/ruvnet/ruflo/blob/e580bbc8204874f762d132fe441b18192979211b/v3/@claude-flow/cli/src/memory/verified-guards.ts) default to blocking recognized test/config/narrowed-verifier taints, require explicit re-verification opt-in, and hold lessons with only one recorded session, only narrowed successes, or suspicious perfect/tainted histories. Unknown taint values are dropped and malformed stats become zeros; therefore this parser alone does not fail closed on future or corrupted evidence classes. Different session labels are also not independent verification by themselves.

**Teamagent implication (inference):** Preserve verifier inputs, edits and trust levels with each learning record, quarantine unknown evidence schemas, and distinguish independent validation from repeated self-report. Useful anomaly checks can only downgrade evidence; they cannot turn a pattern into an authorized or proven-successful skill.

**Verification limit:** committed-source inspection only; no upstream code, tests or provider calls were executed. Review scope is the cited implementation or authored guidance, not whole-project correctness, licensing clearance or measured performance. Source passages were redacted for review; exact URL literals were not byte-validated.

## External-update review - 2026-11-01

Reviewed `a3d45e64b9ce66d3a172c8051e8b20561321eb64` against `e580bbc8204874f762d132fe441b18192979211b`.

Within the 126-path comparison, [context delegation](https://github.com/ruvnet/ruflo/blob/a3d45e64b9ce66d3a172c8051e8b20561321eb64/v3/@claude-flow/cli/src/services/context-delegation.ts) is an explicit, host-authorized operation over supplied snapshots. Legacy/observe modes do not invoke a worker; targeted reads and edit/debug/architecture intent retain exact source. Enforced bulk-analysis delegation limits files, serialized input/output, findings, depth and waiting time, then verifies source hashes and exact quoted line ranges. It returns explicit escalation on failure rather than retrying or exposing raw corpus. Unknown usage remains absent; byte reduction is measured separately from provider token/cost information.

The complete inspected [delegation fixture](https://github.com/ruvnet/ruflo/blob/a3d45e64b9ce66d3a172c8051e8b20561321eb64/v3/@claude-flow/cli/__tests__/context-delegation.test.ts) covers denial before invocation, forged/stale citations, extra-field stripping, envelope overhead, cancellation and noncooperative adapters. A timer and abort signal bound caller waiting but cannot forcibly stop an adapter that ignores cancellation. Exact quotes establish provenance, not entailment or task completeness; host policy and output authorization remain necessary.

The [configuration tools](https://github.com/ruvnet/ruflo/blob/a3d45e64b9ce66d3a172c8051e8b20561321eb64/v3/@claude-flow/cli/src/mcp-tools/config-tools.ts) also reject reserved scope/key names and use own-property checks, with [prototype fixtures](https://github.com/ruvnet/ruflo/blob/a3d45e64b9ce66d3a172c8051e8b20561321eb64/v3/@claude-flow/cli/__tests__/config-scope-prototype-safety.test.ts) preserving ordinary scopes named like inherited methods without modifying Object.prototype.

**Harness consequence:** Delegate broad source reduction only through an explicit task/policy boundary and preserve hash-bound evidence plus uncertain usage. Keep exact-source paths for consequential edits and verify conclusions independently. Reviewed these four complete source/test deltas; launcher, AgentDB, Raft, provider/subscription pilots and published benchmark claims were not audited or rerun. No upstream CLI, worker, model/provider, install or benchmark was executed; this does not establish subscription eligibility, measured savings or complete security of the release.

<!-- teamagent-analysis:start -->
Analysis metadata: source [claude.ruflo](https://github.com/ruvnet/ruflo); analyzed commit `a3d45e64b9ce66d3a172c8051e8b20561321eb64`; commit date 2026-11-01T14:13:37-05:00; review date 2026-11-01T23:12:06.798Z; depth screened. [Maintenance record](../analyses/repos/ai-agents--claude.ruflo.md).
<!-- teamagent-analysis:end -->
