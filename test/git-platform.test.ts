import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { delimiter, dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { gitPlatformArguments } from "../app/check/git-platform.ts";
import { resolveVerificationTool } from "../app/check/tool-prerequisites.ts";
import { diagnostic, runProcess } from "../app/workflow/process.ts";
import { mkdtemp } from "./temporary.ts";

await test("Git platform arguments retain literal values and leave caller inputs unchanged", () => {
  const args = Object.freeze(["-C", "path with spaces", "show", "HEAD:file name.txt"]);
  assert.deepEqual(gitPlatformArguments(args, "win32"), ["-c", "core.longpaths=true", ...args]);
  for (const platform of ["linux", "darwin"] as const)
    assert.deepEqual(gitPlatformArguments(args, platform), args);
  assert.deepEqual(args, ["-C", "path with spaces", "show", "HEAD:file name.txt"]);
});

await test(
  "canonical Git stages a long archive path without changing saved settings",
  { timeout: 30_000 },
  async () => {
    const repository = fileURLToPath(new URL("../", import.meta.url));
    const base = await mkdtemp("git-long-path-");
    // Native Git must be able to initialize its cwd before it can parse -c options.
    const root = join(base, "w".repeat(Math.max(1, 235 - base.length - 1)));
    assert.ok(
      root.length >= 235 && root.length < 250,
      "The checkout fits native Git's startup path limit",
    );
    await mkdir(root);
    const template = join(base, "empty-template");
    await mkdir(template);
    const executable = await resolveVerificationTool("git", repository);
    const path =
      "spec/.conversations/261106-parallel-workflow-fixture-0000000000000000.codex-fixture-fixture.md";
    assert.ok(
      join(root, path).length > 260,
      "The archive crosses the Windows legacy full-path bound",
    );
    const program = join(base, "git-adapter-probe.ts");
    await writeFile(
      program,
      `
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { gitAt, gitEnvironment } from ${JSON.stringify(new URL("../app/workflow/git.ts", import.meta.url).href)};
import { gitBytes } from ${JSON.stringify(new URL("../app/check/cache-io.ts", import.meta.url).href)};
import { lineEndingPaths } from ${JSON.stringify(new URL("../app/check/line-endings.ts", import.meta.url).href)};
const root = ${JSON.stringify(root)};
const path = ${JSON.stringify(path)};
const git = gitAt(root);
await git(["init", "--quiet", "--template", ${JSON.stringify(template)}]);
await git(["config", "--local", "core.longpaths", "false"]);
const configuration = await readFile(join(root, ".git/config"), "utf8");
const absolute = join(root, path);
await mkdir(dirname(absolute), { recursive: true });
const contents = "Deep physical fixture retained exactly.\\n";
await writeFile(absolute, contents, "utf8");
const nullFile = process.platform === "win32" ? "NUL" : "/dev/null";
if (process.platform === "win32") {
  // Run before any successful add: an already-staged index would hide the defect.
  const control = spawnSync(${JSON.stringify(executable)}, ["-c", "core.longpaths=false", "-c", "core.fsmonitor=false", "-c", "core.attributesFile=" + nullFile, "add", "--", path], {
    cwd: root, env: { ...gitEnvironment(), GIT_CONFIG_NOSYSTEM: "1", GIT_CONFIG_GLOBAL: nullFile },
    encoding: "utf8", windowsHide: true, shell: false, timeout: 10_000, maxBuffer: 16_384,
  });
  assert.ifError(control.error);
  assert.notEqual(control.status, 0, "The isolated native control must reproduce the long-path failure");
  assert.match(control.stderr, /Filename too long/iu);
}
await git(["-c", "core.autocrlf=false", "-c", "core.attributesFile=" + nullFile, "add", "--", path]);
assert.equal(await git(["show", ":" + path]), contents);
assert.equal(new TextDecoder().decode(gitBytes(root, ["show", ":" + path])), contents);
assert.ok(lineEndingPaths(root).includes(path));
assert.equal(await readFile(absolute, "utf8"), contents);
assert.equal(await readFile(join(root, ".git/config"), "utf8"), configuration);
process.stdout.write("verified\\n");
`,
      "utf8",
    );
    // Only the child gets the canonical launcher; this test never changes ambient PATH.
    const environment = { ...process.env };
    for (const key of Object.keys(environment))
      if (key.toLowerCase() === "path") Reflect.deleteProperty(environment, key);
    environment.PATH = [dirname(executable), process.env.PATH ?? process.env.Path ?? ""].join(
      delimiter,
    );
    const result = await runProcess(repository, process.execPath, [program], {
      env: environment,
      timeoutMs: 25_000,
      maximumBytes: 65_536,
    });
    const detail = diagnostic(result.stderr).slice(-6000);
    assert.equal(result.outcome, "exited", detail);
    assert.equal(result.termination, "closed", detail);
    assert.equal(result.code, 0, detail);
    assert.equal(result.stdout, "verified\n");
  },
);
