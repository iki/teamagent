import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { importDeclWithSpecifiers, importSpecifier, runRule } from "effect-oxlint/testing";
import { temporaryFixtures } from "@/lint";
import { mkdtemp } from "./temporary.ts";

await test("fixture lint exemptions are exact ownership implementation files", () => {
  const node = importDeclWithSpecifiers("node:fs/promises", [importSpecifier("mkdtemp")]);
  for (const filename of [
    "/repo/test/temporary.ts",
    "/repo/test/temporary-workspace.test.ts",
    "/repo/app/import.ts",
  ])
    assert.equal(
      runRule(temporaryFixtures, "ImportDeclaration", node, { filename, cwd: "/repo" }).length,
      0,
    );
  for (const filename of [
    "/repo/test/new.test.ts",
    "/repo/test/nested/temporary.ts",
    "/repo/test/nested/temporary-workspace.test.ts",
  ])
    assert.equal(
      runRule(temporaryFixtures, "ImportDeclaration", node, { filename, cwd: "/repo" }).length,
      1,
    );
});

await test("parsed fixture lint covers aliases, namespaces and destructuring without shadowed false positives", async () => {
  const repository = fileURLToPath(new URL("../", import.meta.url));
  const root = await mkdtemp("fixture-lint-");
  const directory = join(root, "test");
  await mkdir(directory);
  const entry = join(directory, "allocation.test.ts");
  const config = join(root, "oxlint.config.ts");
  // --no-ignore disables ignore files; explicit configuration exclusions still hide .cache fixtures.
  // Keep every production rule and load the same plugin while admitting only this explicit test file.
  await writeFile(
    config,
    [
      `import config from ${JSON.stringify(pathToFileURL(join(repository, "oxlint.config.ts")).href)};`,
      `export default { ...config, ignorePatterns: [], jsPlugins: [${JSON.stringify(join(repository, "lib/lint/index.ts"))}] };`,
    ].join("\n") + "\n",
    "utf8",
  );
  const args = [
    join(repository, "node_modules/oxlint/bin/oxlint"),
    "--config",
    config,
    "--no-ignore",
    "--deny-warnings",
    entry,
  ];
  const run = () =>
    spawnSync(process.execPath, args, {
      cwd: repository,
      encoding: "utf8",
      windowsHide: true,
      timeout: 60_000,
      maxBuffer: 1024 * 1024,
    });
  await writeFile(
    entry,
    [
      'import fs from "node:fs";',
      'import { mkdtemp as managed } from "./temporary.ts";',
      'export const safe = managed("fixture-");',
      'export const ordinary = fs.readFileSync("fixture");',
      'export function shadow(fs: { mkdtemp(value: string): string }) { return fs.mkdtemp("local-"); }',
      'export function destructure(fs: { mkdtemp(value: string): string }) { const { mkdtemp: local } = fs; return local("local-"); }',
      'export function localRequire(require: (name: string) => { mkdtemp(value: string): string }) { const files = require("node:fs"); return files.mkdtemp("local-"); }',
      'export function localPromises(fs: { promises: { mkdtemp(value: string): string } }) { const { promises: files } = fs; return files.mkdtemp("local-"); }',
    ].join("\n") + "\n",
    "utf8",
  );
  const valid = run();
  assert.equal(valid.error, undefined);
  assert.equal(valid.status, 0, valid.stdout + valid.stderr);
  await writeFile(
    entry,
    [
      'import { mkdtemp as renamed } from "node:fs/promises";',
      'import * as fs from "node:fs";',
      'import files from "fs/promises";',
      'import { promises as asynchronous } from "node:fs";',
      'export const first = renamed("a-");',
      'export const second = fs["mkdtempSync"]("b-");',
      'export const third = files.mkdtemp("c-");',
      'export const fourth = fs.promises.mkdtemp("d-");',
      'export const fifth = asynchronous.mkdtemp("e-");',
      'const { mkdtemp: extracted } = fs.promises; export const sixth = extracted("f-");',
      'const { mkdtemp: dynamic } = await import("node:fs/promises"); export const seventh = dynamic("g-");',
      'const loaded = await import("node:fs/promises"); export const eighth = loaded.mkdtemp("h-");',
      'const required = require("node:fs"); export const ninth = required.mkdtempSync("i-");',
      'const alias = files; export const tenth = alias.mkdtemp("j-");',
      'export { mkdtemp as exposed } from "node:fs/promises";',
      'const { promises: destructuredFiles } = fs; export const eleventh = destructuredFiles.mkdtemp("k-");',
      'const { ["promises"]: computedFiles } = await import("node:fs"); export const twelfth = computedFiles.mkdtemp("l-");',
    ].join("\n") + "\n",
    "utf8",
  );
  const invalid = run();
  assert.equal(invalid.error, undefined);
  assert.equal(invalid.status, 1, invalid.stdout + invalid.stderr);
  assert.equal(
    (invalid.stdout + invalid.stderr).match(/teamagent\(temporary-fixtures\)/gu)?.length,
    13,
  );
});
