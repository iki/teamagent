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

<!-- teamagent-analysis:start -->
Analysis metadata: source [claude.ruflo](https://github.com/ruvnet/ruflo); analyzed commit `b49078cc40945d2a81ab1dd9d0faeccd04f827f5`; commit date 2026-10-27T10:39:12-04:00; review date 2026-10-28T09:27:32.685Z; depth screened. [Maintenance record](../analyses/repos/ai-agents--claude.ruflo.md).
<!-- teamagent-analysis:end -->
