# kanban-code

Source: [kanban-code](https://github.com/langwatch/kanban-code) · Category: [ai-query](../categories/ai-query.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `41041f807791cb5402485fb49a7a2bfbdfb83aee`; commit timestamp `2026-10-03T22:56:41+02:00`; 1,331 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/langwatch/kanban-code/blob/41041f807791cb5402485fb49a7a2bfbdfb83aee/README.md)):

> Native on macOS (SwiftUI liquid glass) and Windows (Tauri). The IDE for 2026. A native macOS app for running multiple Claude Code agents in parallel. Each task is a card on a Kanban board that automatically links your Claude session, git worktree, tmux terminals, and GitHub PR together — cards flow from backlog to done as Claude works, opens PRs, and gets them merged. Push notifications on your phone when agents need attention, remote execution to offload work to a server, and sleep prevention to keep your Mac awake while agents run.

Build/package evidence: [cli/package.json](https://github.com/langwatch/kanban-code/blob/41041f807791cb5402485fb49a7a2bfbdfb83aee/cli/package.json); [plugins/rush/kanban-vault/go.mod](https://github.com/langwatch/kanban-code/blob/41041f807791cb5402485fb49a7a2bfbdfb83aee/plugins/rush/kanban-vault/go.mod); [web/package.json](https://github.com/langwatch/kanban-code/blob/41041f807791cb5402485fb49a7a2bfbdfb83aee/web/package.json); [windows/package.json](https://github.com/langwatch/kanban-code/blob/41041f807791cb5402485fb49a7a2bfbdfb83aee/windows/package.json); [windows/src-tauri/Cargo.toml](https://github.com/langwatch/kanban-code/blob/41041f807791cb5402485fb49a7a2bfbdfb83aee/windows/src-tauri/Cargo.toml)

License evidence: [LICENSE](https://github.com/langwatch/kanban-code/blob/41041f807791cb5402485fb49a7a2bfbdfb83aee/LICENSE) Classification hint: Apache-2.0. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-query**. Its category places it in the candidate set for memory, import-generation, decisions; those associations are navigational and have not been individually validated as implemented capabilities. See [memory](../memory.md) · [import-generation](../import-generation.md) · [decisions](../decisions.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.


## Change review - 2026-10-28

**Distributed search exposes coverage in the UI but drops it from JSON CLI output.** Reviewed commit `1bfc15db18c3b899cf5e6cb67391318297775431` (commit date `2026-10-26T14:25:59Z`). Compared with `41041f807791cb5402485fb49a7a2bfbdfb83aee`; the complete Git comparison contains 224 changed paths.

The iOS search model debounces for 300 ms, cancels its previous task and rejects completed results when the query changed or cancellation arrived. It keeps truncation and unreachable-master lists beside cards and tries capable masters sequentially with a ten-second timeout per attempt. That gives explicit partial-search state and stale-result suppression, but the total fallback duration grows with the number of masters and cancellation enforcement still depends on the called transport.

The CLI search command receives the same coverage fields, but --json returns only the filtered cards before printing either truncation or unreachable warnings. An empty machine-readable array can therefore mean a complete empty result or an incomplete distributed search. Its generic HTTP helper parses JSON and casts it to the requested type without schema validation or a response-byte cap. The Swift fixtures describe owner-preferred merging, limits, scope/auth behavior and peer timeout reporting; those fixtures were read as intended behavior, not as execution evidence or a complete implementation audit.

Evidence: [Apps/iOS/KanbanCodeMobile/Model/CardSearchModel.swift:1-85](https://github.com/langwatch/kanban-code/blob/1bfc15db18c3b899cf5e6cb67391318297775431/Apps/iOS/KanbanCodeMobile/Model/CardSearchModel.swift#L1-L85) · [cli/src/remote-client.ts:285-397](https://github.com/langwatch/kanban-code/blob/1bfc15db18c3b899cf5e6cb67391318297775431/cli/src/remote-client.ts#L285-L397) · [cli/src/remote-client.ts:500-506](https://github.com/langwatch/kanban-code/blob/1bfc15db18c3b899cf5e6cb67391318297775431/cli/src/remote-client.ts#L500-L506) · [cli/src/remote-client.ts:790-818](https://github.com/langwatch/kanban-code/blob/1bfc15db18c3b899cf5e6cb67391318297775431/cli/src/remote-client.ts#L790-L818) · [Tests/KanbanCodeRemoteKitTests/CardSearchTests.swift:1-85](https://github.com/langwatch/kanban-code/blob/1bfc15db18c3b899cf5e6cb67391318297775431/Tests/KanbanCodeRemoteKitTests/CardSearchTests.swift#L1-L85) · [Tests/KanbanCodeCoreTests/RemoteCardSearchTests.swift:105-182](https://github.com/langwatch/kanban-code/blob/1bfc15db18c3b899cf5e6cb67391318297775431/Tests/KanbanCodeCoreTests/RemoteCardSearchTests.swift#L105-L182).

**Harness consequence:** Preserve cards, revision/owner identity, truncation and unreachable sources in every result format. Use one aggregate search deadline with bounded fan-out and schema-checked transport responses. Keep query text outside public URLs in the harness's sensitive-state design; independent server authorization and cooperative cancellation need adapter tests rather than assumptions from a client timeout.

**Scope and limits:** Scoped static review of mobile search state, CLI search/HTTP boundaries and selected distributed-search fixtures in the 224-path comparison. Server fan-out implementation, complete authentication middleware and packaged iOS/Windows behavior were not audited or executed.

## Follow-up change review — 2026-10-28

**Peer transcript mirroring uses bounded incremental reads but offset alone is not provenance.** Reviewed commit `ff9c751124216bea3e38844e273b272faa4fede2` (commit date `2026-10-27T22:34:49+01:00`), compared with `1bfc15db18c3b899cf5e6cb67391318297775431`. The complete no-rename Git path inventory contains 65 changed paths.

The mirror prioritizes selected/live cards and prevents duplicate in-flight reads. Each copy performs at most 32 slices, restarting once when the remote transcript shrinks. It appends bytes and advances the local offset; append failures are swallowed, and shrink detection does not identify a same-size rewrite. The reviewed code therefore supplies a useful synchronization pattern, not a verified durable transcript-replication contract.

Evidence: [Sources/KanbanCodeCore/UseCases/Master/PeerTranscriptMirror.swift:38-65](https://github.com/langwatch/kanban-code/blob/ff9c751124216bea3e38844e273b272faa4fede2/Sources/KanbanCodeCore/UseCases/Master/PeerTranscriptMirror.swift#L38-L65) · [Sources/KanbanCodeCore/UseCases/Master/PeerTranscriptMirror.swift:81-115](https://github.com/langwatch/kanban-code/blob/ff9c751124216bea3e38844e273b272faa4fede2/Sources/KanbanCodeCore/UseCases/Master/PeerTranscriptMirror.swift#L81-L115).

**Harness consequence:** Bind transcript cursors to source generation/hash, advance only after confirmed durable writes, and preserve partial state with explicit failures. LF normalization changes byte offsets and must invalidate or migrate the cursor with original-byte provenance.

**Scope and limits:** Reviewed the complete mirror implementation; peer transport validation, path trust and distributed consistency were not certified. This is a scoped static comparison, not a whole-project correctness or security audit. Upstream tests were read where cited, not run; no upstream code, service, model or provider operation was executed. Historical findings above remain evidence at their own revisions.

<!-- teamagent-analysis:start -->
Analysis metadata: source [kanban-code](https://github.com/langwatch/kanban-code); analyzed commit `ff9c751124216bea3e38844e273b272faa4fede2`; commit date 2026-10-27T22:34:49+01:00; review date 2026-10-28T14:52:35.205Z; depth screened. [Maintenance record](../analyses/repos/ai-query--kanban-code.md).
<!-- teamagent-analysis:end -->
