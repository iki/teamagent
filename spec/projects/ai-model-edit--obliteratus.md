# OBLITERATUS: model-intervention research, outside the core harness

Source: [obliteratus](https://github.com/elder-plinius/OBLITERATUS) · Category: `ai-model-edit`

Review depth: **source-reviewed**. Snapshot `b847511776a2afa7ed076f676184a4abfef2b162`; assessed 2026-10-04. This is a focused static review of the listed files, not an audit of every code path or a reproduced benchmark. No repository code, model weights, paid endpoints, or installers were run.

## Observed architecture

The project presents itself as a model-intervention and refusal-behavior research toolkit. The inspected generic strategy layer registers named strategy classes and creates instances by name. An ablation specification carries component identity, a description, and optional metadata. The base interface requires enumeration and application, and its iterator applies a change and later calls model restoration.

These are useful experiment-management abstractions: immutable experiment descriptions, explicit model identity, reversible state, and comparable measurements. The focused read did not validate the mathematical intervention implementations or the README's claims of preserving general capabilities.

## Harness adoption

Do not make weight intervention part of ordinary skill evolution or model onboarding. Most of the requested benefits can be pursued through better retrieval, prompts, tool contracts, context assembly, routing, and evaluated skill variants. Those changes are easier to inspect, roll back, and attribute to task outcomes.

If a separate authorized research workflow studies model variants, give each checkpoint a distinct identity and isolated evaluation record. Require broad capability and safety regression measurements before any production selection. Preserve the original model, dataset provenance, exact configuration, evaluation split, and change lineage. A strategy iterator's restoration convention is not a durable transactional guarantee if a process crashes or a consumer stops iteration early.

## Limitations and decision

Keep outside the production harness roadmap. Removing refusal behavior is not evidence of improved usefulness, reliability, factuality, or coding success. The relevant architectural contribution is experiment provenance and baseline comparison, not a recommendation to weaken model safeguards. Telemetry and model downloads also need explicit configuration and data handling. Route research artifacts through the same signed, versioned model registry and promotion gates as any other externally supplied model variant.

## Evidence read

- [Strategy registration contract](https://github.com/elder-plinius/OBLITERATUS/blob/b847511776a2afa7ed076f676184a4abfef2b162/obliteratus/strategies/registry.py#L1-L23)
- [Ablation specification and restore lifecycle](https://github.com/elder-plinius/OBLITERATUS/blob/b847511776a2afa7ed076f676184a4abfef2b162/obliteratus/strategies/base.py#L1-L42)
- [Declared research scope](https://github.com/elder-plinius/OBLITERATUS/blob/b847511776a2afa7ed076f676184a4abfef2b162/README.md#L23-L57)

## Related directions

[Models](../models.md) · [Evolution](../evolution.md) · [Security](../security.md)


## Change review - 2026-10-28

**Disk restore points preflight geometry and invalidate incomplete restoration.** Reviewed commit `7e8cf557053f7e1a756c37d86e6a68682b9f7421` (commit date `2026-10-24T15:19:02-04:00`). Compared with `b847511776a2afa7ed076f676184a4abfef2b162`; the complete Git comparison contains 535 changed paths.

The new snapshot planner validates nonnegative exact integer size/count inputs, positive caps and explicit disabled reasons, estimates disk backing plus per-tensor overhead and host staging, and marks unknown availability as requiring runtime admission. Creation rechecks available disk/host capacity, rejects unsupported packed/quantized parameter storage, snapshots logical tensors one at a time to safetensors and stores streamed SHA-256 digests. The restore point is bound to the same live model object and module/shape/dtype signature, not a portable restart checkpoint.

Validation checks inventory, hashes, target storage and numerical compatibility before copying, and any failure after restore starts marks both snapshot and model invalid, requiring reload. This is fail-closed partial-restore handling rather than atomic rollback of the whole model. Validation and later payload reload are separate without a lock, so private directory ownership and exclusion of concurrent writers remain required. Memory/disk observations are admission estimates, not reserved resources, and cleanup ignores deletion errors while declaring the snapshot closed. Placement parsing rejects negative GPU indices, meta execution, duplicate normalized budgets and nonpositive limits, but offload-folder containment is delegated.

Evidence: [obliteratus/models/snapshot.py:1-280](https://github.com/elder-plinius/OBLITERATUS/blob/7e8cf557053f7e1a756c37d86e6a68682b9f7421/obliteratus/models/snapshot.py#L1-L280) · [obliteratus/model_placement.py:1-91](https://github.com/elder-plinius/OBLITERATUS/blob/7e8cf557053f7e1a756c37d86e6a68682b9f7421/obliteratus/model_placement.py#L1-L91).

**Harness consequence:** Reuse explicit snapshot availability, exact artifact hashes, one-tensor staging and irreversible-invalid-state reporting for authorized model experiments. Preserve immutable baseline model/checkpoint identity, serialize model mutations and use owned restricted backing paths with observable cleanup. Validate actual memory/disk peaks and recovery under injected failures; snapshot availability alone does not establish model quality, behavioral acceptability or permission to change a deployed model.

**Scope and limits:** Static scoped review of snapshot/restore resource handling and placement validation within the 535-path comparison. Numerical-update/offload helpers, full model loader, concept-edit algorithms and accelerator/failure fixtures were not fully audited or executed; no model loaded or edited.

## Follow-up change review — 2026-10-28

**Checkpoint continuation verifies candidate, layout and shard bytes before reuse.** Reviewed commit `1263570ae631a5a7f8008073d01e501f976f5dda` (commit date `2026-10-27T18:02:41-04:00`), compared with `7e8cf557053f7e1a756c37d86e6a68682b9f7421`. The complete no-rename Git path inventory contains 68 changed paths.

Continuation receipts bind candidate and plan digests, unique safe filenames, size and SHA-256. Restoring refuses existing targets/temporary paths, requires a regular nonsymlink file, checks size/hash/tensor layout and observes cancellation before replacement. Fresh shards still require host-capacity admission; receipt publication follows tensor release. Fixtures corrupt payload, layout, shape and dtype, or supply missing/directory/symlink restoration, and expect atomic staging rollback. Candidate identity remains a caller attestation to the live weights, as the contract states.

Evidence: [obliteratus/models/checkpoint_export.py:78-110](https://github.com/elder-plinius/OBLITERATUS/blob/1263570ae631a5a7f8008073d01e501f976f5dda/obliteratus/models/checkpoint_export.py#L78-L110) · [obliteratus/models/checkpoint_export.py:150-185](https://github.com/elder-plinius/OBLITERATUS/blob/1263570ae631a5a7f8008073d01e501f976f5dda/obliteratus/models/checkpoint_export.py#L150-L185) · [obliteratus/models/checkpoint_export.py:445-558](https://github.com/elder-plinius/OBLITERATUS/blob/1263570ae631a5a7f8008073d01e501f976f5dda/obliteratus/models/checkpoint_export.py#L445-L558) · [tests/test_checkpoint_export_continuation.py:190-231](https://github.com/elder-plinius/OBLITERATUS/blob/1263570ae631a5a7f8008073d01e501f976f5dda/tests/test_checkpoint_export_continuation.py#L190-L231).

**Harness consequence:** Resume expensive artifacts only from version-bound, byte-verified receipts; separate artifact integrity from claims about model quality or the meaning of its weights. Keep destination publication and trusted receipt ownership explicit.

**Scope and limits:** Reviewed continuation validation, restore/publication paths and malformed-restoration fixtures; no model weights were loaded or modified and the whole export pipeline was not executed. This is a scoped static comparison, not a whole-project correctness or security audit. Upstream tests were read where cited, not run; no upstream code, service, model or provider operation was executed. Historical findings above remain evidence at their own revisions.

<!-- teamagent-analysis:start -->
Analysis metadata: source [obliteratus](https://github.com/elder-plinius/OBLITERATUS); analyzed commit `1263570ae631a5a7f8008073d01e501f976f5dda`; commit date 2026-10-27T18:02:41-04:00; review date 2026-10-28T14:52:35.205Z; depth source-reviewed. [Maintenance record](../analyses/repos/ai-model-edit--obliteratus.md).
<!-- teamagent-analysis:end -->
