# lean-ctx

Source: [lean-ctx](https://github.com/yvgude/lean-ctx) · Category: [ai-agents-mem](../categories/ai-agents-mem.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `9594b1cc244f8747112bb5fd730f2951a4d94090`; commit timestamp `2026-10-03T21:27:08+02:00`; 3,964 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/yvgude/lean-ctx/blob/9594b1cc244f8747112bb5fd730f2951a4d94090/README.md)):

> LeanCTX sits between AI tools and the information they read. It selects task-relevant context, applies supported access and content controls before

Build/package evidence: [_archive/bench/agent-task/requirements.txt](https://github.com/yvgude/lean-ctx/blob/9594b1cc244f8747112bb5fd730f2951a4d94090/_archive/bench/agent-task/requirements.txt); [_archive/clients-python/pyproject.toml](https://github.com/yvgude/lean-ctx/blob/9594b1cc244f8747112bb5fd730f2951a4d94090/_archive/clients-python/pyproject.toml); [_archive/go-sdk/go.mod](https://github.com/yvgude/lean-ctx/blob/9594b1cc244f8747112bb5fd730f2951a4d94090/_archive/go-sdk/go.mod); [_archive/py-sdk/pyproject.toml](https://github.com/yvgude/lean-ctx/blob/9594b1cc244f8747112bb5fd730f2951a4d94090/_archive/py-sdk/pyproject.toml); [_archive/python-sdk/pyproject.toml](https://github.com/yvgude/lean-ctx/blob/9594b1cc244f8747112bb5fd730f2951a4d94090/_archive/python-sdk/pyproject.toml)

License evidence: [LICENSE](https://github.com/yvgude/lean-ctx/blob/9594b1cc244f8747112bb5fd730f2951a4d94090/LICENSE) Classification hint: Apache-2.0. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents-mem**. Its category places it in the candidate set for memory, evolution; those associations are navigational and have not been individually validated as implemented capabilities. See [memory](../memory.md) · [evolution](../evolution.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.


## Change review - 2026-10-28

**Policy updates compare stored state and task signals preserve many uncertainty states, with missing-record gaps.** Reviewed commit `10a74ea6e7224b21547f92e6f46fb4b7d52b280f` (commit date `2026-10-27T13:45:19+01:00`). Compared with `9594b1cc244f8747112bb5fd730f2951a4d94090`; the complete Git comparison contains 1788 changed paths.

The policy store scopes filenames by a digest, rejects unknown fields and validates policy schema on reads under a one-megabyte stat limit. update_in acquires the shared file lock, compares current state to the caller's expected value, applies a change and atomically writes it, preventing ordinary lost promotions. It retains one predecessor. Missing, malformed, oversized and invalid stored policies all become the same default no-policy state. save_in enforces serialized size but does not validate the policy; its fixture deliberately saves invalid policy then reads no policy, so a successful write/update does not necessarily mean the intended policy became active.

Task signals preserve task/scope attribution, saturate counters and mark multi-process observation, damaged records or recorded incomplete markers as unknown. The fixtures cover scope isolation and lost-event markers. However observe inserts every origin into a process-global unbounded set and spawns one detached thread per first-seen task. Before that thread persists, a missing file reads as clean default; if recording and best-effort marker creation both fail, uncertainty may not survive process loss. Metadata-size checks precede separate whole-file reads. These are useful monitoring signals, not complete outcome evidence or promotion authorization.

Evidence: [rust/src/core/context_store/policy_store.rs:1-216](https://github.com/yvgude/lean-ctx/blob/10a74ea6e7224b21547f92e6f46fb4b7d52b280f/rust/src/core/context_store/policy_store.rs#L1-L216) · [rust/src/core/context_store/task_signals.rs:1-265](https://github.com/yvgude/lean-ctx/blob/10a74ea6e7224b21547f92e6f46fb4b7d52b280f/rust/src/core/context_store/task_signals.rs#L1-L265).

**Harness consequence:** Make absent/disabled/corrupt policy states distinct and validate candidates before persistence, returning a verified active-version receipt after comparison-and-swap. Persist observer registration before serving reads or represent an unregistered task as unknown, bound background work/state and surface marker/write failures durably. Use these signals only alongside held-out task acceptance and independently controlled promotion/rollback rules.

**Scope and limits:** Static scoped review of policy persistence and per-task observation code including embedded tests within the 1,788-path comparison. Lock/atomic-write helpers, licensed policy learner, planner shadow/apply enforcement and transport tests were not fully audited or executed. No policy promoted or runtime signals generated.

## Change review — 2026-11-01

Reviewed `78df21ebe1fe3f16761e3a6667f19b7bb2793fb2` (2026-10-31T21:39:51+01:00) against `10a74ea6e7224b21547f92e6f46fb4b7d52b280f`; 3,795 changed paths. Scoped context planning/materialization diffs retain private in-process admitted bodies instead of rejoining unadmitted wire payloads. Metadata binds original and admitted digests plus effective classification; materialization rechecks project scope, current policy, retained bytes/classification and signed policy horizon. Detected sensitivity can reject a falsely declared input before emitting its digest in candidate metadata. [Admission](https://github.com/yvgude/lean-ctx/blob/78df21ebe1fe3f16761e3a6667f19b7bb2793fb2/rust/src/core/engine_interface/context_plan/sources.rs), [materialization](https://github.com/yvgude/lean-ctx/blob/78df21ebe1fe3f16761e3a6667f19b7bb2793fb2/rust/src/core/engine_interface/context_plan/materialize.rs).

Delivery records exact-text lineage only when all selected presented sources qualify; restricted sources do not produce reusable lineage, and best-effort registration failure leaves no authority. Selected fixtures check exact bytes, cross-project isolation and invalidation after policy changes; presenter-capability test setup also separates presenters. Revalidation is not a concurrency lock, and this review did not audit the persistence/capability primitives or every later test assertion. Teamagent should distinguish planned, admitted, delivered and currently reusable evidence, binding transformations and current permissions at release/reuse. [Handoff fixtures](https://github.com/yvgude/lean-ctx/blob/78df21ebe1fe3f16761e3a6667f19b7bb2793fb2/rust/src/core/engine_interface/context_plan/source_handoff_tests.rs). No native runtime, policy action or upstream tests executed; three paths cover only a narrow part of this large delta.

## External-update review - 2026-11-01

Reviewed `3550b6949658ed0c3afc260ab025f32fd485ab32` against `78df21ebe1fe3f16761e3a6667f19b7bb2793fb2`.

The 336-path release contains a substantial security redesign; this assessment is deliberately limited to policy provenance and shell admission. The new [shell policy source](https://github.com/yvgude/lean-ctx/blob/3550b6949658ed0c3afc260ab025f32fd485ab32/rust/src/core/config/shell_policy.rs) reads release-build policy from the OS-resolved account home rather than caller-controlled HOME/XDG/Lean-ctx overrides, with trusted project settings bound to a configuration hash and trust-store entry. Unresolved home and unparsable global configuration fall back to compiled defaults. Its cache key includes global/local content hashes, project root and trust status.

The [shell assignment guard](https://github.com/yvgude/lean-ctx/blob/3550b6949658ed0c3afc260ab025f32fd485ab32/rust/src/core/shell_allowlist/side_doors.rs) narrows permitted runtime variables and rejects dynamic names, namerefs and selected location-changing assignments as defense in depth. The [CLI fixture](https://github.com/yvgude/lean-ctx/blob/3550b6949658ed0c3afc260ab025f32fd485ab32/rust/src/cli/dispatch/cli_shell_admission_tests.rs), together with tests embedded in shell_policy.rs, pins release-style resolution to a fixture home and checks refusal despite forged environment/configuration.

**Harness consequence:** Policy that grants authority must come from a trusted source independent of the command being assessed. This is not filesystem isolation: a same-user process able to alter the real configuration/trust store still needs an external write boundary. Debug/test builds intentionally use ambient policy except when explicitly pinned, so passing their ordinary tests does not prove release behavior. The inspection covered all three selected source/test deltas, not the wider lexer, execution wiring, installers, network or memory changes. No shell command from the source, Rust build, installer, upstream tests or security reproduction was executed; Windows home resolution through its dependency was not independently verified.

<!-- teamagent-analysis:start -->
Analysis metadata: source [lean-ctx](https://github.com/yvgude/lean-ctx); analyzed commit `3550b6949658ed0c3afc260ab025f32fd485ab32`; commit date 2026-11-01T21:02:54+01:00; review date 2026-11-01T23:12:06.798Z; depth screened. [Maintenance record](../analyses/repos/ai-agents-mem--lean-ctx.md).
<!-- teamagent-analysis:end -->
