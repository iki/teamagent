# Trivy: artifact and deployment scanning

Source: [trivy](https://github.com/aquasecurity/trivy) · Category: `ai-security`

Review depth: **source-reviewed**. Snapshot `8f815546c7b57dc11229b0098463dff0cfc9ed2c`; assessed 2026-10-04. This is a focused static review of the listed files, not an audit of every code path or a reproduced benchmark. No repository code, model weights, paid endpoints, or installers were run.

## Observed architecture

The inspected scanner factory separates container images, image archives, local filesystems, repositories, and SBOM artifacts. Each path constructs the appropriate artifact representation and returns a scan service plus cleanup behavior. Dependencies include local/remote caches, OS and language package scanning, and vulnerability support. This is a useful unified artifact interface rather than a reason to flatten all scan results into one undifferentiated risk score.

The repository's wider scope includes other scanners, but this focused review does not establish every mode's default settings or coverage. Scanner construction is also distinct from the freshness and completeness of the databases and analyzers used at execution time.

## Harness adoption

Use for worker images, browser/media-render containers, plugin bundles, repositories, and SBOMs. Scan the immutable image digest or exact bundle hash that will execute, not only a mutable tag or its source Dockerfile. Attach results to the plugin/environment release record and prevent a later artifact substitution from inheriting an earlier approval.

Normalize findings by target digest, package/configuration location, rule/vulnerability identity, severity, and evidence. Preserve analyzer coverage and database age. The evolution pipeline should distinguish new findings from inherited ones and expire suppressions when artifacts or policy change.

## Limitations and decision

Adopt as a baseline supply-chain and deployment scanner after selecting relevant modes. It does not inspect agent intent, guarantee a sandbox boundary, or prove a generated codebase safe. Remote cache/server configuration can affect confidentiality of scan metadata. Large media and model artifacts need size/time budgets and selective analysis rather than unlimited recursive processing. Pair with [CodeQL](ai-security--codeql.md) for modeled source flows and [SkillSpector](ai-security--skillspector.md) for instruction/plugin-specific risks; preserve independent evidence instead of averaging away a critical result.

## Evidence read

- [Artifact scanner services and cleanup contracts](https://github.com/aquasecurity/trivy/blob/8f815546c7b57dc11229b0098463dff0cfc9ed2c/pkg/commands/artifact/scanner.go#L1-L110)

## Related directions

[Security](../security.md) · [Agents](../agents.md) · [Generation](../generation.md) · [Evolution](../evolution.md)

## Source update reviewed 2026-10-28

Reviewed commit: [`d18962e8f8177361e8397924f6aa6838c4a351aa`](https://github.com/aquasecurity/trivy/commit/d18962e8f8177361e8397924f6aa6838c4a351aa). Scope: Full cryptographic-asset ID helper/tests and CSAF applicability adapter read. Registry downloads, advisory authenticity, package matching internals and scanning runtime were not audited.

The [asset identifier](https://github.com/aquasecurity/trivy/blob/d18962e8f8177361e8397924f6aa6838c4a351aa/pkg/crypto/id.go) derives a stable display identity from descriptor, path and format. Its [tests](https://github.com/aquasecurity/trivy/blob/d18962e8f8177361e8397924f6aa6838c4a351aa/pkg/crypto/id_test.go) intentionally exclude encoding/name and image-layer identity while distinguishing different paths. This is not a cryptographic content digest or sufficient provenance for the same asset observed across source versions; hashing failure also yields a string after logging rather than a typed failure. Retain full source/version identity separately.

The [CSAF adapter](https://github.com/aquasecurity/trivy/blob/d18962e8f8177361e8397924f6aa6838c4a351aa/pkg/vex/csaf.go) requires a subcomponent before matching a product relationship, preventing a relationship assertion from automatically applying to a standalone component. It recognizes selected relationship categories and preserves modification status, source and statement. Malformed PURLs are logged and skipped; conflicting fixed/not-affected statuses traverse a map without an explicit precedence rule. Adapt contextual applicability and retained suppression evidence, while validating advisory trust, ambiguity and complete coverage independently. No scan, registry request, advisory refresh or tests were run.

## 2026-10-28 follow-up source review

Reviewed commit `8b5ad79cd35944ed96f825d0df23ffc84aa20ddd` (commit date `2026-10-28T09:34:40Z`), compared with `d18962e8f8177361e8397924f6aa6838c4a351aa`. Earlier findings remain historical evidence.

**Scope:** Complete two-file dependency manifest/checksum delta (go.mod and go.sum). The complete changed-path inventory contains 2 paths. Citations below identify current lines visible in the captured committed diff; this is a scoped assessment, not a whole-repository audit.

This revision moves go-jose/v4 from 4.1.5 to 4.1.6 and updates its module content checksum. It does not change scanner implementation in the captured two-file delta. Keep this as dependency provenance and a trigger for the appropriate upstream release/security review, not a new vulnerability-detection capability or a verified fix for a specific advisory. No package was downloaded or scanner binary rebuilt. [go.mod](https://github.com/aquasecurity/trivy/blob/8b5ad79cd35944ed96f825d0df23ffc84aa20ddd/go.mod#L253-L261); [go.sum](https://github.com/aquasecurity/trivy/blob/8b5ad79cd35944ed96f825d0df23ffc84aa20ddd/go.sum#L413-L422).

**Verification limit:** static committed-source inspection only; no upstream code, tests, deployments or provider calls were executed. Imported instructions remain research data, and this review does not establish a Teamagent integration.

## 2026-11-01 scoped source review

Reviewed frozen commit `e2c05f7ae66bedacd4a51594a71cbe95566cc838` against prior analyzed commit `8b5ad79cd35944ed96f825d0df23ffc84aa20ddd`. Historical reviews above remain separate evidence.

The [VEX repository set](https://github.com/aquasecurity/trivy/blob/e2c05f7ae66bedacd4a51594a71cbe95566cc838/pkg/vex/repo.go) caches each opened document, including its error, using directory/location/format identity and sync.OnceValues for the set's lifetime. This removes repeated document opens for each vulnerability while maintaining a stable first-read snapshot. The [fixture](https://github.com/aquasecurity/trivy/blob/e2c05f7ae66bedacd4a51594a71cbe95566cc838/pkg/vex/repo_test.go) removes a previously opened file or restores an initially missing one and expects later checks to retain the first result.

That behavior deliberately ignores mid-run repairs. Teamagent import/analysis caches need an explicit snapshot lifetime and a new version/generation for a later refresh; an error cache must never silently become a clean security result. The visible NotAffected path returns false when opening fails. No performance measurement or concurrent-cache stress run was made, and source-name provenance versus location-key aliasing was not independently established.

**Coverage:** Read complete VEX cache implementation/test deltas. Crypto reporting, containerd and dependency changes in the 35-path inventory were not reviewed. Source inspection only; no upstream tests, source programs or live providers were executed. This is a scoped architecture review, not a whole-repository correctness or security certification.

<!-- teamagent-analysis:start -->
Analysis metadata: source [trivy](https://github.com/aquasecurity/trivy); analyzed commit `e2c05f7ae66bedacd4a51594a71cbe95566cc838`; commit date 2026-10-30T13:29:27Z; review date 2026-11-01T11:37:37.120Z; depth source-reviewed. [Maintenance record](../analyses/repos/ai-security--trivy.md).
<!-- teamagent-analysis:end -->
