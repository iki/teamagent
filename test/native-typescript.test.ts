import assert from "node:assert/strict";
import { mkdir, readFile, realpath, rm, rmdir, symlink, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { resolveNativeTypeScript } from "../app/check/native-typescript.ts";
import { installedPackageIdentity } from "../app/check/installed-inputs.ts";
import { runProcess } from "../app/workflow/process.ts";
import { mkdtemp } from "./temporary.ts";

const repository = fileURLToPath(new URL("../", import.meta.url));
const version = "7.0.0-dev.20260707.2";
const packageName = "@typescript/native-preview";

async function fixture(platform = "win32", architecture = "x64") {
  const root = await mkdtemp("native-typescript-");
  const launcher = join(root, "node_modules", packageName);
  // Match isolated package-manager resolution: the native dependency is not hoisted.
  const nativeName = `${packageName}-${platform}-${architecture}`;
  const native = join(launcher, "node_modules", nativeName);
  const executable = join(native, "lib", platform === "win32" ? "tsgo.exe" : "tsgo");
  await mkdir(dirname(executable), { recursive: true });
  const project = {
    name: "native-typescript-fixture",
    version: "0.0.0",
    devDependencies: { [packageName]: version },
  };
  const launcherPackage = {
    name: packageName,
    version,
    bin: { tsgo: "./bin/tsgo" },
    optionalDependencies: { [nativeName]: version },
    exports: { "./package.json": "./package.json" },
  };
  const nativePackage = {
    name: nativeName,
    version,
    exports: { "./package.json": "./package.json" },
  };
  const save = async (path: string, value: unknown) =>
    writeFile(path, `${JSON.stringify(value)}\n`, "utf8");
  await save(join(root, "package.json"), project);
  await save(join(launcher, "package.json"), launcherPackage);
  await save(join(native, "package.json"), nativePackage);
  await writeFile(executable, "fixture native artifact\n", { mode: 0o755 });
  return { root, launcher, native, executable, project, launcherPackage, nativePackage, save };
}

await test("native TypeScript follows isolated declared platform packages and retains artifact identity", async () => {
  for (const platform of ["win32", "linux"]) {
    const f = await fixture(platform, "x64");
    assert.equal(
      await resolveNativeTypeScript(f.root, platform, "x64"),
      await realpath(f.executable),
    );
    const before = await installedPackageIdentity(f.root);
    await writeFile(f.executable, "changed native artifact\n");
    assert.notEqual(await installedPackageIdentity(f.root), before);
    await assert.rejects(resolveNativeTypeScript(f.root, "../win32", "x64"), /platform/u);
    await assert.rejects(resolveNativeTypeScript(f.root, platform, "arm64"), /not declared/u);
    await assert.rejects(resolveNativeTypeScript(f.root, platform, "x64/other"), /platform/u);
  }
});

await test("native TypeScript rejects drift, ambiguous pins and malformed or missing package inputs", async () => {
  const f = await fixture();
  const projectPath = join(f.root, "package.json");
  const launcherPath = join(f.launcher, "package.json");
  const nativePath = join(f.native, "package.json");
  await f.save(projectPath, { devDependencies: { [packageName]: "^7.0.0" } });
  await assert.rejects(resolveNativeTypeScript(f.root, "win32", "x64"), /exact project/u);
  await f.save(projectPath, { ...f.project, dependencies: { [packageName]: "7.0.1" } });
  await assert.rejects(resolveNativeTypeScript(f.root, "win32", "x64"), /exact project/u);
  await f.save(projectPath, f.project);
  for (const changed of [
    { ...f.launcherPackage, name: "other" },
    { ...f.launcherPackage, version: "7.0.1" },
    { ...f.launcherPackage, bin: { tsgo: "../unexpected" } },
    { ...f.launcherPackage, bin: { tsgo: "./bin/tsgo", other: "./bin/other" } },
    { ...f.launcherPackage, optionalDependencies: {} },
  ]) {
    await f.save(launcherPath, changed);
    await assert.rejects(resolveNativeTypeScript(f.root, "win32", "x64"));
  }
  await f.save(launcherPath, f.launcherPackage);
  for (const changed of [
    { ...f.nativePackage, name: "other" },
    { ...f.nativePackage, version: "7.0.1" },
    { ...f.nativePackage, version: 7 },
  ]) {
    await f.save(nativePath, changed);
    await assert.rejects(resolveNativeTypeScript(f.root, "win32", "x64"));
  }
  await f.save(nativePath, f.nativePackage);
  await writeFile(launcherPath, " ".repeat(1024 * 1024 + 1));
  await assert.rejects(resolveNativeTypeScript(f.root, "win32", "x64"), /bounds/u);
  await f.save(launcherPath, f.launcherPackage);
  await rm(f.executable);
  await assert.rejects(resolveNativeTypeScript(f.root, "win32", "x64"), { code: "ENOENT" });
  await rm(nativePath);
  await assert.rejects(resolveNativeTypeScript(f.root, "win32", "x64"));
});

await test("native TypeScript rejects redirected executable directories within an admitted package", async () => {
  const f = await fixture();
  const outside = join(f.root, "outside");
  await mkdir(outside);
  await writeFile(join(outside, "tsgo.exe"), "retained target\n", { mode: 0o755 });
  await rm(f.executable);
  await rmdir(dirname(f.executable));
  await symlink(outside, dirname(f.executable), process.platform === "win32" ? "junction" : "dir");
  await assert.rejects(resolveNativeTypeScript(f.root, "win32", "x64"), /Linked cache path/u);
  assert.equal(await readFile(join(outside, "tsgo.exe"), "utf8"), "retained target\n");
});

await test(
  "owned native TypeScript preserves version, literal project paths and compiler rejection",
  { timeout: 45_000 },
  async () => {
    const executable = await resolveNativeTypeScript(repository);
    const launcher = createRequire(resolve(repository, "package.json")).resolve(
      `${packageName}/package.json`,
    );
    const nativeManifest = createRequire(launcher).resolve(
      `${packageName}-${process.platform}-${process.arch}/package.json`,
    );
    assert.equal(
      executable,
      await realpath(
        join(dirname(nativeManifest), "lib", process.platform === "win32" ? "tsgo.exe" : "tsgo"),
      ),
    );
    const folder = await mkdtemp("native-typecheck-");
    const project = join(folder, "project with spaces.json");
    await writeFile(
      join(folder, "source with spaces.ts"),
      "export const value: string = 1;\n",
      "utf8",
    );
    await writeFile(
      project,
      `${JSON.stringify({ compilerOptions: { noEmit: true, strict: true, types: [] }, files: ["source with spaces.ts"] })}\n`,
      "utf8",
    );
    const observed = await runProcess(
      repository,
      process.execPath,
      [join(repository, "app/check/tool.ts"), "typecheck", "--version"],
      { timeoutMs: 15_000, maximumBytes: 16_384 },
    );
    assert.equal(observed.outcome, "exited");
    assert.equal(observed.termination, "closed");
    assert.equal(observed.code, 0, observed.stderr);
    assert.match(observed.stdout, /^Version 7\.0\.0-dev\.20260707\.2\s*$/u);
    const rejected = await runProcess(
      folder,
      executable,
      ["--pretty", "false", "--project", project],
      { timeoutMs: 15_000, maximumBytes: 16_384 },
    );
    assert.equal(rejected.outcome, "exited");
    assert.equal(rejected.termination, "closed");
    assert.notEqual(rejected.code, 0);
    assert.match(rejected.stdout + rejected.stderr, /TS2322/u);
  },
);
