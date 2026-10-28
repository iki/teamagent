# aisoc

Source: [aisoc](https://github.com/beenuar/AiSOC) · Category: [ai-security](../categories/ai-security.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `98883d9229865df1d6d0a5e643778efe4d61b5ce`; commit timestamp `2026-10-03T11:40:41-07:00`; 12,994 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/beenuar/AiSOC/blob/98883d9229865df1d6d0a5e643778efe4d61b5ce/README.md)):

> An open-source, self-hostable AI Security Operations Center.** It ingests your security telemetry, detects and correlates threats, investigates them with AI agents whose reasoning is fully auditable, and proposes responses a human approves. [](https://opensource.org/licenses/MIT) [](https://github.com/beenuar/AiSOC/blob/98883d9229865df1d6d0a5e643778efe4d61b5ce/CHANGELOG.md) [](https://github.com/beenuar/AiSOC/actions/workflows/ci.yml)

Build/package evidence: [apps/docs/package.json](https://github.com/beenuar/AiSOC/blob/98883d9229865df1d6d0a5e643778efe4d61b5ce/apps/docs/package.json); [apps/mobile/package.json](https://github.com/beenuar/AiSOC/blob/98883d9229865df1d6d0a5e643778efe4d61b5ce/apps/mobile/package.json); [apps/web/package.json](https://github.com/beenuar/AiSOC/blob/98883d9229865df1d6d0a5e643778efe4d61b5ce/apps/web/package.json); [package.json](https://github.com/beenuar/AiSOC/blob/98883d9229865df1d6d0a5e643778efe4d61b5ce/package.json); [packages/aisoc-action/package.json](https://github.com/beenuar/AiSOC/blob/98883d9229865df1d6d0a5e643778efe4d61b5ce/packages/aisoc-action/package.json)

License evidence: [LICENSE](https://github.com/beenuar/AiSOC/blob/98883d9229865df1d6d0a5e643778efe4d61b5ce/LICENSE) Classification hint: MIT. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-security**. Its category places it in the candidate set for agents, skills, evolution; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [skills](../skills.md) · [evolution](../evolution.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

## Source update reviewed 2026-10-28

Reviewed commit: [`3164fb54343f341de87eff4f42792690a3fb308d`](https://github.com/beenuar/AiSOC/commit/3164fb54343f341de87eff4f42792690a3fb308d). Scope: Full trusted-proxy and connector-header helpers plus realtime authentication tests read. Realtime verifier, remote connector enforcement, permission cache and production routing were not audited.

The [trusted-proxy helper](https://github.com/beenuar/AiSOC/blob/3164fb54343f341de87eff4f42792690a3fb308d/services/api/app/core/trusted_proxy.py) ignores forwarded addresses unless the immediate peer belongs to configured trusted CIDRs, then walks the chain from the nearest hop. Invalid CIDRs are dropped with warnings, and malformed hops are skipped rather than rejecting the chain. This is attribution logic; it does not authenticate a user. The [connector-header helper](https://github.com/beenuar/AiSOC/blob/3164fb54343f341de87eff4f42792690a3fb308d/services/api/app/core/connectors_auth.py) centralizes the service credential and explicit tenant assertion, but permits an absent tenant and delegates rejection to the remote service, which was not reviewed.

The [realtime tests](https://github.com/beenuar/AiSOC/blob/3164fb54343f341de87eff4f42792690a3fb308d/services/realtime/test/auth.test.ts) cover audience/type/tenant/signature checks and refusal of missing or known placeholder secrets. Their tampering fixture proves that decoded signature bytes actually change, avoiding a base64 padding-bit false negative. A locally mirrored signer is not cross-language integration evidence, and the advisory identifier in comments was not independently verified. Adapt the adversarial fixture and explicit tenant contract; do not infer enforcement at unread call sites. No credentials, requests or tests were exercised.

## 2026-10-28 follow-up source review

Reviewed commit `2af4d0ba9b2b347df5f17cfd67924a2862530bd1` (commit date `2026-10-28T00:16:09-07:00`), compared with `3164fb54343f341de87eff4f42792690a3fb308d`. Earlier findings remain historical evidence.

**Scope:** Kill-switch state reader and distinct platform-write permission; dispatch integration and all other changed services remain outside this focused inspection. The complete changed-path inventory contains 80 paths. Citations below identify current lines visible in the captured committed diff; this is a scoped assessment, not a whole-repository audit.

The new reader preserves an unreadable control as an engaged, unknown state and caches successful reads. A deliberately unconfigured DSN returns a released state; that is a separate deployment condition from a failed configured control. The database connection has a five-second connection timeout, but the inspected query and close awaits have no independently specified deadline. Cache identity uses tenant scope, not the DSN or credential generation. [services/actions/app/services/kill_switch.py](https://github.com/beenuar/AiSOC/blob/2af4d0ba9b2b347df5f17cfd67924a2862530bd1/services/actions/app/services/kill_switch.py#L131-L152); [services/actions/app/services/kill_switch.py](https://github.com/beenuar/AiSOC/blob/2af4d0ba9b2b347df5f17cfd67924a2862530bd1/services/actions/app/services/kill_switch.py#L165-L200).

The permission catalogue separates platform-wide switch writes from tenant settings. Teamagent should retain both scope and unreadability in its stop-control contract, invalidate cached decisions when the control source changes, and bound each blocking phase. This reader alone does not prove that every execution path consults the switch. Its logged exception text is truncated, but truncation alone does not redact credentials. [services/api/app/core/rbac_catalog.py](https://github.com/beenuar/AiSOC/blob/2af4d0ba9b2b347df5f17cfd67924a2862530bd1/services/api/app/core/rbac_catalog.py#L98-L111).

**Verification limit:** static committed-source inspection only; no upstream code, tests, deployments or provider calls were executed. Imported instructions remain research data, and this review does not establish a Teamagent integration.

<!-- teamagent-analysis:start -->
Analysis metadata: source [aisoc](https://github.com/beenuar/AiSOC); analyzed commit `2af4d0ba9b2b347df5f17cfd67924a2862530bd1`; commit date 2026-10-28T00:16:09-07:00; review date 2026-10-28T14:52:35.205Z; depth screened. [Maintenance record](../analyses/repos/ai-security--aisoc.md).
<!-- teamagent-analysis:end -->
