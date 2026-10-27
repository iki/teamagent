# just-bash: change evidence

Source: [just-bash](https://github.com/vercel-labs/just-bash) · [Analysis](../../projects/ai-agents-sandbox--just-bash.md) · [agents](../../agents.md), [import-generation](../../import-generation.md), [security](../../security.md)

Generated: 2026-10-27T18:19:07.717Z. Status: **changed**. Reviewed SHA: `7537a260e38648e8998db7a95504102ad80b0194`; commit date: 2026-10-01T21:34:36+09:00; review date: unknown; observed SHA: `7a2a7a57d46095bf6cc8195680a13f76f784681b`.

This generated packet is a bounded change locator, not a source review or a quality measurement. [Source comparison](https://github.com/vercel-labs/just-bash/compare/7537a260e38648e8998db7a95504102ad80b0194...7a2a7a57d46095bf6cc8195680a13f76f784681b). Working-tree changes: false; shallow history: false; report changed since recorded review: false.

- Git discovery: unchanged; source lifecycle: active; upstream availability: available.

## Recent commits

- [7a2a7a57d460](https://github.com/vercel-labs/just-bash/commit/7a2a7a57d46095bf6cc8195680a13f76f784681b) 2026-10-22T08:52:03+09:00: docs: define issue priority and pull request triage (#655)
- [9ab0e0d34c1d](https://github.com/vercel-labs/just-bash/commit/9ab0e0d34c1d24978cd40ae890a91ccb223cc606) 2026-10-15T13:35:39+09:00: fix(rg): preserve empty piped stdin (#401)
- [8386d253f257](https://github.com/vercel-labs/just-bash/commit/8386d253f257ca8c2696075e44d0caedc44270aa) 2026-10-15T13:12:09+09:00: fix(awk): bound field array growth and record splitting (#590)
- [ad9039a850d7](https://github.com/vercel-labs/just-bash/commit/ad9039a850d71ddd67d7786550b9f32ed8f12dc0) 2026-10-15T13:11:40+09:00: Copy shopt options, readonly attributes, and hash table per exec (#592)
- [8fc1930c50c1](https://github.com/vercel-labs/just-bash/commit/8fc1930c50c198c4b6ea9d29c29ae1864ae38de3) 2026-10-14T22:07:45+09:00: fix(rg): align Grep tool arguments and output with ripgrep (#584)
- [f0baa001a3df](https://github.com/vercel-labs/just-bash/commit/f0baa001a3dfb69e1daed52c612400153a1ea2d8) 2026-10-14T17:20:09+09:00: fix(redirections): preserve opened destinations and redirect order (#580)
- [3ebd1c291462](https://github.com/vercel-labs/just-bash/commit/3ebd1c291462bc6bad3c6df7ebfe563d8799bfd9) 2026-10-14T02:42:19+09:00: fix(redirections): handle /dev/null without filesystem device nodes (#562)
- [6df20cebf56b](https://github.com/vercel-labs/just-bash/commit/6df20cebf56bf9bcc2d63b425f26a7446b13a67d) 2026-10-14T01:33:01+09:00: fix(redirections): fail the command, not exec(), when a redirect target's parent is missing (#561)
- [7c391598ec1e](https://github.com/vercel-labs/just-bash/commit/7c391598ec1efc4ffcc12388546fbef8f76a7b4e) 2026-10-14T01:29:43+09:00: fix(jq): evaluate X[expr]'s index against the input (#552)
- [58d1ecf31b76](https://github.com/vercel-labs/just-bash/commit/58d1ecf31b768ea9834e151b166cf4cea32046ba) 2026-10-07T00:17:24+09:00: fix(bash): pass per-exec env to nested sh/bash and stop leaking parent vars (#439)
- [864dfe5d4b9c](https://github.com/vercel-labs/just-bash/commit/864dfe5d4b9cf0447c4eb2002193f2ab2008bd0e) 2026-10-06T22:07:57+09:00: perf(text): 2x faster large-file tr/sed with up to 19x less memory allocation (#521)

## Changed paths

- A: `.changeset/awk-field-count-limit.md`
- A: `.changeset/dev-null-discard.md`
- A: `.changeset/hungry-peaches-find.md`
- A: `.changeset/jq-index-input.md`
- A: `.changeset/nested-shell-environment.md`
- A: `.changeset/per-exec-shell-state.md`
- A: `.changeset/prepared-routing.md`
- A: `.changeset/quiet-bytes-flow.md`
- A: `.changeset/redirect-open-errors.md`
- A: `.changeset/rg-empty-stdin.md`
- M: `CONTRIBUTING.md`
- M: `packages/just-bash/README.md`
- A: `packages/just-bash/scripts/benchmark-text-allocation.js`
- M: `packages/just-bash/src/Bash.exec-options.test.ts`
- M: `packages/just-bash/src/Bash.ts`
- M: `packages/just-bash/src/commands/awk/awk.allocation-limits.test.ts`
- M: `packages/just-bash/src/commands/awk/builtins.ts`
- M: `packages/just-bash/src/commands/awk/interpreter/fields.ts`
- M: `packages/just-bash/src/commands/awk/interpreter/variables.ts`
- A: `packages/just-bash/src/commands/bash/bash.env.test.ts`
- M: `packages/just-bash/src/commands/bash/bash.ts`
- M: `packages/just-bash/src/commands/find/find.ts`
- M: `packages/just-bash/src/commands/grep/grep.advanced.test.ts`
- M: `packages/just-bash/src/commands/grep/grep.ts`
- A: `packages/just-bash/src/commands/jq/jq.index-input.test.ts`
- A: `packages/just-bash/src/commands/js-exec/js-exec.buffer-compat.test.ts`
- A: `packages/just-bash/src/commands/js-exec/js-exec.buffer-write.test.ts`
- M: `packages/just-bash/src/commands/js-exec/module-shims.ts`
- M: `packages/just-bash/src/commands/query-engine/builtins/resource-limits.security.test.ts`
- M: `packages/just-bash/src/commands/query-engine/evaluator.ts`
- M: `packages/just-bash/src/commands/rg/imported-tests/feature.test.ts`
- M: `packages/just-bash/src/commands/rg/imported-tests/misc.test.ts`
- M: `packages/just-bash/src/commands/rg/rg-options.ts`
- M: `packages/just-bash/src/commands/rg/rg-parser.ts`
- M: `packages/just-bash/src/commands/rg/rg-search.ts`
- M: `packages/just-bash/src/commands/rg/rg.basic.test.ts`
- M: `packages/just-bash/src/commands/rg/rg.edge-cases.test.ts`
- A: `packages/just-bash/src/commands/rg/rg.grep-tool.test.ts`
- M: `packages/just-bash/src/commands/rg/rg.max-count.test.ts`
- M: `packages/just-bash/src/commands/rg/rg.stdin.test.ts`
- M: `packages/just-bash/src/commands/rg/rg.ts`
- M: `packages/just-bash/src/commands/search-engine/matcher.ts`
- M: `packages/just-bash/src/commands/sed/executor.ts`
- M: `packages/just-bash/src/commands/sed/sed.limits.test.ts`
- A: `packages/just-bash/src/commands/tr/tr.output.test.ts`
- M: `packages/just-bash/src/commands/tr/tr.ts`
- M: `packages/just-bash/src/commands/xan/xan.map.test.ts`
- M: `packages/just-bash/src/comparison-tests/README.md`
- M: `packages/just-bash/src/comparison-tests/cd.comparison.test.ts`
- A: `packages/just-bash/src/comparison-tests/fixtures/cd.comparison.fixtures.json`
- A: `packages/just-bash/src/comparison-tests/fixtures/rg-grep-tool.comparison.fixtures.json`
- A: `packages/just-bash/src/comparison-tests/fixtures/sed-global-gaps.comparison.fixtures.json`
- A: `packages/just-bash/src/comparison-tests/rg-grep-tool.comparison.test.ts`
- A: `packages/just-bash/src/comparison-tests/sed-global-gaps.comparison.test.ts`
- A: `packages/just-bash/src/encoding.conversion.test.ts`
- M: `packages/just-bash/src/encoding.fs-fallback.test.ts`
- M: `packages/just-bash/src/encoding.ts`
- M: `packages/just-bash/src/fs/overlay-fs/overlay-fs.security.test.ts`
- M: `packages/just-bash/src/interpreter/builtin-dispatch.ts`
- M: `packages/just-bash/src/interpreter/builtins/cd.test.ts`
- M: `packages/just-bash/src/interpreter/builtins/cd.ts`
- M: `packages/just-bash/src/interpreter/fd-table.ts`
- M: `packages/just-bash/src/interpreter/functions.ts`
- A: `packages/just-bash/src/interpreter/group-stdin.descriptors.test.ts`
- M: `packages/just-bash/src/interpreter/helpers/errors.ts`
- M: `packages/just-bash/src/interpreter/interpreter.ts`
- M: `packages/just-bash/src/interpreter/pipeline-execution.ts`
- A: `packages/just-bash/src/interpreter/redirections.dev-null.test.ts`
- A: `packages/just-bash/src/interpreter/redirections.open-errors.test.ts`
- A: `packages/just-bash/src/interpreter/redirections.routing.test.ts`
- M: `packages/just-bash/src/interpreter/redirections.ts`
- M: `packages/just-bash/src/interpreter/state-transaction.ts`
- M: `packages/just-bash/src/interpreter/types.ts`
- M: `packages/just-bash/src/security/defense-in-depth-hardening.test.ts`
- M: `packages/just-bash/src/spec-tests/bash/cases/builtin-cd.test.sh`
- M: `packages/just-bash/src/spec-tests/jq/skips.ts`
- M: `packages/just-bash/src/types.ts`
- A: `packages/just-bash/src/utils/string-builder.test.ts`
- A: `packages/just-bash/src/utils/string-builder.ts`
