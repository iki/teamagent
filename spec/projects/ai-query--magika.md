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

<!-- teamagent-analysis:start -->
Analysis metadata: source [magika](https://github.com/google/magika); analyzed commit `dbd9d853848ed5222b5ccfed9e2c957ac623d85e`; commit date 2026-10-02T10:54:58+02:00; review date 2026-10-04; depth source-reviewed. [Maintenance record](../analyses/repos/ai-query--magika.md).
<!-- teamagent-analysis:end -->
