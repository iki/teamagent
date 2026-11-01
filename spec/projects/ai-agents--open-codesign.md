# open-codesign

Source: [open-codesign](https://github.com/OpenCoworkAI/open-codesign) · Category: [ai-agents](../categories/ai-agents.md)

Original review depth: **inventory / README screening only**. The dated update review below has its own explicit scope. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `5bc24f04b6074a4189b603dcd6046983525b4618`; commit timestamp `2026-09-30T17:38:23+08:00`; 979 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/OpenCoworkAI/open-codesign/blob/5bc24f04b6074a4189b603dcd6046983525b4618/README.md)):

> Turn prompts into polished artifacts — locally, openly, and with whichever model you already pay for. Website · Quickstart · What's new · Changelog · Discussions · Docs · Contributing · Security

Build/package evidence: [apps/desktop/package.json](https://github.com/OpenCoworkAI/open-codesign/blob/5bc24f04b6074a4189b603dcd6046983525b4618/apps/desktop/package.json); [package.json](https://github.com/OpenCoworkAI/open-codesign/blob/5bc24f04b6074a4189b603dcd6046983525b4618/package.json); [packages/artifacts/package.json](https://github.com/OpenCoworkAI/open-codesign/blob/5bc24f04b6074a4189b603dcd6046983525b4618/packages/artifacts/package.json); [packages/core/package.json](https://github.com/OpenCoworkAI/open-codesign/blob/5bc24f04b6074a4189b603dcd6046983525b4618/packages/core/package.json); [packages/exporters/package.json](https://github.com/OpenCoworkAI/open-codesign/blob/5bc24f04b6074a4189b603dcd6046983525b4618/packages/exporters/package.json)

License evidence: [LICENSE](https://github.com/OpenCoworkAI/open-codesign/blob/5bc24f04b6074a4189b603dcd6046983525b4618/LICENSE) Classification hint: MIT. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents**. Its category places it in the candidate set for agents, models, channels; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [models](../models.md) · [channels](../channels.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

## 2026-10-28 scoped update review

Reviewed commit `4cf33932edc5f687e3cf7190261ebbb02c898d08` (commit date `2026-10-24T17:23:46+08:00`). The original snapshot above remains historical evidence.

**Scope:** Complete sequential JSONL UI session and mocked fixtures, plus the done tool's execution branch and complete delta; desktop execution/isolation, static parser internals and the wider agent were not audited.

The [UI session transport](https://github.com/OpenCoworkAI/open-codesign/blob/4cf33932edc5f687e3cf7190261ebbb02c898d08/apps/cli/src/ui-session.ts#L8-L138) decodes split UTF-8 input, bounds message bytes and queued requests, rejects unsupported fields/methods and uses unique request IDs. Its loop additionally bounds total requests/steps and validates action batches through the host. Invalid requests can be corrected within the same sequential session without emitting the raw rejected input. These are useful channel-envelope patterns; the initial chunk is appended before its byte limit is checked, and output/backpressure bounds belong to an uninspected writer boundary.

[Lifetime, idle and per-request timers](https://github.com/OpenCoworkAI/open-codesign/blob/4cf33932edc5f687e3cf7190261ebbb02c898d08/apps/cli/src/ui-session.ts#L158-L304) feed a shared abort signal, preserve stable terminal errors and dispose input listeners. Their ability to finish a stuck host operation still depends on the host honoring cancellation: the adapter awaits host loading and session actions directly. The [fixtures](https://github.com/OpenCoworkAI/open-codesign/blob/4cf33932edc5f687e3cf7190261ebbb02c898d08/apps/cli/src/ui-session.test.ts) exercise a fake host, split multibyte input, duplicate IDs, input limits and cleanup status. They were not run and cannot establish packaged desktop isolation or real cleanup.

The [done tool](https://github.com/OpenCoworkAI/open-codesign/blob/4cf33932edc5f687e3cf7190261ebbb02c898d08/packages/core/src/tools/done.ts#L497-L602) separates blocking errors from advisory layout warnings and can call an injected runtime verifier. Runtime checking is optional and applies only to renderable paths; the success text chooses its runtime claim based on the callback being configured, rather than recording whether that particular path actually ran it. The broader statement that the design is verified consequently needs a scoped evidence receipt. Teamagent should record artifact version, exact checks performed, skipped/unsupported checks and observed outcomes; a model instruction to stop using tools is not host enforcement or proof of task correctness.

**Verification limit:** source inspection only; no upstream tests or provider calls were executed. This scoped review does not certify every file in the repository.

## 2026-11-01 scoped source review

Reviewed frozen commit `5daa34e6c07103f45a40201a4ffefb5c3855562b` against prior analyzed commit `4cf33932edc5f687e3cf7190261ebbb02c898d08`. Historical reviews above remain separate evidence.

The [context-budget estimator](https://github.com/OpenCoworkAI/open-codesign/blob/5daa34e6c07103f45a40201a4ffefb5c3855562b/packages/core/src/context-budget.ts) now includes serialized native-search replay output, using the maximum of the existing Pi estimate and a characters-divided-by-four estimate for that opaque payload. The [new fixture](https://github.com/OpenCoworkAI/open-codesign/blob/5daa34e6c07103f45a40201a4ffefb5c3855562b/packages/core/src/context-budget.test.ts) gives a short visible assistant message a large hidden replay payload and expects its paired history to be dropped under a small context window.

Account for provider replay artifacts even when the UI shows little text. The maximum avoids counting both estimates as independent totals, but it is a heuristic rather than a tokenizer measurement or conservative sum of all distinct serialized fields. JSON serialization itself materializes the payload and has no new byte/depth guard here. Teamagent should budget actual provider envelopes under bounded serialization, record estimate provenance and preserve coherent tool/message groups during pruning; this delta does not demonstrate those broader guarantees.

**Coverage:** Read the complete 53-line context-budget implementation/fixture delta. Pruning, provider envelope construction and other new context behavior were not audited. Source inspection only; no upstream tests, source programs or live providers were executed. This is a scoped architecture review, not a whole-repository correctness or security certification.

<!-- teamagent-analysis:start -->
Analysis metadata: source [open-codesign](https://github.com/OpenCoworkAI/open-codesign); analyzed commit `5daa34e6c07103f45a40201a4ffefb5c3855562b`; commit date 2026-10-31T16:01:59+08:00; review date 2026-11-01T11:33:30.893Z; depth screened. [Maintenance record](../analyses/repos/ai-agents--open-codesign.md).
<!-- teamagent-analysis:end -->
