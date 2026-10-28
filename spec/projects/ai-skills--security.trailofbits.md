# Trail of Bits skills

Source: [trailofbits/skills](https://github.com/trailofbits/skills) · Reviewed revision: `82fe8226252622fa807643bdca1710901198553a` · Review date: 2026-10-04.

Depth: **source-reviewed** (static source/content inspection; repository-wide audit not claimed). Related directions: [skills](../skills.md) · [agents](../agents.md) · [memory](../memory.md) · [evolution](../evolution.md).

## Evidence inspected

- [`plugins/audit-context-building/skills/audit-context-building/SKILL.md` lines 1–72](https://github.com/trailofbits/skills/blob/82fe8226252622fa807643bdca1710901198553a/plugins/audit-context-building/skills/audit-context-building/SKILL.md#L1-L72)

## Observed architecture and behavior

The audited example separates building code understanding from making vulnerability claims. It routes codebase or multi-function analysis to subagents, writes a dossier and per-function records, and returns compact structured results. Records retain assumptions, guarantees, dependencies, unresolved questions, and line evidence. The instructions explicitly preserve disagreements instead of silently merging them and require following called functions. This provides a good template for evidence-grounded code memory and bounded analyst context.

## Implications and tradeoffs for Teamagent

Teamagent should borrow the artifact-first delegation pattern: workers write durable evidence, while the coordinator receives only a typed summary and pointers. That enables later queries and coding work to revisit exact assumptions without replaying an entire analysis conversation. However, a declared return schema or an instruction to cite lines is not itself proof of correct analysis. Validate file/revision references and sample conclusions against the source. The workflow's native tools and invocation names are harness-specific, so merely copying SKILL.md will not establish portability. Full function-by-function analysis can also cost more than a narrow task warrants.

## Adoption decision

Curate this as an opt-in security and architecture-analysis bundle, retaining narrow triggers and a limited read-only tool policy. Translate orchestration through Teamagent's capability layer rather than prompting a model to imitate unavailable tools. Add evaluation cases for missing callees, contradictory assumptions, stale line references, and premature vulnerability claims. Store the resulting dossier as evidence-derived memory with commit freshness, not permanent universal knowledge.

## Verification boundary

No project code, models, installers, or benchmarks were executed during this review. Tests and documentation show intended contracts; they do not establish measured performance, production readiness, or a complete security assessment. Recommendations above are design inferences from the cited snapshot. Verify current APIs, licensing, and deployment requirements before integration.

## Source update reviewed 2026-10-28

Reviewed commit: [`196a9073ab10d35bacf111f945e02c00b2c6883a`](https://github.com/trailofbits/skills/commit/196a9073ab10d35bacf111f945e02c00b2c6883a). Scope: Full validate-bug and prove-patch skills, zeroize test-generation phase and ProVerif guidance tests read. Record validators, three-arm executor, native proof assessment and formal models were not audited.

The [independent validation](https://github.com/trailofbits/skills/blob/196a9073ab10d35bacf111f945e02c00b2c6883a/plugins/patching-bugs/skills/validate-bug/SKILL.md) and [patch proof](https://github.com/trailofbits/skills/blob/196a9073ab10d35bacf111f945e02c00b2c6883a/plugins/patching-bugs/skills/prove-patch/SKILL.md) procedures retain unchanged reproductions, pin baseline/patch/reverted trees, require benign controls and treat setup failures or missing reachability markers as gaps. They explicitly limit proof to exercised cases and separate findings from inconclusive evidence. Adapt those receipt contracts; the unread validator and execution helpers still determine whether records can actually support the claims.

The [zeroize phase](https://github.com/trailofbits/skills/blob/196a9073ab10d35bacf111f945e02c00b2c6883a/plugins/zeroize-audit/skills/zeroize-audit/workflows/phase-7-test-generation.md) makes runtime test generation conditional and leaves the report available after generation failure, so report presence must not imply tests exist. [ProVerif guidance tests](https://github.com/trailofbits/skills/blob/196a9073ab10d35bacf111f945e02c00b2c6883a/plugins/trailmark/skills/mermaid-to-proverif/tests/test_guidance.py) check result interpretation and optionally run the sample when the tool exists; absent-tool skips are not formal verification. The subprocess example has no explicit timeout and does not independently assert its exit status. No PoC, target binary, formal tool or tests were executed.

## 2026-10-28 follow-up source review

Reviewed commit `bf23bfb21f10a2a4b0406086d690dc8cb1b3ccf3` (commit date `2026-10-27T16:09:25-04:00`), compared with `196a9073ab10d35bacf111f945e02c00b2c6883a`. Earlier findings remain historical evidence.

**Scope:** Changed c-review, code/pr/skill-improver and Semgrep variant skill resolution instructions plus the corresponding c-review fixture assertion; workflows were not executed. The complete changed-path inventory contains 10 paths. Citations below identify current lines visible in the captured committed diff; this is a scoped assessment, not a whole-repository audit.

The revised instructions resolve executable workflows and reference resources from the loaded skill's installed location, print/validate the exact copy, and stop if required files are missing. They remove discovery that could choose another cached copy or a copy planted in the repository under audit. The c-review test now checks that the instructions contain this resolution contract and no find-based fallback. [plugins/c-review/skills/c-review/SKILL.md](https://github.com/trailofbits/skills/blob/bf23bfb21f10a2a4b0406086d690dc8cb1b3ccf3/plugins/c-review/skills/c-review/SKILL.md#L39-L49); [plugins/code-improver/skills/skill-improver/SKILL.md](https://github.com/trailofbits/skills/blob/bf23bfb21f10a2a4b0406086d690dc8cb1b3ccf3/plugins/code-improver/skills/skill-improver/SKILL.md#L30-L38); [plugins/semgrep-rule-variant-creator/skills/semgrep-rule-variant-creator/SKILL.md](https://github.com/trailofbits/skills/blob/bf23bfb21f10a2a4b0406086d690dc8cb1b3ccf3/plugins/semgrep-rule-variant-creator/skills/semgrep-rule-variant-creator/SKILL.md#L34-L44); [plugins/c-review/tests/test_workflow_args.py](https://github.com/trailofbits/skills/blob/bf23bfb21f10a2a4b0406086d690dc8cb1b3ccf3/plugins/c-review/tests/test_workflow_args.py#L459-L466).

This is a sound supply-chain boundary to adopt in the skill loader: bind the loaded skill revision to its colocated resources and fail explicitly when incomplete. The test inspected here checks documentation text, not runtime path containment or file integrity. Teamagent still needs host-enforced containment, trusted installation identity and exact resource hashes; a model following the instructions is not an equivalent security control.

**Verification limit:** static committed-source inspection only; no upstream code, tests, deployments or provider calls were executed. Imported instructions remain research data, and this review does not establish a Teamagent integration.

<!-- teamagent-analysis:start -->
Analysis metadata: source [security.trailofbits](https://github.com/trailofbits/skills); analyzed commit `bf23bfb21f10a2a4b0406086d690dc8cb1b3ccf3`; commit date 2026-10-27T16:09:25-04:00; review date 2026-10-28T14:52:35.205Z; depth source-reviewed. [Maintenance record](../analyses/repos/ai-skills--security.trailofbits.md).
<!-- teamagent-analysis:end -->
