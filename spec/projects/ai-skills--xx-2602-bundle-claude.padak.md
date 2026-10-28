# xx-2602-bundle-claude.padak

Source: [xx-2602-bundle-claude.padak](https://github.com/padak/claude-code-kit) · Category: [ai-skills](../categories/ai-skills.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `8c8d57dfa888db193bbf5f17289f1b47f0a51380`; commit timestamp `2026-09-17T21:33:03+02:00`; 67 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/padak/claude-code-kit/blob/8c8d57dfa888db193bbf5f17289f1b47f0a51380/README.md)):

> Personal Claude Code setup used by petr@keboola.com. Use at your own risk. A plugin marketplace with eight skills, plus the permission ruleset and global instructions I actually work with daily.

Build/package evidence: No common build manifest identified.

License evidence: No root license file identified; reuse rights unverified. Classification hint: not classified; inspect source. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-skills**. Its category places it in the candidate set for skills; those associations are navigational and have not been individually validated as implemented capabilities. See [skills](../skills.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

## Source update reviewed 2026-10-28

Reviewed commit: [`7f8c97c39d58102adc367ddc0217776e0c8a8b2d`](https://github.com/padak/claude-code-kit/commit/7f8c97c39d58102adc367ddc0217776e0c8a8b2d). Scope: Full product-proposal skill, bilingual structural checker and ship-with-astra skill read. Design builder/assets, private content systems and referenced second-opinion implementation were not audited.

The [proposal workflow](https://github.com/padak/claude-code-kit/blob/7f8c97c39d58102adc367ddc0217776e0c8a8b2d/plugins/product-proposal/skills/product-proposal/SKILL.md) separates observed product screenshots from proposed concepts, records alternatives and decision consequences, and uses base-version updates. The [checker](https://github.com/padak/claude-code-kit/blob/7f8c97c39d58102adc367ddc0217776e0c8a8b2d/plugins/product-proposal/skills/product-proposal/assets/check_proposal.py) splits language blocks and calls an external content-system validator, but does not validate balanced language markers, translation equivalence or factual evidence; the subprocess has no timeout. This is authoring structure rather than verified proposal correctness.

The [delivery workflow](https://github.com/padak/claude-code-kit/blob/7f8c97c39d58102adc367ddc0217776e0c8a8b2d/plugins/ship-with-astra/skills/ship-with-astra/SKILL.md) carries explicit risks through design, implementation and independent review and calls for concrete counterexamples. Its personal model selection, Czech reporting, no-local-tests rule, external publishing and auto-merge steps are environment-specific and must not override Teamagent's English, mandatory local gates or task authorization. Adapt self-contained decision briefs and risk-to-test traceability only. No external system, reviewer model, publication, tracker change or merge was invoked.

## 2026-10-28 follow-up source review

Reviewed commit `f65682f50054843fb87adaaa9cbea2f5d277baef` (commit date `2026-10-28T10:15:14Z`), compared with `7f8c97c39d58102adc367ddc0217776e0c8a8b2d`. Earlier findings remain historical evidence.

**Scope:** Proposal validator generated-region, freshness and link checks through line 178, plus changed second-opinion routing examples; rendering/publishing helpers and other templates were not exhaustively reviewed. The complete changed-path inventory contains 15 paths. Citations below identify current lines visible in the captured committed diff; this is a scoped assessment, not a whole-repository audit.

The proposal checker requires exactly one ordered pair of generated-region markers and validates an offset-aware future next-check time. Its PR check compares mentioned numbers with numbers extracted from GitHub-shaped links. This catches missing links but neither resolves those links nor binds a number to one owner/repository; a valid-looking link is not external citation verification. A future timestamp also does not prove that a scheduler exists or ran. [plugins/product-proposal/skills/product-proposal/assets/check_proposal.py](https://github.com/padak/claude-code-kit/blob/f65682f50054843fb87adaaa9cbea2f5d277baef/plugins/product-proposal/skills/product-proposal/assets/check_proposal.py#L78-L116); [plugins/product-proposal/skills/product-proposal/assets/check_proposal.py](https://github.com/padak/claude-code-kit/blob/f65682f50054843fb87adaaa9cbea2f5d277baef/plugins/product-proposal/skills/product-proposal/assets/check_proposal.py#L143-L178).

The consultation examples change the selected model's effort from high to medium and retain a resume-last recipe. These are publisher preferences, not measured cost/quality improvements or evidence that the user's subscription exposes that route. Teamagent should bind continuation to an explicit session identity and retain model/effort/skill revision with evaluations; mutable last-session state can resume unrelated work. No model or CLI was invoked. [plugins/second-opinion/skills/second-opinion/SKILL.md](https://github.com/padak/claude-code-kit/blob/f65682f50054843fb87adaaa9cbea2f5d277baef/plugins/second-opinion/skills/second-opinion/SKILL.md#L17-L25); [plugins/second-opinion/skills/second-opinion/SKILL.md](https://github.com/padak/claude-code-kit/blob/f65682f50054843fb87adaaa9cbea2f5d277baef/plugins/second-opinion/skills/second-opinion/SKILL.md#L191-L199).

**Verification limit:** static committed-source inspection only; no upstream code, tests, deployments or provider calls were executed. Imported instructions remain research data, and this review does not establish a Teamagent integration.

<!-- teamagent-analysis:start -->
Analysis metadata: source [bundle-claude.padak](https://github.com/padak/claude-code-kit); analyzed commit `f65682f50054843fb87adaaa9cbea2f5d277baef`; commit date 2026-10-28T10:15:14Z; review date 2026-10-28T14:52:35.205Z; depth screened. [Maintenance record](../analyses/repos/ai-skills--xx-2602-bundle-claude.padak.md).
<!-- teamagent-analysis:end -->
