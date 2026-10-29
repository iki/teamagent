# Trigon workflow adoption audit — 2026-10-28

This is a static comparison and implementation proposal, not adopted policy or proof that Trigon's tools run successfully in Teamagent. Source: [Trigon](https://github.com/iki/trigon) at `454e372cbc6bb75eafbbc4795391c492bc4fbf96`, captured in the parent task's `snapshot.json` and `source/`. The relevant workflow source files are clean in that snapshot; mutable `.verification` receipts and unrelated asset edits are not portable Teamagent verification evidence. Teamagent's analysis baseline is `176569773159e4eb907fb11feda252ecc307e8f7`, clean after an external commit of conversation 86. No implementation, dependency mutation, source script, credential access, Git mutation, publication, or benchmark was performed for this audit. Commands that inspected source code are not runtime tests.

## What changed relative to Teamagent

| Area | Trigon's current contract | Teamagent difference / adoption consequence |
| --- | --- | --- |
| Task identity | One original task baseline survives questions, follow-ups and repair promotion; explicit mode/turn registration. | Current hooks primarily archive completed turns and run checks. Add maintenance-task state without confusing it with the product's durable user-task domain. |
| Grouped operations | JSON `task:run` supports begin, verify, checkpoint, prepare, publish, handoff, clear-handoff, worktree, integration-status, enqueue and integrate. | Reuse fixed operation schemas and compact references; do not expose arbitrary subprocess commands. Implement every advertised operation, or leave unadopted operations unadvertised. |
| Scope ownership | Task start records HEAD, branch, remote identity and changed-file hashes; reviewed explicit paths and approved pre-existing paths are rechecked before staging. | Valuable upgrade for preserving unrelated work. A baseline must be captured before implementation and never reconstructed from a later tree. |
| Verification | `verify final` formats once, then performs strict review; successful exact-worktree proof can avoid identical pre-commit review. | Current step, review, pre-commit and Stop can repeat the full suite. Retain all checks, but reuse only proven matching inputs. Teamagent's ignored LF/export inputs need separate coverage. |
| Conversation | One descriptive file per logical task, no global number, only if task-owned repository content changed; Q/A and follow-ups append before checkpoint. | Direct collision with Teamagent's every-completed-response, globally numbered, append-only record contract. Requires a settled choice. Preserve all historical numbered records regardless of the choice. |
| Archive timing | Final implementation response is checkpointed before final verification; publication freezes it and later delivery evidence stays in receipts. | Teamagent currently requires an exact pre-delivery archive after checks/commits. New rule would intentionally separate the implementation record from later publication status; do not pretend later status was archived earlier. |
| Publication | Default signed task commit and ordinary push to the same verified upstream, followed by exact remote SHA confirmation; ambiguous actions are reconciled, not retried. | Teamagent has no equivalent standing publication policy. Trigon's historical authorizations and hardcoded remote must not be copied as authority. |
| Parallel work | Independent `codex/*` worktrees; task branch publication; serialized integration queue and local signed source replay plus merge. | Source replay squashes the task delta, excludes generated `.verification`, regenerates checks, and creates two commits on integration. This is a material history/branching choice, not merely a faster check command. |
| Hook lifecycle | UserPromptSubmit/Interrupt/SessionStart/PreToolUse/PermissionRequest join Stop/SubagentStop; trust/readiness explicitly inspected. | Current Teamagent has Stop/SubagentStop only. Hook configuration is not proof of host support/activation. Trust and reviewer settings must stay explicit, never changed by a gate. |
| Rules/docs | Compact operational primaries, paired human intros, catalog/route/length/duplication guards and bounded section reader. | Reuse for operational scopes. A wholesale checker import would reject/reclassify the existing research corpus, historical findings and analyses. Keep evidence collections outside that rewrite. |
| Releases | Every app-changing task prepares root/app versions and bilingual release notes; staged release validation is mandatory. | Strong hidden coupling to Trigon's app-owner graph, release generator and EN/CZ product policy. Do not import the non-SemVer minor/breaking policy or mandatory localization implicitly. |

Sources: [workflow](https://github.com/iki/trigon/blob/454e372cbc6bb75eafbbc4795391c492bc4fbf96/spec/workflow.md), [rules](https://github.com/iki/trigon/blob/454e372cbc6bb75eafbbc4795391c492bc4fbf96/spec/rules.md), [lifecycle](https://github.com/iki/trigon/blob/454e372cbc6bb75eafbbc4795391c492bc4fbf96/spec/task-lifecycle.md), [conversation contract](https://github.com/iki/trigon/blob/454e372cbc6bb75eafbbc4795391c492bc4fbf96/spec/conversation-logging.md), [release contract](https://github.com/iki/trigon/blob/454e372cbc6bb75eafbbc4795391c492bc4fbf96/spec/releases.md).

## Material choices for the user's recap

1. **Publication scope:** adopt signed commit/push and task-branch integration for Teamagent under a new explicit Teamagent destination/policy, or adopt local preparation/commit first and keep push/integration separately requested. The source authorization explicitly names `github.com/iki/trigon` and dated Trigon conversations. Reuse its safeguards, not those permissions. No permission mode/trust/SSH credentials should be altered to make a preflight succeed.
2. **Archive policy:** adopt one descriptive record per changed logical task, frozen before final verification, while preserving old numbered records; or retain current globally numbered per-response archives and accept/adapt the different invalidation boundary. In either case retain Teamagent's public-message-only privacy rule, LF normalization and bounded/session-validated transcript handling unless separately approved.
3. **How far to import workflow policy:** recommended initial scope is operational docs, grouped local workflow, exact-input verification and explicit publication gates, with Trigon-specific release/localization rules deferred. If full app release/version parity and source-replay integration are desired now, they require their own concrete app-owner/version/history choices and add substantial scope.

These choices are distinct from routine code adaptation. Confirming Trigon reuse is not proof of remote publication authorization, hook trust or signing readiness.

## Review findings that must be fixed or excluded before reuse

### High: stale task locks can evict a live or foreign owner

`state-lock.ts` treats age over 600 seconds as sufficient for reclamation even if its PID is still alive or belongs to another host. Task completion holds this lock around scope validation, commit hooks, signing, push and remote verification; these are not collectively bounded below 600 seconds. A second caller can therefore enter while the original operation is still active. The integration caller already avoids this by passing infinite stale age, and has a live-owner regression; ordinary task/mode/archive locks do not share that protection.

Adaptation: reclaim only confirmed dead same-host owners. Unknown/foreign/malformed ownership should fail with bounded diagnostics and require explicit inspection, or use a genuinely renewed/validated lease protocol. Add a negative fixture for an old but live owner before the fix; retain dead-owner recovery and token-safe release. This is a source-level finding, not a demonstrated live Trigon race.

Evidence: [reclaim condition](https://github.com/iki/trigon/blob/454e372cbc6bb75eafbbc4795391c492bc4fbf96/app/trigon-conversations/state-lock.ts#L77-L90), [integration protection](https://github.com/iki/trigon/blob/454e372cbc6bb75eafbbc4795391c492bc4fbf96/app/trigon-conversations/task-integration.ts), [ordinary lock fixture](https://github.com/iki/trigon/blob/454e372cbc6bb75eafbbc4795391c492bc4fbf96/test/stop-handoff.test.ts#L26-L46), [integration live-owner fixture](https://github.com/iki/trigon/blob/454e372cbc6bb75eafbbc4795391c492bc4fbf96/test/task-integration.test.ts#L290-L316).

### High if signed publication is adopted: direct publication does not enforce signing

Readiness checks `commit.gpgsign=true`, SSH signing and key availability, but direct publication calls `git commit --file=-` without an explicit signing flag, does not recheck signing settings there, and does not verify the resulting signature before pushing. `task:complete` and Stop can reach this code without running the readiness command first. The integration backend explicitly passes `--gpg-sign`, showing the distinction. Existing publication fixtures deliberately set signing false; they prove scope/replay behavior, not production signing enforcement.

Adaptation: require the selected signing contract at the actual publication boundary, explicitly request signing, and validate the resulting commit's signature/identity before a push. Test signing disabled after preflight and a non-signing commit result; fail without publishing. Do not relax the check merely because the local signing key is unavailable.

Evidence: [preflight only](https://github.com/iki/trigon/blob/454e372cbc6bb75eafbbc4795391c492bc4fbf96/app/trigon-conversations/task-readiness.ts#L78-L83), [commit call](https://github.com/iki/trigon/blob/454e372cbc6bb75eafbbc4795391c492bc4fbf96/app/trigon-conversations/task-publish.ts#L98-L111), [complete path](https://github.com/iki/trigon/blob/454e372cbc6bb75eafbbc4795391c492bc4fbf96/app/trigon-conversations/task-complete.ts), [unsigned fixtures](https://github.com/iki/trigon/blob/454e372cbc6bb75eafbbc4795391c492bc4fbf96/test/task-hook-fixture.ts#L17-L30).

### Medium: compact display is not bounded subprocess ownership

`compact-run.ts` limits the returned tail/issue strings but spawns without a deadline or cancellation ownership, accepts arbitrarily long lines, writes an unbounded log, and chains pending writes without awaiting backpressure during consumption. A hanging or flooding child can therefore outlive a workflow budget or grow memory/disk. Current tests cover large finite output, missing executable, broken stdin and redaction, not these bounds.

Adaptation: task-specific byte/line/time limits, cancellation with child termination/reaping, bounded streaming backpressure and an explicit partial diagnostic receipt. Do not automatically retry publish/install work after timeout. Retain useful diagnostics and no-raw-output public responses.

Evidence: [runner](https://github.com/iki/trigon/blob/454e372cbc6bb75eafbbc4795391c492bc4fbf96/app/trigon-conversations/compact-run.ts#L26-L100), [fixtures](https://github.com/iki/trigon/blob/454e372cbc6bb75eafbbc4795391c492bc4fbf96/test/workflow-runner.test.ts).

### Medium: archive import would regress existing Teamagent boundaries

Trigon's `publicText` escapes its control markers but does not normalize CRLF/lone CR. Direct `archive(RecordInput)` also does not itself redact public input; transcript-derived callers redact earlier, leaving manual input dependent on caller discipline. Its transcript reader retains full shell scripts and edited path lists, has no total/line byte limit, does not verify root session metadata, and resets fewer subagent fields than Teamagent. Teamagent currently redacts at the archive boundary, excludes command scripts/tool payloads, limits input/transcript bytes, validates session identity, distinguishes forked subagent/parent IDs and normalizes text before fingerprinting. Keep those stronger boundaries. Preserve recognition of the assistant `final` phase alongside `final_answer`; Trigon currently handles only the latter. Trigon's Q/A markers and cached marker lookup can be adapted independently.

Evidence: [Trigon public text](https://github.com/iki/trigon/blob/454e372cbc6bb75eafbbc4795391c492bc4fbf96/app/trigon-conversations/review.ts#L32-L34), [Trigon archive boundary](https://github.com/iki/trigon/blob/454e372cbc6bb75eafbbc4795391c492bc4fbf96/app/trigon-conversations/archive.ts), [Trigon transcript](https://github.com/iki/trigon/blob/454e372cbc6bb75eafbbc4795391c492bc4fbf96/app/trigon-conversations/transcript.ts); Teamagent `app/conversations/{input,transcript,archive,privacy}.ts` and `spec/conversation-logging.md`.

### Input modeling concern: exact Git state does not cover ignored evidence

Trigon's exact-worktree proof freezes HEAD, a temporary-index tree, changed/untracked file hashes and Bun identity; pre-commit also requires no unstaged/untracked content, matching staged tree and age at most 30 minutes. This is valuable cooperative reuse, with partial-staging and mutation fixtures. It does not automatically cover Teamagent's ignored cache originals, migration manifests and text export bytes consumed by the LF/export gate. Those must become explicit cache inputs or remain independently revalidated. A Git-only proof must never skip their current integrity check.

Evidence: [proof](https://github.com/iki/trigon/blob/454e372cbc6bb75eafbbc4795391c492bc4fbf96/app/trigon-conversations/verified-review.ts), [partial staging/mutation tests](https://github.com/iki/trigon/blob/454e372cbc6bb75eafbbc4795391c492bc4fbf96/test/stop-handoff.test.ts#L240-L278); Teamagent `app/check/index.ts`, `app/check/line-endings.ts`, `app/research/text-reports.ts`.

## Concrete migration map

| Source group | Teamagent destination / treatment | Couplings to settle |
| --- | --- | --- |
| `spec/workflow.md`, `rules.md`, lifecycle/intro pair; compact AGENTS routes | Add explicit operational scopes and route from `AGENTS.md`; update `spec/verification.md` rather than duplicate competing authorities | User publication/archive choices; preserve development-language, LF, dependency and domain architecture rules |
| `workflow.ts`, `task-model/state/mode/changes.ts`, `review.ts`, status/progress | New internal maintenance workflow host area; share existing conversation writer and check launcher through interfaces | Stable task ID, original clean baseline, exact operation schemas, explicit pre-existing-file adoption, bounded state files |
| `verified-review.ts` and pre-commit reuse branch | Verification host + `.githooks/pre-commit` | Cache-input audit, local cooperative trust, immutable source stability; always retain staged receipt validation |
| `archive-index.ts`, Q/A merge logic | Adapt in `app/conversations/` | Preserve Teamagent marker/history compatibility, privacy, session/fork rules, LF and source-size bounds; global-number policy requires a decision |
| `task-git/publish/complete/readiness/handoff*.ts` | Explicit publication adapter only after scope authorization | Teamagent remote, signing, exact branch target, policies; fix signing/locks/bounds; preserve no retry/force/amend and remote SHA verification |
| `task-worktree/integration/queue.ts` | Optional later integration adapter | App-managed checkout conventions, clean new-task baseline, source replay history, separate branch/main authority, cache regeneration |
| `context-hook.ts`, `task-hook.ts`, `.codex/hooks.json` | Adapt host event handling without assuming every product supplies every event | Explicit trust review, current host API validation, no permission mutation; Full-access Stop path cannot be claimed active in managed approval mode |
| `compact-run.ts`, `atomic-rename.ts` | Shared bounded host runner / atomic state adapter | Timeout/bytes/cancellation/backpressure; Teamagent LF and diagnostics redaction; no publication retries |
| `docs.ts`, `documentation.ts`, catalog | Operational document section reader and route checker | Existing research specs are evidence collections; do not apply product primary/introduction quotas wholesale |
| `releases.md`, release scripts and app-owner registry | Defer unless explicitly selected | Trigon version semantics, bilingual notes, app impact mapping are product policy, not a prerequisite to borrow cache/workflow architecture |

External couplings in the workflow source are concrete: deployment redaction (`app/trigon-release/deploy-diagnostics.ts`), input identity, executable lookup, task-policy guards, Codex RPC, hook-trust plan and documentation catalog helpers (`app/trigon-check/`). Extract narrow reusable interfaces rather than copying the entire Trigon release/product graph or introducing absolute paths to its checkout.

## Useful evidence and further verification

- Trigon's trace report records 59 completed pre-commit review pairs, about 9,994 seconds total and 131.3-second median; this is historical Trigon evidence, not all avoidable time and not a Teamagent benchmark. Source: [workflow guide](https://github.com/iki/trigon/blob/454e372cbc6bb75eafbbc4795391c492bc4fbf96/spec/workflow-intro.md#two-week-trace-audit).
- Benchmark grouped final verification plus exact-worktree reuse against Teamagent's existing repeated step/review/pre-commit sequence. Preserve actual runtime/version, source hashes, cold/warm distinctions and identical negative coverage. Never time a fake passing check as equivalent to real verification.
- Benchmark archive lookup cold-index rebuild and warm unchanged/matching-record lookup separately. Reusable source optimization stats every filename but reads only changed/matched records. If global numbering stays, preserve its invariant independently; do not relabel descriptive naming as a performance measurement.
- Before implementation: red/green cases for live expired locks, unsigned publication, hanging/flooding subprocess, CRLF public input, session mismatch/forked subagent, stale/partial-stage review proof, changed ignored evidence, unrelated staging and interrupted publication.
- After implementation: existing required Teamagent checks and scoped real Git fixture checks; actual hook activation and signing readiness are separate host evidence. No source hook trust, reviewer policy, credential setup, real push, tag, deployment or model action is established by this audit.

No source historical conversation transcripts were searched after Entire Search was reported unavailable; current contracts/code/tests and saved aggregate benchmark records were used instead.
