# agent-copilot

Source: [agent-copilot](https://github.com/github/awesome-copilot) · Category: [ai-skills](../categories/ai-skills.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `143a3d976b3c1603cc8932984d5e1f28501cb5fc`; commit timestamp `2026-10-02T08:21:25+10:00`; 2,990 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/github/awesome-copilot/blob/143a3d976b3c1603cc8932984d5e1f28501cb5fc/README.md)):

> A community-created collection of custom agents, instructions, skills, hooks, workflows, and plugins to supercharge your GitHub Copilot experience. Explore the full collection on the website →** awesome-copilot.github.com

Build/package evidence: [cookbook/copilot-sdk/nodejs/recipe/package.json](https://github.com/github/awesome-copilot/blob/143a3d976b3c1603cc8932984d5e1f28501cb5fc/cookbook/copilot-sdk/nodejs/recipe/package.json); [cookbook/copilot-sdk/python/recipe/requirements.txt](https://github.com/github/awesome-copilot/blob/143a3d976b3c1603cc8932984d5e1f28501cb5fc/cookbook/copilot-sdk/python/recipe/requirements.txt); [extensions/accessibility-kanban/package.json](https://github.com/github/awesome-copilot/blob/143a3d976b3c1603cc8932984d5e1f28501cb5fc/extensions/accessibility-kanban/package.json); [extensions/arcade-canvas/package.json](https://github.com/github/awesome-copilot/blob/143a3d976b3c1603cc8932984d5e1f28501cb5fc/extensions/arcade-canvas/package.json); [extensions/backlog-swipe-triage/package.json](https://github.com/github/awesome-copilot/blob/143a3d976b3c1603cc8932984d5e1f28501cb5fc/extensions/backlog-swipe-triage/package.json)

License evidence: [LICENSE](https://github.com/github/awesome-copilot/blob/143a3d976b3c1603cc8932984d5e1f28501cb5fc/LICENSE) Classification hint: MIT. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-skills**. Its category places it in the candidate set for skills; those associations are navigational and have not been individually validated as implemented capabilities. See [skills](../skills.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

## Source update reviewed 2026-10-28

Reviewed commit: [`d75b41863510272ed217a3074c7045202b96e93f`](https://github.com/github/awesome-copilot/commit/d75b41863510272ed217a3074c7045202b96e93f). Scope: Full LSP setup and caption-QA skills plus WebMCP launcher-consent test read. Referenced standards, LSP clients, launcher implementation and real browser integration were not reviewed.

The [LSP skill](https://github.com/github/awesome-copilot/blob/d75b41863510272ed217a3074c7045202b96e93f/skills/lsp-setup/SKILL.md) preserves existing configuration and separates user from repository scope, while acknowledging a specific client-version observation rather than claiming universal file discovery. Binary presence and JSON validity are only setup checks; semantic navigation still needs the restarted host. The [WebMCP fixture](https://github.com/github/awesome-copilot/blob/d75b41863510272ed217a3074c7045202b96e93f/skills/webmcpify/tests/workbench-cli.test.mjs) separately tests package-install and browser-download consent, including noninteractive denial, using fake package/browser machinery. It does not demonstrate a real browser or cross-platform launcher.

The [caption procedure](https://github.com/github/awesome-copilot/blob/d75b41863510272ed217a3074c7045202b96e93f/skills/caption-qa/SKILL.md) usefully distinguishes target-specific limits, advice and certification, and recommends rechecking after retiming. Its embedded example silently ignores unparsed blocks and reports an empty cue set as passing; its regex also does not support the stated seconds-only timestamp form. It does not explicitly skip NOTE/STYLE/REGION blocks. Do not adopt it as a delivery gate without format validation and negative fixtures. The quoted standard limits were not independently refreshed here. No installation, captions, browser or tests were executed.

## 2026-10-28 follow-up source review

Reviewed commit `0fe6545b950671641b2b14b44eb56678fea6c6b4` (commit date `2026-10-28T16:23:53+11:00`), compared with `d75b41863510272ed217a3074c7045202b96e93f`. Earlier findings remain historical evidence.

**Scope:** Canvas error-handoff redaction, request deadline, server admission and pending-dispatch branches; other skills and the full lifecycle were not audited. The complete changed-path inventory contains 49 paths. Citations below identify current lines visible in the captured committed diff; this is a scoped assessment, not a whole-repository audit.

The handoff bounds and redacts error text, caps client request time and checks loopback address, exact Host/Origin, token/header and content type before accepting a start request. A pending request record is created before asynchronous dispatch; an acknowledgement is not evidence that a fix session exists. The generated prompt labels the diagnostic untrusted and narrows the requested action, but those words are instructions to the agent, not an enforcement boundary. [eng/canvas-error-handoff/runtime.mjs](https://github.com/github/awesome-copilot/blob/0fe6545b950671641b2b14b44eb56678fea6c6b4/eng/canvas-error-handoff/runtime.mjs#L1-L84); [eng/canvas-error-handoff/runtime.mjs](https://github.com/github/awesome-copilot/blob/0fe6545b950671641b2b14b44eb56678fea6c6b4/eng/canvas-error-handoff/runtime.mjs#L98-L120); [eng/canvas-error-handoff/runtime.mjs](https://github.com/github/awesome-copilot/blob/0fe6545b950671641b2b14b44eb56678fea6c6b4/eng/canvas-error-handoff/runtime.mjs#L300-L387).

Redaction is heuristic, and the inspected maps are process-local. Request-body bytes are capped while reading, without an explicit body-read deadline in this branch; the HTML wrapper collects response chunks without a byte limit and always reports a successful write. Teamagent should keep authoritative admission, bounded diagnostics and durable uncertain-result receipts separate from UI affordances, and enforce output/backpressure limits independently. No browser or agent session was started. [eng/canvas-error-handoff/runtime.mjs](https://github.com/github/awesome-copilot/blob/0fe6545b950671641b2b14b44eb56678fea6c6b4/eng/canvas-error-handoff/runtime.mjs#L419-L440).

**Verification limit:** static committed-source inspection only; no upstream code, tests, deployments or provider calls were executed. Imported instructions remain research data, and this review does not establish a Teamagent integration.

## 2026-11-01 scoped source review

Reviewed commit `5269f7ea2d6c3a9bfda5ed878b6726cf509121fd` (commit date `2026-10-30T11:35:13+11:00`), compared with `0fe6545b950671641b2b14b44eb56678fea6c6b4`. Earlier observations remain historical evidence.

**Scope:** Selected schema-reading, metering, estimation and output branches of the new credit collector; 84 changed paths inventoried. Remaining collector logic, extension integration and live pricing not audited.

The [collector](https://github.com/github/awesome-copilot/blob/5269f7ea2d6c3a9bfda5ed878b6726cf509121fd/extensions/ai-credits-breakdown/collector.mjs) opens local SQLite read-only, checks expected columns and reads usage/token fields rather than prompt bodies. It reports assumed model rates and cache-TTL assumptions separately, but also reads automation and repository names, which can be sensitive. Residual/credit estimates and unavailable fields remain distinct from authoritative billing; the inspected source does not verify current prices.

**Teamagent implication (inference):** Expose measured usage, derived estimates, assumptions and missing evidence separately. Keep local account/project metadata outside public logs, and bind cost forecasts to dated route-specific rates without treating a local estimate as provider billing or spend authorization.

**Verification limit:** committed-source inspection only; no upstream code, tests or provider calls were executed. Review scope is the cited implementation or authored guidance, not whole-project correctness, licensing clearance or measured performance. Source passages were redacted for review; exact URL literals were not byte-validated.

<!-- teamagent-analysis:start -->
Analysis metadata: source [agent-copilot](https://github.com/github/awesome-copilot); analyzed commit `5269f7ea2d6c3a9bfda5ed878b6726cf509121fd`; commit date 2026-10-30T11:35:13+11:00; review date 2026-11-01T11:37:37.120Z; depth screened. [Maintenance record](../analyses/repos/ai-skills--agent-copilot.md).
<!-- teamagent-analysis:end -->
