# adk-python

Source: [adk-python](https://github.com/google/adk-python) · Category: [ai-agents](../categories/ai-agents.md)

Original review depth: **inventory / README screening only**. The dated update review below has its own explicit scope. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `63aed55113d4fe78245d3d6667b6e87569888bf5`; commit timestamp `2026-10-03T06:13:21-07:00`; 2,863 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/google/adk-python/blob/63aed55113d4fe78245d3d6667b6e87569888bf5/README.md)):

> [](https://github.com/google/adk-python/actions/workflows/continuous-integration.yml) An open-source, code-first Python framework for building, evaluating, and deploying sophisticated AI agents with flexibility and control.

Build/package evidence: [contributing/samples/adk_team/adk_knowledge_agent/requirements.txt](https://github.com/google/adk-python/blob/63aed55113d4fe78245d3d6667b6e87569888bf5/contributing/samples/adk_team/adk_knowledge_agent/requirements.txt); [contributing/samples/integrations/authn-adk-all-in-one/adk_agents/requirements.txt](https://github.com/google/adk-python/blob/63aed55113d4fe78245d3d6667b6e87569888bf5/contributing/samples/integrations/authn-adk-all-in-one/adk_agents/requirements.txt); [contributing/samples/integrations/authn-adk-all-in-one/requirements.txt](https://github.com/google/adk-python/blob/63aed55113d4fe78245d3d6667b6e87569888bf5/contributing/samples/integrations/authn-adk-all-in-one/requirements.txt); [contributing/samples/integrations/gcp_auth/client/requirements.txt](https://github.com/google/adk-python/blob/63aed55113d4fe78245d3d6667b6e87569888bf5/contributing/samples/integrations/gcp_auth/client/requirements.txt); [contributing/samples/integrations/langchain_youtube_search_agent/requirements.txt](https://github.com/google/adk-python/blob/63aed55113d4fe78245d3d6667b6e87569888bf5/contributing/samples/integrations/langchain_youtube_search_agent/requirements.txt)

License evidence: [LICENSE](https://github.com/google/adk-python/blob/63aed55113d4fe78245d3d6667b6e87569888bf5/LICENSE) Classification hint: Apache-2.0. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents**. Its category places it in the candidate set for agents, models, channels; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [models](../models.md) · [channels](../channels.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

## 2026-10-28 scoped update review

Reviewed commit `0e5d6c963cb6935ff1c28535f167c96a96746ad4` (commit date `2026-10-27T10:54:12-07:00`). The original snapshot above remains historical evidence.

**Scope:** Complete session State implementation and selected Context state/action, credential/confirmation and memory-delete branches with the Context delta; runner, persistence services, scheduler and unit tests were not reviewed.

The [State implementation](https://github.com/google/adk-python/blob/0e5d6c963cb6935ff1c28535f167c96a96746ad4/src/google/adk/sessions/state.py#L43-L140) validates assignments only when an optional schema class is supplied, exempts every key containing a colon and discards the transformed value returned by Pydantic validation. Assignments immediately mutate both current value and pending delta. In-place edits to returned containers are instead [discovered by snapshot comparison](https://github.com/google/adk-python/blob/0e5d6c963cb6935ff1c28535f167c96a96746ad4/src/google/adk/sessions/state.py#L142-L236), without schema validation. This makes nested-write persistence more explicit while retaining the same separation between validation and mutable state seen in ADK JS.

A changed container with no equal JSON form is omitted from the delta; a previously recorded nested write can be withdrawn. Snapshot-copy/comparison failures have their own fallback behavior, and the source records a remaining cross-context tracking limitation. Consequently has_delta is a mutating observation whose true result may later become false, not a durable commit receipt. The [Context actions accessor](https://github.com/google/adk-python/blob/0e5d6c963cb6935ff1c28535f167c96a96746ad4/src/google/adk/agents/context.py#L295-L309) triggers this tracking as well. Teamagent should validate the final serialized value, keep authoritative state unchanged until commit, and report unsupported persistence explicitly instead of silently relying on mutable aliases and debug logs.

[Credential and confirmation requests](https://github.com/google/adk-python/blob/0e5d6c963cb6935ff1c28535f167c96a96746ad4/src/google/adk/agents/context.py#L635-L740) require a function-call ID and place request data into that call's event actions. This correlates a request with a tool invocation; it does not independently authorize the eventual effect or verify a resumed approval's argument/identity binding. The added [memory deletion helper](https://github.com/google/adk-python/blob/0e5d6c963cb6935ff1c28535f167c96a96746ad4/src/google/adk/agents/context.py#L855-L874) forwards app and user scope to a required service, whose authorization and deletion semantics remain outside this review.

**Verification limit:** source inspection only; no upstream tests or provider calls were executed. This scoped review does not certify every file in the repository.

## 2026-10-28 follow-up source review

Reviewed commit `1d81896aa081e7b2e50b3a4a227f7c6933805752` (commit date `2026-10-27T23:24:57-07:00`), compared with `0e5d6c963cb6935ff1c28535f167c96a96746ad4`. Earlier findings remain historical evidence.

**Scope:** Nested agent context-compaction configuration and the active-task fast path. The complete changed-path inventory contains 49 paths; the assessment below is limited to the cited branches.

Nested agent tools copy only eligible token-threshold compaction settings and clear interval/overlap triggers. Their private runner installs that configuration but deliberately skips post-invocation compaction because its in-memory session will be discarded. Parent-owned inherited plugins are explicitly excluded from child close. See [src/google/adk/tools/agent_tool.py](https://github.com/google/adk-python/blob/1d81896aa081e7b2e50b3a4a227f7c6933805752/src/google/adk/tools/agent_tool.py#L54-L78) and [src/google/adk/tools/agent_tool.py](https://github.com/google/adk-python/blob/1d81896aa081e7b2e50b3a4a227f7c6933805752/src/google/adk/tools/agent_tool.py#L293-L344). The runner delta also avoids rewind work when no event has an isolation scope; it does not add a new task-isolation mechanism.

For Teamagent, distinguish ephemeral child context from durable memory, preserve caller ownership of shared services, and make context-policy inheritance explicit. A configuration copy does not demonstrate deep isolation of every custom summarizer, nor does source inspection establish cost savings or summarization quality.

**Verification limit:** committed-source inspection only; no upstream code, tests or provider calls were executed. This review does not certify every changed file or establish a Teamagent integration.

## 2026-11-01 scoped source review

Reviewed commit `95d8610ea3445ce9c6d0cf70aed1a0071ddc1e2f` (commit date `2026-10-31T23:44:06-07:00`), compared with `1d81896aa081e7b2e50b3a4a227f7c6933805752`. Earlier observations remain historical evidence.

**Scope:** Complete classifier-node refusal diff/test plus selected new OpenAI decision-adapter conversion branches; 317 changed paths inventoried. SDK transport and full adapter lifecycle not audited.

The [classifier node](https://github.com/google/adk-python/blob/95d8610ea3445ce9c6d0cf70aed1a0071ddc1e2f/src/google/adk/labs/classifiers/_classifier_node.py) explicitly rejects RefusalAnswer with a workflow data error instead of selecting a route, with a corresponding [fixture case](https://github.com/google/adk-python/blob/95d8610ea3445ce9c6d0cf70aed1a0071ddc1e2f/tests/unittests/labs/classifiers/test_classifier_node.py). The new [OpenAI adapter](https://github.com/google/adk-python/blob/95d8610ea3445ce9c6d0cf70aed1a0071ddc1e2f/src/google/adk/integrations/openai/_openai_decisions_classifier.py) preserves provider refusals as that answer type and validates expected answer types, labels and numeric ranges. Its speed claims and provider availability were not verified; source conversion logic is not calibration evidence.

**Teamagent implication (inference):** Represent refusal and insufficient evidence separately from false/negative classifications, and leave authorization deterministic. A route must not become an implicit default merely because the classifier declined; use an explicit escalation or task-specific fallback with provenance and budget.

**Verification limit:** committed-source inspection only; no upstream code, tests or provider calls were executed. Review scope is the cited implementation or authored guidance, not whole-project correctness, licensing clearance or measured performance. Source passages were redacted for review; exact URL literals were not byte-validated.

<!-- teamagent-analysis:start -->
Analysis metadata: source [adk-python](https://github.com/google/adk-python); analyzed commit `95d8610ea3445ce9c6d0cf70aed1a0071ddc1e2f`; commit date 2026-10-31T23:44:06-07:00; review date 2026-11-01T11:33:30.893Z; depth screened. [Maintenance record](../analyses/repos/ai-agents--adk-python.md).
<!-- teamagent-analysis:end -->
