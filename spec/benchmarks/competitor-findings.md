# Independent reference-system findings

Reviewed the frozen product against the retained main and 256-token sensitivity
reports on 2026-10-04. Held-out rankings were first inspected after
[`tuning-freeze.json`](../../data/benchmarks/tuning-freeze.json). No product changes
or new measurements were made during this review. These are evidence-retrieval
results, not verified coding-task completion or generated-answer accuracy.

The final product substantially improves the initial literal-AND baseline, but
does not dominate every reference. On all 74 answerable cases, main-lane
Teamagent hit@5 is 59/74 versus context-mode 58/74; on the 41 held-out answerable
cases context-mode leads 31/41 versus 30/41. The one-case difference is small,
and these authored cases are not a random sample of all agent work.

## Held-out quality and latency

Source: [main holdout report](../../data/benchmarks/reports/main-holdout.json).
Complete@5 means all required anchors recovered collectively across the first
five passages. Strict within-passage evidence scores remain separately available
in the reports.

| Main lane                  | Hit@5 | Complete@5 | MRR@10 | Warm P95 |
| -------------------------- | ----: | ---------: | -----: | -------: |
| Teamagent                  | 30/41 |      27/41 |  0.598 | 19.29 ms |
| context-mode               | 31/41 |      30/41 |  0.534 | 28.85 ms |
| MemPalace hybrid           | 27/41 |      28/41 |  0.565 | 79.25 ms |
| MemPalace lexical ablation | 28/41 |      24/41 |  0.532 | 84.96 ms |
| Chroma dense substrate     | 29/41 |      26/41 |  0.558 | 14.77 ms |

Teamagent generally places its first useful passage earlier than the references.
Context-mode has stronger complete evidence coverage, particularly on documents:
20/21 complete held-out document answers versus Teamagent 19/21. MemPalace hybrid
also has higher document MRR in the main all-case slice, 0.696 versus 0.688.
Chroma has the lowest measured query P95, with less complete evidence than the
leading lexical/hybrid modes. Its model setup and document embeddings are
additional costs, not included in query latency.

## Concrete remaining advantages

These examples are directly observable in the main held-out rankings, with no
claim that the underlying algorithm is solely responsible for every difference.

- `code-hermes-07`: context-mode, MemPalace hybrid and Chroma retrieve both the
  YAML precedence lookup and boolean-rejection branch in `agent/deadline.py`.
  Teamagent returns the lookup first but omits the rejection branch from its
  first five passages. Adjacent evidence coverage matters despite a good rank-1
  hit.
- `code-hermes-09`: context-mode includes both the `threading.Timer` creation
  and the cancellation-abandonment explanation. Teamagent retrieves the
  explanation but not the timer implementation at lines 324–353 within five.
- `code-pi-11`: MemPalace hybrid retrieves `packages/agent/src/agent.ts` lines
  347–376 at rank 2, containing the concurrent-prompt diagnostic and the
  `steer()`/`followUp()` alternatives. Chroma also finds it; Teamagent and
  context-mode miss it within ten. The query describes behavior without naming
  the diagnostic, making this a concrete semantic-recall advantage.
- `code-deepseek-08`: MemPalace hybrid retrieves both the ACP teardown call and
  its regression test. Teamagent has the implementation at rank 5 but misses
  the relevant test declaration; MemPalace lexical also covers both groups.
  This advantage therefore cannot be attributed exclusively to embeddings.
- `code-deepseek-11`: context-mode, hybrid and dense retrieval include both the
  empty-string provider-default constant and the conditional option branch.
  Teamagent ranks the branch well but fills other slots with tests and related
  implementation fragments, leaving the constant outside five.
- `doc-memento-02`: all references recover the paragraph joining the two
  information channels with the 15-percentage-point ablation at rank 4 or 5;
  Teamagent places it at rank 6. This one query explains the main holdout
  hit@5 difference between context-mode and Teamagent.

The development results had already exposed paraphrase and multiple-evidence
limitations. These held-out examples support a future evaluation of optional
semantic candidate retrieval and complementary-evidence selection. They are
diagnostics, not permission to tune against the now-open holdout. New policies
need a fresh evaluation split; project-specific terms or gold-derived boosts
would invalidate that comparison.

## The 256-token sensitivity changes the tradeoff

Source: [short holdout report](../../data/benchmarks/reports/short-holdout.json),
[main all-case report](../../data/benchmarks/reports/main-all.json), and
[short all-case report](../../data/benchmarks/reports/short-all.json).

The common main corpus has 3,700 passages; 3,296 exceed MiniLM's 256-token
ceiling. The sensitivity corpus has 7,401 passages with zero encoder truncation,
including source headers and special tokens. Questions and gold labels are
unchanged. Every engine receives the same shorter passages.

| Short lane, held-out       | Hit@5 | Complete@5 | Warm P95 |
| -------------------------- | ----: | ---------: | -------: |
| Teamagent                  | 27/41 |      24/41 | 21.12 ms |
| context-mode               | 27/41 |      26/41 | 37.57 ms |
| MemPalace hybrid           | 28/41 |      29/41 | 70.35 ms |
| MemPalace lexical ablation | 21/41 |      21/41 | 83.99 ms |
| Chroma dense substrate     | 25/41 |      22/41 | 14.76 ms |

Hybrid retrieval benefits most in complete evidence: 29/41 held-out cases,
including 20/21 documents, versus Teamagent 24/41 and 17/21. It recovers dispersed
DynamoDB read-protocol/latency anchors and the Disney advertising footnote that
Teamagent misses collectively within five shorter passages. Some strict scores
remain zero because all anchors no longer fit together in one passage; the
collective score is essential to interpreting those cases.

Short passages are not an unconditional quality improvement. Across all 74
answerable cases, Teamagent collective completeness falls 51→43, context-mode
52→43, and Chroma 46→33, while hybrid rises 49→50. The first-five context budget
also shrinks: Teamagent averages 6,939→4,142 characters. Fragmentation, duplicated
overlap and less evidence per result slot change the task alongside removal of
encoder truncation. Fixed top-k results therefore do not establish what would
happen under a fixed token-budget retrieval policy.

## Resources and audit

Raw sources: [`data/benchmarks/runs`](../../data/benchmarks/runs).
MB below are decimal. Peak RSS covers the full worker, including ingestion.

| Worker                         | Main→short ingestion | Main→short index/store | Main→short peak RSS |
| ------------------------------ | -------------------: | ---------------------: | ------------------: |
| Teamagent                      |        14.21→30.39 s |         24.89→28.66 MB |    251.23→254.99 MB |
| context-mode                   |        28.23→66.41 s |         36.46→42.08 MB |    192.93→195.58 MB |
| MemPalace/Chroma shared worker |       52.43→104.62 s |         50.06→57.29 MB |    829.40→816.73 MB |

Teamagent has the lowest measured ingestion time and retained store size;
context-mode has lower peak RSS. The Python modes share one encoder, index and
ingestion, so their reported cost must not be multiplied by three or treated as
the footprint of a standalone lexical-only installation. Their separately
measured runtime setup is 2.34/2.90 seconds. Initial model download/setup is
another recorded cost; model/dependency files are excluded from index sizes.

The independent raw audit checked every competitor run in both final lanes:
88 queries × four repetitions per mode, no errors, no unknown or duplicate
passage IDs, and no changed top-ten ordering. Input digests match between the
reference adapters for each lane; Teamagent's production code hashes match the
policy freeze. Reference source commits, model hashes, runtime versions and
resource scopes are retained. The three repeats measure timing/stability rather
than independent quality samples. Neither initial nor warm measurements claim
an evicted OS cache.

All systems return results for the 14 unanswerable cases. Empty-result behavior
is not answer abstention, and none of these scores establishes safe refusal or
factual answer generation. PDF anchors are scored by source/path and text;
the annotated physical page is provenance and is not independently enforced by
the evaluator. The parser audit also saw all PDF anchor availability before the
retrieval freeze, so the holdout is not a fully blind end-to-end parser test.

These runs cover two full reference memory products plus a lexical ablation and
a dense substrate. They do not establish superiority over graph memory,
LLM-generated facts, native code graphs, cross-session user memory, or other
unmeasured modes. The Python network guard rejects Python socket operations; it
is not an OS firewall for native extensions. See
[reference selection and setup](../benchmark-competitors.md) for full scope.
