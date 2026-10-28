# mobile-expo

Source: [mobile-expo](https://github.com/expo/skills) · Category: [ai-skills](../categories/ai-skills.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `13ad8e05874195633b5c185f6947bb6400e228fc`; commit timestamp `2026-10-02T18:45:26+08:00`; 194 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/expo/skills/blob/13ad8e05874195633b5c185f6947bb6400e228fc/README.md)):

> Official AI agent skills from the Expo team for building, deploying, upgrading, and debugging Expo apps. Skills give AI agents focused Expo knowledge: when to use Expo APIs, how to structure common workflows, and which Expo, EAS, React Native, iOS, and Android constraints matter. Expo documentation, Expo CLI, and EAS CLI remain the source of truth; these skills help agents apply them correctly.

Build/package evidence: [package.json](https://github.com/expo/skills/blob/13ad8e05874195633b5c185f6947bb6400e228fc/package.json); [plugins/expo/skills/eas-workflows/scripts/package.json](https://github.com/expo/skills/blob/13ad8e05874195633b5c185f6947bb6400e228fc/plugins/expo/skills/eas-workflows/scripts/package.json); [tests/fixtures/expo-brownfield/sdks/55/package.json](https://github.com/expo/skills/blob/13ad8e05874195633b5c185f6947bb6400e228fc/tests/fixtures/expo-brownfield/sdks/55/package.json); [tests/fixtures/expo-brownfield/sdks/57/package.json](https://github.com/expo/skills/blob/13ad8e05874195633b5c185f6947bb6400e228fc/tests/fixtures/expo-brownfield/sdks/57/package.json)

License evidence: [LICENSE](https://github.com/expo/skills/blob/13ad8e05874195633b5c185f6947bb6400e228fc/LICENSE) Classification hint: MIT. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-skills**. Its category places it in the candidate set for skills; those associations are navigational and have not been individually validated as implemented capabilities. See [skills](../skills.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

## Source update reviewed 2026-10-28

Reviewed commit: [`8a0dc4fa57ae345923c357e1451cbcd8b6f2a7db`](https://github.com/expo/skills/commit/8a0dc4fa57ae345923c357e1451cbcd8b6f2a7db). Scope: Full EAS Observe and EAS Update entry skills read. Linked SDK/API references, pricing, native clients, update service and observability implementation were not verified.

The [update skill](https://github.com/expo/skills/blob/8a0dc4fa57ae345923c357e1451cbcd8b6f2a7db/plugins/expo/skills/eas-update/SKILL.md) distinguishes installed native builds, compatible update artifacts, branches, channel mappings and runtime versions. It preserves existing dynamic configuration and treats runtime-policy changes separately from troubleshooting. Its download-then-apply explanation also distinguishes release cold launches from development-client behavior. These are useful compatibility questions for an update adapter, not executed native acceptance or permission to publish.

The [Observe entry](https://github.com/expo/skills/blob/8a0dc4fa57ae345923c357e1451cbcd8b6f2a7db/plugins/expo/skills/eas-observe/SKILL.md) explicitly routes version-sensitive API details to canonical documentation and distinguishes native builds from Expo Go. Its metrics, pricing and SDK mappings are upstream descriptions here, not refreshed service facts. Feedback commands would disclose task context externally and require separate authorization. Mobile implementation remains deferred in Teamagent; this review does not adopt Expo or its package commands. No install, app, telemetry, feedback or update was executed.

<!-- teamagent-analysis:start -->
Analysis metadata: source [mobile-expo](https://github.com/expo/skills); analyzed commit `8a0dc4fa57ae345923c357e1451cbcd8b6f2a7db`; commit date 2026-10-26T12:58:59-07:00; review date 2026-10-28T09:45:33.667Z; depth screened. [Maintenance record](../analyses/repos/ai-skills--mobile-expo.md).
<!-- teamagent-analysis:end -->
