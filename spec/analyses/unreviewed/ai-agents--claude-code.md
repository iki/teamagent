# claude-code

Source: [claude-code](https://github.com/anthropics/claude-code) · [agents](../../agents.md), [models](../../models.md), [channels](../../channels.md).

Depth: **unreviewed**. Discovered 2026-10-24T06:36:54.441Z; no source code or capabilities reviewed. [Change evidence](../repos/ai-agents--claude-code.md).

## 2026-10-28 scoped source review

Source: [claude-code](https://github.com/anthropics/claude-code); inspected saved discovery revision `08c6a4f5121ae140d3c1b5c96e3e5ae53587b54b`. This is an initial scoped review of this newly catalogued source.

**Scope:** Full AGENTS.md hook registrar and its register tests read. Files/Frames/Modes helpers, host hook implementation, instruction trust policy, nested-read tests and installed product behavior were not audited.

The [hook registrar](https://github.com/anthropics/claude-code/blob/08c6a4f5121ae140d3c1b5c96e3e5ae53587b54b/mods/agents-md/hooks/register.ts) selects among CLAUDE-only, managed-only, fallback and combined instruction-file modes. Fallback checks the ancestor walk as well as already handed files, so withholding a loaded CLAUDE.md does not automatically make AGENTS.md eligible. It respects attachment-disable settings on each read and avoids adding instructions after a denied or failed Read. Forks inherit their parent's seen-file set; resumed forks retain their own set.

The [register tests](https://github.com/anthropics/claude-code/blob/08c6a4f5121ae140d3c1b5c96e3e5ae53587b54b/mods/agents-md/tests/register.test.ts) cover an AGENTS-only project, CLAUDE precedence, failed discovery preserving existing context and optional telemetry. Failed walks can therefore leave instructions unadded, and nested discovery also suppresses failures into empty sets. Teamagent should preserve an unavailable-discovery state instead of treating it as proof that no policy exists. Seen entries are tracked by path in this registrar, so content-version semantics and host refresh need separate review. Managed-only filtering and path helpers are delegated, not enforcement verified here. Adapt explicit source precedence, per-agent context ownership and versioned provenance; no hooks, engine or tests were executed.

## 2026-10-28 follow-up source review

Reviewed the frozen update from `08c6a4f5121ae140d3c1b5c96e3e5ae53587b54b` to `58d6da1e34d6cd1c6379dcbf568bd66f5f9b6102`. Earlier findings above remain historical evidence; this review is limited to the cited source and delta.

In [mods/diff/hooks/turns/turn-of/file-edit-of/file-edit-of.ts](https://github.com/anthropics/claude-code/blob/58d6da1e34d6cd1c6379dcbf568bd66f5f9b6102/mods/diff/hooks/turns/turn-of/file-edit-of/file-edit-of.ts#L17-L58), The transcript-to-diff projection now returns null for staged:true before reading structured patches or synthesizing a create-file hunk. Other results still require a record with filePath and either parsed hunks or create content.

**Harness implication and limits:** A proposed patch held for review is not a filesystem change. Preserve proposal, approval and application states separately in event schemas and UI counts. This display helper trusts the transcript's staged marker; it does not verify filesystem hashes, effect execution or patch completeness. The broader changed files and producer of staged results were not audited, and no upstream tests were run. This static review does not certify other changed subsystems.

<!-- teamagent-analysis:start -->
Analysis metadata: source [claude-code](https://github.com/anthropics/claude-code); analyzed commit `58d6da1e34d6cd1c6379dcbf568bd66f5f9b6102`; commit date 2026-10-27T22:22:36Z; review date 2026-10-28T14:29:27.414Z; depth reviewed. [Maintenance record](../repos/ai-agents--claude-code.md).
<!-- teamagent-analysis:end -->
