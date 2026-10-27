# Security, execution boundaries, and evidence

The core rule is to keep user intent and authorization separate from model output, retrieved content, skill instructions, and tool results. The harness must enforce resource and action limits outside the language model. Scanners provide evidence; they do not replace runtime isolation or authenticated policy checks.

This is an architectural threat analysis, not a penetration test or a claim that the reviewed projects are secure. Recommendations below are grounded in specific source mechanisms and their stated trust assumptions.

## Boundaries that must remain explicit

| Boundary | Main failure modes | Required control |
|---|---|---|
| User/channel → task | Spoofed identity, replay, channel cross-talk | Authenticated principal, deduplicated event ID, tenant/task mapping |
| Resource → knowledge base | Prompt injection, poisoned memory, parser attacks, private URL fetch | Staging, provenance, parser limits, URL policy, data/instruction separation |
| Skill/plugin → runtime | Malicious instructions, dependency execution, excess permissions | Immutable package, inspection ledger, capability grant, sandbox |
| Agent → tool action | Unintended side effect, argument injection, repeated execution | Typed arguments, server policy, idempotency/reconciliation, audit |
| Worker → host/network | Filesystem escape, credential leakage, lateral movement | Enforced sandbox, scoped mounts, mediated egress, secret broker |
| Result → user/client | Executable generated UI, unsafe links, misleading completion | Output validation, trusted renderer, explicit partial/failed states |
| Evaluation → evolution | Reward hacking, leakage, unreviewed promotion | Held-out tasks, immutable evidence, signed/versioned promotion, rollback |

Import and memory concerns are developed in [import-generation](import-generation.md) and [memory](memory.md); skill lifecycle in [skills](skills.md); channel identity in [channels](channels.md).

## Execution classes

| Class | Intended work | Reference and limitation |
|---|---|---|
| Pure data operation | Parsing a bounded schema, ranking, safe transformations | Minimal trusted code; no external side effects |
| Interpreted shell/tool environment | Bounded text/data manipulation over staged files | [just-bash report](projects/ai-agents-sandbox--just-bash.md) · [GitHub](https://github.com/vercel-labs/just-bash): host hooks, runtime, dependencies are trusted |
| Restricted host process | Local coding agent in a selected workspace | [sandbox-runtime report](projects/ai-agents-sandbox--anthropic-sandbox-runtime.md) · [GitHub](https://github.com/anthropics/sandbox-runtime): verify platform setup and fail-closed enforcement |
| Disposable container/VM worker | Builds, parsers, native rendering, untrusted dependencies | [OpenSandbox report](projects/ai-agents-sandbox--opensandbox.md) · [GitHub](https://github.com/alibaba/OpenSandbox): strength depends on runtime/host configuration |
| Hosted sandbox adapter | User-selected remote execution | [E2B report](projects/ai-agents-sandbox--e2b.md) · [GitHub](https://github.com/e2b-dev/e2b): SDK behavior does not prove complete backend isolation |
| Browser/device session | UI-driven task or authorized test | [Artemis report](projects/ai-operate--artemis.md) · [GitHub](https://github.com/google/artemis): exclusive device ownership and state-aware retry |

Do not collapse these into one boolean called “sandboxed.” A worker advertises independently verified read/write, network, process, device, credential, and resource capabilities. A task chooses a class from its inputs and required operations. Unsupported restrictions cause refusal or rerouting, not an unrestricted fallback.

The inspected [sandbox-runtime Windows wrapper](projects/ai-agents-sandbox--anthropic-sandbox-runtime.md) ([GitHub](https://github.com/anthropics/sandbox-runtime)) includes a dedicated-user/WFP/ACL design and verification errors. That supports a Windows implementation path, but installation, enforcement, cancellation, cleanup, and machine-policy interactions still require actual host tests. [just-bash's threat model](projects/ai-agents-sandbox--just-bash.md) ([GitHub](https://github.com/vercel-labs/just-bash)) explicitly excludes malicious host hooks and compromised dependencies from its runtime protection.

## Authorization and credentials

Grant capabilities to a task principal with scope, expiry, and constraints. A capability should identify operation, target resources, account, allowed destination, maximum spend or resource budget where applicable, and whether a new user decision is required. The policy engine checks it at execution time; the model cannot extend it by generating a different prompt.

Store secrets in a vault/keychain and pass references through prompts and traces. Inject short-lived scoped credentials only into the adapter that needs them. Masking a string in logs is not sufficient if the entire worker can read unrelated credential files. Do not copy subscription tokens from discovered agents into a universal gateway; follow the supported route described in [models](models.md).

[Bifrost's per-call MCP credential resolution](projects/ai-agents-proxy--bifrost.md) ([GitHub](https://github.com/maximhq/bifrost)) and [OpenSandbox's credential/egress validation dependencies](projects/ai-agents-sandbox--opensandbox.md) ([GitHub](https://github.com/alibaba/OpenSandbox)) are useful mechanisms, but both remain sensitive trusted services. Validate tenant separation and redact headers/body fields before tracing.

## Untrusted content and memory

Every imported document, repository, image OCR result, browser page, and tool response is data with provenance. It can contain instructions describing an attack, a benign tutorial, or malicious commands; none acquires authority merely by being retrieved. Maintain source trust labels and separate evidence excerpts from the task's governing instructions.

Use a staged import pipeline with bounded archive expansion, file count/size limits, MIME detection, symlink rules, parser timeouts, and sanitized derived artifacts. Fetch URLs through an SSRF-aware service which revalidates redirects and resolved addresses. A URL allow-list alone is not a complete defense if DNS or redirects can change the destination. Knowledge-base writes should preserve lineage and permit rollback of a poisoned source and all derived memories.

[SkillSpector's coverage ledger](projects/ai-security--skillspector.md) ([GitHub](https://github.com/NVIDIA/SkillSpector)) supplies useful statuses for malformed archives, unsafe members, unresolved references, opaque content, and exceeded limits. Reuse this approach for import jobs, not only skills. A partial import should say exactly what was omitted.

## Complementary inspection tools

| Evidence type | Tool and source | Correct interpretation |
|---|---|---|
| Modeled source flow | [CodeQL report](projects/ai-security--codeql.md) · [GitHub](https://github.com/github/codeql) | A query's modeled source-to-sink path; extraction and language models constrain coverage |
| Dependency vulnerability | [OSV Scanner report](projects/ai-security--osv-scanner.md) · [GitHub](https://github.com/google/osv-scanner) | Package/commit match, with separately reported call-analysis applicability |
| Image/filesystem/SBOM | [Trivy report](projects/ai-security--trivy.md) · [GitHub](https://github.com/aquasecurity/trivy) | Findings on the actual artifact digest and selected scanner modes |
| Skill/plugin instruction and code | [SkillSpector report](projects/ai-security--skillspector.md) · [GitHub](https://github.com/NVIDIA/SkillSpector) | Static/semantic evidence plus explicit incomplete work |
| Installed environment and behavior | [ClawSecCheck report](projects/ai-security--clawseccheck.md) · [GitHub](https://github.com/gl0di/clawseccheck) | Layer/phase observations; pending judgment is not a clean pass |

Avoid one aggregate score that hides a critical finding behind many passing checks. A normalized finding record needs target digest, scanner/rule version, source span, category, severity, confidence, evidence, coverage, database/model timestamp, suppression, owner, and expiration. Distinguish vulnerability presence, reachable behavior, and demonstrated exploitability. Missing credentials, skipped analyzers, unavailable tools, and exceeded deadlines remain unknown/incomplete states.

## Safe side effects and retries

For file edits, use task workspaces, exact diffs, and conflict-aware promotion. For external actions, allocate an idempotency key where supported; otherwise inspect resulting state before retrying. Persist intent, authorization, dispatch, acknowledgement, and observed result separately. An interrupted connection is not proof that the action did not happen.

Streaming inference makes this particularly important: [LiteLLM's generated-content detection](projects/ai-agents-proxy--litellm.md) ([GitHub](https://github.com/BerriAI/litellm)) and [Bifrost's stream handling](projects/ai-agents-proxy--bifrost.md) ([GitHub](https://github.com/maximhq/bifrost)) are mechanisms to study, but the harness must retain responsibility for tool-side effect deduplication. UI/device actions from [Artemis](projects/ai-operate--artemis.md) ([GitHub](https://github.com/google/artemis)) often require state reconciliation because a tap has no transactional acknowledgement.

## Generated output and capability-limited UI

Use trusted renderers and schemas for generated interactive artifacts. [A2UI](projects/ai-gen--a2ui.md) ([GitHub](https://github.com/google/A2UI)) requires explicit strict validator configuration in the inspected path; [json-render](projects/ai-gen--json-render.md) ([GitHub](https://github.com/vercel-labs/json-render)) checks structural integrity but does not replace action authorization. Validate URLs and binds independently of component names.

Render arbitrary generated HTML, imported documents, media, and native code inside the appropriate worker. The [HyperFrames path checks](projects/ai-gen--hyperframes.md) ([GitHub](https://github.com/heygen-com/hyperframes)) and [VoiceStudio base-path contract](projects/ai-media--voicestudio.md) ([GitHub](https://github.com/debpalash/VoiceStudio)) are useful boundary examples, not proof that all browser/codec/engine inputs are safe.

## Evolution and release gates

Skill, prompt, router, parser, and model changes should enter an evaluation branch with immutable inputs and a held-out task set. Promote only when required correctness/security constraints pass and the intended benefit is observed within uncertainty bounds. Retain the previous version, record who or what approved promotion, and support immediate rollback. Self-improvement must not grant the candidate permission to modify its own evaluation criteria.

[ClawSecCheck's honest degradation states](projects/ai-security--clawseccheck.md) ([GitHub](https://github.com/gl0di/clawseccheck)) and [SkillSpector's inspection ledger](projects/ai-security--skillspector.md) ([GitHub](https://github.com/NVIDIA/SkillSpector)) should inform the release evidence format. [OBLITERATUS](projects/ai-model-edit--obliteratus.md) ([GitHub](https://github.com/elder-plinius/OBLITERATUS)) belongs outside ordinary production evolution; model intervention and refusal removal are not established proxies for harness usefulness.

## Required verification before deployment

Verify tenant/workspace separation, forged channel events, path traversal/symlinks, archive bombs, redirect/DNS private-address fetches, secret leakage through errors and media, unauthorized tool invocations, duplicate side effects after retry, cancellation/reaping, stale approval after artifact mutation, and incomplete-scan reporting. Use malicious fixtures in isolated test identities rather than real accounts. Measure false positives, missed known cases, escaped grants, and recovery time; publish limitations and coverage alongside the result. The target is a recoverable, observable system with enforced boundaries, not an unsupported claim of universal prompt-injection immunity.

<!-- coverage:start -->
## Project coverage

Every associated project has its own report. Source-reviewed associations reflect the inspected scope; screened associations derive from the input category and are not capability claims.

| Source | Report | Depth |
|---|---|---|
| [bifrost](https://github.com/maximhq/bifrost) | [Report](projects/ai-agents-proxy--bifrost.md) | source-reviewed |
| [cli-proxy-api](https://github.com/router-for-me/CLIProxyAPI) | [Report](projects/ai-agents-proxy--cli-proxy-api.md) | source-reviewed |
| [litellm](https://github.com/BerriAI/litellm) | [Report](projects/ai-agents-proxy--litellm.md) | source-reviewed |
| [anthropic-sandbox-runtime](https://github.com/anthropic-experimental/sandbox-runtime) | [Report](projects/ai-agents-sandbox--anthropic-sandbox-runtime.md) | source-reviewed |
| [e2b](https://github.com/e2b-dev/e2b) | [Report](projects/ai-agents-sandbox--e2b.md) | source-reviewed |
| [just-bash](https://github.com/vercel-labs/just-bash) | [Report](projects/ai-agents-sandbox--just-bash.md) | source-reviewed |
| [opensandbox](https://github.com/alibaba/OpenSandbox) | [Report](projects/ai-agents-sandbox--opensandbox.md) | source-reviewed |
| [a2ui](https://github.com/google/A2UI) | [Report](projects/ai-gen--a2ui.md) | source-reviewed |
| [hyperframes](https://github.com/heygen-com/hyperframes) | [Report](projects/ai-gen--hyperframes.md) | source-reviewed |
| [json-render](https://github.com/vercel-labs/json-render) | [Report](projects/ai-gen--json-render.md) | source-reviewed |
| [voicestudio](https://github.com/debpalash/VoiceStudio) | [Report](projects/ai-media--voicestudio.md) | source-reviewed |
| [obliteratus](https://github.com/elder-plinius/OBLITERATUS) | [Report](projects/ai-model-edit--obliteratus.md) | source-reviewed |
| [artemis](https://github.com/google/artemis) | [Report](projects/ai-operate--artemis.md) | source-reviewed |
| [clawseccheck](https://github.com/gl0di/clawseccheck) | [Report](projects/ai-security--clawseccheck.md) | source-reviewed |
| [codeql](https://github.com/github/codeql) | [Report](projects/ai-security--codeql.md) | source-reviewed |
| [osv-scanner](https://github.com/google/osv-scanner) | [Report](projects/ai-security--osv-scanner.md) | source-reviewed |
| [skillspector](https://github.com/NVIDIA/SkillSpector) | [Report](projects/ai-security--skillspector.md) | source-reviewed |
| [trivy](https://github.com/aquasecurity/trivy) | [Report](projects/ai-security--trivy.md) | source-reviewed |
<!-- coverage:end -->

<!-- analysis-additions:start -->
## Newly catalogued sources

These category-based links are discovery records, not reviewed capability or adoption claims. See [analysis maintenance](analyses/README.md).

- [rea](analyses/unreviewed/ai-security--rea.md) ([source](https://github.com/morluto/rea)).
<!-- analysis-additions:end -->

## Media training and recovery authority

The [media policy contract](media-training.md) and [runtime contract](media-runtime.md) apply before ranking and again before content upload, including voice enrollment. General/shared model improvement is distinct from the requested private clone. Unknown, stale or mismatched policy is blocked. A known training-permitted route requires the invocation's explicit `--allow-training`; backend/model overrides, stored priorities and plan JSON cannot grant it. This option never changes provider sharing settings. Scoped documentary exclusions require current account/key binding; user assertions remain assertions, and authentication alone proves no exclusion.

Backend lists and plans are passive. `media diagnose` performs explicit authenticated metadata requests. Voice consent, retention, cloud egress, commercial rights and training exclusion remain separate decisions. Local inference requires trusted provisioned resources; Python socket restrictions are not an OS firewall.

HeyGen mutations journal an encrypted receipt before submission. Responses preserve bounded redacted HTTP evidence and absent IDs as null. A completed artifact reference is encrypted before URL validation/download; public output discloses only a safe origin/path summary. Download recovery uses the reviewed exact HTTPS origin/path allowlist, no authorization or cookies, no redirects, bounded bytes/time, WAV integrity checks and atomic exclusive publication. It cannot synthesize again. Uncertain attempts require reconciliation; new filenames/keys do not authorize automatic retries. See the runtime contract for the narrower coverage of other adapters and expired URL recovery limits.

<!-- analysis-additions:start -->
## Newly catalogued sources

These category-based links are discovery records, not reviewed capability or adoption claims. See [analysis maintenance](analyses/README.md).

- [rea](analyses/unreviewed/ai-security--rea.md) ([source](https://github.com/morluto/rea)).
<!-- analysis-additions:end -->

## Source refresh: 2026-10-27

The [Emdash review](analyses/unreviewed/ai-agents--emdash.md) ([source](https://github.com/generalaction/emdash)) separates credential presence from authenticated readiness, and worktree ownership from execution isolation. Its explicit auto-approval option does not establish a safe Teamagent default. Imported repository-list headers are inert data; the owned inventory and executable updater have separate roles. Static article retention and conditional HTTP reuse preserve their own integrity checks without granting imported content execution authority. See [source maintenance](research-sync.md) and [source memory](memory-imports.md).
