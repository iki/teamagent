# Memory benchmark protocol

This benchmark evaluates the memory component on coding-task evidence retrieval
and document questions. It does not claim autonomous patch success, hidden-test
pass rates, generated-answer accuracy or a universal best memory system.

## Frozen inputs and lanes

Independent corpus authors ground 48 coding questions in four committed source
subsystems and 40 document questions in five PDFs before seeing retrieval
results. Their manifests retain source identity, hashes, explicit selection,
exact evidence anchors, facts and rationale. Working-tree modifications are not
used as committed evidence. Full source bodies and third-party PDFs remain local;
only manifests, small evidence anchors and measurement results are retained here.

Development and holdout questions use different subsystem/document families.
Tune only against development results. Initial baseline and competitor runs may
write sealed holdout results; do not read those scores until the implementation
and tuning policy are frozen. Preserve every run and do not replace initial
results after improving the implementation. The holdout is a small authored
evaluation set, not a public benchmark or a statistical guarantee of generality.

The common-passage lane separates ranking from parser quality. Every engine
receives identical passage bytes, source headers and query strings, with no gold
labels or oracle source filter. The neutral splitter uses at most 30 lines and
1,600 body characters, with up to five lines of overlap. Very long lines are
split without dropping bytes. Source line ranges remain separate from the
display header. Each engine uses its real public search API and default ranking
configuration documented in the adapter; this is not a reimplementation of a
competitor's algorithm. Native sub-chunking and embedding truncation are reported.

The native lane separately measures committed subsystem import, document
conversion, unchanged/changed sync, historical reads, deletion visibility,
scope/version integrity and bounded failure. Shared normalized passages do not
establish equivalence of the systems' complete ingestion pipelines. Unsupported
native source capabilities remain unsupported rather than silently substituted.

## Scoring and budgets

An evidence group is satisfied only by a returned passage from the correct
source/path containing its independently annotated quote anchors. Coding line
ranges must overlap. PDF matching normalizes Unicode, whitespace and line-wrap
hyphenation; it does not replace words with synonyms or accept a keyword as a
correct answer. Missing extracted evidence remains in the denominator. Report
extraction coverage separately from ranking coverage.

Report Hit@1/5/10, evidence-group recall@5, complete evidence@5, reciprocal rank
at 10 and discounted evidence coverage. Overlapping passages cannot earn credit
twice for the same evidence group. Discounted evidence coverage is explicitly not
conventional nDCG: a single passage can satisfy more than one required group.
Gold anchors are selected sufficient supports rather than exhaustive relevance
judgments, so an uncredited retrieval can still contain useful adjacent evidence.

The extraction audit exposed groups whose anchors legitimately cross chunk
boundaries. A secondary, explicitly exploratory collective score therefore
measures all required anchors across the returned top-five and top-ten context, restricted
to the same source/path and annotated coding span. It preserves the original
single-passage metrics and gold labels. This score is especially relevant to the
short-passage sensitivity lane; a small chunk must not be required to contain an
entire multi-paragraph answer by itself.

Hard negative questions concern absent information rather than random gibberish.
Report empty retrievals on these separately; retrieving an irrelevant passage is
not automatically a false generated answer, and zero retrievals are not proof of
correct model abstention. No paid model or automatic LLM judge is used.

Rank globally with a maximum of ten passage IDs and a top-five context budget
reported in characters, not falsely labeled model tokens. Query order is fixed.
Each query has one initial observation and three immediate warm repetitions.
Time only the actual API call with a monotonic clock; record startup, embedding,
ingest, storage and runtime metadata separately. Do not run competing measurement
processes concurrently. These are process-observed wall times; OS caches are not
evicted, and the initial query is not described as cold-disk latency. The four
samples are not four independent quality trials. Errors/timeouts remain visible.

Report Wilson 95% intervals for task-level hit proportions and paired task
outcome counts. Small clustered source families limit inference even with an
interval; source and task-category slices take precedence over one aggregate.

Promotion requires no observed integrity/isolation regressions, a development
improvement in evidence coverage, and explicit holdout evaluation after tuning
freeze. Preserve remaining losses in accuracy, latency, disk and capability
rather than asserting dominance. Never add query-specific synonyms, gold IDs,
expected answers or corpus paths to product retrieval code.

## Reproduction

Use the pinned Bun/Aube project setup and `imports:setup`. Competitor Python
dependencies and local model weights use the separately pinned benchmark setup;
no account credentials or model APIs are needed. Reference checkout commits must
match the manifests and reviewed adapters. Result paths are exclusive and never
overwritten; use a fresh result label for each run.

```sh
aube run --no-install benchmark:memory prepare
aube run --no-install benchmark:memory teamagent --label teamagent-baseline
aube run --no-install benchmark:memory competitor-input
aube run --no-install benchmark:memory report RESULT_JSON --split dev --output NEW_REPORT_JSON
```

Runtime state and common passage bodies live in `.cache/memory-benchmark`.
Checked-in measurement artifacts belong in `data/benchmarks`; final interpretation
and reproduction commands belong beside this protocol. Normal repository checks
exercise evaluator fixtures, not the external corpus, model download or long
benchmark. Run these acceptance measurements explicitly after their prerequisites.
