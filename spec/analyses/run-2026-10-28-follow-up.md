# Remaining research review completion — 2026-10-28

[Workflow](../research-sync.md) · [Measurements](../data/review-follow-up-2026-10-28.json) · [Repository index](repositories.md) · [Pending updates](pending.md) · [Earlier completion](run-2026-10-28-initial.md)

## Review coverage

All **169 revisions left pending by the earlier completion** now have explicit scoped review receipts. The two bounded promotion batches contain 92 and 77 reviews. Every receipt matches its frozen discovery revision and the recorded analyzed SHA. The ledger contains **533 report identities: 532 current and one preserved archive**, with no remaining pending revision in the inspected checkouts. All report bodies match their recorded digests and contain exactly one managed metadata block. The 2,096 hash-addressed historical report snapshots retain their original hashes.

The [earlier run](run-2026-10-28-initial.md) and its [measurements](../data/review-completion-2026-10-28.json) remain dated evidence: that run handled the original 368 identities and left these newer revisions pending. This follow-up does not relabel those earlier observations or imply exhaustive source audits. Each project report states its actual implementation/documentary review scope, selected files and limitations; capped aggregate comparisons were expanded with targeted source reads rather than described as complete inventories.

## Architecture changes

- [Agents](../agents.md) and [channels](../channels.md): separate session ownership, authenticated authority, transport delivery and independently verified task outcomes. Preserve cancellation, queue limits and recovery state through delegation and reconnects.
- [Memory](../memory.md), [imports](../import-generation.md) and [generation](../generation.md): bind evidence to immutable source versions, retain exact offsets and raw representations, expose partial extraction and publish derived state without accepting stale writes.
- [Models](../models.md) and [media processing](../media-processing.md): retain route/account policy, provider/model compatibility and source-specific failure semantics. Static source changes do not establish live-provider readiness, voice identity or a measured best model.
- [Decisions](../decisions.md), [evaluation](../evaluation.md), [skills](../skills.md), [security](../security.md) and [evolution](../evolution.md): distinguish advisory scores, structural graders and declared capabilities from enforced permissions and observed behavior. Keep content/version identity separate from publisher trust, telemetry settings and execution authorization.

The [architecture overview](../architecture.md) connects these findings, including lifecycle-wide protection of unknown/newer state and the difference between structural grading and rendered behavior. Recommendations remain distinct from adopted runtime features and comparative benchmarks.

## Local observation and reproducible maintenance

The implemented `repos:observe` command publishes local HEAD/dirty observations for known checkouts without fetching, importing regenerated source lists, reading credentials, stashing or changing branches. It disables optional Git locks and configured filesystem monitors during inspection, preserving the source index. It retains the earlier remote observation timestamps and availability rather than making local inspection look like a new upstream check. Published state includes the current validated cache location, so downstream citation checks retain their containment boundary with nondefault caches.

Inspection failure, timeout, missing/malformed HEAD and missing checkouts remain explicit incomplete results with stale local values cleared. Publication occurs under the existing maintenance lock, through separate atomic files; a successful observation file followed by a failed primary state publication does not make that standalone file authoritative. Fixtures exercise these boundaries and ensure normal `status` remains nonpublishing. See the [operational contract](../research-sync.md).

The public command inspected all 532 known checkouts: 530 clean and two dirty, with zero unavailable inspections. [Wayland](https://github.com/FerroxLabs/wayland) ([report](../projects/ai-agents--wayland.md)) and [Hyperframes](https://github.com/heygen-com/hyperframes) ([report](../projects/ai-gen--hyperframes.md)) retain their local changes outside committed-source evidence. The command correctly exits with partial status for those dirty checkouts. All checkout HEADs match the reviewed observation, and all earlier remote-check dates are unchanged.

## Static articles and retained evidence

The [explicit article recovery](texts/recovery-2026-10-28-follow-up.md) resolves the two remaining active import failures as **partial captures** of the same configured articles. OpenAI's article is retained through a web-tool representation; the Medium article uses visible browser text reached through the author's public same-article free-reading link. Publisher-displayed creation dates are explicit configured assertions, separate from acquisition timestamps. Original HTTP 403 evidence remains historical.

The active 42-resource collection now has **31 usable texts and 11 partial captures, with no failed active entry**. The initial recovery made exactly two capture calls; a repeat import made **zero** and retained all versions. Three older removed-source failures remain in the full ledger. Missing images, original HTML/link targets and layout remain disclosed rather than inferred from successful text import. All 78 text exports, containing 933 files, pass local manifest/hash checks.

All maintained text and owned cache outputs use LF. The follow-up verified 1,602 raw/LF source-capture mappings and retained the one changed raw source representation. The browser/editor capture separately retains its original bytes and migration hashes. The previous public [LF migration](line-endings.json) remains unchanged; new private captures and process receipts add private provenance without overwriting historical originals.

## Verification

<!-- final-verification:start -->
Both required gates passed with Bun 1.4.2, Aube 2.5.1 and Python 3.12.16: formatting, strict TypeScript, type-aware lint, 359 tests with 1,321 assertions, LF/original-byte checks and all 78 text-export manifests. The final step test subprocess took 199.78 seconds; the final review test subprocess took 190.66 seconds. Earlier timeout failures are retained as failures; no test deadline or check was relaxed.

The documentation validator checked 1,213 Markdown documents, 11,517 relative links and 4,223 pinned references across 3,675 unique Git blobs, with zero issues and zero unmapped external sources. All 169 receipt targets, 533 report digests, 2,096 historical snapshots and 1,602 source-capture mappings were independently verified. Citation validation also exposed the missing cache-location metadata in the initial observation implementation; the corrected command and regression fixtures now preserve the validated setting without weakening path containment.

The public observation and normal analysis-sync commands were executed locally, followed by exact Git-object validation. Observation remains partial only for the two preserved dirty checkouts; all 532 local inspections succeeded. Static article reuse made zero capture calls. These measured outcomes do not imply new remote availability checks or complete article fidelity.
<!-- final-verification:end -->

These are scoped static source reviews, local fixture execution and evidence-integrity checks. Reviewed upstream projects, live voice providers and new model inference were not executed. The prepared Czech-to-English workflow remains preserved. No package release, Trigon integration or remote publication occurred. The previously inaccessible Vasily source remains a local retained-source review, not proof of restored upstream availability.
