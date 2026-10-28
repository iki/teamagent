# hanzo-hips

Source: [hanzo-hips](https://github.com/hanzoai/hips) · [agents](../../agents.md), [models](../../models.md), [channels](../../channels.md).

Depth: **unreviewed**. Discovered 2026-10-24T06:36:54.441Z; no source code or capabilities reviewed. [Change evidence](../repos/ai-agents--hanzo-hips.md).

## 2026-10-28 scoped source review

Source: [hanzo-hips](https://github.com/hanzoai/hips); inspected saved discovery revision `50c74ff5c99851f3174239f9289f45df1c956e2b`. This is an initial scoped review of this newly catalogued source.

**Scope:** Complete index generator, its 236-line refusal test and shared status helper. The proposal corpus, vocabulary contents, sibling capabilities taxonomy and claimed runtime implementations were not audited.

The [index generator](https://github.com/hanzoai/hips/blob/50c74ff5c99851f3174239f9289f45df1c956e2b/scripts/index.py#L140-L249) treats proposal files as source and README as a projection. It rejects an empty corpus, duplicate numbers, missing required metadata, unknown vocabulary, unresolved prerequisite references and certain dangling relative links. Retired IDs are checked against stored titles, preserving address history at that granularity. Runtime implementation annotations distinguish absent/unassessed from explicit `none`; the consistency check for a Final proposal declaring no Go implementation validates metadata, not the runtime itself.

[Projection checks](https://github.com/hanzoai/hips/blob/50c74ff5c99851f3174239f9289f45df1c956e2b/scripts/index.py#L381-L459) require file/row coverage, an exact declared shrink count and unique output section headings before writing once. The shrink acknowledgement is a count, not an identity-bound deletion manifest, and equal-cardinality replacement is not caught by that count. The final `write_text` is not an atomic replacement or concurrent-editor compare-and-swap. Regex front matter and link scanning are bounded by their supported syntax rather than full Markdown/YAML semantics.

The [tests](https://github.com/hanzoai/hips/blob/50c74ff5c99851f3174239f9289f45df1c956e2b/scripts/test-index.py#L141-L230) define fourteen scratch-corpus refusal cases with unchanged-output assertions and a stable projection control. Their final regex check only establishes that at least one `raise Refused(` exists; it does not prove every guard is exercised. The [status helper](https://github.com/hanzoai/hips/blob/50c74ff5c99851f3174239f9289f45df1c956e2b/docs/lib/status.ts#L13-L40) centralizes badge vocabulary and renders unknown values neutrally. Teamagent can borrow explicit unassessed states and pre-publication coverage/refusal tests, while preserving immutable version evidence and transactional publication. No generator, test, dependency or claimed implementation was executed.

<!-- teamagent-analysis:start -->
Analysis metadata: source [hanzo-hips](https://github.com/hanzoai/hips); analyzed commit `50c74ff5c99851f3174239f9289f45df1c956e2b`; commit date 2026-10-22T12:57:00-07:00; review date 2026-10-28T09:27:32.685Z; depth reviewed. [Maintenance record](../repos/ai-agents--hanzo-hips.md).
<!-- teamagent-analysis:end -->
