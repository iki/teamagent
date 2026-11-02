# orca

Source: [orca](https://github.com/stablyai/orca) · Category: [ai-agents-swarm](../categories/ai-agents-swarm.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `08c7152ab6e576951b33c2991ed2dedca4333096`; commit timestamp `2026-09-02T21:48:17-07:00`; 22,903 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/stablyai/orca/blob/08c7152ab6e576951b33c2991ed2dedca4333096/README.md)):

> Run Codex, ClaudeCode, OpenCode or Pi side-by-side — each in its own worktree, tracked in one place. Monitor and steer your agents from your phone — get notified when an agent finishes and send follow-ups from anywhere.

Build/package evidence: [docs/site/package.json](https://github.com/stablyai/orca/blob/08c7152ab6e576951b33c2991ed2dedca4333096/docs/site/package.json); [mobile/package.json](https://github.com/stablyai/orca/blob/08c7152ab6e576951b33c2991ed2dedca4333096/mobile/package.json); [mobile/packages/expo-two-way-audio/android/build.gradle](https://github.com/stablyai/orca/blob/08c7152ab6e576951b33c2991ed2dedca4333096/mobile/packages/expo-two-way-audio/android/build.gradle); [mobile/packages/expo-two-way-audio/package.json](https://github.com/stablyai/orca/blob/08c7152ab6e576951b33c2991ed2dedca4333096/mobile/packages/expo-two-way-audio/package.json); [package.json](https://github.com/stablyai/orca/blob/08c7152ab6e576951b33c2991ed2dedca4333096/package.json)

License evidence: [LICENSE](https://github.com/stablyai/orca/blob/08c7152ab6e576951b33c2991ed2dedca4333096/LICENSE) Classification hint: MIT. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents-swarm**. Its category places it in the candidate set for agents, decisions; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [decisions](../decisions.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

## 2026-10-28 reconciliation and scoped source review

Reviewed source: [ai-agents-swarm--orca](https://github.com/stablyai/orca) at `ac154dc6a3ea0d6b0cf82f66127f36c894ab4d4c`.

**Scope:** Complete 40,161-path committed change inventory; scoped reads of ACP permission implementation (1–144), its tests (1–170), and authority-fence implementation (1–246). This is not an audit of all changed subsystems. No upstream tests executed.

The full analyzed commit 08c7152ab6e576951b33c2991ed2dedca4333096 is an ancestor of the observed revision in the newly categorized checkout. Its complete no-renames inventory is 2,462,658 UTF-8 bytes. The previous rename block came from the comparison output limit, not missing history. Retain the original report ID and category provenance while recording the current checkout identity ai-agents--orca as an alias.

[ACP permission handling](https://github.com/stablyai/orca/blob/ac154dc6a3ea0d6b0cf82f66127f36c894ab4d4c/src/main/acp/acp-permission-requests.ts#L43-L144) requires usable routing IDs/options, diagnoses dropped malformed optional fields, cancels without a handler or on invalid/unoffered replies, and settles once on its request-context abort. A handler exception is interpolated into a diagnostic; Teamagent must sanitize it. Compatibility repair must not remove authority-critical information or turn an unfamiliar option into an implicit grant.

The [tests](https://github.com/stablyai/orca/blob/ac154dc6a3ea0d6b0cf82f66127f36c894ab4d4c/src/main/acp/acp-permission-requests.test.ts#L101-L169) distinguish prompt cancellation from the owner of an autonomous permission: session/cancel alone intentionally leaves that handler signal active. Do not advertise universal cancellation enforcement from a session cancel method. [Authority retirement/restoration](https://github.com/stablyai/orca/blob/ac154dc6a3ea0d6b0cf82f66127f36c894ab4d4c/src/main/agent-hooks/server/server-authority-fences.ts#L11-L126) removes aliases, cached observations and hydrated grants, then restores only matching fences that have not been superseded or closed. Persistence is scheduled rather than established as an atomic durable transaction in this slice. Adopt explicit ownership/epoch checks and negotiate cancellation capability; no distributed fencing or complete isolation guarantee was verified.

## 2026-10-28 follow-up source review

Reviewed the frozen update from `ac154dc6a3ea0d6b0cf82f66127f36c894ab4d4c` to `478743dbbaba368b9795463f6770966bc0baf341`. Earlier findings above remain historical evidence; this review is limited to the cited source, selected fixtures and delta.

In [src/main/skills/skill-install-discovery-verification.ts](https://github.com/stablyai/orca/blob/478743dbbaba368b9795463f6770966bc0baf341/src/main/skills/skill-install-discovery-verification.ts#L128-L194), Install verification performs a fresh discovery and downgrades missing placements to failed, requires a discovered canonical copy, and preserves partial status when placements fail or skip. The helper excludes roots marked unavailable from proving a placement and targets the requested skill name for WSL discovery, while checking distro/path normalization.

**Harness implication and limits:** Installed bytes and discoverable provider placement are separate acceptance checks. Retained pre-install scans must not certify new writes, and a partial multi-agent installation must stay partial. This is discoverability evidence rather than content-hash verification or proof the agent can execute the skill. The broad repository diff was truncated; only this captured module and focused test contract were reviewed. No upstream code or live service was executed for this review.

## Source update reviewed 2026-11-01

Reviewed commit [`f29cc1aa82043ef8056ce641251eb4bf4bae5dcd`](https://github.com/stablyai/orca/commit/f29cc1aa82043ef8056ce641251eb4bf4bae5dcd), compared with `478743dbbaba368b9795463f6770966bc0baf341`.

The [session-result validator](https://github.com/stablyai/orca/blob/f29cc1aa82043ef8056ce641251eb4bf4bae5dcd/src/main/ai-vault/session-list-result-validation.ts) adds an imported account-home schema and optional WSL identity, plus structured localization hints for scan issues. Malformed optional hints fall back to the base English issue, and invalid session entries generate an explicit skipped-count issue. The [fixture](https://github.com/stablyai/orca/blob/f29cc1aa82043ef8056ce641251eb4bf4bae5dcd/src/main/ai-vault/session-list-result-validation.test.ts) verifies preservation of a valid code/parameter pair and dropping malformed optional fields while keeping the issue itself.

This is a useful boundary for heterogeneous installed-agent histories: bind records to execution/account scope and preserve incomplete-scan evidence independently of presentation. The imported account-home schema and remote scanner were not inspected here, so containment and authorization are not established. The15,261-path update required targeted review; no remote host, scanner or upstream tests were executed.

## External-update review - 2026-11-01

Reviewed the committed update from `f29cc1aa82043ef8056ce641251eb4bf4bae5dcd` to [`730a4583839e1f936880602bd077a5b6e876264c`](https://github.com/stablyai/orca/commit/730a4583839e1f936880602bd077a5b6e876264c), dated `2026-11-01T13:07:06-07:00`. The complete 4,227-path change inventory was captured. The whole diff exceeded its output bound, so this review covers a complete six-file selected diff and the complete current completion-feed, notification-delivery and announcement-registry modules; it does not certify every changed subsystem. Earlier reviews remain historical evidence.

The [completion feed](https://github.com/stablyai/orca/blob/730a4583839e1f936880602bd077a5b6e876264c/src/main/native-chat/agent-session-wire/structured-agent-session-turn-completion-feed.ts) now consults child-work liveness before announcing a successful lead turn. Held success remains unaccounted so a later observation can announce it after child work drains. Failure and attention states bypass that success hold. The [child-work fixtures](https://github.com/stablyai/orca/blob/730a4583839e1f936880602bd077a5b6e876264c/src/main/native-chat/agent-session-wire/structured-agent-session-turn-completion-child-work.test.ts) cover one completion after the last subagent finishes, waiting on an orchestration command, immediate failed-turn reporting, and different treatment of a background development server for user-requested, self-started and subsequently steered turns. These fixtures were read, not executed. The imported liveness/folding helpers were not independently reviewed in this slice.

The current feed silently establishes a baseline for first observation, history restoration, epoch changes and backward sequence movement; it does not replay old completions to a late subscriber. It requires an explicit outcome rather than inventing success from an unknown one, and carries the journal cursor with attention events. The new [owed-work adapter](https://github.com/stablyai/orca/blob/730a4583839e1f936880602bd077a5b6e876264c/src/shared/agent-session/view/structured-agent-session-owed-work.ts) passes current-context rows, fence and optional scope to the main-agent working predicate. Its delegated projection and fence semantics require separate review.

The [delivery service](https://github.com/stablyai/orca/blob/730a4583839e1f936880602bd077a5b6e876264c/src/main/notifications/notification-delivery-service.ts) keeps desktop and mobile eligibility/cooldowns separate. The changed [fixture](https://github.com/stablyai/orca/blob/730a4583839e1f936880602bd077a5b6e876264c/src/main/notifications/notification-delivery-service.test.ts) distinguishes needs-input settings from task-completion settings and preserves mobile dispatch when the desktop source is disabled. Native announcements are recorded only after the native adapter reports delivery. Mobile dispatch is followed immediately by announcement bookkeeping without awaiting a provider receipt, so this is not confirmed phone delivery or human acknowledgement.

The [announcement registry](https://github.com/stablyai/orca/blob/730a4583839e1f936880602bd077a5b6e876264c/src/main/notifications/announced-notification-registry.ts) is memory-only and bounded by default to 256 subjects and 20 IDs per subject. It retains positional origins and retires records covered by a supplied read marker, using an imported predicate not inspected here. Bounded eviction and a read marker are separate from durable delivery evidence.

**Teamagent implications:** distinguish a settled lead turn, drained child work, verified task correctness, channel delivery and human acknowledgement. Keep epoch-aware event identity, suppress historical replay, and let failures or requests for input remain visible while other work continues. Channel settings and cooldowns need independent acceptance coverage; durable recovery requires an explicit receipt contract beyond this in-memory registry. These findings inform [agents](../agents.md), [channels](../channels.md), [decisions](../decisions.md) and [evolution](../evolution.md). No upstream code, agent session, desktop/mobile runtime or provider service was executed.

<!-- teamagent-analysis:start -->
Analysis metadata: source [orca](https://github.com/stablyai/orca); analyzed commit `730a4583839e1f936880602bd077a5b6e876264c`; commit date 2026-11-01T13:07:06-07:00; review date 2026-11-01T23:12:06.798Z; depth screened. [Maintenance record](../analyses/repos/ai-agents-swarm--orca.md).
<!-- teamagent-analysis:end -->
