# cezar

Source: [cezar](https://github.com/open-mercato/cezar) · Category: [ai-agents](../categories/ai-agents.md)

Original review depth: **inventory / README screening only**. The dated update review below has its own explicit scope. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `1b13522dd3642a4ea8331629b3680838164d2a2e`; commit timestamp `2026-10-02T13:47:58+02:00`; 1,936 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/open-mercato/cezar/blob/1b13522dd3642a4ea8331629b3680838164d2a2e/README.md)):

> One control center for Claude Code, Codex, OpenCode and other coding agents. - 🖥️&nbsp;Uses your own `claude`, `codex`, `copilot`, `cursor`, `junie`, `opencode` or `pi` login. No API key needed.

Build/package evidence: [alias-cezar-run/package.json](https://github.com/open-mercato/cezar/blob/1b13522dd3642a4ea8331629b3680838164d2a2e/alias-cezar-run/package.json); [alias-cezar/package.json](https://github.com/open-mercato/cezar/blob/1b13522dd3642a4ea8331629b3680838164d2a2e/alias-cezar/package.json); [package.json](https://github.com/open-mercato/cezar/blob/1b13522dd3642a4ea8331629b3680838164d2a2e/package.json); [packages/api-client/package.json](https://github.com/open-mercato/cezar/blob/1b13522dd3642a4ea8331629b3680838164d2a2e/packages/api-client/package.json); [packages/cezar/package.json](https://github.com/open-mercato/cezar/blob/1b13522dd3642a4ea8331629b3680838164d2a2e/packages/cezar/package.json)

License evidence: [LICENSE](https://github.com/open-mercato/cezar/blob/1b13522dd3642a4ea8331629b3680838164d2a2e/LICENSE) Classification hint: MIT. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents**. Its category places it in the candidate set for agents, models, channels; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [models](../models.md) · [channels](../channels.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

## 2026-10-28 scoped update review

Reviewed commit `a5e5bc74b9c55dc6817d164ddf3d0055c7cc220e` (commit date `2026-10-27T11:46:04+01:00`). The original snapshot above remains historical evidence.

**Scope:** Complete child-environment builder plus selected temporary-directory/account/cloud-credential fixtures and fixture-name inventory; backend spawning, profile authorization, secret-redaction implementation and web acceptance tests were not inspected.

The [child environment builder](https://github.com/open-mercato/cezar/blob/a5e5bc74b9c55dc6817d164ddf3d0055c7cc220e/packages/cezar/src/core/agent-env.ts#L324-L403) removes all host spellings of names overridden by per-run settings before applying those settings. This matters on Windows: leaving Temp beside TEMP can retain the host directory or account path. The behavior is also retained under full-inheritance mode and is covered by [focused fixture cases](https://github.com/open-mercato/cezar/blob/a5e5bc74b9c55dc6817d164ddf3d0055c7cc220e/packages/cezar/src/core/agent-env.test.ts#L82-L124). Cloud credential families are unlocked by explicit Claude backend identity plus a toggle, rather than merely finding a CLAUDE_ prefix in a future allowlist; the selected fixtures exercise that distinction.

This is environment minimization, not full capability confinement. The [base allowlist](https://github.com/open-mercato/cezar/blob/a5e5bc74b9c55dc6817d164ddf3d0055c7cc220e/packages/cezar/src/core/agent-env.ts#L34-L199) forwards home/config locations, SSH-agent socket references, proxy settings and execution-affecting toolchain variables. Such values may confer access or embed sensitive configuration even when their names are not credential-shaped. GitHub credentials are intentionally passed to every backend; multi-provider backends receive multiple provider families. Per-run extraEnv bypasses the filter entirely, an unknown runtime backend falls back to Claude prefixes, and the exported backend map is mutable.

Teamagent can reuse the case-insensitive replacement rule while binding the selected backend/account and permitted destinations to immutable host-owned policy. Explicit full inheritance and named passthrough should remain visible authority changes, and per-run overrides must be validated before this adapter receives them. The comments promise log redaction through another module; that module, effective filesystem/process isolation and real Windows/backend execution were outside this review.

**Verification limit:** source inspection only; no upstream tests or provider calls were executed. This scoped review does not certify every file in the repository.

<!-- teamagent-analysis:start -->
Analysis metadata: source [cezar](https://github.com/open-mercato/cezar); analyzed commit `a5e5bc74b9c55dc6817d164ddf3d0055c7cc220e`; commit date 2026-10-27T11:46:04+01:00; review date 2026-10-28T09:27:32.685Z; depth screened. [Maintenance record](../analyses/repos/ai-agents--cezar.md).
<!-- teamagent-analysis:end -->
