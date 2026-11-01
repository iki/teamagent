import { mkdtempSync } from "./temporary.ts";
import { afterEach, describe, expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import { rejects } from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Effect, Schema } from "effect";
import { openMemory, memoryLayer } from "../app/memory/index.ts";
import { MemoryExportManifestSchema, verifyExportFile } from "../app/memory/export.ts";
import {
  MemoryError,
  MemoryService,
  MemorySourceSchema,
  SourceDetailsSchema,
  SourceVersionSchema,
  type CaptureRequest,
  type CaptureResult,
  type MemoryApi,
  type Provenance,
  type SourceCapture,
} from "@/memory";

const temporaryRoots: string[] = [];
const openStores: MemoryApi[] = [];
afterEach(async () => {
  for (const store of openStores.splice(0)) await Effect.runPromise(store.close());
  for (const root of temporaryRoots.splice(0)) rmSync(root, { recursive: true, force: true });
});
const provenance = (etag = "first"): Provenance => ({
  etag,
  lastModified: null,
  repositoryCommit: null,
  parserVersion: "test-parser@1",
  warnings: [],
});
const captured = (
  content: string,
  tag = "first",
): Extract<CaptureResult, { status: "captured" }> => ({
  status: "captured",
  kind: "file",
  locator: "sample.txt",
  provenance: provenance(tag),
  files: [
    {
      path: "originals/sample.txt",
      role: "original",
      mediaType: "text/plain",
      bytes: new TextEncoder().encode(content),
      origin: "sample.txt",
    },
    {
      path: "index.md",
      role: "markdown",
      mediaType: "text/markdown",
      bytes: new TextEncoder().encode(content),
      origin: "sample.txt",
    },
  ],
});
async function fixture(
  capture: SourceCapture = () => Effect.succeed(captured("Alpha evidence\nSecond line")),
) {
  const root = mkdtempSync(join(tmpdir(), "teamagent-memory-"));
  temporaryRoots.push(root);
  const workspaceRoot = join(root, "workspace");
  const dataDirectory = join(root, "data");
  mkdirSync(workspaceRoot);
  let clock = Date.UTC(2026, 9, 4);
  const options = {
    workspaceId: "workspace-a",
    workspaceRoot,
    dataDirectory,
    capture,
    now: () => clock,
  };
  const store = await Effect.runPromise(openMemory(options));
  openStores.push(store);
  return {
    root,
    options,
    store,
    tick: () => {
      clock += 60_000;
    },
  };
}

describe("source memory", () => {
  test("exports LF text with exact raw hashes while keeping historical versions and opaque bytes", async () => {
    const content = "\uFEFFAlpha\r\nBeta\rGamma\n";
    const bytes = new TextEncoder().encode(content);
    const binary = new Uint8Array([137, 80, 78, 71, 13, 10, 0, 255]);
    const opaque = new Uint8Array([0, 13, 10]);
    const invalidUtf8 = new Uint8Array([255, 13, 10]);
    const svg = new TextEncoder().encode("<svg>\r\n<text>Evidence</text>\r</svg>");
    const { store, root } = await fixture(() =>
      Effect.succeed({
        ...captured(content),
        files: [
          ...captured(content).files,
          { path: "image.png", role: "image", mediaType: "image/png", bytes: binary },
          { path: "opaque.txt", role: "original", mediaType: "text/plain", bytes: opaque },
          { path: "invalid.txt", role: "original", mediaType: "text/plain", bytes: invalidUtf8 },
          { path: "image.svg", role: "image", mediaType: "image/svg+xml", bytes: svg },
        ],
      }),
    );
    const receipt = await Effect.runPromise(store.get({ locator: "sample.txt" }));
    const exported = await Effect.runPromise(
      store.export(receipt.source.id, join(root, "lf-export")),
    );
    const manifest = Schema.decodeUnknownSync(Schema.fromJsonString(MemoryExportManifestSchema))(
      readFileSync(join(exported.directory, "manifest.json"), "utf8"),
    );
    expect(manifest.version).toEqual(receipt.version);
    if (manifest.format !== "teamagent-memory-export-v2") throw new Error("Expected v2 export.");
    expect(manifest.normalization.files).toHaveLength(3);
    const file = receipt.version.files.find((candidate) => candidate.path === "index.md");
    if (file === undefined) throw new Error("Missing Markdown fixture.");
    const normalized = readFileSync(join(exported.directory, "files/index.md"));
    const raw = readFileSync(join(exported.directory, "raw", file.sha256));
    expect(normalized.toString("utf8")).toBe("\uFEFFAlpha\nBeta\nGamma\n");
    expect(new Uint8Array(raw)).toEqual(bytes);
    expect(new Uint8Array(readFileSync(join(exported.directory, "files/image.png")))).toEqual(
      binary,
    );
    expect(new Uint8Array(readFileSync(join(exported.directory, "files/opaque.txt")))).toEqual(
      opaque,
    );
    expect(new Uint8Array(readFileSync(join(exported.directory, "files/invalid.txt")))).toEqual(
      invalidUtf8,
    );
    expect(readFileSync(join(exported.directory, "files/image.svg"), "utf8")).toBe(
      "<svg>\n<text>Evidence</text>\n</svg>",
    );
    const svgHash = createHash("sha256").update(svg).digest("hex");
    expect(new Uint8Array(readFileSync(join(exported.directory, "raw", svgHash)))).toEqual(svg);
    expect(() => verifyExportFile(manifest, file, normalized, raw)).not.toThrow();
    expect(() => verifyExportFile(manifest, file, normalized, normalized)).toThrow();
    const retained = await Effect.runPromise(
      store.read(receipt.source.id, file.path, receipt.version.id),
    );
    expect(retained.bytes).toEqual(bytes);
    expect(retained.version.contentHash).toBe(receipt.version.contentHash);
    const same = await Effect.runPromise(store.sync(receipt.source.id));
    expect(same.version.id).toBe(receipt.version.id);
  });

  test("natural questions and identifier words retrieve inflected evidence without requiring grammar words", async () => {
    const { store } = await fixture(() =>
      Effect.succeed(
        captured(
          "The connectionManager retries requests after transient failures.\nThe retry budget bounds attempts.",
        ),
      ),
    );
    await Effect.runPromise(store.get({ locator: "sample.txt" }));
    expect(
      await Effect.runPromise(
        store.search({ query: "How does the connection manager retry a request?" }),
      ),
    ).toHaveLength(1);
    expect(await Effect.runPromise(store.search({ query: "connectionManager" }))).toHaveLength(1);
    expect(await Effect.runPromise(store.search({ query: "connection_manager" }))).toHaveLength(1);
    expect(await Effect.runPromise(store.search({ query: "unfindablexyzabc" }))).toHaveLength(0);
  });

  test("upgrades a version-one search index atomically without changing immutable source evidence", async () => {
    const { store, options } = await fixture(() =>
      Effect.succeed(captured("The connectionManager retries requests.")),
    );
    const receipt = await Effect.runPromise(store.get({ locator: "sample.txt" }));
    await Effect.runPromise(store.close());
    const database = new Database(join(options.dataDirectory, "memory", "memory.sqlite"));
    database.exec(`BEGIN;
      ALTER TABLE source_text RENAME TO newer_text;
      CREATE VIRTUAL TABLE source_text USING fts5(workspaceId UNINDEXED,sourceId UNINDEXED,versionId UNINDEXED,path UNINDEXED,lineStart UNINDEXED,lineEnd UNINDEXED,text,tokenize='unicode61');
      INSERT INTO source_text(workspaceId,sourceId,versionId,path,lineStart,lineEnd,text) SELECT workspaceId,sourceId,versionId,path,lineStart,lineEnd,text FROM newer_text;
      DROP TABLE newer_text;
      PRAGMA user_version=1;
      COMMIT;`);
    database.close();
    const reopened = await Effect.runPromise(openMemory(options));
    openStores.push(reopened);
    const hits = await Effect.runPromise(
      reopened.search({ query: "How are connection manager requests retried?" }),
    );
    expect(hits).toHaveLength(1);
    expect(hits[0]?.versionId).toBe(receipt.version.id);
    const original = await Effect.runPromise(reopened.read(receipt.source.id));
    expect(original.version.contentHash).toBe(receipt.version.contentHash);
    expect(new TextDecoder().decode(original.bytes)).toBe(
      "The connectionManager retries requests.",
    );
  });

  test("retains original bytes, immutable versions and current search citations across reopen", async () => {
    let text = "Alpha evidence\nSecond line";
    const { store, options, tick } = await fixture(() => Effect.succeed(captured(text)));
    const first = await Effect.runPromise(store.get({ locator: "sample.txt" }));
    expect(first.status).toBe("created");
    expect(first.version.number).toBe(1);
    const hits = await Effect.runPromise(store.search({ query: "Alpha", limit: 3 }));
    expect(hits).toHaveLength(1);
    expect(hits[0]?.citation).toContain(`${first.source.id}/${first.version.id}/index.md#L1-L2`);
    tick();
    const same = await Effect.runPromise(store.sync(first.source.id));
    expect(same.status).toBe("unchanged");
    expect(same.version.id).toBe(first.version.id);
    expect(same.version.retrievedAt).toBe(first.version.retrievedAt);
    expect(same.source.checkedAt).not.toBe(first.source.checkedAt);
    text = "Beta replacement\nThird line";
    tick();
    const next = await Effect.runPromise(store.sync(first.source.id));
    expect(next.status).toBe("updated");
    expect(next.version.number).toBe(2);
    expect(await Effect.runPromise(store.search({ query: "Alpha" }))).toHaveLength(0);
    expect((await Effect.runPromise(store.search({ query: "Beta" })))[0]?.versionId).toBe(
      next.version.id,
    );
    const original = await Effect.runPromise(
      store.read(first.source.id, "originals/sample.txt", first.version.id),
    );
    expect(new TextDecoder().decode(original.bytes)).toBe("Alpha evidence\nSecond line");
    await Effect.runPromise(store.close());
    const reopened = await Effect.runPromise(openMemory(options));
    openStores.push(reopened);
    const details = await Effect.runPromise(reopened.show(first.source.id, { limit: 10 }));
    expect(details.versions.map((version) => version.number)).toEqual([2, 1]);
    expect(Schema.is(SourceDetailsSchema)(details)).toBe(true);
  });

  test("keeps validator updates separate from immutable retrieval provenance", async () => {
    const seen: CaptureRequest[] = [];
    let response: CaptureResult = captured("Same content", "old-tag");
    const { store, tick } = await fixture((request) => {
      seen.push(request);
      return Effect.succeed(response);
    });
    const first = await Effect.runPromise(store.get({ locator: "sample.txt" }));
    tick();
    response = captured("Same content", "new-tag");
    const same = await Effect.runPromise(store.sync(first.source.id));
    expect(same.status).toBe("unchanged");
    expect(same.version.provenance.etag).toBe("old-tag");
    expect(same.source.lastProvenance.etag).toBe("new-tag");
    response = { status: "unchanged", provenance: provenance("new-tag") };
    await Effect.runPromise(store.sync(first.source.id));
    expect(seen[2]?.previous?.provenance.etag).toBe("new-tag");
    expect((await Effect.runPromise(store.show(first.source.id))).versions).toHaveLength(1);
  });

  test("failed refresh preserves the last successful source, index and checked timestamp", async () => {
    let failed = false;
    const { store, tick } = await fixture(() =>
      failed
        ? Effect.fail(new MemoryError({ code: "network", message: "Source unavailable." }))
        : Effect.succeed(captured("Surviving evidence")),
    );
    const first = await Effect.runPromise(store.get({ locator: "sample.txt" }));
    failed = true;
    tick();
    await rejects(Effect.runPromise(store.sync(first.source.id)), /Source unavailable/);
    expect((await Effect.runPromise(store.show(first.source.id))).source).toEqual(first.source);
    expect(await Effect.runPromise(store.search({ query: "Surviving" }))).toHaveLength(1);
  });

  test("scope filters protect source metadata, versions, blobs and deletion", async () => {
    const { store, options } = await fixture();
    const first = await Effect.runPromise(store.get({ locator: "sample.txt" }));
    const other = await Effect.runPromise(openMemory({ ...options, workspaceId: "workspace-b" }));
    openStores.push(other);
    expect(await Effect.runPromise(other.list())).toEqual({
      sources: [],
      total: 0,
      nextOffset: null,
    });
    expect(await Effect.runPromise(other.search({ query: "Alpha" }))).toEqual([]);
    await rejects(Effect.runPromise(other.show(first.source.id)), /not found/);
    await rejects(
      Effect.runPromise(other.read(first.source.id, "index.md", first.version.id)),
      /not found/,
    );
    await rejects(Effect.runPromise(other.delete(first.source.id)), /not found/);
    const separate = await Effect.runPromise(other.get({ locator: "sample.txt" }));
    expect(separate.source.id).not.toBe(first.source.id);
    await Effect.runPromise(store.delete(first.source.id));
    expect(await Effect.runPromise(store.search({ query: "Alpha" }))).toEqual([]);
    await rejects(Effect.runPromise(store.read(first.source.id)), /not found/);
    expect(await Effect.runPromise(other.search({ query: "Alpha" }))).toHaveLength(1);
  });

  test("detects blob corruption before read or export and exports originals alongside Markdown", async () => {
    const { store, root, options } = await fixture();
    const first = await Effect.runPromise(store.get({ locator: "sample.txt" }));
    const exported = await Effect.runPromise(store.export(first.source.id, join(root, "exported")));
    expect(readFileSync(join(exported.directory, "files", "index.md"), "utf8")).toBe(
      "Alpha evidence\nSecond line",
    );
    const manifest: unknown = JSON.parse(
      readFileSync(join(exported.directory, "manifest.json"), "utf8"),
    );
    expect(
      Schema.is(
        Schema.Struct({
          format: Schema.Literal("teamagent-memory-export-v2"),
          source: MemorySourceSchema,
          version: SourceVersionSchema,
        }),
      )(manifest),
    ).toBe(true);
    await rejects(
      Effect.runPromise(store.export(first.source.id, exported.directory)),
      /already exists/,
    );
    await rejects(
      Effect.runPromise(store.export(first.source.id, join(options.dataDirectory, "leak"))),
      /private/,
    );
    const file = first.version.files[0];
    if (file === undefined) throw new Error("Missing test capture file.");
    const scopeHash = createHash("sha256").update(options.workspaceId).digest("hex");
    writeFileSync(
      join(options.dataDirectory, "memory", "blobs", scopeHash, file.sha256),
      "Bad bytes",
    );
    await rejects(Effect.runPromise(store.read(first.source.id, file.path)), /manifest/);
    await rejects(
      Effect.runPromise(store.export(first.source.id, join(root, "corrupt-export"))),
      /manifest/,
    );
  });

  test("validates caller input and captured manifests without publishing partial sources", async () => {
    let result: CaptureResult = {
      ...captured("bad"),
      status: "captured",
      kind: "file",
      locator: "sample.txt",
      provenance: provenance(),
      files: [
        {
          path: "../escape",
          role: "original",
          mediaType: "text/plain",
          bytes: new Uint8Array([1]),
        },
      ],
    };
    const { store } = await fixture(() => Effect.succeed(result));
    await rejects(
      Effect.runPromise(store.get({ locator: "sample.txt", unknown: true })),
      /Invalid source/,
    );
    await rejects(Effect.runPromise(store.get({ locator: "sample.txt" })), /unsafe/);
    expect((await Effect.runPromise(store.list())).sources).toHaveLength(0);
    result = {
      status: "captured",
      kind: "file",
      locator: "sample.txt",
      provenance: provenance(),
      files: [
        { path: "same.txt", role: "original", mediaType: "text/plain", bytes: new Uint8Array([1]) },
        { path: "SAME.txt", role: "markdown", mediaType: "text/plain", bytes: new Uint8Array([1]) },
      ],
    };
    await rejects(Effect.runPromise(store.get({ locator: "sample.txt" })), /case-colliding/);
    result = { status: "unchanged", provenance: provenance() };
    await rejects(
      Effect.runPromise(store.get({ locator: "sample.txt" })),
      /without an existing source/,
    );
    expect(await Effect.runPromise(store.list())).toEqual({
      sources: [],
      total: 0,
      nextOffset: null,
    });
  });

  test("rejects a stale concurrent publication and bounds active captures", async () => {
    const firstGate = Promise.withResolvers<CaptureResult>();
    const secondGate = Promise.withResolvers<CaptureResult>();
    let calls = 0;
    const { store } = await fixture(() => {
      calls += 1;
      if (calls === 1) return Effect.succeed(captured("Initial content"));
      const gate = calls === 2 ? firstGate : secondGate;
      return Effect.promise(() => gate.promise);
    });
    const first = await Effect.runPromise(store.get({ locator: "sample.txt" }));
    const pendingFirst = Effect.runPromise(store.sync(first.source.id));
    const pendingSecond = Effect.runPromise(store.sync(first.source.id));
    await new Promise((resolve) => setTimeout(resolve, 5));
    await rejects(Effect.runPromise(store.sync(first.source.id)), /two active/);
    firstGate.resolve(captured("Newer successful snapshot"));
    expect((await pendingFirst).status).toBe("updated");
    secondGate.resolve(captured("Stale competing snapshot"));
    await rejects(pendingSecond, /concurrent sync/);
    expect(await Effect.runPromise(store.search({ query: "Newer" }))).toHaveLength(1);
    expect(await Effect.runPromise(store.search({ query: "Stale" }))).toHaveLength(0);
  });

  test("exposes a scoped portable Effect service and rejects use after close", async () => {
    const { options, store } = await fixture();
    const sources = await Effect.runPromise(
      Effect.gen(function* () {
        const memory = yield* MemoryService;
        yield* memory.get({ locator: "sample.txt" });
        return yield* memory.list();
      }).pipe(Effect.provide(memoryLayer(options))),
    );
    expect(sources.sources).toHaveLength(1);
    await Effect.runPromise(store.close());
    await rejects(Effect.runPromise(store.list()), /closed/);
  });

  test("pages sources and immutable versions before decoding and rejects invalid page bounds", async () => {
    let generation = 1;
    const { store } = await fixture((request) =>
      Effect.succeed({ ...captured(`Generation ${generation}`), locator: request.locator }),
    );
    const first = await Effect.runPromise(store.get({ locator: "first.txt" }));
    await Effect.runPromise(store.get({ locator: "second.txt" }));
    await Effect.runPromise(store.get({ locator: "third.txt" }));
    const page = await Effect.runPromise(store.list({ limit: 2 }));
    expect(page.sources).toHaveLength(2);
    expect(page.total).toBe(3);
    expect(page.nextOffset).toBe(2);
    const tail = await Effect.runPromise(store.list({ offset: 2, limit: 2 }));
    expect(tail.sources).toHaveLength(1);
    expect(tail.nextOffset).toBeNull();
    expect(new Set([...page.sources, ...tail.sources].map((source) => source.id)).size).toBe(3);
    generation = 2;
    await Effect.runPromise(store.sync(first.source.id));
    const details = await Effect.runPromise(store.show(first.source.id));
    expect(details.versions.map((version) => version.number)).toEqual([2]);
    expect(details.total).toBe(2);
    expect(details.nextOffset).toBe(1);
    expect(
      (await Effect.runPromise(store.show(first.source.id, { offset: 1 }))).versions[0]?.number,
    ).toBe(1);
    await rejects(Effect.runPromise(store.list({ limit: 101 })), /validation/);
    await rejects(Effect.runPromise(store.show(first.source.id, { limit: 11 })), /validation/);
    await rejects(Effect.runPromise(store.list({ offset: -1 })), /validation/);
  });

  test("does not resurrect a deleted source when its pending capture completes", async () => {
    const gate = Promise.withResolvers<CaptureResult>();
    let waiting = false;
    const { store } = await fixture(() =>
      waiting ? Effect.promise(() => gate.promise) : Effect.succeed(captured("Original")),
    );
    const first = await Effect.runPromise(store.get({ locator: "sample.txt" }));
    waiting = true;
    const pending = Effect.runPromise(store.sync(first.source.id));
    await new Promise((resolve) => setTimeout(resolve, 5));
    await Effect.runPromise(store.delete(first.source.id));
    gate.resolve(captured("Late update"));
    await rejects(pending, /not found/);
    expect((await Effect.runPromise(store.list())).total).toBe(0);
    expect(await Effect.runPromise(store.search({ query: "Late" }))).toEqual([]);
  });

  test("cancellation and closing prevent pending captures from publishing", async () => {
    let gate = Promise.withResolvers<CaptureResult>();
    let waiting = false;
    const { store, options } = await fixture(() =>
      waiting ? Effect.promise(() => gate.promise) : Effect.succeed(captured("Original")),
    );
    const first = await Effect.runPromise(store.get({ locator: "sample.txt" }));
    waiting = true;
    const controller = new AbortController();
    const cancelled = Effect.runPromise(store.sync(first.source.id), { signal: controller.signal });
    await new Promise((resolve) => setTimeout(resolve, 5));
    controller.abort();
    await rejects(cancelled);
    gate.resolve(captured("Cancelled update"));
    waiting = false;
    expect((await Effect.runPromise(store.sync(first.source.id))).status).toBe("unchanged");
    expect((await Effect.runPromise(store.show(first.source.id))).total).toBe(1);
    gate = Promise.withResolvers<CaptureResult>();
    waiting = true;
    const closed = Effect.runPromise(store.sync(first.source.id));
    await new Promise((resolve) => setTimeout(resolve, 5));
    await Effect.runPromise(store.close());
    gate.resolve(captured("Closed update"));
    await rejects(closed, /closed/);
    const reopened = await Effect.runPromise(openMemory(options));
    openStores.push(reopened);
    expect((await Effect.runPromise(reopened.show(first.source.id))).total).toBe(1);
  });

  test("records empty folder snapshots and advances Git commit watermarks without fabricated originals", async () => {
    let response: CaptureResult = {
      status: "captured",
      kind: "folder",
      locator: "empty-folder",
      files: [],
      provenance: provenance(),
    };
    const { store, root } = await fixture(() => Effect.succeed(response));
    const empty = await Effect.runPromise(store.get({ locator: "empty-folder", kind: "folder" }));
    expect(empty.version.files).toEqual([]);
    expect((await Effect.runPromise(store.sync(empty.source.id))).status).toBe("unchanged");
    await rejects(Effect.runPromise(store.read(empty.source.id)), /not found/);
    expect(
      (await Effect.runPromise(store.export(empty.source.id, join(root, "empty-export")))).version
        .files,
    ).toEqual([]);
    response = {
      status: "captured",
      kind: "git",
      locator: "empty-git",
      files: [],
      provenance: { ...provenance(), repositoryCommit: "a".repeat(40) },
    };
    const repository = await Effect.runPromise(store.get({ locator: "empty-git", kind: "git" }));
    response = { ...response, provenance: { ...provenance(), repositoryCommit: "b".repeat(40) } };
    const updated = await Effect.runPromise(store.sync(repository.source.id));
    expect(updated.status).toBe("updated");
    expect(updated.version.provenance.repositoryCommit).toBe("b".repeat(40));
  });

  test("rejects corrupted manifest metadata before serving versioned evidence", async () => {
    const { store, options } = await fixture();
    const first = await Effect.runPromise(store.get({ locator: "sample.txt" }));
    const database = new Database(join(options.dataDirectory, "memory", "memory.sqlite"), {
      strict: true,
    });
    try {
      database
        .query("UPDATE versions SET value=? WHERE id=?")
        .run(JSON.stringify({ ...first.version, contentHash: "0".repeat(64) }), first.version.id);
    } finally {
      database.close();
    }
    await rejects(Effect.runPromise(store.show(first.source.id)), /manifest verification/);
    await rejects(Effect.runPromise(store.read(first.source.id)), /manifest verification/);
    await rejects(Effect.runPromise(store.sync(first.source.id)), /manifest verification/);
  });
});
