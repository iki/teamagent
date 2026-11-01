import { assertTemporaryFixture, mkdtemp } from "./temporary.ts";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
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
    assert.throws(() => toolVersionOutput("aube", "2.5.1\nunexpected"));
    const env = { ...process.env, TEAMAGENT_BUN_PATH: process.execPath };
    assert.equal(pinnedTool(f.root, "bun", env), physicalToolPath(process.execPath, "bun"));
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
        'process.stdout.write(JSON.stringify({ args: process.argv.slice(2), bun: process.versions.bun, injected: process.env.TEAMAGENT_BUN_PATH ?? null }) + "\\n"); process.exit(7);\n',
        "utf8",
      );
      const env = { ...process.env };
      Reflect.deleteProperty(env, "TEAMAGENT_BUN_PATH");
      Reflect.deleteProperty(env, "TEAMAGENT_AUBE_PATH");
      const before = { ...env };
      const tools = await nativeToolIdentity(repository);
      const result = spawnSync(
        tools.powershell,
        [
          "-NoLogo",
          "-NoProfile",
          "-NonInteractive",
          "-File",
          join(f.root, "app/toolchain.ps1"),
          "-Tool",
          "bun",
          "-ConfiguredBunPath",
          process.execPath,
          join(f.root, "probe.ts"),
          "space value",
          "$(literal)",
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
        args: ["space value", "$(literal)"],
        bun: "1.4.2",
        injected: null,
      });
      assert.deepEqual(env, before);
    } finally {
      await f.close();
    }
  });
