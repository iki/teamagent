# design.modern-web-guidance.google

Source: [design.modern-web-guidance.google](https://github.com/GoogleChrome/modern-web-guidance-src) · Category: [ai-skills](../categories/ai-skills.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `1a3883f9041deaff0fe6442cbd425cc28321b342`; commit timestamp `2026-10-03T13:46:21-07:00`; 1,536 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/GoogleChrome/modern-web-guidance-src/blob/1a3883f9041deaff0fe6442cbd425cc28321b342/README.md)):

> This repo is the source repository for GoogleChrome/modern-web-guidance and includes the code and documentation for authoring, calibrating, and evaluating its contents. Modern Web Guidance** is a set of skills that embed web platform expertise, best practices, and browser compatibility data directly into your coding agents. It helps to steer your coding agents away from legacy patterns, and instead toward solutions that harness the power and capabilities of the modern web platform.

Build/package evidence: [eval-view/package.json](https://github.com/GoogleChrome/modern-web-guidance-src/blob/1a3883f9041deaff0fe6442cbd425cc28321b342/eval-view/package.json); [guides/package.json](https://github.com/GoogleChrome/modern-web-guidance-src/blob/1a3883f9041deaff0fe6442cbd425cc28321b342/guides/package.json); [harness/base_apps/cards-app/package.json](https://github.com/GoogleChrome/modern-web-guidance-src/blob/1a3883f9041deaff0fe6442cbd425cc28321b342/harness/base_apps/cards-app/package.json); [harness/base_apps/daily-grind/package.json](https://github.com/GoogleChrome/modern-web-guidance-src/blob/1a3883f9041deaff0fe6442cbd425cc28321b342/harness/base_apps/daily-grind/package.json); [harness/base_apps/devtools-times/package.json](https://github.com/GoogleChrome/modern-web-guidance-src/blob/1a3883f9041deaff0fe6442cbd425cc28321b342/harness/base_apps/devtools-times/package.json)

License evidence: [LICENSE](https://github.com/GoogleChrome/modern-web-guidance-src/blob/1a3883f9041deaff0fe6442cbd425cc28321b342/LICENSE) Classification hint: Apache-2.0. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-skills**. Its category places it in the candidate set for skills; those associations are navigational and have not been individually validated as implemented capabilities. See [skills](../skills.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

## Source update reviewed 2026-10-28

Reviewed commit: [`5da9dec8e40757bcf995367f4e893fe6fbec6e38`](https://github.com/GoogleChrome/modern-web-guidance-src/commit/5da9dec8e40757bcf995367f4e893fe6fbec6e38). Scope: Full postinstall cleanup, skills configuration, version notifier/tests and prompt-canary skill read. Authoring runner, actual isolated execution, publication and deployed client behavior were not audited.

The [version notifier](https://github.com/GoogleChrome/modern-web-guidance-src/blob/5da9dec8e40757bcf995367f4e893fe6fbec6e38/src/cli/skill-version.ts) deliberately compares commit dates rather than abbreviated SHA identity, with [tests](https://github.com/GoogleChrome/modern-web-guidance-src/blob/5da9dec8e40757bcf995367f4e893fe6fbec6e38/src/cli/skill-version.test.ts) for grace periods and callers newer than the package. Equal dates therefore do not prove equal contents, and missing/unparseable dates are silent. Calendar parsing normalizes invalid dates rather than validating their components; this is an update hint, not source-integrity verification.

The [canary procedure](https://github.com/GoogleChrome/modern-web-guidance-src/blob/5da9dec8e40757bcf995367f4e893fe6fbec6e38/.agents/skills/dev-prompt-canary/SKILL.md) recognizes that prompt-string tests cannot establish generated behavior and adds structurally different held-out solutions. One fourth solution is narrow evidence, not generalization proof. Its linked dependency and secret files also mean a worktree is not execution isolation. The [postinstall cleanup](https://github.com/GoogleChrome/modern-web-guidance-src/blob/5da9dec8e40757bcf995367f4e893fe6fbec6e38/src/core/postinstall.ts) recursively removes fixed legacy paths without checking content ownership, while [bundle configuration](https://github.com/GoogleChrome/modern-web-guidance-src/blob/5da9dec8e40757bcf995367f4e893fe6fbec6e38/src/core/skills-config.ts) separates standalone publication from the main skill. Adapt targeted canaries and explicit migration receipts; do not run the cleanup or adopt its dependency workflow here. No generation, install, cleanup or tests were executed.

<!-- teamagent-analysis:start -->
Analysis metadata: source [design.modern-web-guidance.google](https://github.com/GoogleChrome/modern-web-guidance-src); analyzed commit `5da9dec8e40757bcf995367f4e893fe6fbec6e38`; commit date 2026-10-27T09:39:55-07:00; review date 2026-10-28T09:45:33.667Z; depth screened. [Maintenance record](../analyses/repos/ai-skills--design.modern-web-guidance.google.md).
<!-- teamagent-analysis:end -->
