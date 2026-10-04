# ai-model-run

[Analysis home](../README.md) · 2 projects catalogued; 2 focused source/content reviews.

Screening entries provide identity and package evidence only. Source-reviewed entries explain the exact scope inspected; none is a runtime certification. See [methodology](../methodology.md).

## Category assessment

Local MoE serving, heterogeneous memory placement, context admission, and inference-cache resource policies.

Evaluate Colibri and FreeToken as optional engines behind the same capability-based adapter used for other installed servers. Colibri contributes expert-store extensibility and serving-budget logic; FreeToken contributes explicit expert/KV memory partitioning. Compare cold and warm latency, concurrency, context fidelity, and task success on actual target hardware.

Research-oriented large-model support and consumer-hardware claims are not measured deployment guarantees. Engine caches are not durable knowledge memory. Neither candidate is recommended universally without compatibility and workload tests, and the corpus is not an exhaustive engine survey.

Start with:

- [colibri](https://github.com/JustVugg/colibri) — [individual report](../projects/ai-model-run--colibri.md).
- [freetoken](https://github.com/FlashML-org/FreeToken) — [individual report](../projects/ai-model-run--freetoken.md).

## Project catalogue

| Project source | Individual report | Depth | Harness relevance / finding |
|---|---|---|---|
| [colibri](https://github.com/JustVugg/colibri) | [Report](../projects/ai-model-run--colibri.md) | source-reviewed | Research candidate for storage/RAM/VRAM MoE placement and finite-choice scoring; profile on actual hardware. |
| [freetoken](https://github.com/FlashML-org/FreeToken) | [Report](../projects/ai-model-run--freetoken.md) | source-reviewed | Concrete GPU memory partitioning policy and local serving reference; semantic caching is distinct from durable memory. |
