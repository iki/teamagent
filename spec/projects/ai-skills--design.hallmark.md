# design.hallmark

Source: [design.hallmark](https://github.com/nutlope/hallmark) · Category: [ai-skills](../categories/ai-skills.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `13ac0ec7e148655948100b6396439e481361d690`; commit timestamp `2026-08-06T09:19:18-07:00`; 286 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/nutlope/hallmark/blob/13ac0ec7e148655948100b6396439e481361d690/README.md)):

> A design skill for Claude Code, Cursor, and Codex that refuses to look AI-generated. Live demo → &nbsp;·&nbsp; twenty-one themes &nbsp;·&nbsp; four verbs &nbsp;·&nbsp; press `T` to cycle.

Build/package evidence: [package.json](https://github.com/nutlope/hallmark/blob/13ac0ec7e148655948100b6396439e481361d690/package.json)

License evidence: [LICENSE](https://github.com/nutlope/hallmark/blob/13ac0ec7e148655948100b6396439e481361d690/LICENSE) Classification hint: MIT. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-skills**. Its category places it in the candidate set for skills; those associations are navigational and have not been individually validated as implemented capabilities. See [skills](../skills.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

## Source update reviewed 2026-10-28

Reviewed commit: [`6033bab2a8051b5454552d2e8e6cb8f27c483a42`](https://github.com/nutlope/hallmark/commit/6033bab2a8051b5454552d2e8e6cb8f27c483a42). Scope: Full screenshot helper and composition reference read. Image-generation helper, theme implementation, design gates and live browser/app capture were not reviewed.

The [capture helper](https://github.com/nutlope/hallmark/blob/6033bab2a8051b5454552d2e8e6cb8f27c483a42/skills/hallmark/scripts/capture.mjs) supports fixed viewport screenshots and existing local DevTools sessions, constrains constructed routes to the target origin and closes a launched browser in finally. It does not constrain redirected destinations or subresources, bounds neither the number of routes nor screenshot dimensions, and waits for document fonts without a surrounding deadline. Partial skips can still end successfully when one image exists; retain requested-versus-captured coverage. Attaching to an existing DevTools endpoint also exposes the real app's current state, so destination ownership and sensitive-screen review are required.

The [composition guidance](https://github.com/nutlope/hallmark/blob/6033bab2a8051b5454552d2e8e6cb8f27c483a42/skills/hallmark/references/comp.md) separates a visual proposal from compliance evidence and requires comparing the rendered result at matching dimensions. Its controlled one-axis comparison and explicit medium inventory can improve design review. A detected provider key is capability, not authorization for paid generation, and the local tool/provider choices are not adopted here. No browser, app, screenshot, image generation or tests were run.

<!-- teamagent-analysis:start -->
Analysis metadata: source [design.hallmark](https://github.com/nutlope/hallmark); analyzed commit `6033bab2a8051b5454552d2e8e6cb8f27c483a42`; commit date 2026-10-27T16:05:53+01:00; review date 2026-10-28T09:45:33.667Z; depth screened. [Maintenance record](../analyses/repos/ai-skills--design.hallmark.md).
<!-- teamagent-analysis:end -->
