# xx-2603-apps-google-workspace.cli

Source: [xx-2603-apps-google-workspace.cli](https://github.com/googleworkspace/cli) · Category: [ai-skills](../categories/ai-skills.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `a3768d0e82ad83cca2da97724e46bea4ff0e6dbd`; commit timestamp `2026-03-31T12:51:15-06:00`; 222 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/googleworkspace/cli/blob/a3768d0e82ad83cca2da97724e46bea4ff0e6dbd/README.md)):

> One CLI for all of Google Workspace — built for humans and AI agents. Drive, Gmail, Calendar, and every Workspace API. Zero boilerplate. Structured JSON output. 40+ agent skills included.

Build/package evidence: [Cargo.toml](https://github.com/googleworkspace/cli/blob/a3768d0e82ad83cca2da97724e46bea4ff0e6dbd/Cargo.toml); [crates/google-workspace-cli/Cargo.toml](https://github.com/googleworkspace/cli/blob/a3768d0e82ad83cca2da97724e46bea4ff0e6dbd/crates/google-workspace-cli/Cargo.toml); [crates/google-workspace/Cargo.toml](https://github.com/googleworkspace/cli/blob/a3768d0e82ad83cca2da97724e46bea4ff0e6dbd/crates/google-workspace/Cargo.toml); [npm/package.json](https://github.com/googleworkspace/cli/blob/a3768d0e82ad83cca2da97724e46bea4ff0e6dbd/npm/package.json); [package.json](https://github.com/googleworkspace/cli/blob/a3768d0e82ad83cca2da97724e46bea4ff0e6dbd/package.json)

License evidence: [LICENSE](https://github.com/googleworkspace/cli/blob/a3768d0e82ad83cca2da97724e46bea4ff0e6dbd/LICENSE) Classification hint: Apache-2.0. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-skills**. Its category places it in the candidate set for skills; those associations are navigational and have not been individually validated as implemented capabilities. See [skills](../skills.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

## Source update reviewed 2026-11-01

Reviewed commit [`cd3697e07eb520056dcf142d0c7439bbb9ba32e9`](https://github.com/googleworkspace/cli/commit/cd3697e07eb520056dcf142d0c7439bbb9ba32e9), compared with `a3768d0e82ad83cca2da97724e46bea4ff0e6dbd`.

The complete one-file [automation workflow](https://github.com/googleworkspace/cli/blob/cd3697e07eb520056dcf142d0c7439bbb9ba32e9/.github/workflows/automation.yml) delta replaces `pull_request_target` with `pull_request`, removes broad workflow-level write defaults and assigns permissions to individual formatting, labeling and review jobs. The file still explicitly supplies a bot secret to relevant actions. Therefore the new permission blocks alone do not establish the effective scope of every supplied credential or success on fork events.

Adapt event-specific least privilege and distinguish built-in workflow credentials from separately injected tokens. No CI run, account scope, fork behavior, CLI API call or credential was tested. This updates the automation assessment without changing the previously reviewed application contract.

<!-- teamagent-analysis:start -->
Analysis metadata: source [apps-google-workspace.cli](https://github.com/googleworkspace/cli); analyzed commit `cd3697e07eb520056dcf142d0c7439bbb9ba32e9`; commit date 2026-10-30T08:47:59-07:00; review date 2026-11-01T11:37:37.120Z; depth screened. [Maintenance record](../analyses/repos/ai-skills--xx-2603-apps-google-workspace.cli.md).
<!-- teamagent-analysis:end -->
