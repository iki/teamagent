import { assertTemporaryFixture, mkdtemp } from "./temporary.ts";
import { expect, test } from "bun:test";
import { rejects } from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, realpath, rename, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { delimiter, dirname, join, resolve } from "node:path";
import { encodedDigest } from "../app/check/cache-io.ts";
import {
  hashExecutable,
  nativeToolIdentity,
  resolveVerificationTool,
  resolveWindowsGitLauncher,
  verificationEnvironment,
} from "../app/check/tool-prerequisites.ts";

async function fixture(run: (root: string) => Promise<void>): Promise<void> {
  const parent = resolve(tmpdir());
  const root = await mkdtemp(join(parent, "teamagent-git-layout-"));
  try {
    await run(root);
  } finally {
    await assertTemporaryFixture(root);
    await rm(root, { recursive: true, force: true });
  }
}

async function installation(root: string, runtime = "ucrt64") {
  const core = join(root, runtime, "libexec/git-core");
  const launcher = join(root, "cmd/git.exe");
  const payload = join(core, "git.exe");
  await mkdir(core, { recursive: true });
  await mkdir(dirname(launcher), { recursive: true });
  await writeFile(launcher, "fixture launcher\n", { mode: 0o755 });
  await writeFile(payload, "fixture core\n", { mode: 0o755 });
  return { core, launcher, payload };
}

test("Windows Git launcher and core entry points resolve to the same inspected installation", async () => {
  await fixture(async (root) => {
    for (const runtime of ["ucrt64", "mingw64", "mingw32"]) {
      const layout = await installation(join(root, runtime), runtime);
      const probe = () => layout.core;
      const canonical = await realpath(layout.launcher);
      expect(await resolveWindowsGitLauncher(root, layout.launcher, probe)).toBe(canonical);
      expect(await resolveWindowsGitLauncher(root, layout.payload, probe)).toBe(canonical);
      const launcherHash = await hashExecutable(layout.launcher);
      const coreHash = await hashExecutable(layout.payload);
      await writeFile(layout.launcher, "changed launcher\n");
      expect(await hashExecutable(layout.launcher)).not.toBe(launcherHash);
      expect(await hashExecutable(layout.payload)).toBe(coreHash);
      await writeFile(layout.payload, "changed core\n");
      expect(await hashExecutable(layout.payload)).not.toBe(coreHash);
    }
  });
});

test("Windows Git normalization rejects unknown layouts, malformed paths and mismatched launchers", async () => {
  await fixture(async (root) => {
    const layout = await installation(join(root, "first"));
    const other = await installation(join(root, "other"));
    for (const path of ["relative/core", layout.core + "\nextra", layout.core + "\0extra"])
      await rejects(
        resolveWindowsGitLauncher(root, layout.payload, () => path),
        /absolute path/,
      );
    await rejects(
      resolveWindowsGitLauncher(root, layout.payload, () => root),
      /Unsupported Git-for-Windows/,
    );
    await rejects(
      resolveWindowsGitLauncher(root, layout.payload, (command) =>
        command === layout.payload ? layout.core : other.core,
      ),
      /do not match/,
    );
    await rm(layout.launcher);
    await rejects(
      resolveWindowsGitLauncher(root, layout.payload, () => layout.core),
      {
        code: "ENOENT",
      },
    );
  });
});

test("Windows Git normalization refuses linked executable locations", async () => {
  await fixture(async (root) => {
    const layout = await installation(root);
    const retained = join(root, "original-cmd");
    await rename(dirname(layout.launcher), retained);
    await symlink(retained, dirname(layout.launcher), "junction");
    await rejects(
      resolveWindowsGitLauncher(root, layout.payload, () => layout.core),
      /Linked Git-for-Windows/,
    );
  });
});

test("actual verification uses the same launcher when Git prepends its core directory", async () => {
  const root = process.cwd();
  const before = encodedDigest(Object.entries(process.env).sort(([a], [b]) => a.localeCompare(b)));
  const environment = await verificationEnvironment(root);
  expect(encodedDigest(Object.entries(process.env).sort(([a], [b]) => a.localeCompare(b)))).toBe(
    before,
  );
  const values = (value: Record<string, string | undefined>) =>
    encodedDigest(
      Object.entries(value)
        .filter(([name]) => name.toLowerCase() !== "path")
        .sort(([a], [b]) => a.localeCompare(b)),
    );
  expect(values(environment)).toBe(values(process.env));
  if (process.platform !== "win32") {
    expect(environment.PATH).toBe(process.env.PATH);
    return;
  }
  const launcher = await resolveVerificationTool("git", root);
  const result = spawnSync(launcher, ["--exec-path"], {
    cwd: root,
    encoding: "utf8",
    windowsHide: true,
    shell: false,
    timeout: 15_000,
    maxBuffer: 16384,
  });
  expect(result.error).toBeUndefined();
  expect(result.status).toBe(0);
  const core = result.stdout.trim();
  const originalPath = process.env.PATH;
  try {
    process.env.PATH = environment.PATH;
    const direct = await nativeToolIdentity(root);
    process.env.PATH = core + delimiter + (originalPath ?? "");
    expect(await resolveVerificationTool("git", root)).toBe(launcher);
    const normalized = await verificationEnvironment(root);
    expect(normalized.PATH?.split(delimiter)[0]).toBe(dirname(launcher));
    expect(values(normalized)).toBe(values(process.env));
    process.env.PATH = normalized.PATH;
    expect((await nativeToolIdentity(root)).identity).toBe(direct.identity);
    expect((await verificationEnvironment(root)).PATH).toBe(normalized.PATH);
  } finally {
    if (originalPath === undefined) Reflect.deleteProperty(process.env, "PATH");
    else process.env.PATH = originalPath;
  }
}, 30_000);
