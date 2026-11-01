# cindy

Source: [cindy](https://github.com/makecindy/cindy) · [agents](../../agents.md), [models](../../models.md), [channels](../../channels.md).

Cindy is a desktop agent workspace whose README advertises multiple harnesses, remote devices and shared model access. This initial review examines implemented Telegram policy composition and native file-permission diagnostics, rather than accepting the full product capability list as tested behavior.

Historical discovery: 2026-11-01T10:08:32.081Z. This initial source review supersedes the discovery-only assessment; managed metadata is preserved for explicit promotion.

## 2026-11-01 scoped source review

Reviewed commit `cf8bc1e3e8f80e157ea12dc5daa1b921ccb10969` (commit date `2026-11-01T14:55:47+09:00`), initial scoped review, with no prior analyzed commit. Ledger promotion remains a separate maintenance action.

**Scope:** README product/connection sections, complete Telegram policy wrapper and its fixtures, and file-permission implementation lines 1–180. Initial tree review only; shared tool classifier, channel sender authentication, remote transport and packaged desktop behavior not audited.

The [Telegram wrapper](https://github.com/makecindy/cindy/blob/cf8bc1e3e8f80e157ea12dc5daa1b921ccb10969/apps/desktop/src/main/im/telegram/permissionPolicy.ts) carries owner/guest/unknown authority separately from message content, attaches channel origin and a 30-minute confirmation timeout, and delegates tool classification. [Fixtures](https://github.com/makecindy/cindy/blob/cf8bc1e3e8f80e157ea12dc5daa1b921ccb10969/apps/desktop/src/main/im/telegram/__tests__/permissionPolicy.test.ts) distinguish destructive/wrapped actions and opaque permission changes from ordinary reads/writes. The [native permission helper](https://github.com/makecindy/cindy/blob/cf8bc1e3e8f80e157ea12dc5daa1b921ccb10969/apps/desktop/src/main/file-access/permissions.ts) treats text resembling a macOS permission error as a hint, then probes actual access; unknown filesystem errors remain unknown. That probe can trigger an OS prompt and is not passive discovery. The [README](https://github.com/makecindy/cindy/blob/cf8bc1e3e8f80e157ea12dc5daa1b921ccb10969/README.md) explicitly distinguishes harness-context handoff from identical internal state and discloses cloud-companion/provider processing.

**Teamagent implication (inference):** Carry authenticated channel identity and quoted/group-content provenance separately through every tool hop. Keep shared-session presentation separate from harness-specific execution state, and distinguish passive status from permission-triggering diagnostics. Remote provider reuse needs its own account/data/cost authorization; a unified UI cannot erase those boundaries.

**Verification limit:** committed-source inspection only; no upstream code, tests or provider calls were executed. Review scope is the cited implementation or authored guidance, not whole-project correctness, licensing clearance or measured performance. Source passages were redacted for review; exact URL literals were not byte-validated.

<!-- teamagent-analysis:start -->
Analysis metadata: source [cindy](https://github.com/makecindy/cindy); analyzed commit `cf8bc1e3e8f80e157ea12dc5daa1b921ccb10969`; commit date 2026-11-01T14:55:47+09:00; review date 2026-11-01T11:33:30.893Z; depth reviewed. [Maintenance record](../repos/ai-agents--cindy.md).
<!-- teamagent-analysis:end -->
