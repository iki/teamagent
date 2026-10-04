# Scope, evidence and limitations

[Home](README.md) · [Evaluation plan](evaluation.md) · [Coverage data](data/coverage.json)

## What was analyzed

The census covers every direct project directory in the 19 requested source categories: 507 checkouts and 503 distinct upstream origin URLs. There are 507 individual reports and 19 category assessments/indexes. Eight main directions synthesize the requested architecture; supporting documents cover contracts, requirements, evaluation, security and delivery sequence. Two inputs use GitHub Gists and one uses GitLab; their original sources are retained because no GitHub repository mirror was verified.

The review used two depths deliberately and labels them throughout:

| Depth | Count | What it establishes |
|---|---:|---|
| Focused source/content review | 91 | Selected implementation functions, interfaces, tests, skill content or design documents were inspected; exact evidence and caveats are in the report |
| Inventory/README screening | 416 | Git identity/revision, tracked-path count, package manifests, root license evidence and automatically extracted README description |

The 91 focused reviews include one explicitly design-only wiki report. Other documentation/skill repositories also contain instructional source rather than runtime code; their reports describe that evidence. “Source-reviewed” does not mean the entire codebase was audited. Some reviews intentionally examine a narrow interface or algorithm. Screening records do not claim independently verified capabilities or adoption fitness.

Priority selection favored a direct fit to the requested requirements, inspectable integration boundaries, distinctive algorithms and contrasting approaches. It was not a systematic performance ranking, popularity ranking or exhaustive defect search. The unreviewed implementation remainder is visible in every category, not hidden by the total project count.

## Evidence hierarchy

1. **Inventory evidence:** repository identity, immutable commit and build/license file presence.
2. **Documented claims:** README/design/skill content, clearly attributed as claims or procedures.
3. **Inspected implementation:** actual cited source behavior within the reviewed scope.
4. **Executed evidence:** tests/benchmarks run under a recorded configuration. Not collected in this analysis.
5. **Operational evidence:** reliability/security/quality under real workload and adversarial conditions. Not collected in this analysis.

Source comments and type declarations establish intended contracts; they do not alone prove runtime behavior. Tests read as source establish intended cases, not that those tests passed. Code or demo performance claims are not promoted to reproduced results. Design recommendations and proposed performance budgets are labeled as such.

## Snapshot and source identity

Origins and HEAD revisions were read from the local checkouts without fetching or modifying them. Reports pin GitHub file references to the recorded commit; the validator checks referenced files, line bounds and consistency with that commit in the local checkout. This does not guarantee that every commit is publicly reachable, remains hosted, or matches an upstream's newest release.

Some origins redirect after a project rename. The original origin is the reproducible identity used in the census; selected reports may mention a verified canonical redirect. Four origins occur twice in the input categories: Awesome LLM Apps, OpenClaude, Context Hub and Book-to-Skill. These remain separate checkout records and are not four independent ecosystem implementations.

License hints come from root file text and are not a full legal/dependency audit. Model weights, bundled assets, vendored code and individual packages may have separate terms. Do not select copied or unclear-provenance material for implementation reuse based on a catalog entry alone.

The pre-existing generated notes in [resources](../resources/README.md) were discovered as background material. They were not treated as authoritative source evidence or copied into the new analysis as verified conclusions.

## Current external documentation checks

Time-sensitive or niche integration details were checked against selected primary sources: official OpenAI subscription/app-server documentation, the ACP and MCP specifications, TypeSafe decision-model documentation, and upstream pages cited in individual reviews. Citations are placed with the claims they support. Local commit inspection remains the basis for project implementation findings; not every project was rechecked against its latest online state.

The official subscription route is documented in [models](models.md), protocol boundaries in [agents](agents.md), and Jev semantics in [decisions](decisions.md). All access and capability assumptions must be rechecked when implementation begins.

## Validation performed

The automated validator checks local Markdown targets, every catalog report/category, report links from associated topics, GitHub commit/file/line anchors mapped to the census, and cited-file differences against the pinned revision. Independent review also checked architectural consistency and identified/fixed weak guarantees around opaque external-agent effects, multi-replica state ownership and skill deactivation.

Read [validation results](data/validation.json) for exact final counts and issues. These are document/evidence consistency checks, not an audit of every semantic conclusion. No repository test suite, model call, package installation, media generation or account authentication probe was performed. A passive PATH command-name scan is explicitly limited to this execution environment in [agents](agents.md).

## Reproduction and maintenance

From the project folder, with the same sibling category layout available:

```text
python spec/tools/inventory.py
python spec/tools/build_catalog.py
python spec/tools/validate.py
```

Inventory refresh updates metadata; it does not revalidate authored findings against newer source behavior. Review manifests and reports need human/agent reinspection before updating their pinned evidence or adoption conclusions. The catalog builder preserves authored report files and only replaces marked coverage sections in topic documents. `--full` on the inventory tool optionally includes raw README text and full tracked-path lists for further investigation; the delivered inventory is compact.

Future maintenance should prioritize the 416 screening-only implementations according to actual implementation needs and failing evaluation slices. The current deliverable is a complete directional design and transparent survey, with an explicit deeper-review backlog rather than an unsupported claim of exhaustive source audit.
