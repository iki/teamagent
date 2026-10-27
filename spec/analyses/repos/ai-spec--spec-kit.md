# spec-kit: change evidence

Source: [spec-kit](https://github.com/github/spec-kit) · [Analysis](../../projects/ai-spec--spec-kit.md) · [skills](../../skills.md), [evolution](../../evolution.md), [agents](../../agents.md)

Generated: 2026-10-27T18:19:07.717Z. Status: **changed**. Reviewed SHA: `67e0f7294e6e728ab60bf7b4590deb470448bc2d`; commit date: 2026-10-23T13:16:37-05:00; review date: 2026-10-24T06:36:54.441Z; observed SHA: `ce8592390a88c6bbc229e9720ef45cc1f6cff46a`.

This generated packet is a bounded change locator, not a source review or a quality measurement. [Source comparison](https://github.com/github/spec-kit/compare/67e0f7294e6e728ab60bf7b4590deb470448bc2d...ce8592390a88c6bbc229e9720ef45cc1f6cff46a). Working-tree changes: false; shallow history: false; report changed since recorded review: false.

- Git discovery: updated; source lifecycle: active; upstream availability: available.

## Recent commits

- [ce8592390a88](https://github.com/github/spec-kit/commit/ce8592390a88c6bbc229e9720ef45cc1f6cff46a) 2026-10-27T12:59:12-05:00: Update Secure Development Assurance Governance preset to v0.1.8 (#5139)
- [ee94598c3c87](https://github.com/github/spec-kit/commit/ee94598c3c87ae231027b22fb2be2b5a13e8820f) 2026-10-26T17:23:40-05:00: feat(bundles): allow bundles to reference other bundles (#5067)
- [3b76e6ea2dbe](https://github.com/github/spec-kit/commit/3b76e6ea2dbe99d7c038077f9417763e27f5d996) 2026-10-26T15:52:34-05:00: fix: report a non-file .extensionignore or .presetignore as a validation error (#5131)
- [cf3f8778a20d](https://github.com/github/spec-kit/commit/cf3f8778a20d6cfda57e457ac1029166bd61cd30) 2026-10-26T15:09:51-05:00: fix(presets): attribute core templates with overrides-prefixed names correctly (#5129)
- [0bd4773e2e26](https://github.com/github/spec-kit/commit/0bd4773e2e268d89bc6c1bf754aa989da9ae2dab) 2026-10-26T14:47:15-05:00: ci: select pytest worker count automatically (#5132)
- [9783b49ed66c](https://github.com/github/spec-kit/commit/9783b49ed66c26935cf7ef5ccc6ae5a296316eb7) 2026-10-26T11:26:59-05:00: feat(vibe): add --no-model-invocation integration option (#5119)
- [fdad05f44aa3](https://github.com/github/spec-kit/commit/fdad05f44aa3b43cd7072c9b10d17d128258194c) 2026-10-26T10:25:41-05:00: refactor(workflows): split the expression evaluator into a package (#5114)
- [e9ebeeaec6bd](https://github.com/github/spec-kit/commit/e9ebeeaec6bdae2b7079be4a0c68a9e802a248b2) 2026-10-26T10:17:59-05:00: fix: make bundle step refresh rollback transactional (#4827)
- [7ea1146b9469](https://github.com/github/spec-kit/commit/7ea1146b9469996b211c581961717038da4f11b6) 2026-10-26T09:53:12-05:00: Update Security Governance preset to v0.7.4 (#5128)
- [ff6230d50cf6](https://github.com/github/spec-kit/commit/ff6230d50cf681f570f628bc76c7f7dcb41920e1) 2026-10-26T09:35:08-05:00: Update Quality Gates (Enforcement Layer) extension to v0.4.2 (#5127)
- [274831d53dab](https://github.com/github/spec-kit/commit/274831d53dabfe08220a5b6d9ad747af7b6a8bfe) 2026-10-26T09:25:54-05:00: Update Product Spec Extension to v2.1.0 (#5126)
- [158a97dcef45](https://github.com/github/spec-kit/commit/158a97dcef45da4278a2718c0ac58fccc78d3dc9) 2026-10-26T09:21:34-05:00: Fix local bundle installation for uppercase .ZIP artifacts (#5106)
- [600eba9df3a5](https://github.com/github/spec-kit/commit/600eba9df3a50b535f5865cca7b73a01d99dff0e) 2026-10-26T09:20:35-05:00: fix: preserve feature numbering during reinitialization (#5101)
- [8563a7d2f688](https://github.com/github/spec-kit/commit/8563a7d2f6886de57057652954111601792ab76f) 2026-10-26T09:19:28-05:00: fix: retain event hooks when override omits events (#5102)

## Changed paths

- M: `.github/workflows/test.yml`
- M: `docs/community/extensions.md`
- M: `docs/community/presets.md`
- M: `docs/integrations/vibe.md`
- M: `docs/reference/bundles.md`
- M: `extensions/catalog.community.json`
- M: `presets/catalog.community.json`
- M: `src/specify_cli/_install_ignore.py`
- M: `src/specify_cli/bundles/_commands.py`
- M: `src/specify_cli/bundles/adapters.py`
- M: `src/specify_cli/bundles/catalog_stack.py`
- M: `src/specify_cli/bundles/catalogs.py`
- M: `src/specify_cli/bundles/command_info.py`
- M: `src/specify_cli/bundles/command_install.py`
- M: `src/specify_cli/bundles/command_update.py`
- M: `src/specify_cli/bundles/command_validate.py`
- M: `src/specify_cli/bundles/conflict.py`
- A: `src/specify_cli/bundles/expansion.py`
- M: `src/specify_cli/bundles/installer.py`
- M: `src/specify_cli/bundles/manifest.py`
- M: `src/specify_cli/bundles/primitives.py`
- M: `src/specify_cli/bundles/records.py`
- M: `src/specify_cli/bundles/resolver.py`
- M: `src/specify_cli/bundles/sources.py`
- M: `src/specify_cli/bundles/validator.py`
- M: `src/specify_cli/bundles/versioning.py`
- M: `src/specify_cli/command_init.py`
- M: `src/specify_cli/events/__init__.py`
- M: `src/specify_cli/integrations/vibe/__init__.py`
- M: `src/specify_cli/presets/_resolver.py`
- D: `src/specify_cli/workflows/expressions.py`
- A: `src/specify_cli/workflows/expressions/__init__.py`
- A: `src/specify_cli/workflows/expressions/api.py`
- A: `src/specify_cli/workflows/expressions/diagnostics.py`
- A: `src/specify_cli/workflows/expressions/engine.py`
- A: `src/specify_cli/workflows/expressions/engine_current.py`
- A: `src/specify_cli/workflows/expressions/filters.py`
- A: `src/specify_cli/workflows/expressions/namespace.py`
- A: `src/specify_cli/workflows/expressions/operators.py`
- A: `src/specify_cli/workflows/expressions/template.py`
- M: `tests/integrations/test_integration_vibe.py`
- M: `tests/specify_cli/bundles/helpers.py`
- M: `tests/specify_cli/bundles/test_catalog_stack.py`
- M: `tests/specify_cli/bundles/test_command_build.py`
- M: `tests/specify_cli/bundles/test_command_info.py`
- M: `tests/specify_cli/bundles/test_command_install.py`
- M: `tests/specify_cli/bundles/test_command_list.py`
- M: `tests/specify_cli/bundles/test_command_update.py`
- M: `tests/specify_cli/bundles/test_command_validate.py`
- M: `tests/specify_cli/bundles/test_commands.py`
- M: `tests/specify_cli/bundles/test_conflict.py`
- A: `tests/specify_cli/bundles/test_expansion.py`
- M: `tests/specify_cli/bundles/test_installer.py`
- A: `tests/specify_cli/bundles/test_manifest.py`
- M: `tests/specify_cli/bundles/test_packager.py`
- M: `tests/specify_cli/bundles/test_primitives.py`
- M: `tests/specify_cli/bundles/test_records.py`
- M: `tests/specify_cli/bundles/test_resolver.py`
- M: `tests/specify_cli/bundles/test_sources.py`
- M: `tests/specify_cli/bundles/test_validator.py`
- M: `tests/specify_cli/bundles/test_versioning.py`
- M: `tests/specify_cli/events/test_events.py`
- M: `tests/specify_cli/presets/test_resolver.py`
- M: `tests/specify_cli/test_command_init.py`
- M: `tests/specify_cli/test_install_ignore.py`
- M: `tests/unit/test_condition_expression_block.py`
- A: `tests/unit/test_expression_package_boundary.py`
- M: `workflows/ARCHITECTURE.md`
