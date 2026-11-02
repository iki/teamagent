# loopx

Source: [loopx](https://github.com/huangruiteng/loopx) · Category: [ai-agents](../categories/ai-agents.md)

Original review depth: **inventory / README screening only**. The dated update review below has its own explicit scope. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `99839aeb8fed5fae38a5d319391cd050672a6508`; commit timestamp `2026-10-04T01:14:41+08:00`; 5,643 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/huangruiteng/loopx/blob/99839aeb8fed5fae38a5d319391cd050672a6508/README.md)):

> The open, local-first control plane for long-horizon agents and personal agent teams. Keep goals, decisions and evidence across sessions. Work with Codex, Claude Code, DeepSeek Harness and other supported runtimes.

Build/package evidence: [apps/desktop/loopx-control-plane/package.json](https://github.com/huangruiteng/loopx/blob/99839aeb8fed5fae38a5d319391cd050672a6508/apps/desktop/loopx-control-plane/package.json); [apps/desktop/loopx-control-plane/src-tauri/Cargo.toml](https://github.com/huangruiteng/loopx/blob/99839aeb8fed5fae38a5d319391cd050672a6508/apps/desktop/loopx-control-plane/src-tauri/Cargo.toml); [apps/presentation/dashboard/package.json](https://github.com/huangruiteng/loopx/blob/99839aeb8fed5fae38a5d319391cd050672a6508/apps/presentation/dashboard/package.json); [apps/presentation/site/package.json](https://github.com/huangruiteng/loopx/blob/99839aeb8fed5fae38a5d319391cd050672a6508/apps/presentation/site/package.json); [examples/dsh-loopx-demo/package.json](https://github.com/huangruiteng/loopx/blob/99839aeb8fed5fae38a5d319391cd050672a6508/examples/dsh-loopx-demo/package.json)

License evidence: [LICENSE](https://github.com/huangruiteng/loopx/blob/99839aeb8fed5fae38a5d319391cd050672a6508/LICENSE); [LICENSE-MIT](https://github.com/huangruiteng/loopx/blob/99839aeb8fed5fae38a5d319391cd050672a6508/LICENSE-MIT) Classification hint: Apache-2.0. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents**. Its category places it in the candidate set for agents, models, channels; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [models](../models.md) · [channels](../channels.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

## 2026-10-28 scoped update review

Reviewed commit `fff09ead9b17190d9cc8385f0c4da70669a4f272` (commit date `2026-10-28T01:50:26+08:00`). The original snapshot above remains historical evidence.

**Scope:** Complete runtime-goal archive implementation and native-chat Codex authentication fixture. Path/registry/lock primitives, credential broker implementation, chat agent and native runtime were not audited.

The [archive operation](https://github.com/huangruiteng/loopx/blob/fff09ead9b17190d9cc8385f0c4da70669a4f272/loopx/runtime.py#L100-L238) separates planning from execution, requires an explicit override for registered goals and resolves the source under the goals root. It acquires artifact, source-registry, maintenance and registry locks in a documented order, then rereads membership, source routes, exact goal-instance references and containment before moving. This provides useful protection against stale preflight decisions among cooperating writers. The lock implementation and all writer call sites were not inspected; the initial runtime-root choice is not re-resolved from the locked registry. A goal ID alone is insufficient when an instance can be replaced.

The [destination checks and result](https://github.com/huangruiteng/loopx/blob/fff09ead9b17190d9cc8385f0c4da70669a4f272/loopx/runtime.py#L18-L36) prevent moving a goal inside itself and choose a currently unused suffix, while the result explicitly distinguishes would-move from moved. Existence-check naming is not an atomic destination reservation, and shutil.move can perform a cross-filesystem copy/remove sequence with partial failure. The routine does not establish a durable archive transaction, contents hash or post-move verification. Keep approved source/destination identity and recovery records through the operation, and report partial outcomes rather than interpreting a successful preflight as a completed archive.

The [authentication fixture](https://github.com/huangruiteng/loopx/blob/fff09ead9b17190d9cc8385f0c4da70669a4f272/tests/test_chat_codex_auth.py#L21-L129) specifies a narrow access-token/account projection, rejection of symlinked or malformed credentials, refresh coalescing and account-preserving errors. Its [start/resume cases](https://github.com/huangruiteng/loopx/blob/fff09ead9b17190d9cc8385f0c4da70669a4f272/tests/test_chat_codex_auth.py#L132-L195) expect credentials only over private RPC, a fixed provider/permission profile, no copied auth file and refusal of provider mismatch before a turn. The process and refresh paths are mocked and the implementation was not reviewed, so these are valuable acceptance requirements rather than proven native isolation or credential confinement. No credential file, subprocess, archive or upstream test was used in this review.

**Verification limit:** source inspection only; no upstream tests or provider calls were executed. This scoped review does not certify every file in the repository.

## 2026-10-28 follow-up source review

Reviewed the frozen update from `fff09ead9b17190d9cc8385f0c4da70669a4f272` to `0cfbf11dcea4ba7bc8fb13f06f1c915b63ce8fad`. Earlier findings above remain historical evidence; this review is limited to the cited source and delta.

In [loopx/control_plane/todos/provider_update.py](https://github.com/huangruiteng/loopx/blob/0cfbf11dcea4ba7bc8fb13f06f1c915b63ce8fad/loopx/control_plane/todos/provider_update.py#L247-L319), Claim progress is now carried by a separate claim_operation_id in the v6 update request, alongside provider/registry revisions and lease identity/version. The helper refuses combining a claim with validation revision, monitor observation or an exact lowercased done status. Completion uses a separate declaration path.

**Harness implication and limits:** Keep progress authority separate from completion evidence. Reuse stable operation/lease IDs across reconciliation rather than granting completion through a generic progress field. One local normalization inconsistency deserves a fixture: the claim guard lowercases status without trimming, while the subsequent completion branch trims it. The native validator may reject that mismatch, but it was not inspected, so this helper alone does not establish enforcement for whitespace variants. No upstream tests, agent execution or provider requests were run.

## 2026-11-01 scoped source review

Reviewed frozen commit `70f643153ea773b7bc1ef71bdb06095b0744bd6d` against prior analyzed commit `0cfbf11dcea4ba7bc8fb13f06f1c915b63ce8fad`. Historical reviews above remain separate evidence.

The [acceptance inspection path](https://github.com/huangruiteng/loopx/blob/70f643153ea773b7bc1ef71bdb06095b0744bd6d/loopx/control_plane/goals/acceptance_authority.ts) adds outcome-context navigation with the authority provider revision. If its context agent is unavailable from the registered set, it marks coverage incomplete, adds an explicit limitation and offers the complete contract's outcome IDs. This keeps a compact contextual view from masquerading as complete authority. The [worker planner delta](https://github.com/huangruiteng/loopx/blob/70f643153ea773b7bc1ef71bdb06095b0744bd6d/loopx/capabilities/explore/worker_branch_plan.py) removes suggested lease commands while retaining suggested claims and explicit non-execution/non-mutation flags.

The [acceptance-reference fixture additions](https://github.com/huangruiteng/loopx/blob/70f643153ea773b7bc1ef71bdb06095b0744bd6d/tests/control_plane/test_quota_acceptance_references.py) test exact numeric spelling/type preservation, relocated reference owners, unknown references left unchanged, immutable inputs, idempotent projection and recovery when a delta baseline is lost. Their projection implementation was not inspected in this scope; these are test-design evidence, not a new verified transport guarantee. Teamagent should carry full acceptance authority separately from compressed navigation, report incomplete coverage and restore an authenticated complete baseline before authorizing effects.

**Coverage:** Read complete targeted acceptance-inspection and planner deltas plus two fixture deltas. Reference-compaction implementation, mutation authority and the rest of the oversized change remain outside scope. Source inspection only; no upstream tests, source programs or live providers were executed. This is a scoped architecture review, not a whole-repository correctness or security certification.

## External-update review - 2026-11-01

Reviewed `07b555494550c12ff6e3dc4b139cdf7cd1bdae32` against `70f643153ea773b7bc1ef71bdb06095b0744bd6d`.

The 265-path update includes a portable workspace-containment correction. The complete inspected [lease-workspace delta](https://github.com/huangruiteng/loopx/blob/07b555494550c12ff6e3dc4b139cdf7cd1bdae32/loopx/control_plane/work_items/task_lease_workspace.ts) replaces a slash-specific `realpath.startsWith(root + "/")` comparison with the platform path library's `relative`, separator and absolute-path checks. A resolved location equal to the root, outside it through `..`, or on an absolute/different-root path is rejected. Traversal still uses the declared overlap predicate, and symlinks retain their separate existing validation path.

The complete inspected [fixture delta](https://github.com/huangruiteng/loopx/blob/07b555494550c12ff6e3dc4b139cdf7cd1bdae32/tests/control_plane_ts/task_lease_workspace.test.ts) adds real scoped directory contents while retaining origin-identity checks, including distinct ports. This establishes the authored regression intent; it is not evidence that Windows junction attacks or concurrent replacement have been executed successfully.

**Harness consequence:** Use canonical, platform-aware path containment independently of slash-normalized logical scope matching. A successful point-in-time observation does not establish an immutable filesystem view: recheck at the consuming operation, bind the workspace generation, and separately validate symlink targets. This narrow review does not audit the unchanged link helper or the remaining context, quota and release changes. No upstream programs or tests were executed.

<!-- teamagent-analysis:start -->
Analysis metadata: source [loopx](https://github.com/huangruiteng/loopx); analyzed commit `07b555494550c12ff6e3dc4b139cdf7cd1bdae32`; commit date 2026-11-02T01:35:54+05:30; review date 2026-11-01T23:12:06.798Z; depth screened. [Maintenance record](../analyses/repos/ai-agents--loopx.md).
<!-- teamagent-analysis:end -->
