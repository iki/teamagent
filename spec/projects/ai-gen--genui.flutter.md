# genui.flutter

Source: [genui.flutter](https://github.com/flutter/genui) · Category: [ai-gen](../categories/ai-gen.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `ce05cd401cf786f0061b2ef592b6b1c132d106bd`; commit timestamp `2026-10-02T13:19:33+09:30`; 1,011 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/flutter/genui/blob/ce05cd401cf786f0061b2ef592b6b1c132d106bd/README.md)):

> Announcement:** `genui` is being redesigned as a set of modular packages: See the Getting started with GenUI video for an overview of the package.

Build/package evidence: [dev_tools/catalog_gallery/pubspec.yaml](https://github.com/flutter/genui/blob/ce05cd401cf786f0061b2ef592b6b1c132d106bd/dev_tools/catalog_gallery/pubspec.yaml); [dev_tools/composer/pubspec.yaml](https://github.com/flutter/genui/blob/ce05cd401cf786f0061b2ef592b6b1c132d106bd/dev_tools/composer/pubspec.yaml); [examples/simple_chat/pubspec.yaml](https://github.com/flutter/genui/blob/ce05cd401cf786f0061b2ef592b6b1c132d106bd/examples/simple_chat/pubspec.yaml); [examples/verdure/client/pubspec.yaml](https://github.com/flutter/genui/blob/ce05cd401cf786f0061b2ef592b6b1c132d106bd/examples/verdure/client/pubspec.yaml); [examples/verdure/server/a2ui_extension/pyproject.toml](https://github.com/flutter/genui/blob/ce05cd401cf786f0061b2ef592b6b1c132d106bd/examples/verdure/server/a2ui_extension/pyproject.toml)

License evidence: [LICENSE](https://github.com/flutter/genui/blob/ce05cd401cf786f0061b2ef592b6b1c132d106bd/LICENSE) Classification hint: not classified; inspect source. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-gen**. Its category places it in the candidate set for import-generation, channels; those associations are navigational and have not been individually validated as implemented capabilities. See [import-generation](../import-generation.md) · [channels](../channels.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.


## Change review - 2026-10-28

**The vendored A2UI data model caps individual list indices but does not make updates transactional.** Reviewed commit `584d10327d95f4baaf2553ca167b92bd56816b39` (commit date `2026-10-15T12:35:59-07:00`). Compared with `ce05cd401cf786f0061b2ef592b6b1c132d106bd`; the complete Git comparison contains 158 changed paths.

The new public barrel explicitly exposes GenUI's own copy of a2ui_core 0.1.0 and warns that values from the separate package have different type identity. The inspected data model parses paths and creates missing maps/lists, caps each expanded list index at 10,000, batches notifications and updates exact/ancestor/descendant watchers with segment-aware prefixes. Weak references permit dead signals to be pruned, but live watcher count and total data size are not bounded.

The index guard prevents a single huge sparse index, not aggregate expansion across nested or repeated updates. set mutates ancestors as it traverses, so an error at a later segment can leave newly created containers without rollback. Its final assignment handles maps and lists but has no rejecting else for a primitive final parent; such a call can reach notification without changing the requested value. Map null removes a key, whereas list null preserves a slot. Fixtures cover root/ancestor/descendant notifications, prefix siblings and excessive indices; they do not assert rollback or primitive-final-parent rejection.

Evidence: [packages/genui/lib/a2ui_core.dart:1-14](https://github.com/flutter/genui/blob/584d10327d95f4baaf2553ca167b92bd56816b39/packages/genui/lib/a2ui_core.dart#L1-L14) · [packages/genui/lib/src/a2ui_core/core/data_model.dart:1-187](https://github.com/flutter/genui/blob/584d10327d95f4baaf2553ca167b92bd56816b39/packages/genui/lib/src/a2ui_core/core/data_model.dart#L1-L187) · [packages/genui/test/a2ui_core/data_model_test.dart:1-160](https://github.com/flutter/genui/blob/584d10327d95f4baaf2553ca167b92bd56816b39/packages/genui/test/a2ui_core/data_model_test.dart#L1-L160).

**Harness consequence:** Preserve explicit protocol type ownership and segment-aware subscription semantics. Decode model-produced updates before touching state, preflight total depth/node/byte budgets and apply updates atomically with explicit failure. Add rollback and invalid-final-parent fixtures before borrowing this state engine; schema-shaped generated UI remains a proposal and cannot authorize filesystem/network actions.

**Scope and limits:** Static scoped review of the vendored core barrel/data model and its fixtures; the surrounding comparison includes broad import/type migration. DataPath parsing, reactive batch internals, protocol schema validation and rendered Flutter/native behavior were not audited or executed. Requested source files were read at the original cached SHA.

<!-- teamagent-analysis:start -->
Analysis metadata: source [genui.flutter](https://github.com/flutter/genui); analyzed commit `584d10327d95f4baaf2553ca167b92bd56816b39`; commit date 2026-10-15T12:35:59-07:00; review date 2026-10-28T08:47:42.123Z; depth screened. [Maintenance record](../analyses/repos/ai-gen--genui.flutter.md).
<!-- teamagent-analysis:end -->
