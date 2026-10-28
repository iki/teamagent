# optimize-caveman

Source: [optimize-caveman](https://github.com/JuliusBrussee/caveman) · Category: [ai-skills](../categories/ai-skills.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `aeb45e2f787c0757a8af383a291a280cb6aeb4c1`; commit timestamp `2026-10-03T08:45:26+02:00`; 1,614 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/JuliusBrussee/caveman/blob/aeb45e2f787c0757a8af383a291a280cb6aeb4c1/README.md)):

> Your AI coding agent bills by the word and writes like it knows that. Caveman make it stop. 🏆 **#1 on GitHub Trending · July 2026** &nbsp;·&nbsp; 🥇 **#1 Repository of the Day on Trendshift · April 2026

Build/package evidence: [benchmarks/requirements.txt](https://github.com/JuliusBrussee/caveman/blob/aeb45e2f787c0757a8af383a291a280cb6aeb4c1/benchmarks/requirements.txt); [browse/package.json](https://github.com/JuliusBrussee/caveman/blob/aeb45e2f787c0757a8af383a291a280cb6aeb4c1/browse/package.json); [extension/package.json](https://github.com/JuliusBrussee/caveman/blob/aeb45e2f787c0757a8af383a291a280cb6aeb4c1/extension/package.json); [go.mod](https://github.com/JuliusBrussee/caveman/blob/aeb45e2f787c0757a8af383a291a280cb6aeb4c1/go.mod); [mcp/package.json](https://github.com/JuliusBrussee/caveman/blob/aeb45e2f787c0757a8af383a291a280cb6aeb4c1/mcp/package.json)

License evidence: [LICENSE](https://github.com/JuliusBrussee/caveman/blob/aeb45e2f787c0757a8af383a291a280cb6aeb4c1/LICENSE); [LICENSE-MIT](https://github.com/JuliusBrussee/caveman/blob/aeb45e2f787c0757a8af383a291a280cb6aeb4c1/LICENSE-MIT) Classification hint: Apache-2.0. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-skills**. Its category places it in the candidate set for skills; those associations are navigational and have not been individually validated as implemented capabilities. See [skills](../skills.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

## Source update reviewed 2026-10-28

Reviewed commit: [`9b68f7ed12b05e7efaff18e65c5a3fc2849fd0a4`](https://github.com/JuliusBrussee/caveman/commit/9b68f7ed12b05e7efaff18e65c5a3fc2849fd0a4). Scope: Full caveman and cavecrew skills read. Hooks, mode persistence implementation, subagent presets, proxy/store code and token benchmarks were not reviewed.

The [voice skill](https://github.com/JuliusBrussee/caveman/blob/9b68f7ed12b05e7efaff18e65c5a3fc2849fd0a4/skills/caveman/SKILL.md) preserves negation, technical payloads and explicit language choice, exempts persisted artifacts from compression and distinguishes querying status from activating a mode. When no host hook reports state, it requires an untracked-state label rather than inferring activation from defaults. These are useful semantic-preservation constraints; prompt-only persistence is not demonstrated host state.

The [delegation guide](https://github.com/JuliusBrussee/caveman/blob/9b68f7ed12b05e7efaff18e65c5a3fc2849fd0a4/skills/cavecrew/SKILL.md) uses compact locator/findings contracts and explicit too-large/ambiguous outcomes. Its context savings are hypothetical examples, not measurements, and a builder's reread receipt is not independent behavioral verification. Location-only or highly compressed findings still need commit identity, inspected scope, uncertainty and enough reasoning to assess the defect. Evaluate total tokens, recovery overhead and correctness on paired tasks before adopting compression, and keep full sentences where ambiguity would change an action. No modes, hooks, agents, proxy or benchmarks were run.

<!-- teamagent-analysis:start -->
Analysis metadata: source [optimize-caveman](https://github.com/JuliusBrussee/caveman); analyzed commit `9b68f7ed12b05e7efaff18e65c5a3fc2849fd0a4`; commit date 2026-10-25T08:57:37+01:00; review date 2026-10-28T09:45:33.667Z; depth screened. [Maintenance record](../analyses/repos/ai-skills--optimize-caveman.md).
<!-- teamagent-analysis:end -->
