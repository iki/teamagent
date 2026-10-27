# search.vercel: change evidence

Source: [search.vercel](https://github.com/vercel-labs/skills) · [Analysis](../../projects/ai-agents-skills--search.vercel.md) · [skills](../../skills.md), [agents](../../agents.md), [evolution](../../evolution.md)

Generated: 2026-10-27T18:19:07.717Z. Status: **changed**. Reviewed SHA: `a80e4c9d12d607631249d4d7d059f835d4b2f13a`; commit date: 2026-10-19T20:34:19Z; review date: 2026-10-24T06:36:54.441Z; observed SHA: `533c7df02f9b4d913fb8eba553aa99d86103d1d4`.

This generated packet is a bounded change locator, not a source review or a quality measurement. [Source comparison](https://github.com/vercel-labs/skills/compare/a80e4c9d12d607631249d4d7d059f835d4b2f13a...533c7df02f9b4d913fb8eba553aa99d86103d1d4). Working-tree changes: false; shallow history: false; report changed since recorded review: false.

- Git discovery: updated; source lifecycle: active; upstream availability: available.

## Recent commits

- [533c7df02f9b](https://github.com/vercel-labs/skills/commit/533c7df02f9b4d913fb8eba553aa99d86103d1d4) 2026-10-27T11:03:05+09:00: feat: add --frozen-lockfile to experimental_install and experimental_sync (#2559)
- [86cb8271585e](https://github.com/vercel-labs/skills/commit/86cb8271585e887fc04e8b33cd7e7711740fa710) 2026-10-27T10:51:41+09:00: perf: reinstall updated skills in-process (#2563)
- [a4907da65067](https://github.com/vercel-labs/skills/commit/a4907da65067097fdcb440927f47e2fc4a8dae3d) 2026-10-27T10:39:32+09:00: fix: treat an invalid skills-lock.json as an error, not an empty lock (#2562)
- [e7eda247877c](https://github.com/vercel-labs/skills/commit/e7eda247877cc7c6d5d6b6b5796b227d2f5f25d3) 2026-10-27T10:37:38+09:00: perf: download skill sources in parallel (#2558)
- [65d20cb6e3d9](https://github.com/vercel-labs/skills/commit/65d20cb6e3d951434bf408215309bb8aa094135a) 2026-10-26T12:42:29-07:00: Merge pull request #2589 from vercel-labs/fix/confine-skill-symlink-dereference
- [10406e245d23](https://github.com/vercel-labs/skills/commit/10406e245d239db4eb82f8b49836ce0f1990ae99) 2026-10-26T11:31:55-07:00: fix: confine symlink dereferencing to the skill directory

## Changed paths

- M: `AGENTS.md`
- M: `docs/commands.md`
- M: `src/add.test.ts`
- M: `src/add.ts`
- A: `src/ci.ts`
- M: `src/cli.ts`
- A: `src/concurrency.ts`
- M: `src/install.ts`
- M: `src/installer.ts`
- M: `src/list.ts`
- M: `src/local-lock.ts`
- M: `src/skills.ts`
- M: `src/source-parser.ts`
- M: `src/sync.ts`
- M: `src/telemetry.ts`
- M: `src/test-utils.ts`
- M: `src/update.ts`
- A: `tests/concurrency.test.ts`
- M: `tests/install-from-lock.test.ts`
- M: `tests/install.test.ts`
- A: `tests/invalid-local-lock.test.ts`
- M: `tests/local-lock.test.ts`
- A: `tests/parallel-source-fetch.test.ts`
- M: `tests/sync.test.ts`
- M: `tests/update.test.ts`
