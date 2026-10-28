# ax

Source: [ax](https://github.com/google/ax) · Category: [ai-agents](../categories/ai-agents.md)

Original review depth: **inventory / README screening only**. The dated update review below has its own explicit scope. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `ac2332829f22360ff97b0ba34d94dd0dd782f17e`; commit timestamp `2026-09-27T16:54:08-07:00`; 64 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/google/ax/blob/ac2332829f22360ff97b0ba34d94dd0dd782f17e/README.md)):

> AX and several of its features are in heavy development. We are actively refining our core concepts, protocols, and specifications, and will likely

Build/package evidence: [go.mod](https://github.com/google/ax/blob/ac2332829f22360ff97b0ba34d94dd0dd782f17e/go.mod)

License evidence: [LICENSE](https://github.com/google/ax/blob/ac2332829f22360ff97b0ba34d94dd0dd782f17e/LICENSE) Classification hint: Apache-2.0. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents**. Its category places it in the candidate set for agents, models, channels; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [models](../models.md) · [channels](../channels.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

## 2026-10-28 scoped update review

Reviewed commit `41ec50c6398376fa510349b2089237540739d935` (commit date `2026-10-27T10:46:26-07:00`). The original snapshot above remains historical evidence.

**Scope:** Changed-path inventory and the task runner entry point, runner lifecycle and selected lifecycle fixtures; Kubernetes controller, cluster security and CLI provisioning were not audited.

The [runner lifecycle](https://github.com/google/ax/blob/41ec50c6398376fa510349b2089237540739d935/runner/runner.go#L96-L167) deliberately separates a task command from the container's inspection lifetime: it reports the command exit code, then remains alive until its context is cancelled. This is useful for post-failure inspection, but `Run` returning nil or a live metadata endpoint cannot be used as a successful task verdict. Workspace setup errors are logged and command launch still proceeds; Teamagent must require the declared workspace preparation to succeed before executing a dependent command.

[Cancellation](https://github.com/google/ax/blob/41ec50c6398376fa510349b2089237540739d935/runner/runner.go#L169-L212) signals the POSIX process group, waits ten seconds, then kills it. That provides a concrete host cleanup pattern, not Windows behavior or rollback of external effects. Command environments inherit the runner environment and task overrides. The [entry point](https://github.com/google/ax/blob/41ec50c6398376fa510349b2089237540739d935/cmd/ax-task-runner/main.go#L80-L104) reads YAML without an input-size bound or strict unknown-field decoding in this path; it is not a sufficient untrusted task authorization boundary.

The inspected [fixtures](https://github.com/google/ax/blob/41ec50c6398376fa510349b2089237540739d935/runner/runner_test.go#L34-L122) distinguish command exit, a still-running metadata service and cancellation. They were not executed. Retain AX as a task-runner reference with explicit preparation, execution, inspection and verified-result states; no cluster isolation, controller reconciliation or packaged deployment claim follows from this scope.

**Verification limit:** source inspection only; no upstream tests or provider calls were executed. This scoped review does not certify every file in the repository.

## 2026-10-28 follow-up source review

Reviewed commit `4b7bf6f84cac7eb12f21b87a76c8dc85155dce38` (commit date `2026-10-27T21:23:10-07:00`), compared with `41ec50c6398376fa510349b2089237540739d935`. Earlier findings remain historical evidence.

**Scope:** Guest-client TLS selection and CLI router connection fallback. The complete changed-path inventory contains 31 paths; the assessment below is limited to the cited branches.

The new guest dialer uses TLS only when supplied a non-null TLS configuration; the legacy wrapper explicitly passes null. The CLI first attempts router credentials and port 443, then falls back to the plaintext port-80 route when no client was created. See [internal/guest/client.go](https://github.com/google/ax/blob/4b7bf6f84cac7eb12f21b87a76c8dc85155dce38/internal/guest/client.go#L47-L79) and [cmd/ax/main.go](https://github.com/google/ax/blob/4b7bf6f84cac7eb12f21b87a76c8dc85155dce38/cmd/ax/main.go#L1078-L1118). Prefix stripping of https:// does not itself select TLS in the guest helper.

For Teamagent, disclose requested versus effective transport protection and require policy approval before a downgrade. Kubernetes port forwarding may have its own protection, but this inspected branch does not establish end-to-end TLS or authenticated service identity. Credential loading and the router TLS configuration implementation were not reviewed; previous lifecycle findings remain applicable.

**Verification limit:** committed-source inspection only; no upstream code, tests or provider calls were executed. This review does not certify every changed file or establish a Teamagent integration.

<!-- teamagent-analysis:start -->
Analysis metadata: source [ax](https://github.com/google/ax); analyzed commit `4b7bf6f84cac7eb12f21b87a76c8dc85155dce38`; commit date 2026-10-27T21:23:10-07:00; review date 2026-10-28T14:29:27.414Z; depth screened. [Maintenance record](../analyses/repos/ai-agents--ax.md).
<!-- teamagent-analysis:end -->
