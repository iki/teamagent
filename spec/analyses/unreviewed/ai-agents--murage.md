# murage

Source: [murage](https://github.com/ferroxlabs/murage) · [agents](../../agents.md), [models](../../models.md), [channels](../../channels.md).

Historical discovery: 2026-10-24T06:36:54.441Z, initially unreviewed. Dated scoped reviews below supersede that discovery-only status; they do not establish runtime validation. [Change evidence](../repos/ai-agents--murage.md).

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

## 2026-11-01 scoped source review

Reviewed frozen commit `f23d9fbff36a1ae3d841006f35e39a39ade12089` against prior analyzed commit `24ab901bc8bdd90685398df00be35a7627937992`. Historical reviews above remain separate evidence.

The [Pi permission gate](https://github.com/ferroxlabs/murage/blob/f23d9fbff36a1ae3d841006f35e39a39ade12089/server/drivers/pi-permission-gate.ts) expands sensitive-path patterns for gcloud credentials and the Hermes ask-hook directory. It also expands the trusted own-mount bypass table to phone operations and email sending/replying. These changes increase both protection and preauthorized capability scope; adding a tool to an owned mount is not, by itself, evidence that the user authorized its effects.

The [new fixture](https://github.com/ferroxlabs/murage/blob/f23d9fbff36a1ae3d841006f35e39a39ade12089/server/drivers/pi-permission-gate.test.ts) checks every declared phone tool on `own:phoneJobs` proceeds without a desktop approval card, while an identically named calendar tool on a custom mount still asks. This supports mount-and-tool identity separation, not validation of the phone handler's downstream consent or operating-system authorization. Teamagent should retain explicit operation-scoped consent for sending, dialing, location and scheduling, even when the tool implementation is first party. The regex additions are defense-in-depth patterns, not a complete filesystem or shell parser.

**Coverage:** Read the complete targeted Pi permission-gate implementation/test delta. Phone/email handlers, other engines and the remaining oversized repository change were not inspected. Source inspection only; no upstream tests, source programs or live providers were executed. This is a scoped architecture review, not a whole-repository correctness or security certification.

<!-- teamagent-analysis:start -->
Analysis metadata: source [murage](https://github.com/ferroxlabs/murage); analyzed commit `f23d9fbff36a1ae3d841006f35e39a39ade12089`; commit date 2026-10-31T16:10:13+08:00; review date 2026-11-01T11:33:30.893Z; depth reviewed. [Maintenance record](../repos/ai-agents--murage.md).
<!-- teamagent-analysis:end -->
