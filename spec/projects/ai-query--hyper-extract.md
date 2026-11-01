# hyper-extract

Source: [hyper-extract](https://github.com/yifanfeng97/Hyper-Extract) · Category: [ai-query](../categories/ai-query.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `0dc002bb1029fd34b21e47602e406ef7880c8673`; commit timestamp `2026-09-29T21:33:12+08:00`; 549 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/yifanfeng97/Hyper-Extract/blob/0dc002bb1029fd34b21e47602e406ef7880c8673/README.md)):

> More providers  — Anthropic (Claude), Google Gemini, Alibaba Bailian, OrcaRouter… OpenAI and Bailian provide both LLM and embedding models in one API. Anthropic, Google Gemini, and DeepSeek are LLM-only (pair them with an OpenAI-compatible embedder). DeepSeek is the most cost-effective option (~$0.001-0.005/page).

Build/package evidence: [pyproject.toml](https://github.com/yifanfeng97/Hyper-Extract/blob/0dc002bb1029fd34b21e47602e406ef7880c8673/pyproject.toml)

License evidence: [LICENSE](https://github.com/yifanfeng97/Hyper-Extract/blob/0dc002bb1029fd34b21e47602e406ef7880c8673/LICENSE) Classification hint: Apache-2.0. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-query**. Its category places it in the candidate set for memory, import-generation, decisions; those associations are navigational and have not been individually validated as implemented capabilities. See [memory](../memory.md) · [import-generation](../import-generation.md) · [decisions](../decisions.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.


## Change review — 2026-10-27

**Extraction-schema validation and provider presets require separate authority checks.** Reviewed commit `a8e27199ffd3984042e870d0b6963810a0d70f5d` (commit date `2026-10-15T23:25:56+08:00`) against `0dc002bb1029fd34b21e47602e406ef7880c8673`. The complete Git comparison contains 13 changed paths.

The thirteen-path comparison adds Atlas Cloud and Cheaper Inference presets plus provider-key names, changes configuration guidance, and repairs graph identifier validation and logging verbosity. New presets explicitly have no default embedder; an LLM-only route must not inherit embedding capability. The CLI now warns when it writes an unrelated placeholder model for a provider lacking a default, but still writes that placeholder. Provider-specific keys take precedence, yet `_env_api_key` still falls back to OPENAI_API_KEY for compatible providers. This fallback could send a credential intended for one service to another configured origin and is not a pattern to copy. Identifier validation now checks string/list hypergraph members and resolves time/location placeholders against relation fields rather than entity fields. Fixtures cover undeclared members, relation time/location, provider-key precedence, placeholder warnings and root-handler verbosity. New compatibility-table claims are documentary, not provider tests performed by this review.

Evidence: [hyperextract/utils/client.py:63-91](https://github.com/yifanfeng97/Hyper-Extract/blob/a8e27199ffd3984042e870d0b6963810a0d70f5d/hyperextract/utils/client.py#L63-L91) Â· [hyperextract/utils/client.py:127-151](https://github.com/yifanfeng97/Hyper-Extract/blob/a8e27199ffd3984042e870d0b6963810a0d70f5d/hyperextract/utils/client.py#L127-L151) Â· [hyperextract/utils/template_engine/parsers/identifiers.py:130-177](https://github.com/yifanfeng97/Hyper-Extract/blob/a8e27199ffd3984042e870d0b6963810a0d70f5d/hyperextract/utils/template_engine/parsers/identifiers.py#L130-L177) Â· [hyperextract/cli/commands/config.py:312-346](https://github.com/yifanfeng97/Hyper-Extract/blob/a8e27199ffd3984042e870d0b6963810a0d70f5d/hyperextract/cli/commands/config.py#L312-L346) Â· [hyperextract/utils/logging.py:84-99](https://github.com/yifanfeng97/Hyper-Extract/blob/a8e27199ffd3984042e870d0b6963810a0d70f5d/hyperextract/utils/logging.py#L84-L99) Â· [tests/template_engine/test_parser_identifiers.py:133-229](https://github.com/yifanfeng97/Hyper-Extract/blob/a8e27199ffd3984042e870d0b6963810a0d70f5d/tests/template_engine/test_parser_identifiers.py#L133-L229) Â· [tests/cli/test_config.py:309-382](https://github.com/yifanfeng97/Hyper-Extract/blob/a8e27199ffd3984042e870d0b6963810a0d70f5d/tests/cli/test_config.py#L309-L382) Â· [tests/utils/test_logging.py:1-47](https://github.com/yifanfeng97/Hyper-Extract/blob/a8e27199ffd3984042e870d0b6963810a0d70f5d/tests/utils/test_logging.py#L1-L47) Â· [docs/en/concepts/provider-system.md:1-27](https://github.com/yifanfeng97/Hyper-Extract/blob/a8e27199ffd3984042e870d0b6963810a0d70f5d/docs/en/concepts/provider-system.md#L1-L27).

**Harness consequence:** Validate extraction templates before model calls and keep entity/relation field namespaces explicit. Bind credentials to exact provider routes; never inherit a different provider's key merely because protocols are compatible. Keep unknown aggregator data policy blocked until evidence establishes it. Missing model choice should remain unresolved, and embedding, structured-output and tool-choice support each need independent capability evidence.

**Scope and limits:** Scoped source and fixture review after classifying all thirteen changed paths. No provider request, credentials, schema extraction run or quality/cost benchmark. Translated documentation and every client fixture were not independently read; source comments and compatibility tables are not entitlement, licensing, training-policy or account verification.

## Change review — 2026-11-01

Reviewed `34217863fa3c8b0a12c407b51ac402ef7bd43367` (2026-10-29T08:22:12+08:00) against `a8e27199ffd3984042e870d0b6963810a0d70f5d`; 19 changed paths. Scoped implementation/test diffs add API Route and Runcrate endpoint/model/key presets, with Runcrate also declaring an embedder. The graph identifier parser now rejects a naive item-only schema with actionable guidance before attribute access; fixtures cover rejection and a valid graph schema. [Client registry](https://github.com/yifanfeng97/Hyper-Extract/blob/34217863fa3c8b0a12c407b51ac402ef7bd43367/hyperextract/utils/client.py), [identifier validation](https://github.com/yifanfeng97/Hyper-Extract/blob/34217863fa3c8b0a12c407b51ac402ef7bd43367/hyperextract/utils/template_engine/parsers/identifiers.py), [parser tests](https://github.com/yifanfeng97/Hyper-Extract/blob/34217863fa3c8b0a12c407b51ac402ef7bd43367/tests/template_engine/test_parser_identifiers.py).

Provider tests assert endpoint/default/override and provider-key precedence without establishing live access or policy. The CLI help/interactivity additions list Runcrate but do not add API Route alongside it, so registry and discovery surfaces can drift. Preserve the earlier warning about cross-provider credential fallback. Teamagent should derive listings from one capability registry, validate schema kinds before remote work and keep aggregator training policy unknown until separately evidenced. [Configuration](https://github.com/yifanfeng97/Hyper-Extract/blob/34217863fa3c8b0a12c407b51ac402ef7bd43367/hyperextract/cli/commands/config.py), [API Route fixtures](https://github.com/yifanfeng97/Hyper-Extract/blob/34217863fa3c8b0a12c407b51ac402ef7bd43367/tests/utils/test_api_route.py), [client fixtures](https://github.com/yifanfeng97/Hyper-Extract/blob/34217863fa3c8b0a12c407b51ac402ef7bd43367/tests/utils/test_client.py). No provider calls, source execution or tests were run; translated guidance and full lock resolution were not exhaustively reviewed.

<!-- teamagent-analysis:start -->
Analysis metadata: source [hyper-extract](https://github.com/yifanfeng97/Hyper-Extract); analyzed commit `34217863fa3c8b0a12c407b51ac402ef7bd43367`; commit date 2026-10-29T08:22:12+08:00; review date 2026-11-01T11:35:43.470Z; depth screened. [Maintenance record](../analyses/repos/ai-query--hyper-extract.md).
<!-- teamagent-analysis:end -->
