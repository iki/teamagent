# foreman: change evidence

Source: [foreman](https://github.com/thruwire/foreman) · [Analysis](../../projects/ai-agents--foreman.md) · [agents](../../agents.md), [models](../../models.md), [channels](../../channels.md)

Generated: 2026-10-27T18:19:07.717Z. Status: **changed**. Reviewed SHA: `e5d1aa45183382390e388512dcbfebd747ec89ba`; commit date: 2026-09-28T19:44:20-04:00; review date: unknown; observed SHA: `c3142ef636617f32f772140125aa310d81ceece9`.

This generated packet is a bounded change locator, not a source review or a quality measurement. [Source comparison](https://github.com/thruwire/foreman/compare/e5d1aa45183382390e388512dcbfebd747ec89ba...c3142ef636617f32f772140125aa310d81ceece9). Working-tree changes: false; shallow history: false; report changed since recorded review: false.

- Git discovery: unchanged; source lifecycle: active; upstream availability: available.

## Recent commits

- [c3142ef63661](https://github.com/thruwire/foreman/commit/c3142ef636617f32f772140125aa310d81ceece9) 2026-10-15T08:58:59-04:00: Fix managed Codex supervision and prepare Foreman 0.5.1 (#56)
- [cfe4ad51aa85](https://github.com/thruwire/foreman/commit/cfe4ad51aa85b2dd814322661b8931f94a4b904e) 2026-10-15T08:22:20-04:00: Generalize Foreman decision models and add Jev/OpenAI adapters (#54)
- [381ca2de90af](https://github.com/thruwire/foreman/commit/381ca2de90af9efc2781a58055cc3028c7cabbb9) 2026-10-09T10:43:12-04:00: Doc update
- [2d1736ec4ae4](https://github.com/thruwire/foreman/commit/2d1736ec4ae4b13c1d5da7303fea4c81d975ca73) 2026-10-09T08:57:54-04:00: Document Deep Agents marketplace plugin setup (#52)
- [40f35977443f](https://github.com/thruwire/foreman/commit/40f35977443f62352a69d2ed7f75a0ad68e47ebe) 2026-10-08T20:03:12-04:00: Add Deep Agents workers and native hooks; release 0.5.0 (#51)
- [8a0ab0e25d13](https://github.com/thruwire/foreman/commit/8a0ab0e25d134d0db51e311b566674ec95570c80) 2026-10-07T08:06:20-04:00: docs: document OpenRouter setup through the TypeSafe SDK (#50)
- [965810c33faf](https://github.com/thruwire/foreman/commit/965810c33fafcd76a16a0469018fccbaaf2705f8) 2026-10-06T21:34:19-04:00: ci: pin GitHub Actions to immutable commits (#49)
- [50d4de4ac275](https://github.com/thruwire/foreman/commit/50d4de4ac275a8694ab4d30a4468b09fd3e5aef9) 2026-10-06T21:17:18-04:00: Document published Foreman core and Pi bridge installation (#48)
- [61564071ba29](https://github.com/thruwire/foreman/commit/61564071ba29097e919805a839273379cec77ddd) 2026-10-06T21:12:09-04:00: Release foreman-core 0.4.4 and prepare Pi bridge for npm
- [48d20212792c](https://github.com/thruwire/foreman/commit/48d20212792c3c434bda0a69bdcf83d1b3dee310) 2026-10-06T17:39:10-04:00: Add Pi and Pi Durable hook integrations with replay-safe supervision (#47)
- [6a68b5f8807d](https://github.com/thruwire/foreman/commit/6a68b5f8807d82005b4134c929ba2bbb6826d5ad) 2026-10-06T16:59:14-04:00: Reduce routine Jev input and recover oversized hook sessions (#45)
- [335e14609118](https://github.com/thruwire/foreman/commit/335e14609118ffb7804c01ef25be8347818063e5) 2026-10-06T12:47:43-04:00: Add generic local hook responsibilities for 0.4.2 (#43)
- [a72594463d5c](https://github.com/thruwire/foreman/commit/a72594463d5cd57e410a7a9db19a44b0cb3788c4) 2026-10-05T09:01:02-04:00: test_summary: count pytest xfailed/xpassed so expected-fail runs are observed (#41)
- [b4c5452b2e6c](https://github.com/thruwire/foreman/commit/b4c5452b2e6cd185631832c07a376c4f5a3b8517) 2026-10-05T09:00:51-04:00: Reject malformed run-state containers before migration (#39)

## Changed paths

- M: `.env.example`
- M: `.github/workflows/release.yml`
- A: `.github/workflows/test.yml`
- M: `CONTRIBUTING.md`
- M: `README.md`
- M: `docs/README.md`
- A: `docs/decision-models.md`
- M: `docs/evidence.md`
- M: `docs/hooks.md`
- A: `docs/openrouter.md`
- A: `docs/releases/0.4.3.md`
- A: `docs/releases/0.4.4.md`
- A: `docs/releases/0.5.0.md`
- A: `docs/releases/0.5.1.md`
- M: `docs/releasing.md`
- M: `docs/routing.md`
- M: `docs/runtime.md`
- M: `docs/steering.md`
- M: `docs/theory.md`
- M: `docs/what-foreman-proves.md`
- M: `docs/why-jev.md`
- M: `docs/workers.md`
- M: `integrations/README.md`
- M: `integrations/claude/README.md`
- A: `integrations/deepagents/README.md`
- A: `integrations/deepagents/live-test-results.md`
- A: `integrations/pi/.gitignore`
- A: `integrations/pi/LICENSE`
- A: `integrations/pi/README.md`
- A: `integrations/pi/package-lock.json`
- A: `integrations/pi/package.json`
- A: `integrations/pi/src/durable.ts`
- A: `integrations/pi/src/pi.ts`
- A: `integrations/pi/src/transport.ts`
- A: `integrations/pi/tests/cli-provider.mjs`
- A: `integrations/pi/tests/core-fixture.py`
- A: `integrations/pi/tests/core.test.mjs`
- A: `integrations/pi/tests/durable.test.mjs`
- A: `integrations/pi/tests/fixture.mjs`
- A: `integrations/pi/tests/helpers.mjs`
- A: `integrations/pi/tests/pi-cli.test.mjs`
- A: `integrations/pi/tests/pi-sdk.test.mjs`
- A: `integrations/pi/tests/pi.test.mjs`
- A: `integrations/pi/tests/transport.test.mjs`
- A: `integrations/pi/tsconfig.json`
- M: `pyproject.toml`
- M: `src/foreman/__init__.py`
- M: `src/foreman/cli.py`
- M: `src/foreman/config.py`
- A: `src/foreman/decision_models/__init__.py`
- A: `src/foreman/decision_models/base.py`
- A: `src/foreman/decision_models/jev.py`
- A: `src/foreman/decision_models/openai.py`
- A: `src/foreman/deepagents_setup.py`
- M: `src/foreman/evidence.py`
- M: `src/foreman/extensions.py`
- M: `src/foreman/foreman/__init__.py`
- A: `src/foreman/foreman/decision.py`
- M: `src/foreman/foreman/jev.py`
- M: `src/foreman/hook_adapters.py`
- A: `src/foreman/hook_config.py`
- M: `src/foreman/hooks.py`
- A: `src/foreman/jev_usage.py`
- M: `src/foreman/models/worker.py`
- M: `src/foreman/observation.py`
- M: `src/foreman/persistence.py`
- M: `src/foreman/policy.py`
- A: `src/foreman/repository_scope.py`
- A: `src/foreman/request_budget.py`
- M: `src/foreman/responsibilities/base.py`
- M: `src/foreman/responsibilities/configuration.py`
- A: `src/foreman/responsibilities/declarative.py`
- M: `src/foreman/routing.py`
- M: `src/foreman/runtime.py`
- M: `src/foreman/steering.py`
- M: `src/foreman/terminal.py`
- M: `src/foreman/test_summary.py`
- A: `src/foreman/usage.py`
- M: `src/foreman/workers/__init__.py`
- M: `src/foreman/workers/base.py`
- M: `src/foreman/workers/codex.py`
- M: `src/foreman/workers/codex_app_server.py`
- A: `src/foreman/workers/codex_errors.py`
- A: `src/foreman/workers/deepagents.py`
- M: `tests/test_config.py`
- A: `tests/test_decision_models.py`
- A: `tests/test_declarative_responsibilities.py`
- A: `tests/test_deepagents.py`
- A: `tests/test_deepagents_hooks.py`
- A: `tests/test_hook_configuration.py`
- M: `tests/test_hooks.py`
- M: `tests/test_integration.py`
- A: `tests/test_jev_usage.py`
- M: `tests/test_observation.py`
- M: `tests/test_persistence.py`
- A: `tests/test_pi_hooks.py`
- A: `tests/test_request_budget.py`
- M: `tests/test_runtime.py`
- M: `tests/test_test_summary.py`
- M: `tests/test_version.py`
- M: `tests/test_worker.py`
