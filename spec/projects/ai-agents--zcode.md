# zcode

Source: [zcode](https://github.com/zai-org/ZCode) · Category: [ai-agents](../categories/ai-agents.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `29628c9acdb81b703bbd4080c207a0e7ce5e276e`; commit timestamp `2026-09-24T14:49:06+08:00`; 7,060 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/zai-org/ZCode/blob/29628c9acdb81b703bbd4080c207a0e7ce5e276e/README.md)):

> ZCode 是 AI 编程工作台，提供桌面应用、浏览器界面和终端 Agent。本仓库包含客户端、后端服务、共享 UI，以及 Agent CLI 与运行时源码。 准备 Git、Node.js **24.14.0** 和 pnpm **10.33.2**，版本以 mise.toml 为准。以下开发和打包命令均在仓库根目录执行。

Build/package evidence: [apps/zcode-cli/package.json](https://github.com/zai-org/ZCode/blob/29628c9acdb81b703bbd4080c207a0e7ce5e276e/apps/zcode-cli/package.json); [apps/zcode-cli/packages/adapters/package.json](https://github.com/zai-org/ZCode/blob/29628c9acdb81b703bbd4080c207a0e7ce5e276e/apps/zcode-cli/packages/adapters/package.json); [apps/zcode-cli/packages/bootstrap/package.json](https://github.com/zai-org/ZCode/blob/29628c9acdb81b703bbd4080c207a0e7ce5e276e/apps/zcode-cli/packages/bootstrap/package.json); [apps/zcode-cli/packages/browser-use-plugin/package.json](https://github.com/zai-org/ZCode/blob/29628c9acdb81b703bbd4080c207a0e7ce5e276e/apps/zcode-cli/packages/browser-use-plugin/package.json); [apps/zcode-cli/packages/cli/package.json](https://github.com/zai-org/ZCode/blob/29628c9acdb81b703bbd4080c207a0e7ce5e276e/apps/zcode-cli/packages/cli/package.json)

License evidence: [LICENSE](https://github.com/zai-org/ZCode/blob/29628c9acdb81b703bbd4080c207a0e7ce5e276e/LICENSE) Classification hint: Apache-2.0. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents**. Its category places it in the candidate set for agents, models, channels; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [models](../models.md) · [channels](../channels.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

## 2026-10-28 scoped source review

Source: [zcode](https://github.com/zai-org/ZCode); inspected saved discovery revision `3c5b227649371507ddc4eb46ac5133afe6db1cab`. Prior analyzed revision `29628c9acdb81b703bbd4080c207a0e7ce5e276e` remains historical evidence.

**Scope:** Full shared OAuth types/lifetime helper, provider schema module and tool-error presentation helper read. OAuth transport, JWT signature checks, native credential storage, UI rendering and tests were not audited.

The [OAuth contract](https://github.com/zai-org/ZCode/blob/3c5b227649371507ddc4eb46ac5133afe6db1cab/packages/shared/src/oauth.ts) distinguishes real sessions, attribution-only callbacks, duplicate callbacks, signed-out state and expired-session reauthentication. Its local JWT helper explicitly parses expiry without verifying signatures and returns unknown for unrecognized payloads. Keep that distinction: its valid label means only the local expiry calculation, never authenticated identity. The helper checks finite positive exp before multiplying by 1,000 but not after, so an extreme finite numeric exp can produce an infinite expiresAt; caller clock/skew values are also not validated here.

The [provider module](https://github.com/zai-org/ZCode/blob/3c5b227649371507ddc4eb46ac5133afe6db1cab/packages/shared/src/providers.ts) derives a runtime enum and type from one declared provider set, reducing duplicated schema drift without establishing transport enforcement. The [tool-error helper](https://github.com/zai-org/ZCode/blob/3c5b227649371507ddc4eb46ac5133afe6db1cab/packages/ui/src/lib/toolError.ts) preserves errors found in nested raw output even when a top-level status says completed. It can also interpret an ordinary output.message as an error independent of status, and the text is not bounded or redacted here. Adapt explicit outcome/error fields, validated transport data and safe presentation; no OAuth, credential access, UI or tests were executed.

<!-- teamagent-analysis:start -->
Analysis metadata: source [zcode](https://github.com/zai-org/ZCode); analyzed commit `3c5b227649371507ddc4eb46ac5133afe6db1cab`; commit date 2026-10-20T14:23:05+08:00; review date 2026-10-28T09:27:32.685Z; depth screened. [Maintenance record](../analyses/repos/ai-agents--zcode.md).
<!-- teamagent-analysis:end -->
