# gastown

Source: [gastown](https://github.com/gastownhall/gastown) · Category: [ai-agents](../categories/ai-agents.md)

Original review depth: **inventory / README screening only**. The dated update review below has its own explicit scope. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `649b832b7672bc7a2dbef26f5983aba6198b819b`; commit timestamp `2026-07-23T09:03:02-04:00`; 1,563 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/gastownhall/gastown/blob/649b832b7672bc7a2dbef26f5983aba6198b819b/README.md)):

> Multi-agent orchestration system for Claude Code, GitHub Copilot, and other AI agents with persistent work tracking Gas Town is a workspace manager that lets you coordinate multiple AI coding agents (Claude Code, GitHub Copilot, Codex, Gemini, and others) working on different tasks. Instead of losing context when agents restart, Gas Town persists work state in git-backed hooks, enabling reliable multi-agent workflows.

Build/package evidence: [go.mod](https://github.com/gastownhall/gastown/blob/649b832b7672bc7a2dbef26f5983aba6198b819b/go.mod); [gt-model-eval/package.json](https://github.com/gastownhall/gastown/blob/649b832b7672bc7a2dbef26f5983aba6198b819b/gt-model-eval/package.json); [npm-package/package.json](https://github.com/gastownhall/gastown/blob/649b832b7672bc7a2dbef26f5983aba6198b819b/npm-package/package.json); [plugins/dolt-snapshots/go.mod](https://github.com/gastownhall/gastown/blob/649b832b7672bc7a2dbef26f5983aba6198b819b/plugins/dolt-snapshots/go.mod)

License evidence: [LICENSE](https://github.com/gastownhall/gastown/blob/649b832b7672bc7a2dbef26f5983aba6198b819b/LICENSE) Classification hint: MIT. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents**. Its category places it in the candidate set for agents, models, channels; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [models](../models.md) · [channels](../channels.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

## 2026-10-28 scoped update review

Reviewed commit `de2ce8efa7aa3b1ca942b39319c5f4bd5aeac1b1` (commit date `2026-10-25T21:39:22Z`). The original snapshot above remains historical evidence.

**Scope:** Complete 29-path change inventory; focused review of registry ownership changes, the new isolation fixture, and Dolt discovery. Dependency, image, telemetry and release changes outside these paths were not audited.

The registry now returns caller-owned snapshots instead of pointers into process-wide defaults. [Preset cloning](https://github.com/gastownhall/gastown/blob/de2ce8efa7aa3b1ca942b39319c5f4bd5aeac1b1/internal/config/agents.go#L613-L642) copies argument/process-name slices, environment maps and nested ACP/noninteractive settings; the initialization and getters use those copies. [The regression fixture](https://github.com/gastownhall/gastown/blob/de2ce8efa7aa3b1ca942b39319c5f4bd5aeac1b1/internal/config/registry_isolation_test.go#L34-L96) mutates returned fields and verifies both the registry and built-ins remain pristine, including after reset. Its test helper also prevents registry-mutating tests from running in parallel. These fixtures were inspected, not run.

This supports a Teamagent adapter-catalog requirement: negotiated capabilities and task-local overrides must not mutate the shared definition used by later workers. A lock around retrieval alone does not establish that property if the caller retains a mutable reference. [Dolt discovery](https://github.com/gastownhall/gastown/blob/de2ce8efa7aa3b1ca942b39319c5f4bd5aeac1b1/internal/deps/dolt.go#L21-L63) separately represents absent, too-old, failed execution and unparseable-version outcomes, with a ten-second process timeout. That is a useful readiness taxonomy, not proof of database availability or correct task recovery. **Disposition:** retain Gastown as a coordination reference; this review establishes neither its distributed lease semantics nor safe execution of opaque agents.

**Verification limit:** source inspection only; no upstream tests or provider calls were executed. This scoped review does not certify every file in the repository.

## 2026-10-28 follow-up source review

Reviewed commit `466aa41c83ee73b1fa0eb79eb9d172fb1eca9476` (commit date `2026-10-28T05:20:19Z`), compared with `de2ce8efa7aa3b1ca942b39319c5f4bd5aeac1b1`. Earlier findings remain historical evidence.

**Scope:** Four-path dependency/build-lock maintenance delta. The complete changed-path inventory contains 4 paths; the assessment below is limited to the cited branches.

The Go module updates platform, terminal, text, crypto/network and related dependency versions, while Nix refreshes its lock and vendor hash. See [go.mod](https://github.com/gastownhall/gastown/blob/466aa41c83ee73b1fa0eb79eb9d172fb1eca9476/go.mod#L29-L38), [go.mod](https://github.com/gastownhall/gastown/blob/466aa41c83ee73b1fa0eb79eb9d172fb1eca9476/go.mod#L238-L252) and [flake.nix](https://github.com/gastownhall/gastown/blob/466aa41c83ee73b1fa0eb79eb9d172fb1eca9476/flake.nix#L25-L37). There is no changed application implementation file in this inventory.

Keep the previous registry-copy/ownership analysis as historical runtime evidence. These dependency updates may affect behavior but were not installed, audited transitively or tested here; version movement alone establishes neither a security fix nor compatibility. Preserve both source SHA and dependency/build-lock identity for future reproducibility.

**Verification limit:** committed-source inspection only; no upstream code, tests or provider calls were executed. This review does not certify every changed file or establish a Teamagent integration.

<!-- teamagent-analysis:start -->
Analysis metadata: source [gastown](https://github.com/gastownhall/gastown); analyzed commit `466aa41c83ee73b1fa0eb79eb9d172fb1eca9476`; commit date 2026-10-28T05:20:19Z; review date 2026-10-28T14:29:27.414Z; depth screened. [Maintenance record](../analyses/repos/ai-agents--gastown.md).
<!-- teamagent-analysis:end -->
