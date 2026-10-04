# Retained memory benchmark evidence

Interpretation and reproduction: [results](../../spec/benchmarks/results.md).
Protocol: [methodology](../../spec/benchmarks/methodology.md).

- `runs/`: original per-query rankings, all four elapsed observations, errors,
  runtime/resource metadata and two native lifecycle runs. Files were copied
  byte-for-byte from their exclusive local measurement outputs.
- `reports/`: development, holdout and combined scores for the original-text,
  repaired-text and short-passage cohorts. Corpus identities are verified before
  scoring. Baseline reports include the original and retrieval-only Teamagent
  variants; repaired/short reports compare the same final product policy.
- `setup/`: exact Python wheel and local embedding-model provenance.
- `document-*.json`: extraction availability before/after and development parser
  validation; these are separate from retrieval scores.
- `tuning-freeze.json`: product/source hashes and explicit holdout limitations
  recorded before opening held-out retrieval rankings.
- `compiled-release-smoke.json`: rebuilt executable and reference PDF identity,
  successful import/read/search and unchanged-sync checks.
- `verification.json`: final repository and native acceptance results.
- `manifest.json`: corpus identities and SHA-256 inventory of these artifacts.

Results are immutable records of this run. New measurements need new filenames;
do not replace old observations with improved scores. Queries/corpus annotations
are in `app/benchmark/cases-*.json`; complete source bodies, PDFs, Python/model
installations and persistent test stores remain ignored local files. No third-party
PDF or model weights are redistributed here.

This is a local evidence-retrieval and source-lifecycle evaluation. It does not
establish generated-answer accuracy, autonomous code-change success or a global
ranking of all memory systems. See the report for remaining competitor advantages.
