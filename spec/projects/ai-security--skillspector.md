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

<!-- teamagent-analysis:start -->
Analysis metadata: source [skillspector](https://github.com/NVIDIA/SkillSpector); analyzed commit `35270064e42230dbc566e4134c55b5d581355db3`; commit date 2026-10-02T11:39:38-07:00; review date unknown; depth source-reviewed. [Maintenance record](../analyses/repos/ai-security--skillspector.md).
<!-- teamagent-analysis:end -->
