---
name: dependency-patches
description: Reuse centrally owned dependency fixes with exact provenance and consumer verification. Use for patched-package updates, upstream regressions, or shared registry maintenance; not for authorizing independent workarounds or changing patch ownership.
---

# Shared dependency fixes

Read the consuming project's dependency policy, canonical patch owner, registry, package-manager configuration, and supported version pins. The owner is a project decision, not the repository hosting this skill. Preserve the current authority until an explicit migration is approved and verified.

Separate an application implementation defect from a third-party dependency defect. Reproduce the latter with bounded inputs and identify the affected exact version and runtime. Search the selected registry for an applicable supplied fix. Do not import all patches from a related stack or assume that an old workaround still reproduces on a new version.

Verify the artifact's source revision, hashes, license, affected versions, prerequisites, regression coverage, and removal condition. Keep selected immutable artifacts and provenance in the consumer when offline checks/installations need them; a sibling checkout must not become an undeclared runtime dependency. Register transitive selectors exactly rather than treating any similarly named patch as coverage.

If the authoritative fix is absent, incompatible, or unverifiable, follow the project's escalation rule with the reproduction. Do not let a fallback, CI repair, declaration shim, fork, or monkeypatch bypass centralized ownership. A skill installation grants no permission to change dependency trust or author a second independent patch.

Keep discovery and application separate. Planning records exact current and proposed versions, dependency roles, artifact hashes, and compatibility. Apply through the owning package manager only after rechecking the baseline. Inspect manifest and lockfile diffs together; preserve lifecycle-script trust decisions. Retain uncertain install outcomes and reconcile them before retrying.

Normal integrity gates stay offline. Exercise the supplied fix through the actual consumer and affected platform where necessary, independently of the registry's own tests. Remove a patch only after proving that the selected upstream version fixes the reproduced defect and the consumer still passes. Keep the historical selection/removal evidence.

For a registry ownership migration, transfer exact artifacts, licenses, supported versions, upstream references, regressions, and removal criteria first; then change consumer policy deliberately. A dedicated shared registry can decouple patch releases from application releases. The procedure skill and patch artifacts need not share a repository or release cadence.
