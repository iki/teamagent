# bundle.vasilyu83

Source: [bundle.vasilyu83](https://github.com/vasilyu1983/AI-Agents-public) · Category: [ai-skills](../categories/ai-skills.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `8dc5de47c1db00f8ba01806f5dddd798fc78cf22`; commit timestamp `2026-09-23T16:56:18+01:00`; 3,332 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/vasilyu1983/AI-Agents-public/blob/8dc5de47c1db00f8ba01806f5dddd798fc78cf22/README.md)):

> 28 Custom GPT agents** and **140 agent skills** for ChatGPT, Claude Code, and Codex. Agent skills are portable instruction sets that teach AI agents how to execute domain work

Build/package evidence: No common build manifest identified.

License evidence: [LICENSE](https://github.com/vasilyu1983/AI-Agents-public/blob/8dc5de47c1db00f8ba01806f5dddd798fc78cf22/LICENSE) Classification hint: MIT. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-skills**. Its category places it in the candidate set for skills; those associations are navigational and have not been individually validated as implemented capabilities. See [skills](../skills.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

## Source update reviewed 2026-10-28

Reviewed commit: [`01246042082225a482980162543f453067143e8b`](https://github.com/vasilyu1983/AI-Agents-public/commit/01246042082225a482980162543f453067143e8b). Scope: Full LLM-adaptation skill, its learning note and routing-log template read. Linked adaptation references, trainers, evaluation scripts and feedback-loop implementation were not reviewed.

This review uses a retained local snapshot. Discovery recorded the source lifecycle as removed and upstream availability as `not_found_or_inaccessible`; the pinned links identify provenance and do not establish current upstream availability.

The [adaptation skill](https://github.com/vasilyu1983/AI-Agents-public/blob/01246042082225a482980162543f453067143e8b/skills/universal/ai-llm/SKILL.md) separates whether to adapt from how to adapt, groups source duplicates before splitting or augmentation, compares training and serving tokenization and gates the exact deployed artifact with task and forgetting slices. It asks for model-derived parameter counts and teacher-use permission instead of relying on generic percentages or assumed rights. Its method escalation defaults remain heuristics requiring workload evidence; this file ships no training implementation.

The [learning note](https://github.com/vasilyu1983/AI-Agents-public/blob/01246042082225a482980162543f453067143e8b/skills/universal/ai-llm/learnings.md) correctly treats model prices and retirement facts as time-sensitive. The [routing log](https://github.com/vasilyu1983/AI-Agents-public/blob/01246042082225a482980162543f453067143e8b/skills/routing-log.md) contains an explicitly replaceable example WIN, not a measured successful route. Adapt source-group separation, serving-artifact evaluation and provenance-aware learning, while ensuring example rows cannot become telemetry and append operations have authorized storage and privacy rules. No dataset, model, trainer or feedback script was run.

<!-- teamagent-analysis:start -->
Analysis metadata: source [bundle.vasilyu83](https://github.com/vasilyu1983/AI-Agents-public); analyzed commit `01246042082225a482980162543f453067143e8b`; commit date 2026-10-16T09:19:00+01:00; review date 2026-10-28T09:45:33.667Z; depth screened. [Maintenance record](../analyses/repos/ai-skills--bundle.vasilyu83.md).
<!-- teamagent-analysis:end -->
