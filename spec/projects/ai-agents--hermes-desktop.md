# hermes-desktop

Source: [hermes-desktop](https://github.com/fathah/hermes-desktop) · Category: [ai-agents](../categories/ai-agents.md)

Original review depth: **inventory / README screening only**. The dated update review below has its own explicit scope. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `2ed89070bc6c9e8231a37bb55df8a7722a3776b8`; commit timestamp `2026-09-24T18:32:34+04:00`; 1,064 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/fathah/hermes-desktop/blob/2ed89070bc6c9e8231a37bb55df8a7722a3776b8/README.md)):

> This project is in active development.** Features may change, and some things might break. If you run into a problem or have an idea, open an issue. Contributions are welcome! Hermes One is a community maintained native desktop app for installing, configuring, and chatting with Hermes Agent — a self-improving AI assistant with tool use, multi-platform messaging, and a closed learning loop.

Build/package evidence: [package.json](https://github.com/fathah/hermes-desktop/blob/2ed89070bc6c9e8231a37bb55df8a7722a3776b8/package.json)

License evidence: [LICENSE](https://github.com/fathah/hermes-desktop/blob/2ed89070bc6c9e8231a37bb55df8a7722a3776b8/LICENSE) Classification hint: MIT. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents**. Its category places it in the candidate set for agents, models, channels; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [models](../models.md) · [channels](../channels.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

## 2026-10-28 scoped update review

Reviewed commit `171024862c849475634d217a5635fedff796360c` (commit date `2026-10-13T20:23:54+05:30`). The original snapshot above remains historical evidence.

**Scope:** Complete remote OAuth helper and selected source-identity/read/write/sync branches of the session cache; Electron IPC admission, database identity/safe-write helpers, remote server and tests were not reviewed.

The [remote OAuth helper](https://github.com/fathah/hermes-desktop/blob/171024862c849475634d217a5635fedff796360c/src/main/remote-oauth.ts#L51-L118) rechecks the normalized selected connection before committing a login-mode change and keeps browser cookies in a dedicated persistent partition. Its signed-in result is based on matching cookie names, not server validation of the session. Discovery treats an explicit auth_required true as OAuth and other parsed shapes as token mode, and a protected health endpoint as token-gateway evidence. Those are routing/readiness hints, not verified account access. HTTP is allowed without a loopback restriction in this helper, and several constructed endpoints use the origin root even when the configured URL has a path prefix.

The [JSON transport](https://github.com/fathah/hermes-desktop/blob/171024862c849475634d217a5635fedff796360c/src/main/remote-oauth.ts#L230-L358) has an eight-second default timer spanning body consumption and one-shot settlement, but collects response chunks without a byte cap and follows redirects. Error strings can include the supplied URL and a body excerpt. The [login window](https://github.com/fathah/hermes-desktop/blob/171024862c849475634d217a5635fedff796360c/src/main/remote-oauth.ts#L378-L480) uses isolated/sandboxed Electron preferences, yet polls cookie presence without an overall login deadline; the shared-cookie fetch wrapper does not bind its arbitrary URL argument to the selected connection. Teamagent needs trusted destination checks, validated response variants and redacted errors in addition to browser cookie scoping. This does not establish a server authentication bypass.

The [session cache](https://github.com/fathah/hermes-desktop/blob/171024862c849475634d217a5635fedff796360c/src/main/session-cache.ts#L162-L212) rejects unstamped or differently sourced cache rows and rechecks profile/database-file identity before saving. [Synchronization](https://github.com/fathah/hermes-desktop/blob/171024862c849475634d217a5635fedff796360c/src/main/session-cache.ts#L238-L340) preserves a provenance-checked cache when opening the same database temporarily fails, while a missing/replaced database invalidates it; removing invisible rows from the cache does not delete stored conversations. This is useful provenance-aware fallback. File identity does not establish content freshness, JSON rows are only partially checked, complete history is loaded at once, and save failures are swallowed. No Electron, OAuth, database or filesystem acceptance test was run.

**Verification limit:** source inspection only; no upstream tests or provider calls were executed. This scoped review does not certify every file in the repository.

<!-- teamagent-analysis:start -->
Analysis metadata: source [hermes-desktop](https://github.com/fathah/hermes-desktop); analyzed commit `171024862c849475634d217a5635fedff796360c`; commit date 2026-10-13T20:23:54+05:30; review date 2026-10-28T09:27:32.685Z; depth screened. [Maintenance record](../analyses/repos/ai-agents--hermes-desktop.md).
<!-- teamagent-analysis:end -->
