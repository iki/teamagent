# hanzo-dev

Source: [hanzo-dev](https://github.com/hanzoai/dev) · [agents](../../agents.md), [models](../../models.md), [channels](../../channels.md).

Historical discovery: 2026-10-24T06:36:54.441Z, initially unreviewed. Dated scoped reviews below supersede that discovery-only status; they do not establish runtime validation. [Change evidence](../repos/ai-agents--hanzo-dev.md).

## 2026-10-28 scoped source review

Source: [hanzo-dev](https://github.com/hanzoai/dev); inspected saved discovery revision `6fabbcc260f131d4efa5389a186ecccf7cc44e69`. This is an initial scoped review of this newly catalogued source.

**Scope:** Full Python runtime setup script and shell-tool entry/types read. Release metadata, downloaded assets, artifact staging module, Bash selection helpers, agent tools and tests were not audited.

The [runtime setup script](https://github.com/hanzoai/dev/blob/6fabbcc260f131d4efa5389a186ecccf7cc44e69/sdk/python/_runtime_setup.py) resolves a package version, maps supported platforms to release asset names, stages a temporary package and verifies the installed version on the ordinary install path. Its constants still select openai/codex and OpenAI-named packages in this Hanzo repository; preserve that source/artifact identity rather than assuming the repository's name identifies the downloaded runtime. The target-directory path returns without the same post-install check.

A version label is not an artifact digest. The script does not verify a downloaded checksum/signature, bound archive/download sizes or set explicit network/subprocess timeouts. It accepts an asset API URL from release metadata before adding authorization, and the legacy tar fallback removes the data filter entirely. Binary selection accepts the first broadly matching extracted candidate. These paths require destination policy, authenticated digests, bounded extraction and exact artifact selection before reuse. Error messages embed captured subprocess output, and local staging dynamically executes a trusted Python module, so neither is an untrusted-data boundary.

The [shell-tool entry](https://github.com/hanzoai/dev/blob/6fabbcc260f131d4efa5389a186ecccf7cc44e69/shell-tool-mcp/src/index.ts) resolves and prints a bundled Bash path through delegated platform helpers. It does not itself prove tool authorization, process isolation or runtime availability. Reject direct adoption of this installer as a trusted Teamagent boundary; no installer, downloads, packages, subprocesses or tests were executed.

## 2026-11-01 scoped source review

Reviewed commit `5193cc41eb96095e4cb12768bf4f5cc26bd7afda` (commit date `2026-10-29T15:43:30-07:00`), compared with `6fabbcc260f131d4efa5389a186ecccf7cc44e69`. Earlier observations remain historical evidence.

**Scope:** Nine changed paths inventoried; complete new idle.rs implementation and its inline tests, with the beginning of main.rs wiring inspected. Logo renderer and updated submodule contents not audited.

The [idle preview](https://github.com/hanzoai/dev/blob/5193cc41eb96095e4cb12768bf4f5cc26bd7afda/crates/hanzo-dev/src/idle.rs) uses a static plain frame for non-terminal or dumb-terminal output; interactive rendering uses bounded stage dimensions, reduced-motion/color choices and a Drop guard that requests terminal restoration. Frames are assembled before writing to reduce intermediate clearing. Inline tests check dimensions, monochrome shading and escape-free plain frames. Those checks do not establish native terminal behavior or cleanup after forced termination; restoration errors are ignored.

**Teamagent implication (inference):** Keep passive/noninteractive output finite and free of terminal controls, and separate preview capability from provider readiness. Terminal-state cleanup needs platform acceptance tests; this presentation change does not resolve the historical installer provenance concerns.

**Verification limit:** committed-source inspection only; no upstream code, tests or provider calls were executed. Review scope is the cited implementation or authored guidance, not whole-project correctness, licensing clearance or measured performance. Source passages were redacted for review; exact URL literals were not byte-validated.

<!-- teamagent-analysis:start -->
Analysis metadata: source [hanzo-dev](https://github.com/hanzoai/dev); analyzed commit `5193cc41eb96095e4cb12768bf4f5cc26bd7afda`; commit date 2026-10-29T15:43:30-07:00; review date 2026-11-01T11:33:30.893Z; depth reviewed. [Maintenance record](../repos/ai-agents--hanzo-dev.md).
<!-- teamagent-analysis:end -->
