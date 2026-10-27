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
| PDF                                   | Builtin text and embedded raster images, or a selected external extractor with its configured layout/OCR options   |
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
unreliable. HTTP refresh uses ETag, or Last-Modified when no ETag is available,
for the page/file and each captured HTTP image independently. Validators are
sent only to the exact retained final URL after the current network policy and
redirect checks. A 304 reuses retained bytes only after manifest identity, size
and SHA-256 verification; missing or damaged bytes fail the refresh. Hosts that
have no trusted retained-file reader use bounded full retrieval instead.

An unchanged HTML response is parsed again from verified original bytes so its
images are still revalidated. Image-only changes create a content version; a
changed validator with identical bytes updates freshness metadata without
rewriting the immutable version, retrieval time or source creation time. Servers
without validators use bounded GET plus hashing. Optional bounded
`provenance.httpAssets` stores each image's retained path, requested/final URL,
ETag and Last-Modified in private source/export provenance. Older manifests
remain readable and acquire asset validators on a later refresh. These locators
may contain private query values: public research reports must not copy the
provenance object or disclose complete URLs. Git records the captured commit.
Parser changes and content changes can create a new version.

Unsupported first-time builtin conversions preserve originals with warnings. Inspect
those warnings before claiming searchable coverage. Retrieval failures and
failed refreshes of previously extracted content preserve the last successful
version. A selected external extractor's failure also fails a first import;
it never publishes a successful original-only import or switches engines.
The builtin converter performs offline parsing without plugin, model, macro,
repository hook or dependency-script execution. External extractors are explicitly
trusted executables and can load their own models and access the network according
to their configuration. Neither adapter is an operating-system sandbox.

Limits are explicit: 16 MiB per retained file, 64 MiB and 256 files across one
capture's originals and derivatives, and 120 seconds per builtin capture. Builtin
PDF conversion is limited to 200 pages. External process and capture deadlines
are described below; the retained-file limits still apply. Exceeding a required capture limit fails publication;
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

## External document extractors

[extractors.config.ts](../extractors.config.ts) contains named option sets for
xberg, Marker, MinerU, Docling and OpenDataLoader PDF (`opendataloader`), plus the
`builtin` profile. Its executable and model-cache paths describe the measured
workstation; configure them for another installation. `memory setup` provisions
only the pinned builtin worker. It does not install these external engines or
download their model weights.

```sh
aube run --no-install cli memory extractors --extractors-config ./extractors.config.ts
aube run --no-install cli memory doctor --extractors-config ./extractors.config.ts --extractor xberg-native
aube run --no-install cli memory get /absolute/manual.pdf --root /absolute/project --extractors-config ./extractors.config.ts --extractor xberg-native
aube run --no-install cli memory sync SOURCE_ID --root /absolute/project --extractors-config ./extractors.config.ts --extractor xberg-native
```

`--extractor` requires `--extractors-config`; omitting the profile selects the
file's `defaultProfile`. Without either flag, conversion uses the existing
builtin worker. The profile listing emits IDs, engines and declared versions,
not environment values or complete command arguments. Doctor checks the
configured executable and optional version probe; it does not establish model
availability, OCR accuracy, GPU execution or successful document conversion.

C12 loads only the explicitly chosen trusted file, which may contain executable
TypeScript/JavaScript. No ambient discovery, RC files, dotenv, environment
overlays, inheritance, package configuration or remote layers are enabled.
Effect Schema validates the resulting configuration and rejects unknown fields,
duplicate IDs and missing defaults. Never choose a configuration file merely
because it appeared inside an imported document or repository.

The configuration has `version: 1`, `defaultProfile`, and a `profiles` array.
A builtin entry contains only `id` and `engine: "builtin"`. External entries use:

| Field                           | Contract                                                                                                                                 |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `id`, `engine`, `version`       | Named option set, supported engine ID and declared installed version                                                                     |
| `command`, `args`               | Executable and literal argument array; no shell or command interpolation                                                                 |
| `mediaTypes`                    | Optional explicit MIME types; defaults to `application/pdf`                                                                              |
| `outputMode`                    | `directory` by default; `stdout` for a CLI that writes Markdown to standard output                                                       |
| `outputMarkdown`                | Optional relative Markdown path; otherwise exactly one `.md` or `.markdown` file must exist in the output tree                           |
| `env`                           | Optional explicit environment values, added to a small host environment allowlist                                                        |
| `timeoutMs`                     | Process timeout, 100–1,800,000 ms; default 60,000 ms                                                                                     |
| `versionArgs`, `versionCommand` | Optional version-probe arguments and optional separate executable, for example package metadata from the engine's own Python environment |

Every external invocation receives a private staged input and output directory.
The adapter replaces only `{input}` and `{outputDir}` in individual arguments;
their spelling and braces are literal. Directory mode requires both placeholders.
Stdout mode requires `{input}` and may also use `{outputDir}` for images.
Relative executable paths resolve against the configuration file; bare commands
resolve through the configured host PATH. Prefer absolute executable paths for
reproducible agent installations. Normal argument values, including structured
JSON options, are passed unchanged.

An explicitly selected media type takes precedence over the ordinary image,
text and unsupported-binary handlers when conversion is enabled. For example,
an engine can be configured for `image/png` OCR or `application/epub+zip` EPUB
extraction. Other types keep their existing builtin handling. `--convert=false`
does not invoke external extractors. This declares routing, not a promise that
every engine supports every format; engine failures remain visible.

Version probes must return the declared version as a complete token. A mismatch
or failed probe fails extraction. Without a probe, provenance explicitly warns
that the version was declared but not verified. The parser identity contains the
engine, profile ID, version and a hash of the executable path and configured
options/environment/output settings. It does not hash executable file bytes;
the benchmark records those separately. It does not expose raw option or
environment values. Changed settings
can create a new source version even when input bytes are unchanged.

Capture provenance separates the routing policy from the parsers that actually
ran. `extraction.policy` is a precomputed fingerprint of conversion mode, the
selected external profile, builtin worker version and text/image/raw handler
versions. `extraction.parsers` contains the distinct, sorted identities returned
by successful converters or used by direct text/image handlers. Original-only
or failed conversions do not claim a successful parser. Thus a PDF-only external
profile used for DOCX or HTML records the builtin parser; a folder containing
both PDF and DOCX records both actual parsers. For an external routing policy,
the capture's `parserVersion` is a bounded digest of that policy and actual parser
set. A document converter's own identity remains unchanged.

The source manifest hash covers these extraction details. The optional field
keeps old manifests readable with their original hashes; the first subsequent
capture can create a new version recording the additional provenance. HTTP
validator reuse requires the same precomputed policy, including fallback versions.
An unchanged response cannot alter hashed parser or policy metadata, while ETag
and freshness updates remain separate from immutable retrieval evidence.

Selection belongs to the host invocation, not the source record. Pass the same
configuration/profile again on `sync` when keeping the extraction policy; a
different selection intentionally changes that policy. An MCP server holds its
resolved profile for its lifetime, so restart it after changing configuration.

The process adapter bounds stdout/stderr, enforces its timeout, and on cancellation
terminates its owned process tree on Windows or process group on POSIX before
waiting for closure and deleting staging. The overall capture deadline is the
larger of 120 seconds and the configured process timeout plus 30 seconds. A
multi-document capture shares that deadline. This is cooperative process cleanup,
not filesystem, network, disk-quota or hostile-process isolation.

For non-MCP CLI commands, a delivered SIGINT (normally Ctrl+C), Windows SIGBREAK
(Ctrl+Break) or POSIX SIGTERM interrupts the active operation. The CLI keeps its signal handlers installed while
waiting for process and staging cleanup, then closes the store before removing
them. MCP cancellation is already scoped to its active operation. Forced process
termination, crashes and power loss cannot execute asynchronous cleanup; this
includes Windows `process.kill(..., "SIGTERM")`/`taskkill` and POSIX SIGKILL.

On this Windows host, Aube 2.5.1's `aube run --no-install cli memory ...` launch
suppressed Ctrl+C delivery to Bun. The real-console probe timed out with the
operation still running. Ctrl+Break delivered cancellation and reaped the CLI,
extractor and its child before fixture teardown. Use Ctrl+Break through Aube,
or invoke `bun app/cli/index.ts memory ...` directly for Ctrl+C in a console
that enables it. An upstream launcher can inherit Windows' Ctrl+C-ignore
attribute; registering a JavaScript listener does not guarantee event delivery.
The console tests explicitly normalize only their own launcher state using
[SetConsoleCtrlHandler](https://learn.microsoft.com/windows/console/setconsolectrlhandler)
and still send real Windows control events.
The [launcher probe receipt](../data/extractor-benchmarks/setup/windows-interruption.json)
records both outcomes and the reproduction method.

The reviewed Windows Marker profiles additionally use the repository's
[Marker launcher](../app/imports/marker-windows.py) through Marker's existing
Python interpreter. It requires Marker 2.0.0 and Surya 0.22.1, assigns itself
to a non-inheritable Windows Job Object before importing Marker, and gives each
invocation a private home for helper-server sentinels. It runs the real Marker
CLI, flushes output, and preserves the CLI exit status while bypassing Surya's
POSIX-style `atexit` process cleanup, which is unsuitable for Windows. Closing
the job handle on normal exit, failure or abrupt cancellation terminates its
associated helper processes. The mechanism uses Microsoft's documented
[Job Object ownership](https://learn.microsoft.com/en-us/windows/win32/procthread/job-objects),
with breakaway disabled; it does not patch installed packages or alter extraction
algorithms. This is a Marker-specific Windows lifetime boundary, not a guarantee
provided by every external CLI. The adapter allows bounded retries when deleting
its own staging tree because Windows releases descendant file handles
asynchronously. A persistent cleanup failure still fails the import.

Output validation rejects symlinks, escaped paths, nonregular files, invalid
UTF-8 Markdown, ambiguous Markdown selection and excessive counts or sizes.
It retains at most 128 PNG/JPEG/GIF/WebP assets with validated content signatures
and SHA-256 names, rebasing their local Markdown references. Remote images are
never fetched by this adapter. SVG, executable and other sidecars are not imported;
warnings identify omitted sidecars and unresolved image references. Extraction
success does not establish reading order, table accuracy, OCR quality or image
meaning. The [extractor benchmark protocol](benchmarks/extractors-methodology.md)
defines quality, timing, option-set comparisons and their limitations; measured
recommendations are recorded beside the applicable profiles in the config.

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

Append `--extractors-config /absolute/extractors.config.ts --extractor PROFILE`
to the MCP launch command to bind a profile. MCP tool arguments cannot provide
executables, arguments, environment settings or a different profile. The same
options on `integrations plan`/`integrations install` are preserved in the
installed MCP command and skill binding, using an absolute configuration path:

```sh
aube run --no-install cli integrations plan codex --root /absolute/project --extractors-config ./extractors.config.ts --extractor xberg-native
aube run --no-install cli integrations install codex --root /absolute/project --extractors-config ./extractors.config.ts --extractor xberg-native
```

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
The memory entry also exports `ExtractorConfigSchema`, `ExtractorProfileSchema`
and their TypeScript types. Host options accept `extractorsConfig` and `extractor`;
`resolveMemoryExtractor` loads and validates the selected policy as a typed Effect.

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
        // Optional explicit trusted extractor selection:
        // extractorsConfig: "/absolute/extractors.config.ts",
        // extractor: "xberg-native",
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
Extractor fixtures additionally exercise explicit configuration, distinct options,
version mismatches, literal arguments, stdout output, image rebasing, MIME routing,
unsafe output rejection, typed timeouts and child-process cancellation cleanup.
Normal gates use deterministic local executables; full model/extractor benchmark
runs are separate and preserve measured runtime and model setup provenance.

The existing web and desktop task interfaces remain task interfaces; memory is
available through the CLI, MCP and library in this increment. Mobile is deferred.
