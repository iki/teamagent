# opendataloader-pdf

Source: [opendataloader-pdf](https://github.com/opendataloader-project/opendataloader-pdf) · Category: [ai-query](../categories/ai-query.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `72e475c05b0f1c375af71a5b04a751ed22fcbf25`; commit timestamp `2026-10-01T18:37:52+09:00`; 338 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/opendataloader-project/opendataloader-pdf/blob/72e475c05b0f1c375af71a5b04a751ed22fcbf25/README.md)):

> PDF Parser for AI-ready data. Automate PDF accessibility. Open-source. [](https://github.com/opendataloader-project/opendataloader-pdf/blob/main/LICENSE)

Build/package evidence: [examples/python/batch/requirements.txt](https://github.com/opendataloader-project/opendataloader-pdf/blob/72e475c05b0f1c375af71a5b04a751ed22fcbf25/examples/python/batch/requirements.txt); [examples/python/rag/requirements.txt](https://github.com/opendataloader-project/opendataloader-pdf/blob/72e475c05b0f1c375af71a5b04a751ed22fcbf25/examples/python/rag/requirements.txt); [java/opendataloader-pdf-cli/pom.xml](https://github.com/opendataloader-project/opendataloader-pdf/blob/72e475c05b0f1c375af71a5b04a751ed22fcbf25/java/opendataloader-pdf-cli/pom.xml); [java/opendataloader-pdf-core/pom.xml](https://github.com/opendataloader-project/opendataloader-pdf/blob/72e475c05b0f1c375af71a5b04a751ed22fcbf25/java/opendataloader-pdf-core/pom.xml); [java/pom.xml](https://github.com/opendataloader-project/opendataloader-pdf/blob/72e475c05b0f1c375af71a5b04a751ed22fcbf25/java/pom.xml)

License evidence: [LICENSE](https://github.com/opendataloader-project/opendataloader-pdf/blob/72e475c05b0f1c375af71a5b04a751ed22fcbf25/LICENSE) Classification hint: Apache-2.0. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-query**. Its category places it in the candidate set for memory, import-generation, decisions; those associations are navigational and have not been individually validated as implemented capabilities. See [memory](../memory.md) · [import-generation](../import-generation.md) · [decisions](../decisions.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.


## Change review - 2026-10-28

**Conversion failures expose bounded cause types and a targeted remedy, with cleanup ownership still delegated.** Reviewed commit `1652ba9bca5e7e9daa006a0b2a45df6b6a309638` (commit date `2026-10-27T18:26:06+09:00`). Compared with `72e475c05b0f1c375af71a5b04a751ed22fcbf25`; the complete Git comparison contains 122 changed paths.

Hybrid conversion/profile failures now walk at most 16 exception causes/contexts with cycle detection and return top/root exception class names rather than parser exception text. A specific filesystem-error signature produces a non-ASCII Windows environment-path remedy; an unrelated conversion phrase does not. New endpoint fixtures use a failing converter, and one fixture drives Docling's real wrapper with the parser constructor replaced, avoiding model loading. The response is safer, but server logging still records bounded exception text and exc_info tracebacks, so private source details may remain in logs.

ExtractionResult now implements AutoCloseable and stores an optional PDDocument, delegating close to DocumentProcessor.closePdfResources. Legacy public constructors pass null. Its documented same-thread font-cache cleanup and newer-extraction handling are not established by the wrapper alone; the delegated implementation was outside this cached review scope. The Node launcher probes its runtime temporary directory with an exclusive random file before adding java.io.tmpdir, deferring to any matching JVM-option environment setting and silently falling back on probe failure. It preserves split UTF-8 output, but library stdout and all stderr are accumulated without a byte cap, and the inspected spawn path supplies no cancellation or timeout.

Evidence: [python/opendataloader-pdf/src/opendataloader_pdf/hybrid_server.py:484-537](https://github.com/opendataloader-project/opendataloader-pdf/blob/1652ba9bca5e7e9daa006a0b2a45df6b6a309638/python/opendataloader-pdf/src/opendataloader_pdf/hybrid_server.py#L484-L537) · [python/opendataloader-pdf/src/opendataloader_pdf/hybrid_server.py:1454-1476](https://github.com/opendataloader-project/opendataloader-pdf/blob/1652ba9bca5e7e9daa006a0b2a45df6b6a309638/python/opendataloader-pdf/src/opendataloader_pdf/hybrid_server.py#L1454-L1476) · [python/opendataloader-pdf/src/opendataloader_pdf/hybrid_server.py:1581-1598](https://github.com/opendataloader-project/opendataloader-pdf/blob/1652ba9bca5e7e9daa006a0b2a45df6b6a309638/python/opendataloader-pdf/src/opendataloader_pdf/hybrid_server.py#L1581-L1598) · [python/opendataloader-pdf/tests/test_hybrid_server_failure_response.py:1-161](https://github.com/opendataloader-project/opendataloader-pdf/blob/1652ba9bca5e7e9daa006a0b2a45df6b6a309638/python/opendataloader-pdf/tests/test_hybrid_server_failure_response.py#L1-L161) · [java/opendataloader-pdf-core/src/main/java/org/opendataloader/pdf/processors/ExtractionResult.java:15-101](https://github.com/opendataloader-project/opendataloader-pdf/blob/1652ba9bca5e7e9daa006a0b2a45df6b6a309638/java/opendataloader-pdf-core/src/main/java/org/opendataloader/pdf/processors/ExtractionResult.java#L15-L101) · [node/opendataloader-pdf/src/index.ts:18-150](https://github.com/opendataloader-project/opendataloader-pdf/blob/1652ba9bca5e7e9daa006a0b2a45df6b6a309638/node/opendataloader-pdf/src/index.ts#L18-L150).

**Harness consequence:** Reuse typed, bounded failure diagnostics and explicit resource ownership, but apply redaction to logs as well as HTTP responses and verify same-thread cleanup/error paths on the actual JVM. Use a trusted pinned Java launcher, controlled environment, operation-owned temporary directory, bounded output and a cancellation deadline; record fallback directories rather than silently losing containment expectations.

**Scope and limits:** Static scoped review of error responses, result ownership wrapper and JVM launcher changes within the 122-path comparison; failure fixture bodies read. DocumentProcessor cleanup, extraction-close fixtures, model loading, Windows path behavior and actual JVM conversion were not fully inspected or executed; the documented dependency remedy was not independently reproduced.

## Follow-up change review — 2026-10-28

**Artifact-text removal requires positive operator evidence and preserves ambiguous content.** Reviewed commit `94a17ec03c7e902706a92a0bd4e8918e979c4967` (commit date `2026-10-28T12:10:01+03:00`), compared with `1652ba9bca5e7e9daa006a0b2a45df6b6a309638`. The complete no-rename Git path inventory contains 5 changed paths.

The new scanner follows marked-content nesting and form invocations with cycle/depth bounds. A chunk counts as artifact only when every painted operator is known as such; unreadable/incomplete scans return an empty artifact map. Shared form names avoid unsafe attribution except when every invocation is in an artifact context. Fixtures remove known artifact text but preserve untagged content and separately retain headers when requested.

Evidence: [java/opendataloader-pdf-core/src/main/java/org/opendataloader/pdf/processors/ArtifactOperators.java:43-180](https://github.com/opendataloader-project/opendataloader-pdf/blob/94a17ec03c7e902706a92a0bd4e8918e979c4967/java/opendataloader-pdf-core/src/main/java/org/opendataloader/pdf/processors/ArtifactOperators.java#L43-L180) · [java/opendataloader-pdf-core/src/main/java/org/opendataloader/pdf/processors/TaggedDocumentProcessor.java:94-126](https://github.com/opendataloader-project/opendataloader-pdf/blob/94a17ec03c7e902706a92a0bd4e8918e979c4967/java/opendataloader-pdf-core/src/main/java/org/opendataloader/pdf/processors/TaggedDocumentProcessor.java#L94-L126) · [java/opendataloader-pdf-core/src/test/java/org/opendataloader/pdf/issues/Issue801StructTreeArtifactTextTest.java:66-158](https://github.com/opendataloader-project/opendataloader-pdf/blob/94a17ec03c7e902706a92a0bd4e8918e979c4967/java/opendataloader-pdf-core/src/test/java/org/opendataloader/pdf/issues/Issue801StructTreeArtifactTextTest.java#L66-L158).

**Harness consequence:** Clean extracted text using provenance-backed structural evidence and retain content when attribution is uncertain. Store filtered artifacts separately so layout headers remain available for appropriate queries without polluting ordinary body retrieval.

**Scope and limits:** Reviewed the complete operator scanner, filtering call sites and selected issue fixtures; no PDF conversion or full tag-tree conformance run was performed. This is a scoped static comparison, not a whole-project correctness or security audit. Upstream tests were read where cited, not run; no upstream code, service, model or provider operation was executed. Historical findings above remain evidence at their own revisions.

## Change review - 2026-11-01

Reviewed `5421dedf39717eca35682eb77c0f036afb98b191` against `94a17ec03c7e902706a92a0bd4e8918e979c4967` (87 changed paths). The [Docling health client](https://github.com/opendataloader-project/opendataloader-pdf/blob/5421dedf39717eca35682eb77c0f036afb98b191/java/opendataloader-pdf-core/src/main/java/org/opendataloader/pdf/hybrid/DoclingFastServerClient.java) uses a configured availability timeout for connect/read waits independently of conversion timeout. The [regression fixture](https://github.com/opendataloader-project/opendataloader-pdf/blob/5421dedf39717eca35682eb77c0f036afb98b191/java/opendataloader-pdf-core/src/test/java/org/opendataloader/pdf/issues/Issue644HybridAvailabilityTimeoutTest.java) models a four-second cold-start delay, checks API/CLI overrides, rejects zero/negative/nonnumeric CLI values and retains the default three-second behavior.

**Harness consequence:** Keep readiness probing separate from conversion deadlines, capability checks, policy and authenticated entitlement. Per-connect/read timeout configuration is not by itself one end-to-end wall-clock budget; validate the total route including retries and startup. A healthy endpoint does not establish extraction completeness.

**Scope and limits:** Complete health-client diff and mock-server fixture; configuration propagation outside the exercised fixture and other parser/layout changes were not fully reviewed. No service, Java test, conversion or rendering benchmark was executed.

<!-- teamagent-analysis:start -->
Analysis metadata: source [opendataloader-pdf](https://github.com/opendataloader-project/opendataloader-pdf); analyzed commit `5421dedf39717eca35682eb77c0f036afb98b191`; commit date 2026-10-30T09:55:21Z; review date 2026-11-01T11:37:37.120Z; depth screened. [Maintenance record](../analyses/repos/ai-query--opendataloader-pdf.md).
<!-- teamagent-analysis:end -->
