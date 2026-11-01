# playwright

Source: [playwright](https://github.com/microsoft/playwright) · Category: [ai-query](../categories/ai-query.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `7ad3fba1aad9471c7e46d67a11b0e710a5d77ea8`; commit timestamp `2026-10-03T07:57:47+01:00`; 3,110 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/microsoft/playwright/blob/7ad3fba1aad9471c7e46d67a11b0e710a5d77ea8/README.md)):

> [](https://www.npmjs.com/package/playwright)  [](https://www.chromium.org/Home)   [](https://www.mozilla.org/en-US/firefox/new/)   [](https://webkit.org/)  [](https://aka.ms/playwright/discord) Playwright is a framework for web automation and testing. It drives Chromium, Firefox, and WebKit with a single API — in your tests, in your scripts, and as a tool for AI agents.

Build/package evidence: [examples/github-api/package.json](https://github.com/microsoft/playwright/blob/7ad3fba1aad9471c7e46d67a11b0e710a5d77ea8/examples/github-api/package.json); [examples/mock-battery/package.json](https://github.com/microsoft/playwright/blob/7ad3fba1aad9471c7e46d67a11b0e710a5d77ea8/examples/mock-battery/package.json); [examples/mock-filesystem/package.json](https://github.com/microsoft/playwright/blob/7ad3fba1aad9471c7e46d67a11b0e710a5d77ea8/examples/mock-filesystem/package.json); [examples/svgomg/package.json](https://github.com/microsoft/playwright/blob/7ad3fba1aad9471c7e46d67a11b0e710a5d77ea8/examples/svgomg/package.json); [examples/todomvc/package.json](https://github.com/microsoft/playwright/blob/7ad3fba1aad9471c7e46d67a11b0e710a5d77ea8/examples/todomvc/package.json)

License evidence: [LICENSE](https://github.com/microsoft/playwright/blob/7ad3fba1aad9471c7e46d67a11b0e710a5d77ea8/LICENSE) Classification hint: Apache-2.0. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-query**. Its category places it in the candidate set for memory, import-generation, decisions; those associations are navigational and have not been individually validated as implemented capabilities. See [memory](../memory.md) · [import-generation](../import-generation.md) · [decisions](../decisions.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.


## Change review - 2026-10-28

**Cookie parsing preserves empty-name values and proxy credentials separate from origin authentication.** Reviewed commit `a169686c61af856cd1434b4994ef9c3222ee1041` (commit date `2026-10-27T13:19:01Z`). Compared with `7ad3fba1aad9471c7e46d67a11b0e710a5d77ea8`; the complete Git comparison contains 725 changed paths.

Cookie parsing now splits the first name/value pair at its first equals sign, supports a value with an empty name, rejects the entirely empty pair and serializes unnamed values without adding an equals sign. Max-Age must be optional minus plus digits, is clamped, and overrides Expires regardless of attribute order. Browser-context clearing preserves the original value while expiring the cookie, avoiding an empty-name/empty-value request that browsers may ignore. Domain/path matching moved out of this module; these changes alone do not establish its replacement enforcement.

Proxy authentication no longer writes proxy credentials into the origin HTTP-credentials option, and the new proxyCredentials accessor keeps that selection separate. The client route API uses decorators while interception updates still pass kNoTimeout; unroute waits for all selected handler stops without a local aggregate deadline. The SOCKS close callback now waits for browser decryption before destroying the encrypted stream, but the callback itself supplies no deadline. The inspected WebAuthn fixture checks registration/authentication toJSON fields, base64url data and authenticator flags; it is source-level coverage, not an observed browser pass.

Evidence: [packages/playwright-core/src/server/cookieStore.ts:120-215](https://github.com/microsoft/playwright/blob/a169686c61af856cd1434b4994ef9c3222ee1041/packages/playwright-core/src/server/cookieStore.ts#L120-L215) · [packages/playwright-core/src/server/browserContext.ts:310-333](https://github.com/microsoft/playwright/blob/a169686c61af856cd1434b4994ef9c3222ee1041/packages/playwright-core/src/server/browserContext.ts#L310-L333) · [packages/playwright-core/src/server/browserContext.ts:462-487](https://github.com/microsoft/playwright/blob/a169686c61af856cd1434b4994ef9c3222ee1041/packages/playwright-core/src/server/browserContext.ts#L462-L487) · [packages/playwright-core/src/client/browserContext.ts:382-481](https://github.com/microsoft/playwright/blob/a169686c61af856cd1434b4994ef9c3222ee1041/packages/playwright-core/src/client/browserContext.ts#L382-L481) · [packages/playwright-core/src/server/socksClientCertificatesInterceptor.ts:105-156](https://github.com/microsoft/playwright/blob/a169686c61af856cd1434b4994ef9c3222ee1041/packages/playwright-core/src/server/socksClientCertificatesInterceptor.ts#L105-L156) · [tests/library/browsercontext-webauthn.spec.ts:277-353](https://github.com/microsoft/playwright/blob/a169686c61af856cd1434b4994ef9c3222ee1041/tests/library/browsercontext-webauthn.spec.ts#L277-L353).

**Harness consequence:** Keep cookie grammar, browser applicability and credential origin scopes distinct in the browser adapter. Regression fixtures should cover Max-Age ordering, unnamed cookies and proxy/origin credential separation. Give handler teardown and TLS interception a host-owned deadline with joined cleanup, and verify WebAuthn behavior on the actual supported browsers rather than inferring it from fixture text.

**Scope and limits:** Static scoped cookie, proxy-credential, route-lifecycle and selected WebAuthn fixture review within the 725-path comparison. Relocated cookie matching, full transport/decorator internals and other changes were not audited; no browser, proxy or upstream test was executed.

## Follow-up change review — 2026-10-28

**Tool side-effect declarations and trace-frame selection are corrected independently.** Reviewed commit `f9a841f968dd9a4e315df2ec2930da1952971667` (commit date `2026-10-27T16:11:56-07:00`), compared with `a169686c61af856cd1434b4994ef9c3222ee1041`. The complete no-rename Git path inventory contains 23 changed paths.

Test setup and generated-test writing change from readOnly to action descriptors. The snapshot nearest-frame helper also scans all supplied frames, choosing the last equal-distance match, instead of assuming monotonic frame times. This addresses out-of-order screencast observations without claiming frames themselves are complete or trustworthy.

Evidence: [packages/playwright/src/mcp/test/generatorTools.ts:25-40](https://github.com/microsoft/playwright/blob/f9a841f968dd9a4e315df2ec2930da1952971667/packages/playwright/src/mcp/test/generatorTools.ts#L25-L40) · [packages/playwright/src/mcp/test/generatorTools.ts:65-80](https://github.com/microsoft/playwright/blob/f9a841f968dd9a4e315df2ec2930da1952971667/packages/playwright/src/mcp/test/generatorTools.ts#L65-L80) · [packages/isomorphic/trace/snapshotRenderer.ts:22-39](https://github.com/microsoft/playwright/blob/f9a841f968dd9a4e315df2ec2930da1952971667/packages/isomorphic/trace/snapshotRenderer.ts#L22-L39).

**Harness consequence:** Classify tools by their actual writes, even when their purpose is testing. Reconcile timing evidence by explicit timestamps rather than arrival order and preserve trace gaps instead of asserting perfect synchronization.

**Scope and limits:** Reviewed the complete two changed hunks against their target blobs; no browser/test generation or full trace pipeline was executed. This is a scoped static comparison, not a whole-project correctness or security audit. Upstream tests were read where cited, not run; no upstream code, service, model or provider operation was executed. Historical findings above remain evidence at their own revisions.

## Change review - 2026-11-01

Reviewed `deb7e86201e26cb4a8e25191fce5ef2f7a28aa87` against `f9a841f968dd9a4e315df2ec2930da1952971667` (169 changed paths). The [event emitter](https://github.com/microsoft/playwright/blob/deb7e86201e26cb4a8e25191fce5ef2f7a28aa87/packages/playwright-core/src/client/eventEmitter.ts) now captures synchronous listener throws and foreign/custom thenables, reads `then` once and routes errors through an explicit error listener when present. Pending handlers participate in cleanup; uncaught errors are not silently converted to successful events. The [listener fixtures](https://github.com/microsoft/playwright/blob/deb7e86201e26cb4a8e25191fce5ef2f7a28aa87/tests/library/events/listener-errors.spec.ts) exercise throwing getters, cross-realm promises, continuation and fatal unhandled/error-listener failures. Selected [drain fixtures](https://github.com/microsoft/playwright/blob/deb7e86201e26cb4a8e25191fce5ef2f7a28aa87/tests/library/events/remove-all-listeners-wait.spec.ts) retain separate wait versus ignore-errors behavior.

**Harness consequence:** Own asynchronous event work across synchronous throws and thenable boundaries; explicitly choose whether cleanup drains or suppresses already-observed failures. Event dispatch completion is not completion of all listeners. Add cancellation/deadline ownership above a library that tracks pending work without proving it must settle.

**Scope and limits:** Emitter and selected error/drain fixture deltas only, not browser-engine or MCP changes. No upstream process, browser test or acceptance suite was executed.

<!-- teamagent-analysis:start -->
Analysis metadata: source [playwright](https://github.com/microsoft/playwright); analyzed commit `deb7e86201e26cb4a8e25191fce5ef2f7a28aa87`; commit date 2026-10-31T07:56:17-07:00; review date 2026-11-01T11:37:37.120Z; depth screened. [Maintenance record](../analyses/repos/ai-query--playwright.md).
<!-- teamagent-analysis:end -->
