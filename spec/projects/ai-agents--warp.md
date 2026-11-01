# warp

Source: [warp](https://github.com/warpdotdev/warp) · Category: [ai-agents](../categories/ai-agents.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `6398d1e96d56e6e81c561cc3ebfc612c783f7dae`; commit timestamp `2026-10-03T04:42:12Z`; 6,327 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/warpdotdev/warp/blob/6398d1e96d56e6e81c561cc3ebfc612c783f7dae/README.md)):

> OpenAI is the founding sponsor of the new, open-source Warp repository, and the new agentic management workflows are powered by GPT models. Warp is an agentic development environment, born out of the terminal. Use Warp's built-in coding agent, or bring your own CLI agent (Claude Code, Codex, Gemini CLI, and others).

Build/package evidence: [Cargo.toml](https://github.com/warpdotdev/warp/blob/6398d1e96d56e6e81c561cc3ebfc612c783f7dae/Cargo.toml); [app/Cargo.toml](https://github.com/warpdotdev/warp/blob/6398d1e96d56e6e81c561cc3ebfc612c783f7dae/app/Cargo.toml); [crates/ai/Cargo.toml](https://github.com/warpdotdev/warp/blob/6398d1e96d56e6e81c561cc3ebfc612c783f7dae/crates/ai/Cargo.toml); [crates/ai_types/Cargo.toml](https://github.com/warpdotdev/warp/blob/6398d1e96d56e6e81c561cc3ebfc612c783f7dae/crates/ai_types/Cargo.toml); [crates/app-installation-detection/Cargo.toml](https://github.com/warpdotdev/warp/blob/6398d1e96d56e6e81c561cc3ebfc612c783f7dae/crates/app-installation-detection/Cargo.toml)

License evidence: [LICENSE-AGPL](https://github.com/warpdotdev/warp/blob/6398d1e96d56e6e81c561cc3ebfc612c783f7dae/LICENSE-AGPL); [LICENSE-MIT](https://github.com/warpdotdev/warp/blob/6398d1e96d56e6e81c561cc3ebfc612c783f7dae/LICENSE-MIT) Classification hint: AGPL; inspect version. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents**. Its category places it in the candidate set for agents, models, channels; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [models](../models.md) · [channels](../channels.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

## 2026-10-28 scoped source review

Source: [warp](https://github.com/warpdotdev/warp); inspected saved discovery revision `65229eb524f978cd006c54424fad3a98a35c39c7`. Prior analyzed revision `6398d1e96d56e6e81c561cc3ebfc612c783f7dae` remains historical evidence.

**Scope:** Complete MCP OAuth adapter and its 424-line test file. Loopback implementation, rmcp internals, secure-storage backend, application cleanup and live OAuth were not reviewed or run.

The [credential-store wrapper](https://github.com/warpdotdev/warp/blob/65229eb524f978cd006c54424fad3a98a35c39c7/crates/mcp/src/oauth.rs#L113-L231) carries forward the previous refresh token when a refresh response omits it, while preserving the new received-at timestamp. It updates the in-memory store then queues persistence to a detached consumer. That queue is unbounded, `try_send` errors are ignored, and callback failures are logged; successful `save` is therefore not an acknowledgement of durable secure-storage persistence. `clear` clears the inner store only in this wrapper. Durable deletion or logout may be handled elsewhere and was not established here.

The [authentication flow](https://github.com/warpdotdev/warp/blob/65229eb524f978cd006c54424fad3a98a35c39c7/crates/mcp/src/oauth.rs#L267-L445) refuses interactive OAuth in headless mode, requires a separately registered loopback-capable static client, and sends callback code/state/issuer to rmcp validation. Custom-scheme receive has no local timeout; discovery, CSRF validation and loopback details are delegated. Secure-storage [loading](https://github.com/warpdotdev/warp/blob/65229eb524f978cd006c54424fad3a98a35c39c7/crates/mcp/src/oauth.rs#L448-L487) falls back to a default value on read/decode failure, while write failure is reported rather than returned to its caller.

The [tests](https://github.com/warpdotdev/warp/blob/65229eb524f978cd006c54424fad3a98a35c39c7/crates/mcp/src/oauth_tests.rs#L52-L268) define a local fake OAuth server and matching/mismatched loopback-state cases; [credential tests](https://github.com/warpdotdev/warp/blob/65229eb524f978cd006c54424fad3a98a35c39c7/crates/mcp/src/oauth_tests.rs#L287-L424) inspect channel payloads, legacy timestamp compatibility and refresh-token carry-forward. They do not establish crash-safe storage, failed-write recovery or platform keychain behavior, and were not executed. Teamagent should retain token-rotation semantics with bounded, awaited persistence and explicit deletion receipts.

## 2026-10-28 follow-up source review

Reviewed the frozen update from `65229eb524f978cd006c54424fad3a98a35c39c7` to `eafc6d18d18bea8c6cf78dc21a4e0eab59f4c6c6`. Earlier findings above remain historical evidence; this review is limited to the cited source and delta.

In [app/src/ai/blocklist/block/status_bar.rs](https://github.com/warpdotdev/warp/blob/eafc6d18d18bea8c6cf78dc21a4e0eab59f4c6c6/app/src/ai/blocklist/block/status_bar.rs#L151-L178), The status bar now subscribes to history-level streaming and usage events. Matching the active exchange triggers an output update; another exchange in the same conversation triggers a redraw, and usage metadata also invalidates the view. The previous per-exchange callback registration is removed in the delta.

**Harness implication and limits:** Drive channel/UI status from shared, identified events rather than a callback bound only to the currently visible exchange. Keep exchange, conversation and surface identity explicit to avoid stale usage displays. This is presentation invalidation, not evidence that accounting values or task completion are correct. Rendering frequency, subscriptions and native acceptance were not exercised. This static review does not certify other changed subsystems.

## 2026-11-01 scoped source review

Reviewed frozen commit `d57d9760dba0590416eca4c94379ce7653f347b5` against prior analyzed commit `eafc6d18d18bea8c6cf78dc21a4e0eab59f4c6c6`. Historical reviews above remain separate evidence.

The new [preview-retention module](https://github.com/warpdotdev/warp/blob/d57d9760dba0590416eca4c94379ce7653f347b5/app/src/ai/agent_sdk/driver/preview_retention.rs) applies a five-second remote check and sixty-second recheck interval to keep eligible idle preview work alive. Positive execution IDs are validated and a response for a different expected execution is ignored. Query failure/timeout allows idle exit; this is an availability/cost policy, not a security authorization fallback.

The complete [fixtures](https://github.com/warpdotdev/warp/blob/d57d9760dba0590416eca4c94379ce7653f347b5/app/src/ai/agent_sdk/driver/preview_retention_tests.rs) cover feature/platform gating, invalid IDs, stale responses after a follow-up, explicit exit bypassing pending queries, zero/absent idle windows and failure/timeout exit. Several exercise IdleTimeoutSender integration with controlled futures; its production implementation was not inspected here. Teamagent should bind keep-alive decisions to task/attempt identity and let explicit stop override optional retention. Missing expected execution identity is accepted by this helper, so stronger reuse requires the caller to supply a verified identity. Remote-preview presence is not proof of ongoing user engagement or a license for unlimited retention.

**Coverage:** Read the complete new 102-line module and 339-line fixture. IdleTimeoutSender, server filtering, secret/environment changes and real native behavior were not reviewed. Source inspection only; no upstream tests, source programs or live providers were executed. This is a scoped architecture review, not a whole-repository correctness or security certification.

<!-- teamagent-analysis:start -->
Analysis metadata: source [warp](https://github.com/warpdotdev/warp); analyzed commit `d57d9760dba0590416eca4c94379ce7653f347b5`; commit date 2026-10-30T15:27:58-07:00; review date 2026-11-01T11:33:30.893Z; depth screened. [Maintenance record](../analyses/repos/ai-agents--warp.md).
<!-- teamagent-analysis:end -->
