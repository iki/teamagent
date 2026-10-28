# hydra

Source: [hydra](https://github.com/timtimeshock/Hydra) · Category: [ai-agents](../categories/ai-agents.md)

Original review depth: **inventory / README screening only**. The dated update review below has its own explicit scope. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `0a980e72eb879ef849abcefdf817db89c94a1cf4`; commit timestamp `2026-09-20T09:37:29+02:00`; 179 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/timtimeshock/Hydra/blob/0a980e72eb879ef849abcefdf817db89c94a1cf4/README.md)):

> [](https://github.com/timtimeshock/Hydra/actions/workflows/ci.yml) Hydra is a **local orchestrator**. It does not replace Claude or Codex — it runs them together (Claude architect, Opus critique on the same `claude` CLI, Codex implement) through a shared HTTP daemon, task queue, desktop GUI, and multi-round **Council**.

Build/package evidence: [package.json](https://github.com/timtimeshock/Hydra/blob/0a980e72eb879ef849abcefdf817db89c94a1cf4/package.json)

License evidence: [LICENSE](https://github.com/timtimeshock/Hydra/blob/0a980e72eb879ef849abcefdf817db89c94a1cf4/LICENSE) Classification hint: MIT. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents**. Its category places it in the candidate set for agents, models, channels; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [models](../models.md) · [channels](../channels.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

## 2026-10-27 scoped update review

Reviewed commit `1a5158e7e96d82183269b7b613f41d77b8398193` (commit date `2026-10-09T18:26:47+02:00`). The original snapshot above remains historical evidence.

**Scope:** Complete 27-path inventory; focused current session shelving, agent recovery and council routing, with selected council fixtures. No claim that every GUI, daemon, usage-accounting or routing change was audited.

The new [session shelving helper](https://github.com/timtimeshock/Hydra/blob/1a5158e7e96d82183269b7b613f41d77b8398193/lib/hydra-session-isolate.mjs#L26-L79) moves coordination records into an archive, marks open entries cancelled, and clears the active queue. It does not stop processes or provide filesystem/network isolation. Archive-first ordering reduces one loss window, but two ordinary file writes are not atomic, and a malformed existing archive is replaced with an empty archive object. Teamagent should retain an immutable journal and explicit reconciliation state instead of adopting this as a recovery boundary.

[Agent recovery](https://github.com/timtimeshock/Hydra/blob/1a5158e7e96d82183269b7b613f41d77b8398193/lib/hydra-shared/agent-executor.mjs#L1796-L1904) can switch a local-unavailable request to Claude/Codex, or a missing custom CLI to Claude. It also retries classified rate-limit failures. That behavior conflicts with Teamagent's explicit provider, training-policy, egress and cost constraints unless each fallback is separately eligible and authorized. A stderr notice does not supply authorization or prove the earlier attempt had no effects.

[Council recommendation](https://github.com/timtimeshock/Hydra/blob/1a5158e7e96d82183269b7b613f41d77b8398193/lib/hydra-council.mjs#L612-L657) is a deterministic heuristic over model-supplied confidence, disagreements, questions and risk counts. A [fixture](https://github.com/timtimeshock/Hydra/blob/1a5158e7e96d82183269b7b613f41d77b8398193/test/hydra-council.test.mjs#L178-L194) preserves an explicit human decision, while [file-snapshot testing](https://github.com/timtimeshock/Hydra/blob/1a5158e7e96d82183269b7b613f41d77b8398193/test/hydra-council.test.mjs#L245-L254) distinguishes report files from actual project edits. Useful comparison patterns are visible rationale and actual-change checks; neither vote counts nor a generated final answer independently establishes correctness. Do not adopt automatic cloud fallback or treat queue shelving as a sandbox.

**Verification limit:** source inspection only; no upstream tests or provider calls were executed. This scoped review does not certify every file in the repository.

<!-- teamagent-analysis:start -->
Analysis metadata: source [hydra](https://github.com/timtimeshock/Hydra); analyzed commit `1a5158e7e96d82183269b7b613f41d77b8398193`; commit date 2026-10-09T18:26:47+02:00; review date 2026-10-28T08:26:04.502Z; depth screened. [Maintenance record](../analyses/repos/ai-agents--hydra.md).
<!-- teamagent-analysis:end -->
