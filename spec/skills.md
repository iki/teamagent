# Skills: selective, portable, evaluated procedures

Teamagent should maintain one versioned skill registry, compile explicit variants for each harness, and load a small task-specific selection. Installation, discovery, activation, and successful execution are different states. A directory full of SKILL.md files is a useful interchange surface; it is not a complete capability or quality system.

This design is based on the source/content reviews linked below, inspected on 2026-10-04. “Recommended” means a design choice for Teamagent, not a reproduced benchmark claim. All project links identify upstream repositories; report links identify the evidence and limitations of this analysis. Related designs: [agents](agents.md), [models](models.md), [memory](memory.md), [import and generation](import-generation.md), [decisions](decisions.md), and [evolution](evolution.md).

## 1. What belongs in a skill

A skill is a reusable procedure with a bounded trigger, prerequisites, steps or executable implementation, and verifiable outputs. Reference knowledge, personal preferences, tools, task state, and procedures should be linked but stored separately. Importing a document creates knowledge; synthesizing a reliable procedure from it creates a candidate skill. A prompt discovered online is a candidate instruction, not an automatically trusted policy.

[Agent Skills][gh-spec] ([report][r-spec]) provides the portable SKILL.md layer and progressive loading conventions. [Skillware][gh-skillware] ([report][r-skillware]) demonstrates a different useful boundary: metadata, instructions, UI schema, dependencies, and executable implementation. The internal registry should represent both without pretending a Python plugin and a Markdown guide carry the same execution risk.

Use these conceptual objects:

| Object | Purpose | Mutability and ownership |
|---|---|---|
| Source package | Original skill directory and upstream attribution | Immutable snapshot, publisher/repository/ref/digest |
| Skill contract | Intent, trigger, negative scope, inputs, outputs, required capabilities | Versioned; reviewed by owner |
| Variant | A compiled or tuned implementation for a model/harness/environment | Immutable; derived from source and adapter versions |
| Evaluation suite | Trigger cases, task cases, forbidden effects, expected artifacts | Versioned separately; locked test partition |
| Activation binding | Approved variant selected for a workspace/task | Reversible; policy and scope recorded |
| Observation | Exposure, selection, execution, outcome, cost, correction | Append-only; trace-linked |

The identity is a publisher namespace plus package/skill name and digest. A display name alone is insufficient: unrelated publishers can use the same name, and a script change can alter behavior without changing the Markdown body.

## 2. Registry and skill compiler

The registry must contain enough structured information to select skills without reading their full bodies:

```yaml
skill_id: team/example-procedure
source:
  repository: https://github.com/example/skills
  revision: immutable-commit
  path: skills/example-procedure
  digest: sha256:...
  license: reviewed-license-id
contract:
  intent: bounded task outcome
  trigger_description: when this procedure helps
  negative_scope: [similar tasks requiring another procedure]
  input_schema: schema-reference
  output_schema: schema-reference
  required_capabilities: [repository.read, sandbox.execute]
  optional_capabilities: [agent.spawn]
  effects: [workspace.write]
variant:
  harness: adapter-id-and-version
  model: model-id-or-tested-family
  environment: platform-and-runtime-profile
  compiler_version: immutable-version
  parent_digest: sha256:...
evaluation:
  suite_digest: sha256:...
  status: candidate
  results: artifact-reference
```

These are proposed fields, not an assertion that any reviewed standard already mandates them. Secrets never belong in a package or manifest. A capability request must be checked against current task authorization and runtime policy; allowed-tools text cannot grant authority by itself.

[SkillKit][gh-skillkit] ([report][r-skillkit]) supplies a canonical-to-agent translation pattern. Its inspected translator can return success while reporting incompatible hooks separately. Therefore the compiler contract must distinguish `valid_format`, `required_capabilities_satisfied`, and `behavior_evaluated`. A required unsupported hook blocks that variant; an optional spawning feature can select a sequential implementation.

[Spec Kit][gh-speckit] ([report][r-speckit]) illustrates the practical complexity of Markdown/TOML command rendering and cross-platform escaping. Generated variants should be reproducible from a pinned source and compiler, with a diff showing every adaptation. Syntax conversion is cheap; behavioral portability needs evaluation. Do not use one large prompt rewritten informally for every model as the portability layer.

## 3. Discovery and installed-agent integration

[Vercel Skills][gh-vercel] ([report][r-vercel]) is the strongest direct reference here for broad agent-directory conventions and source/folder-hash locks. Reuse its ecosystem through an optional adapter. Its directory detection is only the first step in installed-agent discovery:

1. Identify a known executable, package, extension, service, or configuration directory through bounded probes.
2. Record installation identity, version, supported interfaces, and user-selected scope.
3. Run a read-only capability/health probe where supported. Distinguish available binary, active credentials, entitlement, structured events, tools, spawning, and cancellation.
4. Activate a skill variant only when its required capabilities match that installation.

Do not infer model access or subscription entitlement from a directory's existence. Do not copy credentials into the registry. Agent invocation and model entitlement remain in [agents](agents.md) and [models](models.md).

Discovery providers should include pinned Git repositories, selected local folders, curated catalogs, organization registries, and web indexes. [Cloudflare's discovery draft][gh-discovery] ([report][r-discovery]) provides a schema-versioned well-known endpoint; the reviewed v0.2 shape uses `/.well-known/agent-skills/index.json` and artifact digests. Preserve version negotiation because earlier drafts differ. [OpenAI Skills][gh-codex] ([report][r-codex]) supplies a concrete archive installer with path-containment checks and useful catalog content. Neither source establishes that downloaded scripts should execute during discovery.

Acquisition runs through `discover → fetch → verify bytes → inspect → classify → register candidate`. Updates create a new snapshot. They do not overwrite an active skill in place. Maintain a rollback pointer and show the source/resource diff that evaluation is accepting.

## 4. Select only what the task needs

Selection is a staged retrieval and decision problem:

1. **Eligibility filter:** workspace, tenant, source trust, license policy, effects, required tools, platform, model/harness compatibility, and freshness.
2. **Candidate retrieval:** exact IDs and lexical matches, then optional semantic retrieval over concise metadata. Keep source packages outside the prompt.
3. **Rerank:** estimate relevance, task success gain, overlap, uncertainty, latency, and context cost. Suppress near-duplicate bundles and incompatible procedures.
4. **Budgeted selection:** choose a bounded set under the task context/latency budget. Load the main body only for selected candidates; fetch supporting files on demand.
5. **Execution binding:** emit a skill selection/activation event, attach the selected digest, and enforce capability scopes.

[Context Hub][gh-context] ([report][r-context]) supplies a concrete BM25 metadata baseline, identifier matching, and local annotations. Begin with measured lexical retrieval rather than assuming embeddings solve exact library names. A semantic stage helps paraphrases but can introduce false positives around neighboring workflows.

A proposed objective is to maximize expected outcome gain minus token, latency, and risk costs, with diversity/coverage constraints. Coefficients and activation thresholds are workload-specific and must be calibrated; this is a Teamagent proposal rather than a measured algorithm winner. Use the decision framework in [decisions](decisions.md) to decide whether to load a skill, retrieve more evidence, run a cheap probe, or proceed directly. The empty selection must be a valid result.

Use explicit events for `eligible`, `retrieved`, `exposed`, `selected`, `loaded`, `executed`, and `outcome_verified`. [Codeburn][gh-codeburn] ([report][r-codeburn]) shows why this matters: it infers some skill reads from shell text, with acknowledged false positives. Compatibility adapters can use inference, but inferred use must not be treated as causal evidence that a skill helped.

## 5. Curated bundles, not a universal prompt stack

| Bundle | Candidate references | Select for | Important negative scope |
|---|---|---|---|
| Diagnose and repair | [Superpowers][gh-superpowers] ([report][r-superpowers]) | Reproducible failures needing causal diagnosis | Simple known edits; tasks with no defect to investigate |
| Evidence-based code understanding | [Trail of Bits][gh-tob] ([report][r-tob]) | Unfamiliar code, architecture analysis, audit preparation | Routine edits in already-understood code; premature vulnerability verdicts |
| Specification workflow | [Spec Kit][gh-speckit] ([report][r-speckit]), [OpenSpec][gh-openspec] ([report][r-openspec]) | Consequential changes with requirements and dependencies | Small reversible changes where ceremony exceeds benefit |
| Coordinated implementation | [Get Shit Done][gh-gsd] ([report][r-gsd]) | Multiple dependent plans with verifiable artifacts | Work too coupled for concurrent writes; host without reliable spawning |
| Reference retrieval | [Context Hub][gh-context] ([report][r-context]) | Version-sensitive API or package guidance | User-specific episodic recall without an appropriate source |
| Import-to-procedure | [Skill Seekers][gh-seekers] ([report][r-seekers]) | Turning selected source material into candidate procedures | Raw import treated as approved executable instructions |
| Prompt and media recipe search | [prompts.chat][gh-prompts] ([report][r-prompts]) | Explicit recipe discovery and candidate comparison | Automatically obeying returned community prompt content |

Bundle membership means discoverable related procedures. It does not mean all members become active at once. Each skill has its own digest, trigger tests, cost profile, and effects. Store an override as a derived variant instead of editing the publisher snapshot. An update to one bundle member should invalidate only affected compiled variants and evaluations.

## 6. Tune triggers and execution separately

[Agent Skills evaluation guidance][gh-spec] ([report][r-spec]) and [Superpowers' authoring method][gh-superpowers] ([report][r-superpowers]) both motivate baseline comparisons. Teamagent should test three layers independently:

| Layer | Example | Failure caught |
|---|---|---|
| Trigger precision/recall | “Update Excel formulas” must not load a CSV chart procedure | Keyword overlap mistaken for intent |
| Behavioral task result | Generate an artifact, validate contents, inspect rendering | Procedure followed but output wrong |
| Effects and constraints | Read-only analysis must not write project files | Skill instructions exceed task authority |

For a new skill, start with a small representative development set and near-miss negatives, then expand before broad promotion. Run baseline, upstream skill, and tuned variant under matched conditions. Repeat nondeterministic cases; report uncertainty and evaluator coverage. Include missing tools, denied operations, contradictory source documents, malformed files, multilingual prompts, and similar tasks that need no skill. A trigger test should observe a true activation event where possible rather than just a mention of the skill's name.

Variants may tune descriptions, examples, decomposition, explicit schemas, references, and tool sequencing for a model/harness tuple. They must preserve the task contract and policy constraints. [Agent-Opt][gh-opt] ([report][r-opt]) demonstrates bounded search over demonstrations, but its reviewed optimization path does not create an independent held-out evaluation set; Teamagent must enforce the split. See [evolution](evolution.md) for search budgets, promotion, and rollback.

## 7. Evolving procedures without degrading the library

[Autoharness][gh-auto] ([report][r-auto]) contributes the proposal-to-deterministic-promoter boundary, evidence ledger, probation, and reversible archive. [Everything Claude Code][gh-ecc] ([report][r-ecc]) contributes atomic instincts with project scope and evidence. Use both as candidate-generation patterns. Usage rates, observer confidence, or two-project occurrence are insufficient evidence of task improvement.

The active library follows `candidate → structurally valid → evaluated → canary → active → deprecated/archive`. Every transition records evidence and the responsible policy/version. Human-authored preferences remain distinguishable from inferred habits. A global promotion needs evidence across relevant independent projects; a project-specific convention should stay local. Rare recovery procedures can be protected from popularity-based pruning. Obsolete variants are archived with their lineage so old traces remain explainable.

Skill imports and generated scripts are a supply-chain boundary. Enforce archive/path/resource limits, source attribution, digest pinning, policy checks, and restricted execution. The runtime handles permissions; the skill supplies a procedure. [Skillware][gh-skillware] ([report][r-skillware]) is particularly instructive because loading a bundle can execute Python by default, while metadata-only inspection is a separate option.

## 8. Initial implementation and acceptance

Implement an immutable package store, registry, compiler interfaces, lexical selector, a small curated bundle, and structured activation telemetry first. Add semantic retrieval and automated tuning only after collecting real failures and measuring a baseline. Keep external managers optional so local/offline operation works.

Acceptance requires: deterministic registration from a pinned source; no script execution on discovery; rejection of required unsupported capabilities; bounded selected context; correct near-miss nonactivation; artifact-based task verification; complete provenance from tuned variant to source/evaluation; rollback to an earlier digest; and accurate isolation between users/projects. Latency and quality targets should be set after a baseline on the actual hardware, models, and tasks, rather than presented as unmeasured guarantees.

[gh-spec]: https://github.com/agentskills/agentskills
[r-spec]: projects/ai-agents-skills--docs.skills.md
[gh-skillware]: https://github.com/ARPAHLS/skillware
[r-skillware]: projects/ai-agents-skills--manage.skillware.md
[gh-skillkit]: https://github.com/rohitg00/skillkit
[r-skillkit]: projects/ai-agents-skills--search.skillkit.md
[gh-speckit]: https://github.com/github/spec-kit
[r-speckit]: projects/ai-spec--spec-kit.md
[gh-vercel]: https://github.com/vercel-labs/skills
[r-vercel]: projects/ai-agents-skills--search.vercel.md
[gh-discovery]: https://github.com/cloudflare/agent-skills-discovery-rfc
[r-discovery]: projects/ai-agents-skills--docs.2603.skills-discovery-rfc.cloudflare.md
[gh-codex]: https://github.com/openai/skills
[r-codex]: projects/ai-skills--agent-codex.md
[gh-context]: https://github.com/andrewyng/context-hub
[r-context]: projects/ai-skills--context-hub.andrewyng.md
[gh-codeburn]: https://github.com/getagentseal/codeburn
[r-codeburn]: projects/ai-agents-tokens--codeburn.md
[gh-superpowers]: https://github.com/obra/superpowers
[r-superpowers]: projects/ai-skills--plan.obra-superpowers.md
[gh-tob]: https://github.com/trailofbits/skills
[r-tob]: projects/ai-skills--security.trailofbits.md
[gh-openspec]: https://github.com/Fission-AI/OpenSpec
[r-openspec]: projects/ai-spec--openspec.md
[gh-gsd]: https://github.com/gsd-build/get-shit-done
[r-gsd]: projects/ai-spec--get-shit-done.md
[gh-seekers]: https://github.com/yusufkaraaslan/Skill_Seekers
[r-seekers]: projects/ai-agents-skills--create.skill-seekers.md
[gh-prompts]: https://github.com/f/prompts.chat
[r-prompts]: projects/ai-prompts--prompts.chat.md
[gh-opt]: https://github.com/future-agi/agent-opt
[r-opt]: projects/ai-prompts--xx-2604-agent-opt.md
[gh-auto]: https://github.com/tigerless-labs/autoharness
[r-auto]: projects/ai-agents-skills--evolve-claude.autoharness.md
[gh-ecc]: https://github.com/affaan-m/everything-claude-code
[r-ecc]: projects/ai-skills--bundle-claude.ecc.affaan-m.md

<!-- coverage:start -->
## Project coverage

Every associated project has its own report. Source-reviewed associations reflect the inspected scope; screened associations derive from the input category and are not capability claims.

| Source | Report | Depth |
|---|---|---|
| [ai.tanstack](https://github.com/tanstack/ai) | [Report](projects/ai-agents--ai.tanstack.md) | source-reviewed |
| [dspy](https://github.com/stanfordnlp/dspy) | [Report](projects/ai-agents--dspy.md) | source-reviewed |
| [hermes-agent](https://github.com/NousResearch/hermes-agent) | [Report](projects/ai-agents--hermes-agent.md) | source-reviewed |
| [metaharness](https://github.com/SuperagenticAI/metaharness) | [Report](projects/ai-agents--metaharness.md) | source-reviewed |
| [pi](https://github.com/earendil-works/pi) | [Report](projects/ai-agents--pi.md) | source-reviewed |
| [llm-wiki-compiler](https://github.com/atomicmemory/llm-wiki-compiler) | [Report](projects/ai-agents-mem--llm-wiki-compiler.md) | source-reviewed |
| [open-viking](https://github.com/volcengine/OpenViking) | [Report](projects/ai-agents-mem--open-viking.md) | source-reviewed |
| [admin.teamai-cli.tencent](https://github.com/Tencent/teamai-cli) | [Report](projects/ai-agents-skills--admin.teamai-cli.tencent.md) | screened |
| [create.book-to-skill](https://github.com/virgiliojr94/book-to-skill) | [Report](projects/ai-agents-skills--create.book-to-skill.md) | screened |
| [create.openapi-to-skills](https://github.com/neutree-ai/openapi-to-skills) | [Report](projects/ai-agents-skills--create.openapi-to-skills.md) | screened |
| [create.skill-seekers](https://github.com/yusufkaraaslan/Skill_Seekers) | [Report](projects/ai-agents-skills--create.skill-seekers.md) | source-reviewed |
| [docs.2603.skills-discovery-rfc.cloudflare](https://github.com/cloudflare/agent-skills-discovery-rfc) | [Report](projects/ai-agents-skills--docs.2603.skills-discovery-rfc.cloudflare.md) | source-reviewed |
| [docs.skills](https://github.com/agentskills/agentskills) | [Report](projects/ai-agents-skills--docs.skills.md) | source-reviewed |
| [evolve-claude.autoharness](https://github.com/tigerless-labs/autoharness) | [Report](projects/ai-agents-skills--evolve-claude.autoharness.md) | source-reviewed |
| [manage.skillware](https://github.com/ARPAHLS/skillware) | [Report](projects/ai-agents-skills--manage.skillware.md) | source-reviewed |
| [search.rosie](https://github.com/matthewp/rosie) | [Report](projects/ai-agents-skills--search.rosie.md) | screened |
| [search.skillkit](https://github.com/rohitg00/skillkit) | [Report](projects/ai-agents-skills--search.skillkit.md) | source-reviewed |
| [search.smithery](https://github.com/smithery-ai/cli) | [Report](projects/ai-agents-skills--search.smithery.md) | screened |
| [search.vercel](https://github.com/vercel-labs/skills) | [Report](projects/ai-agents-skills--search.vercel.md) | source-reviewed |
| [xx-2603-search.m13v](https://github.com/m13v/skill-registry) | [Report](projects/ai-agents-skills--xx-2603-search.m13v.md) | screened |
| [xx-2604-create.skr](https://github.com/andrewhowdencom/skr) | [Report](projects/ai-agents-skills--xx-2604-create.skr.md) | screened |
| [xx-2604-search.pica](https://github.com/onmyway133/pica) | [Report](projects/ai-agents-skills--xx-2604-search.pica.md) | screened |
| [codeburn](https://github.com/getagentseal/codeburn) | [Report](projects/ai-agents-tokens--codeburn.md) | source-reviewed |
| [hyperframes](https://github.com/heygen-com/hyperframes) | [Report](projects/ai-gen--hyperframes.md) | source-reviewed |
| [json-render](https://github.com/vercel-labs/json-render) | [Report](projects/ai-gen--json-render.md) | source-reviewed |
| [open-design](https://github.com/nexu-io/open-design) | [Report](projects/ai-gen--open-design.md) | source-reviewed |
| [prompt-master](https://github.com/nidhinjs/prompt-master) | [Report](projects/ai-prompts--prompt-master.md) | screened |
| [prompts.chat](https://github.com/f/prompts.chat) | [Report](projects/ai-prompts--prompts.chat.md) | source-reviewed |
| [system-prompts-and-models-of-ai-tools](https://github.com/x1xhlol/system-prompts-and-models-of-ai-tools) | [Report](projects/ai-prompts--system-prompts-and-models-of-ai-tools.md) | screened |
| [system-prompts-cl4r1t4s](https://github.com/elder-plinius/CL4R1T4S) | [Report](projects/ai-prompts--system-prompts-cl4r1t4s.md) | screened |
| [xx-2604-agent-opt](https://github.com/future-agi/agent-opt) | [Report](projects/ai-prompts--xx-2604-agent-opt.md) | source-reviewed |
| [repomix](https://github.com/yamadashy/repomix) | [Report](projects/ai-query--repomix.md) | source-reviewed |
| [adrian](https://github.com/secureagentics/Adrian) | [Report](projects/ai-security--adrian.md) | screened |
| [aisoc](https://github.com/beenuar/AiSOC) | [Report](projects/ai-security--aisoc.md) | screened |
| [bumblebee](https://github.com/perplexityai/bumblebee) | [Report](projects/ai-security--bumblebee.md) | screened |
| [clawseccheck](https://github.com/gl0di/clawseccheck) | [Report](projects/ai-security--clawseccheck.md) | source-reviewed |
| [codex-security](https://github.com/openai/codex-security) | [Report](projects/ai-security--codex-security.md) | screened |
| [cpguard](https://github.com/KimJeju/cpguard) | [Report](projects/ai-security--cpguard.md) | screened |
| [deepsec](https://github.com/vercel-labs/deepsec) | [Report](projects/ai-security--deepsec.md) | screened |
| [fengarde](https://github.com/supermhel/fengarde) | [Report](projects/ai-security--fengarde.md) | screened |
| [ghidra](https://github.com/NationalSecurityAgency/ghidra) | [Report](projects/ai-security--ghidra.md) | screened |
| [mantis](https://github.com/google/mantis) | [Report](projects/ai-security--mantis.md) | screened |
| [osv.dev](https://github.com/google/osv.dev) | [Report](projects/ai-security--osv.dev.md) | screened |
| [paper.2604.security.many-ih](https://github.com/JHU-CLSP/ManyIH) | [Report](projects/ai-security--paper.2604.security.many-ih.md) | screened |
| [skillspector](https://github.com/NVIDIA/SkillSpector) | [Report](projects/ai-security--skillspector.md) | source-reviewed |
| [agent-claude](https://github.com/anthropics/skills) | [Report](projects/ai-skills--agent-claude.md) | screened |
| [agent-codex](https://github.com/openai/skills) | [Report](projects/ai-skills--agent-codex.md) | source-reviewed |
| [agent-copilot](https://github.com/github/awesome-copilot) | [Report](projects/ai-skills--agent-copilot.md) | screened |
| [agent-typesafe](https://github.com/typesafe-ai/skills) | [Report](projects/ai-skills--agent-typesafe.md) | screened |
| [agents-agentmark](https://github.com/agentmark-ai/skills) | [Report](projects/ai-skills--agents-agentmark.md) | screened |
| [api-apify](https://github.com/apify/agent-skills) | [Report](projects/ai-skills--api-apify.md) | screened |
| [api-browser-act](https://github.com/browser-act/skills) | [Report](projects/ai-skills--api-browser-act.md) | screened |
| [auth-better](https://github.com/better-auth/skills) | [Report](projects/ai-skills--auth-better.md) | screened |
| [bundle-antigravity.guanyang](https://github.com/guanyang/antigravity-skills) | [Report](projects/ai-skills--bundle-antigravity.guanyang.md) | screened |
| [bundle-antigravity.vudovn](https://github.com/vudovn/antigravity-kit) | [Report](projects/ai-skills--bundle-antigravity.vudovn.md) | screened |
| [bundle-claude.ecc.affaan-m](https://github.com/affaan-m/everything-claude-code) | [Report](projects/ai-skills--bundle-claude.ecc.affaan-m.md) | source-reviewed |
| [bundle-claude.jezweb](https://github.com/jezweb/claude-skills) | [Report](projects/ai-skills--bundle-claude.jezweb.md) | screened |
| [bundle-claude.wshobson](https://github.com/wshobson/agents) | [Report](projects/ai-skills--bundle-claude.wshobson.md) | screened |
| [bundle-pi](https://github.com/badlogic/pi-skills) | [Report](projects/ai-skills--bundle-pi.md) | screened |
| [bundle-x-antigravity.sickn33](https://github.com/sickn33/antigravity-awesome-skills) | [Report](projects/ai-skills--bundle-x-antigravity.sickn33.md) | screened |
| [bundle.antfu](https://github.com/antfu/skills) | [Report](projects/ai-skills--bundle.antfu.md) | screened |
| [bundle.evilmartians](https://github.com/evilmartians/agent-skills) | [Report](projects/ai-skills--bundle.evilmartians.md) | screened |
| [bundle.framecoreworks](https://github.com/FrameCoreWorks/framecore-works-codex-chatgpt-workflow-kit) | [Report](projects/ai-skills--bundle.framecoreworks.md) | screened |
| [bundle.fstack](https://github.com/flaviocopes/fstack) | [Report](projects/ai-skills--bundle.fstack.md) | screened |
| [bundle.makerskills](https://github.com/coreyhaines31/makerskills) | [Report](projects/ai-skills--bundle.makerskills.md) | screened |
| [bundle.mindrally](https://github.com/Mindrally/skills) | [Report](projects/ai-skills--bundle.mindrally.md) | screened |
| [bundle.pskoett](https://github.com/pskoett/pskoett-ai-skills) | [Report](projects/ai-skills--bundle.pskoett.md) | screened |
| [bundle.tech-leads-club](https://github.com/tech-leads-club/agent-skills) | [Report](projects/ai-skills--bundle.tech-leads-club.md) | screened |
| [bundle.vasilyu83](https://github.com/vasilyu1983/AI-Agents-public) | [Report](projects/ai-skills--bundle.vasilyu83.md) | screened |
| [bundle.warp](https://github.com/warpdotdev/common-skills) | [Report](projects/ai-skills--bundle.warp.md) | screened |
| [code-agents.ijfw](https://gitlab.com/therealseandonahoe/agents-md) | [Report](projects/ai-skills--code-agents.ijfw.md) | screened |
| [context-hub.andrewyng](https://github.com/andrewyng/context-hub) | [Report](projects/ai-skills--context-hub.andrewyng.md) | source-reviewed |
| [data-prisma](https://github.com/prisma/skills) | [Report](projects/ai-skills--data-prisma.md) | screened |
| [deploy-cloudflare](https://github.com/cloudflare/cloudflare-docs) | [Report](projects/ai-skills--deploy-cloudflare.md) | screened |
| [deploy-pulumi](https://github.com/pulumi/agent-skills) | [Report](projects/ai-skills--deploy-pulumi.md) | screened |
| [deploy-vercel](https://github.com/vercel-labs/agent-skills) | [Report](projects/ai-skills--deploy-vercel.md) | screened |
| [design.hallmark](https://github.com/nutlope/hallmark) | [Report](projects/ai-skills--design.hallmark.md) | screened |
| [design.impeccable](https://github.com/pbakaus/impeccable) | [Report](projects/ai-skills--design.impeccable.md) | screened |
| [design.modern-web-guidance.google](https://github.com/GoogleChrome/modern-web-guidance-src) | [Report](projects/ai-skills--design.modern-web-guidance.google.md) | screened |
| [design.styler](https://github.com/TidyFactor/Styler) | [Report](projects/ai-skills--design.styler.md) | screened |
| [design.taste](https://github.com/Leonxlnx/taste-skill) | [Report](projects/ai-skills--design.taste.md) | screened |
| [design.ui-ux-pro-max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) | [Report](projects/ai-skills--design.ui-ux-pro-max.md) | screened |
| [desktop-electrobun.rajavijayach](https://github.com/rajavijayach/electrobun-skills) | [Report](projects/ai-skills--desktop-electrobun.rajavijayach.md) | screened |
| [game-claude.studios](https://github.com/Donchitos/Claude-Code-Game-Studios) | [Report](projects/ai-skills--game-claude.studios.md) | screened |
| [kb.obsidian](https://github.com/kepano/obsidian-skills) | [Report](projects/ai-skills--kb.obsidian.md) | screened |
| [list.voltagent](https://github.com/VoltAgent/awesome-agent-skills) | [Report](projects/ai-skills--list.voltagent.md) | screened |
| [mobile-expo](https://github.com/expo/skills) | [Report](projects/ai-skills--mobile-expo.md) | screened |
| [node-cli](https://github.com/lirantal/nodejs-cli-apps-best-practices) | [Report](projects/ai-skills--node-cli.md) | screened |
| [node.mcollina](https://github.com/mcollina/skills) | [Report](projects/ai-skills--node.mcollina.md) | screened |
| [optimize-caveman](https://github.com/JuliusBrussee/caveman) | [Report](projects/ai-skills--optimize-caveman.md) | screened |
| [plan.addyosmani](https://github.com/addyosmani/agent-skills) | [Report](projects/ai-skills--plan.addyosmani.md) | screened |
| [plan.conducty](https://github.com/robertbarclayy/conducty) | [Report](projects/ai-skills--plan.conducty.md) | screened |
| [plan.loop-engineering](https://github.com/cobusgreyling/loop-engineering) | [Report](projects/ai-skills--plan.loop-engineering.md) | screened |
| [plan.mattpocock](https://github.com/mattpocock/skills) | [Report](projects/ai-skills--plan.mattpocock.md) | screened |
| [plan.obra-superpowers](https://github.com/obra/superpowers) | [Report](projects/ai-skills--plan.obra-superpowers.md) | source-reviewed |
| [plan.step-beyond](https://github.com/aievolutionpl/step-beyond) | [Report](projects/ai-skills--plan.step-beyond.md) | screened |
| [plan.uncle-bob.robert-hoffman](https://github.com/robert-hoffmann/uncle-bob) | [Report](projects/ai-skills--plan.uncle-bob.robert-hoffman.md) | screened |
| [query-last30days](https://github.com/mvanhorn/last30days-skill) | [Report](projects/ai-skills--query-last30days.md) | screened |
| [security-reverse.reverse](https://github.com/zhaoxuya520/reverse-skill) | [Report](projects/ai-skills--security-reverse.reverse.md) | screened |
| [security.mukul975](https://github.com/mukul975/Anthropic-Cybersecurity-Skills) | [Report](projects/ai-skills--security.mukul975.md) | screened |
| [security.trailofbits](https://github.com/trailofbits/skills) | [Report](projects/ai-skills--security.trailofbits.md) | source-reviewed |
| [seo.toprank](https://github.com/nowork-studio/toprank) | [Report](projects/ai-skills--seo.toprank.md) | screened |
| [seogeo.aaron-he-zhu](https://github.com/aaron-he-zhu/seo-geo-claude-skills) | [Report](projects/ai-skills--seogeo.aaron-he-zhu.md) | screened |
| [text-humanizer.blader](https://github.com/blader/humanizer) | [Report](projects/ai-skills--text-humanizer.blader.md) | screened |
| [typesafe-sdk-python](https://github.com/typesafe-ai/typesafe-sdk-python) | [Report](projects/ai-skills--typesafe-sdk-python.md) | screened |
| [xx-2601-desktop-tauri.dchuk](https://github.com/dchuk/claude-code-tauri-skills) | [Report](projects/ai-skills--xx-2601-desktop-tauri.dchuk.md) | screened |
| [xx-2602-bundle-claude.padak](https://github.com/padak/claude-code-kit) | [Report](projects/ai-skills--xx-2602-bundle-claude.padak.md) | screened |
| [xx-2603-apps-google-workspace.cli](https://github.com/googleworkspace/cli) | [Report](projects/ai-skills--xx-2603-apps-google-workspace.cli.md) | screened |
| [xx-2603-bundle.command-code-ai](https://github.com/CommandCodeAI/agent-skills) | [Report](projects/ai-skills--xx-2603-bundle.command-code-ai.md) | screened |
| [xx-2603-bundle.oakoss](https://github.com/oakoss/agent-skills) | [Report](projects/ai-skills--xx-2603-bundle.oakoss.md) | screened |
| [xx-2603-cli-agents.jpoehnelt](https://github.com/jpoehnelt/skills) | [Report](projects/ai-skills--xx-2603-cli-agents.jpoehnelt.md) | screened |
| [xx-2603-framework-astro.briantbr](https://github.com/briantbr/astro-best-practices) | [Report](projects/ai-skills--xx-2603-framework-astro.briantbr.md) | screened |
| [xx-2604-agent-minimax](https://github.com/MiniMax-AI/skills) | [Report](projects/ai-skills--xx-2604-agent-minimax.md) | screened |
| [xx-2604-assets-icons.better](https://github.com/better-auth/better-icons) | [Report](projects/ai-skills--xx-2604-assets-icons.better.md) | screened |
| [xx-2604-bundle-oz](https://github.com/warpdotdev/oz-skills) | [Report](projects/ai-skills--xx-2604-bundle-oz.md) | screened |
| [xx-2604-code-karpathy.multica](https://github.com/multica-ai/andrej-karpathy-skills) | [Report](projects/ai-skills--xx-2604-code-karpathy.multica.md) | screened |
| [xx-2604-framework-astro.delineas](https://github.com/delineas/astro-framework-agents) | [Report](projects/ai-skills--xx-2604-framework-astro.delineas.md) | screened |
| [xx-2604-optimize-cove](https://github.com/r9000labs/cove) | [Report](projects/ai-skills--xx-2604-optimize-cove.md) | screened |
| [xx-2604-plan-karpathy-claude.forestchang](https://github.com/forrestchang/andrej-karpathy-skills) | [Report](projects/ai-skills--xx-2604-plan-karpathy-claude.forestchang.md) | screened |
| [xx-2604-text-humanizer-cz.bejek](https://github.com/bejek/humanizer-czech) | [Report](projects/ai-skills--xx-2604-text-humanizer-cz.bejek.md) | screened |
| [design.md](https://github.com/google-labs-code/design.md) | [Report](projects/ai-spec--design.md.md) | screened |
| [get-shit-done](https://github.com/gsd-build/get-shit-done) | [Report](projects/ai-spec--get-shit-done.md) | source-reviewed |
| [openspec](https://github.com/Fission-AI/OpenSpec) | [Report](projects/ai-spec--openspec.md) | source-reviewed |
| [openspec-vscode](https://github.com/AngDrew/openspec-vscode) | [Report](projects/ai-spec--openspec-vscode.md) | screened |
| [spec-kit](https://github.com/github/spec-kit) | [Report](projects/ai-spec--spec-kit.md) | source-reviewed |
| [speculate](https://github.com/jlevy/speculate) | [Report](projects/ai-spec--speculate.md) | screened |
| [techsio.ontos](https://github.com/TechsioCZ/ontos) | [Report](projects/ai-spec--techsio.ontos.md) | screened |
| [trellis](https://github.com/mindfold-ai/Trellis) | [Report](projects/ai-spec--trellis.md) | screened |
<!-- coverage:end -->
