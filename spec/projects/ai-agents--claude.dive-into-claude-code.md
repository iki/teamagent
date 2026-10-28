# claude.dive-into-claude-code

Source: [claude.dive-into-claude-code](https://github.com/VILA-Lab/Dive-into-Claude-Code) · Category: [ai-agents](../categories/ai-agents.md)

Original review depth: **inventory / README screening only**. The dated update review below has its own explicit scope. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `0f4ee62f09b25ea0343336cca8903c6db796abb0`; commit timestamp `2026-09-30T23:21:32+08:00`; 22 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/VILA-Lab/Dive-into-Claude-Code/blob/0f4ee62f09b25ea0343336cca8903c6db796abb0/README.md)):

> A comprehensive source-level architectural analysis of Claude Code (v2.1.88, ~1,900 TypeScript files, ~512K lines of code), combined with a curated collection of community analyses, a design-space guide for agent builders, and cross-system comparisons. TL;DR** -- Only 1.6% of Claude Code's codebase is AI decision logic. The other 98.4% is deterministic infrastructure -- permission gates, context management, tool routing, and recovery logic. The agent loop is a simple while-loop; the real engineering complexity lives in the systems around it. Th

Build/package evidence: No common build manifest identified.

License evidence: [LICENSE](https://github.com/VILA-Lab/Dive-into-Claude-Code/blob/0f4ee62f09b25ea0343336cca8903c6db796abb0/LICENSE) Classification hint: not classified; inspect source. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents**. Its category places it in the candidate set for agents, models, channels; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [models](../models.md) · [channels](../channels.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

## 2026-10-27 scoped update review

Reviewed commit `f5ae96a8bdad0b9ed075b444a0dc3b94875008f1` (commit date `2026-10-27T00:42:11+08:00`). The original snapshot above remains historical evidence.

**Scope:** Complete ten-path documentation/graphic inventory; selected English README and design/source-note changes, architecture resume paragraph and build-guide recovery discussion. This repository is secondary analysis, not the vendor agent implementation. Translations, full added citation catalog and the two large images were not independently verified/rendered.

The update narrows claims that were too easy to generalize. The [README](https://github.com/VILA-Lab/Dive-into-Claude-Code/blob/f5ae96a8bdad0b9ed075b444a0dc3b94875008f1/README.md#L183-L200) now attributes the pre-trust vulnerabilities to earlier releases and describes trust-gated standard interactive startup in its analyzed snapshot. The [architecture document](https://github.com/VILA-Lab/Dive-into-Claude-Code/blob/f5ae96a8bdad0b9ed075b444a0dc3b94875008f1/docs/architecture.md#L220) distinguishes a fresh-process resume from a resume/fork inside an already-running process: transient grants are described as absent from the transcript, rather than universally erased by every resume operation. These remain the authors' secondary-source assertions, not a new Teamagent verification of proprietary runtime behavior.

The [design guide](https://github.com/VILA-Lab/Dive-into-Claude-Code/blob/f5ae96a8bdad0b9ed075b444a0dc3b94875008f1/docs/build-your-own-agent.md#L192-L198) separates persisted checkpoints from an effect-recovery protocol. Adopt that architectural distinction on independently reviewed implementation evidence, including the [Orchard review](ai-agents--orchard.md); do not import a research percentage or vendor feature statement simply because this catalog repeats it.

The expanded source notes mix papers, vendor posts and changelogs with differing dates and verification levels. Their links remain research leads until the primary source and applicable version are checked. Keep historical versions, explicitly scoped claims, and separate evidence levels for documentation, inspected source, executed fixtures and live behavior. This update does not certify the new external citation catalog, license reuse of graphics, or the announced extension permission model.

**Verification limit:** source inspection only; no upstream tests or provider calls were executed. This scoped review does not certify every file in the repository.

<!-- teamagent-analysis:start -->
Analysis metadata: source [claude.dive-into-claude-code](https://github.com/VILA-Lab/Dive-into-Claude-Code); analyzed commit `f5ae96a8bdad0b9ed075b444a0dc3b94875008f1`; commit date 2026-10-27T00:42:11+08:00; review date 2026-10-28T08:26:04.502Z; depth screened. [Maintenance record](../analyses/repos/ai-agents--claude.dive-into-claude-code.md).
<!-- teamagent-analysis:end -->
