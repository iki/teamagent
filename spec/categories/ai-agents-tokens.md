# ai-agents-tokens

[Analysis home](../README.md) · 8 projects catalogued; 2 focused source/content reviews.

Screening entries provide identity and package evidence only. Source-reviewed entries explain the exact scope inspected; none is a runtime certification. See [methodology](../methodology.md).

## Category assessment

Usage-log ingestion, model-cost estimation, transcript accounting, and optimization dashboards.

Prefer structured first-party usage events and retain read-only log adapters as cross-checks. ccusage and CodeBurn offer useful parsing and mixed-agent reporting patterns. Keep actual usage, price-derived estimates, subscription quota, and inferred skill activity distinct so routing does not mistake missing data for free capacity.

Forks, compaction, partial writes, unknown models, and provider schema changes can distort historical accounting. Activity is not productivity, inferred skill use is not direct evidence, and neither reviewed tool is a universal billing authority.

Start with:

- [ccusage](https://github.com/ryoppippi/ccusage) — [individual report](../projects/ai-agents-tokens--ccusage.md).
- [codeburn](https://github.com/getagentseal/codeburn) — [individual report](../projects/ai-agents-tokens--codeburn.md).

## Project catalogue

| Project source | Individual report | Depth | Harness relevance / finding |
|---|---|---|---|
| [cc-aio-mon](https://github.com/iM3SK/cc-aio-mon) | [Report](../projects/ai-agents-tokens--cc-aio-mon.md) | screened | Inventory / README only; implementation not independently established. |
| [ccusage](https://github.com/ryoppippi/ccusage) | [Report](../projects/ai-agents-tokens--ccusage.md) | source-reviewed | Use ccusage as an optional local accounting adapter or cross-check, with read-only access to explicitly selected session logs. Prefer first-party structured usage events where available. Keep monetary estimates, subscription entitlement status, and observed resource use as separate fields. Add golden log fixtures for forks, compaction, model switches, partial writes, and unknown models. Unknown accounting must remain unknown rather than becoming zero in dashboards or routing decisions. |
| [claude-powerline](https://github.com/Owloops/claude-powerline) | [Report](../projects/ai-agents-tokens--claude-powerline.md) | screened | Inventory / README only; implementation not independently established. |
| [codeburn](https://github.com/getagentseal/codeburn) | [Report](../projects/ai-agents-tokens--codeburn.md) | source-reviewed | Evaluate as an optional usage dashboard/importer and a provider-parser reference, especially for mixed installed agents. Keep raw transcript access local by default and export only the necessary normalized fields. Calibrate inferred skill use against explicit events in controlled traces. Use its telemetry to identify candidates for optimization, then verify benefit through matched task evaluation. Do not equate activity counts with productivity or transform imperfect historical log parsing into a hard billing authority. |
| [codexbar-win](https://github.com/nesszer/Win-CodexBar) | [Report](../projects/ai-agents-tokens--codexbar-win.md) | screened | Inventory / README only; implementation not independently established. |
| [tokenu](https://github.com/lirantal/tokenu) | [Report](../projects/ai-agents-tokens--tokenu.md) | screened | Inventory / README only; implementation not independently established. |
| [xx-2604-rimuru](https://github.com/rohitg00/rimuru) | [Report](../projects/ai-agents-tokens--xx-2604-rimuru.md) | screened | Inventory / README only; implementation not independently established. |
| [xx-2604-tokuin](https://github.com/nooscraft/tokuin) | [Report](../projects/ai-agents-tokens--xx-2604-tokuin.md) | screened | Inventory / README only; implementation not independently established. |
