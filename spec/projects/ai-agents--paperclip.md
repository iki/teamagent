# paperclip

Source: [paperclip](https://github.com/paperclipai/paperclip) · Category: [ai-agents](../categories/ai-agents.md)

Review depth: **focused source review**. Snapshot `2a8a99e4a5f69aa803b3f10b982f583e75a87042` (2026-10-03T12:41:22-05:00). Reviewed 2026-10-04. This assessment covers the cited implementation/contract, not every subsystem or runtime behavior.

## Finding

Persistent scoped budgets are a stronger control-plane primitive than a prompt asking agents to spend less.

## Source evidence inspected

- [server/src/services/budgets.ts, lines 28–100](https://github.com/paperclipai/paperclip/blob/2a8a99e4a5f69aa803b3f10b982f583e75a87042/server/src/services/budgets.ts#L28-L100)

## Observed design and algorithms

The service models company, project and agent scopes with persisted policies, incidents and cost events. It distinguishes UTC monthly and lifetime windows. budgetStatusFromObserved maps observed usage to ok, warning and hard_stop; a nonpositive amount is treated as no active limit. A cancellation hook allows enforcement to stop work for a scope.

## Harness decision

Adopt explicit budget scope, incident and resolution concepts for a team harness. Add admission reservations before parallel work and reconcile actual usage afterward. Keep money, tokens, subscription allowance and compute time as distinct units; the reviewed threshold function does not solve unit conversion.

## Limits and tradeoffs

A threshold over already-observed cost can overshoot during concurrent or long-running requests. A cancellation hook does not prove that every provider request is cancellable or that enforcement is atomic. The company-management product is broader than the requested core.

## Validation before adoption

Test two workers consuming the same remaining budget, late usage events, month boundaries, idempotent cost ingestion and cancellation failures. Expose estimate-versus-measured accounting clearly. No tests, live inference, installation, or production operation were performed for this review. License indicator: MIT; verify the exact files and dependencies before reuse.

Related directions: [agents](../agents.md) · [models](../models.md) · [evolution](../evolution.md).

## 2026-10-28 scoped source review

Source: [paperclip](https://github.com/paperclipai/paperclip); inspected saved discovery revision `50b932a142216331b8d476042b454bc123739c40`. Prior analyzed revision `2a8a99e4a5f69aa803b3f10b982f583e75a87042` remains historical evidence.

**Scope:** Complete CLI approval page plus budget service sections 1–94, 174–225, 274–365, 574–622 and 1060–1136. Accounting transaction internals, exposure calculations, authorization API and cancellation delivery were not inspected.

The [budget handoff recheck](https://github.com/paperclipai/paperclip/blob/50b932a142216331b8d476042b454bc123739c40/server/src/services/budgets.ts#L174-L224) requires a held reservation matching company, agent, run and nullable project, then checks applicable billed-cost policies and pending/unpriced exposure. Its own contract is supplemental and read-only after authoritative admission; it does not take the company lock or eliminate later concurrent charges. Teamagent should distinguish reservation ownership, admission and post-admission cancellation rather than describing a budget check as an atomic provider-spend ceiling.

[Budget reconciliation](https://github.com/paperclipai/paperclip/blob/50b932a142216331b8d476042b454bc123739c40/server/src/services/budgets.ts#L574-L620) separates unfinished accounting recovery from fresh work, preserves manual pauses, and releases only budget-owned pauses. [Enforcement generation](https://github.com/paperclipai/paperclip/blob/50b932a142216331b8d476042b454bc123739c40/server/src/services/budgets.ts#L274-L364) avoids advancing an already pending cancellation generation; the [service facade](https://github.com/paperclipai/paperclip/blob/50b932a142216331b8d476042b454bc123739c40/server/src/services/budgets.ts#L1092-L1136) routes mutations through accounting transactions and pages reconciliation in batches of 100. Transaction locking, cost calculations and the durable cancellation worker remain separate evidence gaps.

The [CLI approval page](https://github.com/paperclipai/paperclip/blob/50b932a142216331b8d476042b454bc123739c40/ui/src/pages/CliAuth.tsx#L24-L69) retries only rate-limited challenge reads, with retry count and expiry/window limits; approve/cancel are explicit mutations. It carries the challenge token in the URL, query key and encoded sign-in return path. The [approval explanation](https://github.com/paperclipai/paperclip/blob/50b932a142216331b8d476042b454bc123739c40/ui/src/pages/CliAuth.tsx#L147-L208) says the client requests full board access and labels the organization as audit context, which must not be misread as an organization-scoped grant. Server token expiry, one-time consumption, identity checks and URL/log privacy were not established here. Teamagent should keep sensitive approval state outside public URLs and independently enforce grants. No upstream/browser/database tests or provider calls were run.

## 2026-10-28 follow-up source review

Reviewed the frozen update from `50b932a142216331b8d476042b454bc123739c40` to `cff331f6ca0a652b5e41641c68dfa5fa584c22ae`. Earlier findings above remain historical evidence; this review is limited to the cited source and delta.

In [server/src/services/budgets.ts](https://github.com/paperclipai/paperclip/blob/cff331f6ca0a652b5e41641c68dfa5fa584c22ae/server/src/services/budgets.ts#L255-L305), Budget-driven approval updates now notify approval work before recording the status. Company pause/resume paths also notify retention work alongside lifecycle/skill-source queues. The service explicitly requires its caller to hold the company accounting transaction lock.

**Harness implication and limits:** Budget and approval transitions must wake all affected workers through transaction-aware delivery rather than relying on polling alone. The call order does not prove durable notification or commit ordering: the notification helpers, enclosing transaction and consumers were not audited. Verify rollback, duplicate wakeups and workers observing only committed state before adopting this pattern. No database workload or upstream test was run. This static review does not certify other changed subsystems.

## 2026-11-01 scoped source review

Reviewed frozen commit `d941ed3879d9f9b49573bc138e1f6c465271fca4` against prior analyzed commit `cff331f6ca0a652b5e41641c68dfa5fa584c22ae`. Historical reviews above remain separate evidence.

The [managed sandbox runtime](https://github.com/paperclipai/paperclip/blob/d941ed3879d9f9b49573bc138e1f6c465271fca4/packages/adapter-utils/src/sandbox-managed-runtime.ts) preserves completed workspace work when a delta Git bundle lacks prerequisites: the full export now carries shallow metadata, with producer-error classification and transfer/post-transfer byte checks. The [fixtures](https://github.com/paperclipai/paperclip/blob/d941ed3879d9f9b49573bc138e1f6c465271fca4/packages/adapter-utils/src/sandbox-managed-runtime.test.ts) construct local Git repositories with independent shallow boundaries, concurrent host files/commits and missing prerequisites. They expect retained host history, connectivity, merged parent identity, and refusal of oversized metadata before changing the host head.

The same delta adds company-scoped seed reuse with per-checkout Git HEAD/ref rebinding, private lookup copies and an optional awaited index refresh inside the inbound barrier. The underlying seed identity/hash-validation and Git integration helpers were not inspected here, so this is not a certification of shared-cache isolation. Teamagent should separate transport recovery of already completed work from rerunning an agent, preserve local concurrency, and require complete history/metadata bounds and scope-aware cache keys before reuse. No published speed claim is derived from these fixtures.

**Coverage:** Read the complete targeted managed-runtime implementation/test delta (469 presented lines). Imported Git/seed helpers, other cache tests and the remaining oversized update were not reviewed. Source inspection only; no upstream tests, source programs or live providers were executed. This is a scoped architecture review, not a whole-repository correctness or security certification.

<!-- teamagent-analysis:start -->
Analysis metadata: source [paperclip](https://github.com/paperclipai/paperclip); analyzed commit `d941ed3879d9f9b49573bc138e1f6c465271fca4`; commit date 2026-11-01T03:56:44-06:00; review date 2026-11-01T11:33:30.893Z; depth source-reviewed. [Maintenance record](../analyses/repos/ai-agents--paperclip.md).
<!-- teamagent-analysis:end -->
