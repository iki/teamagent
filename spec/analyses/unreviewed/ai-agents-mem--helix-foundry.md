# helix-foundry

Source: [helix-foundry](https://github.com/helixdb/helix-foundry) · [memory](../../memory.md), [import-generation](../../import-generation.md), [evolution](../../evolution.md).

Depth: **unreviewed**. Discovered 2026-10-24T06:36:54.441Z; no source code or capabilities reviewed. [Change evidence](../repos/ai-agents-mem--helix-foundry.md).


## Change review — 2026-10-27

**First scoped source review: ontology-scoped graph jobs and extraction provenance.** Reviewed commit `9d7fda40af9ac9685777676052e23e3b76786224` (commit date `2026-10-27T17:12:10Z`). The enumerated snapshot contains 1026 tracked paths.

Foundry documents a Next.js client with a Go/MySQL backend that connects source data, drafts versioned ontologies and loads them into HelixDB. The inspected graph-job store inserts jobs with a client token and one live job per ontology, leases due work with a locked SKIP LOCKED selection, pins source snapshots and conditions updates on running state and worker ownership. After another worker claims an expired lease, the old owner cannot renew, record extraction or finish; the ownership predicate itself does not check wall-clock expiry on every write. Extraction recording checks document membership in the job's load and commits row replacement plus spend accounting together. A later record without an artifact key preserves the saved key. Finish distinguishes retry, successful, budget-exhausted and failed outcomes and retains explicit partial-load handling. The scoped graph proxy accepts only its configured POST route, checks its bearer token, bounds the request body and refuses caller-supplied database-selection headers; it rechecks binding before admission retries. The selected fixtures exercise one live job, ontology-scoped client tokens, lost ownership and same-document replacement.

Evidence: [README.md:1-44](https://github.com/helixdb/helix-foundry/blob/9d7fda40af9ac9685777676052e23e3b76786224/README.md#L1-L44) Â· [backend/store/store.go:1-61](https://github.com/helixdb/helix-foundry/blob/9d7fda40af9ac9685777676052e23e3b76786224/backend/store/store.go#L1-L61) Â· [backend/store/foundry_graph_jobs.go:14-375](https://github.com/helixdb/helix-foundry/blob/9d7fda40af9ac9685777676052e23e3b76786224/backend/store/foundry_graph_jobs.go#L14-L375) Â· [backend/store/foundry_graph_jobs_test.go:557-675](https://github.com/helixdb/helix-foundry/blob/9d7fda40af9ac9685777676052e23e3b76786224/backend/store/foundry_graph_jobs_test.go#L557-L675) Â· [backend/graphproxy/graphproxy.go:195-305](https://github.com/helixdb/helix-foundry/blob/9d7fda40af9ac9685777676052e23e3b76786224/backend/graphproxy/graphproxy.go#L195-L305) Â· [backend/server/tasks/worker.go:50-127](https://github.com/helixdb/helix-foundry/blob/9d7fda40af9ac9685777676052e23e3b76786224/backend/server/tasks/worker.go#L50-L127).

**Harness consequence:** Use durable import jobs tied to exact source snapshots, explicit scope and ownership; retain extraction artifact identity across retries and account for each attempt's cost. Make incomplete enrichment visible instead of equating a budget stop with a complete graph. Keep connector synchronization and current-version promotion separate. Lease fencing should use attempt identity as well as worker identity, and source/ontology authority must be revalidated after ownership changes.

**Scope and limits:** Initial scoped architecture review of graph-job persistence, proxy admission and related fixtures within a 1,026-path tree. No Go tests, MySQL/HelixDB deployment, local Docker setup, connector sync, ontology quality or live authorization test. Graph query semantics, extraction prompts and complete cross-store atomicity remain outside this pass.

## Follow-up change review — 2026-10-28

**Model discovery distinguishes a found configuration from proven readiness only partially.** Reviewed commit `ed93e1580adb5f938647f58b8a15d3714a74ac27` (commit date `2026-10-27T20:44:25Z`), compared with `9d7fda40af9ac9685777676052e23e3b76786224`. The complete no-rename Git path inventory contains 62 changed paths.

The new detector serializes overlapping discovery, caps an overall attempt at 15 seconds, individual calls at two/four seconds, model detail count at 64 and response decoding at 4 MiB. It prefers configured Anthropic/OpenAI keys, then probes local Ollama/LM Studio candidates and optionally applies a deployment Check. A rejected key changes the explanation but still returns that provider/key as the default; a network failure is likewise not a refusal. This behavior is useful discovery evidence but cannot be adopted as authenticated readiness or non-training policy verification.

Evidence: [backend/ai/detect/detect.go:60-69](https://github.com/helixdb/helix-foundry/blob/ed93e1580adb5f938647f58b8a15d3714a74ac27/backend/ai/detect/detect.go#L60-L69) · [backend/ai/detect/detect.go:128-178](https://github.com/helixdb/helix-foundry/blob/ed93e1580adb5f938647f58b8a15d3714a74ac27/backend/ai/detect/detect.go#L128-L178) · [backend/ai/detect/detect.go:181-232](https://github.com/helixdb/helix-foundry/blob/ed93e1580adb5f938647f58b8a15d3714a74ac27/backend/ai/detect/detect.go#L181-L232) · [backend/ai/detect/detect.go:579-604](https://github.com/helixdb/helix-foundry/blob/ed93e1580adb5f938647f58b8a15d3714a74ac27/backend/ai/detect/detect.go#L579-L604).

**Harness consequence:** Keep passive discovery, authenticated diagnostics, model compatibility and effective account policy as separate states. Discovery must not upload task content or select a route before mandatory policy gates, and an unusable key must remain visibly unready.

**Scope and limits:** Reviewed detector selection, limits and HTTP decoding; no local server or provider was contacted, and the full deployment validator was not audited. This is a scoped static comparison, not a whole-project correctness or security audit. Upstream tests were read where cited, not run; no upstream code, service, model or provider operation was executed. Historical findings above remain evidence at their own revisions.

<!-- teamagent-analysis:start -->
Analysis metadata: source [helix-foundry](https://github.com/helixdb/helix-foundry); analyzed commit `ed93e1580adb5f938647f58b8a15d3714a74ac27`; commit date 2026-10-27T20:44:25Z; review date 2026-10-28T14:52:35.205Z; depth reviewed. [Maintenance record](../repos/ai-agents-mem--helix-foundry.md).
<!-- teamagent-analysis:end -->
