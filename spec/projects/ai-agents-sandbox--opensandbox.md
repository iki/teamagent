# OpenSandbox: self-hosted execution lifecycle

Source: [opensandbox](https://github.com/alibaba/OpenSandbox) · Category: `ai-agents-sandbox`

Review depth: **source-reviewed**. Snapshot `c7dc78a4090e5de2b9119e9bd93952cae24f87bd`; assessed 2026-10-04. This is a focused static review of the listed files, not an audit of every code path or a reproduced benchmark. No repository code, model weights, paid endpoints, or installers were run.

## Observed architecture

The Docker backend separates container operations from network management. Container setup imports CPU, memory, GPU, platform, expiry, and snapshot helpers. The network mixin handles endpoint resolution and egress sidecar lifecycle, with explicit validation of egress and credential-proxy configuration. It also accounts for Docker and Podman markers and host-loopback differences. Kubernetes and fast-sandbox implementations exist elsewhere in the snapshot, but were not audited in this focused review.

The separation is a good fit for a harness that must run the same task locally or in a cluster while retaining runtime-specific enforcement details. A common API should not erase whether a job uses ordinary containers, stronger VM isolation, or a host-process wrapper.

## Harness adoption

Shortlist as the self-hosted worker lifecycle service. The harness should pass an immutable environment image, tenant identity, workspace snapshot, resource quota, TTL, network policy, and short-lived credential references. Persist execution events and artifacts outside the disposable sandbox. Treat pool reuse, snapshots, and warm starts as performance policies subordinate to tenant separation and secret removal.

Route ordinary code builds and media rendering to isolated workers. Keep trusted lightweight text transforms on a cheaper interpreter path where its limitations are acceptable. Export actual runtime and policy version with each result so evaluations can reproduce environment-dependent failures.

## Limitations and decision

Container existence alone does not establish resistance to a hostile tenant; host configuration, mounts, kernel, runtime, and egress deployment determine the boundary. The inspected validators and sidecar plumbing are evidence of policy mechanisms, not a penetration-test result. Adoption requires fail-closed tests for unsupported policy/runtime combinations, cleanup after crashes, symlink/mount escapes, and direct egress. Compare operational burden with the hosted SDK path in [E2B](ai-agents-sandbox--e2b.md).

## Evidence read

- [Docker network management and policy dependencies](https://github.com/alibaba/OpenSandbox/blob/c7dc78a4090e5de2b9119e9bd93952cae24f87bd/server/opensandbox_server/services/docker/networking.py#L17-L115)
- [Container platform and resource preparation](https://github.com/alibaba/OpenSandbox/blob/c7dc78a4090e5de2b9119e9bd93952cae24f87bd/server/opensandbox_server/services/docker/container_ops.py#L17-L105)

## Related directions

[Agents](../agents.md) · [Models](../models.md) · [Generation](../generation.md) · [Security](../security.md)

<!-- teamagent-analysis:start -->
Analysis metadata: source [opensandbox](https://github.com/alibaba/OpenSandbox); analyzed commit `c7dc78a4090e5de2b9119e9bd93952cae24f87bd`; commit date 2026-10-01T10:21:12+08:00; review date unknown; depth source-reviewed. [Maintenance record](../analyses/repos/ai-agents-sandbox--opensandbox.md).
<!-- teamagent-analysis:end -->
