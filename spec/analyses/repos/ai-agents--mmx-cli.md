# mmx-cli: change evidence

Source: [mmx-cli](https://github.com/MiniMax-AI/cli) · [Analysis](../../projects/ai-agents--mmx-cli.md) · [agents](../../agents.md), [models](../../models.md), [channels](../../channels.md)

Generated: 2026-10-27T18:19:07.717Z. Status: **changed**. Reviewed SHA: `06e47c70b76f419196678367dae62acca4c94076`; commit date: 2026-09-29T20:36:31+08:00; review date: unknown; observed SHA: `38aba5f26173dd1065b115b221d79c9ddd87c6bb`.

This generated packet is a bounded change locator, not a source review or a quality measurement. [Source comparison](https://github.com/MiniMax-AI/cli/compare/06e47c70b76f419196678367dae62acca4c94076...38aba5f26173dd1065b115b221d79c9ddd87c6bb). Working-tree changes: false; shallow history: false; report changed since recorded review: false.

- Git discovery: unchanged; source lifecycle: active; upstream availability: available.

## Recent commits

- [38aba5f26173](https://github.com/MiniMax-AI/cli/commit/38aba5f26173dd1065b115b221d79c9ddd87c6bb) 2026-10-19T18:26:46+08:00: feat(agent): default pay-as-you-go keys to MiniMax-M3.1-Flash (#296)
- [0819e479bf0e](https://github.com/MiniMax-AI/cli/commit/0819e479bf0eaef00350f7a85bfd6fa699867676) 2026-10-19T18:21:41+08:00: fix(agent): declare MiniMax native effort levels and no temperature for Pi and OpenCode (#298)
- [d91a24cc88bc](https://github.com/MiniMax-AI/cli/commit/d91a24cc88bc538365bf66be9ce8054d76969b83) 2026-10-19T15:44:31+08:00: feat(agent): add Zed agent setup (#297)
- [6eeca8726f99](https://github.com/MiniMax-AI/cli/commit/6eeca8726f99a58526586c919d9db90c63882d93) 2026-10-19T14:38:29+08:00: fix(agent): send effort for omp M3.1 Flash low/medium/high (#295)
- [15ceba570fbf](https://github.com/MiniMax-AI/cli/commit/15ceba570fbf7a109d6894c8940e447df36d84b7) 2026-10-19T12:46:27+08:00: feat: rename MiniMax-M3.1-Flash-Preview to MiniMax-M3.1-Flash (#294)
- [bcfc708cdf1f](https://github.com/MiniMax-AI/cli/commit/bcfc708cdf1f9c8b0fb9e725698a487888918c7c) 2026-10-19T12:40:07+08:00: feat(agent): keep only M3.1 and M3 in agent setup models (#293)
- [ca1724896e24](https://github.com/MiniMax-AI/cli/commit/ca1724896e24c370e6981ba210e732450dd5a0b8) 2026-10-17T02:09:25+08:00: Merge pull request #284 from ch-z-hc/fix/oauth-resource-key-host
- [10b4ea08a5ca](https://github.com/MiniMax-AI/cli/commit/10b4ea08a5ca161d478f65b9b805ba0ae0188b96) 2026-10-17T02:08:40+08:00: Merge pull request #283 from ch-z-hc/fix/poll-deadline-sleep
- [8668aa5578ac](https://github.com/MiniMax-AI/cli/commit/8668aa5578ac887d0384cc17d098ecb2ce3a3d8f) 2026-10-16T22:32:07+08:00: fix: coalesce concurrent automatic OAuth refreshes (#291)
- [dc61fe89df77](https://github.com/MiniMax-AI/cli/commit/dc61fe89df77f6e7aebe6205202b3cedeb4f478c) 2026-10-14T03:45:47+08:00: fix: scope OAuth resource URL to OAuth credentials
- [78469b689b38](https://github.com/MiniMax-AI/cli/commit/78469b689b381ab890cf04a522f87d55e4540f43) 2026-10-13T22:10:20+08:00: fix: cap polling sleep at the remaining deadline
- [a965e72ce424](https://github.com/MiniMax-AI/cli/commit/a965e72ce424e465ae65ded102315bf73bef0aa3) 2026-10-12T16:26:12+08:00: feat: add Oh my Pi setup and default text to M3.1 Flash Preview (#282)

## Changed paths

- M: `README.md`
- M: `README_CN.md`
- M: `SDK.md`
- M: `skill/SKILL.md`
- M: `src/agent/availability.ts`
- M: `src/agent/configurator.ts`
- M: `src/agent/installer.ts`
- M: `src/agent/types.ts`
- M: `src/auth/credentials.ts`
- M: `src/auth/refresh.ts`
- M: `src/commands/agent/setup.ts`
- M: `src/commands/text/chat.ts`
- M: `src/commands/text/repl.ts`
- M: `src/config/loader.ts`
- A: `src/config/models.ts`
- M: `src/config/paths.ts`
- M: `src/polling/poll.ts`
- M: `src/sdk/text/index.ts`
- M: `test/agent/availability.test.ts`
- M: `test/agent/configurator.test.ts`
- M: `test/agent/installer.test.ts`
- A: `test/agent/oh-my-pi.test.ts`
- A: `test/agent/zed.test.ts`
- A: `test/auth/refresh-concurrency.test.ts`
- M: `test/commands/agent/setup.test.ts`
- M: `test/commands/text/chat.test.ts`
- M: `test/config/loader.test.ts`
- M: `test/polling/poll.test.ts`
- M: `test/sdk/text.test.ts`
