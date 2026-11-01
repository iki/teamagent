# ai-engineering-from-scratch

Source: [ai-engineering-from-scratch](https://github.com/rohitg00/ai-engineering-from-scratch) · Category: [ai-info](../categories/ai-info.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `3be078b37ffd8f0c04953c0678e48f5c6d0c7775`; commit timestamp `2026-10-02T05:37:23Z`; 5,423 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/rohitg00/ai-engineering-from-scratch/blob/3be078b37ffd8f0c04953c0678e48f5c6d0c7775/README.md)):

> Translated landing pages, committed to the repo. English is canonical; lesson pages are machine-translated on the  translations  branch. See  docs/i18n.md . 84% of students already use AI tools. Only 18% feel prepared to use them

Build/package evidence: [phases/19-capstone-projects/01-terminal-native-coding-agent/code/ts/package.json](https://github.com/rohitg00/ai-engineering-from-scratch/blob/3be078b37ffd8f0c04953c0678e48f5c6d0c7775/phases/19-capstone-projects/01-terminal-native-coding-agent/code/ts/package.json); [phases/19-capstone-projects/02-rag-over-codebase/code/ts/package.json](https://github.com/rohitg00/ai-engineering-from-scratch/blob/3be078b37ffd8f0c04953c0678e48f5c6d0c7775/phases/19-capstone-projects/02-rag-over-codebase/code/ts/package.json); [phases/19-capstone-projects/03-realtime-voice-assistant/code/ts/package.json](https://github.com/rohitg00/ai-engineering-from-scratch/blob/3be078b37ffd8f0c04953c0678e48f5c6d0c7775/phases/19-capstone-projects/03-realtime-voice-assistant/code/ts/package.json); [phases/19-capstone-projects/04-multimodal-document-qa/code/ts/package.json](https://github.com/rohitg00/ai-engineering-from-scratch/blob/3be078b37ffd8f0c04953c0678e48f5c6d0c7775/phases/19-capstone-projects/04-multimodal-document-qa/code/ts/package.json); [phases/19-capstone-projects/06-devops-troubleshooting-agent/code/ts/package.json](https://github.com/rohitg00/ai-engineering-from-scratch/blob/3be078b37ffd8f0c04953c0678e48f5c6d0c7775/phases/19-capstone-projects/06-devops-troubleshooting-agent/code/ts/package.json)

License evidence: [LICENSE](https://github.com/rohitg00/ai-engineering-from-scratch/blob/3be078b37ffd8f0c04953c0678e48f5c6d0c7775/LICENSE) Classification hint: MIT. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-info**. Its category places it in the candidate set for agents, evolution; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [evolution](../evolution.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

## Source update reviewed 2026-10-28

Reviewed commit: [`3f9715c62a3bedcffb68a260f1a65ee2dd9cc10a`](https://github.com/rohitg00/ai-engineering-from-scratch/commit/3f9715c62a3bedcffb68a260f1a65ee2dd9cc10a). Scope: Full course-guide and course-style skills plus isometric model-test template read. Curriculum lessons, referenced style resources, simulator implementation and deployed site were not reviewed.

The [course router](https://github.com/rohitg00/ai-engineering-from-scratch/blob/3f9715c62a3bedcffb68a260f1a65ee2dd9cc10a/skills/course-guide/SKILL.md) separates portable skill names from host invocation syntax, selects focused lesson routes by manifest order and asks for lesson-content confirmation when a title alone cannot support a recommendation. Its fallback reads mutable main-branch content; Teamagent should retain the resolved revision and route-state provenance. Lesson counts, certification mappings and host-specific commands remain upstream claims within this review.

The [style reference](https://github.com/rohitg00/ai-engineering-from-scratch/blob/3f9715c62a3bedcffb68a260f1a65ee2dd9cc10a/skills/course-style/SKILL.md) usefully separates shared design tokens from drawing methods and calls for dark-mode, focus and reduced-motion checks. Its exact typography and prose restrictions are product preferences, not universal requirements. The [model tests](https://github.com/rohitg00/ai-engineering-from-scratch/blob/3f9715c62a3bedcffb68a260f1a65ee2dd9cc10a/skills/isometric-explainer/templates/model.test.mjs) check deterministic simulated traces, nondecreasing clocks and URL-setting round trips; these are illustrative model contracts, not measured caching performance or rendered accessibility. No lesson, simulator, site or tests were run.

## 2026-11-01 scoped source review

Reviewed commit `fe6c657dfb8d02cc898fcee7d4cfbf663aae1416` (commit date `2026-10-29T15:04:28Z`), compared with `3f9715c62a3bedcffb68a260f1a65ee2dd9cc10a`. Earlier observations remain historical evidence.

**Scope:** Lesson-screen event reader/counting code, selected event-endpoint implementation and corresponding server fixtures. Complete browser security, all server routes, teaching effectiveness and duplicated skill distribution were not audited.

The [lesson-screen helper](https://github.com/rohitg00/ai-engineering-from-scratch/blob/fe6c657dfb8d02cc898fcee7d4cfbf663aae1416/skills/lesson-screen/scripts/lesson-screen.mjs) bounds an individual event request, checks a permitted event type, retains selected fields and appends timestamped JSON lines. Its readEvents path allocates the complete unread file remainder, skips JSON parse failures and advances the cursor to the observed file size; a malformed or partial line can therefore be consumed without a reported record. [Server fixtures](https://github.com/rohitg00/ai-engineering-from-scratch/blob/fe6c657dfb8d02cc898fcee7d4cfbf663aae1416/site/test_lesson_screen.js) exercise unauthorized access, invalid event input, oversized requests and cursor-based consumption, but the inspected cases do not establish recovery from an interrupted append. A per-request limit does not bound accumulated event history.

**Teamagent implication (inference):** Model interactive teaching or agent-channel input as a validated event stream with bounded replay. Advance durable cursors only across complete accepted records, report malformed evidence explicitly and separate per-message limits from cumulative retention limits. Browser interaction data remains untrusted even when served by a local helper.

**Verification limit:** committed-source inspection only; no upstream code, tests or provider calls were executed. Review scope is the cited implementation or authored guidance, not whole-project correctness, licensing clearance or measured performance. Source passages were redacted for review; exact URL literals were not byte-validated.

<!-- teamagent-analysis:start -->
Analysis metadata: source [ai-engineering-from-scratch](https://github.com/rohitg00/ai-engineering-from-scratch); analyzed commit `fe6c657dfb8d02cc898fcee7d4cfbf663aae1416`; commit date 2026-10-29T15:04:28Z; review date 2026-11-01T11:35:43.470Z; depth screened. [Maintenance record](../analyses/repos/ai-info--ai-engineering-from-scratch.md).
<!-- teamagent-analysis:end -->
