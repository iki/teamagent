# Minimal Teamagent workflow import plan

Historical design snapshot from 2026-10-28, before the archive/dependency
decisions and implementation. Preserve the planning statements below in that
context; the [current implementation and verification status](../trigon-process-sync-2026-10-28.md#implementation-review-status)
records the later decisions, implemented tools, passing independent checks and
remaining full-gate/publication work.

Status: read-only design, 2026-10-28. The parent reports the user's approval for automatic signed commits and ordinary pushes to Teamagent's verified upstream for completed tasks. Archive and dependency choices remain pending. This document does not broaden that approval to integration merges, tags, releases, deployment, permission changes or trust changes. No implementation is present.

Source remains [Trigon at 454e372cbc6bb75eafbbc4795391c492bc4fbf96](https://github.com/iki/trigon/tree/454e372cbc6bb75eafbbc4795391c492bc4fbf96). This supplements [the workflow audit](workflow.md). Existing Teamagent implementation is the baseline, not an intermediate Trigon migration target.

## Feasibility and dependency cuts

The task helper is feasible without Trigon's release engine or any new JavaScript dependency. Its implementation uses Node-compatible host APIs under Bun, installed Effect Schema and installed Consola. It belongs in development host tooling, not the product's portable task library or public media/harness API.

There are four concrete dependency cuts:

1. `compact-run.ts` and Trigon's transcript reader import only `redactUpload` from `app/trigon-release/deploy-diagnostics.ts`. Reuse Teamagent's archive/transcript writer and privacy boundary instead. For process diagnostics add bounded ANSI removal, environment-secret literal redaction and safe URL query/fragment handling to a host-only diagnostic adapter; never import deployment functions or copy the source's literal sample-credential exception. Preserve archive redaction at the write boundary.
2. `task-readiness.ts` imports `checkTaskPolicy`, Codex RPC and hook-trust helpers. Its task-policy validator hardcodes Trigon paths, seven event handlers, the staged release gate and dated reviewer-policy prose. Replace this with Teamagent wiring checks and a separate optional host-hook diagnostic. Direct explicitly invoked publication must enforce the same Git/scope/signing checks itself; it does not need a claim that every optional Codex hook is active. Never modify user trust, reviewer mode or global configuration from a diagnostic.
3. `verified-review.ts` imports `inputIdentity` from the source verification engine. Connect it only to the Teamagent verification implementation being reviewed in the parallel workstream. Until that contract is implemented and tested, execute the full existing review gate. Keep ignored LF/export evidence checks independent or include their actual bytes/manifests in an explicit input model.
4. `workflow.ts` eagerly imports worktree creation/integration/queue and `task-publish.ts` automatically enqueues published `codex/*` branches. Exclude those operations and imports from the initial JSON schema and remove the automatic queue step. Ordinary exact-upstream task publication does not require source-replay integration, app-owner release graphs or checkout creation. Do not advertise an unsupported operation.

Evidence: [orchestrator](https://github.com/iki/trigon/blob/454e372cbc6bb75eafbbc4795391c492bc4fbf96/app/trigon-conversations/workflow.ts), [direct publication](https://github.com/iki/trigon/blob/454e372cbc6bb75eafbbc4795391c492bc4fbf96/app/trigon-conversations/task-publish.ts), [readiness](https://github.com/iki/trigon/blob/454e372cbc6bb75eafbbc4795391c492bc4fbf96/app/trigon-conversations/task-readiness.ts), [policy coupling](https://github.com/iki/trigon/blob/454e372cbc6bb75eafbbc4795391c492bc4fbf96/app/trigon-check/task-policy.ts), [small redaction dependency](https://github.com/iki/trigon/blob/454e372cbc6bb75eafbbc4795391c492bc4fbf96/app/trigon-release/deploy-diagnostics.ts).

## Concrete initial file plan

Use a separate `app/workflow/` host directory so maintenance-task state is not confused with product tasks or transcript parsing. Keep source filenames where useful for provenance. These are proposed exact paths, not files already created.

| Teamagent file | Source or existing code | Required adaptation |
| --- | --- | --- |
| `app/workflow/index.ts` | Source `workflow.ts` and `task.ts` | One schema-validated JSON protocol; begin, verify, checkpoint, prepare, publish, status and cancel only initially. Completion invokes shared publication code directly, with one lifecycle and no automatic retry. Reject unknown fields/operations according to the existing boundary conventions. |
| `app/workflow/task-model.ts` | Source same name | Bounded identity/path/message schemas; Teamagent trailer; include versioned receipts, exact policy identity and explicit ambiguous/failed outcomes. No integration field until implemented. |
| `app/workflow/task-state.ts` | Source same name | Capture original baseline once; identity-checked bounded state reads; exclusive atomic LF writes; immutable prepared scope; reject unrelated staging and changed out-of-scope files; preserve uncertain/committed attempts. Replace Trigon archive-marker validation with the selected Teamagent archive contract. |
| `app/workflow/task-git.ts` | Source same name | Argument arrays, noninteractive Git, isolated repository/index environment, bounded output/time, exact ref parsing and symlink rejection. Normalize/redact diagnostics to LF. Reuse the checkout's Bun path, not a copied absolute Trigon path. |
| `app/workflow/task-publish.ts` | Source same name | Recheck Teamagent destination/ref authority at the mutation boundary; explicit signed commit and signature/identity validation before push; exact commit-to-ref push without force/tags/submodule recursion; remote SHA verification; no automatic integration. |
| `app/workflow/task-complete.ts` | Source same name | Idempotent replay only for a previously verified identical result; otherwise inspect state and stop. Separate local commit, transport uncertainty and confirmed remote publication. No growing-transcript reread during publication. |
| `app/workflow/task-readiness.ts` | Source same name, narrowed | Read-only Git destination/signing/hook/runtime preflight and reviewable scope summary. User approval recorded as Teamagent approval, never copied Trigon session IDs or a forged capability token. Host-hook diagnostics stay separate from ordinary publication readiness. |
| `app/workflow/task-progress.ts` | Source same name | Controlled English status only, Consola stderr plus bounded LF receipts. No raw Git commands, provider payloads, environment dump or private URLs. Rename stage tags and remove staged-release announcements. |
| `app/workflow/state-lock.ts` | Source same name | Fix live/foreign-owner eviction before use; only confirmed dead same-host reclamation or an explicitly validated lease. Token-safe release and bounded wait. |
| `app/workflow/atomic-rename.ts` | Source same name | Bounded Windows sharing/access retry only; old destination retained until successful atomic replacement; explicit LF writer upstream. |
| `app/workflow/compact-run.ts` | Source same name | Add child time/byte/line limits, streaming backpressure, cancellation/reaping and partial diagnostic receipt. No arbitrary-command JSON option. |
| `app/workflow/task-mode.ts` | Source same name | Add only after the archive/mode decision. Preserve original logical task identity and explicit user opt-outs; do not infer deployment authorization or turn existing dirty files into task ownership. Cancel only a prepared, unstarted publication on new input. |
| `app/workflow/task-changes.ts` | Source same name | Task-owned content comparison for optional no-change archive policy; preserve baseline and do not let ignored generated state count as source changes. |
| `app/workflow/verified-review.ts` | Source same name | Integrate the selected Teamagent cache contract, or leave full review as the initial behavior. Matching Git tree alone cannot cover ignored research/evidence inputs. |
| `app/workflow/commit-message.ts` | Source same name | Validate the chosen Teamagent conventional subject/body/trailer rules; bounded file input; no signing or Git mutation. |

Existing files to adapt, not replace wholesale:

| Existing Teamagent file | Planned change |
| --- | --- |
| `app/conversations/archive.ts`, `transcript.ts`, `input.ts`, `privacy.ts` | Keep public-only, bounded, session/fork-aware parsing, validated manual input, redaction before fingerprinting, LF and historical records. Add the chosen task metadata/Q/A/index behavior only after the pending archive decision. An explicit checkpoint adapter returns archive identity/path/hash to workflow code. |
| `app/hooks/stop.ts`, `completion.ts`, `install.ts` | Preserve current root/subagent separation and explicit hook trust. Route eligible root completion through the same workflow implementation only when full scope/checkpoint state exists. Subagents never publish the shared checkout. Installer preserves conflicting hooks and keeps runtime paths in local Git config. |
| `.githooks/pre-commit` | Preserve installed-runtime lookup. Invoke actual Teamagent review or validated exact-input reuse, plus unconditional staged cache/evidence checks where implemented. No Trigon release command. |
| `.githooks/commit-msg` | New small executable wrapper for the bounded message validator. Verify executable index mode on portable checkouts. |
| `.codex/hooks.json` | Adapt only supported and reviewed events; no source machine paths or copied policy. Do not claim activation from file presence. Preserve manual JSON fallback until actual host behavior is observed. |
| `package.json` | Add developer `task:*` script routes using Bun; no dependency/lockfile change needed for the core helper. Do not expose unfinished integration/repair/handoff routes. |
| `app/check/line-endings.ts` | Register owned workflow JSON/log/receipt roots; keep temporary Git indexes as narrowly scoped binary scratch, not blanket-exempt text output. |
| `app/check/index.ts` and cache helpers | Connect workflow verification using the parallel cache audit's contracts. Normal checks remain credential-free, do not install dependencies, and never change signing/trust settings. |
| `spec/workflow.md`, `spec/task-lifecycle.md`, `spec/verification.md`, `spec/conversation-logging.md`, `AGENTS.md` | Single operational authority for each rule; document authorized Teamagent publication, recovery states, selected archive policy and deferred integrations. Retain research architecture evidence outside operational layout quotas. |
| `test/workflow-*.test.ts` | Scoped real-Git fixtures and deterministic runner/archive boundaries; signing success only when actually exercised. |

The exact number of source files depends on the archive choice and cache implementation. The main publication path needs roughly a dozen small host files plus existing archive/check adapters; copying all Trigon conversations/release files is unnecessary. Files may be combined only where responsibilities remain clear; avoiding a release engine is not a reason to weaken boundary checks.

## State and private configuration invariants

- Existing `.env.local`, local Git runtime/signing configuration, authentication helpers and Codex user settings remain private and unchanged. Never copy Trigon `.cache/`, `.verification/` receipts, configured signing identities, raw transcripts, Codex config or historical task state.
- Store fresh Teamagent task state under ignored `.cache/workflow/` with a schema version and hashes for identity and reviewed scope. Public receipts expose only approved relative paths and policy facts; private transcript paths stay out of committed records. Explicitly bound reads before allocating them, not after reading an unbounded file.
- Git's original task baseline and exact fetch/push destination identity are frozen. The helper rejects missing upstream, detached HEAD, rewritten destination, changed baseline, unrelated staged content and unreviewed pre-existing files; it does not silently switch branches, reset, stash or adopt an entire dirty checkout.
- Reject known private settings and ignored credential/config paths from publication scope before hashing/staging. `.env.example` remains a normal authored example; do not copy credentials into it. Use explicit literal path lists, never an all-files fallback. Reconcile already-tracked sensitive settings as an explicit separate issue rather than publishing them automatically.
- `ready`, `committing`, `committed`, `pushed`, cancelled and uncertain/failed outcomes must remain distinguishable. Failure is not evidence that no commit or remote update occurred. Preserve the exact attempt and remote SHA reconciliation; no retry by another entry point.
- Local cached proofs are cooperative acceleration, not authenticated authorization. Policy files and approved destination can be part of the frozen input, but no cached receipt grants permission to a new branch, operation or provider.
- Hooks and explicit CLI call the same guards. The new approval permits normal signed task publication; it does not permit bypassing sandbox/approval rejection, silently enabling Full access, importing a source repository's reviewer policy or changing hook trust.

## Additional source issue confirmed during dependency tracing

The current Trigon `complete -> prepare -> publish` path does not call `authorizedRemote` or `publicationTarget`; those checks are in preflight/completionBrief. It freezes the existing upstream and checks for later change, but a caller can reach publication without the readiness operation that proves the destination falls within standing policy. Adaptation must enforce the actual Teamagent destination/ref allowlist inside publication itself, alongside the signing fix already recorded in the audit. This is a static call-path finding; no unauthorized publication was attempted.

## Pending decisions and safe ordering

1. Settle archive identity/timing/no-change behavior before changing checkpoint or hooks. Until then preserve current writer behavior and prepare only the independent Git/state/runner fixtures.
2. Implement negative fixtures for live stale locks, unauthorized destination, signing disabled after preflight, signature failure, unrelated staging, changed baseline, malformed/private scope, interrupted/ambiguous commit/push and replay. The initial failing behavior should be observed in local fixtures, never against the real upstream.
3. Adapt bounded state/Git/publication helpers and the selected archive adapter. Run focused tests and the existing step gate.
4. Connect validated verification cache reuse and staged receipts; recheck ignored LF evidence changes, partial staging and stale/tampered cache boundaries. Run full review.
5. Activate public task routes/docs/hook wiring only for implemented behavior; check real host readiness separately. A missing signing key or denied publication leaves reviewed local work and honest recovery state, without weakening gates.
6. Publish the completed Teamagent task only under the approved exact target and current checks. Worktree integration/source replay, release versioning, tags, deployments and bilingual release notes remain separate scope.

No new library patch or dependency is required by this minimal design. If implementation exposes an actual upstream defect, follow the user's dependency policy: reuse an applicable reviewed Trigon patch, otherwise ask before creating one. No speculative patch is part of this plan.
