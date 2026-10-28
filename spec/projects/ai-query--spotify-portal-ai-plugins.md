# spotify-portal-ai-plugins

Source: [spotify-portal-ai-plugins](https://github.com/spotify/portal-ai-plugins) · Category: [ai-query](../categories/ai-query.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `3c24ca30ff63e1f5bbad1c43fe5324daff579123`; commit timestamp `2026-08-17T13:35:05+02:00`; 37 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/spotify/portal-ai-plugins/blob/3c24ca30ff63e1f5bbad1c43fe5324daff579123/README.md)):

> authentication, search your software catalog, build service briefings, run - Set up the Portal CLI for your current coding-agent environment.

Build/package evidence: No common build manifest identified.

License evidence: [LICENSE](https://github.com/spotify/portal-ai-plugins/blob/3c24ca30ff63e1f5bbad1c43fe5324daff579123/LICENSE) Classification hint: Apache-2.0. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-query**. Its category places it in the candidate set for memory, import-generation, decisions; those associations are navigational and have not been individually validated as implemented capabilities. See [memory](../memory.md) · [import-generation](../import-generation.md) · [decisions](../decisions.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.


## Change review - 2026-10-28

**Fleetshift workflow guidance separates status, trigger, stop and PR actions but relies on prose enforcement.** Reviewed commit `aa252eb21df5bbf32b0beb45f84a2c03341ccad8` (commit date `2026-10-23T09:08:54+02:00`). Compared with `3c24ca30ff63e1f5bbad1c43fe5324daff579123`; the complete Git comparison contains 8 changed paths.

The five new skills define explicit target selection, local dry runs, recorded job identifiers, terminal-state reporting and separate create/run/PR operations. The run guide caps monitoring at ten polls and fifteen minutes per shift, treats stop as immediate authorization, and correctly re-queries offset zero while stopping jobs that disappear from a filtered result. It distinguishes job completion from merged-PR counts and warns that re-running a completed target replaces its prior result.

These files are agent instructions, not an implementation of authorization, concurrency, deadlines or idempotency. The stop sweep has a rejected-only break but no absolute sweep/request bound. PR creation proposes an explicit target list and duplicate check, then verifies using status jobComplete even though the status vocabulary includes prCreating/prOpen; that filter can omit successful transitions. Read-only diagnosis asks for log excerpts without a concrete redaction rule. Literal repeated-yes requirements and npx examples are upstream workflow choices, not requirements adopted by this repository.

Evidence: [skills/fleetshift-check-shift/SKILL.md:1-110](https://github.com/spotify/portal-ai-plugins/blob/aa252eb21df5bbf32b0beb45f84a2c03341ccad8/skills/fleetshift-check-shift/SKILL.md#L1-L110) · [skills/fleetshift-create-prs/SKILL.md:1-89](https://github.com/spotify/portal-ai-plugins/blob/aa252eb21df5bbf32b0beb45f84a2c03341ccad8/skills/fleetshift-create-prs/SKILL.md#L1-L89) · [skills/fleetshift-create-shift/SKILL.md:1-120](https://github.com/spotify/portal-ai-plugins/blob/aa252eb21df5bbf32b0beb45f84a2c03341ccad8/skills/fleetshift-create-shift/SKILL.md#L1-L120) · [skills/fleetshift-run-shift/SKILL.md:1-178](https://github.com/spotify/portal-ai-plugins/blob/aa252eb21df5bbf32b0beb45f84a2c03341ccad8/skills/fleetshift-run-shift/SKILL.md#L1-L178) · [skills/fleetshift-troubleshoot-shift/SKILL.md:1-103](https://github.com/spotify/portal-ai-plugins/blob/aa252eb21df5bbf32b0beb45f84a2c03341ccad8/skills/fleetshift-troubleshoot-shift/SKILL.md#L1-L103).

**Harness consequence:** Borrow explicit target/run receipts, partial stop reporting, bounded monitoring and immutable prior results. Bind approval to a concrete target/version set and enforce capabilities and cancellation in the host. Verify PR creation by returned IDs or unfiltered target identities, redact diagnostic logs and use the installed dependency/runtime contract rather than executing these examples.

**Scope and limits:** All five changed Fleetshift skill bodies inspected within the eight-path comparison. This is a scoped workflow-policy review: Portal CLI/server implementation and its stated status/idempotency guarantees were unavailable in these files and not independently tested. No skill was invoked, job triggered, credential used or PR opened.

<!-- teamagent-analysis:start -->
Analysis metadata: source [spotify-portal-ai-plugins](https://github.com/spotify/portal-ai-plugins); analyzed commit `aa252eb21df5bbf32b0beb45f84a2c03341ccad8`; commit date 2026-10-23T09:08:54+02:00; review date 2026-10-28T09:27:32.685Z; depth screened. [Maintenance record](../analyses/repos/ai-query--spotify-portal-ai-plugins.md).
<!-- teamagent-analysis:end -->
