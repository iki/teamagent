import { mkdtempSync } from "./temporary.ts";
import { afterEach, describe, expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import { rejects } from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join } from "node:path";
import { Cause, Clock, Effect, Exit, Schema } from "effect";
import { openMemory, memoryLayer, type MemoryOptions } from "../app/memory/index.ts";
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
  exportRename?: MemoryOptions["exportRename"],
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
    ...(exportRename === undefined ? {} : { exportRename }),
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

function publicationFailure(code = "EPERM"): Error {
  return Object.assign(new Error("Private native fixture payload must stay hidden"), {
    code,
    syscall: "rename",
  });
}

describe("source memory", () => {
  test("export retries only Windows publication and preserves prepared bytes without recapture", async () => {
    let captures = 0;
    let attempts = 0;
    let preparedPath = "";
    let preparedManifest = Buffer.alloc(0);
    const { store, root } = await fixture(
      () => {
        captures++;
        return Effect.succeed(captured("Exact evidence\r\n"));
      },
      (from, to) => {
        attempts++;
        if (!preparedPath) {
          preparedPath = from;
          preparedManifest = readFileSync(join(from, "manifest.json"));
        }
        expect(from).toBe(preparedPath);
        expect(readFileSync(join(from, "manifest.json"))).toEqual(preparedManifest);
        if (process.platform === "win32" && attempts <= 2)
          throw publicationFailure(attempts === 1 ? "EPERM" : "EBUSY");
        renameSync(from, to);
      },
    );
    const first = await Effect.runPromise(store.get({ locator: "sample.txt" }));
    const result = await Effect.runPromise(store.export(first.source.id, join(root, "published")));
    expect(captures).toBe(1);
    expect(attempts).toBeGreaterThanOrEqual(process.platform === "win32" ? 3 : 1);
    expect(attempts).toBeLessThanOrEqual(process.platform === "win32" ? 6 : 1);
    expect(result.version).toEqual(first.version);
    expect(readFileSync(join(result.directory, "manifest.json"))).toEqual(preparedManifest);
    expect(readFileSync(join(result.directory, "files/index.md"), "utf8")).toBe("Exact evidence\n");
    expect(existsSync(preparedPath)).toBe(false);
  });

  test("export bounds persistent sharing failures and never retries unrelated native failures", async () => {
    for (const code of ["EPERM", "EXDEV", "EACCES"]) {
      let attempts = 0;
      let temporary = "";
      const { store, root } = await fixture(undefined, (from) => {
        attempts++;
        temporary = from;
        throw publicationFailure(code);
      });
      const first = await Effect.runPromise(store.get({ locator: "sample.txt" }));
      const destination = join(root, "unpublished");
      const error = await Effect.runPromise(
        store.export(first.source.id, destination).pipe(Effect.flip),
      );
      expect(error.code).toBe("storage");
      expect(error.message).toContain(`rename: ${code}`);
      expect(error.message).not.toContain("Private native fixture");
      expect(attempts).toBe(process.platform === "win32" && code === "EPERM" ? 6 : 1);
      expect(existsSync(temporary)).toBe(false);
      expect(existsSync(destination)).toBe(false);
      expect((await Effect.runPromise(store.show(first.source.id))).total).toBe(1);
    }
  });

  test("export preserves existing and newly appearing destinations, including dangling links", async () => {
    let attempts = 0;
    const { store, root } = await fixture(undefined, (_from, to) => {
      attempts++;
      mkdirSync(to);
      writeFileSync(join(to, "sentinel.txt"), "Existing destination\n");
      throw publicationFailure();
    });
    const first = await Effect.runPromise(store.get({ locator: "sample.txt" }));
    const file = join(root, "existing.txt");
    writeFileSync(file, "Existing file\n");
    const directory = join(root, "existing-directory");
    mkdirSync(directory);
    const link = join(root, "dangling-directory");
    symlinkSync(
      join(root, "missing-directory"),
      link,
      process.platform === "win32" ? "junction" : "dir",
    );
    for (const target of [file, directory, link]) {
      const error = await Effect.runPromise(
        store.export(first.source.id, target).pipe(Effect.flip),
      );
      expect(error.code).toBe("conflict");
    }
    expect(attempts).toBe(0);
    expect(readFileSync(file, "utf8")).toBe("Existing file\n");
    expect(lstatSync(link).isSymbolicLink()).toBe(true);
    const appeared = join(root, "appeared");
    await rejects(Effect.runPromise(store.export(first.source.id, appeared)));
    expect(attempts).toBe(1);
    expect(readFileSync(join(appeared, "sentinel.txt"), "utf8")).toBe("Existing destination\n");
    expect(readdirSync(root).filter((name) => name.startsWith(".teamagent-export-"))).toEqual([]);
  });

  test("export retains staging and parent replacements rather than removing foreign directories", async () => {
    for (const replaceParent of [false, true]) {
      let replaced = "";
      let retained = "";
      let originalMoved = false;
      const { store, root } = await fixture(undefined, (from) => {
        const parent = dirname(from);
        retained = join(dirname(parent), "retained-" + basename(parent));
        replaced = from;
        if (replaceParent) {
          renameSync(parent, retained);
          mkdirSync(parent);
        } else {
          retained = join(parent, "retained-staging");
          renameSync(from, retained);
        }
        originalMoved = true;
        mkdirSync(from);
        writeFileSync(join(from, "sentinel.txt"), "Foreign replacement\n");
        throw publicationFailure();
      });
      const first = await Effect.runPromise(store.get({ locator: "sample.txt" }));
      const parent = join(root, "exports");
      mkdirSync(parent);
      await rejects(Effect.runPromise(store.export(first.source.id, join(parent, "published"))));
      expect(originalMoved).toBe(true);
      expect(readFileSync(join(replaced, "sentinel.txt"), "utf8")).toBe("Foreign replacement\n");
      const retainedSource = replaceParent ? join(retained, basename(replaced)) : retained;
      expect(readFileSync(join(retainedSource, "files/index.md"), "utf8")).toBe(
        "Alpha evidence\nSecond line",
      );
      expect(existsSync(join(parent, "published"))).toBe(false);
    }
  });

  test("export refuses changed prepared content and unexpected inventory without publishing it", async () => {
    for (const path of ["manifest.json", "files/index.md", "unexpected.txt"]) {
      let temporary = "";
      let attempts = 0;
      const { store, root } = await fixture(undefined, (from) => {
        attempts++;
        temporary = from;
        writeFileSync(join(from, path), "Changed prepared artifact\n");
        throw publicationFailure();
      });
      const first = await Effect.runPromise(store.get({ locator: "sample.txt" }));
      const destination = join(root, "unpublished");
      const result = await Effect.runPromiseExit(store.export(first.source.id, destination));
      expect(Exit.isFailure(result)).toBe(true);
      if (!Exit.isFailure(result)) throw new Error("Expected changed export rejection.");
      expect(Cause.hasFails(result.cause)).toBe(true);
      expect(Cause.hasDies(result.cause)).toBe(false);
      expect(Cause.pretty(result.cause)).not.toContain("Private native fixture");
      expect(attempts).toBe(1);
      expect(existsSync(destination)).toBe(false);
      expect(readFileSync(join(temporary, path), "utf8")).toBe("Changed prepared artifact\n");
    }
  });

  (process.platform === "win32" ? test : test.skip)(
    "export cancellation during a sharing delay joins cleanup without another publication attempt",
    async () => {
      const reached = Promise.withResolvers<void>();
      const controller = new AbortController();
      let attempts = 0;
      let temporary = "";
      const { store, root } = await fixture(undefined, (from) => {
        attempts++;
        temporary = from;
        reached.resolve();
        throw publicationFailure();
      });
      const first = await Effect.runPromise(store.get({ locator: "sample.txt" }));
      const destination = join(root, "cancelled");
      const pending = Effect.runPromise(store.export(first.source.id, destination), {
        signal: controller.signal,
      });
      const rejected = rejects(pending);
      await reached.promise;
      controller.abort();
      await rejected;
      expect(attempts).toBe(1);
      expect(existsSync(temporary)).toBe(false);
      expect(existsSync(destination)).toBe(false);
      expect((await Effect.runPromise(store.show(first.source.id))).total).toBe(1);
    },
  );

  (process.platform === "win32" ? test : test.skip)(
    "export admission bounds prepared trees and releases slots after cancellation, acquisition and cleanup failure",
    async () => {
      const firstReached = Promise.withResolvers<void>();
      const secondReached = Promise.withResolvers<void>();
      const firstWait = Promise.withResolvers<void>();
      const secondWait = Promise.withResolvers<void>();
      const firstController = new AbortController();
      const secondController = new AbortController();
      const prepared = new Map<string, string>();
      let captures = 0;
      let attempts = 0;
      let releaseSecond = false;
      const { store, root } = await fixture(
        () => {
          captures++;
          return Effect.succeed(captured("Admission evidence\n"));
        },
        (from, to) => {
          attempts++;
          prepared.set(basename(to), from);
          if (basename(to) === "first") {
            firstReached.resolve();
            throw publicationFailure();
          }
          if (basename(to) === "second" && !releaseSecond) {
            secondReached.resolve();
            throw publicationFailure();
          }
          if (basename(to) === "drift") {
            writeFileSync(join(from, "manifest.json"), "Retained changed manifest\n");
            throw publicationFailure();
          }
          renameSync(from, to);
        },
      );
      const imported = await Effect.runPromise(store.get({ locator: "sample.txt" }));
      const liveClock = await Effect.runPromise(Clock.Clock);
      const heldClock = (wait: Promise<void>): Clock.Clock => ({
        currentTimeMillisUnsafe: () => liveClock.currentTimeMillisUnsafe(),
        currentTimeMillis: liveClock.currentTimeMillis,
        currentTimeNanosUnsafe: () => liveClock.currentTimeNanosUnsafe(),
        currentTimeNanos: liveClock.currentTimeNanos,
        monotonicTimeNanosUnsafe: () => liveClock.monotonicTimeNanosUnsafe(),
        monotonicTimeNanos: liveClock.monotonicTimeNanos,
        sleep: () => Effect.promise(() => wait),
      });
      const first = Effect.runPromiseExit(
        store
          .export(imported.source.id, join(root, "first"))
          .pipe(Effect.provideService(Clock.Clock, heldClock(firstWait.promise))),
        { signal: firstController.signal },
      );
      const second = Effect.runPromiseExit(
        store
          .export(imported.source.id, join(root, "second"))
          .pipe(Effect.provideService(Clock.Clock, heldClock(secondWait.promise))),
        { signal: secondController.signal },
      );
      try {
        await Promise.all([firstReached.promise, secondReached.promise]);
        const before = readdirSync(root)
          .filter((name) => name.startsWith(".teamagent-export-"))
          .sort();
        expect(before).toHaveLength(2);
        const blocked = await Effect.runPromise(
          store.export(imported.source.id, join(root, "third")).pipe(Effect.flip),
        );
        expect(blocked.code).toBe("capacity");
        expect(attempts).toBe(2);
        expect(
          readdirSync(root)
            .filter((name) => name.startsWith(".teamagent-export-"))
            .sort(),
        ).toEqual(before);
        firstController.abort();
        expect(Exit.isFailure(await first)).toBe(true);
        const firstTemporary = prepared.get("first");
        if (!firstTemporary) throw new Error("First export did not reach publication.");
        expect(existsSync(firstTemporary)).toBe(false);

        const acquisition = await Effect.runPromise(
          store
            .export(imported.source.id, join(root, "missing-parent", "output"))
            .pipe(Effect.flip),
        );
        expect(acquisition.code).toBe("storage");
        const drift = await Effect.runPromiseExit(
          store.export(imported.source.id, join(root, "drift")),
        );
        expect(Exit.isFailure(drift)).toBe(true);
        if (!Exit.isFailure(drift)) throw new Error("Expected retained scratch failure.");
        expect(Cause.hasFails(drift.cause)).toBe(true);
        expect(Cause.hasDies(drift.cause)).toBe(false);
        expect(Cause.pretty(drift.cause)).not.toContain("Private native fixture");
        const retained = prepared.get("drift");
        if (!retained) throw new Error("Changed export did not reach publication.");
        expect(readFileSync(join(retained, "manifest.json"), "utf8")).toBe(
          "Retained changed manifest\n",
        );
        const success = await Effect.runPromise(
          store.export(imported.source.id, join(root, "success")),
        );
        expect(readFileSync(join(success.directory, "files/index.md"), "utf8")).toBe(
          "Admission evidence\n",
        );
        releaseSecond = true;
        secondWait.resolve();
        expect(Exit.isSuccess(await second)).toBe(true);
        expect(captures).toBe(1);
      } finally {
        firstController.abort();
        secondController.abort();
        firstWait.resolve();
        secondWait.resolve();
        await Promise.all([first, second]);
      }
    },
  );

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
