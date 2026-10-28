# flue

Source: [flue](https://github.com/withastro/flue) · Category: [ai-agents](../categories/ai-agents.md)

Original review depth: **inventory / README screening only**. The dated update review below has its own explicit scope. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `658325942b0f4eecd888f9698ab0bebb3b749163`; commit timestamp `2026-09-28T16:34:41-04:00`; 1,022 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/withastro/flue/blob/658325942b0f4eecd888f9698ab0bebb3b749163/README.md)):

> Not another SDK. Build autonomous agents with Flue's programmable TypeScript harness. The first agents were built with raw LLM API calls. This worked for simple chatbots and scripted tasks, but not much else.

Build/package evidence: [apps/docs/package.json](https://github.com/withastro/flue/blob/658325942b0f4eecd888f9698ab0bebb3b749163/apps/docs/package.json); [apps/www/package.json](https://github.com/withastro/flue/blob/658325942b0f4eecd888f9698ab0bebb3b749163/apps/www/package.json); [demo/package.json](https://github.com/withastro/flue/blob/658325942b0f4eecd888f9698ab0bebb3b749163/demo/package.json); [examples/assistant/package.json](https://github.com/withastro/flue/blob/658325942b0f4eecd888f9698ab0bebb3b749163/examples/assistant/package.json); [examples/braintrust/package.json](https://github.com/withastro/flue/blob/658325942b0f4eecd888f9698ab0bebb3b749163/examples/braintrust/package.json)

License evidence: [LICENSE](https://github.com/withastro/flue/blob/658325942b0f4eecd888f9698ab0bebb3b749163/LICENSE) Classification hint: Apache-2.0. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents**. Its category places it in the candidate set for agents, models, channels; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [models](../models.md) · [channels](../channels.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

## 2026-10-28 scoped update review

Reviewed commit `deee93b40d275ecc9a50c50af2158f20089d54bc` (commit date `2026-10-12T11:48:06-07:00`). The original snapshot above remains historical evidence.

**Scope:** Complete Node local execution/filesystem adapter; shared timeout helper, other sandbox backends and native/browser acceptance fixtures were not audited.

The [local adapter](https://github.com/withastro/flue/blob/deee93b40d275ecc9a50c50af2158f20089d54bc/packages/runtime/src/node/local-env.ts#L154-L263) snapshots a small inherited environment allowlist at construction, then applies explicit instance and per-call overrides. This is a useful alternative to copying every host secret. The `Sandbox` interface here is a filesystem/process abstraction: absolute paths and relative traversal resolve directly on the host, and file operations use host filesystem APIs without workspace-containment checks. Working-directory selection is not an isolation boundary.

[Shell cancellation](https://github.com/withastro/flue/blob/deee93b40d275ecc9a50c50af2158f20089d54bc/packages/runtime/src/node/local-env.ts#L61-L151) creates a POSIX process group and escalates caller/timeout abort from TERM to KILL after two seconds; Windows grouping is explicitly absent. The output limit has a different path: decoded strings keep accumulating, their character lengths are compared to a constant named bytes, and the first overflow sends only TERM. A process ignoring that signal can keep producing retained output. This source observation does not require executing an unsafe command; the claimed cap is not a hard memory/encoded-byte bound in this implementation.

Teamagent should require byte-aware streaming limits that stop retaining data at the cap, bounded escalation for every shutdown cause and explicit platform capability results. Preserve the environment snapshot pattern, but do not promote this host adapter to a security sandbox or assume local, container and browser backends have equivalent filesystem, cleanup or cancellation semantics.

**Verification limit:** source inspection only; no upstream tests or provider calls were executed. This scoped review does not certify every file in the repository.

<!-- teamagent-analysis:start -->
Analysis metadata: source [flue](https://github.com/withastro/flue); analyzed commit `deee93b40d275ecc9a50c50af2158f20089d54bc`; commit date 2026-10-12T11:48:06-07:00; review date 2026-10-28T08:47:42.123Z; depth screened. [Maintenance record](../analyses/repos/ai-agents--flue.md).
<!-- teamagent-analysis:end -->
