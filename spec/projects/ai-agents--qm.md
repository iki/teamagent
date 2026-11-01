# qm

Source: [qm](https://github.com/yc-software/qm) · Category: [ai-agents](../categories/ai-agents.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `7a0b6d987dd2031cfb20c53dadc8a86d5301e80f`; commit timestamp `2026-10-02T23:52:53-07:00`; 2,375 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/yc-software/qm/blob/7a0b6d987dd2031cfb20c53dadc8a86d5301e80f/README.md)):

> Deploy · How it works · Security model · Customize · Contribute · Documentation Most agents are designed like personal assistants. You can make one work for a whole

Build/package evidence: [cli/package.json](https://github.com/yc-software/qm/blob/7a0b6d987dd2031cfb20c53dadc8a86d5301e80f/cli/package.json); [deploy/connector-sdk/package.json](https://github.com/yc-software/qm/blob/7a0b6d987dd2031cfb20c53dadc8a86d5301e80f/deploy/connector-sdk/package.json); [desktop/package.json](https://github.com/yc-software/qm/blob/7a0b6d987dd2031cfb20c53dadc8a86d5301e80f/desktop/package.json); [package.json](https://github.com/yc-software/qm/blob/7a0b6d987dd2031cfb20c53dadc8a86d5301e80f/package.json); [plugins/admin/package.json](https://github.com/yc-software/qm/blob/7a0b6d987dd2031cfb20c53dadc8a86d5301e80f/plugins/admin/package.json)

License evidence: [LICENSE](https://github.com/yc-software/qm/blob/7a0b6d987dd2031cfb20c53dadc8a86d5301e80f/LICENSE) Classification hint: MIT. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents**. Its category places it in the candidate set for agents, models, channels; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [models](../models.md) · [channels](../channels.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

## 2026-10-28 scoped source review

Source: [qm](https://github.com/yc-software/qm); inspected saved discovery revision `614d7ac95ef121e7e69df53de076ae2c3660daf8`. Prior analyzed revision `7a0b6d987dd2031cfb20c53dadc8a86d5301e80f` remains historical evidence.

**Scope:** Full cron-authority helper, hosting/backend policy table and source-auth gate tests read. Capability decoding, server verifier, cron execution/revocation, sandbox adapters and identity directory were not audited.

The [cron-authority helper](https://github.com/yc-software/qm/blob/614d7ac95ef121e7e69df53de076ae2c3660daf8/src/cron/authority.ts) requires a live actor, owner identity, owner-only personal delivery scope and a current admin lookup before accepting unattended grants. Lookup failures refuse rather than silently authorizing. Those checks govern grant creation in this helper; they do not demonstrate capability authenticity, revocation at firing time or future destination mutation checks. The [hosting/backend table](https://github.com/yc-software/qm/blob/614d7ac95ef121e7e69df53de076ae2c3660daf8/cli/src/providers.ts) makes permitted combinations explicit and requires an explicit backend for AWS, but a declared backend is not evidence of isolation enforcement.

The [auth-gate fixtures](https://github.com/yc-software/qm/blob/614d7ac95ef121e7e69df53de076ae2c3660daf8/test/auth-gate.test.ts) cover missing startup secrets, unsigned/forged turns, invalid timestamps, route-bound signatures, replay rejection for mutation, permitted repeated reads and authenticated egress-audit ingest. A signed read still needs resource-level authorization; signature acceptance does not prove a sender's claimed principal or event is semantically correct. The blob fixture checks missing hashes and a valid upload, not a mismatched-body rejection case. Keep explicit test-server bypasses out of production wiring and redact upstream error details in grant refusals. No server, scheduled job, sandbox or tests were executed.

## 2026-10-28 follow-up source review

Reviewed the frozen update from `614d7ac95ef121e7e69df53de076ae2c3660daf8` to `11b683774440fc1dd3c53198cec7ccca2ecce452`. Earlier findings above remain historical evidence; this review is limited to the cited source and delta.

In [src/persistence/s3.ts](https://github.com/yc-software/qm/blob/11b683774440fc1dd3c53198cec7ccca2ecce452/src/persistence/s3.ts#L8-L33), S3 client construction now accepts a custom endpoint, path-style addressing and maximum attempts. Custom endpoints default to path style and request checksum calculation only when required. The response-body bridge accepts native Node streams or Web-stream-like objects and rejects an unreadable body.

**Harness implication and limits:** Treat endpoint and retry configuration as explicit storage-adapter policy, with endpoint credential scope and trust validated before constructing the client. This helper forwards those values without such validation, and a falsey maxAttempts value is omitted. S3-compatible support is not evidence of equivalent consistency, checksum coverage or retention behavior; no remote storage operation was run. This static review does not certify other changed subsystems.

## 2026-11-01 scoped source review

Reviewed frozen commit `c3f9c8de324c6a1d96ed8265745a977df3c74466` against prior analyzed commit `11b683774440fc1dd3c53198cec7ccca2ecce452`. Historical reviews above remain separate evidence.

The approval store moves into the [Slack adapter](https://github.com/yc-software/qm/blob/c3f9c8de324c6a1d96ed8265745a977df3c74466/src/slack/approval-store.ts). Its implementation writes the approval record before queuing delivery, derives an idempotency key from approval ID and creation time, routes only Slack requests with a non-system external actor, and carries account/team and direct-message thread context. Delivery failure after persistence is caught; `deliverPending` can replay retained approvals. The inspected store test uses an in-memory backing implementation, so it supports the adapter contract rather than PostgreSQL durability or exactly-once delivery.

The same scoped delta removes the in-memory replay-dedupe implementation from the inspected core path. Do not interpret that removal alone as proof that every caller now uses durable replay protection. For Teamagent, keep approval persistence, notification delivery, authenticated response validation and action authorization separate; replaying a notification must not replay the approved action.

**Coverage:** Read the relocated 48-line implementation, its deleted predecessor, changed approval-store fixtures and the selected replay-dedupe delta. Database wiring, notification transports and action execution were not audited. Source inspection only; no upstream tests, source programs or live providers were executed. This is a scoped architecture review, not a whole-repository correctness or security certification.

<!-- teamagent-analysis:start -->
Analysis metadata: source [qm](https://github.com/yc-software/qm); analyzed commit `c3f9c8de324c6a1d96ed8265745a977df3c74466`; commit date 2026-10-31T18:57:15-07:00; review date 2026-11-01T11:33:30.893Z; depth screened. [Maintenance record](../analyses/repos/ai-agents--qm.md).
<!-- teamagent-analysis:end -->
