# pi-desktop

Source: [pi-desktop](https://github.com/vastsa/PI-Desktop) · Category: [ai-agents](../categories/ai-agents.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `c79b6ca564ab46355b99a2818d364574433ab1c4`; commit timestamp `2026-10-04T02:32:05+09:00`; 3,130 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/vastsa/PI-Desktop/blob/c79b6ca564ab46355b99a2818d364574433ab1c4/README.md)):

> Bring projects, agents, models, plugins, and workflows into one persistent desktop environment. Local-first · Model-agnostic · Plugin-powered · macOS / Windows / Linux

Build/package evidence: [Cargo.toml](https://github.com/vastsa/PI-Desktop/blob/c79b6ca564ab46355b99a2818d364574433ab1c4/Cargo.toml); [apps/desktop/package.json](https://github.com/vastsa/PI-Desktop/blob/c79b6ca564ab46355b99a2818d364574433ab1c4/apps/desktop/package.json); [apps/desktop/resources/plugins/pi.file-manager/package.json](https://github.com/vastsa/PI-Desktop/blob/c79b6ca564ab46355b99a2818d364574433ab1c4/apps/desktop/resources/plugins/pi.file-manager/package.json); [apps/pi-host/package.json](https://github.com/vastsa/PI-Desktop/blob/c79b6ca564ab46355b99a2818d364574433ab1c4/apps/pi-host/package.json); [crates/host-core/Cargo.toml](https://github.com/vastsa/PI-Desktop/blob/c79b6ca564ab46355b99a2818d364574433ab1c4/crates/host-core/Cargo.toml)

License evidence: [LICENSE](https://github.com/vastsa/PI-Desktop/blob/c79b6ca564ab46355b99a2818d364574433ab1c4/LICENSE) Classification hint: GPL; inspect version. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents**. Its category places it in the candidate set for agents, models, channels; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [models](../models.md) · [channels](../channels.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

## 2026-10-28 scoped source review

Source: [pi-desktop](https://github.com/vastsa/PI-Desktop); inspected saved discovery revision `467bc51784d4fec001bfa856d0c8387e8c40012e`. Prior analyzed revision `c79b6ca564ab46355b99a2818d364574433ab1c4` remains historical evidence.

**Scope:** Complete AskToolRichText renderer, two ask-tool test files and two public export facades. Review is pinned to the recorded SHA; checkout had advanced to c014b32060ca2dc7ace4c83f181685a6e0140c78 during export, whose delta is outside this review. Bridge/IPC production implementation and exported domain modules were not read.

The [ask-tool rich-text renderer](https://github.com/vastsa/PI-Desktop/blob/467bc51784d4fec001bfa856d0c8387e8c40012e/apps/desktop/src/components/AskToolRichText.ts#L51-L96) skips raw HTML, replaces links with inert spans, renders image alt text rather than image elements, and makes list/task markers suitable for content embedded in a button. This reduces nested interactive content and remote-resource side effects in that renderer. It does not enforce input size or prove the surrounding card's accessibility, answer validation or renderer-library behavior.

The [shared tests](https://github.com/vastsa/PI-Desktop/blob/467bc51784d4fec001bfa856d0c8387e8c40012e/packages/shared/src/asktool.test.ts#L9-L40) specify stable answer separators, skipped-answer placeholders and a Unicode question boundary. The [bridge regression test](https://github.com/vastsa/PI-Desktop/blob/467bc51784d4fec001bfa856d0c8387e8c40012e/apps/desktop/test/asktool-resolve-clears-host-input.test.mjs#L104-L207) goes beyond a mocked invoke by registering the real IPC handler and wiring it back into the bridge, then expects one fake-sidecar resolve and no pending card. This is useful re-entrancy coverage; the sender assertion, operation acquisition, persistence and sidecar are stubs, so it does not establish native authority, durable settlement or concurrent cross-client behavior.

The [host-runtime barrel](https://github.com/vastsa/PI-Desktop/blob/467bc51784d4fec001bfa856d0c8387e8c40012e/packages/host-runtime/src/index.ts#L1-L22) and [shared type facade](https://github.com/vastsa/PI-Desktop/blob/467bc51784d4fec001bfa856d0c8387e8c40012e/packages/shared/src/types.ts#L1-L27) expose module names, not their implementation guarantees. Teamagent should borrow inert rich-text projection and tests that reproduce real callback wiring, while validating request ownership and settlement at the host boundary. No renderer, native app, test, provider or upstream code was executed; the newer checkout revision is deliberately not covered.

## 2026-10-28 follow-up source review

Reviewed the frozen update from `467bc51784d4fec001bfa856d0c8387e8c40012e` to `93620a80635431b62f8d73b64339a96e1de56a04`. Earlier findings above remain historical evidence; this review is limited to the cited source and delta.

In [crates/host-core/src/tools/mod.rs](https://github.com/vastsa/PI-Desktop/blob/93620a80635431b62f8d73b64339a96e1de56a04/crates/host-core/src/tools/mod.rs#L1415-L1459), Image tool output checks byte size and format signatures before base64 publication, and now rejects images whose probed longest edge exceeds the configured pixel limit. The new fixture describes an over-height PNG and an exactly-at-limit case, addressing small files with dimensions unacceptable to later provider replay.

**Harness implication and limits:** Bound decoded dimensions separately from compressed bytes before retaining media in a transcript. Here a failed dimension probe returns None and does not reject, while signature checks do not fully decode the image; the new guard is not full image-integrity validation. The dimension parser and oversized session/runtime files were not audited, and no native or provider replay test was run. This static review does not certify other changed subsystems.

## 2026-11-01 scoped source review

Reviewed frozen commit `d2c85a95a599002672e1592df7bc58fb11f8d79b` against prior analyzed commit `93620a80635431b62f8d73b64339a96e1de56a04`. Historical reviews above remain separate evidence.

The [skill settings page](https://github.com/vastsa/PI-Desktop/blob/d2c85a95a599002672e1592df7bc58fb11f8d79b/apps/desktop/src/components/settings/AgentSkillsPage.tsx) now reads and writes global toggles at global scope, obtains effective project state separately, and keeps its derived override map inside the same accepted collection. The [scope helper](https://github.com/vastsa/PI-Desktop/blob/d2c85a95a599002672e1592df7bc58fb11f8d79b/apps/desktop/src/lib/capability-scope.ts) adds the project path only for project rows and computes visible on/off differences. A reset action explicitly writes through project scope and reloads.

The complete [scope fixtures](https://github.com/vastsa/PI-Desktop/blob/d2c85a95a599002672e1592df7bc58fb11f8d79b/apps/desktop/test/capability-scope.test.mjs) check both query levels and both override directions. The [race fixture](https://github.com/vastsa/PI-Desktop/blob/d2c85a95a599002672e1592df7bc58fb11f8d79b/apps/desktop/test/capability-override-race.test.mjs) uses a minimal React substitute to reject a late project-A collection after project B is accepted. Reuse atomic acceptance of rows plus derived policy state, and show effective overrides instead of silently changing the wrong scope. This UI evidence does not verify host enforcement or that reset durably removes a stored override; the host implementation remains a separate boundary.

**Coverage:** Read the complete 305-line page/helper/scope-test selection and complete 84-line race-test addition. The collection hook itself was unchanged and not reread; native host persistence and packaged desktop behavior were not tested. Source inspection only; no upstream tests, source programs or live providers were executed. This is a scoped architecture review, not a whole-repository correctness or security certification.

## 2026-11-01 external-update review

Reviewed [https://github.com/vastsa/PI-Desktop](https://github.com/vastsa/PI-Desktop) at `0ba8cfd57cdc6baa4c1dbf16a617eb933ad3e0ee` against prior analyzed `d2c85a95a599002672e1592df7bc58fb11f8d79b`. Evidence: [docs/spec/07-plugins/12-plugin-ipc-and-host-services.md](https://github.com/vastsa/PI-Desktop/blob/0ba8cfd57cdc6baa4c1dbf16a617eb933ad3e0ee/docs/spec/07-plugins/12-plugin-ipc-and-host-services.md).

The documentation removes conceptual IPC channels that are not exported, distinguishes renderer invokes, plugin-process calls and panel bridges, and narrows audit/timeout statements to the paths that implement them. Audio registration helpers are documented as local UNSUPPORTED failures without a host audit, while broker-reaching audio calls have different permission/audit behavior. It explicitly records no generic child-to-host timeout and no automatic panel-crash recovery handler.

**Architecture consequence:** Capability documentation must enumerate the actual transport surface and unsupported paths. A declared service, permission name, API skeleton or conceptual responsibility map is not implementation evidence; per-direction timeouts and cleanup need independent verification.

**Scope and limits:** The update contains only two documentation files. The English specification diff was inspected; implementation assertions here remain upstream documentation claims rather than a fresh runtime/source audit.

<!-- teamagent-analysis:start -->
Analysis metadata: source [pi-desktop](https://github.com/vastsa/PI-Desktop); analyzed commit `0ba8cfd57cdc6baa4c1dbf16a617eb933ad3e0ee`; commit date 2026-11-01T19:16:07+08:00; review date 2026-11-01T23:12:06.798Z; depth screened. [Maintenance record](../analyses/repos/ai-agents--pi-desktop.md).
<!-- teamagent-analysis:end -->
