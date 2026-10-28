# officecli

Source: [officecli](https://github.com/iOfficeAI/OfficeCLI) · Category: [ai-query](../categories/ai-query.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `b590a433a6a699bfe1008b9e4c581521528bcb77`; commit timestamp `2026-10-02T01:11:33+08:00`; 1,213 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/iOfficeAI/OfficeCLI/blob/b590a433a6a699bfe1008b9e4c581521528bcb77/README.md)):

> OfficeCLI is the world's first and the best Office suite designed for AI agents. Give any AI agent full control over Word, Excel, and PowerPoint — in one line of code.

Build/package evidence: [npm/package.json](https://github.com/iOfficeAI/OfficeCLI/blob/b590a433a6a699bfe1008b9e4c581521528bcb77/npm/package.json); [sdk/node/package.json](https://github.com/iOfficeAI/OfficeCLI/blob/b590a433a6a699bfe1008b9e4c581521528bcb77/sdk/node/package.json); [sdk/python/pyproject.toml](https://github.com/iOfficeAI/OfficeCLI/blob/b590a433a6a699bfe1008b9e4c581521528bcb77/sdk/python/pyproject.toml)

License evidence: [LICENSE](https://github.com/iOfficeAI/OfficeCLI/blob/b590a433a6a699bfe1008b9e4c581521528bcb77/LICENSE) Classification hint: Apache-2.0. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-query**. Its category places it in the candidate set for memory, import-generation, decisions; those associations are navigational and have not been individually validated as implemented capabilities. See [memory](../memory.md) · [import-generation](../import-generation.md) · [decisions](../decisions.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.


## Change review - 2026-10-28

**Version-bearing resident handshakes detect stale processes, but retirement does not verify a successful flush.** Reviewed commit `585c0dc283311a47c37578d1189fb96133e437f5` (commit date `2026-10-27T18:32:40+08:00`). Compared with `b590a433a6a699bfe1008b9e4c581521528bcb77`; the complete Git comparison contains 71 changed paths.

Resident ping now returns the document path and current binary version. The client compares the normalized path and retires a resident with a different nonempty version, while accepting older residents that send no version. Retirement is attempted once per file per client process. However, it ignores both the boolean returned by SendCloseWithResponse and the response exit code, then prints that the resident was closed. That API explicitly distinguishes no connection from a teardown error. A failed close can therefore be described as successful and is not retried within the process; TryConnect returns false and the caller may fall back to direct operation without a verified release/flush receipt.

Batch read options compact/fields are now represented in the converter, known-field set and resident request mapping, preserving absent defaults. Compact=false is not transmitted as a resident argument, so behavior depends on the command's default rather than an explicit false value. Marker-size parsing now accepts only an integer from 2 through 72 and provides guidance to use marker=none, preventing invalid schema values from reaching the document writer through callers that adopt this helper. This is a source-level range guarantee, not proof that every chart write path uses it or that generated decks open correctly.

Evidence: [src/officecli/ResidentClient.cs:14-92](https://github.com/iOfficeAI/OfficeCLI/blob/585c0dc283311a47c37578d1189fb96133e437f5/src/officecli/ResidentClient.cs#L14-L92) · [src/officecli/ResidentClient.cs:205-245](https://github.com/iOfficeAI/OfficeCLI/blob/585c0dc283311a47c37578d1189fb96133e437f5/src/officecli/ResidentClient.cs#L205-L245) · [src/officecli/ResidentServer.cs:618-633](https://github.com/iOfficeAI/OfficeCLI/blob/585c0dc283311a47c37578d1189fb96133e437f5/src/officecli/ResidentServer.cs#L618-L633) · [src/officecli/BatchTypes.cs:88-144](https://github.com/iOfficeAI/OfficeCLI/blob/585c0dc283311a47c37578d1189fb96133e437f5/src/officecli/BatchTypes.cs#L88-L144) · [src/officecli/BatchTypes.cs:161-235](https://github.com/iOfficeAI/OfficeCLI/blob/585c0dc283311a47c37578d1189fb96133e437f5/src/officecli/BatchTypes.cs#L161-L235) · [src/officecli/Core/ParseHelpers.cs:599-621](https://github.com/iOfficeAI/OfficeCLI/blob/585c0dc283311a47c37578d1189fb96133e437f5/src/officecli/Core/ParseHelpers.cs#L599-L621).

**Harness consequence:** Carry forward version-aware worker handshakes but require positive close/flush confirmation before replacement or direct fallback, preserve teardown errors and compare file identities with platform-aware rules. Keep compact output as a projection with full structured evidence available. Validate format-specific numeric constraints at every write boundary and verify resulting packages/rendering independently.

**Scope and limits:** Static scoped review of resident-version retirement, batch serialization and marker-size validation within the 71-path comparison. Full named-pipe trust/timeouts, batch execution parity, chart renderer changes, affected package writers and regression tests were not audited or executed; no Office application or document mutation.

## Follow-up change review — 2026-10-28

**CLI and resident document viewing share validation semantics.** Reviewed commit `89905744ed6dbb87fb6807a0d9fda6ed3da1c18d` (commit date `2026-10-28T13:49:46+08:00`), compared with `585c0dc283311a47c37578d1189fb96133e437f5`. The complete no-rename Git path inventory contains 5 changed paths.

The extracted RunView implementation is shared by the front end and resident. It rejects nonpositive or inverted line windows, nonpositive limits/dimensions and page/grid options that have no meaning for Excel HTML/screenshots. Native render ownership is represented by release/reopen callbacks rather than pretending the editable document handle can coexist with every renderer. Only the shared entry and preflight were inspected here.

Evidence: [src/officecli/CommandBuilder.ViewCore.cs:8-34](https://github.com/iOfficeAI/OfficeCLI/blob/89905744ed6dbb87fb6807a0d9fda6ed3da1c18d/src/officecli/CommandBuilder.ViewCore.cs#L8-L34) · [src/officecli/CommandBuilder.ViewCore.cs:43-74](https://github.com/iOfficeAI/OfficeCLI/blob/89905744ed6dbb87fb6807a0d9fda6ed3da1c18d/src/officecli/CommandBuilder.ViewCore.cs#L43-L74).

**Harness consequence:** Use one operation contract across long-lived services and one-shot CLI calls. Reject ignored options before expensive work and model temporary ownership transfer explicitly; this does not establish native rendering fidelity or no-overwrite publication.

**Scope and limits:** Reviewed shared view entry/preflight and declared native-lock boundary; the large moved implementation and resident execution were not exhaustively tested. This is a scoped static comparison, not a whole-project correctness or security audit. Upstream tests were read where cited, not run; no upstream code, service, model or provider operation was executed. Historical findings above remain evidence at their own revisions.

<!-- teamagent-analysis:start -->
Analysis metadata: source [officecli](https://github.com/iOfficeAI/OfficeCLI); analyzed commit `89905744ed6dbb87fb6807a0d9fda6ed3da1c18d`; commit date 2026-10-28T13:49:46+08:00; review date 2026-10-28T14:52:35.205Z; depth screened. [Maintenance record](../analyses/repos/ai-query--officecli.md).
<!-- teamagent-analysis:end -->
