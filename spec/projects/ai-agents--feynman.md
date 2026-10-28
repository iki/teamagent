# feynman

Source: [feynman](https://github.com/getcompanion-ai/feynman) · Category: [ai-agents](../categories/ai-agents.md)

Original review depth: **inventory / README screening only**. The dated update review below has its own explicit scope. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `39f3ece194f1e5085f1019302dddb3e78910fe1a`; commit timestamp `2026-10-03T01:26:44-04:00`; 266 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/getcompanion-ai/feynman/blob/39f3ece194f1e5085f1019302dddb3e78910fe1a/README.md)):

> Or with npm and Node.js 22.22 or newer: `npm install -g @companion-ai/feynman`. The installation guide covers pinned versions, uninstalling, and the skills-only bundle for Codex and OpenCode. The setup guide covers local models and editors such as Zed.

Build/package evidence: [package.json](https://github.com/getcompanion-ai/feynman/blob/39f3ece194f1e5085f1019302dddb3e78910fe1a/package.json); [website/package.json](https://github.com/getcompanion-ai/feynman/blob/39f3ece194f1e5085f1019302dddb3e78910fe1a/website/package.json)

License evidence: [LICENSE](https://github.com/getcompanion-ai/feynman/blob/39f3ece194f1e5085f1019302dddb3e78910fe1a/LICENSE) Classification hint: MIT. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents**. Its category places it in the candidate set for agents, models, channels; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [models](../models.md) · [channels](../channels.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

## 2026-10-28 scoped update review

Reviewed commit `87a45677eeba3f63954e1783df4223423fd761cf` (commit date `2026-10-26T06:59:35-07:00`). The original snapshot above remains historical evidence.

**Scope:** Focused review of the complete Pi runtime adapter and research telemetry extension, with selected runtime argument, package-discovery, Windows Bash and telemetry opt-out fixtures. Other paths in the 70-file interval, the CLI's separate telemetry implementation and actual package/provider behavior remain outside scope.

[Pi argument construction](https://github.com/getcompanion-ai/feynman/blob/87a45677eeba3f63954e1783df4223423fd761cf/src/pi/runtime.ts#L125-L149) puts prompts after an option delimiter and keeps model/session choices explicit. Passive package-path checks and [Windows Bash discovery](https://github.com/getcompanion-ai/feynman/blob/87a45677eeba3f63954e1783df4223423fd761cf/src/pi/runtime.ts#L152-L175) identify common install locations without installing them. [Fixtures](https://github.com/getcompanion-ai/feynman/blob/87a45677eeba3f63954e1783df4223423fd761cf/tests/pi-runtime.test.ts#L270-L309) cover per-user Git paths and propagating a telemetry opt-out when the Pi variable is unset. The child environment still inherits process.env, so this adapter is not a credential-minimizing worker boundary.

The research telemetry extension centralizes a shared client and primary-session owner and applies short send/flush budgets. However, its [error formatter](https://github.com/getcompanion-ai/feynman/blob/87a45677eeba3f63954e1783df4223423fd761cf/extensions/research-tools/telemetry.ts#L83-L95) only replaces the home directory and truncates strings. [Tool errors](https://github.com/getcompanion-ai/feynman/blob/87a45677eeba3f63954e1783df4223423fd761cf/extensions/research-tools/telemetry.ts#L221-L227) and [provider errors](https://github.com/getcompanion-ai/feynman/blob/87a45677eeba3f63954e1783df4223423fd761cf/extensions/research-tools/telemetry.ts#L241-L262) can therefore export private payloads or secret values embedded in error text. Omitting ordinary prompt/response fields does not make this metadata-only in the confidentiality sense.

[Output-written detection](https://github.com/getcompanion-ai/feynman/blob/87a45677eeba3f63954e1783df4223423fd761cf/extensions/research-tools/telemetry.ts#L107-L128) is an mtime heuristic; the 5,000-entry cap occurs after recursive enumeration. Neither an mtime hit nor an unrecognized stop reason mapped to completed independently verifies a deliverable. **Disposition:** useful Pi composition reference with explicit privacy and resource-bound changes required before adoption; keep operational status separate from acceptance evidence.

**Verification limit:** source inspection only; no upstream tests or provider calls were executed. This scoped review does not certify every file in the repository.

<!-- teamagent-analysis:start -->
Analysis metadata: source [feynman](https://github.com/getcompanion-ai/feynman); analyzed commit `87a45677eeba3f63954e1783df4223423fd761cf`; commit date 2026-10-26T06:59:35-07:00; review date 2026-10-28T08:26:04.502Z; depth screened. [Maintenance record](../analyses/repos/ai-agents--feynman.md).
<!-- teamagent-analysis:end -->
