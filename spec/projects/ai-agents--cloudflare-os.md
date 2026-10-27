# cloudflare-os

Source: [cloudflare-os](https://github.com/cloudflare/cloudflare-os) · Category: [ai-agents](../categories/ai-agents.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `5cae880e5e54563895a067e7f4dae67514e581be`; commit timestamp `2026-10-02T19:01:46-05:00`; 1,436 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/cloudflare/cloudflare-os/blob/5cae880e5e54563895a067e7f4dae67514e581be/README.md)):

> Cloudflare OS is an "operating system" for AI productivity originally developed for use inside Cloudflare. A large portion of Cloudflare's workforce -- from engineering to sales and everything in between -- uses Cloudflare OS every day to help them do their jobs. This is not a traditional computer operating system. We use the term "operating system" in two senses:

Build/package evidence: [package.json](https://github.com/cloudflare/cloudflare-os/blob/5cae880e5e54563895a067e7f4dae67514e581be/package.json); [packages/bundled-blueprints/package.json](https://github.com/cloudflare/cloudflare-os/blob/5cae880e5e54563895a067e7f4dae67514e581be/packages/bundled-blueprints/package.json); [packages/configurator-ui/package.json](https://github.com/cloudflare/cloudflare-os/blob/5cae880e5e54563895a067e7f4dae67514e581be/packages/configurator-ui/package.json); [packages/error-reporting/package.json](https://github.com/cloudflare/cloudflare-os/blob/5cae880e5e54563895a067e7f4dae67514e581be/packages/error-reporting/package.json); [packages/gatekeeper-cloudflare/package.json](https://github.com/cloudflare/cloudflare-os/blob/5cae880e5e54563895a067e7f4dae67514e581be/packages/gatekeeper-cloudflare/package.json)

License evidence: [LICENSE](https://github.com/cloudflare/cloudflare-os/blob/5cae880e5e54563895a067e7f4dae67514e581be/LICENSE) Classification hint: Apache-2.0. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents**. Its category places it in the candidate set for agents, models, channels; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [models](../models.md) · [channels](../channels.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

<!-- teamagent-analysis:start -->
Analysis metadata: source [cloudflare-os](https://github.com/cloudflare/cloudflare-os); analyzed commit `5cae880e5e54563895a067e7f4dae67514e581be`; commit date 2026-10-02T19:01:46-05:00; review date unknown; depth screened. [Maintenance record](../analyses/repos/ai-agents--cloudflare-os.md).
<!-- teamagent-analysis:end -->
