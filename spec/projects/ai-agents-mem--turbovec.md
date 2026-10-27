# turbovec

Source: [turbovec](https://github.com/RyanCodrai/turbovec) · Category: [ai-agents-mem](../categories/ai-agents-mem.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `c6cf0baba11ddc0b0ec7f95d4024d816df3bd8ec`; commit timestamp `2026-10-02T19:48:43+01:00`; 868 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/RyanCodrai/turbovec/blob/c6cf0baba11ddc0b0ec7f95d4024d816df3bd8ec/README.md)):

> A 10 million document corpus takes 31 GB of RAM as float32. turbovec fits it in 4 GB - and searches it faster than FAISS. turbovec is a Rust vector index with Python bindings, built on Google Research's **TurboQuant** algorithm — a data-oblivious quantizer with near-optimal distortion and no separate training phase.

Build/package evidence: [Cargo.toml](https://github.com/RyanCodrai/turbovec/blob/c6cf0baba11ddc0b0ec7f95d4024d816df3bd8ec/Cargo.toml); [examples/downstream-smoke/Cargo.toml](https://github.com/RyanCodrai/turbovec/blob/c6cf0baba11ddc0b0ec7f95d4024d816df3bd8ec/examples/downstream-smoke/Cargo.toml); [turbovec-python/Cargo.toml](https://github.com/RyanCodrai/turbovec/blob/c6cf0baba11ddc0b0ec7f95d4024d816df3bd8ec/turbovec-python/Cargo.toml); [turbovec-python/pyproject.toml](https://github.com/RyanCodrai/turbovec/blob/c6cf0baba11ddc0b0ec7f95d4024d816df3bd8ec/turbovec-python/pyproject.toml); [turbovec/Cargo.toml](https://github.com/RyanCodrai/turbovec/blob/c6cf0baba11ddc0b0ec7f95d4024d816df3bd8ec/turbovec/Cargo.toml)

License evidence: [LICENSE](https://github.com/RyanCodrai/turbovec/blob/c6cf0baba11ddc0b0ec7f95d4024d816df3bd8ec/LICENSE) Classification hint: MIT. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents-mem**. Its category places it in the candidate set for memory, evolution; those associations are navigational and have not been individually validated as implemented capabilities. See [memory](../memory.md) · [evolution](../evolution.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

<!-- teamagent-analysis:start -->
Analysis metadata: source [turbovec](https://github.com/RyanCodrai/turbovec); analyzed commit `c6cf0baba11ddc0b0ec7f95d4024d816df3bd8ec`; commit date 2026-10-02T19:48:43+01:00; review date unknown; depth screened. [Maintenance record](../analyses/repos/ai-agents-mem--turbovec.md).
<!-- teamagent-analysis:end -->
