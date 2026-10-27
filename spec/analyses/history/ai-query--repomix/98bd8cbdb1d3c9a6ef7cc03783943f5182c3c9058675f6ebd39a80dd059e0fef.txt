# repomix

Repository packaging with deterministic discovery, safety hooks and explicit token/omission accounting.

Source: [repomix](https://github.com/yamadashy/repomix) · Snapshot: `8d6429121e98ed178e4d3a975c2bdbbecc958c4a` · Category: `ai-query`.

Evidence level: **Source-reviewed; code was read, not executed or benchmarked.** Review date: 2026-10-04. Conclusions below apply to the inspected snapshot, not an unverified latest release. License and dependency compatibility require the separate catalog/license review before adoption.

## Verified source evidence

- [src/core/packager.ts:1-168](https://github.com/yamadashy/repomix/blob/8d6429121e98ed178e4d3a975c2bdbbecc958c4a/src/core/packager.ts#L1-L168)

The pack entry point composes file search, collection, processing, safety validation, output production and token metrics behind injectable dependencies. It supports multiple roots, deduplicates and sorts discovered paths, and constructs disambiguating root labels. Token-count cache loading and Git sort-data prefetch overlap discovery. PackResult includes processed/safe/skipped files, token counts and suspicious-file/diff/log results. A confineToBaseDir option is available for untrusted-agent callers, and the source states it is off by default for ordinary CLI/library use.

## Harness implications

Use packaging for explicit repository snapshots, model handoffs and reproducible evaluation inputs. Every package should include a commit/tree hash, include/exclude configuration, tokenizer identity and omission manifest. The optional confinement flag is essential in an automated importer that accepts user- or model-supplied include patterns. File bundling is complementary to code search: compact summaries and relevant source slices should normally reach the model before a whole-repository package.

## Limitations and tradeoffs

A token-count report measures size, not relevance or semantic completeness. Secret detection and suspicious-file reporting cannot guarantee that a package is safe to transmit. Compression and processors may omit details necessary for editing. Prefetched Git metadata or collected files can become stale while packaging a changing checkout, so a consistent snapshot is needed for evidence-heavy tasks. The review did not run every safety rule or inspect all formatter outputs.

## Adoption and validation

Adopt as an export/import helper with confinement explicitly enabled and a harness-owned destination policy. Preserve the package as a derived artifact linked to its source snapshot. Test symlinks, absolute/parent include patterns, multiple roots with duplicate filenames, secrets in diffs, generated files, changed files during packing and token-budget overflow. Do not use a large bundle as a substitute for version-aware retrieval.

Related directions: [import-generation](../import-generation.md) · [memory](../memory.md) · [skills](../skills.md).
