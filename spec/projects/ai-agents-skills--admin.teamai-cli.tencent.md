# admin.teamai-cli.tencent

Source: [admin.teamai-cli.tencent](https://github.com/Tencent/teamai-cli) · Category: [ai-agents-skills](../categories/ai-agents-skills.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `6c5949f86e5ef9a8051d0454a8c6e3be440b2cf1`; commit timestamp `2026-10-03T22:20:41+08:00`; 875 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/Tencent/teamai-cli/blob/6c5949f86e5ef9a8051d0454a8c6e3be440b2cf1/README.md)):

> The shared foundation for how your team works, learns, and improves with AI. TeamAI turns individual AI capabilities into shared team capabilities — across agents, machines, and team members.

Build/package evidence: [package.json](https://github.com/Tencent/teamai-cli/blob/6c5949f86e5ef9a8051d0454a8c6e3be440b2cf1/package.json)

License evidence: [LICENSE](https://github.com/Tencent/teamai-cli/blob/6c5949f86e5ef9a8051d0454a8c6e3be440b2cf1/LICENSE) Classification hint: MIT. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents-skills**. Its category places it in the candidate set for skills, evolution; those associations are navigational and have not been individually validated as implemented capabilities. See [skills](../skills.md) · [evolution](../evolution.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

## Source update reviewed 2026-10-28

Reviewed commit: [`5a3ae56ed3dccbbd0c5d34f01c533080ebbff5c8`](https://github.com/Tencent/teamai-cli/commit/5a3ae56ed3dccbbd0c5d34f01c533080ebbff5c8). Scope: Full session scoring driver, save-session command and sharing skill read. Lease implementation, redaction/summary collector, timeout cancellation and report-worktree publisher were not audited.

The [scoring driver](https://github.com/Tencent/teamai-cli/blob/5a3ae56ed3dccbbd0c5d34f01c533080ebbff5c8/src/score-sessions.ts) keeps local labels pending for later publication, offers verified versus best-effort isolation levels and uses per-scope locks with finally cleanup. Its thirty-minute deadline bounds taking new leases, not completion of an in-flight judge; isolation capability is supplied by an unread helper. [Session saving](https://github.com/Tencent/teamai-cli/blob/5a3ae56ed3dccbbd0c5d34f01c533080ebbff5c8/src/save-session.ts) separates local persistence from opt-in team publication, excludes the prompt from uploads by default and preserves explicit busy/failed/already-present outcomes. It propagates dry-run into configuration loaders to avoid migration writes.

Local logs still include a redacted prompt line, and the collector's redaction was not inspected. The outer ten-second timeout does not itself demonstrate cancellation of an uncertain publish. The [sharing skill](https://github.com/Tencent/teamai-cli/blob/5a3ae56ed3dccbbd0c5d34f01c533080ebbff5c8/skill-data/share/SKILL.md) proposes direct team-branch publication and a local language preference; neither grants authorization in Teamagent. Adapt independent scoring attempts, dry-run propagation and publication receipts, while keeping privacy, approval and durable recovery in enforced host code. No session, judge, upload or tests were executed.

## 2026-10-28 follow-up source review

Reviewed the frozen update from `5a3ae56ed3dccbbd0c5d34f01c533080ebbff5c8` to `56320abf2ee27144f78b9a70c9b8c77c1389a65d`. This is a bounded static source review, not an upstream runtime or performance result.

In [src/init.ts](https://github.com/Tencent/teamai-cli/blob/56320abf2ee27144f78b9a70c9b8c77c1389a65d/src/init.ts#L89-L150), Re-initialization salvages only individually schema-valid settings from an otherwise invalid YAML mapping that still identifies a repository remote. It retains repository identity for deciding whether settings can carry forward, rather than treating unreadable configuration as an empty install. The salvage diagnostic includes `JSON.stringify(value)` for a rejected setting, so this formatting should not be copied into a general configuration boundary that may contain secrets.

[Inspected fixtures](https://github.com/Tencent/teamai-cli/blob/56320abf2ee27144f78b9a70c9b8c77c1389a65d/src/__tests__/e2e/init-invalid-config-1500.test.ts#L109-L157): The inspected same-team fixtures preserve a valid false value, agents, user-scope inheritance and queued learnings while dropping an invalid boolean; the different-team case moves the old configuration aside. The call site at `src/init.ts:1792-1797` uses the salvaged file only when a live validated configuration is unavailable. These source fixtures were not run; broader initialization and final-schema enforcement were outside this focused review.

**Teamagent implication:** Skill configuration repair should preserve valid user choices and queued work, bind carried settings to the same source identity, and record each rejected field without exposing its raw value. Partial salvage is a recovery input, not authorization to relax the final schema or inherit another repository's trust.

<!-- teamagent-analysis:start -->
Analysis metadata: source [admin.teamai-cli.tencent](https://github.com/Tencent/teamai-cli); analyzed commit `56320abf2ee27144f78b9a70c9b8c77c1389a65d`; commit date 2026-10-28T11:00:27+01:00; review date 2026-10-28T14:29:27.414Z; depth screened. [Maintenance record](../analyses/repos/ai-agents-skills--admin.teamai-cli.tencent.md).
<!-- teamagent-analysis:end -->
