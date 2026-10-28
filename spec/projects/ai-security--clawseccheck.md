# ClawSecCheck: honest partial results across inspection phases

Source: [clawseccheck](https://github.com/gl0di/clawseccheck) · Category: `ai-security`

Review depth: **source-reviewed**. Snapshot `9ad5f14af1b9783dbe33493b4b9cf57e7a9d10d5`; assessed 2026-10-04. This is a focused static review of the listed files, not an audit of every code path or a reproduced benchmark. No repository code, model weights, paid endpoints, or installers were run.

## Observed architecture

The pipeline combines an installed-skill sweep, plugin sweep, behavioral replay, and adjudication. It records execution states such as ran, skipped, not reached, unavailable, and error. Its documentation explicitly forbids interpreting unexecuted work as a clean pass. The implementation imports a layer/coverage ledger and defines which statuses make the overall inspection incomplete.

Adjudication produces a packet for a host agent and returns without waiting. Pending judgment does not automatically change the score or exit code. This is a sensible separation between machine observation and later interpretation, provided the product also makes pending status visible.

## Harness adoption

Borrow these semantics for every evaluation, import, skill scan, and environment probe. A worker that exceeded its budget should return the work completed, work omitted, and reason, not an empty success. Record machine findings, behavioral evidence, model judgments, and final policy decisions as distinct events with links to the underlying artifacts.

Use installed-environment assessment as a periodic or user-triggered task when authorized. Keep scanning read-only by default; remediation that changes authentication, permissions, or installed plugins should be a separate attributable operation. Behavioral fixtures should run in an isolated test identity to avoid affecting the user's real accounts.

## Limitations and decision

Use as a design reference and optional scanner, after checking the selected version's supported agent ecosystem. This focused review did not validate every check, grading rule, or behavioral scenario. A configuration grade cannot establish resistance to prompt injection or prove that a runtime actually enforces its advertised boundary. Do not let an LLM judge convert incomplete deterministic checks into a pass. Combine coverage-aware findings with [SkillSpector](ai-security--skillspector.md), dependency/image scanning, and enforced worker capabilities.

## Evidence read

- [Pipeline phases and degradation semantics](https://github.com/gl0di/clawseccheck/blob/9ad5f14af1b9783dbe33493b4b9cf57e7a9d10d5/clawseccheck/pipeline.py#L1-L49)
- [Phase identity and incomplete-status set](https://github.com/gl0di/clawseccheck/blob/9ad5f14af1b9783dbe33493b4b9cf57e7a9d10d5/clawseccheck/pipeline.py#L101-L127)

## Related directions

[Security](../security.md) · [Skills](../skills.md) · [Agents](../agents.md) · [Evolution](../evolution.md)

## Source update reviewed 2026-10-28

Reviewed commit: [`948128ce3d1293adf2f84fed1b69cb0cd6c0efa6`](https://github.com/gl0di/clawseccheck/commit/948128ce3d1293adf2f84fed1b69cb0cd6c0efa6). Scope: Full skill-discovery helper, skill-corpus fixture helper and skill-budget tests read. Scan aggregation, provenance judgment, sandbox detection and the client size estimator were not audited.

The [discovery walk](https://github.com/gl0di/clawseccheck/blob/948128ce3d1293adf2f84fed1b69cb0cd6c0efa6/clawseccheck/skilldiscovery.py) separates unreadable manifests from discovered skills and walk truncation, retains unresolved declared roots for later assessment, and avoids claiming an empty subtree after the directory cap interrupts traversal. These distinctions prevent a broken container manifest from either hiding real descendants or inventing an extra skill. The six-level cutoff is silent here, and sorting an entire directory and filling the queue occur before the visited-directory cap bounds processing; this is not a complete memory or coverage bound.

The [budget fixtures](https://github.com/gl0di/clawseccheck/blob/948128ce3d1293adf2f84fed1b69cb0cd6c0efa6/tests/test_skill_budget.py) keep mandatory instructions in the always-loaded body and on-demand references individually sized and linked, with negative controls that can fail. The [corpus helper](https://github.com/gl0di/clawseccheck/blob/948128ce3d1293adf2f84fed1b69cb0cd6c0efa6/tests/_skillcorpus.py) correctly checks negative claims across all included playbooks rather than only SKILL.md. Their character estimator and supported client tiers are source-specific assumptions, not independently verified limits, and string-presence checks do not establish model compliance. Adapt explicit discovery gaps and whole-corpus assertions; no scan, payload or tests were executed.

<!-- teamagent-analysis:start -->
Analysis metadata: source [clawseccheck](https://github.com/gl0di/clawseccheck); analyzed commit `948128ce3d1293adf2f84fed1b69cb0cd6c0efa6`; commit date 2026-10-24T15:28:49+03:00; review date 2026-10-28T09:45:33.667Z; depth source-reviewed. [Maintenance record](../analyses/repos/ai-security--clawseccheck.md).
<!-- teamagent-analysis:end -->
