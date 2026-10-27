import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import assert from "node:assert/strict";
import { mkdir, mkdtemp, realpath, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Effect, Schema } from "effect";
import {
  MemoryError,
  ProvenanceSchema,
  type CaptureRequest,
  type CaptureResult,
  type MemoryApi,
  type SourceVersion,
} from "@/memory";
import { createSourceCapture } from "../app/imports/index.ts";
import { contained, digest } from "../app/imports/limits.ts";
import { openMemoryHost } from "../app/runtime/memory.ts";

let directory = "";
const stores: MemoryApi[] = [];
const page =
  '<html><body><h1>Approved source wording</h1><img src="image.png" alt="evidence"></body></html>';
const pixels = (revision: number) => Buffer.from([0x89, 0x50, 0x4e, 0x47, revision]);
const date = "Tue, 27 Oct 2026 12:00:00 GMT";

beforeAll(async () => {
  directory = await realpath(await mkdtemp(join(tmpdir(), "teamagent-http-cache-")));
  await mkdir(join(directory, "temporary"));
});
afterAll(async () => {
  for (const store of stores) await Effect.runPromise(store.close());
  if (contained(await realpath(tmpdir()), directory) && directory.includes("teamagent-http-cache-"))
    await rm(directory, { recursive: true, force: true });
});
async function memory(name: string) {
  const store = await Effect.runPromise(
    openMemoryHost({
      data: join(directory, name),
      root: directory,
      allowPrivateNetwork: true,
    }),
  );
  stores.push(store);
  return store;
}
function request(locator: string, prior?: SourceVersion): CaptureRequest {
  return {
    locator,
    kind: "url",
    convert: true,
    workspaceRoot: directory,
    dataDirectory: directory,
    temporaryDirectory: join(directory, "temporary"),
    ...(prior === undefined ? {} : { previous: prior }),
  };
}
function captured(result: CaptureResult) {
  if (result.status !== "captured") throw new Error("Expected captured fixture");
  return result;
}
function previous(result: Extract<CaptureResult, { status: "captured" }>): SourceVersion {
  return {
    id: "fixture-version",
    sourceId: "fixture-source",
    workspaceId: "fixture-workspace",
    number: 1,
    contentHash: "a".repeat(64),
    retrievedAt: "2026-10-27T00:00:00.000Z",
    provenance: result.provenance,
    files: result.files.map((file) => ({
      path: file.path,
      role: file.role,
      mediaType: file.mediaType,
      size: file.bytes.byteLength,
      sha256: digest(file.bytes),
      origin: file.origin ?? null,
    })),
  };
}

describe("conditional source and image refresh", () => {
  test("304 pages and images retain wording, detect image-only changes and preserve immutable timestamps", async () => {
    let imageRevision = 1;
    let imageTag = '"image-1"';
    let failure = false;
    const seen: { path: string; etag: string | null }[] = [];
    const server = Bun.serve({
      hostname: "127.0.0.1",
      port: 0,
      fetch(incoming): Response {
        const path = new URL(incoming.url).pathname;
        const etag = incoming.headers.get("if-none-match");
        seen.push({ path, etag });
        if (path === "/image.png") {
          if (failure) return new Response("Unavailable", { status: 503 });
          return etag === imageTag
            ? new Response(null, { status: 304, headers: { etag: imageTag } })
            : new Response(pixels(imageRevision), {
                headers: { etag: imageTag, "content-type": "image/png" },
              });
        }
        return etag === '"page"'
          ? new Response(null, { status: 304, headers: { etag: '"page"' } })
          : new Response(page, { headers: { etag: '"page"', "content-type": "text/html" } });
      },
    });
    try {
      const store = await memory("conditional");
      const initial = await Effect.runPromise(
        store.get({ locator: new URL("page.html", server.url).href }),
      );
      const same = await Effect.runPromise(store.sync(initial.source.id));
      expect(same.status).toBe("unchanged");
      expect(same.version.id).toBe(initial.version.id);
      expect(seen.slice(-2)).toEqual([
        { path: "/page.html", etag: '"page"' },
        { path: "/image.png", etag: '"image-1"' },
      ]);
      imageRevision = 2;
      imageTag = '"image-2"';
      const changed = await Effect.runPromise(store.sync(initial.source.id));
      expect(changed.status).toBe("updated");
      expect(changed.source.createdAt).toBe(initial.source.createdAt);
      expect(changed.version.files.find((file) => file.role === "original")?.sha256).toBe(
        initial.version.files.find((file) => file.role === "original")?.sha256,
      );
      expect(changed.version.files.find((file) => file.role === "image")?.sha256).not.toBe(
        initial.version.files.find((file) => file.role === "image")?.sha256,
      );
      expect(
        new TextDecoder().decode((await Effect.runPromise(store.read(initial.source.id))).bytes),
      ).toContain("Approved source wording");
      imageTag = '"same-bytes-new-validator"';
      const metadata = await Effect.runPromise(store.sync(initial.source.id));
      expect(metadata.status).toBe("unchanged");
      expect(metadata.version.id).toBe(changed.version.id);
      expect(metadata.source.lastProvenance.httpAssets?.[0]?.etag).toBe(imageTag);
      expect(metadata.version.retrievedAt).toBe(changed.version.retrievedAt);
      await Effect.runPromise(store.sync(initial.source.id));
      expect(seen.at(-1)?.etag).toBe(imageTag);
      const baseline = await Effect.runPromise(store.show(initial.source.id));
      failure = true;
      await assert.rejects(
        Effect.runPromise(store.sync(initial.source.id)),
        (error: unknown) => error instanceof MemoryError && error.code === "network",
      );
      expect((await Effect.runPromise(store.show(initial.source.id))).source).toEqual(
        baseline.source,
      );
    } finally {
      await server.stop(true);
    }
  });

  test("Last-Modified validators revalidate parent and images without ETags", async () => {
    const seen: (string | null)[] = [];
    const server = Bun.serve({
      hostname: "127.0.0.1",
      port: 0,
      fetch(incoming): Response {
        const modified = incoming.headers.get("if-modified-since");
        seen.push(modified);
        if (modified === date) return new Response(null, { status: 304 });
        const image = new URL(incoming.url).pathname === "/image.png";
        return new Response(image ? pixels(1) : page, {
          headers: { "last-modified": date, "content-type": image ? "image/png" : "text/html" },
        });
      },
    });
    try {
      const store = await memory("modified");
      const initial = await Effect.runPromise(
        store.get({ locator: new URL("page.html", server.url).href }),
      );
      const next = await Effect.runPromise(store.sync(initial.source.id));
      expect(next.status).toBe("unchanged");
      expect(seen).toEqual([null, null, date, date]);
      expect(next.source.lastProvenance.httpAssets?.[0]?.lastModified).toBe(date);
    } finally {
      await server.stop(true);
    }
  });

  test("validators follow only the exact retained final URL and never a changed redirect target", async () => {
    let target = 1;
    const seen: { path: string; etag: string | null }[] = [];
    const server = Bun.serve({
      hostname: "127.0.0.1",
      port: 0,
      fetch(incoming): Response {
        const path = new URL(incoming.url).pathname;
        const etag = incoming.headers.get("if-none-match");
        seen.push({ path, etag });
        if (path === "/redirect")
          return Response.redirect(new URL(`page-${target}.html`, server.url).href);
        if (path === "/image.png")
          return Response.redirect(new URL(`pixel-${target}.png`, server.url).href);
        if (path.startsWith("/pixel-"))
          return etag === '"image"'
            ? new Response(null, { status: 304 })
            : new Response(pixels(target), {
                headers: { etag: '"image"', "content-type": "image/png" },
              });
        return etag === '"page"'
          ? new Response(null, { status: 304 })
          : new Response(page, { headers: { etag: '"page"', "content-type": "text/html" } });
      },
    });
    try {
      const store = await memory("redirects");
      const first = await Effect.runPromise(
        store.get({ locator: new URL("redirect", server.url).href }),
      );
      await Effect.runPromise(store.sync(first.source.id));
      expect(seen.slice(-4)).toEqual([
        { path: "/redirect", etag: null },
        { path: "/page-1.html", etag: '"page"' },
        { path: "/image.png", etag: null },
        { path: "/pixel-1.png", etag: '"image"' },
      ]);
      target = 2;
      const next = await Effect.runPromise(store.sync(first.source.id));
      expect(next.status).toBe("updated");
      expect(seen.slice(-4).every((entry) => entry.etag === null)).toBe(true);
      expect(next.version.files.find((file) => file.role === "original")?.origin).toEndWith(
        "/page-2.html",
      );
    } finally {
      await server.stop(true);
    }
  });

  test("304 reuse refuses missing, malformed or altered retained bytes", async () => {
    const server = Bun.serve({
      hostname: "127.0.0.1",
      port: 0,
      fetch(incoming): Response {
        return incoming.headers.has("if-none-match")
          ? new Response(null, { status: 304 })
          : new Response("<html><body>Retained source</body></html>", {
              headers: { etag: '"page"', "content-type": "text/html" },
            });
      },
    });
    try {
      const input = request(new URL("page.html", server.url).href);
      const initial = captured(
        await Effect.runPromise(createSourceCapture({ allowPrivateNetwork: true })(input)),
      );
      for (const readPreviousFile of [
        async () => {
          throw new Error("missing cache");
        },
        async () => "not bytes",
        async () => new Uint8Array([1, 2]),
        async () => new Uint8Array(initial.files[0]?.bytes.byteLength ?? 0),
      ]) {
        const capture = createSourceCapture({ allowPrivateNetwork: true, readPreviousFile });
        await assert.rejects(
          Effect.runPromise(capture({ ...input, previous: previous(initial) })),
          (error: unknown) => error instanceof MemoryError && error.code === "integrity",
        );
      }
    } finally {
      await server.stop(true);
    }
  });

  test("cached image bytes are independently verified and unsolicited asset304 fails publication", async () => {
    let unsolicited = false;
    const server = Bun.serve({
      hostname: "127.0.0.1",
      port: 0,
      fetch(incoming): Response {
        const image = new URL(incoming.url).pathname === "/image.png";
        if (incoming.headers.has("if-none-match") || (image && unsolicited))
          return new Response(null, { status: 304 });
        return new Response(image ? pixels(1) : page, {
          headers: {
            etag: image ? '"image"' : '"page"',
            "content-type": image ? "image/png" : "text/html",
          },
        });
      },
    });
    try {
      const input = request(new URL("page.html", server.url).href);
      const initial = captured(
        await Effect.runPromise(createSourceCapture({ allowPrivateNetwork: true })(input)),
      );
      const capture = createSourceCapture({
        allowPrivateNetwork: true,
        readPreviousFile: async (_version, file) =>
          file.role === "image"
            ? pixels(9)
            : initial.files.find((item) => item.path === file.path)?.bytes,
      });
      await assert.rejects(
        Effect.runPromise(capture({ ...input, previous: previous(initial) })),
        (error: unknown) => error instanceof MemoryError && error.code === "integrity",
      );
      unsolicited = true;
      const legacy = {
        ...previous(initial),
        provenance: { ...initial.provenance, httpAssets: [] },
      };
      await assert.rejects(
        Effect.runPromise(capture({ ...input, previous: legacy })),
        (error: unknown) => error instanceof MemoryError && error.code === "network",
      );
    } finally {
      await server.stop(true);
    }
  });

  test("stale routing policy and network denial cannot be bypassed by retained validators", async () => {
    const seen: (string | null)[] = [];
    const server = Bun.serve({
      hostname: "127.0.0.1",
      port: 0,
      fetch(incoming): Response {
        seen.push(incoming.headers.get("if-none-match"));
        return new Response("<html><body>Evidence</body></html>", {
          headers: { etag: '"stable"', "content-type": "text/html" },
        });
      },
    });
    try {
      const input = request(new URL("page.html", server.url).href);
      const initial = captured(
        await Effect.runPromise(createSourceCapture({ allowPrivateNetwork: true })(input)),
      );
      const prior = previous(initial);
      const stale = {
        ...prior,
        provenance: { ...prior.provenance, extraction: { policy: "old-policy", parsers: [] } },
      };
      const reader = async () => {
        throw new Error("must not read unvalidated cache");
      };
      await Effect.runPromise(
        createSourceCapture({ allowPrivateNetwork: true, readPreviousFile: reader })({
          ...input,
          previous: stale,
        }),
      );
      expect(seen).toEqual([null, null]);
      await assert.rejects(
        Effect.runPromise(
          createSourceCapture({ readPreviousFile: reader })({ ...input, previous: prior }),
        ),
      );
      expect(seen).toHaveLength(2);
    } finally {
      await server.stop(true);
    }
  });

  test("raw 304 reuse verifies bytes and missing reader falls back to full retrieval", async () => {
    const seen: (string | null)[] = [];
    const bytes = new TextEncoder().encode("Raw retained source");
    const server = Bun.serve({
      hostname: "127.0.0.1",
      port: 0,
      fetch(incoming): Response {
        const tag = incoming.headers.get("if-none-match");
        seen.push(tag);
        return tag === '"raw"'
          ? new Response(null, { status: 304 })
          : new Response(bytes, { headers: { etag: '"raw"', "content-type": "text/plain" } });
      },
    });
    try {
      const input = { ...request(new URL("plain.txt", server.url).href), convert: false };
      const capture = createSourceCapture({ allowPrivateNetwork: true });
      const initial = captured(await Effect.runPromise(capture(input)));
      const prior = previous(initial);
      expect((await Effect.runPromise(capture({ ...input, previous: prior }))).status).toBe(
        "captured",
      );
      expect(seen).toEqual([null, null]);
      await assert.rejects(
        Effect.runPromise(
          createSourceCapture({
            allowPrivateNetwork: true,
            readPreviousFile: async () => new Uint8Array(bytes.byteLength),
          })({ ...input, previous: prior }),
        ),
        (error: unknown) => error instanceof MemoryError && error.code === "integrity",
      );
      expect(
        (
          await Effect.runPromise(
            createSourceCapture({ allowPrivateNetwork: true, readPreviousFile: async () => bytes })(
              { ...input, previous: prior },
            ),
          )
        ).status,
      ).toBe("unchanged");
      expect(seen.slice(-2)).toEqual(['"raw"', '"raw"']);
    } finally {
      await server.stop(true);
    }
  });

  test("asset metadata is optional, bounded, exact-schema and duplicate-free", () => {
    const legacy = {
      etag: null,
      lastModified: null,
      repositoryCommit: null,
      parserVersion: "fixture/1",
      warnings: [],
    };
    expect(Schema.is(ProvenanceSchema)(legacy)).toBe(true);
    const asset = {
      path: "converted/page/assets/image.png",
      locator: "https://example.invalid/image.png",
      origin: "https://example.invalid/image.png",
      etag: '"image"',
      lastModified: null,
    };
    expect(Schema.is(ProvenanceSchema)({ ...legacy, httpAssets: [asset] })).toBe(true);
    for (const httpAssets of [
      [asset, asset],
      [{ ...asset, secret: "unsupported" }],
      [{ ...asset, etag: "a".repeat(2049) }],
      Array.from({ length: 257 }, (_, index) => ({ ...asset, path: `asset-${index}` })),
    ]) {
      expect(() =>
        Schema.decodeUnknownSync(ProvenanceSchema)(
          { ...legacy, httpAssets },
          { onExcessProperty: "error" },
        ),
      ).toThrow();
    }
  });
});
