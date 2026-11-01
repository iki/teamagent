import { mkdtempSync } from "./temporary.ts";
import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

function fixtureConfig(repository: string, fixture: string): string {
  const config = join(fixture, "oxlint.config.ts");
  // Retain all production rules while admitting the explicit owned fixture under .cache.
  writeFileSync(
    config,
    [
      `import config from ${JSON.stringify(pathToFileURL(join(repository, "oxlint.config.ts")).href)};`,
      `export default { ...config, ignorePatterns: [], jsPlugins: [${JSON.stringify(join(repository, "lib/lint/index.ts"))}] };`,
    ].join("\n") + "\n",
    "utf8",
  );
  return config;
}

await test("Oxlint loads the registered rules and checks parsed TypeScript", () => {
  const root = fileURLToPath(new URL("../", import.meta.url));
  const fixture = mkdtempSync(join(tmpdir(), "teamagent-architecture-"));
  const library = join(fixture, "lib", "domain");
  mkdirSync(library, { recursive: true });
  const file = join(library, "index.ts");
  const args = [
    join(root, "node_modules", "oxlint", "bin", "oxlint"),
    "--config",
    fixtureConfig(root, fixture),
    "--no-ignore",
    "--deny-warnings",
    file,
  ];

  try {
    writeFileSync(
      file,
      'import { Effect } from "effect";\nexport { cli } from "./cli.ts";\nexport const value = { count: 1 } as const;\nexport const task = Effect.succeed(value);\n',
    );
    const valid = spawnSync(process.execPath, args, {
      cwd: root,
      encoding: "utf8",
      windowsHide: true,
      timeout: 60_000,
    });
    assert.ifError(valid.error);
    assert.equal(valid.status, 0, valid.stdout + valid.stderr);

    writeFileSync(
      file,
      [
        'import { Effect } from "effect";',
        "export const value = {} as { readonly trusted: string };",
        "export const task = Effect.runSync(Effect.succeed(1));",
        'export const generated = Function("return 1")();',
      ].join("\n"),
    );
    const invalid = spawnSync(process.execPath, args, {
      cwd: root,
      encoding: "utf8",
      windowsHide: true,
      timeout: 60_000,
    });
    assert.ifError(invalid.error);
    assert.equal(invalid.status, 1, invalid.stdout + invalid.stderr);
    for (const rule of ["no-unsafe-casts", "boundaries", "no-executable-input"])
      assert.ok(
        (invalid.stdout + invalid.stderr).includes(rule),
        `Expected parsed diagnostic for ${rule}`,
      );
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
});

await test("parsed library paths and child-process aliases keep their boundaries", () => {
  const root = fileURLToPath(new URL("../", import.meta.url));
  const fixture = mkdtempSync(join(tmpdir(), "teamagent-boundaries-"));
  const nested = join(fixture, "lib", "domain", "nested");
  const host = join(fixture, "app");
  mkdirSync(nested, { recursive: true });
  mkdirSync(host);
  const libraryFile = join(nested, "model.ts");
  const hostFile = join(host, "launcher.ts");
  const args = [
    join(root, "node_modules", "oxlint", "bin", "oxlint"),
    "--config",
    fixtureConfig(root, fixture),
    "--no-ignore",
    "--deny-warnings",
    libraryFile,
    hostFile,
  ];
  const run = () =>
    spawnSync(process.execPath, args, {
      cwd: root,
      encoding: "utf8",
      windowsHide: true,
      timeout: 60_000,
    });
  try {
    writeFileSync(libraryFile, 'export { value } from "../schema.ts";');
    writeFileSync(
      hostFile,
      [
        'import { spawnSync as launch } from "node:child_process";',
        'import * as child from "node:child_process";',
        'export const results = [launch(process.execPath, [], { windowsHide: true }), launch("git", [], { windowsHide: true }), launch("ditto", [], { windowsHide: true })];',
        'export function spawn(name: string) { return name; } export const local = spawn("node");',
        'export function scoped(launch: (name: string) => string) { return launch("node"); }',
        'export function scopedNamespace(child: { spawnSync(name: string): string }) { return child.spawnSync("node"); }',
        'export const native = child.spawnSync("git", [], { windowsHide: true });',
      ].join("\n"),
    );
    const valid = run();
    assert.ifError(valid.error);
    assert.equal(valid.status, 0, valid.stdout + valid.stderr);

    writeFileSync(libraryFile, 'export { value } from "./../../other/internal.ts";');
    writeFileSync(
      hostFile,
      [
        'export const first = launch("node", []);',
        'import { spawnSync as launch } from "node:child_process";',
        'import * as child from "node:child_process";',
        'import childDefault from "child_process";',
        'export const second = child["spawnSync"]("bun", []);',
        'export const third = childDefault.spawnSync("npx", []);',
        'export const shims = [launch("npm.cmd", []), launch("tauri.cmd", []), launch("oxlint", []), launch("C:/bin/node.exe", [])];',
      ].join("\n"),
    );
    const invalid = run();
    assert.ifError(invalid.error);
    assert.equal(invalid.status, 1, invalid.stdout + invalid.stderr);
    for (const rule of ["boundaries", "runtime-launchers"])
      assert.ok(
        (invalid.stdout + invalid.stderr).includes(rule),
        `Expected parsed diagnostic for ${rule}`,
      );
    assert.equal(
      (invalid.stdout + invalid.stderr).match(/teamagent\(runtime-launchers\)/g)?.length,
      7,
    );
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
});
