# design.impeccable

Source: [design.impeccable](https://github.com/pbakaus/impeccable) · Category: [ai-skills](../categories/ai-skills.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `e103efe779e2dd01274dabae83531fef00bf2563`; commit timestamp `2026-10-03T00:25:32Z`; 3,389 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/pbakaus/impeccable/blob/e103efe779e2dd01274dabae83531fef00bf2563/README.md)):

> Design guidance for AI coding agents. 1 skill, 24 commands, live browser iteration, and 61 deterministic detector rules for AI-generated frontend design. Quick start:** From your project root, run `npx impeccable install`, then run `/impeccable init` inside your AI coding tool. Full docs: impeccable.style.

Build/package evidence: [Cargo.toml](https://github.com/pbakaus/impeccable/blob/e103efe779e2dd01274dabae83531fef00bf2563/Cargo.toml); [cli/platform-packages/darwin-arm64/package.json](https://github.com/pbakaus/impeccable/blob/e103efe779e2dd01274dabae83531fef00bf2563/cli/platform-packages/darwin-arm64/package.json); [cli/platform-packages/darwin-x64/package.json](https://github.com/pbakaus/impeccable/blob/e103efe779e2dd01274dabae83531fef00bf2563/cli/platform-packages/darwin-x64/package.json); [cli/platform-packages/linux-arm64/package.json](https://github.com/pbakaus/impeccable/blob/e103efe779e2dd01274dabae83531fef00bf2563/cli/platform-packages/linux-arm64/package.json); [cli/platform-packages/linux-x64/package.json](https://github.com/pbakaus/impeccable/blob/e103efe779e2dd01274dabae83531fef00bf2563/cli/platform-packages/linux-x64/package.json)

License evidence: [LICENSE](https://github.com/pbakaus/impeccable/blob/e103efe779e2dd01274dabae83531fef00bf2563/LICENSE) Classification hint: Apache-2.0. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-skills**. Its category places it in the candidate set for skills; those associations are navigational and have not been individually validated as implemented capabilities. See [skills](../skills.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

## Source update reviewed 2026-10-28

Reviewed commit: [`d34c87e1a00989ae8dbdd7f6b30b70f23319e860`](https://github.com/pbakaus/impeccable/commit/d34c87e1a00989ae8dbdd7f6b30b70f23319e860). Scope: Full Rust skills entry module and doctor/hooks references read. Signature verifier, engine downloader, manifest writers, detector and host hook dispatch were not audited.

The [doctor reference](https://github.com/pbakaus/impeccable/blob/d34c87e1a00989ae8dbdd7f6b30b70f23319e860/skill/reference/doctor.md) separates tool-version drift, mechanical schema drift and truth drift; commit counts are activity evidence rather than proof that a design document is false. It also distinguishes a missing rule registry from a clean ignore list and identifies workspace platform inheritance as a separate diagnosis. These are useful evidence-reporting patterns, although automated repair behavior was not inspected.

The [hooks reference](https://github.com/pbakaus/impeccable/blob/d34c87e1a00989ae8dbdd7f6b30b70f23319e860/skill/reference/hooks.md) distinguishes per-edit reminders from completion passes, documents provider/platform gaps and explicitly says the engine runs with the agent's environment and network access. Its host lifecycle claims remain unverified here; a valid manifest or successful install is not proof that the host dispatched the event. The [entry module](https://github.com/pbakaus/impeccable/blob/d34c87e1a00989ae8dbdd7f6b30b70f23319e860/crates/skills/src/lib.rs) documents signed remote bundles and checksum-verified engines but leaves enforcement to unread modules, and describes unsigned local overrides as trusted development inputs. Adapt narrow, evidence-backed exceptions and explicit capability states without treating documentation as runtime isolation. No install, hook, native binary or tests were run.

## 2026-10-28 follow-up source review

Reviewed commit `8409a564d1baee90b2dde4f7a8f06288838e3921` (commit date `2026-10-28T16:49:23+08:00`), compared with `d34c87e1a00989ae8dbdd7f6b30b70f23319e860`. Earlier findings remain historical evidence.

**Scope:** Live manual-edit buffer removal/restoration branches and their changed fixture assertions; other generated skills and source apply paths remain outside scope. The complete changed-path inventory contains 120 paths. Citations below identify current lines visible in the captured committed diff; this is a scoped assessment, not a whole-repository audit.

Staging a remove over a copy edit retains the superseded operation, and removing staged operations by exact page URL plus element reference restores that prior operation while preserving other pages/references. The return value carries removed operations and count. Changed tests describe the restoration and isolation expectations; they were read, not run. [crates/live/src/manual_edits/buffer.rs](https://github.com/pbakaus/impeccable/blob/8409a564d1baee90b2dde4f7a8f06288838e3921/crates/live/src/manual_edits/buffer.rs#L124-L142); [crates/live/src/manual_edits/buffer.rs](https://github.com/pbakaus/impeccable/blob/8409a564d1baee90b2dde4f7a8f06288838e3921/crates/live/src/manual_edits/buffer.rs#L209-L251); [crates/live/src/manual_edits/buffer.rs](https://github.com/pbakaus/impeccable/blob/8409a564d1baee90b2dde4f7a8f06288838e3921/crates/live/src/manual_edits/buffer.rs#L304-L388).

This is an undo contract for the staged buffer. It does not demonstrate that a DOM/source edit was applied or reverted. A reusable harness needs target generation/content identity in addition to URL/reference before later application, and separate evidence for persistence atomicity and concurrent writers. Preserve the difference between staged, applied and independently verified outcomes.

**Verification limit:** static committed-source inspection only; no upstream code, tests, deployments or provider calls were executed. Imported instructions remain research data, and this review does not establish a Teamagent integration.

<!-- teamagent-analysis:start -->
Analysis metadata: source [design.impeccable](https://github.com/pbakaus/impeccable); analyzed commit `8409a564d1baee90b2dde4f7a8f06288838e3921`; commit date 2026-10-28T16:49:23+08:00; review date 2026-10-28T14:52:35.205Z; depth screened. [Maintenance record](../analyses/repos/ai-skills--design.impeccable.md).
<!-- teamagent-analysis:end -->
