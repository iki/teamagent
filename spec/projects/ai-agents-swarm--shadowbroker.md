# shadowbroker

Source: [shadowbroker](https://github.com/BigBodyCobain/Shadowbroker) · Category: [ai-agents-swarm](../categories/ai-agents-swarm.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `f4aaeb45e53383ae59e652ca2d43b527dcd669ea`; commit timestamp `2026-10-01T13:33:45-06:00`; 1,206 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/BigBodyCobain/Shadowbroker/blob/f4aaeb45e53383ae59e652ca2d43b527dcd669ea/README.md)):

> Global Threat Intercept — Real-Time Geospatial Intelligence Platform [](https://github.com/user-attachments/assets/248208ec-62f7-49d1-831d-4bd0a1fa6852)

Build/package evidence: [backend/package.json](https://github.com/BigBodyCobain/Shadowbroker/blob/f4aaeb45e53383ae59e652ca2d43b527dcd669ea/backend/package.json); [backend/pyproject.toml](https://github.com/BigBodyCobain/Shadowbroker/blob/f4aaeb45e53383ae59e652ca2d43b527dcd669ea/backend/pyproject.toml); [desktop-shell/package.json](https://github.com/BigBodyCobain/Shadowbroker/blob/f4aaeb45e53383ae59e652ca2d43b527dcd669ea/desktop-shell/package.json); [desktop-shell/tauri-skeleton/src-tauri/Cargo.toml](https://github.com/BigBodyCobain/Shadowbroker/blob/f4aaeb45e53383ae59e652ca2d43b527dcd669ea/desktop-shell/tauri-skeleton/src-tauri/Cargo.toml); [frontend/package.json](https://github.com/BigBodyCobain/Shadowbroker/blob/f4aaeb45e53383ae59e652ca2d43b527dcd669ea/frontend/package.json)

License evidence: [LICENSE](https://github.com/BigBodyCobain/Shadowbroker/blob/f4aaeb45e53383ae59e652ca2d43b527dcd669ea/LICENSE) Classification hint: AGPL; inspect version. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents-swarm**. Its category places it in the candidate set for agents, decisions; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [decisions](../decisions.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

## Source update reviewed 2026-10-28

Reviewed commit: [`8a1915851f379fddd51b1ef3e6e8d9b598068a45`](https://github.com/bigbodycobain/shadowbroker/commit/8a1915851f379fddd51b1ef3e6e8d9b598068a45). Scope: Full terminal-session lifecycle, admin-session route and LAN-mode backend/proxy tests read. Session store, production proxy/backend authorization and mesh privacy implementation were not audited.

The [admin-session route](https://github.com/bigbodycobain/shadowbroker/blob/8a1915851f379fddd51b1ef3e6e8d9b598068a45/frontend/src/app/api/admin/session/route.ts) requires a configured local admin key before issuing a cookie, uses length-checked timing-safe comparison and no-store responses, and no longer treats success from a public backend endpoint as proof of authentication. The [LAN fixtures](https://github.com/bigbodycobain/shadowbroker/blob/8a1915851f379fddd51b1ef3e6e8d9b598068a45/frontend/src/__tests__/proxy/proxyLanMode.test.ts) require sign-in before forwarding server credentials and ignore spoofed forwarded-for locality. [Backend tests](https://github.com/bigbodycobain/shadowbroker/blob/8a1915851f379fddd51b1ef3e6e8d9b598068a45/backend/tests/test_lan_mode_auth.py) still permit loopback unless an explicit untrusted-loopback setting is used; deployment mode remains part of the trust contract.

The [terminal lifecycle](https://github.com/bigbodycobain/shadowbroker/blob/8a1915851f379fddd51b1ef3e6e8d9b598068a45/frontend/src/lib/infonetTerminalSession.ts) shares an in-flight end promise and attempts to restore prior node state, but begin is not serialized with end, shared booleans can race across calls and most failures are swallowed. It can notify session end without confirmed service teardown. Adapt authenticated session minting and adversarial locality fixtures; use scoped lifecycle state and explicit cleanup outcomes for Teamagent. No admin session, network, mesh service or tests were run.

## Source update reviewed 2026-11-01

Reviewed commit [`8e7d967de5e7f4d8448594096e1921624b133501`](https://github.com/bigbodycobain/shadowbroker/commit/8e7d967de5e7f4d8448594096e1921624b133501), compared with `8a1915851f379fddd51b1ef3e6e8d9b598068a45`.

The nine-path delta pins matching React/React DOM versions, groups their dependency updates and adds an installed-version equality assertion in [CI](https://github.com/bigbodycobain/shadowbroker/blob/8e7d967de5e7f4d8448594096e1921624b133501/.github/workflows/ci.yml). The [layout](https://github.com/bigbodycobain/shadowbroker/blob/8e7d967de5e7f4d8448594096e1921624b133501/frontend/src/app/layout.tsx) switches from Google font acquisition to local regular/bold files with accompanying source/license documentation. All textual changes were read; the two font binaries were inventoried, not independently authenticated or rendered.

Adapt installed compatibility checks for coupled packages and local asset provenance where offline builds matter. A local font alone does not establish that the whole build or application is offline. This update does not independently change or validate the swarm design; no upstream install, CI, browser or tests were run.

## External-update review - 2026-11-01

Reviewed `40c129f07b91714e437ead56f23f2a2432747e04` against `8e7d967de5e7f4d8448594096e1921624b133501` after reconciling the local category move. The two-path update changes [frontend/package.json](https://github.com/bigbodycobain/shadowbroker/blob/40c129f07b91714e437ead56f23f2a2432747e04/frontend/package.json) and its [lockfile](https://github.com/bigbodycobain/shadowbroker/blob/40c129f07b91714e437ead56f23f2a2432747e04/frontend/package-lock.json): Next.js moves from 16.3.8 to 16.4.3, with matching environment/native compiler artifacts, explicit Linux libc metadata and an updated optional sharp requirement. No application source or authorization tests change in this delta.

**Architecture consequence:** Preserve the earlier session and locality trust findings; framework-version churn does not independently validate them. Verification reuse must include the resolved dependency graph and platform/native artifact identity, with applicable application acceptance checks after a framework change. This observation neither selects a new Teamagent framework nor bypasses its Trigon-owned shared dependency process.

**Scope and limits:** Complete two-path inventory and dependency delta inspected. No package download, installation, build, browser/native acceptance test or upstream CI result was executed or independently verified. The update establishes declared dependency state, not security remediation or improved swarm behavior. Related directions: [agents](../agents.md), [decisions](../decisions.md), [evolution](../evolution.md).

<!-- teamagent-analysis:start -->
Analysis metadata: source [shadowbroker](https://github.com/bigbodycobain/shadowbroker); analyzed commit `40c129f07b91714e437ead56f23f2a2432747e04`; commit date 2026-11-01T10:01:10-07:00; review date 2026-11-01T23:12:06.798Z; depth screened. [Maintenance record](../analyses/repos/ai-agents-swarm--shadowbroker.md).
<!-- teamagent-analysis:end -->
