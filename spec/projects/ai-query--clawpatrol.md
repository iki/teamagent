# clawpatrol

Source: [clawpatrol](https://github.com/denoland/clawpatrol) · Category: [ai-query](../categories/ai-query.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `2604e157689740e8d7c99ec82b3d8fa489267eda`; commit timestamp `2026-10-02T23:50:25-07:00`; 1,857 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/denoland/clawpatrol/blob/2604e157689740e8d7c99ec82b3d8fa489267eda/README.md)):

> Claw Patrol sits between your agents and prod, parses their traffic at the wire, and gates each action against rules you write in HCL.

Build/package evidence: [dashboard/package.json](https://github.com/denoland/clawpatrol/blob/2604e157689740e8d7c99ec82b3d8fa489267eda/dashboard/package.json); [go.mod](https://github.com/denoland/clawpatrol/blob/2604e157689740e8d7c99ec82b3d8fa489267eda/go.mod); [macos/netstack/go.mod](https://github.com/denoland/clawpatrol/blob/2604e157689740e8d7c99ec82b3d8fa489267eda/macos/netstack/go.mod); [site/package.json](https://github.com/denoland/clawpatrol/blob/2604e157689740e8d7c99ec82b3d8fa489267eda/site/package.json); [third_party/tailscale/client/web/package.json](https://github.com/denoland/clawpatrol/blob/2604e157689740e8d7c99ec82b3d8fa489267eda/third_party/tailscale/client/web/package.json)

License evidence: [LICENSE.md](https://github.com/denoland/clawpatrol/blob/2604e157689740e8d7c99ec82b3d8fa489267eda/LICENSE.md) Classification hint: MIT. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-query**. Its category places it in the candidate set for memory, import-generation, decisions; those associations are navigational and have not been individually validated as implemented capabilities. See [memory](../memory.md) · [import-generation](../import-generation.md) · [decisions](../decisions.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

<!-- teamagent-analysis:start -->
Analysis metadata: source [clawpatrol](https://github.com/denoland/clawpatrol); analyzed commit `2604e157689740e8d7c99ec82b3d8fa489267eda`; commit date 2026-10-02T23:50:25-07:00; review date unknown; depth screened. [Maintenance record](../analyses/repos/ai-query--clawpatrol.md).
<!-- teamagent-analysis:end -->
