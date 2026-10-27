# pdf-inspector

Source: [pdf-inspector](https://github.com/firecrawl/pdf-inspector) · Category: [ai-query](../categories/ai-query.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `ef52f77850b29189048797a48b24862251f54fe7`; commit timestamp `2026-09-27T23:55:46-07:00`; 374 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/firecrawl/pdf-inspector/blob/ef52f77850b29189048797a48b24862251f54fe7/README.md)):

> Fast Rust library for PDF classification and text extraction. By default it detects whether a PDF is text-based or scanned, extracts text with position awareness, and converts to clean Markdown without OCR. Native Rust and CLI consumers can opt into selective OCR. Includes bindings for Python, Node.js, and browser WebAssembly. Built by Firecrawl to handle text-based PDFs locally in under 200ms, skipping expensive OCR services for the ~54% of PDFs that don't need them.

Build/package evidence: [Cargo.toml](https://github.com/firecrawl/pdf-inspector/blob/ef52f77850b29189048797a48b24862251f54fe7/Cargo.toml); [napi/Cargo.toml](https://github.com/firecrawl/pdf-inspector/blob/ef52f77850b29189048797a48b24862251f54fe7/napi/Cargo.toml); [napi/package.json](https://github.com/firecrawl/pdf-inspector/blob/ef52f77850b29189048797a48b24862251f54fe7/napi/package.json); [pyproject.toml](https://github.com/firecrawl/pdf-inspector/blob/ef52f77850b29189048797a48b24862251f54fe7/pyproject.toml); [wasm/Cargo.toml](https://github.com/firecrawl/pdf-inspector/blob/ef52f77850b29189048797a48b24862251f54fe7/wasm/Cargo.toml)

License evidence: [LICENSE](https://github.com/firecrawl/pdf-inspector/blob/ef52f77850b29189048797a48b24862251f54fe7/LICENSE) Classification hint: MIT. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-query**. Its category places it in the candidate set for memory, import-generation, decisions; those associations are navigational and have not been individually validated as implemented capabilities. See [memory](../memory.md) · [import-generation](../import-generation.md) · [decisions](../decisions.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.
