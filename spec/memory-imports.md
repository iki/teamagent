# Source memory and agent integrations

[Harness](harness.md) · [Memory design](memory.md) · [Import design](import-pipeline.md) · [Modules](architecture/modules.md)

## Run

Use Bun 1.4.2, Aube 2.5.1, Git, and Python 3.12 for document conversion.
Install JavaScript dependencies with Aube. Provision the isolated, pinned Python
converter once; this does not install packages into the system interpreter.

```sh
aube install --frozen-lockfile
aube run --no-install imports:setup
aube run --no-install cli memory doctor
aube run --no-install cli memory get https://example.com/article --root /absolute/project
aube run --no-install cli memory get /absolute/manual.pdf --root /absolute/project
aube run --no-install cli memory get https://github.com/owner/repository.git --kind git --root /absolute/project
aube run --no-install cli memory list --root /absolute/project
aube run --no-install cli memory sync SOURCE_ID --root /absolute/project
aube run --no-install cli memory search "search terms" --root /absolute/project
aube run --no-install cli memory show SOURCE_ID --root /absolute/project
aube run --no-install cli memory read SOURCE_ID --source-version VERSION_ID --path converted/PATH/document.md --root /absolute/project
aube run --no-install cli memory export SOURCE_ID --output /absolute/new-directory --root /absolute/project
```

Memory runs without the task daemon. `--data` chooses the private storage directory
(default `~/.teamagent`). `--root` selects a canonical directory and stable hashed
scope; the CLI defaults to its current directory. Alternatively, `--workspace`
selects an existing harness workspace ID from the same data directory. These are
distinct scope identities; consistently use the same selection. Relative input
paths resolve against that root. Explicit CLI source paths can be outside it.

`list` and `show` return `total` and `nextOffset`; continue using `--offset` and
`--limit`. History defaults to one version per page. `read` returns a verified
byte range, encoding, immutable version ID, citation and `nextOffset`. Its default
is 64 KiB, maximum 256 KiB; use `--offset` and `--length` for subsequent ranges,
pinning `--source-version`. Binary and split Unicode ranges use base64. Export
writes the entire version with relative Markdown/image links and `manifest.json`
to a new directory. Existing destinations are never overwritten.

## Sources and freshness

| Input                                 | Retained evidence and conversion                                                                                   |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| HTTP(S) page                          | Original HTML, static images and Markdown; no browser execution or crawling of linked pages                        |
| HTTP(S) file                          | Original bytes; supported formats converted like local files                                                       |
| Local file or file URL                | Original bytes, including unknown binary formats                                                                   |
| UTF-8 text, Markdown, code, JSON, XML | Original bytes preserved; searchable text/Markdown with captured and rebased image links                           |
| Images                                | Original plus local image reference; no invented description or OCR                                                |
| PDF                                   | Extracted text and supported embedded raster images; page layout/vector artwork/OCR are not reconstructed          |
| DOCX, PPTX, XLSX                      | MarkItDown conversion and embedded images; no macros, formula recalculation or slide layout reconstruction         |
| Folder                                | Bounded recursive snapshot; excludes known sensitive filenames/directories, dependency/build/state paths and links |
| Local or HTTP(S) Git repository       | Committed HEAD snapshot with commit provenance; excludes submodules, links and unsafe/generated paths              |

Git does not import uncommitted edits; use `--kind folder` for a working directory
snapshot. HTTP(S) Git remotes and local repositories are supported. SSH remotes,
interactive authentication and credential discovery are not implemented. URLs
must not embed user/password credentials. Private-network retrieval requires
the explicit `--allow-private-network` host option. Redirects and image requests
are checked independently; checked DNS addresses are pinned for network access.

`get` reuses an existing source identity, and `sync` checks its current input.
Content hashes detect changed bytes even when filesystem timestamps are
unreliable. HTTP validators can avoid downloading unchanged raw files. Pages
and their images are rechecked so a changed image can create a version even if
the HTML stayed the same. Git records the captured commit. A successful unchanged
check updates freshness metadata without rewriting immutable retrieval evidence.
Parser changes and content changes can create a new version.

Unsupported first-time conversions preserve originals with warnings. Inspect
those warnings before claiming searchable coverage. Retrieval failures and
failed refreshes of previously extracted content preserve the last successful
version. The converter is a bounded subprocess, with offline parsing and no
plugin, model, macro, repository hook or dependency-script execution. These
controls are not an operating-system sandbox.

Limits are explicit: 16 MiB per retained file, 64 MiB and 256 files across one
capture's originals and derivatives, and 120 seconds per capture. PDF conversion
is limited to 200 pages. Exceeding a required capture limit fails publication;
unsupported or omitted representations report warnings. Larger sources need a
smaller selected input. Originals, images and Markdown use verified SHA-256 blobs;
SQLite atomically publishes version manifests and current-version FTS search.
Search results contain source/version/path/line citations and stay within the
selected workspace. Deletion removes source metadata and search visibility.
Unreferenced blob bytes remain on disk; automatic garbage collection is not yet
implemented.

Git checks eligible paths and file-count capacity against the pinned tree before
reading blobs. Oversized repositories fail with typed `capacity` and leave no
partially published source; exclusions still apply before counting eligible files.

Search accepts natural questions as well as identifiers. It removes common
question words, splits identifier components, uses English stemming and bounded
OR candidate retrieval, then ranks informative term coverage. It remains lexical
search: no embedding model or generation API runs inside the memory service.
Opening a version-one store atomically rebuilds its search index; immutable
source manifests and blobs remain unchanged. The search index schema is now
version two. PDF parser version two preserves physical page text with explicit
page headings and embedded raster images; reading order, table structure, vector
artwork and OCR still need source inspection.

The [memory benchmark](benchmarks/results.md) records retrieval, extraction,
source lifecycle and competitor measurements, including remaining evidence gaps.

## MCP and installation

```sh
aube run --no-install cli memory mcp --root /absolute/project --data /absolute/private-state
aube run --no-install cli integrations list --root /absolute/project
aube run --no-install cli integrations plan codex --root /absolute/project
aube run --no-install cli integrations install codex --root /absolute/project
aube run --no-install cli integrations install claude-code --root /absolute/project --components skill
```

For an agent configuration, launch the absolute Bun executable with the absolute
`app/cli/index.ts` path and the `memory mcp` arguments above. Stdout contains only
MCP frames; diagnostics use stderr. The official SDK v2 serves modern and legacy
clients. Tools are `memory_get`, `memory_sync`, `memory_list`, `memory_show`,
`memory_search`, `memory_read`, `memory_export`, and `memory_delete`.

MCP requires an explicit root or registered workspace. Local retrieval is limited
to that root and any additional directories explicitly granted through repeated
`--allow-root` launch options. Tool input cannot change those grants. Exports
stay inside the primary root. Sources and results remain untrusted evidence,
even when a document contains instructions addressed to an agent. A cancellation
or disconnected connection must not publish an unfinished capture.

Discovery reuses the reviewed Vercel Skills registry's 79 entries and reports
configuration/executable evidence without launching agents. Presence does not
prove authentication or working MCP support. Skill installation supports those
reviewed skill locations. Automatic MCP configuration is implemented for Codex,
Claude Code and Cursor; other agents can use the returned command in their own
documented configuration. Choose `--components skill|mcp|both` and
`--scope project|global`; defaults are both/project. Global bindings still select
one explicit workspace, not every future working directory.

Installation preserves unrelated settings, creates backups for changed existing
configs, rejects conflicting entries, and is idempotent. It does not launch
agents or modify their trust settings. Reload the agent and complete its normal
MCP trust flow when required by that client. The distributable
[skill](../skills/teamagent-memory/SKILL.md) receives concrete local command paths
at installation. `--python` or `TEAMAGENT_IMPORT_PYTHON` selects an absolute
interpreter with the pinned document packages. The default interpreter lives in
this checkout's `.cache/import-python`; compiled sidecars need an explicit
converter path for document imports, regardless of their working directory.

## Library use

The public package entries are `teamagent/memory` and `teamagent/integrations`.
They export portable Effect Schema contracts, service ports and CLI descriptors.
Host adapters are `teamagent/memory/bun` and `teamagent/integrations/bun`.

```ts
import { Effect } from "effect";
import { MemoryService } from "teamagent/memory";
import { memoryHostLayer } from "teamagent/memory/bun";

const work = Effect.gen(function* () {
  const memory = yield* MemoryService;
  const receipt = yield* memory.get({ locator: "notes.md" });
  return yield* memory.read(receipt.source.id, undefined, receipt.version.id);
});

await Effect.runPromise(
  work.pipe(
    Effect.provide(
      memoryHostLayer({
        data: "/absolute/private-state",
        root: "/absolute/project",
      }),
    ),
  ),
);
```

`openMemory`/`memoryLayer` in `app/memory` accept a supplied `SourceCapture` for
custom acquisition and deterministic testing. The host layer composes the real
retriever and owns cleanup. Zod and MCP SDK imports stay in the protocol adapter;
the inward domain boundary validates with Effect Schema. Architecture lint
enforces these dependencies.

## Verification

Run `imports:setup` before the repository test gate. Tests use temporary SQLite
stores, real local HTTP/Git fixtures, actual document conversion, subprocess CLI
commands, an official MCP client and isolated agent configuration directories.
They cover changed/unchanged captures, immutable history, image-only updates,
failed refreshes, scope isolation, cancellation, bounded reads, corruption,
configuration preservation and install idempotence. No paid model is required.

The existing web and desktop task interfaces remain task interfaces; memory is
available through the CLI, MCP and library in this increment. Mobile is deferred.
