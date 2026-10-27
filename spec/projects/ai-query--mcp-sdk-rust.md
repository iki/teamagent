# mcp-sdk-rust

Source: [mcp-sdk-rust](https://github.com/modelcontextprotocol/rust-sdk) · Category: [ai-query](../categories/ai-query.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `8f9a28ecdb5f9237dd7927f915df82cd4d02d09b`; commit timestamp `2026-10-02T22:44:37+01:00`; 289 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/modelcontextprotocol/rust-sdk/blob/8f9a28ecdb5f9237dd7927f915df82cd4d02d09b/README.md)):

> [](https://github.com/modelcontextprotocol/rust-sdk/actions/workflows/ci.yml) An official Rust Model Context Protocol SDK implementation with tokio async runtime.

Build/package evidence: [Cargo.toml](https://github.com/modelcontextprotocol/rust-sdk/blob/8f9a28ecdb5f9237dd7927f915df82cd4d02d09b/Cargo.toml); [conformance/Cargo.toml](https://github.com/modelcontextprotocol/rust-sdk/blob/8f9a28ecdb5f9237dd7927f915df82cd4d02d09b/conformance/Cargo.toml); [crates/rmcp-macros/Cargo.toml](https://github.com/modelcontextprotocol/rust-sdk/blob/8f9a28ecdb5f9237dd7927f915df82cd4d02d09b/crates/rmcp-macros/Cargo.toml); [crates/rmcp/Cargo.toml](https://github.com/modelcontextprotocol/rust-sdk/blob/8f9a28ecdb5f9237dd7927f915df82cd4d02d09b/crates/rmcp/Cargo.toml); [crates/rmcp/tests/test_with_js/package.json](https://github.com/modelcontextprotocol/rust-sdk/blob/8f9a28ecdb5f9237dd7927f915df82cd4d02d09b/crates/rmcp/tests/test_with_js/package.json)

License evidence: [LICENSE](https://github.com/modelcontextprotocol/rust-sdk/blob/8f9a28ecdb5f9237dd7927f915df82cd4d02d09b/LICENSE) Classification hint: MIT. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-query**. Its category places it in the candidate set for memory, import-generation, decisions; those associations are navigational and have not been individually validated as implemented capabilities. See [memory](../memory.md) · [import-generation](../import-generation.md) · [decisions](../decisions.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

<!-- teamagent-analysis:start -->
Analysis metadata: source [mcp-sdk-rust](https://github.com/modelcontextprotocol/rust-sdk); analyzed commit `8f9a28ecdb5f9237dd7927f915df82cd4d02d09b`; commit date 2026-10-02T22:44:37+01:00; review date unknown; depth screened. [Maintenance record](../analyses/repos/ai-query--mcp-sdk-rust.md).
<!-- teamagent-analysis:end -->
