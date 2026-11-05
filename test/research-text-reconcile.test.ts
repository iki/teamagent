import { afterEach, expect, test } from "bun:test";
import { rejects } from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, rename, rm, stat, utimes, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { Effect, Schema } from "effect";
import { MemoryError, type CaptureResult, type MemoryApi } from "@/memory";
import { memoryManifestHash, memoryStorageMessage, openMemory } from "../app/memory/index.ts";
import { MemoryExportManifestSchema } from "../app/memory/export.ts";
import { syncTextResources } from "../app/research/text-sync.ts";
import { atomicText, ensureTextExport, readTextState } from "../app/research/text-reports.ts";
import { reconcileTextResource } from "../app/research/text-reconcile.ts";
import { mkdtemp } from "./temporary.ts";

const roots: string[] = [];
const stores: MemoryApi[] = [];
afterEach(async () => {
  for (const store of stores.splice(0)) await Effect.runPromise(store.close());
  for (const root of roots.splice(0)) await rm(root, { recursive: true, force: true });
});
const locator = "https://example.com/article?scope=private";
const sourceText =
  "# Historical source\n\nBounded sources preserve original evidence, source identity, immutable versions and explicit extraction limitations.\n";

test("storage diagnostics retain recognized categories without private native payloads", () => {
  const error = Object.assign(new Error("private path and token=secret"), {
    code: "EPERM",
    syscall: "rename",
    path: "C:/private/token",
    dest: "C:/secret",
  });
  expect(memoryStorageMessage(error)).toBe(
    "The source store could not complete the operation. (rename: EPERM)",
  );
  expect(
    memoryStorageMessage(
      Object.assign(error, { code: "PRIVATE_SECRET", syscall: "private-operation" }),
    ),
  ).toBe("The source store could not complete the operation.");
  expect(memoryStorageMessage({ code: "EPERM", syscall: "rename", message: "secret" })).toBe(
    "The source store could not complete the operation.",
  );
});

test("identical LF report publication leaves the existing file untouched and differing bytes replace it", async () => {
  const root = await mkdtemp(join(tmpdir(), "teamagent-text-reconcile-"));
  roots.push(root);
  const path = join(root, "report.md");
  await writeFile(path, "First\nSecond\n");
  await utimes(path, new Date("2020-01-01T00:00:00Z"), new Date("2020-01-01T00:00:00Z"));
  const before = await stat(path);
  await atomicText(path, "First\r\nSecond\r\n");
  const unchanged = await stat(path);
  expect(unchanged.mtimeMs).toBe(before.mtimeMs);
  expect(unchanged.ino).toBe(before.ino);
  expect(await readFile(path, "utf8")).toBe("First\nSecond\n");
  await atomicText(path, "Changed\r\n");
  expect(await readFile(path, "utf8")).toBe("Changed\n");
  const directory = join(root, "not-a-report");
  await mkdir(directory);
  await rejects(atomicText(directory, ""), /regular file/);
});

test("Windows sharing failures retry only atomic publication while retaining the old target", async () => {
  const root = await mkdtemp(join(tmpdir(), "teamagent-text-reconcile-"));
  roots.push(root);
  const path = join(root, "report.md");
  await writeFile(path, "Old\n");
  let calls = 0;
  const publishing = atomicText(path, "New\n", {
    rename: async (source, target) => {
      calls += 1;
      expect(await readFile(path, "utf8")).toBe("Old\n");
      if (calls === 1)
        throw Object.assign(new Error("fixture sharing violation"), { code: "EPERM" });
      await rename(source, target);
    },
  });
  if (process.platform === "win32") {
    await publishing;
    expect(calls).toBe(2);
    expect(await readFile(path, "utf8")).toBe("New\n");
  } else {
    await rejects(publishing, /fixture sharing violation/);
    expect(calls).toBe(1);
  }
  await writeFile(path, "Retained\n");
  calls = 0;
  await rejects(
    atomicText(path, "Never published\n", {
      rename: async () => {
        calls += 1;
        throw Object.assign(new Error("persistent fixture sharing violation"), { code: "EPERM" });
      },
    }),
    /persistent fixture sharing violation/,
  );
  expect(calls).toBe(process.platform === "win32" ? 7 : 1);
  expect(await readFile(path, "utf8")).toBe("Retained\n");
  expect(await readdir(root)).toEqual(["report.md"]);
});
async function fixture(secondSource = false, warningCount = 1, failInitialExport = false) {
  const root = await mkdtemp(join(tmpdir(), "teamagent-text-reconcile-"));
  roots.push(root);
  await writeFile(
    join(root, ".urls.md.conf"),
    `source.md ${locator} published=2026-03-11\n${secondSource ? "second.md https://example.com/second\n" : ""}`,
  );
  await writeFile(join(root, ".urls.pdf.conf"), "# PDFs\n");
  let revision = 1;
  let changeOriginal = false;
  let calls = 0;
  const store = await Effect.runPromise(
    openMemory({
      workspaceId: "reconcile-fixture",
      workspaceRoot: root,
      dataDirectory: join(root, "memory"),
      capture: (request) => {
        calls += 1;
        const result: CaptureResult = {
          status: "captured",
          kind: "url",
          locator: request.locator,
          provenance: {
            etag: null,
            lastModified: null,
            repositoryCommit: null,
            parserVersion: `fixture@${revision}`,
            warnings: Array.from({ length: warningCount }, (_, index) =>
              index === 0
                ? "Explicit fixture coverage limitation."
                : `Explicit fixture coverage limitation ${index}.`,
            ),
          },
          files: [
            {
              path: "original/source.html",
              role: "original",
              mediaType: "text/html",
              origin: request.locator,
              bytes: new TextEncoder().encode(sourceText + (changeOriginal ? "changed" : "")),
            },
            {
              path: "converted/document.md",
              role: "markdown",
              mediaType: "text/markdown",
              origin: request.locator,
              bytes: new TextEncoder().encode(
                sourceText + `\nDerived representation ${revision}.\n`,
              ),
            },
          ],
        };
        return Effect.succeed(result);
      },
    }),
  );
  stores.push(store);
  const first = await syncTextResources(
    { root },
    {
      memory: failInitialExport
        ? {
            ...store,
            export: () =>
              Effect.fail(new MemoryError({ code: "storage", message: "Fixture export failure" })),
          }
        : store,
    },
  );
  if (!failInitialExport && first.records.some((record) => record.status === "failed"))
    throw new Error("Initial fixture export failed before reconciliation.");
  const before = first.records[0];
  if (!before?.sourceId || !before.versionId || !before.contentHash)
    throw new Error("Missing fixture pin.");
  async function candidate(changed = false, second = false) {
    revision += 1;
    changeOriginal = changed;
    const selected = second ? first.records[1] : before;
    if (!selected?.sourceId || !selected.versionId || !selected.contentHash)
      throw new Error("Missing selected fixture pin.");
    const imported = await Effect.runPromise(
      store.get({
        locator: second ? "https://example.com/second" : locator,
        kind: "url",
        convert: true,
      }),
    );
    await ensureTextExport(store, imported, join(root, ".cache/text"));
    return {
      name: selected.name,
      sourceId: selected.sourceId,
      expectedVersionId: selected.versionId,
      expectedContentHash: selected.contentHash,
      expectedRecordHash: createHash("sha256").update(JSON.stringify(selected)).digest("hex"),
      candidateVersionId: imported.version.id,
      candidateContentHash: imported.version.contentHash,
      reason: "Reviewed a new local representation from unchanged original bytes.",
    };
  }
  return { root, store, before, candidate, calls: () => calls };
}

test("an export-failed capture returns the exact saved record and supports explicit offline recovery", async () => {
  const f = await fixture(false, 1, true);
  const path = join(f.root, ".cache/text/source-state.json");
  const saved = (await readTextState(path)).records.find((record) => record.key === f.before.key);
  if (!saved || !f.before.sourceId || !f.before.versionId || !f.before.contentHash)
    throw new Error("Missing retained capture identity.");
  expect(f.before.status).toBe("failed");
  expect(f.before.validation).toBe("failed");
  expect(f.before.warnings.join(" ")).toContain("successful capture is retained");
  expect(JSON.stringify(f.before)).toBe(JSON.stringify(saved));
  const hash = (record: typeof f.before) =>
    createHash("sha256").update(JSON.stringify(record)).digest("hex");
  expect(hash(f.before)).toBe(hash(saved));
  const captures = f.calls();
  // Restore the retained immutable version explicitly, without a fresh source capture.
  await Effect.runPromise(
    f.store.export(
      f.before.sourceId,
      join(f.root, ".cache/text/exports", f.before.sourceId, f.before.versionId),
      f.before.versionId,
    ),
  );
  expect(f.calls()).toBe(captures);
  const request = await f.candidate();
  expect(request.expectedRecordHash).toBe(hash(saved));
  const calls = f.calls();
  const adopted = await reconcileTextResource({ root: f.root, request });
  expect(adopted.alreadyApplied).toBe(false);
  expect(adopted.record.versionId).toBe(request.candidateVersionId);
  expect((await reconcileTextResource({ root: f.root, request })).alreadyApplied).toBe(true);
  const recovered = await syncTextResources({ root: f.root }, { memory: f.store });
  expect(recovered.initialOrRefreshImports).toBe(0);
  expect(recovered.records[0]?.status).toBe("pinned");
  expect(recovered.records[0]?.versionId).toBe(request.candidateVersionId);
  expect(f.calls()).toBe(calls);
  expect(JSON.stringify(recovered.records[0])).toBe(
    JSON.stringify((await readTextState(path)).records[0]),
  );
});

test("explicit offline reconciliation retains static dates, exact originals, warnings and retry evidence", async () => {
  const f = await fixture();
  const request = await f.candidate();
  const sourceList = await readFile(join(f.root, ".urls.md.conf"), "utf8");
  const calls = f.calls();
  const result = await reconcileTextResource({ root: f.root, request });
  expect(result.record.versionId).toBe(request.candidateVersionId);
  expect(result.record.mode).toBe("static");
  expect(result.record.checkedAt).toBe(f.before.checkedAt);
  expect(result.record.firstCapturedAt).toBe(f.before.firstCapturedAt);
  expect(result.record.sourcePublishedAt).toBe("2026-03-11");
  expect(result.record.validation).toBe("partial");
  expect(result.record.warnings).toContain("Explicit fixture coverage limitation.");
  expect(result.alreadyApplied).toBe(false);
  expect((await reconcileTextResource({ root: f.root, request })).alreadyApplied).toBe(true);
  expect(f.calls()).toBe(calls);
  expect(await readFile(join(f.root, ".urls.md.conf"), "utf8")).toBe(sourceList);
  const receipt = await readFile(
    join(f.root, "spec/analyses/texts/reconciliations", `${result.id}.json`),
    "utf8",
  );
  expect(receipt).not.toContain("scope=private");
  expect(receipt).toContain(f.before.versionId ?? "");
  const repeated = await syncTextResources({ root: f.root }, { memory: f.store });
  expect(repeated.initialOrRefreshImports).toBe(0);
  expect(repeated.records[0]?.versionId).toBe(request.candidateVersionId);
  await rejects(reconcileTextResource({ root: f.root, request }), /later state/);
});

test("an exact retry preserves the later publication time of another source", async () => {
  const f = await fixture(true);
  const first = await f.candidate();
  const second = await f.candidate(false, true);
  const firstResult = await reconcileTextResource({ root: f.root, request: first });
  await new Promise((resolve) => setTimeout(resolve, 10));
  const secondResult = await reconcileTextResource({ root: f.root, request: second });
  expect(firstResult.record.validatedAt).not.toBe(secondResult.record.validatedAt);
  const path = join(f.root, ".cache/text/source-state.json");
  const beforeRetry = await readFile(path, "utf8");
  expect((await reconcileTextResource({ root: f.root, request: first })).alreadyApplied).toBe(true);
  expect(await readFile(path, "utf8")).toBe(beforeRetry);
});

test("a receipt saved before pin publication cannot roll back another source's later time", async () => {
  const f = await fixture(true);
  const first = await f.candidate();
  const second = await f.candidate(false, true);
  const path = join(f.root, ".cache/text/source-state.json");
  const initial = await readFile(path, "utf8");
  const firstResult = await reconcileTextResource({ root: f.root, request: first });
  // Retain the immutable receipt but restore the old pin to model interrupted state publication.
  await writeFile(path, initial);
  await new Promise((resolve) => setTimeout(resolve, 10));
  const secondResult = await reconcileTextResource({ root: f.root, request: second });
  expect(firstResult.record.validatedAt).not.toBe(secondResult.record.validatedAt);
  const beforeResume = await readTextState(path);
  expect((await reconcileTextResource({ root: f.root, request: first })).alreadyApplied).toBe(
    false,
  );
  const resumed = await readTextState(path);
  expect(resumed.checkedAt).toBe(beforeResume.checkedAt);
  expect(resumed.records.find((record) => record.name === "second.md")).toEqual(
    beforeResume.records.find((record) => record.name === "second.md"),
  );
  expect(resumed.records.find((record) => record.name === "source.md")?.versionId).toBe(
    first.candidateVersionId,
  );
});

test("maximum extraction warnings remain bounded without dropping their provenance", async () => {
  const f = await fixture(false, 256);
  const request = await f.candidate();
  const manifestPath = join(
    f.root,
    ".cache/text/exports",
    request.sourceId,
    request.candidateVersionId,
    "manifest.json",
  );
  const manifest = await readFile(manifestPath, "utf8");
  const result = await reconcileTextResource({ root: f.root, request });
  expect(result.record.validation).toBe("partial");
  expect(result.record.warnings.length).toBe(256);
  expect(
    result.record.warnings.some((warning) =>
      warning.includes("Additional report warnings omitted"),
    ),
  ).toBe(true);
  expect(result.record.warnings.at(-1)).toContain("Explicit local derivative reconciliation");
  expect(await readFile(manifestPath, "utf8")).toBe(manifest);
});

test("rejects tampered saved receipt and conflicting aliases without replacing the applied pin", async () => {
  const f = await fixture();
  const request = await f.candidate();
  await writeFile(join(f.root, ".urls.md.conf"), `source.md ${locator}\nalias.md ${locator}\n`);
  await syncTextResources({ root: f.root }, { memory: f.store });
  await rejects(reconcileTextResource({ root: f.root, request }), /Multiple retained aliases/);
  const clean = await fixture();
  const cleanRequest = await clean.candidate();
  const result = await reconcileTextResource({ root: clean.root, request: cleanRequest });
  const receiptPath = join(clean.root, "spec/analyses/texts/reconciliations", `${result.id}.json`);
  const receipt = await readFile(receiptPath, "utf8");
  await writeFile(receiptPath, receipt.replace('"images": 0', '"images": 99'));
  await rejects(reconcileTextResource({ root: clean.root, request: cleanRequest }), /expected pin/);
  await writeFile(receiptPath, receipt.replace('"status": "updated"', '"status": "pinned"'));
  await rejects(
    reconcileTextResource({ root: clean.root, request: cleanRequest }),
    /verified candidate/,
  );
  expect(
    (await readTextState(join(clean.root, ".cache/text/source-state.json"))).records[0]?.versionId,
  ).toBe(cleanRequest.candidateVersionId);
});

test("rejects altered original bytes, stale pins, private reasons and changed exact locator without state mutation", async () => {
  const f = await fixture();
  const changed = await f.candidate(true);
  const state = await readFile(join(f.root, ".cache/text/source-state.json"), "utf8");
  await rejects(reconcileTextResource({ root: f.root, request: changed }), /original byte/);
  const request = await f.candidate();
  await rejects(
    reconcileTextResource({
      root: f.root,
      request: { ...request, expectedContentHash: "0".repeat(64) },
    }),
    /expected pin/,
  );
  await rejects(
    reconcileTextResource({
      root: f.root,
      request: { ...request, reason: "Read https://example.com/path?token=secret for evidence" },
    }),
    /query-free/,
  );
  for (const scheme of ["HTTPS", "hTtPs", "HTTP"]) {
    await rejects(
      reconcileTextResource({
        root: f.root,
        request: {
          ...request,
          reason: `Read ${scheme}://example.com/path?token=secret for evidence`,
        },
      }),
      /query-free/,
    );
  }
  await writeFile(
    join(f.root, ".urls.md.conf"),
    "source.md https://example.com/article?scope=different\n",
  );
  await rejects(reconcileTextResource({ root: f.root, request }), /identity/);
  expect(await readFile(join(f.root, ".cache/text/source-state.json"), "utf8")).toBe(state);
});

test("rejects combined source-list aliases that collide without regard to case", async () => {
  const f = await fixture();
  const request = await f.candidate();
  await writeFile(join(f.root, ".urls.pdf.conf"), "Source.md https://example.com/second\n");
  await rejects(reconcileTextResource({ root: f.root, request }), /aliases must be unique/);
  expect(
    (await readTextState(join(f.root, ".cache/text/source-state.json"))).records[0]?.versionId,
  ).toBe(f.before.versionId);
});

test("rejects grouped or refresh-enabled sources and corrupted candidate export", async () => {
  const f = await fixture();
  const request = await f.candidate();
  await writeFile(join(f.root, ".urls.md.conf"), `source.md ${locator} refresh=true\n`);
  await rejects(reconcileTextResource({ root: f.root, request }), /static source/);
  await writeFile(
    join(f.root, ".urls.md.conf"),
    `source.md ${locator} https://example.com/second\n`,
  );
  await rejects(reconcileTextResource({ root: f.root, request }), /unambiguous/);
  await writeFile(join(f.root, ".urls.md.conf"), `source.md ${locator}\n`);
  await writeFile(
    join(
      f.root,
      ".cache/text/exports",
      request.sourceId ?? "",
      request.candidateVersionId,
      "files/converted/document.md",
    ),
    "corrupt\n",
  );
  await rejects(reconcileTextResource({ root: f.root, request }), Error);
  expect(
    (await readTextState(join(f.root, ".cache/text/source-state.json"))).records[0]?.versionId,
  ).toBe(f.before.versionId);
});

test("rejects a derivative that omits the retained original", async () => {
  const f = await fixture();
  const request = await f.candidate();
  const manifestPath = join(
    f.root,
    ".cache/text/exports",
    request.sourceId ?? "",
    request.candidateVersionId,
    "manifest.json",
  );
  const manifest = Schema.decodeUnknownSync(Schema.fromJsonString(MemoryExportManifestSchema))(
    await readFile(manifestPath, "utf8"),
  );
  const files = manifest.version.files.map((file) =>
    file.role === "original" ? { ...file, role: "markdown" as const } : file,
  );
  const contentHash = memoryManifestHash(files, manifest.version.provenance);
  await writeFile(
    manifestPath,
    JSON.stringify({ ...manifest, version: { ...manifest.version, files, contentHash } }) + "\n",
  );
  await rejects(
    reconcileTextResource({
      root: f.root,
      request: { ...request, candidateContentHash: contentHash },
    }),
    /original byte/,
  );
  expect(
    (await readTextState(join(f.root, ".cache/text/source-state.json"))).records[0]?.versionId,
  ).toBe(f.before.versionId);
});

test("resumes report-publication failure from the saved receipt without another capture", async () => {
  const f = await fixture();
  const request = await f.candidate();
  const reportPath = join(f.root, "spec/analyses/texts/source.md.report.md");
  const report = await readFile(reportPath);
  await rm(reportPath);
  await mkdir(reportPath);
  const calls = f.calls();
  await rejects(reconcileTextResource({ root: f.root, request }), Error);
  expect(
    (await readTextState(join(f.root, ".cache/text/source-state.json"))).records[0]?.versionId,
  ).toBe(request.candidateVersionId);
  await rm(reportPath, { recursive: true });
  await writeFile(reportPath, report);
  const resumed = await reconcileTextResource({ root: f.root, request });
  expect(resumed.alreadyApplied).toBe(true);
  expect(f.calls()).toBe(calls);
  expect(
    (await readTextState(join(f.root, "spec/analyses/texts/source-state.json"))).records[0]
      ?.versionId,
  ).toBe(request.candidateVersionId);
  await reconcileTextResource({ root: f.root, request });
  const history = await readFile(join(f.root, "spec/analyses/texts/CHANGELOG.md"), "utf8");
  expect(history.split(`<!-- teamagent-text-reconciliation:${resumed.id} -->`).length - 1).toBe(1);
  expect(history).toContain(
    `version ${request.candidateVersionId}; content ${request.candidateContentHash}`,
  );
});

test("rejects unexpected receipt inventory before changing the static ledger", async () => {
  const f = await fixture();
  const request = await f.candidate();
  const directory = join(f.root, "spec/analyses/texts/reconciliations");
  await mkdir(directory);
  await writeFile(join(directory, "foreign.txt"), "Do not delete unrelated evidence.\n");
  await rejects(reconcileTextResource({ root: f.root, request }), /inventory/);
  expect(
    (await readTextState(join(f.root, ".cache/text/source-state.json"))).records[0]?.versionId,
  ).toBe(f.before.versionId);
  expect(await readFile(join(directory, "foreign.txt"), "utf8")).toContain("unrelated evidence");
});
