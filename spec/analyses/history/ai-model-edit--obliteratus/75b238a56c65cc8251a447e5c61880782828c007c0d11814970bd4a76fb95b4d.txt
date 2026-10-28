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
