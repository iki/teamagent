# cline

Source: [cline](https://github.com/cline/cline) · Category: [ai-agents](../categories/ai-agents.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `39ff2359f7e08231281539696e48a166ce49270c`; commit timestamp `2026-10-03T00:33:13+02:00`; 4,179 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/cline/cline/blob/39ff2359f7e08231281539696e48a166ce49270c/README.md)):

> Build your own AI agents and integrations powered by the same engine that runs the CLI, desktop app, VS Code extension, and JetBrains plugin. Custom tools, multi-agent teams, connectors, scheduled automations, and more. Cline reads your project structure, understands the relationships between files, and makes coordinated changes across your codebase. It monitors linter and compiler errors as it works, fixing issues like missing imports, type mismatches, and syntax errors before you even see them. In VS Code and JetBrains, every edit shows up as

Build/package evidence: [apps/cli/package.json](https://github.com/cline/cline/blob/39ff2359f7e08231281539696e48a166ce49270c/apps/cli/package.json); [apps/cli/src/tests/package.json](https://github.com/cline/cline/blob/39ff2359f7e08231281539696e48a166ce49270c/apps/cli/src/tests/package.json); [apps/cline-hub/package.json](https://github.com/cline/cline/blob/39ff2359f7e08231281539696e48a166ce49270c/apps/cline-hub/package.json); [apps/cline-hub/src/webview/package.json](https://github.com/cline/cline/blob/39ff2359f7e08231281539696e48a166ce49270c/apps/cline-hub/src/webview/package.json); [apps/examples/cli-agent/package.json](https://github.com/cline/cline/blob/39ff2359f7e08231281539696e48a166ce49270c/apps/examples/cli-agent/package.json)

License evidence: [LICENSE](https://github.com/cline/cline/blob/39ff2359f7e08231281539696e48a166ce49270c/LICENSE) Classification hint: Apache-2.0. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents**. Its category places it in the candidate set for agents, models, channels; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [models](../models.md) · [channels](../channels.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

## 2026-10-28 scoped source review

Source: [cline](https://github.com/cline/cline); inspected saved discovery revision `943d6284ccc43521637a6d5bf9d51d052c36e1fc`. Prior analyzed revision `39ff2359f7e08231281539696e48a166ce49270c` remains historical evidence.

**Scope:** Complete CLI run-agent host adapter and default loop/checkpoint constants. Core session start/send, hook shutdown, approvals, checkpoint implementation and tests were not inspected.

The [CLI adapter](https://github.com/cline/cline/blob/943d6284ccc43521637a6d5bf9d51d052c36e1fc/apps/cli/src/runtime/run-agent.ts#L217-L271) subscribes using a planned session ID before startup and memoizes cleanup so signal and finally paths share shutdown. However, abort only calls the session manager once an active ID exists; an earlier signal sets the flag without a visible post-start replay. The [local timeout](https://github.com/cline/cline/blob/943d6284ccc43521637a6d5bf9d51d052c36e1fc/apps/cli/src/runtime/run-agent.ts#L285-L352) is scheduled only after `start` returns, and the adjacent comment explicitly allows `start` to have already executed the first turn. This host timeout therefore does not itself bound startup or that first-turn path; any core-enforced bound must be established separately.

Cleanup awaits hook shutdown, stop and disposal while swallowing their errors, without its own deadline. A second SIGINT also waits for that cleanup before process exit, so it is not an unconditional prompt hard stop. The source separates abort-requested events, result publication and finish reason, which Teamagent should preserve along with explicit cleanup failures and uncertain effects rather than inferring successful termination from an aborted label.

The [CLI defaults](https://github.com/cline/cline/blob/943d6284ccc43521637a6d5bf9d51d052c36e1fc/apps/cli/src/runtime/defaults.ts#L1-L24) enable loop detection and checkpoints even though the core defaults differ. These constants and host configuration do not prove checkpoint recoverability or OS isolation. Usage display can zero cost through a provider-specific helper; that helper's eligibility and billing semantics were not audited. No CLI, provider, checkpoint, subprocess or upstream test was executed.

## 2026-10-28 follow-up source review

Reviewed commit `f817e59f698f01487920c00ede2dbecad5c0fa50` (commit date `2026-10-27T17:34:58-07:00`), compared with `943d6284ccc43521637a6d5bf9d51d052c36e1fc`. Earlier findings remain historical evidence.

**Scope:** Cloud handoff admission, account-sensitive publication joining and rejected-credential handling. The complete changed-path inventory contains 19 paths; the assessment below is limited to the cited branches.

Local Git handoff inputs are strict and bind repository, branch, workspace, organization and request identity. Before publication the service validates media, checks the current organization and available model, applies and verifies Git publication, and rechecks account generation between stages. Concurrent identical requests share a promise keyed by scope generation/request ID. See [sdk/packages/core/src/hub/server/cloud-session-service.ts](https://github.com/cline/cline/blob/f817e59f698f01487920c00ede2dbecad5c0fa50/sdk/packages/core/src/hub/server/cloud-session-service.ts#L496-L548) and [sdk/packages/core/src/hub/server/cloud-session-service.ts](https://github.com/cline/cline/blob/f817e59f698f01487920c00ede2dbecad5c0fa50/sdk/packages/core/src/hub/server/cloud-session-service.ts#L31-L124). The promise is removed in finally, so this is in-flight joining rather than durable effect deduplication.

Definitively rejected credentials are remembered privately until credential contents change, avoiding repeated refresh attempts; the fingerprint contains credentials and must remain memory-only as documented. See [sdk/packages/core/src/hub/server/cloud-session-service.ts](https://github.com/cline/cline/blob/f817e59f698f01487920c00ede2dbecad5c0fa50/sdk/packages/core/src/hub/server/cloud-session-service.ts#L178-L198) and [sdk/packages/core/src/hub/server/cloud-session-service.ts](https://github.com/cline/cline/blob/f817e59f698f01487920c00ede2dbecad5c0fa50/sdk/packages/core/src/hub/server/cloud-session-service.ts#L331-L371). Teamagent needs durable publication receipts and reconciliation after uncertain completion, and must distinguish listed model availability from policy/cost permission. Git helper internals and provider-side idempotency were not verified.

**Verification limit:** committed-source inspection only; no upstream code, tests or provider calls were executed. This review does not certify every changed file or establish a Teamagent integration.

## 2026-11-01 scoped source review

Reviewed commit `a6507a62a147db4a35e27f4294589742ccac5060` (commit date `2026-10-30T14:21:13-07:00`), compared with `f817e59f698f01487920c00ede2dbecad5c0fa50`. Earlier observations remain historical evidence.

**Scope:** Complete auth-service privacy-path propagation and fixture diff; 143 changed paths inventoried. Privacy page, account settings and navigation validation not audited.

The [auth service](https://github.com/cline/cline/blob/a6507a62a147db4a35e27f4294589742ccac5060/apps/vscode/src/sdk/auth-service.ts) now forwards an optional dataPrivacyPath from user information into its exposed account state. The [fixture](https://github.com/cline/cline/blob/a6507a62a147db4a35e27f4294589742ccac5060/apps/vscode/src/sdk/auth-service.test.ts) checks the expected dashboard path. This exposes a settings destination; it neither reads effective training policy nor establishes an opt-out, Enterprise coverage or authenticated policy verification.

**Teamagent implication (inference):** Offer route-specific setup/privacy links while keeping policy evidence and its verification level separate. Never infer a non-training decision from a key, successful sign-in or the presence of a privacy-settings URL; validate navigation destinations at the host boundary.

**Verification limit:** committed-source inspection only; no upstream code, tests or provider calls were executed. Review scope is the cited implementation or authored guidance, not whole-project correctness, licensing clearance or measured performance. Source passages were redacted for review; exact URL literals were not byte-validated.

<!-- teamagent-analysis:start -->
Analysis metadata: source [cline](https://github.com/cline/cline); analyzed commit `a6507a62a147db4a35e27f4294589742ccac5060`; commit date 2026-10-30T14:21:13-07:00; review date 2026-11-01T11:33:30.893Z; depth screened. [Maintenance record](../analyses/repos/ai-agents--cline.md).
<!-- teamagent-analysis:end -->
