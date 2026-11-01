# oh-my-hermes

Source: [oh-my-hermes](https://github.com/rlaope/oh-my-hermes) · [agents](../../agents.md) · [models](../../models.md) · [channels](../../channels.md).

Initial review: scoped source inspection of consent receipts and their lifecycle. Product-wide capabilities remain candidates. [Change evidence](../repos/ai-agents--oh-my-hermes.md).

## 2026-11-01 scoped source review

Reviewed frozen commit `5227afaa87d8cb32f08fb3aa65120cef62e3d899`. This is the first source review for this project.

The [README](https://github.com/rlaope/oh-my-hermes/blob/5227afaa87d8cb32f08fb3aa65120cef62e3d899/README.md) presents an operating layer around Hermes with model/skill routing, parallel DAG work and memory candidates. Those broad capabilities remain upstream claims in this initial review. The inspected [approval receipt module](https://github.com/rlaope/oh-my-hermes/blob/5227afaa87d8cb32f08fb3aa65120cef62e3d899/src/workflows/approval_receipts.py) is a concrete transferable design: consent binds action, exact scope pair, owner, run and safety revision, with separate refusal codes. Append-only supersession and revocation preserve prior records; a fixed one-hour window is evaluated at read time, distinct from storage retention. Record shape rejects execution/outcome claims, so approval, attempt and observed result remain separate evidence families.

The first 400 lines of [fixtures](https://github.com/rlaope/oh-my-hermes/blob/5227afaa87d8cb32f08fb3aa65120cef62e3d899/tests/test_approval_receipts.py) cover closed vocabulary, scope mismatches, expiry/revocation, future timestamps, unchanged predecessor bytes and self-cycle rejection. Minting reads and appends under an injected file lock and deduplicates a still-live identical decision; lock and storage internals were not audited. A nonthrowing mint path returns refused/not-written outcomes, which callers must not mistake for durable approval.

A safety caveat remains in the inspected module: ordinary receipt reading discards parse errors, and the satisfaction predicate accepts mappings without invoking the full receipt/store validator. A separate validator exists, but its mandatory execution at every action boundary was not established. Metadata labels and deterministic hashes do not authenticate that a human granted consent. Teamagent should require validated complete evidence, authenticated origin and current scope/policy checks before effects, preserve unknown read failures, and keep approval expiry separate from deletion policy. Error return values also need host redaction even when the failure sidecar applies a bounded projection.

**Coverage:** Read the complete 1,239-line approval module through three hash-verified source ranges, fixture lines 1–400 of 699 and README lines 1–88 of 373. Remaining concurrency/torn-tail fixtures, shared store/lock helpers, actual action-gate wiring, routing and memory implementation were not audited. This is the first source review for this project. Source inspection only; no upstream tests, source programs or live providers were executed. This is a scoped architecture review, not a whole-repository correctness or security certification.

<!-- teamagent-analysis:start -->
Analysis metadata: source [oh-my-hermes](https://github.com/rlaope/oh-my-hermes); analyzed commit `5227afaa87d8cb32f08fb3aa65120cef62e3d899`; commit date 2026-11-01T18:28:43+09:00; review date 2026-11-01T11:33:30.893Z; depth reviewed. [Maintenance record](../repos/ai-agents--oh-my-hermes.md).
<!-- teamagent-analysis:end -->
