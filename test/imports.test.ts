import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, readdir, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Effect } from "effect";
import { type CaptureRequest, type CaptureResult, type SourceVersion } from "@/memory";
import { createSourceCapture } from "../app/imports/index.ts";
import { defaultImportPython, importDoctor, parserVersion } from "../app/imports/documents.ts";
import { digest, importLimits } from "../app/imports/limits.ts";
import { networkUrl, publicAddress, retrieveHttp } from "../app/imports/network.ts";
import { runProcess } from "../app/imports/process.ts";
import { processEnvironment } from "../app/imports/process.ts";

let directory = "";
let workspace = "";
let dataDirectory = "";
let temporaryDirectory = "";
const signal = () => AbortSignal.timeout(30_000);
const decoded = (bytes: Uint8Array) => new TextDecoder().decode(bytes);
function request(locator: string, overrides: Partial<CaptureRequest> = {}): CaptureRequest {
  return {
    locator,
    kind: "auto",
    convert: true,
    workspaceRoot: workspace,
    dataDirectory,
    temporaryDirectory,
    ...overrides,
  };
}
function captured(result: CaptureResult) {
  if (result.status !== "captured") throw new Error("Expected captured source");
  return result;
}
function previous(result: Extract<CaptureResult, { status: "captured" }>): SourceVersion {
  return {
    id: "v1",
    sourceId: "s1",
    workspaceId: "w1",
    number: 1,
    contentHash: "a".repeat(64),
    retrievedAt: "2026-10-04T00:00:00.000Z",
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
beforeAll(async () => {
  directory = await realpath(await mkdtemp(join(tmpdir(), "teamagent-import-tests-")));
  workspace = join(directory, "workspace");
  dataDirectory = join(directory, "private");
  temporaryDirectory = join(dataDirectory, "temporary");
  await Promise.all([mkdir(workspace), mkdir(temporaryDirectory, { recursive: true })]);
  const doctor = await Effect.runPromise(importDoctor());
  expect(doctor.available, "Run memory setup before testing document conversion").toBe(true);
  await runProcess(
    defaultImportPython(),
    ["-I", join(import.meta.dir, "import-fixtures.py"), workspace],
    { signal: signal(), bytes: 1_048_576 },
  );
});
afterAll(async () => {
  if (
    directory.startsWith(await realpath(tmpdir())) &&
    directory.includes("teamagent-import-tests-")
  )
    await rm(directory, { recursive: true, force: true });
});

describe("source acquisition and conversion", () => {
  test("preserves original text and binary data with explicit unsupported conversion", async () => {
    await writeFile(join(workspace, "notes.txt"), "Unicode evidence: příliš\n");
    const text = captured(await Effect.runPromise(createSourceCapture()(request("notes.txt"))));
    expect(
      text.files.filter((file) => file.role === "markdown").map((file) => decoded(file.bytes)),
    ).toEqual(["Unicode evidence: příliš\n"]);
    await writeFile(join(workspace, "opaque.bin"), new Uint8Array([0, 255, 1]));
    const binary = captured(await Effect.runPromise(createSourceCapture()(request("opaque.bin"))));
    expect(binary.files).toHaveLength(1);
    expect(binary.provenance.warnings.join(" ")).toContain("Unsupported conversion");
  });

  test.each([
    ["docx", "Document alpha"],
    ["xlsx", "Revenue"],
    ["pptx", "Slide evidence beta"],
    ["pdf", "PDF evidence gamma"],
  ])("converts %s text and extracts embedded images", async (extension, expected) => {
    const result = captured(
      await Effect.runPromise(createSourceCapture()(request(`sample.${extension}`))),
    );
    const markdown = result.files.find((file) => file.role === "markdown");
    expect(markdown, JSON.stringify(result.provenance.warnings)).toBeDefined();
    expect(markdown === undefined ? "" : decoded(markdown.bytes)).toContain(expected);
    expect(result.files.some((file) => file.role === "image")).toBe(true);
    expect(result.files[0]?.bytes).toEqual(
      new Uint8Array(await readFile(join(workspace, `sample.${extension}`))),
    );
  });

  test("PDF conversion preserves positioned words, column text and physical pages without guessed tables", async () => {
    const result = captured(
      await Effect.runPromise(createSourceCapture()(request("positioned.pdf"))),
    );
    const markdown = result.files.find((file) => file.role === "markdown");
    expect(markdown).toBeDefined();
    const text = markdown === undefined ? "" : decoded(markdown.bytes);
    const normalized = text.replace(/\s+/g, " ");
    expect(normalized).toContain("Careful reviews reduce regressions.");
    expect(normalized).toContain("Reliable tests protect behavior.");
    expect(normalized).toContain("Readable guides explain decisions.");
    expect(normalized).toContain("Left column first sentence. Left column second sentence.");
    expect(normalized).toContain("Right column first sentence. Right column second sentence.");
    expect(normalized).toContain("Requests 42 operations");
    expect(normalized).toContain("Duration 17 milliseconds");
    expect(text).not.toContain("| ---");
    expect(text.match(/^## PDF page \d+$/gm)).toEqual([
      "## PDF page 1",
      "## PDF page 2",
      "## PDF page 3",
    ]);
    expect(text.indexOf("Left column second sentence.")).toBeLessThan(
      text.indexOf("Right column first sentence."),
    );
    expect(text.indexOf("## PDF page 2")).toBeLessThan(text.indexOf("Recorded measurements"));
    expect(result.provenance.warnings.join(" ")).toContain(
      "PDF pages without extractable text (OCR is not enabled): 3",
    );
    expect(result.provenance.warnings.join(" ")).toContain("table layout, equations");
    expect(result.provenance.parserVersion).toBe(parserVersion);
  });

  test("retains unsafe archive original without extracting traversal members", async () => {
    const result = captured(await Effect.runPromise(createSourceCapture()(request("unsafe.docx"))));
    expect(result.files).toHaveLength(1);
    expect(result.provenance.warnings.join(" ")).toContain("Conversion failed");
  });

  test("missing converter is explicit and original survives", async () => {
    const result = captured(
      await Effect.runPromise(
        createSourceCapture({ python: join(directory, "missing-python") })(request("sample.pdf")),
      ),
    );
    expect(result.files).toHaveLength(1);
    expect(result.provenance.warnings.join(" ")).toContain("memory doctor");
    expect(
      (await Effect.runPromise(importDoctor({ python: join(directory, "missing-python") })))
        .available,
    ).toBe(false);
  });

  test("folders retain exclusions and reject private roots, root escape and oversized files", async () => {
    const folder = join(workspace, "folder");
    await mkdir(folder);
    await writeFile(join(folder, "ok.md"), "Folder evidence");
    await writeFile(join(folder, ".env"), "TOKEN=private");
    const result = captured(await Effect.runPromise(createSourceCapture()(request(folder))));
    expect(result.files.some((file) => file.path.includes(".env"))).toBe(false);
    expect(result.provenance.warnings.join(" ")).toContain("Excluded source entry");
    await assert.rejects(Effect.runPromise(createSourceCapture()(request(dataDirectory))));
    await assert.rejects(
      Effect.runPromise(createSourceCapture({ allowedRoots: [folder] })(request("notes.txt"))),
    );
    await writeFile(join(folder, "large.bin"), Buffer.alloc(importLimits.fileBytes + 1));
    await assert.rejects(
      Effect.runPromise(createSourceCapture()(request(join(folder, "large.bin")))),
    );
  });

  test("local HTML converts safe text and imports contained images", async () => {
    await writeFile(
      join(workspace, "page.html"),
      '<html><body><h1>Local article</h1><script>secret()</script><img src="pixel.png" alt="pixel"></body></html>',
    );
    const result = captured(await Effect.runPromise(createSourceCapture()(request("page.html"))));
    const markdown = result.files.find((file) => file.role === "markdown");
    expect(markdown === undefined ? "" : decoded(markdown.bytes)).toContain("Local article");
    expect(markdown === undefined ? "" : decoded(markdown.bytes)).not.toContain("secret()");
    expect(result.files.some((file) => file.role === "image")).toBe(true);
  });

  test("Markdown image references become durable sibling assets", async () => {
    await writeFile(
      join(workspace, "illustrated.md"),
      "# Markdown evidence\n\n![pixel][picture]\n\n[picture]: pixel.png\n",
    );
    const result = captured(
      await Effect.runPromise(createSourceCapture()(request("illustrated.md"))),
    );
    const markdown = result.files.find((file) => file.role === "markdown");
    expect(markdown === undefined ? "" : decoded(markdown.bytes)).toContain("assets/");
    expect(result.files.some((file) => file.role === "image")).toBe(true);
  });

  test("sync refuses to replace successful derivatives after converter failure", async () => {
    const first = captured(await Effect.runPromise(createSourceCapture()(request("sample.pdf"))));
    await assert.rejects(
      Effect.runPromise(
        createSourceCapture({ python: join(directory, "absent") })(
          request("sample.pdf", { previous: previous(first) }),
        ),
      ),
      { code: "unsupported" },
    );
  });

  test("HTTP revalidates plain files and refreshes page assets despite unchanged parent", async () => {
    let imageRevision = 1;
    let imageFailure = false;
    let target = "article.html";
    let conditionalRequests = 0;
    const pixel = new Uint8Array(await readFile(join(workspace, "pixel.png")));
    const server = Bun.serve({
      hostname: "127.0.0.1",
      port: 0,
      fetch(req): Response {
        const path = new URL(req.url).pathname;
        if (path === "/plain.txt") {
          if (req.headers.get("if-none-match") === '"stable"') {
            conditionalRequests += 1;
            return new Response(null, { status: 304, headers: { etag: '"stable"' } });
          }
          return new Response("Remote source", {
            headers: { etag: '"stable"', "content-type": "text/plain" },
          });
        }
        if (path === "/image.png")
          return imageFailure
            ? new Response("Unavailable", { status: 503 })
            : new Response(Buffer.concat([pixel, new Uint8Array([imageRevision])]), {
                headers: { "content-type": "image/png" },
              });
        if (path === "/redirect") return Response.redirect(`${server.url.href}${target}`);
        if (path === "/updated.html")
          return new Response(
            '<html><body><h1>New redirect target</h1><img src="image.png"></body></html>',
            { headers: { "content-type": "text/html" } },
          );
        return new Response(
          '<html><body><h1>Remote article</h1><img src="image.png"></body></html>',
          { headers: { etag: '"page-stable"', "content-type": "text/html" } },
        );
      },
    });
    try {
      const capture = createSourceCapture({ allowPrivateNetwork: true });
      const initial = captured(
        await Effect.runPromise(
          capture(request(`${server.url.href}plain.txt`, { convert: false })),
        ),
      );
      const checked = await Effect.runPromise(
        capture(
          request(`${server.url.href}plain.txt`, { convert: false, previous: previous(initial) }),
        ),
      );
      expect(checked.status).toBe("unchanged");
      expect(conditionalRequests).toBe(1);
      const page = captured(
        await Effect.runPromise(capture(request(`${server.url.href}redirect`))),
      );
      imageRevision = 2;
      const refreshed = captured(
        await Effect.runPromise(
          capture(request(`${server.url.href}redirect`, { previous: previous(page) })),
        ),
      );
      const firstImage = page.files.find((file) => file.role === "image");
      const secondImage = refreshed.files.find((file) => file.role === "image");
      expect(firstImage).toBeDefined();
      expect(secondImage).toBeDefined();
      expect(firstImage?.bytes).not.toEqual(secondImage?.bytes);
      target = "updated.html";
      const redirected = captured(
        await Effect.runPromise(capture(request(page.locator, { previous: previous(refreshed) }))),
      );
      expect(redirected.locator).toBe(`${server.url.href}redirect`);
      expect(
        redirected.files.some(
          (file) => file.role === "markdown" && decoded(file.bytes).includes("New redirect target"),
        ),
      ).toBe(true);
      imageFailure = true;
      await assert.rejects(
        Effect.runPromise(capture(request(page.locator, { previous: previous(redirected) }))),
        { code: "network" },
      );
      await assert.rejects(
        Effect.runPromise(createSourceCapture()(request(`${server.url.href}plain.txt`))),
      );
    } finally {
      await server.stop(true);
    }
  });

  test("extensionless document downloads use validated media types", async () => {
    const bytes = await readFile(join(workspace, "sample.docx"));
    const server = Bun.serve({
      hostname: "127.0.0.1",
      port: 0,
      fetch: () =>
        new Response(bytes, {
          headers: {
            "content-type":
              "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          },
        }),
    });
    try {
      const result = captured(
        await Effect.runPromise(
          createSourceCapture({ allowPrivateNetwork: true })(request(`${server.url.href}download`)),
        ),
      );
      expect(
        result.files.some(
          (file) => file.role === "markdown" && decoded(file.bytes).includes("Document alpha"),
        ),
      ).toBe(true);
    } finally {
      await server.stop(true);
    }
  });

  test("cancellation waits for source cleanup and leaves no temporary conversion input", async () => {
    let started: (() => void) | undefined;
    const start = new Promise<void>((resolve) => {
      started = resolve;
    });
    const server = Bun.serve({
      hostname: "127.0.0.1",
      port: 0,
      fetch: () => {
        started?.();
        return new Response(
          new ReadableStream<Uint8Array>({
            start(controller) {
              controller.enqueue(new TextEncoder().encode("partial"));
            },
          }),
        );
      },
    });
    const cancel = new AbortController();
    try {
      const task = Effect.runPromise(
        createSourceCapture({ allowPrivateNetwork: true })(request(`${server.url.href}wait`)),
        { signal: cancel.signal },
      );
      await start;
      cancel.abort();
      await assert.rejects(task);
      expect(await readdir(temporaryDirectory)).toEqual([]);
    } finally {
      await server.stop(true);
    }
  });

  test("network policy rejects credentials, private/mapped addresses and cancellation", async () => {
    expect(() => networkUrl("https://user:secret@example.org/file")).toThrow();
    for (const address of [
      "127.0.0.1",
      "10.1.2.3",
      "192.168.1.2",
      "169.254.169.254",
      "::1",
      "::ffff:127.0.0.1",
      "fc00::1",
      "2001:db8::1",
    ])
      expect(publicAddress(address)).toBe(false);
    for (const address of ["1.1.1.1", "8.8.8.8", "2606:4700:4700::1111", "2001:4860:4860::8888"])
      expect(publicAddress(address)).toBe(true);
    const cancelled = new AbortController();
    cancelled.abort();
    await assert.rejects(retrieveHttp("https://example.org", { signal: cancelled.signal }));
  });

  test("local Git captures committed snapshots and excludes secrets without invoking hooks", async () => {
    const repo = join(workspace, "repo");
    await mkdir(repo);
    await runProcess("git", ["init", repo], { signal: signal() });
    await writeFile(join(repo, "readme.md"), "Committed evidence one");
    await writeFile(join(repo, ".env"), "SECRET=private");
    await writeFile(
      join(repo, "page.html"),
      '<html><body><h1>Git page</h1><img src="pixel.png"></body></html>',
    );
    const committedPixel = await readFile(join(workspace, "pixel.png"));
    await writeFile(join(repo, "pixel.png"), committedPixel);
    await runProcess(
      "git",
      ["-C", repo, "add", "--force", "--", "readme.md", ".env", "page.html", "pixel.png"],
      { signal: signal() },
    );
    await runProcess(
      "git",
      [
        "-C",
        repo,
        "-c",
        "user.name=Fixture",
        "-c",
        "user.email=fixture@example.invalid",
        "-c",
        "core.hooksPath=",
        "-c",
        "commit.gpgsign=false",
        "commit",
        "-m",
        "fixture",
      ],
      { signal: signal() },
    );
    const initial = captured(await Effect.runPromise(createSourceCapture()(request(repo))));
    expect(initial.kind).toBe("git");
    expect(initial.provenance.repositoryCommit).toMatch(/^[a-f0-9]{40,64}$/);
    expect(initial.files.some((file) => file.path.includes(".env"))).toBe(false);
    await writeFile(join(repo, "readme.md"), "Uncommitted changed content");
    await writeFile(join(repo, "pixel.png"), "Uncommitted image replacement");
    const next = captured(await Effect.runPromise(createSourceCapture()(request(repo))));
    expect(next.files).toEqual(initial.files);
    expect(next.provenance.warnings.join(" ")).toContain("uncommitted");
    expect(
      next.files.some(
        (file) => file.role === "image" && digest(file.bytes) === digest(committedPixel),
      ),
    ).toBe(true);

    const server = Bun.serve({
      hostname: "127.0.0.1",
      port: 0,
      async fetch(req): Promise<Response> {
        const url = new URL(req.url);
        const child = Bun.spawn(["git", "http-backend"], {
          env: {
            ...processEnvironment(),
            GIT_CONFIG_NOSYSTEM: "1",
            GIT_CONFIG_GLOBAL: join(directory, "absent-gitconfig"),
            GIT_PROJECT_ROOT: workspace,
            GIT_HTTP_EXPORT_ALL: "1",
            PATH_INFO: url.pathname,
            QUERY_STRING: url.search.slice(1),
            REQUEST_METHOD: req.method,
            CONTENT_TYPE: req.headers.get("content-type") ?? "",
            REMOTE_ADDR: "127.0.0.1",
          },
          stdin: new Uint8Array(await req.arrayBuffer()),
          stdout: "pipe",
          stderr: "ignore",
        });
        const output = new Uint8Array(await new Response(child.stdout).arrayBuffer());
        await child.exited;
        const split = Buffer.from(output).indexOf("\r\n\r\n");
        if (split < 0) return new Response("Git fixture failed", { status: 500 });
        const headers = new Headers();
        let status = 200;
        for (const line of decoded(output.subarray(0, split)).split("\r\n")) {
          const colon = line.indexOf(":");
          if (colon < 0) continue;
          const name = line.slice(0, colon);
          const value = line.slice(colon + 1).trim();
          if (name.toLowerCase() === "status") status = Number(value.slice(0, 3));
          else headers.set(name, value);
        }
        return new Response(output.subarray(split + 4), { headers, status });
      },
    });
    try {
      const remote = captured(
        await Effect.runPromise(
          createSourceCapture({ allowPrivateNetwork: true })(
            request(`${server.url.href}repo/.git`, { kind: "git" }),
          ),
        ),
      );
      expect(remote.provenance.repositoryCommit).toBe(initial.provenance.repositoryCommit);
      expect(remote.files.find((file) => file.path === "original/readme.md")?.bytes).toEqual(
        initial.files.find((file) => file.path === "original/readme.md")?.bytes,
      );
    } finally {
      await server.stop(true);
    }
  });
});
