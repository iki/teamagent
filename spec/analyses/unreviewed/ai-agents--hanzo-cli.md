# hanzo-cli

Source: [hanzo-cli](https://github.com/hanzoai/cli) · [agents](../../agents.md), [models](../../models.md), [channels](../../channels.md).

Depth: **unreviewed**. Discovered 2026-10-24T06:36:54.441Z; no source code or capabilities reviewed. [Change evidence](../repos/ai-agents--hanzo-cli.md).

## 2026-10-28 scoped source review

Source: [hanzo-cli](https://github.com/hanzoai/cli); inspected saved discovery revision `965a05686ba0d6c0379f62a35eb29c28ea29be66`. This is an initial scoped review of this newly catalogued source.

**Scope:** Full provider credential module with embedded tests, auth command adapter and cloud-session CLI tests read. Vault implementation, OAuth/refresh flow, onboarding, subprocess injection and cloud runtime were not audited.

The [provider credential module](https://github.com/hanzoai/cli/blob/965a05686ba0d6c0379f62a35eb29c28ea29be66/src/iam/provider.rs) separates secret vault slots from nonsecret active-provider configuration and tests provider, identity and wallet namespaces independently with an in-memory vault. Key validation bounds length and rejects embedded whitespace/control characters after trimming. Prefix routing checks vendor-specific forms before a broad sk- fallback; this avoids the documented collision in those fixtures but cannot authenticate a vendor or authorize sending every future sk- credential to the fallback destination. Vault encryption, OS protection and process transport remain outside this review.

The [auth adapter](https://github.com/hanzoai/cli/blob/965a05686ba0d6c0379f62a35eb29c28ea29be66/src/commands/auth.rs) delegates identity operations and deliberately prints a token only in its explicit token command, after checking a delegated spent-token predicate. Keep that output on a dedicated secret channel, never ordinary diagnostics. The [cloud CLI fixtures](https://github.com/hanzoai/cli/blob/965a05686ba0d6c0379f62a35eb29c28ea29be66/tests/cloud_sessions.rs) reject incompatible local/cloud flags instead of silently ignoring them, but help text and argument rejection do not establish remote execution or isolation. Adapt one credential owner, explicit provider binding and truthful option semantics; no login, vault, CLI, cloud service or tests were executed.

## 2026-10-28 follow-up source review

Reviewed the frozen update from `965a05686ba0d6c0379f62a35eb29c28ea29be66` to `1902384e1f6c1b0563e9fd1747efca6aab87edf1`. Earlier findings above remain historical evidence; this review is limited to the cited source and delta.

In [README.md](https://github.com/hanzoai/cli/blob/1902384e1f6c1b0563e9fd1747efca6aab87edf1/README.md#L124-L171), The complete one-file delta corrects documented command names for billing top-up, provider connection management, agent run and compute cluster/fleet operations, and updates the graph documentation link. No executable implementation changes in this delta.

**Harness implication and limits:** Use version-pinned command discovery/help rather than carrying stale CLI examples into adapters. These README examples are interface documentation, not evidence that account verification, credential isolation, remote provisioning or advertised graph semantics work. Existing source findings remain unchanged; no login, command execution, billing action or external graph citation was tested. This static review does not certify other changed subsystems.

<!-- teamagent-analysis:start -->
Analysis metadata: source [hanzo-cli](https://github.com/hanzoai/cli); analyzed commit `1902384e1f6c1b0563e9fd1747efca6aab87edf1`; commit date 2026-10-27T20:43:10-07:00; review date 2026-10-28T14:29:27.414Z; depth reviewed. [Maintenance record](../repos/ai-agents--hanzo-cli.md).
<!-- teamagent-analysis:end -->
