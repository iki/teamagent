# Research review completion — 2026-10-28

[Workflow](../research-sync.md) · [Measurements](../data/review-completion-2026-10-28.json) · [Repository index](repositories.md) · [Pending updates](pending.md) · [Previous run](run-2026-10-27.md)

## Original queue and later changes

All **368 non-current report identities** from the previous run were handled: **367 scoped reviews/reconciliations** were recorded and the proven obsolete Better Icons identity was archived. The archive preserves its report and history; the replacement skill report and separate query report remain active. Every reviewed SHA matches its saved receipt. Review scopes include implementation reads and documentary screens; they are stated individually and do not imply exhaustive code audits.

The older same-commit [PersonaLive speech addition](../projects/ai-media--personalive.md) was separately checked against all three cited source blobs and acknowledged. Eight garbled review headings were corrected with explicit same-commit receipts, preserving their original report snapshots.

The final synchronization records 533 report identities: 363 current, 169 with newer checkout revisions awaiting discovery/review, and one archived duplicate. All report digests match, no report prose remains unacknowledged, and each report has exactly one metadata block. The pending count grew from 143 to 169 as other checkouts advanced during this work; these changes remain outside the reviewed discovery snapshots. No additional fetch, reset or source checkout mutation was used to close the original queue.

The retained [Vasily snapshot](../projects/ai-skills--bundle.vasilyu83.md) was reviewed locally. Its last upstream observation remains not-found/inaccessible; a local source review does not establish current upstream availability or that a removal was permanent.

## Reconciled architecture

- [Agents](../agents.md) and [channels](../channels.md): separate authenticated identity, permissions, session ownership, cancellation and cleanup; bound queues and worker admission; retain ambiguous outcomes for recovery. Adapter metadata or a normal completion signal is insufficient proof of authority or task correctness.
- [Memory](../memory.md), [imports](../import-generation.md) and [generation](../generation.md): preserve exact source offsets, versions and manifests; make partial extraction/search coverage explicit; protect cache/graph publication and reject stale writes. Frame replacement, output validation and generation receipts have different responsibilities.
- [Models](../models.md) and [decisions](../decisions.md): preserve account and route conditions, cost/idempotency boundaries and failure semantics. Confidence scores and method-selection heuristics require calibration; they do not grant execution authority.
- [Skills](../skills.md), [evolution](../evolution.md), [security](../security.md) and [evaluation](../evaluation.md): separate declarative instructions from enforced authorization, signed artifacts from publisher trust, examples from telemetry, and evaluator/cost deduplication from exactly-once provider execution.

The [architecture overview](../architecture.md) links the cross-cutting findings. These recommendations do not adopt all inspected upstream implementations or establish new model-quality/performance benchmarks.

## Reliable evidence maintenance

The [exceptional history review](reconciliation-2026-10-28.md) records seven explicitly reconciled different-tree histories, the same-source identical-tree Contextrie case, and bounded Orca/LangWatch comparisons. Earlier full SHAs, tree IDs, report bytes and review scope remain in history. Exact newer-checkout acknowledgments retain reviewed snapshots while keeping later changes pending. Verified rename identities survive stale observations; changed upstream URLs still require investigation.

The tracker also repaired 120 metadata-only digests affected by Windows line endings. The repair accepts only matching old digests or verified historical snapshots with byte-identical non-metadata content. Interrupted publication is recoverable, adjacent metadata blocks are handled, and genuine prose changes or corrupt history cannot become an implicit source review. Publication checks recheck report content and checkout HEAD; the documented per-file boundary remains distinct from an OS-wide transaction.

## Imports and external sources

The [static import repair](texts/repair-2026-10-28.md) recovered the QM article, the original TanStack skills document and the actual Memento PDF. Of 42 configured resources, 37 retained captures were verified locally; five initial imports yielded three new captures and two HTTP 403 failures. The configured corpus now has 31 usable texts, nine partial captures and two failures. Successful resources remain static, with creation evidence separate from capture dates; unknown publication dates stay unknown.

The seven pinned external voice-source repositories are registered in [portable configuration](../data/external-source-pins.json). Their bounded public acquisition and offline blob/line checks resolve the 23 formerly unmapped source citations. This verifies source availability at exact commits, not semantic claims, account data policy, live inference or model quality. The prepared Czech-to-English workflow and downstream project boundaries were preserved.

## LF text and original-byte provenance

The user-authorized [LF migration](line-endings.json) verifies 2,907 text updates, including 432 report-body digest changes. Active text, generated outputs and owned caches use LF; Git attributes, editor/formatter settings and the mandatory verification gate enforce the rule. The migration retains 2,880 unique original byte sequences and verifies 1,927 hash-addressed report snapshots. Public source/documentation originals remain in the repository; cache and configuration originals remain private. New LF history views have new content hashes, while old hash-named files retain their exact bytes. Source commits, source dates, review dates and findings are unchanged.

The private manifest identifies 27 historical opaque captures by exact hashes and retained copies. These include binary snapshots with misleading text suffixes; they are not silently decoded or rewritten. Binary media, installed dependencies, source checkouts and Git object stores retain their native byte formats. The [verification contract](../verification.md#lf-text-and-retained-originals) documents the bounded inventory and exclusions.

The [memory export contract](../memory-imports.md) now records LF derivatives and preserved raw originals separately. All 76 existing text exports, containing 927 files, were already compliant and passed their manifest/hash checks without refreshing the static sources. Conversation text is normalized before fingerprinting and publication; historical records retain original-byte provenance.

## Verification

<!-- final-verification:start -->
Both required gates passed with Bun 1.4.2, Aube 2.5.1 and Python 3.12.16: formatting, strict TypeScript, type-aware lint, 359 tests with 1321 assertions, LF inventory/original-byte verification and 76 text-export manifests. The final test run took 185.16 seconds. The added LF scan required a measured outer hook-budget adjustment; individual tool and test deadlines remain unchanged.

The active documentation validator checked 1,211 Markdown documents, 11,309 relative links and 3,858 pinned references across 3,403 unique Git blobs, with zero issues and zero unmapped external sources. All 533 report digests, 1,927 historical snapshots and 2,907 migration mappings were independently verified. Git fixtures checked LF text and exact binary/original bytes with Windows autocrlf both enabled and disabled.

These are local fixture, static and source-object checks. Installed dependencies and deterministic fixtures ran; reviewed source checkouts, live voice providers and new model inference did not. Two initial web imports remain HTTP 403, and 169 newer repository revisions await a separate review. No package release, Trigon integration or remote publication occurred.
<!-- final-verification:end -->
