# magika

Content-type classification using rule short-circuits and batched model inference with surfaced prediction metadata.

Source: [magika](https://github.com/google/magika) · Snapshot: `dbd9d853848ed5222b5ccfed9e2c957ac623d85e` · Category: `ai-query`.

Evidence level: **Source-reviewed; code was read, not executed or benchmarked.** Review date: 2026-10-04. Conclusions below apply to the inspected snapshot, not an unverified latest release. License and dependency compatibility require the separate catalog/license review before adoption.

## Verified source evidence

- [rust/lib/src/session.rs:55-99](https://github.com/google/magika/blob/dbd9d853848ed5222b5ccfed9e2c957ac623d85e/rust/lib/src/session.rs#L55-L99)
- [python/src/magika/magika.py:140-242](https://github.com/google/magika/blob/dbd9d853848ed5222b5ccfed9e2c957ac623d85e/python/src/magika/magika.py#L140-L242)

The Rust session first extracts a ruled result or model features; ruled inputs return directly, while feature inputs enter inference. Batched features are concatenated, passed to the runtime, reshaped by label count and converted under the configured prediction mode. The Python wrapper preserves the raw deep-learning label, final output label, score and overwrite reason. It can classify paths, bytes or streams. For large streams the inspected wrapper samples beginning/end blocks and restores the original stream position.

## Harness implications

Use content-based classification as an early import-routing signal rather than trusting filename extensions. Combine it with transport MIME metadata, container inspection and parser acceptance. The raw/final label distinction and overwrite reason are useful for explainable routing. This is another appropriate finite decision task: a small specialized classifier chooses a parser family; a general language model need not inspect every binary file merely to guess its type.

## Limitations and tradeoffs

A classifier score is not a guarantee that a file is safe, well-formed or supported by a specific converter. Prefix/suffix sampling can miss meaningful content in the middle, and polyglot or adversarial files can remain ambiguous. Some ruled paths bypass inference entirely, so scores and labels need their documented semantics. The source review verifies routing and wrapper behavior, not the model's accuracy on the user's formats or a security audit.

## Adoption and validation

Adopt as an optional MIME-sniffing stage with an unknown/ambiguous outcome and parser-confirmation fallback. Preserve both extension and detected type in metadata. Do not authorize execution based on classification. Test mislabeled files, empty/tiny inputs, mixed encodings, archives, polyglots and streams with nonzero initial positions. Measure downstream parser success and false-routing cost rather than reporting classifier accuracy alone.

Related directions: [import-generation](../import-generation.md) · [decisions](../decisions.md) · [models](../models.md).


## Change review - 2026-10-28

**Explicit backend failure and bounded stage queues do not bound ordered-result retention.** Reviewed commit `8d3d3b9b9452a65a6aa7752e061a67bf4a6b3c9b` (commit date `2026-10-23T14:03:59Z`). Compared with `dbd9d853848ed5222b5ccfed9e2c957ac623d85e`; the complete Git comparison contains 99 changed paths.

The Rust engine prepares CPU and optional GPU runtimes asynchronously, uses per-thread sessions, sends automatic batches of at least eight to a ready GPU, and propagates explicit GPU failure while automatic mode retains CPU fallback. Tests distinguish preparation-in-progress, required/optional failure and shared sessions. The path pipeline validates batch size 1-64 and configured readers/threads 1-256, uses bounded interstage channels, retains per-file errors and stops by disconnecting results then joining workers. Its ordered iterator nevertheless drains later responses into an uncapped HashMap while waiting for an earlier path, so bounded channels alone do not establish total memory bounds; joining also supplies no deadline for a stuck underlying read or inference. CachedInput incrementally reuses prefix/suffix reads and materializes full content when coverage overlaps. The Python diff moves labels/metadata to the native backend and introduces custom-rule inputs; this is configuration-sensitive classification, not a security verdict.

Evidence: [rust/lib/src/pipeline/engine.rs:69-196](https://github.com/google/magika/blob/8d3d3b9b9452a65a6aa7752e061a67bf4a6b3c9b/rust/lib/src/pipeline/engine.rs#L69-L196) · [rust/lib/src/pipeline/engine.rs:234-283](https://github.com/google/magika/blob/8d3d3b9b9452a65a6aa7752e061a67bf4a6b3c9b/rust/lib/src/pipeline/engine.rs#L234-L283) · [rust/lib/src/pipeline/paths.rs:81-113](https://github.com/google/magika/blob/8d3d3b9b9452a65a6aa7752e061a67bf4a6b3c9b/rust/lib/src/pipeline/paths.rs#L81-L113) · [rust/lib/src/pipeline/paths.rs:224-263](https://github.com/google/magika/blob/8d3d3b9b9452a65a6aa7752e061a67bf4a6b3c9b/rust/lib/src/pipeline/paths.rs#L224-L263) · [rust/lib/src/pipeline/paths.rs:501-521](https://github.com/google/magika/blob/8d3d3b9b9452a65a6aa7752e061a67bf4a6b3c9b/rust/lib/src/pipeline/paths.rs#L501-L521) · [rust/lib/src/pipeline/paths.rs:640-677](https://github.com/google/magika/blob/8d3d3b9b9452a65a6aa7752e061a67bf4a6b3c9b/rust/lib/src/pipeline/paths.rs#L640-L677) · [rust/lib/src/cached_input.rs:24-115](https://github.com/google/magika/blob/8d3d3b9b9452a65a6aa7752e061a67bf4a6b3c9b/rust/lib/src/cached_input.rs#L24-L115) · [rust/lib/src/session.rs:85-98](https://github.com/google/magika/blob/8d3d3b9b9452a65a6aa7752e061a67bf4a6b3c9b/rust/lib/src/session.rs#L85-L98) · [python/src/magika/magika.py:55-108](https://github.com/google/magika/blob/8d3d3b9b9452a65a6aa7752e061a67bf4a6b3c9b/python/src/magika/magika.py#L55-L108).

**Harness consequence:** Use detected type as routing evidence together with format validation, hashes and explicit unsupported outcomes. Record actual backend, model and rule configuration. Bound the complete admission/reorder window and file sizes, and isolate potentially blocking native work behind host-owned cancellation/deadlines. Measure cold preparation and warm inference separately before making performance claims.

**Scope and limits:** Scoped static inspection of engine/session/cache implementations, selected pipeline ownership/error/reordering paths and fixtures, plus Python API diff in the 99-path comparison. Native runtime internals and the complete rules scanner were not audited. No source execution, GPU experiment, throughput result or classification-quality measurement was performed.

## Follow-up change review — 2026-10-28

**Deterministic resolvers precede model inference and can veto incompatible predictions.** Reviewed commit `3627c158bcfb146bee4747b0589e80ac2faa4d7f` (commit date `2026-10-28T10:17:42+01:00`), compared with `8d3d3b9b9452a65a6aa7752e061a67bf4a6b3c9b`. The complete no-rename Git path inventory contains 24 changed paths.

The resolver now reads a 4 KiB prefix, selectively inspects a ZIP tail and can extend it back to the central-directory start. It returns a deterministic candidate or abstains; a declared veto list suppresses incompatible model classes. Fixtures keep disabled ambiguous verifiers out of enforcement and test archive/executable cases. The FFI removes the built-in-rules boolean, changing its option layout. The prefix bound is not a whole-file I/O bound because central-directory expansion can read more.

Evidence: [rust/lib/src/resolvers.rs:14-66](https://github.com/google/magika/blob/3627c158bcfb146bee4747b0589e80ac2faa4d7f/rust/lib/src/resolvers.rs#L14-L66) · [rust/lib/src/resolvers.rs:187-281](https://github.com/google/magika/blob/3627c158bcfb146bee4747b0589e80ac2faa4d7f/rust/lib/src/resolvers.rs#L187-L281) · [rust/ffi/src/lib.rs:100-143](https://github.com/google/magika/blob/3627c158bcfb146bee4747b0589e80ac2faa4d7f/rust/ffi/src/lib.rs#L100-L143).

**Harness consequence:** Use content sniffing as layered evidence with abstention, not a license to trust file extensions or execute content. Enforce total input/I/O budgets outside the classifier and pin FFI headers with the matching binary.

**Scope and limits:** Reviewed resolver orchestration, selected in-file fixtures and the FFI field removal; individual format verifiers and binary ABI compatibility were not exhaustively tested. This is a scoped static comparison, not a whole-project correctness or security audit. Upstream tests were read where cited, not run; no upstream code, service, model or provider operation was executed. Historical findings above remain evidence at their own revisions.

## Change review - 2026-11-01

Reviewed `00e908ff4945f3449d14a4407a806bc91e30006a` against `3627c158bcfb146bee4747b0589e80ac2faa4d7f`. The selected [ZIP](https://github.com/google/magika/blob/00e908ff4945f3449d14a4407a806bc91e30006a/rust/lib/src/resolvers/facts/zip.rs) and [PE](https://github.com/google/magika/blob/00e908ff4945f3449d14a4407a806bc91e30006a/rust/lib/src/resolvers/facts/pe.rs) deltas are license-header expansion and an equivalent certificate-range conditional, not a newly proven classifier algorithm. The new [native regression harness](https://github.com/google/magika/blob/00e908ff4945f3449d14a4407a806bc91e30006a/rust/lib/src/resolvers/tests/regressions.rs) consumes recorded signature cases, distinguishes complete input from held prefix, records an explicit superseded expectation and asserts a fixed 15,169-case corpus count. It also asserts abstention below eight bytes across repository samples.

**Harness consequence:** Keep byte-coverage and abstention explicit, retain original regression provenance and explain expectation changes. Format identification is routing evidence, not permission to execute content or proof a document is valid, safe or fully parsed.

**Scope and limits:** Three complete selected diffs; the exported regression dataset and complete resolver implementation were not re-audited. The corpus size is an assertion read from source, not a measured passing run; no model or Rust tests were executed.

<!-- teamagent-analysis:start -->
Analysis metadata: source [magika](https://github.com/google/magika); analyzed commit `00e908ff4945f3449d14a4407a806bc91e30006a`; commit date 2026-10-30T10:41:23+01:00; review date 2026-11-01T11:37:37.120Z; depth source-reviewed. [Maintenance record](../analyses/repos/ai-query--magika.md).
<!-- teamagent-analysis:end -->
