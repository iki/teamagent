# plan.loop-engineering

Source: [plan.loop-engineering](https://github.com/cobusgreyling/loop-engineering) · Category: [ai-skills](../categories/ai-skills.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `00e3a66089f8907cdee31f3bd8c2442ec0c98f24`; commit timestamp `2026-10-03T02:44:05Z`; 704 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/cobusgreyling/loop-engineering/blob/00e3a66089f8907cdee31f3bd8c2442ec0c98f24/README.md)):

> `--tool` defaults to `claude` if you omit it. Swap for `grok`, `codex`, or `opencode`. Week one is **report-only**. You design a system that discovers work, hands it to agents, verifies results, and persists state — instead of typing the next prompt yourself.

Build/package evidence: [package.json](https://github.com/cobusgreyling/loop-engineering/blob/00e3a66089f8907cdee31f3bd8c2442ec0c98f24/package.json); [tools/goal-audit/package.json](https://github.com/cobusgreyling/loop-engineering/blob/00e3a66089f8907cdee31f3bd8c2442ec0c98f24/tools/goal-audit/package.json); [tools/goal-audit/test/fixtures/good-goal-project/package.json](https://github.com/cobusgreyling/loop-engineering/blob/00e3a66089f8907cdee31f3bd8c2442ec0c98f24/tools/goal-audit/test/fixtures/good-goal-project/package.json); [tools/goal-init/package.json](https://github.com/cobusgreyling/loop-engineering/blob/00e3a66089f8907cdee31f3bd8c2442ec0c98f24/tools/goal-init/package.json); [tools/loop-audit/package.json](https://github.com/cobusgreyling/loop-engineering/blob/00e3a66089f8907cdee31f3bd8c2442ec0c98f24/tools/loop-audit/package.json)

License evidence: [LICENSE](https://github.com/cobusgreyling/loop-engineering/blob/00e3a66089f8907cdee31f3bd8c2442ec0c98f24/LICENSE) Classification hint: MIT. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-skills**. Its category places it in the candidate set for skills; those associations are navigational and have not been individually validated as implemented capabilities. See [skills](../skills.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

## Source update reviewed 2026-10-28

Reviewed commit: [`9fb7538bb4c858b3b00dd8d14fc701a20c1e1483`](https://github.com/cobusgreyling/loop-engineering/commit/9fb7538bb4c858b3b00dd8d14fc701a20c1e1483). Scope: Full audit proof-reader, loop-verifier and minimal-fix skills read. Drill execution, proof-writer tests, MCP server and policy enforcement were not audited.

The [proof reader](https://github.com/cobusgreyling/loop-engineering/blob/9fb7538bb4c858b3b00dd8d14fc701a20c1e1483/tools/loop-audit/src/proof.ts) distinguishes present, invalid, stale, failed and untested records and requires both seeded-fault detection and benign acceptance before labeling a guardrail proven. Gate evidence is bound to normalized policy bytes; other canaries expire by age, while breaker evidence is timeless. Neither elapsed time nor a policy hash binds all executable implementation and environment dependencies, and the parser does not authenticate the recorder or require a known guardrail/test-ID set. The label means the supplied record satisfies this local rule, not universal enforcement.

The [verifier](https://github.com/cobusgreyling/loop-engineering/blob/9fb7538bb4c858b3b00dd8d14fc701a20c1e1483/skills/loop-verifier/SKILL.md) separates maker and checker and reports unavailable verification; [minimal-fix](https://github.com/cobusgreyling/loop-engineering/blob/9fb7538bb4c858b3b00dd8d14fc701a20c1e1483/skills/minimal-fix/SKILL.md) constrains the proposal and keeps untrusted issue/log content as data. A worktree alone does not isolate test execution, and skill prose does not enforce denylisted paths. Adapt two-direction fixtures and content-bound receipts with complete executable provenance and host authorization. No drill, verifier, agent or tests were run.

## 2026-10-28 follow-up source review

Reviewed commit `d6d9ead4ce2ebc8b875f0bbc94fac4ff8611026e` (commit date `2026-10-28T08:02:11Z`), compared with `9fb7538bb4c858b3b00dd8d14fc701a20c1e1483`. Earlier findings remain historical evidence.

**Scope:** Generated state and last-run badge delta, with the changed-path inventory identifying accompanying log/visual updates; no decision-engine implementation changed in this packet. The complete changed-path inventory contains 5 paths. Citations below identify current lines visible in the captured committed diff; this is a scoped assessment, not a whole-repository audit.

The dated triage snapshot changes several pull-request entries from conflict/green descriptions to UNKNOWN and keeps its readiness score explicitly informational. Issue titles are labelled untrusted data. This preserves uncertainty in a generated status view; it does not prove that checks became worse or that the named proposed features were merged. [STATE.md](https://github.com/cobusgreyling/loop-engineering/blob/d6d9ead4ce2ebc8b875f0bbc94fac4ff8611026e/STATE.md#L1-L30).

The badge records the latest reported triage date, not source coverage, a successful evaluation, or verified task completion. Teamagent evolution should retain the observation time and evidence identity behind each status and avoid deriving a permission to act from a readiness score or daily refresh alone. In particular, a listed JEV proposal is not evidence that its decision model is implemented. [docs/last-run.json](https://github.com/cobusgreyling/loop-engineering/blob/d6d9ead4ce2ebc8b875f0bbc94fac4ff8611026e/docs/last-run.json#L1-L6).

**Verification limit:** static committed-source inspection only; no upstream code, tests, deployments or provider calls were executed. Imported instructions remain research data, and this review does not establish a Teamagent integration.

<!-- teamagent-analysis:start -->
Analysis metadata: source [plan.loop-engineering](https://github.com/cobusgreyling/loop-engineering); analyzed commit `d6d9ead4ce2ebc8b875f0bbc94fac4ff8611026e`; commit date 2026-10-28T08:02:11Z; review date 2026-10-28T14:52:35.205Z; depth screened. [Maintenance record](../analyses/repos/ai-skills--plan.loop-engineering.md).
<!-- teamagent-analysis:end -->
