import { afterEach, describe, expect, test } from "bun:test";
import { rejects } from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, mkdir, readFile, rm, writeFile, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { Effect, Schema } from "effect";
import {
  MemoryError,
  MemorySourceSchema,
  SourceVersionSchema,
  type CaptureResult,
  type MemoryApi,
  type SourceCapture,
} from "@/memory";
import { openMemory } from "../app/memory/index.ts";
import {
  displaySource,
  parseTextSources,
  textQuality,
  LegacyTextStateSchema,
} from "../app/research/text-contracts.ts";
import { readTextState, textSourceReport } from "../app/research/text-reports.ts";
import { syncTextResources } from "../app/research/text-sync.ts";

const roots: string[] = [];
const stores: MemoryApi[] = [];
afterEach(async () => {
  for (const store of stores.splice(0)) await Effect.runPromise(store.close());
  for (const root of roots.splice(0)) await rm(root, { recursive: true, force: true });
});
const substantive =
  "# Source evidence\n\nA technical source describes bounded imports, immutable versions, checksums, source provenance and explicit partial extraction. ";
function captured(locator: string, text: string): CaptureResult {
  return {
    status: "captured",
    kind: "url",
    locator,
    provenance: {
      etag: null,
      lastModified: null,
      repositoryCommit: null,
      parserVersion: "fixture@1",
      warnings: [],
    },
    files: [
      {
        path: "originals/page.html",
        role: "original",
        mediaType: "text/html",
        bytes: new TextEncoder().encode(`<article>${text}</article>`),
        origin: locator,
      },
      {
        path: "index.md",
        role: "markdown",
        mediaType: "text/markdown",
        bytes: new TextEncoder().encode(text),
        origin: locator,
      },
    ],
  };
}
async function fixture(capture: SourceCapture, config = "source.md https://example.com/article") {
  const root = await mkdtemp(join(tmpdir(), "teamagent-text-"));
  roots.push(root);
  await writeFile(join(root, ".urls.md.conf"), config);
  await writeFile(join(root, ".urls.pdf.conf"), "# PDF resources\n");
  const store = await Effect.runPromise(
    openMemory({
      workspaceId: "text-fixture",
      workspaceRoot: root,
      dataDirectory: join(root, "memory"),
      capture,
    }),
  );
  stores.push(store);
  return { root, store };
}

describe("repeatable research text imports", () => {
  test("parses groups, quoted URLs and comments without executable syntax or ambiguous aliases", () => {
    expect(
      parseTextSources(
        '# comment\nthread.md "https://x.com/a/status/1?token=private" https://x.com/a/status/2',
      ),
    ).toEqual([
      {
        name: "thread.md",
        sources: [
          { url: "https://x.com/a/status/1?token=private", refresh: false, publishedAt: null },
          { url: "https://x.com/a/status/2", refresh: false, publishedAt: null },
        ],
      },
    ]);
    for (const value of [
      "../a.md https://example.com",
      "a.md file:///secret",
      "a.md https://user:password@example.com",
      "a.md https://example.com\nA.md https://other.com",
      'a.md "https://example.com"trailing',
      "a.md https://example.com # inline",
      "con.md https://example.com",
      "a.md https://example.com https://example.com#duplicate",
    ])
      expect(() => parseTextSources(value)).toThrow();
    expect(displaySource("https://example.com/private?token=secret#part")).toBe(
      "https://example.com/private",
    );
  });

  test("detects social shells, incomplete threads, wrong PDF type and inadequate text", () => {
    const base = {
      name: "source.md",
      locator: "https://example.com",
      markdown: substantive,
      images: 0,
      warnings: [],
      hasPdf: false,
    };
    expect(textQuality(base).validation).toBe("usable-text");
    expect(
      textQuality({
        ...base,
        markdown: "# [Heading](https://example.com/doc?token=private)",
      }).headings.join(" "),
    ).not.toContain("private");
    expect(
      textQuality({
        ...base,
        locator: "https://x.com/a/status/1",
        markdown: "Short valid post",
        socialApi: true,
      }).validation,
    ).toBe("partial");
    expect(
      textQuality({
        ...base,
        markdown: "Enable JavaScript. Sign in to X.",
        locator: "https://x.com/a/status/1",
      }).validation,
    ).toBe("blocked");
    expect(textQuality({ ...base, locator: "https://twitter.com/a/status/1" }).validation).toBe(
      "partial",
    );
    expect(textQuality({ ...base, name: "source.pdf" }).validation).toBe("blocked");
    expect(textQuality({ ...base, markdown: "" }).validation).toBe("unsupported");
    expect(
      textQuality({
        ...base,
        warnings: ["Image unavailable: https://example.com/image?secret=redacted"],
      }).warnings.join(" "),
    ).not.toContain("redacted");
  });

  test("creates, resyncs and updates immutable memory versions with checksum-checked exports", async () => {
    let content = substantive;
    const { root, store } = await fixture(
      (request) => Effect.succeed(captured(request.locator, content)),
      "source.md https://example.com/article refresh=true",
    );
    const first = await syncTextResources({ root }, { memory: store });
    expect(first.records[0]?.status).toBe("created");
    expect(first.records[0]?.validation).toBe("usable-text");
    const firstRecord = first.records[0];
    if (!firstRecord) throw new Error("Expected a source record.");
    const headingReport = textSourceReport("source.md", [
      {
        ...firstRecord,
        headings: [
          "![Image](assets/unavailable.png) [Unsafe](javascript:alert(1)) <img src=x>",
          "[Private](https://example.com/doc?token=heading-secret)",
        ],
      },
    ]);
    expect(headingReport).toContain("&#33;&#91;Image&#93;&#40;assets&#47;unavailable&#46;png&#41;");
    expect(headingReport).not.toContain("![Image](");
    expect(headingReport).not.toContain("[Unsafe](javascript:");
    expect(headingReport).not.toContain("<img");
    expect(headingReport).not.toContain("heading-secret");
    const same = await syncTextResources({ root }, { memory: store });
    expect(same.records[0]?.status).toBe("unchanged");
    expect(same.records[0]?.versionId).toBe(first.records[0]?.versionId);
    content += "New source evidence.";
    const updated = await syncTextResources({ root }, { memory: store });
    expect(updated.records[0]?.status).toBe("updated");
    expect(updated.records[0]?.versionId).not.toBe(first.records[0]?.versionId);
    const firstExport = first.records[0]?.exportDirectory;
    if (!firstExport) throw new Error("Expected version export.");
    const original = await readFile(
      resolve(root, "spec/analyses/texts", firstExport, "files/index.md"),
      "utf8",
    );
    expect(createHash("sha256").update(original).digest("hex")).toBe(
      createHash("sha256").update(substantive).digest("hex"),
    );
    const exported = updated.records[0]?.exportDirectory;
    if (!exported) throw new Error("Expected current version export.");
    await writeFile(resolve(root, "spec/analyses/texts", exported, "files/index.md"), "tampered");
    const corrupted = await syncTextResources({ root }, { memory: store });
    expect(corrupted.records[0]?.validation).toBe("failed");
    expect(corrupted.records[0]?.warnings.join(" ")).toContain("stale evidence");
  });

  test("continues per-source failures, groups posts, redacts URL queries and retains stale evidence", async () => {
    let fail = false;
    const { root, store } = await fixture(
      (request) =>
        fail || request.locator.includes("/broken")
          ? Effect.fail(
              new MemoryError({
                code: "network",
                message: "private raw token must not be printed",
              }),
            )
          : Effect.sleep(request.locator.includes("/status/1") ? "30 millis" : "1 millis").pipe(
              Effect.as(captured(request.locator, substantive)),
            ),
      "thread.md https://x.com/a/status/1?token=private refresh=true https://x.com/a/status/2 refresh=true\nbroken.md https://example.com/broken refresh=true",
    );
    const result = await syncTextResources({ root }, { memory: store });
    expect(result.counts).toMatchObject({ partial: 2, failed: 1 });
    const report = await readFile(join(root, "spec/analyses/texts/thread.md.report.md"), "utf8");
    expect(report).toContain("## Source 2");
    expect(report.indexOf("https://x.com/a/status/1")).toBeLessThan(
      report.indexOf("https://x.com/a/status/2"),
    );
    expect(report).not.toContain("token=private");
    expect(report).toContain("thread completeness are unverified");
    fail = true;
    const failed = await syncTextResources({ root }, { memory: store });
    expect(failed.records.every((record) => record.status === "failed")).toBe(true);
    expect(result.records.map((record) => record.order)).toEqual([0, 1, 2]);
    expect(failed.records.map((record) => record.order)).toEqual([0, 1, 2]);
    for (const prior of result.records) {
      const retained = failed.records.find((record) => record.key === prior.key);
      if (!retained) throw new Error("Expected the same configured source key after failure.");
      expect(retained.source).toBe(prior.source);
      expect(retained.sourceId).toBe(prior.sourceId);
      expect(retained.versionId).toBe(prior.versionId);
      expect(retained.contentHash).toBe(prior.contentHash);
      expect(retained.exportDirectory).toBe(prior.exportDirectory);
      expect(retained.markdownCharacters).toBe(prior.markdownCharacters);
    }
    const state = await readTextState(join(root, ".cache/text/source-state.json"));
    expect(JSON.stringify(state)).not.toContain("token=private");
    expect(JSON.stringify(state)).not.toContain("private raw token");
  });

  test("shares a source import and immutable export across distinct aliases without revision races", async () => {
    let captures = 0;
    const { root, store } = await fixture((request) => {
      captures += 1;
      return Effect.sleep("10 millis").pipe(Effect.as(captured(request.locator, substantive)));
    }, "first.md https://example.com/shared\nsecond.md https://example.com/shared");
    const first = await syncTextResources({ root }, { memory: store });
    expect(captures).toBe(1);
    expect(first.records.every((record) => record.validation === "usable-text")).toBe(true);
    expect(first.records[0]?.versionId).toBe(first.records[1]?.versionId);
    const next = await syncTextResources({ root }, { memory: store });
    expect(captures).toBe(1);
    expect(next.records.every((record) => record.status === "pinned")).toBe(true);
  });
  test("enforces lock, URL budget and cancellation deadlines", async () => {
    const { root, store } = await fixture(
      (request) => Effect.sleep("1 second").pipe(Effect.as(captured(request.locator, substantive))),
      "first.md https://example.com/1\nsecond.md https://example.com/2",
    );
    const result = await syncTextResources({ root, limit: 1, timeoutMs: 100 }, { memory: store });
    expect(result.attempted).toBe(1);
    expect(result.skipped).toBe(1);
    expect(result.records[0]?.warnings.join(" ")).toContain("timeout_or_cancelled");
    await mkdir(join(root, ".cache/text"), { recursive: true });
    await writeFile(join(root, ".cache/text/.text-sync-lock"), "another owner");
    await rejects(syncTextResources({ root }, { memory: store }), /already locked/);
  });
  test("keeps captured static resources offline, pinned and byte-for-byte unchanged even with X API enabled", async () => {
    let captures = 0;
    const { root, store } = await fixture((request) => {
      captures += 1;
      return Effect.succeed(captured(request.locator, substantive));
    }, "article.260101.md https://example.com/article published=2026-01-01");
    const first = await syncTextResources({ root }, { memory: store });
    const record = first.records[0];
    if (!record?.exportDirectory) throw new Error("Expected export.");
    const output = resolve(root, "spec/analyses/texts", record.exportDirectory, "files/index.md");
    const before = await stat(output);
    const firstContent = await readFile(output, "utf8");
    const next = await syncTextResources(
      { root, xApi: true },
      {
        memory: {
          ...store,
          get: () =>
            Effect.fail(
              new MemoryError({ code: "network", message: "Static capture must not fetch." }),
            ),
          export: () =>
            Effect.fail(
              new MemoryError({ code: "storage", message: "Static export must not rewrite." }),
            ),
        },
      },
    );
    expect(captures).toBe(1);
    expect(next.initialOrRefreshImports).toBe(0);
    expect(next.pinned).toBe(1);
    expect(next.records[0]?.versionId).toBe(record.versionId);
    expect(next.records[0]?.checkedAt).toBe(record.checkedAt);
    expect(next.records[0]?.firstCapturedAt).toBe(record.firstCapturedAt);
    expect(next.records[0]?.sourcePublishedAt).toBe("2026-01-01");
    expect(next.records[0]?.publicationEvidence).toBe("configured");
    expect((await stat(output)).mtimeMs).toBe(before.mtimeMs);
    expect(await readFile(output, "utf8")).toBe(firstContent);
  });

  test("migrates v1 state without a network request or inventing dates from the alias", async () => {
    let captures = 0;
    const { root, store } = await fixture((request) => {
      captures += 1;
      return Effect.succeed(captured(request.locator, substantive));
    }, "article.260101.md https://example.com/article");
    const first = await syncTextResources({ root }, { memory: store });
    const legacy = Schema.decodeUnknownSync(LegacyTextStateSchema)({
      format: "teamagent-text-sync-v1",
      checkedAt: first.checkedAt,
      records: first.records,
    });
    await writeFile(join(root, ".cache/text/source-state.json"), JSON.stringify(legacy));
    const next = await syncTextResources({ root }, { memory: store });
    expect(captures).toBe(1);
    expect(next.records[0]?.status).toBe("pinned");
    expect(next.records[0]?.firstCapturedAt).toBe(first.records[0]?.firstCapturedAt);
    expect(next.records[0]?.sourcePublishedAt).toBeNull();
    expect(next.records[0]?.publicationEvidence).toBe("unknown");
    expect((await readTextState(join(root, ".cache/text/source-state.json"))).format).toBe(
      "teamagent-text-sync-v2",
    );
  });

  test("missing or forged pinned exports remain explicit failures and never trigger network repair", async () => {
    let captures = 0;
    const { root, store } = await fixture((request) => {
      captures += 1;
      return Effect.succeed(captured(request.locator, substantive));
    });
    const first = await syncTextResources({ root }, { memory: store });
    const record = first.records[0];
    if (!record?.exportDirectory) throw new Error("Expected export.");
    const output = resolve(root, "spec/analyses/texts", record.exportDirectory, "files/index.md");
    const manifestPath = resolve(
      root,
      "spec/analyses/texts",
      record.exportDirectory,
      "manifest.json",
    );
    const originalManifest = await readFile(manifestPath, "utf8");
    await writeFile(output, "tampered");
    const corrupted = await syncTextResources({ root }, { memory: store });
    expect(corrupted.records[0]?.status).toBe("failed");
    expect(corrupted.records[0]?.warnings.join(" ")).toContain("No network fetch");
    expect(captures).toBe(1);
    const manifest = Schema.decodeUnknownSync(
      Schema.fromJsonString(
        Schema.Struct({
          format: Schema.Literal("teamagent-memory-export-v1"),
          source: MemorySourceSchema,
          version: SourceVersionSchema,
        }),
      ),
    )(originalManifest);
    const forged = {
      ...manifest,
      version: {
        ...manifest.version,
        files: manifest.version.files.map((file) =>
          file.path === "index.md"
            ? { ...file, size: 8, sha256: createHash("sha256").update("tampered").digest("hex") }
            : file,
        ),
      },
    };
    await writeFile(manifestPath, JSON.stringify(forged));
    const forgedResult = await syncTextResources({ root }, { memory: store });
    expect(forgedResult.records[0]?.status).toBe("failed");
    expect(captures).toBe(1);
    await writeFile(manifestPath, originalManifest);
    // On another machine, the public ledger retains the pin even if the private ledger is absent.
    await rm(join(root, ".cache/text/source-state.json"));
    await rm(output);
    const missing = await syncTextResources({ root }, { memory: store });
    expect(missing.records[0]?.status).toBe("failed");
    expect(missing.records[0]?.versionId).toBe(record.versionId);
    expect(captures).toBe(1);
    await rejects(stat(output));
    expect(await readFile(manifestPath, "utf8")).toBe(originalManifest);
  });

  test("retries uncaptured initial static imports but pins a retained success after a failed refresh", async () => {
    let fail = true;
    let captures = 0;
    const { root, store } = await fixture((request) => {
      captures += 1;
      return fail
        ? Effect.fail(new MemoryError({ code: "network", message: "fixture unavailable" }))
        : Effect.succeed(captured(request.locator, substantive));
    }, "source.md https://example.com/article published=2026-01-01");
    const failedInitial = await syncTextResources({ root }, { memory: store });
    expect(failedInitial.records[0]?.firstCapturedAt).toBeNull();
    fail = false;
    const capturedInitial = await syncTextResources({ root }, { memory: store });
    expect(capturedInitial.records[0]?.status).toBe("created");
    fail = true;
    await writeFile(
      join(root, ".urls.md.conf"),
      "source.md https://example.com/article refresh=true",
    );
    const failedRefresh = await syncTextResources({ root }, { memory: store });
    expect(failedRefresh.records[0]?.firstCapturedAt).toBe(
      capturedInitial.records[0]?.firstCapturedAt,
    );
    expect(failedRefresh.records[0]?.sourcePublishedAt).toBe("2026-01-01");
    await writeFile(join(root, ".urls.md.conf"), "source.md https://example.com/article");
    const pinned = await syncTextResources({ root }, { memory: store });
    expect(captures).toBe(3);
    expect(pinned.records[0]?.status).toBe("pinned");
    expect(pinned.records[0]?.versionId).toBe(capturedInitial.records[0]?.versionId);
    expect(pinned.records[0]?.warnings.join(" ")).toContain("preceding remote attempt failed");
  });

  test("scopes refresh and publication options to the preceding URL and rejects ambiguous settings", () => {
    const parsed = parseTextSources(
      "group.md https://example.com/one refresh=true published=2026-01-01 https://example.com/two",
    );
    expect(parsed[0]?.sources).toEqual([
      { url: "https://example.com/one", refresh: true, publishedAt: "2026-01-01" },
      { url: "https://example.com/two", refresh: false, publishedAt: null },
    ]);
    for (const input of [
      "a.md refresh=true https://example.com",
      "a.md https://example.com refresh=yes",
      "a.md https://example.com refresh=true refresh=false",
      "a.md https://example.com published=2026-02-30",
      "a.md https://example.com published=yesterday",
    ])
      expect(() => parseTextSources(input)).toThrow();
  });
  test("a successful capture with failed export retains its identity and is never silently fetched again", async () => {
    let captures = 0;
    const { root, store } = await fixture((request) => {
      captures += 1;
      return Effect.succeed(captured(request.locator, substantive));
    });
    const failed = await syncTextResources(
      { root },
      {
        memory: {
          ...store,
          export: () =>
            Effect.fail(new MemoryError({ code: "storage", message: "fixture export failure" })),
        },
      },
    );
    const retained = failed.records[0];
    expect(retained?.status).toBe("failed");
    expect(retained?.sourceId).not.toBeNull();
    expect(retained?.versionId).not.toBeNull();
    expect(retained?.firstCapturedAt).not.toBeNull();
    expect(retained?.warnings.join(" ")).toContain("successful capture is retained");
    const next = await syncTextResources({ root }, { memory: store });
    expect(captures).toBe(1);
    expect(next.records[0]?.status).toBe("failed");
    expect(next.records[0]?.versionId).toBe(retained?.versionId);
    expect(next.initialOrRefreshImports).toBe(0);
    expect(next.records[0]?.warnings.join(" ")).toContain("No network fetch");
  });
  test("adding and renaming static aliases reuses only an exact-URL pin without a query-redaction collision", async () => {
    let captures = 0;
    const { root, store } = await fixture((request) => {
      captures += 1;
      return Effect.succeed(captured(request.locator, substantive));
    }, "old.md https://example.com/article?edition=one");
    const first = await syncTextResources({ root }, { memory: store });
    await writeFile(
      join(root, ".urls.md.conf"),
      "renamed.md https://example.com/article?edition=one",
    );
    const renamed = await syncTextResources({ root }, { memory: store });
    expect(captures).toBe(1);
    expect(renamed.records[0]?.status).toBe("pinned");
    expect(renamed.records[0]?.versionId).toBe(first.records[0]?.versionId);
    await writeFile(
      join(root, ".urls.md.conf"),
      "renamed.md https://example.com/article?edition=one\nadded.md https://example.com/article?edition=one",
    );
    const added = await syncTextResources({ root }, { memory: store });
    expect(captures).toBe(1);
    expect(added.records.every((record) => record.status === "pinned")).toBe(true);
    expect(added.records.every((record) => record.versionId === first.records[0]?.versionId)).toBe(
      true,
    );
    await writeFile(
      join(root, ".urls.md.conf"),
      "different.md https://example.com/article?edition=two",
    );
    const different = await syncTextResources({ root }, { memory: store });
    expect(captures).toBe(2);
    expect(different.records[0]?.sourceId).not.toBe(first.records[0]?.sourceId);
    expect(different.records[0]?.status).toBe("created");
  });

  test("conflicting alias pins block new static aliases without fetching until refresh is explicit", async () => {
    let captures = 0;
    let content = substantive;
    const { root, store } = await fixture((request) => {
      captures += 1;
      return Effect.succeed(captured(request.locator, content));
    }, "first.md https://example.com/article\nsecond.md https://example.com/article");
    await syncTextResources({ root }, { memory: store });
    content += " Second revision.";
    await writeFile(
      join(root, ".urls.md.conf"),
      "first.md https://example.com/article\nsecond.md https://example.com/article refresh=true",
    );
    await syncTextResources({ root }, { memory: store });
    expect(captures).toBe(2);
    await writeFile(join(root, ".urls.md.conf"), "third.md https://example.com/article");
    const ambiguous = await syncTextResources({ root }, { memory: store });
    expect(captures).toBe(2);
    expect(ambiguous.initialOrRefreshImports).toBe(0);
    expect(ambiguous.records[0]?.status).toBe("failed");
    expect(ambiguous.records[0]?.warnings.join(" ")).toContain(
      "conflicting previously captured alias pins",
    );
    await writeFile(
      join(root, ".urls.md.conf"),
      "third.md https://example.com/article refresh=true",
    );
    const allowed = await syncTextResources({ root }, { memory: store });
    expect(captures).toBe(3);
    expect(allowed.records[0]?.status).toBe("unchanged");
  });

  test("query-only locator tampering in an otherwise intact pinned export fails without fetching", async () => {
    let captures = 0;
    const { root, store } = await fixture((request) => {
      captures += 1;
      return Effect.succeed(captured(request.locator, substantive));
    }, "source.md https://example.com/article?edition=one");
    const first = await syncTextResources({ root }, { memory: store });
    const record = first.records[0];
    if (!record?.exportDirectory) throw new Error("Expected export.");
    const manifestPath = resolve(
      root,
      "spec/analyses/texts",
      record.exportDirectory,
      "manifest.json",
    );
    const manifest = Schema.decodeUnknownSync(
      Schema.fromJsonString(
        Schema.Struct({
          format: Schema.Literal("teamagent-memory-export-v1"),
          source: MemorySourceSchema,
          version: SourceVersionSchema,
        }),
      ),
    )(await readFile(manifestPath, "utf8"));
    await writeFile(
      manifestPath,
      JSON.stringify({
        ...manifest,
        source: { ...manifest.source, inputLocator: "https://example.com/article?edition=two" },
      }),
    );
    const next = await syncTextResources({ root }, { memory: store });
    expect(captures).toBe(1);
    expect(next.initialOrRefreshImports).toBe(0);
    expect(next.records[0]?.status).toBe("failed");
    expect(next.records[0]?.contentHash).toBe(record.contentHash);
    expect(next.records[0]?.warnings.join(" ")).toContain("No network fetch");
    expect(JSON.stringify(next)).not.toContain("edition=two");
  });
});
