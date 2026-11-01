import { assertTemporaryFixture, mkdtemp } from "./temporary.ts";
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import assert from "node:assert/strict";
import { mkdir, readFile, readdir, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Effect, Schema } from "effect";
import { ExtractorConfigSchema, type ExternalExtractorProfile } from "@/memory";
import { convertDocument, parserVersion } from "../app/imports/documents.ts";
import {
  extractorProfileIdentity,
  inspectExtractorProfile,
  loadExtractorConfig,
  resolveExtractorProfile,
} from "../app/imports/extractors.ts";
import { digest } from "../app/imports/limits.ts";
import { createSourceCapture } from "../app/imports/index.ts";

let directory = "";
let staging = "";
let script = "";
const pixelPng =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=";
const secondPixelPng =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==";
const worker = String.raw`
import { mkdir, writeFile, symlink } from "node:fs/promises";
import { join } from "node:path";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
const [mode, input, output, literal] = process.argv.slice(2);
const image = Buffer.from("${pixelPng}", "base64");
const secondImage = Buffer.from("${secondPixelPng}", "base64");
if (mode !== "--version" && process.env.EXTRACTOR_EXPECT_EXTENSION && !input.endsWith(process.env.EXTRACTOR_EXPECT_EXTENSION)) throw new Error("Unexpected staged input extension");
if (mode === "--version") {
  process.stdout.write("fixture 1.0.0\n");
} else if (mode === "wait") {
  await new Promise(resolve => setTimeout(resolve, 10000));
} else if (mode === "spawn-child") {
  const child = spawn(process.execPath, [process.argv[1], "wait"], { stdio: "ignore", windowsHide: true });
  await writeFile(process.env.EXTRACTOR_CHILD_PID, String(child.pid));
  await new Promise(resolve => setTimeout(resolve, 10000));
} else if (mode === "failure") {
  process.stderr.write("SENSITIVE_WORKER_DETAILS");
  process.exitCode = 4;
} else if (mode === "stdout") {
  process.stdout.write("# Standard output document\nPříliš\n");
} else if (mode === "layout-root") {
  await mkdir(join(output, "images"), { recursive: true });
  await writeFile(join(output, "images", "a.png"), image);
  await writeFile(join(output, "document.md"), '![direct](images/a.png)\n![reference][asset]\n[asset]: images/a.png\n<img src="images/a.png">\n');
} else if (mode === "layout-nested") {
  await mkdir(join(output, "nested"), { recursive: true });
  await writeFile(join(output, "nested", "a.png"), image);
  await writeFile(join(output, "nested", "document.md"), '![sibling](a.png)\n![fallback](nested/a.png)\n');
} else if (mode === "layout-conflict") {
  await mkdir(join(output, "nested", "assets"), { recursive: true });
  const originalAssetName = createHash("sha256").update(image).digest("hex") + ".png";
  await writeFile(join(output, "a.png"), image);
  await writeFile(join(output, "nested", "a.png"), secondImage);
  await writeFile(join(output, "nested", "assets", originalAssetName), secondImage);
  await writeFile(join(output, "nested", "document.md"), '![sibling](a.png)\n![root](../a.png)\n![fallback](nested/a.png)\n![explicit](assets/' + originalAssetName + ')\n');
} else if (mode === "layout-file-urls") {
  await mkdir(join(output, "images"), { recursive: true });
  const imagePath = join(output, "images", "image one č%#.png");
  await writeFile(imagePath, image);
  const url = pathToFileURL(imagePath).href;
  const outsidePath = join(output, "..", "outside.png");
  await writeFile(outsidePath, secondImage);
  await writeFile(join(output, "document.md"), '![file](' + url + ')\n![angle](<' + url + '>)\n![reference][asset]\n[asset]: ' + url + '\n<img src="' + url + '">\n![outside](' + pathToFileURL(outsidePath).href + ')\n![network-file](file://unreachable.invalid/share/a.png)\n![remote](https://example.test/a.png)\n');
} else {
  await mkdir(join(output, "nested"), { recursive: true });
  if (mode === "unsafe") {
    await symlink(process.env.EXTRACTOR_OUTSIDE, join(output, "escape"), "junction");
  }
  if (mode === "oversized") {
    await writeFile(join(output, "large.json"), Buffer.alloc(16777217));
  }
  await writeFile(join(output, "image one.png"), image);
  let markdown = "# Extracted evidence\n![figure](../image%20one.png)\n![reference][chart]\n[chart]: ../image%20one.png\n" + (literal ?? "") + "\n" + (process.env.EXTRACTOR_OPTION ?? "");
  if (mode === "remote") markdown += "\n![remote](https://example.test/never-fetch.png)";
  await writeFile(join(output, "nested", "document.md"), mode === "invalid-utf8" ? Buffer.from([255]) : markdown);
  if (mode === "ambiguous") await writeFile(join(output, "extra.md"), "Ambiguous");
  if (mode === "sidecar") await writeFile(join(output, "unsafe.svg"), "<svg onload='bad()' />");
}
`;
function profile(
  mode = "normal",
  overrides: Partial<ExternalExtractorProfile> = {},
): ExternalExtractorProfile {
  return {
    id: "fixture",
    engine: "xberg",
    version: "1.0.0",
    command: process.execPath,
    args: [script, mode, "{input}", "{outputDir}"],
    versionArgs: [script, "--version"],
    ...overrides,
  };
}
const convert = (extractor: ExternalExtractorProfile, signal = AbortSignal.timeout(10_000)) =>
  convertDocument({
    bytes: new TextEncoder().encode("%PDF-1.7 fixture"),
    name: "source.pdf",
    mediaType: "application/pdf",
    origin: "file:///source.pdf",
    directory: staging,
    signal,
    extractor,
  });
beforeAll(async () => {
  directory = await realpath(await mkdtemp(join(tmpdir(), "teamagent-extractor-tests-")));
  staging = join(directory, "staging");
  await mkdir(staging);
  script = join(directory, "extractor.mjs");
  await writeFile(script, worker);
});
afterAll(async () => {
  await assertTemporaryFixture(directory);
  await rm(directory, { recursive: true, force: true });
});

describe("external document extractor boundary", () => {
  test("preserves root Markdown with nested image assets", async () => {
    const result = await convert(profile("layout-root"));
    const asset = `assets/${digest(Buffer.from(pixelPng, "base64"))}.png`;
    expect(result.markdown).toBe(
      `![direct](${asset})\n![reference][asset]\n[asset]: ${asset}\n<img src="${asset}">\n`,
    );
    expect(result.images).toHaveLength(1);
  });

  test("preserves nested Markdown with sibling images and output-root fallback", async () => {
    const result = await convert(profile("layout-nested"));
    const asset = `assets/${digest(Buffer.from(pixelPng, "base64"))}.png`;
    expect(result.markdown).toBe(`![sibling](${asset})\n![fallback](${asset})\n`);
    expect(result.images).toHaveLength(1);
  });

  test("prefers Markdown-relative images over same-basename root images without replacement cascades", async () => {
    const result = await convert(profile("layout-conflict"));
    const rootAsset = `assets/${digest(Buffer.from(pixelPng, "base64"))}.png`;
    const nestedAsset = `assets/${digest(Buffer.from(secondPixelPng, "base64"))}.png`;
    expect(result.markdown).toBe(
      `![sibling](${nestedAsset})\n![root](${rootAsset})\n![fallback](${nestedAsset})\n![explicit](${nestedAsset})\n`,
    );
    expect(result.images).toHaveLength(2);
  });

  test("rebases encoded local file URLs including Windows paths only for validated output assets", async () => {
    const result = await convert(profile("layout-file-urls"));
    const asset = `assets/${digest(Buffer.from(pixelPng, "base64"))}.png`;
    expect(result.markdown).toContain(`![file](${asset})\n![angle](<${asset}>)`);
    expect(result.markdown).toContain(`[asset]: ${asset}\n<img src="${asset}">`);
    expect(result.markdown).toMatch(/!\[outside\]\(file:\/\/\/[^\r\n]+\/outside\.png\)/);
    expect(result.markdown).toContain("![network-file](file://unreachable.invalid/share/a.png)");
    expect(result.markdown).toContain("![remote](https://example.test/a.png)");
    expect(result.markdown).not.toContain("image%20one");
    expect(result.images).toHaveLength(1);
    expect(result.links).toEqual([]);
    expect(await readdir(staging)).toEqual([]);
  });

  test("uses MIME extensions for extensionless EPUB and raster inputs in literal argv", async () => {
    for (const [mediaType, extension] of [
      ["application/epub+zip", ".epub"],
      ["image/png", ".png"],
    ]) {
      if (mediaType === undefined || extension === undefined)
        throw new Error("Invalid fixture format");
      const result = await convertDocument({
        bytes: new Uint8Array([80, 75, 3, 4]),
        name: "download",
        mediaType,
        origin: "https://example.test/download",
        directory: staging,
        signal: AbortSignal.timeout(10_000),
        extractor: profile("normal", {
          mediaTypes: [mediaType],
          env: { EXTRACTOR_EXPECT_EXTENSION: extension },
        }),
      });
      expect(result.markdown).toContain("Extracted evidence");
    }
  });
  test("loads only explicit trusted config, validates named options and resolves executable paths", async () => {
    await writeFile(
      join(directory, "teamagent-extractors.config.ts"),
      'throw new Error("Ambient discovery executed");',
    );
    const config = {
      version: 1,
      defaultProfile: "fixture",
      profiles: [
        profile("normal", { command: "./tools/extract", versionCommand: "./tools/python" }),
      ],
    };
    const path = join(directory, "selected.json");
    await writeFile(path, JSON.stringify(config));
    const loaded = await Effect.runPromise(loadExtractorConfig(path));
    const selected = await Effect.runPromise(resolveExtractorProfile(loaded));
    expect(selected.engine).toBe("xberg");
    if (selected.engine !== "builtin") {
      expect(selected.command).toBe(join(directory, "tools", "extract"));
      expect(selected.versionCommand).toBe(join(directory, "tools", "python"));
    }
    await assert.rejects(Effect.runPromise(resolveExtractorProfile(loaded, "missing")));
    for (const invalid of [
      { ...config, profiles: [profile(), profile()] },
      { ...config, defaultProfile: "missing" },
      { ...config, profiles: [profile("normal", { outputMarkdown: "../escape.md" })] },
      {
        ...config,
        profiles: [profile("normal", { args: ["{input}", "{outputDir}", "{unknown}"] })],
      },
      { ...config, profiles: [profile("normal", { env: { "BAD=NAME": "value" } })] },
      { ...config, $env: { production: config } },
      { ...config, extends: "github:untrusted/repository" },
    ]) {
      await writeFile(path, JSON.stringify(invalid));
      await assert.rejects(Effect.runPromise(loadExtractorConfig(path)));
    }
  });

  test("uses literal argv, retains Markdown and hashed raster assets, and cleans staging", async () => {
    const literal = 'spaces ; $(not-a-shell) "quotes" {"structured":"options"}';
    const selected = profile("normal", {
      args: [script, "normal", "{input}", "{outputDir}", literal],
      env: { EXTRACTOR_OPTION: "fast mode" },
    });
    const result = await convert(selected);
    expect(result.markdown).toContain(literal);
    expect(result.markdown).toContain("fast mode");
    expect(result.images).toHaveLength(1);
    expect(result.markdown.match(/assets\/[a-f0-9]{64}\.png/g)).toHaveLength(2);
    expect(result.images[0]?.mediaType).toBe("image/png");
    expect(result.parserVersion).toBe(extractorProfileIdentity(selected));
    expect(result.links).toEqual([]);
    expect(await readdir(staging)).toEqual([]);
  });

  test("supports stdout Markdown and explicit selection from multiple outputs", async () => {
    const result = await convert(
      profile("stdout", { outputMode: "stdout", args: [script, "stdout", "{input}"] }),
    );
    expect(result.markdown).toContain("Standard output document");
    expect(result.markdown).toContain("Příliš");
    const selected = await convert(profile("ambiguous", { outputMarkdown: "nested/document.md" }));
    expect(selected.markdown).toContain("Extracted evidence");
    expect(selected.warnings.join(" ")).toContain("sidecar files");
  });

  test("verifies version identity and hashes distinct options without exposing environment values", async () => {
    const selected = profile();
    const inspected = await Effect.runPromise(inspectExtractorProfile(selected));
    expect(inspected.available).toBe(true);
    expect(inspected.observedVersion).toBe("1.0.0");
    expect(inspected.verified).toBe(true);
    const wrong = profile("normal", { version: "2.0.0" });
    expect((await Effect.runPromise(inspectExtractorProfile(wrong))).available).toBe(false);
    await assert.rejects(convert(wrong));
    expect(extractorProfileIdentity(selected)).not.toBe(
      extractorProfileIdentity(profile("normal", { env: { PRIVATE_KEY: "do-not-log" } })),
    );
    expect(
      extractorProfileIdentity(profile("normal", { env: { PRIVATE_KEY: "do-not-log" } })),
    ).not.toContain("do-not-log");
    expect(extractorProfileIdentity({ id: "pypdf", engine: "builtin" })).toBe(parserVersion);
    expect(() =>
      Schema.decodeUnknownSync(ExtractorConfigSchema)({
        version: 1,
        defaultProfile: "bad",
        profiles: [profile("normal", { timeoutMs: 1_800_001 })],
      }),
    ).toThrow();
  });

  test("rejects failures, unsafe paths, invalid UTF-8, output limits and ambiguous Markdown without fallback", async () => {
    for (const mode of ["failure", "invalid-utf8", "oversized", "ambiguous", "unsafe"]) {
      await assert.rejects(
        convert(profile(mode, { env: { EXTRACTOR_OUTSIDE: directory } })),
        (error: unknown) => {
          expect(error).toMatchObject({ code: "unsupported" });
          expect(String(error)).not.toContain("SENSITIVE_WORKER_DETAILS");
          return true;
        },
      );
      expect(await readdir(staging)).toEqual([]);
    }
  });

  test("timeout and cancellation clean staging, remote images and executable sidecars stay unimported", async () => {
    await assert.rejects(convert(profile("wait", { timeoutMs: 100 })), (error: unknown) => {
      expect(error).toMatchObject({
        code: "cancelled",
        message: "Selected external extractor timed out; no fallback was used.",
      });
      return true;
    });
    await assert.rejects(convert(profile("wait"), AbortSignal.timeout(100)), (error: unknown) => {
      expect(error).toMatchObject({ code: "cancelled" });
      return true;
    });
    expect(await readdir(staging)).toEqual([]);
    const remote = await convert(profile("remote"));
    expect(remote.links).toEqual([]);
    expect(remote.warnings.join(" ")).toContain("not fetched");
    const sidecar = await convert(profile("sidecar"));
    expect(sidecar.images).toHaveLength(1);
    expect(sidecar.warnings.join(" ")).toContain("sidecar files");
  });

  test("cancellation terminates a spawned worker child before deleting its staging tree", async () => {
    const pidFile = join(directory, "child.pid");
    const controller = new AbortController();
    const operation = convert(
      profile("spawn-child", { env: { EXTRACTOR_CHILD_PID: pidFile } }),
      controller.signal,
    );
    let childPid: number | undefined;
    try {
      for (let attempt = 0; attempt < 100; attempt++) {
        try {
          const dynamic: unknown = Number(await readFile(pidFile, "utf8"));
          childPid = Schema.decodeUnknownSync(Schema.Int.check(Schema.isGreaterThan(0)))(dynamic);
          break;
        } catch {
          await Bun.sleep(20);
        }
      }
      expect(childPid).toBeDefined();
    } finally {
      controller.abort();
      await assert.rejects(operation);
    }
    if (childPid === undefined) throw new Error("Fixture child was not started");
    expect(() => process.kill(childPid, 0)).toThrow();
    expect(await readdir(staging)).toEqual([]);
  });

  test("capture honors explicitly configured EPUB, text and raster inputs before default handlers", async () => {
    const workspace = join(directory, "workspace");
    const privateData = join(directory, "private");
    const temporary = join(privateData, "temporary");
    await mkdir(workspace, { recursive: true });
    await mkdir(temporary, { recursive: true });
    const mediaTypes = ["application/epub+zip", "text/plain", "image/png"];
    const selected = profile("normal", { mediaTypes });
    for (const source of [
      { name: "manual.epub", bytes: new Uint8Array([80, 75, 3, 4]) },
      { name: "notes.txt", bytes: new TextEncoder().encode("Original text") },
      { name: "scan.png", bytes: new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]) },
    ]) {
      const locator = join(workspace, source.name);
      await writeFile(locator, source.bytes);
      const request = {
        locator,
        kind: "file",
        convert: true,
        workspaceRoot: workspace,
        temporaryDirectory: temporary,
        dataDirectory: privateData,
      } as const;
      const result = await Effect.runPromise(createSourceCapture({ extractor: selected })(request));
      expect(result.status).toBe("captured");
      if (result.status !== "captured") throw new Error("Expected capture");
      expect(result.files.find((file) => file.role === "original")?.bytes).toEqual(source.bytes);
      expect(
        new TextDecoder().decode(result.files.find((file) => file.role === "markdown")?.bytes),
      ).toContain("Extracted evidence");
      expect(result.provenance.extraction?.parsers).toEqual([extractorProfileIdentity(selected)]);
      const raw = await Effect.runPromise(
        createSourceCapture({ extractor: profile("failure", { mediaTypes }) })({
          ...request,
          convert: false,
        }),
      );
      expect(raw.status).toBe("captured");
      if (raw.status !== "captured") throw new Error("Expected raw capture");
      expect(raw.files).toHaveLength(1);
    }
    const defaultResult = await Effect.runPromise(
      createSourceCapture({ extractor: profile("failure") })({
        locator: join(workspace, "notes.txt"),
        kind: "file",
        convert: true,
        workspaceRoot: workspace,
        temporaryDirectory: temporary,
        dataDirectory: privateData,
      }),
    );
    if (defaultResult.status !== "captured") throw new Error("Expected default capture");
    expect(
      new TextDecoder().decode(defaultResult.files.find((file) => file.role === "markdown")?.bytes),
    ).toBe("Original text");
  });
});
