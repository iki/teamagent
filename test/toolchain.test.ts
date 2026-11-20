import { assertTemporaryFixture, mkdtemp } from "./temporary.ts";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { basename, delimiter, dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import {
  currentBunEnvironment,
  physicalToolPath,
  pinnedTool,
  prependToolPath,
  toolchainPins,
  toolVersionOutput,
} from "../app/check/toolchain.ts";
import { nativeToolIdentity } from "../app/check/tool-prerequisites.ts";

const repository = fileURLToPath(new URL("../", import.meta.url));
async function fixture() {
  const root = await mkdtemp(join(tmpdir(), "teamagent-toolchain-"));
  await writeFile(join(root, ".bun-version"), "1.4.2\n", "utf8");
  const manifest = { engines: { bun: "1.4.2" }, packageManager: "aube@2.5.1" };
  await writeFile(join(root, "package.json"), JSON.stringify(manifest) + "\n", "utf8");
  return {
    root,
    manifest,
    async close() {
      await assertTemporaryFixture(root);
      assert.ok(basename(root).startsWith("teamagent-toolchain-"));
      await rm(root, { recursive: true, force: true });
    },
  };
}

await test("physical tool selection binds exact pins and rejects shims, invalid overrides and wrong versions without fallback", async () => {
  const f = await fixture();
  try {
    assert.deepEqual(toolchainPins(f.root), { bun: "1.4.2", aube: "2.5.1" });
    assert.equal(toolVersionOutput("aube", "2.5.1 windows-x64 (2026-09-27)\n"), "2.5.1");
    assert.equal(toolVersionOutput("aube", "2.5.1 linux-x64 (2026-09-27)"), "2.5.1");
    assert.equal(toolVersionOutput("aube", "2.5.1 macos-arm64 (2026-09-27)"), "2.5.1");
    assert.throws(() => toolVersionOutput("aube", "2.5.1 x86_64-pc-windows-msvc (2026-09-27)"));
    assert.throws(() => toolVersionOutput("aube", "2.5.1\nunexpected"));
    const env = { ...process.env, TEAMAGENT_BUN_PATH: process.execPath };
    assert.equal(pinnedTool(f.root, "bun", env), physicalToolPath(process.execPath, "bun"));
    assert.equal(
      pinnedTool(
        f.root,
        "bun",
        { ...env, TEAMAGENT_BUN_PATH: "foreign-shim" },
        { path: process.execPath, inheritOverride: false },
      ),
      physicalToolPath(process.execPath, "bun"),
    );
    assert.equal(
      pinnedTool(
        f.root,
        "bun",
        { ...env, TEAMAGENT_BUN_PATH: "foreign-shim", MISE_INSTALLS_DIR: undefined },
        { inheritOverride: false },
      ),
      physicalToolPath(process.execPath, "bun"),
    );
    for (const override of [
      "bun",
      join(f.root, ".shims", "bun.exe"),
      join(f.root, "missing", "bun.exe"),
    ])
      assert.throws(
        () => pinnedTool(f.root, "bun", { ...env, TEAMAGENT_BUN_PATH: override }),
        /Invalid physical/,
      );
    await writeFile(join(f.root, ".bun-version"), "1.4.999\n", "utf8");
    assert.throws(() => toolchainPins(f.root), /pins disagree/);
    await writeFile(
      join(f.root, "package.json"),
      JSON.stringify({ ...f.manifest, engines: { bun: "1.4.999" } }) + "\n",
      "utf8",
    );
    assert.throws(() => pinnedTool(f.root, "bun", env), /Expected bun 1\.4\.999/);
    assert.throws(
      () =>
        pinnedTool(
          f.root,
          "bun",
          { PATH: "", MISE_INSTALLS_DIR: undefined },
          { inheritOverride: false },
        ),
      /Missing physical bun 1\.4\.999; install the pinned tool or supply an explicit per-call runtime path/u,
    );
    assert.throws(
      () => pinnedTool(f.root, "bun", { PATH: "", MISE_INSTALLS_DIR: undefined }),
      /Missing physical bun 1\.4\.999; install the pinned tool or set TEAMAGENT_BUN_PATH/u,
    );
    await writeFile(join(f.root, "package.json"), " ".repeat(1024 * 1024 + 1), "utf8");
    assert.throws(() => toolchainPins(f.root), /bounded regular/);
  } finally {
    await f.close();
  }
});

await test("toolchain PATH normalization preserves inherited values without injecting receipt-key controls", () => {
  const first = resolve("first"),
    second = resolve("second");
  const env = {
    PATH: `${first}${delimiter}${second}`,
    Path: `${second}${delimiter}${first}`,
    KEEP: "value",
  };
  const before = { ...env };
  const next = prependToolPath(env, [first]);
  assert.deepEqual(next, { PATH: `${first}${delimiter}${second}`, KEEP: "value" });
  assert.deepEqual(env, before);
  const current = currentBunEnvironment(env);
  assert.equal(current.TEAMAGENT_BUN_PATH, undefined);
  assert.equal(current.TEAMAGENT_AUBE_PATH, undefined);
  assert.equal(current.KEEP, "value");
  assert.equal(
    current.PATH?.split(delimiter)[0],
    dirname(physicalToolPath(process.execPath, "bun")),
  );
});

if (process.platform === "win32")
  await test("Windows pinned launcher preserves literal arguments, exit status and parent path without adding environment controls", async () => {
    const f = await fixture();
    try {
      await mkdir(join(f.root, "app"));
      await writeFile(
        join(f.root, "app/toolchain.ps1"),
        await readFile(join(repository, "app/toolchain.ps1")),
      );
      await writeFile(
        join(f.root, "probe.ts"),
        'import { dirname } from "node:path";\nprocess.stdout.write(JSON.stringify({ args: process.argv.slice(2), bun: process.versions.bun, fullPath: process.env.PATH === dirname(process.execPath) + ";" + process.env.FIXTURE_PARENT_PATH, executable: process.execPath, injected: process.env.TEAMAGENT_BUN_PATH ?? null }) + "\\n"); process.exit(7);\n',
        "utf8",
      );
      const env = { ...process.env };
      Reflect.deleteProperty(env, "TEAMAGENT_BUN_PATH");
      Reflect.deleteProperty(env, "TEAMAGENT_AUBE_PATH");
      const before = { ...env };
      const tools = await nativeToolIdentity(repository);
      const driver = join(f.root, "forward.ps1");
      await writeFile(
        driver,
        "param([string] $Mode, [string] $Tool, [string] $ConfiguredBunPath)\nif ($Mode -eq 'Legacy') { $PSNativeCommandArgumentPassing = 'Legacy' }\n$env:FIXTURE_PARENT_PATH = $env:PATH\n& (Join-Path $PSScriptRoot 'app/toolchain.ps1') -Tool $Tool -ConfiguredBunPath $ConfiguredBunPath @args\nexit $LASTEXITCODE\n",
        "utf8",
      );
      const literal = ["space value", "$(literal)", "", 'x"y', "trailing space\\"];
      const physical = physicalToolPath(process.execPath, "bun");
      for (const mode of ["Default", "Legacy"]) {
        const result = spawnSync(
          tools.powershell,
          [
            "-NoLogo",
            "-NoProfile",
            "-NonInteractive",
            "-File",
            driver,
            "-Mode",
            mode,
            "-Tool",
            "bun",
            "-ConfiguredBunPath",
            physical,
            join(f.root, "probe.ts"),
            ...literal,
          ],
          {
            cwd: f.root,
            env,
            windowsHide: true,
            shell: false,
            timeout: 15000,
            maxBuffer: 65536,
            encoding: "utf8",
          },
        );
        assert.equal(result.error, undefined);
        assert.equal(result.status, 7, result.stderr);
        const observed: unknown = JSON.parse(result.stdout);
        assert.deepEqual(observed, {
          args: literal,
          bun: "1.4.2",
          fullPath: true,
          executable: physical,
          injected: null,
        });
      }
      assert.deepEqual(env, before);
    } finally {
      await f.close();
    }
  });

if (process.platform === "win32")
  await test("shim-only tools resolve through offline Mise on native and PowerShell launch paths", async () => {
    const f = await fixture();
    try {
      const binaries = join(f.root, "mise-bin");
      const shims = join(f.root, ".shims");
      const installed = join(f.root, "installed tools");
      for (const directory of [binaries, shims, installed, join(f.root, "app")])
        await mkdir(directory);
      const compiler = join(
        process.env.SystemRoot ?? "C:\\Windows",
        "Microsoft.NET/Framework64/v4.0.30319/csc.exe",
      );
      const mise = join(binaries, "mise.exe");
      const build = spawnSync(
        compiler,
        [
          "/nologo",
          "/noconfig",
          "/target:exe",
          "/out:" + mise,
          join(repository, "test/mise-which-fixture.cs"),
        ],
        { cwd: f.root, encoding: "utf8", windowsHide: true, timeout: 15000 },
      );
      assert.equal(build.status, 0, build.stderr + build.stdout);
      for (const name of ["bun.exe", "aube.exe"]) {
        await copyFile(mise, join(installed, name));
        await writeFile(join(shims, name), "refuse this shim");
      }
      const launcher = join(f.root, "app/toolchain.ps1");
      await copyFile(join(repository, "app/toolchain.ps1"), launcher);
      const env: NodeJS.ProcessEnv = {
        ...process.env,
        PATH: [shims, binaries].join(delimiter),
        MISE_AUTO_INSTALL: "true",
        MISE_OFFLINE: "false",
        Npm_Config_Manage_Package_Manager_Versions: "true",
        FIXTURE_TOOLS: installed,
      };
      const ignored = [
        "MISE_INSTALLS_DIR",
        "TEAMAGENT_BUN_PATH",
        "TEAMAGENT_AUBE_PATH",
        "FIXTURE_MISE_RESULT",
      ];
      for (const key of Object.keys(env)) {
        if (ignored.includes(key.toUpperCase()) || (key.toLowerCase() === "path" && key !== "PATH"))
          delete env[key];
      }
      const selected = pinnedTool(f.root, "aube", env);
      assert.equal(selected, physicalToolPath(join(installed, "aube.exe"), "aube"));
      const managed = join(f.root, "aube", "2.5.1", ".mise-bins");
      await mkdir(managed, { recursive: true });
      await copyFile(mise, join(managed, "aube.exe"));
      assert.equal(
        pinnedTool(f.root, "aube", { ...env, MISE_INSTALLS_DIR: f.root }),
        physicalToolPath(join(managed, "aube.exe"), "aube"),
      );
      assert.throws(
        () => pinnedTool(f.root, "aube", { ...env, FIXTURE_MISE_RESULT: join(shims, "aube.exe") }),
        /shim/,
      );
      assert.throws(
        () => pinnedTool(f.root, "aube", { ...env, FIXTURE_MISE_RESULT: "relative.exe" }),
        /absolute/,
      );
      assert.throws(
        () => pinnedTool(f.root, "aube", { ...env, TEAMAGENT_AUBE_PATH: "missing" }),
        /override/,
      );
      assert.equal(
        pinnedTool(
          f.root,
          "aube",
          { ...env, TEAMAGENT_AUBE_PATH: "foreign" },
          { inheritOverride: false },
        ),
        selected,
      );
      const { powershell } = await nativeToolIdentity(repository);
      const bootstrap = spawnSync(
        powershell,
        [
          "-NoLogo",
          "-NoProfile",
          "-NonInteractive",
          "-File",
          launcher,
          "-Tool",
          "aube",
          "literal argument",
        ],
        { cwd: f.root, env, encoding: "utf8", windowsHide: true, timeout: 15000 },
      );
      assert.equal(bootstrap.status, 0, bootstrap.stderr + bootstrap.stdout);
      assert.equal(bootstrap.stdout.trim(), "aube physical");
      const hook = join(f.root, "hook.ps1");
      await writeFile(
        hook,
        "& (Join-Path $PSScriptRoot 'app/toolchain.ps1') -Tool aube -ConfiguredBunPath $null 'literal argument'\nexit $LASTEXITCODE\n",
        "utf8",
      );
      const unconfigured = spawnSync(
        powershell,
        ["-NoLogo", "-NoProfile", "-NonInteractive", "-File", hook],
        { cwd: f.root, env, encoding: "utf8", windowsHide: true, timeout: 15000 },
      );
      assert.equal(unconfigured.status, 0, unconfigured.stderr + unconfigured.stdout);
      assert.equal(unconfigured.stdout.trim(), "aube physical");
    } finally {
      await f.close();
    }
  });
