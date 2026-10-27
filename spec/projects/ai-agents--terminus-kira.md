# terminus-kira

Source: [terminus-kira](https://github.com/krafton-ai/kira) · Category: [ai-agents](../categories/ai-agents.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `652dacbf14d29ea93a83c496ee91e0e5ba286721`; commit timestamp `2026-05-29T16:42:01+09:00`; 664 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/krafton-ai/kira/blob/652dacbf14d29ea93a83c496ee91e0e5ba286721/README.md)):

> A smarter agent harness for  Terminal-Bench , built on  Terminus 2 Terminus-KIRA is an agent harness for Terminal-Bench, built on top of Terminus 2. It boosts frontier model performance on Terminal-Bench through a set of minimal but effective harness-level improvements — native tool calling, multimodal support, execution optimization, and smarter completion verification.

Build/package evidence: [KIRA-Slack/electron-app/package.json](https://github.com/krafton-ai/kira/blob/652dacbf14d29ea93a83c496ee91e0e5ba286721/KIRA-Slack/electron-app/package.json); [KIRA-Slack/package.json](https://github.com/krafton-ai/kira/blob/652dacbf14d29ea93a83c496ee91e0e5ba286721/KIRA-Slack/package.json); [KIRA-Slack/pyproject.toml](https://github.com/krafton-ai/kira/blob/652dacbf14d29ea93a83c496ee91e0e5ba286721/KIRA-Slack/pyproject.toml); [KIRA-Slack/vitepress-app/package.json](https://github.com/krafton-ai/kira/blob/652dacbf14d29ea93a83c496ee91e0e5ba286721/KIRA-Slack/vitepress-app/package.json); [KiraClaw/apps/desktop/package.json](https://github.com/krafton-ai/kira/blob/652dacbf14d29ea93a83c496ee91e0e5ba286721/KiraClaw/apps/desktop/package.json)

License evidence: [LICENSE](https://github.com/krafton-ai/kira/blob/652dacbf14d29ea93a83c496ee91e0e5ba286721/LICENSE) Classification hint: Apache-2.0. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents**. Its category places it in the candidate set for agents, models, channels; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [models](../models.md) · [channels](../channels.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

<!-- teamagent-analysis:start -->
Analysis metadata: source [terminus-kira](https://github.com/krafton-ai/kira); analyzed commit `652dacbf14d29ea93a83c496ee91e0e5ba286721`; commit date 2026-05-29T16:42:01+09:00; review date unknown; depth screened. [Maintenance record](../analyses/repos/ai-agents--terminus-kira.md).
<!-- teamagent-analysis:end -->
