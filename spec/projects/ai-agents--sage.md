# sage

Source: [sage](https://github.com/ZHangZHengEric/Sage) · Category: [ai-agents](../categories/ai-agents.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `7d97f0e8ce0311042796fb2e7699462012bbd87a`; commit timestamp `2026-09-30T18:25:07+08:00`; 2,946 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/ZHangZHengEric/Sage/blob/7d97f0e8ce0311042796fb2e7699462012bbd87a/README.md)):

> [](https://join.slack.com/t/sage-b021145/shared_invite/zt-3t8nabs6c-qCEDzNUYtMblPshQTKSWOA) 🌟 **An open-source agent platform for project work, tool execution, and multi-agent collaboration — on your desktop, on the web, or in your own application.

Build/package evidence: [app/skills/mcp-builder/scripts/requirements.txt](https://github.com/ZHangZHengEric/Sage/blob/7d97f0e8ce0311042796fb2e7699462012bbd87a/app/skills/mcp-builder/scripts/requirements.txt); [app/skills/slack-gif-creator/requirements.txt](https://github.com/ZHangZHengEric/Sage/blob/7d97f0e8ce0311042796fb2e7699462012bbd87a/app/skills/slack-gif-creator/requirements.txt); [app/skills/social-push/package.json](https://github.com/ZHangZHengEric/Sage/blob/7d97f0e8ce0311042796fb2e7699462012bbd87a/app/skills/social-push/package.json); [app/skills/social-push/requirements.txt](https://github.com/ZHangZHengEric/Sage/blob/7d97f0e8ce0311042796fb2e7699462012bbd87a/app/skills/social-push/requirements.txt); [app/v1/desktop/tauri/Cargo.toml](https://github.com/ZHangZHengEric/Sage/blob/7d97f0e8ce0311042796fb2e7699462012bbd87a/app/v1/desktop/tauri/Cargo.toml)

License evidence: [LICENSE](https://github.com/ZHangZHengEric/Sage/blob/7d97f0e8ce0311042796fb2e7699462012bbd87a/LICENSE) Classification hint: MIT. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents**. Its category places it in the candidate set for agents, models, channels; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [models](../models.md) · [channels](../channels.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

## 2026-10-28 divergent-history investigation and scoped source review

Source: [sage](https://github.com/ZHangZHengEric/Sage); inspected snapshot `358f925822e07035c35e610af19bea14de3e01df`; prior analyzed commit `7d97f0e8ce0311042796fb2e7699462012bbd87a`. The inspected snapshot is the saved discovery version, not a claim about the checkout's latest HEAD.

**Scope:** Complete committed path inventory (3,318 paths); full agent_router_service.py (176 lines), auth.py (31 lines), and model_invocation_service.py lines 1–240. Remaining routing/auth middleware and live services were outside scope.

**History outcome:** both full commits are available, but the analyzed commit is not an ancestor and the complete trees differ. The two-tree comparison contains 3,318 changed paths; common ancestor: `0b0dbeae1025612080b59b660bab0509c352f778`. These counts establish comparison coverage, not semantic review of every file. The prior analyzed baseline and findings remain preserved as historical evidence. A separately acknowledged, guarded reconciliation records the inspected revision as a new scoped analysis baseline; it does not establish ancestry, publisher intent or whole-project correctness. The managed metadata below is authoritative for whether that acknowledgment has been recorded.

The [agent response adapters](https://github.com/ZHangZHengEric/Sage/blob/358f925822e07035c35e610af19bea14de3e01df/app/v1/common/services/agent_router_service.py) forward ownership metadata to async submissions, but workspace deletion ignores the supplied deleter's Boolean result before reporting deletion. A response wrapper should preserve failure/partial outcomes instead of converting a completed await into success. The [auth helper](https://github.com/ZHangZHengEric/Sage/blob/358f925822e07035c35e610af19bea14de3e01df/app/v1/common/services/auth.py) uses Argon2 password hashing and constructs session claims; this file does not establish authorization or session-transport protections.

The reviewed [model configuration boundary](https://github.com/ZHangZHengEric/Sage/blob/358f925822e07035c35e610af19bea14de3e01df/app/v1/common/services/model_invocation_service.py#L1-L240) resolves providers by IDs, excludes known provider credentials/config fields from ordinary request passthrough and keeps fast-provider settings separate. _resolve_runtime_user_id prefers a nonempty body user_id over the configured value. That is an attribution boundary requiring a trusted upstream check; this limited inspection is not evidence of an exploitable authorization bypass or proof that such a check exists. Teamagent should bind effective identity and provider grants at the authenticated boundary, before request extras or model routing are considered.

## 2026-10-28 follow-up source review

Reviewed the frozen update from `358f925822e07035c35e610af19bea14de3e01df` to `5e66cbc8cc931155802c84e29d1cfd32d68a2c30`. Earlier findings above remain historical evidence; this review is limited to the cited source and delta.

In [sagents/v2/agent/factory.py](https://github.com/ZHangZHengEric/Sage/blob/5e66cbc8cc931155802c84e29d1cfd32d68a2c30/sagents/v2/agent/factory.py#L252-L296), Context construction derives the input budget from the minimum of the model route's context window and the agent ceiling, with a fallback when neither exists. Output reserve follows request/model/ceiling precedence. The delta removes separately injected system-token and protected-recent defaults from this composition point while retaining explicit provider order, reducer and authoritative history reader.

**Harness implication and limits:** Budget the assembled context against the effective model route and keep host prompt policy separate from retrieval providers. Removing defaults here does not prove that the underlying assembler enforces the desired segment protections; inspect its new behavior before adopting. Invalid limits, reserve-versus-input overflow and token-estimation accuracy were not tested. This static review does not certify other changed subsystems.

## 2026-11-01 scoped source review

Reviewed frozen commit `39bfe32f3de96442d667ce7ed4ccf8072790b090` against prior analyzed commit `5e66cbc8cc931155802c84e29d1cfd32d68a2c30`. Historical reviews above remain separate evidence.

The [Python scorer adapter](https://github.com/ZHangZHengEric/Sage/blob/39bfe32f3de96442d667ce7ed4ccf8072790b090/sagents/v2/optimization/python_scorer.py) assigns distinct source/dependency-change errors, selects an admitted worker source tree under isolated Python startup, keeps a minimal environment, and creates a POSIX process group. Finally cleanup kills that group, including descendants, while non-POSIX cleanup targets only the leader. Frozen scorer bytes are checked before and after execution.

The selected [fixtures](https://github.com/ZHangZHengEric/Sage/blob/39bfe32f3de96442d667ce7ed4ccf8072790b090/tests/sagents/v2/test_python_scorer.py) separate ordinary error typing from the short timeout case and add a POSIX-only child-heartbeat test after timeout. Desktop restoration propagates the selected worker source root. The heartbeat fixture observes stopped writes, not a native process-handle proof, and post-run hashing detects changes after code may already have executed. Adopt frozen scorer/dependency identities and explicit invalid-run outcomes for evolution; retain Teamagent's owned supervisor and descendant shutdown barrier on Windows as well as POSIX. Isolated Python mode is not a network/filesystem sandbox.

**Coverage:** Read the complete 190-line scorer and selected scorer/desktop fixture delta. Dependency verifier, worker bootstrap internals, source snapshot publication and live model scoring were not audited. Source inspection only; no upstream tests, source programs or live providers were executed. This is a scoped architecture review, not a whole-repository correctness or security certification.

<!-- teamagent-analysis:start -->
Analysis metadata: source [sage](https://github.com/ZHangZHengEric/Sage); analyzed commit `39bfe32f3de96442d667ce7ed4ccf8072790b090`; commit date 2026-10-30T17:11:59+08:00; review date 2026-11-01T11:33:30.893Z; depth screened. [Maintenance record](../analyses/repos/ai-agents--sage.md).
<!-- teamagent-analysis:end -->
