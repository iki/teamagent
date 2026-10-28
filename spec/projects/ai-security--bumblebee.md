# bumblebee

Source: [bumblebee](https://github.com/perplexityai/bumblebee) · Category: [ai-security](../categories/ai-security.md)

Original review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `9b0576838a0ee42a78a98fc56ef75d28fc5999db`; commit timestamp `2026-10-02T18:06:10+01:00`; 104 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/perplexityai/bumblebee/blob/9b0576838a0ee42a78a98fc56ef75d28fc5999db/README.md)):

> Bumblebee is a read-only inventory collector for package, extension, and developer-tool metadata on macOS and Linux developer endpoints.

Build/package evidence: [go.mod](https://github.com/perplexityai/bumblebee/blob/9b0576838a0ee42a78a98fc56ef75d28fc5999db/go.mod)

License evidence: [LICENSE](https://github.com/perplexityai/bumblebee/blob/9b0576838a0ee42a78a98fc56ef75d28fc5999db/LICENSE) Classification hint: Apache-2.0. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-security**. Its category places it in the candidate set for agents, skills, evolution; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [skills](../skills.md) · [evolution](../evolution.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

## Source update reviewed 2026-10-27

Reviewed commit `c1e83c0adb53a7f527b40a7181a690ad99a0a6e0` (commit date `2026-10-08T15:30:45+01:00`). Complete two-file threat-feed delta; unchanged scanner not re-audited.

The [record](https://github.com/perplexityai/bumblebee/blob/c1e83c0adb53a7f527b40a7181a690ad99a0a6e0/threat_intel/tensorlake-2026-10-08.json) and [index](https://github.com/perplexityai/bumblebee/blob/c1e83c0adb53a7f527b40a7181a690ad99a0a6e0/threat_intel/README.md) add npm tensorlake 0.5.144 with dated source/severity/advisory IDs. Read-only checks on 2026-10-27 confirmed package/version and October 8 publication in [OSV](https://osv.dev/vulnerability/MAL-2026-17650) and [GitHub](https://github.com/advisories/GHSA-rqxj-g25x-4v9v). Both also display broader introduced-zero/greater-than-or-equal-zero ranges. The feed is narrower: do not infer omitted versions are safe. Detailed campaign and npm-removal claims remain unverified. Preserve affected-range disagreement and retrieval date. No package was executed or host compromise asserted.

<!-- teamagent-analysis:start -->
Analysis metadata: source [bumblebee](https://github.com/perplexityai/bumblebee); analyzed commit `c1e83c0adb53a7f527b40a7181a690ad99a0a6e0`; commit date 2026-10-08T15:30:45+01:00; review date 2026-10-28T08:26:04.502Z; depth screened. [Maintenance record](../analyses/repos/ai-security--bumblebee.md).
<!-- teamagent-analysis:end -->
