import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { mkdtemp } from "./temporary.ts";

await test("background process lint follows actual bindings and effective inline option order", async () => {
  const repository = fileURLToPath(new URL("../", import.meta.url));
  const root = await mkdtemp("background-process-lint-");
  const directory = join(root, "test");
  await mkdir(directory);
  const entry = join(directory, "background.test.ts");
  const config = join(root, "oxlint.config.ts");
  await writeFile(
    config,
    `export default { jsPlugins: [${JSON.stringify(join(repository, "lib/lint/index.ts"))}], rules: { "teamagent/background-processes": "error" } };\n`,
    "utf8",
  );
  const run = () =>
    spawnSync(
      process.execPath,
      [
        join(repository, "node_modules/oxlint/bin/oxlint"),
        "--config",
        config,
        "--no-ignore",
        entry,
      ],
      {
        cwd: repository,
        encoding: "utf8",
        windowsHide: true,
        timeout: 60_000,
        maxBuffer: 1024 * 1024,
      },
    );
  const valid = [
    'import { spawn as native, execFile as execute } from "node:child_process";',
    'import * as child from "child_process";',
    'import runtime from "bun";',
    'import { default as namedNode, "default" as literalNode } from "node:child_process";',
    'import { default as namedBun, "default" as literalBun } from "bun";',
    'import platformProcess from "node:process";',
    'export const one = Bun.spawn(["git"], { windowsHide: true });',
    'export const two = Bun.spawnSync({ cmd: ["git"], windowsHide: true });',
    'export function options(extra: object) { return native("git", [], { ...extra, windowsHide: true, detached: false }); }',
    'export const three = child.spawnSync("git", { windowsHide: true, ...{ cwd: "." } });',
    'export const four = execute("git", { ["windowsHide"]: true }, () => {});',
    'export const five = runtime.spawn(["git"], { ...{ windowsHide: false }, windowsHide: true });',
    'export function localBun(Bun: { spawn(args: string[]): unknown }) { return Bun.spawn(["local"]); }',
    'export function localChild(child: { spawnSync(args: string[]): unknown }) { return child.spawnSync(["local"]); }',
    'export function localImported(native: (name: string) => unknown) { return native("local"); }',
    'export function localAlias(Bun: { spawn(args: string[]): unknown }) { const alias = Bun; const { spawn: run } = alias; return run(["local"]); }',
    'export const fake = { spawn() { return "local"; } }; export const ignored = fake.spawn();',
    'export const generatedPosixFixture = "spawn(process.execPath, [], { detached: true })";',
    'export function computedFirst(key: string) { return native("git", [], { [key]: false, windowsHide: true, detached: false }); }',
    'export const six = Bun.spawn(["git"], { ...{ windowsHide: true } });',
    'export const seven = namedNode.spawn("git", [], { windowsHide: true });',
    'export const eight = literalNode.spawnSync("git", [], { windowsHide: true });',
    'export const nine = namedBun.spawn(["git"], { windowsHide: true });',
    'export const ten = literalBun.spawnSync(["git"], { windowsHide: true });',
    'export function localNamedNode(namedNode: { spawn(name: string): unknown }) { return namedNode.spawn("local"); }',
    'export function localLiteralNode(literalNode: { spawnSync(name: string): unknown }) { return literalNode.spawnSync("local"); }',
    'export function localNamedBun(namedBun: { spawn(args: string[]): unknown }) { return namedBun.spawn(["local"]); }',
    'export function localLiteralBun(literalBun: { spawnSync(args: string[]): unknown }) { return literalBun.spawnSync(["local"]); }',
    'export const fixedGroup = native("git", [], { windowsHide: true, detached: false });',
    'export const posixGroup = native("git", [], { windowsHide: true, detached: process.platform !== "win32" });',
    'export const reversedGroup = native("git", [], { windowsHide: true, detached: "win32" !== process.platform });',
    'export const importedGroup = native("git", [], { windowsHide: true, detached: platformProcess.platform !== "win32" });',
    'export const overrideGroup = native("git", [], { windowsHide: true, ...{ detached: true }, detached: false });',
    'export function harmlessConditional(cwd: string | undefined) { return native("git", [], { ...(cwd ? { cwd } : {}), windowsHide: true }); }',
  ];
  await writeFile(entry, valid.join("\n") + "\n", "utf8");
  const accepted = run();
  assert.equal(accepted.error, undefined);
  assert.equal(accepted.status, 0, accepted.stdout + accepted.stderr);

  const invalid = [
    'import { spawn as launch, execFile, execSync, fork } from "node:child_process";',
    'import * as child from "node:child_process";',
    'import defaultChild from "child_process";',
    'import { spawnSync as bunLaunch } from "bun";',
    'import { default as namedNode, "default" as literalNode } from "node:child_process";',
    'import { default as namedBun, "default" as literalBun } from "bun";',
    'export const one = Bun.spawn(["git"]);',
    'export const two = Bun.spawnSync(["git"], { windowsHide: false });',
    'export const three = Bun.spawn({ cmd: ["git"] });',
    'export const four = launch("git", []);',
    'export const five = child["spawnSync"]("git", [], {});',
    'export const six = defaultChild.execFileSync("git", [], { windowsHide: false });',
    'export const seven = execFile("git", [], () => {});',
    'export const eight = bunLaunch(["git"], {});',
    'const runtime = Bun; const { spawn: renamed } = runtime; export const nine = renamed(["git"]);',
    'const alias = launch; export const ten = alias("git", [], {});',
    'const { spawn: extracted } = child; export const eleven = extracted("git", []);',
    'export function spread(extra: object) { return launch("git", [], { windowsHide: true, ...extra }); }',
    'export const twelve = execSync("git", { windowsHide: true, ...{ windowsHide: false } });',
    'export function computed(key: string) { return fork("file.js", [], { windowsHide: true, [key]: false }); }',
    'export const thirteen = launch("git", [], { get windowsHide() { return true; } });',
    'export function shifted(args: unknown[]) { return launch("git", ...args, { windowsHide: true }); }',
    'export const fourteen = namedNode.spawn("git", []);',
    'export const fifteen = literalNode.spawnSync("git", []);',
    'export const sixteen = namedBun.spawn(["git"]);',
    'export const seventeen = literalBun.spawnSync(["git"]);',
    'export const detachedAlways = launch("git", [], { windowsHide: true, detached: true });',
    'export const detachedWindows = launch("git", [], { windowsHide: true, detached: process.platform === "win32" });',
    'export const detachedOtherPlatform = launch("git", [], { windowsHide: true, detached: process.platform !== "linux" });',
    'export function detachedDynamic(detached: boolean) { return launch("git", [], { windowsHide: true, detached }); }',
    'export function shadowedProcess(process: { platform: string }) { return launch("git", [], { windowsHide: true, detached: process.platform !== "win32" }); }',
    'export const detachedLater = launch("git", [], { windowsHide: true, detached: false, ...{ detached: true } });',
    'export function detachedSpread(extra: object) { return launch("git", [], { detached: false, ...extra, windowsHide: true }); }',
    'export function detachedComputed(key: string) { return launch("git", [], { detached: false, [key]: true, windowsHide: true }); }',
    'export const detachedGetter = launch("git", [], { windowsHide: true, get detached() { return false; } });',
  ];
  await writeFile(entry, invalid.join("\n") + "\n", "utf8");
  const rejected = run();
  assert.equal(rejected.error, undefined);
  assert.equal(rejected.status, 1, rejected.stdout + rejected.stderr);
  assert.equal(
    (rejected.stdout + rejected.stderr).match(/teamagent\(background-processes\)/gu)?.length,
    29,
    rejected.stdout + rejected.stderr,
  );
});
