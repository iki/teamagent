# leaf

Source: [leaf](https://github.com/RivoLink/leaf) · Category: [ai-query](../categories/ai-query.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `e4d08754c2d7f1e4fffa7650488f97f5d2513e4f`; commit timestamp `2026-09-28T10:22:48Z`; 145 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/RivoLink/leaf/blob/e4d08754c2d7f1e4fffa7650488f97f5d2513e4f/README.md)):

> Install the package from archlinux.org, use an AUR helper such as `yay`: `leaf --update` downloads the matching published asset, verifies it against the published `checksums.txt` SHA256, and then installs it.

Build/package evidence: [Cargo.toml](https://github.com/RivoLink/leaf/blob/e4d08754c2d7f1e4fffa7650488f97f5d2513e4f/Cargo.toml); [npm/package.json](https://github.com/RivoLink/leaf/blob/e4d08754c2d7f1e4fffa7650488f97f5d2513e4f/npm/package.json); [npm/platforms/android-arm64/package.json](https://github.com/RivoLink/leaf/blob/e4d08754c2d7f1e4fffa7650488f97f5d2513e4f/npm/platforms/android-arm64/package.json); [npm/platforms/darwin-arm64/package.json](https://github.com/RivoLink/leaf/blob/e4d08754c2d7f1e4fffa7650488f97f5d2513e4f/npm/platforms/darwin-arm64/package.json); [npm/platforms/darwin-x64/package.json](https://github.com/RivoLink/leaf/blob/e4d08754c2d7f1e4fffa7650488f97f5d2513e4f/npm/platforms/darwin-x64/package.json)

License evidence: [LICENSE](https://github.com/RivoLink/leaf/blob/e4d08754c2d7f1e4fffa7650488f97f5d2513e4f/LICENSE) Classification hint: MIT. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-query**. Its category places it in the candidate set for memory, import-generation, decisions; those associations are navigational and have not been individually validated as implemented capabilities. See [memory](../memory.md) · [import-generation](../import-generation.md) · [decisions](../decisions.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

<!-- teamagent-analysis:start -->
Analysis metadata: source [leaf](https://github.com/RivoLink/leaf); analyzed commit `e4d08754c2d7f1e4fffa7650488f97f5d2513e4f`; commit date 2026-09-28T10:22:48Z; review date unknown; depth screened. [Maintenance record](../analyses/repos/ai-query--leaf.md).
<!-- teamagent-analysis:end -->
