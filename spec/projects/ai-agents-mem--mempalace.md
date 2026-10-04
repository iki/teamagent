# mempalace

Source: [mempalace](https://github.com/milla-jovovich/mempalace) · Category: [ai-agents-mem](../categories/ai-agents-mem.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `43122aefb8ed58e9fa4e1953e15ce70026339ec2`; commit timestamp `2026-10-03T11:07:52-03:00`; 746 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/milla-jovovich/mempalace/blob/43122aefb8ed58e9fa4e1953e15ce70026339ec2/README.md)):

> Local-first AI memory. Verbatim storage, pluggable backend, 96.6% R@5 raw on LongMemEval — zero API calls. Beware of impostor sites.** MemPalace has no other official websites. The **only** official sources are this **GitHub repository**, the **PyPI package**, and the docs at **mempalaceofficial.com**. Any other domain (including `.tech`, `.net`, or other `.com` variants) is an impostor and may distribute malware. Details and timeline: docs/HISTORY.md.

Build/package evidence: [.dsh-plugin/package.json](https://github.com/milla-jovovich/mempalace/blob/43122aefb8ed58e9fa4e1953e15ce70026339ec2/.dsh-plugin/package.json); [Cargo.toml](https://github.com/milla-jovovich/mempalace/blob/43122aefb8ed58e9fa4e1953e15ce70026339ec2/Cargo.toml); [benchmarks/lean_mempalace/go/go.mod](https://github.com/milla-jovovich/mempalace/blob/43122aefb8ed58e9fa4e1953e15ce70026339ec2/benchmarks/lean_mempalace/go/go.mod); [benchmarks/lean_mempalace/rust/Cargo.toml](https://github.com/milla-jovovich/mempalace/blob/43122aefb8ed58e9fa4e1953e15ce70026339ec2/benchmarks/lean_mempalace/rust/Cargo.toml); [crates/mempalace-cli/Cargo.toml](https://github.com/milla-jovovich/mempalace/blob/43122aefb8ed58e9fa4e1953e15ce70026339ec2/crates/mempalace-cli/Cargo.toml)

License evidence: [LICENSE](https://github.com/milla-jovovich/mempalace/blob/43122aefb8ed58e9fa4e1953e15ce70026339ec2/LICENSE) Classification hint: MIT. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents-mem**. Its category places it in the candidate set for memory, evolution; those associations are navigational and have not been individually validated as implemented capabilities. See [memory](../memory.md) · [evolution](../evolution.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.
