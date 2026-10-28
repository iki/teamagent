# gemini-cli

Source: [gemini-cli](https://github.com/google-gemini/gemini-cli) · Category: [ai-agents](../categories/ai-agents.md)

Original review depth: **inventory / README screening only**. The dated update review below has its own explicit scope. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `fb972b2f87fe7d5b06d37eac711490162d98de2c`; commit timestamp `2026-10-02T05:49:39Z`; 3,026 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/google-gemini/gemini-cli/blob/fb972b2f87fe7d5b06d37eac711490162d98de2c/README.md)):

> [](https://github.com/google-gemini/gemini-cli/actions/workflows/ci.yml) [](https://github.com/google-gemini/gemini-cli/actions/workflows/chained_e2e.yml)

Build/package evidence: [package.json](https://github.com/google-gemini/gemini-cli/blob/fb972b2f87fe7d5b06d37eac711490162d98de2c/package.json); [packages/a2a-server/package.json](https://github.com/google-gemini/gemini-cli/blob/fb972b2f87fe7d5b06d37eac711490162d98de2c/packages/a2a-server/package.json); [packages/cli/package.json](https://github.com/google-gemini/gemini-cli/blob/fb972b2f87fe7d5b06d37eac711490162d98de2c/packages/cli/package.json); [packages/cli/src/commands/extensions/examples/mcp-server/package.json](https://github.com/google-gemini/gemini-cli/blob/fb972b2f87fe7d5b06d37eac711490162d98de2c/packages/cli/src/commands/extensions/examples/mcp-server/package.json); [packages/core/package.json](https://github.com/google-gemini/gemini-cli/blob/fb972b2f87fe7d5b06d37eac711490162d98de2c/packages/core/package.json)

License evidence: [LICENSE](https://github.com/google-gemini/gemini-cli/blob/fb972b2f87fe7d5b06d37eac711490162d98de2c/LICENSE) Classification hint: Apache-2.0. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents**. Its category places it in the candidate set for agents, models, channels; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [models](../models.md) · [channels](../channels.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

## 2026-10-28 scoped update review

Reviewed commit `7e6227a09cabcbc691fa59486cb108855131e8ad` (commit date `2026-10-27T17:35:15Z`). The original snapshot above remains historical evidence.

**Scope:** Complete auth UI hook; selected shell confirmation/admission/denial/cleanup and edit confirmation/write/result branches. Policy scheduler, path-lock/filesystem primitives, sandbox execution services and tests were not audited.

The [shell confirmation path](https://github.com/google-gemini/gemini-cli/blob/7e6227a09cabcbc691fa59486cb108855131e8ad/packages/core/src/tools/shell.ts#L339-L569) distinguishes explicit denial, tainted/build-file risk and sandbox expansion. Suggested read/write grants use resolved path identities, while session and persistent approvals are separate outcomes. The [denial recovery branch](https://github.com/google-gemini/gemini-cli/blob/7e6227a09cabcbc691fa59486cb108855131e8ad/packages/core/src/tools/shell.ts#L1015-L1159) returns an expansion-required result rather than executing an unrestricted retry. Its suggestions remain heuristic: a denied file can expand to an existing parent directory, known tools can add network access, and new permissions are detected by set cardinality rather than semantic scope comparison. Keep the concrete resulting scope reviewable and independently enforce policy at dispatch; the scheduler and actual sandbox were not inspected.

The [edit execution branch](https://github.com/google-gemini/gemini-cli/blob/7e6227a09cabcbc691fa59486cb108855131e8ad/packages/core/src/tools/edit.ts#L916-L1009) validates workspace access and places recalculation plus writing under a resolved-path lock to avoid cooperating parallel writers losing changes. The lock implementation and symlink-race protection were outside scope, and the confirmation preview is calculated before this execution lock. After writing, display/diff and [JIT-context work](https://github.com/google-gemini/gemini-cli/blob/7e6227a09cabcbc691fa59486cb108855131e8ad/packages/core/src/tools/edit.ts#L1084-L1142) run inside the same catch that labels any failure FILE_WRITE_FAILURE. A post-write error can therefore report writing failure despite the effect already being applied. Preserve a durable applied-write receipt separately from response decoration, and do not retry an ambiguous edit merely because its presentation failed. A snippet computed from intended content is not an independent readback.

The [auth hook](https://github.com/google-gemini/gemini-cli/blob/7e6227a09cabcbc691fa59486cb108855131e8ad/packages/cli/src/ui/auth/useAuth.ts#L23-L38) checks enforced authentication mode before external/key-specific deferrals, and waits for refreshAuth before marking authenticated. However, the asynchronous effect has no cancellation/generation guard; an older attempt can update UI state after settings or auth state changes. Its generic error path forwards error messages for display, requiring separate redaction guarantees. Shell cleanup distinguishes background ownership transfer but swallows local temporary-file cleanup failures. These are source-scoped adapter requirements, not evidence that native sandboxing, child termination, provider validation or upstream tests passed.

**Verification limit:** source inspection only; no upstream tests or provider calls were executed. This scoped review does not certify every file in the repository.

<!-- teamagent-analysis:start -->
Analysis metadata: source [gemini-cli](https://github.com/google-gemini/gemini-cli); analyzed commit `7e6227a09cabcbc691fa59486cb108855131e8ad`; commit date 2026-10-27T17:35:15Z; review date 2026-10-28T09:27:32.685Z; depth screened. [Maintenance record](../analyses/repos/ai-agents--gemini-cli.md).
<!-- teamagent-analysis:end -->
