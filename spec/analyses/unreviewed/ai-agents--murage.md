# murage

Source: [murage](https://github.com/ferroxlabs/murage) · [agents](../../agents.md), [models](../../models.md), [channels](../../channels.md).

Depth: **unreviewed**. Discovered 2026-10-24T06:36:54.441Z; no source code or capabilities reviewed. [Change evidence](../repos/ai-agents--murage.md).

## 2026-10-28 scoped source review

Source: [murage](https://github.com/ferroxlabs/murage); inspected saved discovery revision `833c3a3c573c486833ed41281f4017c4da258e46`. This is an initial scoped review of this newly catalogued source.

**Scope:** Full agent-plan normalizer/tests, overflow tool-result cache and fresh-auth client helper read. Server authorization, digest construction, native signing, redactor and tool-result route ownership were not audited.

The [fresh-auth helper](https://github.com/ferroxlabs/murage/blob/833c3a3c573c486833ed41281f4017c4da258e46/src/lib/fresh-auth.ts#L72-L108) permits one signed retry after checking the requested decision, card digest and skill-preview hash. Cancellation remains pending rather than becoming approval. Concurrent allows for the same thread/request share an in-flight result, while denies are not held. This is client-side binding evidence; nonce expiry, native key protection, signature verification and actual server enforcement were not inspected. The pending map has no local timeout, and its join key does not distinguish allow-once from allow-task, so callers must not interpret joining as a new grant.

The [overflow cache](https://github.com/ferroxlabs/murage/blob/833c3a3c573c486833ed41281f4017c4da258e46/server/tool-results.ts) enforces per-owner and global entry/byte quotas, fixed expiry, owner equality on reads, safe integer offsets and surrogate-aware page boundaries. It redacts before clipping and explicitly disclaims durable history and protection for results that bypass the cache. Authenticated ownership and redaction quality remain external dependencies, and processing a complete incoming string before clipping still needs an upstream input bound.

The [plan normalizer and tests](https://github.com/ferroxlabs/murage/blob/833c3a3c573c486833ed41281f4017c4da258e46/shared/agent-plan.ts) distinguish malformed updates from an intentionally empty plan, cap output entries/text and conservatively map unknown statuses to pending. They silently discard invalid entries and do not report truncation; output limits also do not bound processing a very large invalid input array. Keep these states visible in Teamagent and treat agent-reported completion as a claim, not independently verified task success. No app, native prompt, network or tests were executed.

## 2026-10-28 follow-up source review

Reviewed the frozen update from `833c3a3c573c486833ed41281f4017c4da258e46` to `24ab901bc8bdd90685398df00be35a7627937992`. Earlier findings above remain historical evidence; this review is limited to the cited source and delta.

In [server/drivers/pi-permission-gate.ts](https://github.com/ferroxlabs/murage/blob/24ab901bc8bdd90685398df00be35a7627937992/server/drivers/pi-permission-gate.ts#L91-L110), Sensitive-path policy adds credentials.bin and provider-key patterns by basename because desktop user data can move during profile restoration. The row supplies separate regex, read-glob and shell-pattern forms instead of assuming only the default application directory.

**Harness implication and limits:** Credential protection must follow actual relocated storage roots as well as conventional filenames. Pattern matching is a defense-in-depth heuristic; renamed files, indirection, shell expansion and alternate effect routes require resolved-path authorization and OS boundaries. The permission evaluator and restore implementation were not inspected, and no credentials or shell actions were accessed. This static review does not certify other changed subsystems.

<!-- teamagent-analysis:start -->
Analysis metadata: source [murage](https://github.com/ferroxlabs/murage); analyzed commit `24ab901bc8bdd90685398df00be35a7627937992`; commit date 2026-10-28T03:30:19+07:00; review date 2026-10-28T14:29:27.414Z; depth reviewed. [Maintenance record](../repos/ai-agents--murage.md).
<!-- teamagent-analysis:end -->
