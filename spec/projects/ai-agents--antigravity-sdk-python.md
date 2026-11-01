# antigravity-sdk-python

Source: [antigravity-sdk-python](https://github.com/google-antigravity/antigravity-sdk-python) · Category: [ai-agents](../categories/ai-agents.md)

Original review depth: **inventory / README screening only**. The dated update review below has its own explicit scope. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `12f9a4c3becf487302dc799b0f59054f01f3ddb9`; commit timestamp `2026-09-27T08:18:28-07:00`; 189 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/google-antigravity/antigravity-sdk-python/blob/12f9a4c3becf487302dc799b0f59054f01f3ddb9/README.md)):

> The Google Antigravity SDK is a Python SDK for building AI agents powered by Antigravity and Gemini. It provides a secure, scalable, and stateful

Build/package evidence: [pyproject.toml](https://github.com/google-antigravity/antigravity-sdk-python/blob/12f9a4c3becf487302dc799b0f59054f01f3ddb9/pyproject.toml)

License evidence: [LICENSE](https://github.com/google-antigravity/antigravity-sdk-python/blob/12f9a4c3becf487302dc799b0f59054f01f3ddb9/LICENSE) Classification hint: Apache-2.0. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents**. Its category places it in the candidate set for agents, models, channels; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [models](../models.md) · [channels](../channels.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

## 2026-10-28 scoped update review

Reviewed commit `91dc5f84565bb505577ac9524f107f453a6e8d1f` (commit date `2026-10-13T10:47:42-07:00`). The original snapshot above remains historical evidence.

**Scope:** Hook runner, tool registration/execution/coercion sections and selected hook fixtures; connection implementations, full agent loop, provider service and ToolContext type-adapter internals were not audited.

The [hook dispatcher](https://github.com/google-antigravity/antigravity-sdk-python/blob/91dc5f84565bb505577ac9524f107f453a6e8d1f/google/antigravity/hooks/hook_runner.py#L214-L293) chains argument modifications so later hooks see the updated call and stops at denial. Error hooks may replace an error with a recovered value, while recovery exceptions produce a denial. Teamagent should preserve the original failure and recovery provenance, revalidate the final arguments and bind authorization to the actual executed call; a hook's transformed value is not independent proof that a task is correct. The selected context/recovery fixtures were read, not executed.

The [tool runner](https://github.com/google-antigravity/antigravity-sdk-python/blob/91dc5f84565bb505577ac9524f107f453a6e8d1f/google/antigravity/tools/tool_runner.py#L390-L480) uses type-adapter conversion as best effort: validation exceptions retain the original value. Context injection also preserves a caller-supplied argument of the same name instead of overwriting it. Hiding an internal parameter from the advertised schema is therefore not a sufficient protected-argument boundary for direct runner calls. This is a source-level boundary observation; the enclosing connection/agent call paths were not inspected and no exploit was attempted.

[Batch execution](https://github.com/google-antigravity/antigravity-sdk-python/blob/91dc5f84565bb505577ac9524f107f453a6e8d1f/google/antigravity/tools/tool_runner.py#L482-L536) gathers all calls concurrently, retains call/step/server correlation on ordinary failures and executes synchronous tools in threads. There is no semaphore or per-call deadline in this runner path; cancelling an await is not proof that a synchronous effect stopped. An adapter needs host-owned protected arguments, strict boundary decoding, bounded admission and explicit cancellation/cleanup evidence. SDK source availability does not establish service/account access or an implemented Teamagent integration.

**Verification limit:** source inspection only; no upstream tests or provider calls were executed. This scoped review does not certify every file in the repository.

## 2026-11-01 scoped source review

Reviewed commit `75ba22bd00afae2f46393ff31f30c3f0df52982f` (commit date `2026-10-27T21:14:15-07:00`), compared with `91dc5f84565bb505577ac9524f107f453a6e8d1f`. Earlier observations remain historical evidence.

**Scope:** Complete changed path-normalization helper and hook-router call-site diff; 35 changed paths inventoried. Underlying URI normalizer and workspace enforcement not audited.

The [local configuration helper](https://github.com/google-antigravity/antigravity-sdk-python/blob/75ba22bd00afae2f46393ff31f30c3f0df52982f/google/antigravity/connections/local/local_connection_config.py) changes path-key enumeration from a set to an ordered tuple and centralizes in-place argument normalization, returning the first populated known path. The [hook router](https://github.com/google-antigravity/antigravity-sdk-python/blob/75ba22bd00afae2f46393ff31f30c3f0df52982f/google/antigravity/connections/local/hook_router.py) now uses that result. Priority is therefore deterministic, but a single representative path does not prove that all read/write destinations or symlink targets are authorized.

**Teamagent implication (inference):** Use deterministic canonicalization shared by planning and execution, while validating every effect-bearing path against physical containment and the actual operation grant. Preserve the original request separately from its normalized execution representation.

**Verification limit:** committed-source inspection only; no upstream code, tests or provider calls were executed. Review scope is the cited implementation or authored guidance, not whole-project correctness, licensing clearance or measured performance. Source passages were redacted for review; exact URL literals were not byte-validated.

<!-- teamagent-analysis:start -->
Analysis metadata: source [antigravity-sdk-python](https://github.com/google-antigravity/antigravity-sdk-python); analyzed commit `75ba22bd00afae2f46393ff31f30c3f0df52982f`; commit date 2026-10-27T21:14:15-07:00; review date 2026-11-01T11:33:30.893Z; depth screened. [Maintenance record](../analyses/repos/ai-agents--antigravity-sdk-python.md).
<!-- teamagent-analysis:end -->
