import { strict as assert } from "node:assert";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve, relative, isAbsolute } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { Client, type CallToolResult } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";
import { Effect, Schema } from "effect";
import { MemoryService } from "teamagent/memory";
import { memoryHostLayer, openMemoryHost } from "teamagent/memory/bun";
import { ImportResultSchema, MemorySourceSchema, SearchHitSchema } from "@/memory";

const repository = fileURLToPath(new URL("../", import.meta.url));
const cliPath = join(repository, "app/cli/index.ts");
const json = (text: string): unknown =>
  Schema.decodeUnknownSync(Schema.fromJsonString(Schema.Unknown))(text);

async function fixture() {
  const directory = await mkdtemp(join(tmpdir(), "teamagent-memory-surface-"));
  const root = join(directory, "workspace");
  const data = join(directory, "state");
  await mkdir(root);
  await writeFile(join(root, "note.md"), "# Sea otter\n\nOtters use rocks as tools.\n");
  await writeFile(join(directory, "outside.txt"), "outside scope");
  return { directory, root, data };
}
async function removeFixture(directory: string) {
  const target = resolve(directory);
  const path = relative(resolve(tmpdir()), target);
  assert.ok(
    !isAbsolute(path) && path.startsWith("teamagent-memory-surface-") && !path.includes(".."),
  );
  await rm(target, { recursive: true, force: true });
}
async function command(args: readonly string[]) {
  const child = Bun.spawn([process.execPath, cliPath, ...args], {
    cwd: repository,
    stdin: "ignore",
    stdout: "pipe",
    stderr: "pipe",
  });
  const timer = setTimeout(() => child.kill(), 20_000);
  try {
    const [stdout, stderr, status] = await Promise.all([
      new Response(child.stdout).text(),
      new Response(child.stderr).text(),
      child.exited,
    ]);
    return { stdout, stderr, status };
  } finally {
    clearTimeout(timer);
  }
}
function resultValue(result: CallToolResult): unknown {
  assert.notEqual(result.isError, true, JSON.stringify(result.content));
  const content = result.content?.[0];
  assert.ok(content?.type === "text");
  return json(content.text);
}

await test("public package library entries compose a scoped Effect service and release it", async () => {
  const f = await fixture();
  try {
    const { memory, receipt } = await Effect.runPromise(
      Effect.gen(function* () {
        const memory = yield* MemoryService;
        const receipt = yield* memory.get({ locator: "note.md", convert: false });
        const read = yield* memory.read(receipt.source.id);
        assert.ok(new TextDecoder().decode(read.bytes).includes("Otters"));
        return { memory, receipt };
      }).pipe(Effect.provide(memoryHostLayer({ data: f.data, root: f.root }))),
    );
    assert.equal(receipt.status, "created");
    await assert.rejects(Effect.runPromise(memory.list()));
  } finally {
    await removeFixture(f.directory);
  }
});

await test("memory CLI retrieves, syncs, searches, reads and exports without a running daemon", async () => {
  const f = await fixture();
  const run = async (...args: string[]) => {
    const result = await command(["memory", ...args, "--data", f.data, "--root", f.root]);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stderr, "");
    return json(result.stdout);
  };
  try {
    const created = Schema.decodeUnknownSync(ImportResultSchema)(await run("get", "note.md"));
    assert.equal(created.status, "created");
    const unchanged = Schema.decodeUnknownSync(ImportResultSchema)(
      await run("sync", created.source.id),
    );
    assert.equal(unchanged.status, "unchanged");
    assert.equal(unchanged.version.id, created.version.id);
    assert.equal(
      Schema.decodeUnknownSync(Schema.Array(SearchHitSchema))(await run("search", "otters")).length,
      1,
    );
    const read = Schema.decodeUnknownSync(
      Schema.Struct({ encoding: Schema.String, content: Schema.String }),
    )(await run("read", created.source.id));
    assert.equal(read.encoding, "utf8");
    assert.ok(read.content.includes("Otters"));
    await writeFile(join(f.root, "note.md"), "# Sea otter\n\nOtters float together.\n");
    const updated = Schema.decodeUnknownSync(ImportResultSchema)(
      await run("sync", created.source.id),
    );
    assert.equal(updated.status, "updated");
    const historical = Schema.decodeUnknownSync(Schema.Struct({ content: Schema.String }))(
      await run("read", created.source.id, "--source-version", created.version.id),
    );
    assert.ok(historical.content.includes("rocks"));
    const output = join(f.directory, "exported");
    await run("export", created.source.id, "--output", output);
    assert.ok((await readFile(join(output, "manifest.json"), "utf8")).includes(updated.version.id));
    await run("delete", created.source.id);
    assert.deepEqual(await run("list"), { sources: [], total: 0, nextOffset: null });
    const invalid = await command([
      "memory",
      "get",
      "note.md",
      "--kind",
      "unknown",
      "--root",
      f.root,
      "--data",
      f.data,
    ]);
    assert.equal(invalid.status, 1);
    assert.ok(invalid.stderr.includes("invalid"));
    const scopeMissing = await command(["memory", "mcp", "--data", f.data]);
    assert.equal(scopeMissing.status, 1);
    assert.ok(scopeMissing.stderr.includes("explicit"));
  } finally {
    await removeFixture(f.directory);
  }
});

await test("official MCP client drives stdio tools with bounded reads, scoped imports/exports and strict inputs", async () => {
  const f = await fixture();
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [cliPath, "memory", "mcp", "--data", f.data, "--root", f.root],
    cwd: repository,
    stderr: "pipe",
  });
  const client = new Client({ name: "teamagent-memory-acceptance", version: "1.0.0" });
  try {
    await client.connect(transport);
    const { tools } = await client.listTools();
    assert.deepEqual(
      tools.map((tool) => tool.name).sort(),
      [
        "memory_get",
        "memory_sync",
        "memory_list",
        "memory_show",
        "memory_search",
        "memory_read",
        "memory_export",
        "memory_delete",
      ].sort(),
    );
    assert.equal(
      tools.find((tool) => tool.name === "memory_delete")?.annotations?.destructiveHint,
      true,
    );
    const created = Schema.decodeUnknownSync(ImportResultSchema)(
      resultValue(await client.callTool({ name: "memory_get", arguments: { locator: "note.md" } })),
    );
    const id = created.source.id;
    const read = Schema.decodeUnknownSync(
      Schema.Struct({
        content: Schema.String,
        nextOffset: Schema.Number,
        versionId: Schema.String,
        length: Schema.Number,
      }),
    )(
      resultValue(
        await client.callTool({ name: "memory_read", arguments: { sourceId: id, length: 5 } }),
      ),
    );
    assert.equal(read.length, 5);
    assert.equal(read.content, "# Sea");
    assert.equal(read.nextOffset, 5);
    assert.equal(read.versionId, created.version.id);
    const listed = Schema.decodeUnknownSync(
      Schema.Struct({ sources: Schema.Array(MemorySourceSchema), total: Schema.Number }),
    )(resultValue(await client.callTool({ name: "memory_list", arguments: { limit: 1 } })));
    assert.equal(listed.total, 1);
    assert.equal(listed.sources[0]?.id, id);
    assert.equal(
      Schema.decodeUnknownSync(Schema.Array(SearchHitSchema))(
        resultValue(
          await client.callTool({ name: "memory_search", arguments: { query: "rocks" } }),
        ),
      ).length,
      1,
    );
    const unchanged = Schema.decodeUnknownSync(ImportResultSchema)(
      resultValue(await client.callTool({ name: "memory_sync", arguments: { sourceId: id } })),
    );
    assert.equal(unchanged.status, "unchanged");
    for (const locator of [join(f.directory, "outside.txt"), "../outside.txt"]) {
      const blocked = await client.callTool({ name: "memory_get", arguments: { locator } });
      assert.equal(blocked.isError, true);
    }
    assert.equal(
      (
        await client.callTool({
          name: "memory_read",
          arguments: { sourceId: id, path: "../outside.txt" },
        })
      ).isError,
      true,
    );
    assert.equal(
      (
        await client.callTool({
          name: "memory_export",
          arguments: { sourceId: id, directory: "../outside-export" },
        })
      ).isError,
      true,
    );
    resultValue(
      await client.callTool({
        name: "memory_export",
        arguments: { sourceId: id, directory: "evidence" },
      }),
    );
    assert.ok(
      (await readFile(join(f.root, "evidence/manifest.json"), "utf8")).includes(created.version.id),
    );
    const invalid = await client
      .callTool({
        name: "memory_get",
        arguments: { locator: "note.md", allowedRoots: [f.directory] },
      })
      .then(
        (result) => result.isError === true,
        (error: unknown) => error instanceof Error,
      );
    assert.equal(invalid, true);
    resultValue(await client.callTool({ name: "memory_delete", arguments: { sourceId: id } }));
    const empty = Schema.decodeUnknownSync(Schema.Struct({ total: Schema.Number }))(
      resultValue(await client.callTool({ name: "memory_list", arguments: {} })),
    );
    assert.equal(empty.total, 0);
  } finally {
    await client.close();
    await transport.close();
    await removeFixture(f.directory);
  }
});

await test("MCP serves the modern discovery protocol from the same scoped tool factory", async () => {
  const f = await fixture();
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [cliPath, "memory", "mcp", "--data", f.data, "--root", f.root],
    cwd: repository,
    stderr: "pipe",
  });
  const client = new Client(
    { name: "teamagent-memory-modern", version: "1.0.0" },
    { versionNegotiation: { mode: { pin: "2026-07-28" } } },
  );
  try {
    await client.connect(transport);
    assert.equal((await client.listTools()).tools.length, 8);
    const page = Schema.decodeUnknownSync(Schema.Struct({ total: Schema.Number }))(
      resultValue(await client.callTool({ name: "memory_list", arguments: {} })),
    );
    assert.equal(page.total, 0);
  } finally {
    await client.close();
    await transport.close();
    await removeFixture(f.directory);
  }
});

async function extractorFixture(directory: string, root: string) {
  const worker = join(directory, "fixture-extractor.ts");
  await writeFile(
    worker,
    `import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
if (process.argv.includes("--version")) process.stdout.write("fixture 1.0.0\\n");
else {
 const [input, output, option] = process.argv.slice(2);
 if (!input || !output || !option) throw new Error("missing fixture arguments");
 if (!(await readFile(input, "utf8")).startsWith("%PDF")) throw new Error("wrong staged input");
 await mkdir(output, { recursive: true });
 await writeFile(join(output, "document.md"), "# Fixture evidence\\n\\nSelected option: " + option);
}
`,
  );
  const path = join(directory, "extractors.json");
  await writeFile(
    path,
    JSON.stringify({
      version: 1,
      defaultProfile: "first",
      profiles: ["first", "second"].map((id) => ({
        id,
        engine: "xberg",
        version: "1.0.0",
        command: process.execPath,
        args: [worker, "{input}", "{outputDir}", id],
        versionArgs: [worker, "--version"],
        timeoutMs: 5000,
      })),
    }),
  );
  await writeFile(
    join(root, "fixture.pdf"),
    "%PDF-1.4\nExplicit external converter fixture input.\n",
  );
  return path;
}

await test("public memory host pins extractor options into version identity and preserves failed refreshes", async () => {
  const f = await fixture();
  const path = await extractorFixture(f.directory, f.root);
  try {
    const first = await Effect.runPromise(
      openMemoryHost({ data: f.data, root: f.root, extractorsConfig: path, extractor: "first" }),
    );
    const initial = await Effect.runPromise(first.get({ locator: "fixture.pdf" }));
    assert.ok(
      initial.version.provenance.extraction?.parsers.some((parser) =>
        parser.includes("teamagent-extractor/1;xberg;first;1.0.0;"),
      ),
    );
    const unchanged = await Effect.runPromise(first.sync(initial.source.id));
    assert.equal(unchanged.version.id, initial.version.id);
    await Effect.runPromise(first.close());
    const second = await Effect.runPromise(
      openMemoryHost({ data: f.data, root: f.root, extractorsConfig: path, extractor: "second" }),
    );
    try {
      const updated = await Effect.runPromise(second.sync(initial.source.id));
      assert.notEqual(updated.version.id, initial.version.id);
      assert.equal(updated.source.id, initial.source.id);
      assert.ok(
        new TextDecoder()
          .decode((await Effect.runPromise(second.read(initial.source.id))).bytes)
          .includes("Selected option: second"),
      );
      assert.ok(
        new TextDecoder()
          .decode(
            (await Effect.runPromise(second.read(initial.source.id, undefined, initial.version.id)))
              .bytes,
          )
          .includes("Selected option: first"),
      );
      await writeFile(
        join(f.directory, "fixture-extractor.ts"),
        'throw new Error("fixture extractor unavailable");',
      );
      await assert.rejects(Effect.runPromise(second.sync(initial.source.id)));
      assert.equal(
        (await Effect.runPromise(second.show(initial.source.id))).source.currentVersionId,
        updated.version.id,
      );
    } finally {
      await Effect.runPromise(second.close());
    }
    await assert.rejects(
      Effect.runPromise(openMemoryHost({ data: f.data, root: f.root, extractor: "first" })),
    );
  } finally {
    await removeFixture(f.directory);
  }
});

await test("CLI and MCP use explicitly bound extractor profiles without accepting per-document command overrides", async () => {
  const f = await fixture();
  const path = await extractorFixture(f.directory, f.root);
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [
      cliPath,
      "memory",
      "mcp",
      "--root",
      f.root,
      "--data",
      f.data,
      "--extractors-config",
      path,
      "--extractor",
      "second",
    ],
    cwd: repository,
    stderr: "pipe",
  });
  const client = new Client({ name: "extractor-profile-acceptance", version: "1.0.0" });
  try {
    const listing = await command(["memory", "extractors", "--extractors-config", path]);
    assert.equal(listing.status, 0, listing.stderr);
    assert.equal(
      Schema.decodeUnknownSync(Schema.Struct({ defaultProfile: Schema.String }))(
        json(listing.stdout),
      ).defaultProfile,
      "first",
    );
    const doctor = await command([
      "memory",
      "doctor",
      "--extractors-config",
      path,
      "--extractor",
      "first",
    ]);
    assert.equal(doctor.status, 0, doctor.stderr);
    assert.equal(
      Schema.decodeUnknownSync(Schema.Struct({ available: Schema.Boolean }))(json(doctor.stdout))
        .available,
      true,
    );
    const receipt = await command([
      "memory",
      "get",
      "fixture.pdf",
      "--root",
      f.root,
      "--data",
      f.data,
      "--extractors-config",
      path,
      "--extractor",
      "first",
    ]);
    assert.equal(receipt.status, 0, receipt.stderr);
    const first = Schema.decodeUnknownSync(ImportResultSchema)(json(receipt.stdout));
    await client.connect(transport);
    const refreshed = Schema.decodeUnknownSync(ImportResultSchema)(
      resultValue(
        await client.callTool({ name: "memory_sync", arguments: { sourceId: first.source.id } }),
      ),
    );
    assert.ok(
      refreshed.version.provenance.extraction?.parsers.some((parser) =>
        parser.includes(";second;"),
      ),
    );
    assert.notEqual(first.version.id, refreshed.version.id);
    const override = await client
      .callTool({
        name: "memory_get",
        arguments: { locator: "fixture.pdf", extractor: "first", command: "untrusted" },
      })
      .then(
        (result) => result.isError === true,
        (error: unknown) => error instanceof Error,
      );
    assert.equal(override, true);
  } finally {
    await client.close();
    await transport.close();
    await removeFixture(f.directory);
  }
});
