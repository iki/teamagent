# Frozen coding evidence benchmark

The coding corpus in [`cases-code.json`](../../app/benchmark/cases-code.json)
contains 48 tasks grounded in four local reference repositories. The labels were
written by a separate source-inspection agent before that agent saw any retrieval
results. They evaluate evidence retrieval for coding work: finding behavior,
tracing configuration and lifecycle decisions, locating security checks, and
finding implementation plus regression evidence for a proposed change.

This is not a benchmark of completed code changes. Retrieving the right source
does not establish that an agent can produce a correct patch, pass its tests, or
avoid a regression. The stored `answerFacts` are reference facts for inspection;
they are not an LLM judge score or a claim of verified agent task completion.

## Source identity and coverage

All bytes were read with `git show <commit>:<path>` from the commits below. The
original reference checkouts were read only. Working-tree changes and untracked
files were excluded, not reset or copied into the benchmark.

| Repository       | Frozen commit                              | Selected / tracked files | Selected bytes | Selection                                                                                              |
| ---------------- | ------------------------------------------ | -----------------------: | -------------: | ------------------------------------------------------------------------------------------------------ |
| Hermes           | `3b9a963b8e5cdb804a422755bed9a60fcd778273` |               37 / 9,479 |      1,237,796 | Memory and context adapters, deadlines, file safety, supporting tools and focused tests                |
| Pi               | `200387122ca450d6387f033949423114a270b96c` |               47 / 1,859 |        841,736 | Agent runtime and tests, coding tools, compaction, session/configuration adapters and supporting types |
| Wayland          | `4c030c7b01c241df7b6e3535635a970f10d781af` |               40 / 9,138 |        493,741 | Shared capability, approval, adapter, API and activity code; remote transport and focused tests        |
| DeepSeek Harness | `5badb15009ae1756c3afe0ae0cef1faafc290ccc` |              55 / 14,208 |        804,803 | ACP bridge and tests; agent, loop, session and tool core modules                                       |

The total is **179 files and 3,378,076 bytes**. These are deliberately selected
subsystems, not whole-repository indexing. Each selection includes neighboring
code without labels to provide distractors. Binary assets, dependencies,
generated catalogs and lockfiles are outside the selection. Exact patterns and
the exhaustive chosen path list are in the JSON manifest; no files are silently
sampled or dropped after selection. Pattern matching uses Python `fnmatchcase`,
whose `*` also matches directory separators.

Each manifest entry records the committed file's SHA-256, byte length and line
count. Each repository records its root, commit, observed working-tree status,
tracked count, selection patterns and a manifest digest. The manifest digest is
SHA-256 of the UTF-8 encoding of the `files` array serialized with sorted object
keys, compact separators and unescaped Unicode. Reproduction must validate these
identities before staging or scoring; a changed source requires a new corpus
version, not accepting mismatched labels.

At capture, Pi and DeepSeek Harness were clean. Hermes had one unrelated modified
contributor email record. Wayland had an untracked resource configuration
directory. Exact status lines are retained in the JSON. Neither change enters
the selected committed corpus.

Every selected repository has fewer than 100 originals. Even an original plus
Markdown representation for every file remains below the current 256-file
capture limit, and the largest selected repository is below 2 MiB. Benchmark
staging should preserve repository-relative paths in separate repository roots.
Record importer warnings and verify all 179 expected original hashes and all
expected searchable derivatives before accepting the run. A partial import is
a coverage failure, not a faster successful ingestion.

## Task families and the frozen split

Each repository contributes six development and six holdout cases. Each split
has five answerable questions and one intentionally unanswerable question.
The result is 40 answerable and eight abstention cases. Questions were authored
from the implementation and focused regression files, without querying any
memory system or rewriting questions to favor a retrieval result.

| Repository       | Development family                                                                                  | Holdout family                                                               |
| ---------------- | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Hermes           | Provider schema normalization, recall isolation, profile context, bounded shutdown and registration | Deadline configuration, clamping, cancellation and file-write authority      |
| Pi               | Low-level tool argument handling, truncation, execution ordering and post-processing                | Stateful queues, continuation, idle completion, reset and concurrent prompts |
| Wayland          | Capability evidence validation, freshness, intersection and authority                               | Remote credential redaction, callback routing and approval cache semantics   |
| DeepSeek Harness | ACP MCP declaration validation and mounting                                                         | Prompt route pinning, session disposal, admission and model configuration    |

Splitting by behavior family reduces near-duplicate question leakage. Both
splits use the same repository corpus; this tests new questions and subsystem
families, not generalization to unseen repositories. Some dependency types and
shared context are necessarily present in both. The holdout labels live in a
reviewable local file and are not cryptographically hidden from the benchmark
implementation agent. They must remain unused for parameter tuning. If someone
tunes after inspecting a holdout result, subsequent numbers are an adaptive
evaluation on that set, not a new untouched holdout. Preserve every run and add
new independently labeled tasks before claiming fresh generalization.

The categories cover exact symbols, behavior described without its symbol name,
multi-file evidence, configuration, security and lifecycle. Several tasks need
two distinct code spans; multi-file cases explicitly require implementation plus
a regression or a collaborating module. Merely returning a file that mentions a
symbol should not receive full evidence credit.

## Label and scoring contract

Every case includes `id`, `split`, `repo`, `category`, `query`, `answerable`,
`evidence`, `answerFacts` and `rationale`. Evidence entries contain an exact
repository-relative `path`, one-based `lineStart` and `lineEnd`, and one or more
short exact source substrings in `contains`. The current labels use one
substring per evidence entry and no substring exceeds 200 characters. Spans
were calculated from the committed UTF-8 source. All listed evidence entries
are required; none is an optional alternative.

Freeze the task file before running a system. For an equal-context comparison,
provide the same committed source bytes and neutral passages to every backend,
then separately report any native-import experiment. Keep returned order and
apply the same result count, byte budget and duplicate handling. Store enough
returned text, source identity and passage coordinates to re-score the run.

Report at least:

- Evidence recall at fixed cutoffs and context budgets: the fraction of required
  evidence entries recovered with the correct source path and quoted span.
- All-required evidence success: every required span is present in the returned
  context. This matters for cross-file reasoning and must remain separate from
  any-one-hit recall.
- First relevant rank / reciprocal rank for answerable questions, plus path-only
  hit rate as a weaker diagnostic. A right path with an unrelated excerpt is not
  a supported answer.
- Results by repository, split and task category, as well as per-question paired
  differences. Small slice counts should remain visible beside percentages.
- Indexed coverage, ingest latency, first-query latency, warm serial query
  samples, storage size and externally required services/models/credentials.
  Do not combine cold startup and warm retrieval into a single speedup.

Use a checked source coordinate mapping when an adapter normalizes text. A
normalization difference must not excuse a wrong document or wrong span. For
quote-based scoring, apply a predefined whitespace normalization consistently
to labels and returned excerpts; do not add special cases after seeing results.
Report both strict quote coverage and any weaker source-line overlap measure.

The development abstention cases request absent APIs or transport capabilities.
The holdout abstention cases request absent production measurements using
plausible domain words. The latter deliberately distinguish relevant source
retrieval from evidence sufficient to answer the question. A system may return
related code while correctly saying that a production statistic is unavailable.
Therefore empty-result rate is only a retrieval diagnostic; it is not answer
abstention accuracy. A generation benchmark must separately verify that no
unsupported API, option or numerical measurement was invented.

## Extending to actual coding-agent outcomes

The current questions make the evidence-gathering step reproducible without
paid inference or executing the reference projects. A follow-on coding trial
should freeze small change requests, a known pre-change commit, hidden
acceptance checks and an identical agent/model budget. Run each memory condition
in a fresh isolated checkout with the same source access policy. Verify the
produced patch with independent behavioral tests, including a negative fixture
where the change is intentionally absent. Measure correctness, regressions,
tool calls, context bytes, latency and intervention rate separately from memory
retrieval. Do not count an agent's own completion claim as a passing task.

No such patch-completion trial or live production telemetry is implied by this
corpus. The benchmark runner and its result report describe the measurements
actually performed.

## Native acquisition and lifecycle lane

`app/benchmark/lifecycle.ts` separately exercises the real host API and source
adapter, rather than injecting neutral passages directly into storage. Run it
serially after other timed jobs, using the configured Bun runtime. It accepts
`--output <new-result.json>` and optional `--python <converter-interpreter>`;
the default result is `.cache/memory-benchmark/lifecycle-baseline.json`. Results
are created exclusively and never overwrite an earlier measurement. This lane
does not install dependencies.

The runner validates the manifest with Effect Schema, stages exact committed
bytes in an isolated system temporary directory and records native folder
imports for all four selected repositories. Original hashes, searchable
derivative coverage and survival of every gold source span are checked before
timing unchanged sync. This extraction audit includes both splits but never
runs their retrieval queries or exposes a holdout ranking result.

A separate planted-marker file exercises changed sync, immutable historical
reads, search freshness, citation/version identity, deletion visibility and
workspace isolation. A local HTTP response that never finishes exercises actual
request cancellation, source publication atomicity and temporary cleanup. The
loopback allowance is explicit and limited to this isolated benchmark host.
The corpus reference files and staged source snapshots remain unchanged.

The full committed Pi repository is also attempted through the Git adapter,
with its root explicitly allowed. Its expected capacity rejection must leave
no partial source. The result distinguishes that limitation from successful
ingestion of the selected 47-file Pi subsystem. No whole-repository coverage is
claimed from a passing bounded-subsystem import.

Each stage records an individual elapsed time and completion status. These are
serial lifecycle samples on one machine, not p95/p99 estimates or production
SLAs. The result records the actual runtime, converter, hardware and manifest
hash. Temporary fixtures and private state are removed only after validating
their canonical containment within the runner-created temporary directory.
