# sandbox-runtime: OS-enforced local execution

Source: [anthropic-sandbox-runtime](https://github.com/anthropic-experimental/sandbox-runtime) · Category: `ai-agents-sandbox`

Review depth: **source-reviewed**. Snapshot `9e93406ab2e0b6e9794624896f729560dc9445db`; assessed 2026-10-04. This is a focused static review of the listed files, not an audit of every code path or a reproduced benchmark. No repository code, model weights, paid endpoints, or installers were run.

## Observed architecture

The manager integrates platform-specific process wrappers with HTTP/SOCKS/multiplexing proxies, credential masking, resolved-address checks, violation storage, and platform dependency checks. The snapshot includes Linux, macOS, and Windows integration paths.

The Windows wrapper describes a Rust helper that provisions a dedicated sandbox user, applies Windows Filtering Platform egress filters keyed to that account, launches restricted-token processes, and enforces filesystem rules through ACL entries. Its error taxonomy distinguishes an absent helper, failed launch, failed verification, and an inactive or inconclusive egress fence. These explicit states are more useful than a single `sandbox=true` flag.

## Harness adoption

Study this as the local process-enforcement adapter. At worker enrollment, probe enforcement capabilities and run a bounded self-test. Report a capability matrix for read/write confinement, network mediation, process termination, and credential injection. If a requested boundary cannot be established, refuse that execution class or choose a different worker; do not silently run unrestricted.

Use task-scoped grants and clean credential proxies. The application still needs task authorization, workspace policy, and a durable audit trail because OS enforcement answers what a process can access, not whether the user's requested action authorizes it.

## Limitations and decision

Source comments and wrappers establish intended mechanisms, not verified resistance to escape on this workstation. Windows provisioning and machine-wide policy setup can require administrative installation and lifecycle maintenance. Parent proxies, certificates, and credential substitution expand the trusted boundary. The official GitHub location, checked 2026-10-04, redirects from the checked-out origin to [anthropics/sandbox-runtime](https://github.com/anthropics/sandbox-runtime); pinned source links preserve the snapshot origin. Adopt only after per-platform enforcement and cleanup checks, and keep stronger disposable workers available for hostile builds.

## Evidence read

- [Manager integrates platform backends and proxies](https://github.com/anthropic-experimental/sandbox-runtime/blob/9e93406ab2e0b6e9794624896f729560dc9445db/src/sandbox/sandbox-manager.ts#L1-L125)
- [Windows helper architecture and errors](https://github.com/anthropic-experimental/sandbox-runtime/blob/9e93406ab2e0b6e9794624896f729560dc9445db/src/sandbox/windows-sandbox-utils.ts#L31-L90)

## Related directions

[Agents](../agents.md) · [Models](../models.md) · [Security](../security.md)

<!-- teamagent-analysis:start -->
Analysis metadata: source [anthropic-sandbox-runtime](https://github.com/anthropic-experimental/sandbox-runtime); analyzed commit `9e93406ab2e0b6e9794624896f729560dc9445db`; commit date 2026-10-03T13:33:01+01:00; review date unknown; depth source-reviewed. [Maintenance record](../analyses/repos/ai-agents-sandbox--anthropic-sandbox-runtime.md).
<!-- teamagent-analysis:end -->
