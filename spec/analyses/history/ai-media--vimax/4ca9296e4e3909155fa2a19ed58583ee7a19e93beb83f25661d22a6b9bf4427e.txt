# ViMax: staged agentic video production

Source: [vimax](https://github.com/HKUDS/ViMax) · Category: `ai-media`

Review depth: **source-reviewed**. Snapshot `fd4b72e7731be6e5f88486206d25ea59849b0285`; assessed 2026-10-04. This is a focused static review of the listed files, not an audit of every code path or a reproduced benchmark. No repository code, model weights, paid endpoints, or installers were run.

## Observed architecture

The idea-to-video pipeline composes a screenwriter, character extractor, portrait generator, and a separately configured rendering backend. It saves structured character data and uses Pydantic validation when restoring it. Portrait generation is parallelized for missing visible characters, while characters without a visual appearance are skipped. The portrait registry is updated as asynchronous tasks complete.

Story and character checkpoint reuse is based on file existence in the inspected path. This gives practical resumability, but it can also reuse stale content when the brief, model, style, or generation parameters change. A complete harness must track dependencies rather than interpreting every existing file as a valid cache hit.

## Harness adoption

Adopt the staged production pattern: brief, story, character bible, shot plan, reference assets, clips, audio, assembly, and review. Use a content-addressed DAG so revising one shot invalidates only dependent outputs. Store character identities and source references as project memory, distinct from global user memory.

Apply separate budgets to candidate images, rendered clips, critic calls, and final composition. Choose extra candidates only when their expected improvement exceeds latency and cost. Progress should expose real stage completion and allow resuming a failed clip without recreating accepted assets.

## Limitations and decision

Use as an optional video workflow blueprint. The inspected pipeline does not prove character consistency, production quality, or best-in-class performance; those remain task-specific evaluation questions. External provider adapters and their quotas change, and parallel generation can multiply spend. Add idempotent job keys, deadline propagation, content-based checkpoint validation, and durable cancellation before using it as a unattended production service. Keep user review points at expensive transitions when the creative brief remains ambiguous.

## Evidence read

- [Idea-to-video setup, character cache and parallel portraits](https://github.com/HKUDS/ViMax/blob/fd4b72e7731be6e5f88486206d25ea59849b0285/pipelines/idea2video_pipeline.py#L23-L128)
- [Story checkpoint reuse](https://github.com/HKUDS/ViMax/blob/fd4b72e7731be6e5f88486206d25ea59849b0285/pipelines/idea2video_pipeline.py#L130-L151)

## Related directions

[Generation](../generation.md) · [Memory](../memory.md) · [Agents](../agents.md) · [Decisions](../decisions.md)
