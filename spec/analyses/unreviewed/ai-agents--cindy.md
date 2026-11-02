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

## 2026-11-01 external-update review

Reviewed [https://github.com/makecindy/cindy](https://github.com/makecindy/cindy) at `80a798f575b029076ae6dfd0f488ab09d37dc41a` against prior analyzed `cf8bc1e3e8f80e157ea12dc5daa1b921ccb10969`. Evidence: [apps/desktop/src/main/device-link/fileAccess.ts](https://github.com/makecindy/cindy/blob/80a798f575b029076ae6dfd0f488ab09d37dc41a/apps/desktop/src/main/device-link/fileAccess.ts), [apps/desktop/src/main/device-link/__tests__/fileAccess.test.ts](https://github.com/makecindy/cindy/blob/80a798f575b029076ae6dfd0f488ab09d37dc41a/apps/desktop/src/main/device-link/__tests__/fileAccess.test.ts), [apps/desktop/src/main/maker-host/mcp-tool-approval-policy.ts](https://github.com/makecindy/cindy/blob/80a798f575b029076ae6dfd0f488ab09d37dc41a/apps/desktop/src/main/maker-host/mcp-tool-approval-policy.ts), [apps/desktop/src/main/maker-host/__tests__/mcpToolApprovalPolicy.test.ts](https://github.com/makecindy/cindy/blob/80a798f575b029076ae6dfd0f488ab09d37dc41a/apps/desktop/src/main/maker-host/__tests__/mcpToolApprovalPolicy.test.ts).

Shared-task file reads now retain the task-authorized media route across the 65,536/65,537-byte boundary instead of falling back to owner export or peer transfer. Fixtures cover preparation/upload denial and cancellation without owner fallback. Contact plugin calls receive inner-tool policies: listed read operations and groups/list are auto-approved, while writes, unknown group actions and malformed contact calls require per-call review. PR mutations also get a separate approval path.

**Architecture consequence:** Fallback must preserve the original principal and resource scope across size/capability transitions. Multiplexed tools require authorization on the validated inner operation, not a trusted brand prefix or one earlier discovery grant. Upstream media auto-approval assumptions do not replace Teamagent cost, consent or training-policy gates.

**Scope and limits:** Four targeted implementation/test deltas inspected from a 449-path update; no remote device, contact store, provider or desktop test executed. This extends the prior Telegram and native-permission review without claiming whole-project security.

<!-- teamagent-analysis:start -->
Analysis metadata: source [cindy](https://github.com/makecindy/cindy); analyzed commit `80a798f575b029076ae6dfd0f488ab09d37dc41a`; commit date 2026-11-02T04:36:49+09:00; review date 2026-11-01T23:12:06.798Z; depth reviewed. [Maintenance record](../repos/ai-agents--cindy.md).
<!-- teamagent-analysis:end -->
