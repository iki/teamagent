# mateclaw

Source: [mateclaw](https://github.com/mateaix/mateclaw) · Category: [ai-agents](../categories/ai-agents.md)

Original review depth: **inventory / README screening only**. The dated update review below has its own explicit scope. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `9f49637ac96bf7dd36dcd859ae519a39783a1502`; commit timestamp `2026-10-03T17:55:16+08:00`; 4,220 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/mateaix/mateclaw/blob/9f49637ac96bf7dd36dcd859ae519a39783a1502/README.md)):

> v2.3.0 (released 2026-09-20) — JSON acceptance and execution evidence for persistent Goals.** Users can configure required JSON fields and bind checks to current requirements and immutable artifact versions. This release also adds controlled worker intervention and skill document/folder uploads, with fixes for DSH history and output budgets, vLLM reasoning, and SSE framing. Read the release notes. Other personal AI agents are built for one person. MateClaw is the one your IT department can actually sign off on.

Build/package evidence: [mateclaw-desktop/package.json](https://github.com/mateaix/mateclaw/blob/9f49637ac96bf7dd36dcd859ae519a39783a1502/mateclaw-desktop/package.json); [mateclaw-plugin-api/pom.xml](https://github.com/mateaix/mateclaw/blob/9f49637ac96bf7dd36dcd859ae519a39783a1502/mateclaw-plugin-api/pom.xml); [mateclaw-plugin-mem0/pom.xml](https://github.com/mateaix/mateclaw/blob/9f49637ac96bf7dd36dcd859ae519a39783a1502/mateclaw-plugin-mem0/pom.xml); [mateclaw-plugin-sample/pom.xml](https://github.com/mateaix/mateclaw/blob/9f49637ac96bf7dd36dcd859ae519a39783a1502/mateclaw-plugin-sample/pom.xml); [mateclaw-plugin-search-sample/pom.xml](https://github.com/mateaix/mateclaw/blob/9f49637ac96bf7dd36dcd859ae519a39783a1502/mateclaw-plugin-search-sample/pom.xml)

License evidence: [LICENSE](https://github.com/mateaix/mateclaw/blob/9f49637ac96bf7dd36dcd859ae519a39783a1502/LICENSE) Classification hint: Apache-2.0. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents**. Its category places it in the candidate set for agents, models, channels; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [models](../models.md) · [channels](../channels.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

## 2026-10-28 scoped update review

Reviewed commit `cf1fd92c6d8a6faf572c378155aeb6fcacc0564b` (commit date `2026-10-27T03:41:20-05:00`). The original snapshot above remains historical evidence.

**Scope:** Complete structured tool-result renderer registry, desktop Vite composition/build script and stop/incomplete/TTS presentation fixture; Vue component implementations, renderer safety helpers, Electron IPC and backend execution were not audited.

The [tool-result registry](https://github.com/mateaix/mateclaw/blob/cf1fd92c6d8a6faf572c378155aeb6fcacc0564b/mateclaw-ui/src/components/chat/tool-results/registry.ts#L7-L61) requires an explicit versioned UI envelope with at most eight blocks and maps payload type names to trusted application components. Unknown or rejected blocks fall back to text, while table/product renderers impose row/item limits. This avoids loading executable UI from payloads, but the 100 KiB check occurs after full serialization, fallback clipping counts string units rather than UTF-8 bytes, and chart/table checks are only shallow envelope validation. The exported URL/chart safety helpers and final rendering components were not inspected, so no complete sanitization guarantee follows from this registry.

The [presentation fixture](https://github.com/mateaix/mateclaw/blob/cf1fd92c6d8a6faf572c378155aeb6fcacc0564b/mateclaw-ui/src/components/chat/__tests__/MessageBubble.stopIndicator.test.ts#L108-L222) specifies distinct user-stopped and interrupted labels, an incomplete-answer card that does not misdiagnose token exhaustion as repetition, and audio cleanup/error handling. It includes a completed message carrying an incomplete finish reason, illustrating why channel presentation needs a richer outcome than one status label. Its mocked network/audio calls and imported component were not executed or independently audited; these are useful acceptance cases rather than proof of actual provider cancellation or resource release.

The [desktop build composition](https://github.com/mateaix/mateclaw/blob/cf1fd92c6d8a6faf572c378155aeb6fcacc0564b/mateclaw-desktop/vite.config.ts#L8-L72) applies branding to renderer, main and preload outputs. The [packaging script](https://github.com/mateaix/mateclaw/blob/cf1fd92c6d8a6faf572c378155aeb6fcacc0564b/mateclaw-desktop/scripts/build.sh#L20-L78) can install missing frontend dependencies, selects available package/build tools and explicitly skips Java tests before copying a JAR into resources. Build success would therefore establish neither reproducible dependency resolution nor native/IPC acceptance. No install, build, backend or desktop application was run during this review.

**Verification limit:** source inspection only; no upstream tests or provider calls were executed. This scoped review does not certify every file in the repository.

## 2026-10-28 follow-up source review

Reviewed the frozen update from `cf1fd92c6d8a6faf572c378155aeb6fcacc0564b` to `ffd35950dbda00b987bf154e43402d1e4b2c629a`. Earlier findings above remain historical evidence; this review is limited to the cited source and delta.

In [mateclaw-server/src/main/java/vip/mate/agent/graph/guard/TaskFinalizationCoordinator.java](https://github.com/mateaix/mateclaw/blob/ffd35950dbda00b987bf154e43402d1e4b2c629a/mateclaw-server/src/main/java/vip/mate/agent/graph/guard/TaskFinalizationCoordinator.java#L116-L154), Finalization now reconstructs retained successful outputs for multiple tool calls instead of considering only the latest successful call. It starts with canonical retained output, then accepts a display/runtime candidate only when its call ID, name, succeeded/substantive receipt, recorded length and 512-character prefix agree. Conflicting distinct candidates for one call are not promoted over canonical data.

**Harness implication and limits:** Task verification should consider the complete relevant effect history rather than only the newest tool response. Preserve canonical output precedence and explicitly reject conflicting evidence. Length plus a prefix is not a content hash and does not authenticate the remaining body; Teamagent should bind full output hashes and completeness flags in receipts. The final model judgment, token-budget packing and ledger writer were not audited. No upstream tests, agent execution or provider requests were run.

<!-- teamagent-analysis:start -->
Analysis metadata: source [mateclaw](https://github.com/mateaix/mateclaw); analyzed commit `ffd35950dbda00b987bf154e43402d1e4b2c629a`; commit date 2026-10-28T05:10:24-04:00; review date 2026-10-28T14:29:27.414Z; depth screened. [Maintenance record](../analyses/repos/ai-agents--mateclaw.md).
<!-- teamagent-analysis:end -->
