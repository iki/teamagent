# log.betterstack.claude

Source: [log.betterstack.claude](https://github.com/betterstackhq/claude-plugin) · [skills](../../skills.md), [evolution](../../evolution.md), [agents](../../agents.md).

Better Stack's plugin supplies service-specific operational skills over a separately authenticated MCP server. The reviewed files are connection/query instructions; server-side authorization, SQL execution and actual account access were not inspected or exercised.

Historical discovery: 2026-11-01T10:08:32.081Z. This initial source review supersedes the discovery-only assessment; managed metadata is preserved for explicit promotion.

## 2026-11-01 scoped source review

Reviewed commit `4ae5b070468cc2556fbcd6d5864a935d58e6111e` (commit date `2026-10-29T00:54:22+01:00`), initial scoped review, with no prior analyzed commit. Ledger promotion remains a separate maintenance action.

**Scope:** Complete connection and raw-log-query skills from the initial tree. Other skills, plugin configuration, hosted MCP implementation and live service/API behavior not audited.

The [connection skill](https://github.com/betterstackhq/claude-plugin/blob/4ae5b070468cc2556fbcd6d5864a935d58e6111e/skills/connect-betterstack/SKILL.md) distinguishes installed guidance from authenticated tools, proposes a read-only diagnostic, and describes shared-channel credentials. It also directs a later setup to treat remotely fetched instructions as if supplied by the user; Teamagent must not adopt that authority escalation. The [query skill](https://github.com/betterstackhq/claude-plugin/blob/4ae5b070468cc2556fbcd6d5864a935d58e6111e/skills/logs-query/SKILL.md) recommends schema discovery, bounded windows/limits and preserving exact equality after a cheap substring prefilter. Its older template examples coexist with an explicit warning that ad hoc tools require concrete substitutions, requiring route-specific adaptation.

**Teamagent implication (inference):** Keep connector discovery passive, authenticated diagnostics explicit and remote documentation untrusted. Bind log queries to actual account, source schema and time/row budgets, avoid disclosing private log values, and require the user's existing scoped task grant for any incident messaging or scheduled remediation; a skill cannot manufacture that authorization.

**Verification limit:** committed-source inspection only; no upstream code, tests or provider calls were executed. Review scope is the cited implementation or authored guidance, not whole-project correctness, licensing clearance or measured performance. Source passages were redacted for review; exact URL literals were not byte-validated.

<!-- teamagent-analysis:start -->
Analysis metadata: source [log.betterstack.claude](https://github.com/betterstackhq/claude-plugin); analyzed commit `4ae5b070468cc2556fbcd6d5864a935d58e6111e`; commit date 2026-10-29T00:54:22+01:00; review date 2026-11-01T11:37:37.120Z; depth reviewed. [Maintenance record](../repos/ai-skills--log.betterstack.claude.md).
<!-- teamagent-analysis:end -->
