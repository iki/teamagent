# ai-security

[Analysis home](../README.md) · 16 projects catalogued; 5 focused source/content reviews.

Screening entries provide identity and package evidence only. Source-reviewed entries explain the exact scope inspected; none is a runtime certification. See [methodology](../methodology.md).

## Category assessment

Complementary source, dependency, artifact, skill, and installed-environment inspection evidence.

Normalize findings while preserving analyzer scope and coverage. CodeQL supplies modeled dataflow paths; OSV Scanner supplies dependency evidence; Trivy addresses deployment artifacts; SkillSpector and ClawSecCheck contribute instruction-specific checks and honest incomplete-work ledgers. Bind assessments to immutable digests and keep runtime enforcement independent.

A clean scan is not proof of safety or prompt-injection immunity. Findings, reachability, and demonstrated exploitability differ. No penetration tests were run, and screened security projects have not earned a general maturity or efficacy recommendation.

Start with:

- [codeql](https://github.com/github/codeql) — [individual report](../projects/ai-security--codeql.md).
- [osv-scanner](https://github.com/google/osv-scanner) — [individual report](../projects/ai-security--osv-scanner.md).
- [trivy](https://github.com/aquasecurity/trivy) — [individual report](../projects/ai-security--trivy.md).
- [skillspector](https://github.com/NVIDIA/SkillSpector) — [individual report](../projects/ai-security--skillspector.md).
- [clawseccheck](https://github.com/gl0di/clawseccheck) — [individual report](../projects/ai-security--clawseccheck.md).

## Project catalogue

| Project source | Individual report | Depth | Harness relevance / finding |
|---|---|---|---|
| [adrian](https://github.com/secureagentics/Adrian) | [Report](../projects/ai-security--adrian.md) | screened | Inventory / README only; implementation not independently established. |
| [aisoc](https://github.com/beenuar/AiSOC) | [Report](../projects/ai-security--aisoc.md) | screened | Inventory / README only; implementation not independently established. |
| [bumblebee](https://github.com/perplexityai/bumblebee) | [Report](../projects/ai-security--bumblebee.md) | screened | Inventory / README only; implementation not independently established. |
| [clawseccheck](https://github.com/gl0di/clawseccheck) | [Report](../projects/ai-security--clawseccheck.md) | source-reviewed | Adopt phase/coverage ledger semantics; configuration grades and pending adjudication are not proven runtime security. |
| [codeql](https://github.com/github/codeql) | [Report](../projects/ai-security--codeql.md) | source-reviewed | Use language-aware query findings as evidence, with extraction and coverage limits; not a universal security verdict. |
| [codex-security](https://github.com/openai/codex-security) | [Report](../projects/ai-security--codex-security.md) | screened | Inventory / README only; implementation not independently established. |
| [cpguard](https://github.com/KimJeju/cpguard) | [Report](../projects/ai-security--cpguard.md) | screened | Inventory / README only; implementation not independently established. |
| [deepsec](https://github.com/vercel-labs/deepsec) | [Report](../projects/ai-security--deepsec.md) | screened | Inventory / README only; implementation not independently established. |
| [fengarde](https://github.com/supermhel/fengarde) | [Report](../projects/ai-security--fengarde.md) | screened | Inventory / README only; implementation not independently established. |
| [ghidra](https://github.com/NationalSecurityAgency/ghidra) | [Report](../projects/ai-security--ghidra.md) | screened | Inventory / README only; implementation not independently established. |
| [mantis](https://github.com/google/mantis) | [Report](../projects/ai-security--mantis.md) | screened | Inventory / README only; implementation not independently established. |
| [osv-scanner](https://github.com/google/osv-scanner) | [Report](../projects/ai-security--osv-scanner.md) | source-reviewed | Dependency vulnerability evidence with explicit language/source gates for call analysis. |
| [osv.dev](https://github.com/google/osv.dev) | [Report](../projects/ai-security--osv.dev.md) | screened | Inventory / README only; implementation not independently established. |
| [paper.2604.security.many-ih](https://github.com/JHU-CLSP/ManyIH) | [Report](../projects/ai-security--paper.2604.security.many-ih.md) | screened | Inventory / README only; implementation not independently established. |
| [skillspector](https://github.com/NVIDIA/SkillSpector) | [Report](../projects/ai-security--skillspector.md) | source-reviewed | Strong reference for bounded static/semantic checks and explicit incomplete-inspection ledgers. |
| [trivy](https://github.com/aquasecurity/trivy) | [Report](../projects/ai-security--trivy.md) | source-reviewed | Useful common scanner surface for containers, filesystems, repositories, and SBOMs, with explicit artifact provenance. |
