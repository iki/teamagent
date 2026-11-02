import { assertTemporaryFixtureSync, mkdtempSync } from "./temporary.ts";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, rmSync, symlinkSync, truncateSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import {
  inspectLineEndings,
  lineEndingBinaryExtensions,
  lineEndingPaths,
} from "../app/check/line-endings.ts";

function fixture(run: (root: string) => void): void {
  const root = mkdtempSync(join(tmpdir(), "teamagent-lf-"));
  const target = resolve(root);
  try {
    run(root);
  } finally {
    assertTemporaryFixtureSync(target);
    rmSync(target, { recursive: true, force: true });
  }
}

function write(root: string, path: string, content: string | Uint8Array): void {
  mkdirSync(dirname(join(root, path)), { recursive: true });
  writeFileSync(join(root, path), content);
}

function manifest(root: string, path: string, sha256: string): void {
  write(
    root,
    "spec/analyses/line-endings.json",
    JSON.stringify({ retainedOriginals: [{ path, sha256 }] }),
  );
}

function declareOpaque(root: string, path: string, bytes: Uint8Array) {
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  const originalPath = `.cache/line-endings/originals/${sha256}.bin`;
  const declaration = { path, sha256, originalPath, reason: "Historical binary fixture" };
  const record = {
    retainedOriginals: [{ path: originalPath, sha256 }],
    opaqueInputs: [declaration],
  };
  write(root, path, bytes);
  write(root, originalPath, bytes);
  write(root, ".cache/line-endings/migrations/current.json", JSON.stringify(record));
  return { record, declaration, originalPath };
}

await test("LF inspection catches CRLF and lone CR without changing text or escaped control fixtures", () => {
  fixture((root) => {
    const paths = [
      "app/lf.ts",
      "spec/report.md",
      ".cache/review-2026-10-27/result.json",
      "custom-extension",
      "test/escaped.ts",
    ];
    const values = [
      "first\nsecond\n",
      "first\r\nsecond\r\n",
      "first\rsecond",
      "line\r\n",
      'const value = "\\r\\n";\n',
    ];
    paths.forEach((path, index) => write(root, path, values[index] ?? ""));
    const result = inspectLineEndings(root, paths);
    assert.equal(result.textFiles, 5);
    assert.equal(result.violations.length, 3);
    for (const path of paths.slice(1, 4))
      assert.ok(result.violations.some((item) => item.includes(path)));
    paths.forEach((path, index) =>
      assert.equal(readFileSync(join(root, path), "utf8"), values[index]),
    );
  });
});

await test("only a manifest-bound unchanged original can retain CRLF history bytes", () => {
  fixture((root) => {
    const content = "Historical evidence\r\n";
    const hash = createHash("sha256").update(content).digest("hex");
    const original = `spec/analyses/history/source/${hash}.txt`;
    const variant = "spec/analyses/history/source/lf.txt";
    write(root, original, content);
    write(root, variant, "Historical evidence\n");
    assert.equal(inspectLineEndings(root, [original, variant]).violations.length, 1);
    manifest(root, original, hash);
    assert.equal(inspectLineEndings(root, [original, variant]).violations.length, 0);
    assert.equal(inspectLineEndings(root, [variant]).retainedOriginals, 1);
    write(root, original, "Changed evidence\r\n");
    assert.throws(() => inspectLineEndings(root, [original, variant]), /hash mismatch/u);
    manifest(root, "spec/projects/active.md", hash);
    assert.throws(() => inspectLineEndings(root, []), /allowed hash-addressed original/u);
  });
});

await test("LF provenance rejects absent, malformed, duplicate and escaping original entries", () => {
  fixture((root) => {
    const hash = "a".repeat(64);
    const path = `spec/analyses/history/source/${hash}.txt`;
    manifest(root, path, hash);
    assert.throws(() => inspectLineEndings(root, []), /missing or linked/u);
    manifest(root, "../outside.txt", hash);
    assert.throws(() => inspectLineEndings(root, []), /invalid relative path/u);
    write(root, "spec/analyses/line-endings.json", '{"retainedOriginals":false}');
    assert.throws(() => inspectLineEndings(root, []), /JSON or schema/u);
    write(
      root,
      "spec/analyses/line-endings.json",
      JSON.stringify({
        retainedOriginals: [
          { path, sha256: hash },
          { path, sha256: hash },
        ],
      }),
    );
    assert.throws(() => inspectLineEndings(root, []), /Duplicate/u);
  });
});

await test("opaque files remain unchanged while invalid authored text fails", () => {
  fixture((root) => {
    const bytes = new Uint8Array([0xff, 13, 10]);
    write(root, "asset.bin", bytes);
    write(root, "ascii.pdf", "%PDF-1.4\r\n%%EOF\r\n");
    write(root, "opaque", bytes);
    write(root, "app/invalid.ts", bytes);
    write(root, "app/nul.ts", new Uint8Array([0, 13, 10]));
    write(root, "data/research/texts/opaque.txt", new Uint8Array([0, 13, 10]));
    const result = inspectLineEndings(root, [
      "asset.bin",
      "ascii.pdf",
      "opaque",
      "app/invalid.ts",
      "app/nul.ts",
      "data/research/texts/opaque.txt",
    ]);
    assert.equal(result.opaqueFiles, 6);
    assert.equal(result.violations.length, 2);
    assert.deepEqual(readFileSync(join(root, "opaque")), Buffer.from(bytes));
  });
});

await test("oversized text fails before allocation and linked originals cannot acquire an exemption", () => {
  fixture((root) => {
    write(root, "app/oversized.txt", "");
    truncateSync(join(root, "app/oversized.txt"), 64 * 1024 * 1024 + 1);
    assert.throws(() => inspectLineEndings(root, ["app/oversized.txt"]), /byte bound/u);
    const content = "retained\r\n";
    const hash = createHash("sha256").update(content).digest("hex");
    write(root, `actual/${hash}.txt`, content);
    mkdirSync(join(root, "spec/analyses/history"), { recursive: true });
    symlinkSync(
      join(root, "actual"),
      join(root, "spec/analyses/history/linked"),
      process.platform === "win32" ? "junction" : "dir",
    );
    manifest(root, `spec/analyses/history/linked/${hash}.txt`, hash);
    assert.throws(() => inspectLineEndings(root, []), /missing or linked/u);
  });
});

await test("historical opaque input exemptions verify source and retained original hashes", () => {
  fixture((root) => {
    const path = ".cache/benchmark-documents/2.txt";
    const bytes = new Uint8Array([0, 13, 10]);
    write(root, path, bytes);
    assert.equal(inspectLineEndings(root, [path]).violations.length, 1);
    const rawCapture =
      ".cache/review-2026-10-27/memory-models/ai-media--source/19d2ffa0cf1c93f8405f.source";
    write(root, rawCapture, bytes);
    assert.equal(inspectLineEndings(root, [rawCapture]).violations.length, 1);
    const { originalPath } = declareOpaque(root, path, bytes);
    const accepted = inspectLineEndings(root, [path]);
    assert.equal(accepted.violations.length, 0);
    assert.equal(accepted.verifiedOpaqueInputs, 1);
    assert.equal(accepted.retainedOriginals, 1);
    write(root, path, new Uint8Array([0, 13, 11]));
    assert.throws(() => inspectLineEndings(root, [path]), /opaque input hash mismatch/u);
    write(root, path, bytes);
    write(root, originalPath, new Uint8Array([0, 13, 11]));
    assert.throws(() => inspectLineEndings(root, [path]), /retained original hash mismatch/u);
    declareOpaque(root, path, new Uint8Array([255, 13, 10]));
    assert.equal(inspectLineEndings(root, [path]).verifiedOpaqueInputs, 1);
  });
});

await test("opaque declarations cannot waive authored text, valid UTF-8 or missing provenance", () => {
  fixture((root) => {
    const path = ".cache/benchmark-documents/2.txt";
    const bytes = new Uint8Array([0, 13, 10]);
    declareOpaque(root, "app/hidden.ts", bytes);
    assert.throws(() => inspectLineEndings(root, []), /allowed historical input/u);
    declareOpaque(root, ".cache/review-2026-10-27/agents/hidden.json", bytes);
    assert.throws(() => inspectLineEndings(root, []), /allowed historical input/u);
    declareOpaque(root, path, new TextEncoder().encode("ordinary CRLF text\r\n"));
    assert.throws(() => inspectLineEndings(root, []), /Valid UTF-8 text/u);
    const { record, declaration } = declareOpaque(root, path, bytes);
    const privatePath = ".cache/line-endings/migrations/current.json";
    write(root, privatePath, JSON.stringify({ ...record, retainedOriginals: [] }));
    assert.throws(() => inspectLineEndings(root, []), /no matching retained original/u);
    write(
      root,
      privatePath,
      JSON.stringify({
        ...record,
        opaqueInputs: [{ ...declaration, originalPath: "../outside.bin" }],
      }),
    );
    assert.throws(() => inspectLineEndings(root, []), /invalid relative path/u);
    write(
      root,
      privatePath,
      JSON.stringify({ ...record, opaqueInputs: [declaration, declaration] }),
    );
    assert.throws(() => inspectLineEndings(root, []), /Duplicate LF opaque/u);
    write(
      root,
      privatePath,
      JSON.stringify({ ...record, opaqueInputs: [{ ...declaration, reason: "" }] }),
    );
    assert.throws(() => inspectLineEndings(root, []), /allowed historical input/u);
  });
});

await test("the exact retained PDF derivative needs verified provenance and cannot waive sibling text", () => {
  fixture((root) => {
    const path =
      ".cache/research/reconcile-2026-11-01/texts/34f46bf9-6b55-49fb-89f9-5dc6eb598d44/eb27a1d43387bcad8ca7fc151d13430d184cc61c969b8118d5584669b7c73484.md";
    const sibling = path.replace(/[^/]+$/u, "unregistered.md");
    const bytes = new TextEncoder().encode("Historical PDF derivative\n\u0000\n");
    write(root, path, bytes);
    assert.equal(inspectLineEndings(root, [path]).violations.length, 1);
    const { originalPath } = declareOpaque(root, path, bytes);
    const accepted = inspectLineEndings(root, [path]);
    assert.equal(accepted.violations.length, 0);
    assert.equal(accepted.verifiedOpaqueInputs, 1);
    assert.equal(accepted.retainedOriginals, 1);
    assert.deepEqual(readFileSync(join(root, path)), Buffer.from(bytes));
    write(root, path, new TextEncoder().encode("Changed derivative\n\u0000\n"));
    assert.throws(() => inspectLineEndings(root, [path]), /opaque input hash mismatch/u);
    write(root, path, bytes);
    write(root, originalPath, new TextEncoder().encode("Changed original\n\u0000\n"));
    assert.throws(() => inspectLineEndings(root, [path]), /retained original hash mismatch/u);
    declareOpaque(root, path, bytes);
    write(root, sibling, bytes);
    const rejectedSibling = inspectLineEndings(root, [path, sibling]);
    assert.equal(rejectedSibling.violations.length, 1);
    assert.ok(rejectedSibling.violations[0]?.includes(sibling));
    declareOpaque(root, sibling, bytes);
    assert.throws(() => inspectLineEndings(root, []), /allowed historical input/u);
    declareOpaque(root, path, new TextEncoder().encode("Ordinary authored text\n"));
    assert.throws(() => inspectLineEndings(root, []), /Valid UTF-8 text/u);
  });
});

await test("inventory includes owned ignored outputs without following vendors, byte fixtures or junctions", () => {
  fixture((root) => {
    const git = spawnSync("git", ["init", "--quiet"], {
      cwd: root,
      encoding: "utf8",
      timeout: 10_000,
      windowsHide: true,
      shell: false,
    });
    assert.ifError(git.error);
    assert.equal(git.status, 0, git.stderr);
    write(root, ".gitignore", ".cache/\nnode_modules/\ndist/\n.env.*\n");
    write(root, ".env.local", "EXAMPLE=private-fixture-value\r\n");
    write(root, "app/main.ts", "source\n");
    write(root, ".cache/review-2026-10-27/report.md", "report\r\n");
    write(root, ".cache/research/fixtures-123/byte.txt", "fixture\r\n");
    write(root, ".cache/research/citation-git/repo/source.ts", "upstream\r\n");
    write(root, ".cache/research/checkout/.git/HEAD", "ref\n");
    write(root, ".cache/research/checkout/source.ts", "upstream\r\n");
    write(root, ".cache/research/bare/HEAD", "ref\n");
    mkdirSync(join(root, ".cache/research/bare/objects"), { recursive: true });
    mkdirSync(join(root, ".cache/research/bare/refs"), { recursive: true });
    write(root, ".cache/research/bare/packed-refs", "upstream\r\n");
    write(root, ".cache/conversations/test-123/raw.txt", "fixture\r\n");
    write(root, "node_modules/vendor/main.ts", "vendor\r\n");
    write(root, "dist/result.txt", "output\r\n");
    write(root, ".cache/top-level-helper.py", "helper\r\n");
    write(root, ".cache/media-smoke-test/result.json", "{}\r\n");
    write(root, ".cache/benchmark-documents/notes.txt", "benchmark\r\n");
    write(root, ".cache/benchmark-documents/regression/fixture.txt", "input\r\n");
    write(root, ".cache/memory-benchmark/run/memory/blobs/original.txt", "immutable\r\n");
    write(root, ".cache/extractors-smoke/run/marker-home/model/config.json", "third party\r\n");
    write(root, ".cache/skill-validate/yaml/vendor.py", "third party\r\n");
    write(root, ".cache/text/source-state.json", "{}\r\n");
    write(root, ".cache/text/exports/version/raw.txt", "validated separately\r\n");
    write(root, ".cache/text/store/memory/blobs/source", "immutable source\r\n");
    const linked = join(root, ".cache/research/linked");
    symlinkSync(
      join(root, "node_modules/vendor"),
      linked,
      process.platform === "win32" ? "junction" : "dir",
    );
    const paths = lineEndingPaths(root);
    assert.ok(paths.includes("app/main.ts"));
    assert.ok(paths.includes(".env.local"));
    assert.ok(paths.includes(".cache/review-2026-10-27/report.md"));
    assert.ok(paths.includes("dist/result.txt"));
    assert.ok(paths.includes(".cache/top-level-helper.py"));
    assert.ok(paths.includes(".cache/media-smoke-test/result.json"));
    assert.ok(paths.includes(".cache/benchmark-documents/notes.txt"));
    assert.equal(
      paths.some((path) =>
        /(?:\/regression\/|\/memory\/blobs\/|marker-home|skill-validate)/u.test(path),
      ),
      false,
    );
    assert.ok(paths.includes(".cache/text/source-state.json"));
    assert.equal(
      paths.some(
        (path) => path.startsWith(".cache/text/exports/") || path.startsWith(".cache/text/store/"),
      ),
      false,
    );
    assert.equal(
      paths.some((path) =>
        /(?:fixtures-123|citation-git|checkout|\/bare\/|test-123|vendor|linked)/u.test(path),
      ),
      false,
    );
    const result = inspectLineEndings(root, paths);
    assert.equal(result.violations.length, 7);
    assert.equal(
      result.violations.some((message) => message.includes("private-fixture-value")),
      false,
    );
  });
});

await test("Git whitespace checks preserve exact originals while rejecting active text defects", () => {
  fixture((root) => {
    const git = (args: readonly string[]) => {
      const result = spawnSync("git", [...args], {
        cwd: root,
        encoding: "utf8",
        timeout: 10_000,
        windowsHide: true,
        shell: false,
      });
      assert.ifError(result.error);
      return result;
    };
    assert.equal(git(["init", "--quiet"]).status, 0);
    write(
      root,
      ".gitattributes",
      readFileSync(fileURLToPath(new URL("../.gitattributes", import.meta.url))),
    );
    const original = "Historical wording with preserved space \n\n";
    const sha256 = createHash("sha256").update(original).digest("hex");
    const path = `spec/archive/line-endings/originals/${sha256}.bin`;
    write(root, path, original);
    manifest(root, path, sha256);
    assert.equal(git(["add", "--", ".gitattributes", path]).status, 0);
    assert.equal(git(["diff", "--cached", "--check"]).status, 0);
    assert.equal(readFileSync(join(root, path), "utf8"), original);
    assert.equal(inspectLineEndings(root, [path]).violations.length, 0);
    write(root, "active.txt", "New maintained text with trailing whitespace \n");
    assert.equal(git(["add", "--", "active.txt"]).status, 0);
    assert.notEqual(git(["diff", "--cached", "--check"]).status, 0);
    write(root, path, "Changed original\n");
    assert.throws(() => inspectLineEndings(root, [path]), /hash mismatch/u);
  });
});

await test("real Git preserves binary and original bytes while active text checks out LF under either autocrlf setting", () => {
  fixture((root) => {
    function git(args: readonly string[]): void {
      const result = spawnSync("git", ["-c", "core.safecrlf=false", ...args], {
        cwd: root,
        encoding: "utf8",
        timeout: 10_000,
        windowsHide: true,
        shell: false,
      });
      assert.ifError(result.error);
      assert.equal(result.status, 0, result.stderr);
    }
    git(["init", "--quiet"]);
    const attributes = fileURLToPath(new URL("../.gitattributes", import.meta.url));
    write(root, ".gitattributes", readFileSync(attributes));
    write(root, "active.txt", "first\r\nsecond\r\n");
    write(root, "active.svg", "<svg>\r\n</svg>\r\n");
    write(root, "active.xml", "<root>\r\n</root>\r\n");
    const binary = "%PDF-1.4\r\nASCII-only binary container fixture\r\n%%EOF\r\n";
    const binaryPaths = lineEndingBinaryExtensions.flatMap((extension) => [
      `binary/lower.${extension}`,
      `binary/upper.${extension.toUpperCase()}`,
    ]);
    assert.ok(binaryPaths.includes("binary/lower.pdf"));
    for (const path of binaryPaths) write(root, path, binary);
    const original = "Historical CRLF evidence\r\n";
    const sha256 = createHash("sha256").update(original).digest("hex");
    const retained = [
      `spec/analyses/history/source/${sha256}.txt`,
      `spec/archive/line-endings/originals/${sha256}.bin`,
    ];
    for (const path of retained) write(root, path, original);
    git([
      "-c",
      "core.autocrlf=false",
      "add",
      "--",
      ".gitattributes",
      "active.txt",
      "active.svg",
      "active.xml",
      "binary",
      "spec",
    ]);
    for (const setting of ["true", "false"]) {
      const output = join(root, `checkout-${setting}`);
      mkdirSync(output);
      const prefix = `${output.replaceAll("\\", "/")}/`;
      git([
        "-c",
        `core.autocrlf=${setting}`,
        "checkout-index",
        "--all",
        "--force",
        `--prefix=${prefix}`,
      ]);
      assert.equal(readFileSync(join(output, "active.txt"), "utf8"), "first\nsecond\n");
      assert.equal(readFileSync(join(output, "active.svg"), "utf8"), "<svg>\n</svg>\n");
      assert.equal(readFileSync(join(output, "active.xml"), "utf8"), "<root>\n</root>\n");
      for (const path of binaryPaths)
        assert.equal(readFileSync(join(output, path), "utf8"), binary, `${setting}: ${path}`);
      for (const path of retained)
        assert.equal(readFileSync(join(output, path), "utf8"), original, `${setting}: ${path}`);
    }
  });
});
