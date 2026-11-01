# SkillSpector: skill admission and inspection coverage

Source: [skillspector](https://github.com/NVIDIA/SkillSpector) · Category: `ai-security`

Review depth: **source-reviewed**. Snapshot `35270064e42230dbc566e4134c55b5d581355db3`; assessed 2026-10-04. This is a focused static review of the listed files, not an audit of every code path or a reproduced benchmark. No repository code, model weights, paid endpoints, or installers were run.

## Observed architecture

SkillSpector targets agent skill bundles. The inspected static runner handles multiple file types, security-oriented normalized text views, Python AST parsing, finding fingerprints, and bounded analysis windows. The ledger defines completed, partial, skipped, failed, and out-of-scope outcomes, with specific reasons for archive limits, unsafe members, unresolved references, unsupported content, parser limits, missing credentials, and semantic runtime failures.

That explicit accounting is its most transferable contribution. An empty finding list is not sufficient if a referenced script was not inspected, a zip exceeded limits, or a semantic call failed. Coverage is first-class evidence, rather than a footnote attached to a reassuring score.

## Harness adoption

Use during skill/plugin import and whenever the pinned bundle changes. Run deterministic checks first, then optional model-based semantic triage under a bounded budget. Preserve content hash, scanner/rule/model versions, findings, skipped content, references, and any signed publisher evidence. Present a decision based on risk and coverage, with a capability diff describing what installation would grant.

Admission should stage a bundle before activation and test its behavior in a disposable environment. Tune skills through held-out task evaluations; do not allow a skill to approve its own scanner exception or mutate the policy that gates its promotion.

## Limitations and decision

Shortlist as a default scanner adapter and borrow its ledger schema. Static rules can miss new attacks and flag benign examples; semantic analyzers can be manipulated or inconsistent. Scores and README prevalence claims were not independently reproduced. A signed or cleanly scanned skill is still untrusted instructions plus potentially executable content, so runtime capability limits remain necessary. [ClawSecCheck](ai-security--clawseccheck.md) offers complementary installed-environment and behavioral accounting patterns.

## Evidence read

- [Inspection ledger outcomes and omitted-work reasons](https://github.com/NVIDIA/SkillSpector/blob/35270064e42230dbc566e4134c55b5d581355db3/src/skillspector/inspection_ledger.py#L1-L110)
- [Static analyzer inputs and security text views](https://github.com/NVIDIA/SkillSpector/blob/35270064e42230dbc566e4134c55b5d581355db3/src/skillspector/nodes/analyzers/static_runner.py#L17-L130)

## Related directions

[Skills](../skills.md) · [Security](../security.md) · [Import Generation](../import-generation.md) · [Evolution](../evolution.md)

## Source update reviewed 2026-10-28

Reviewed commit: [`e7172462caf367736645f66c1aa154ca5f9c64dc`](https://github.com/NVIDIA/SkillSpector/commit/e7172462caf367736645f66c1aa154ca5f9c64dc). Scope: Full cleanup helper, analyzer graph and graph import-order regression tests read. Inspection ledger, analyzer semantics and input-handler ownership were not audited.

The [cleanup helper](https://github.com/NVIDIA/SkillSpector/blob/e7172462caf367736645f66c1aa154ca5f9c64dc/src/skillspector/cleanup.py) records temporary directories early enough to clean up interrupted graph runs, retries Windows read-only deletions only for permission errors and avoids chmod on links/junctions. However, prefix/type checks are not creation-ownership proofs, and cleanup_result accepts a string path without the tracker's checks. Teamagent should retain an unforgeable host-owned cleanup handle, validate containment at deletion and report residual artifacts rather than accept an arbitrary returned directory. This review does not establish whether untrusted input can reach those fields.

The [graph](https://github.com/NVIDIA/SkillSpector/blob/e7172462caf367736645f66c1aa154ca5f9c64dc/src/skillspector/graph.py) wraps analyzers in ledger guards and explicitly finalizes inspection coverage before reporting. Credential-independent graph construction is useful, but an analyzer whose is_available() returns false is still skipped; the unseen finalizer determines how that becomes visible. The [import-order tests](https://github.com/NVIDIA/SkillSpector/blob/e7172462caf367736645f66c1aa154ca5f9c64dc/tests/unit/test_graph_proxy.py) restore shared module/proxy state and check alternate import paths, protecting test isolation rather than scan accuracy. Adapt interruption cleanup and explicit analyzer-status accounting behind owned paths. No scan, provider, cleanup operation or tests were executed.

## 2026-11-01 scoped source review

Reviewed frozen commit `6d0b7c849949cab9181e57798247f89e48ce5d6a` against prior analyzed commit `e7172462caf367736645f66c1aa154ca5f9c64dc`. Historical reviews above remain separate evidence.

The [inspection finalizer](https://github.com/NVIDIA/SkillSpector/blob/6d0b7c849949cab9181e57798247f89e48ce5d6a/src/skillspector/nodes/finalize_inspection_ledger.py) propagates missing/partial/failed descendant coverage upward through inspected-container membership. It changes an apparently analyzed container to partial, updates references to that container and downgrades both complete and complete-with-caveats when coverage findings remain. The [new fixture](https://github.com/NVIDIA/SkillSpector/blob/6d0b7c849949cab9181e57798247f89e48ce5d6a/tests/nodes/test_finalize_inspection_ledger.py) specifically checks that a coverage finding cannot remain complete-with-caveats.

The parent propagation uses a visited set to avoid repeatedly processing an already incomplete ancestor, but the visible inventory precheck validates only list/dictionary/path shape before reading richer fields. Typed inventory validation and nested archive traversal remain separate upstream responsibilities. Adopt explicit coverage graphs for resource imports and skill inspection: successful traversal of an archive or successful analyzer execution must not imply every descendant was inspected. This fixture supports the caveat downgrade, not the entire container propagation algorithm or security-rule accuracy.

**Coverage:** Read the complete 144-line finalizer/fixture delta. Inventory producer schemas, linked-archive integration fixtures and analyzer semantics were not audited or executed. Source inspection only; no upstream tests, source programs or live providers were executed. This is a scoped architecture review, not a whole-repository correctness or security certification.

<!-- teamagent-analysis:start -->
Analysis metadata: source [skillspector](https://github.com/NVIDIA/SkillSpector); analyzed commit `6d0b7c849949cab9181e57798247f89e48ce5d6a`; commit date 2026-10-31T09:12:46-07:00; review date 2026-11-01T11:37:37.120Z; depth source-reviewed. [Maintenance record](../analyses/repos/ai-security--skillspector.md).
<!-- teamagent-analysis:end -->
