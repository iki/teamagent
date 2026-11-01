import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmod, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { resolveVerificationTool } from "../app/check/tool-prerequisites.ts";
import { currentBunEnvironment } from "../app/check/toolchain.ts";
import { mkdtemp } from "./temporary.ts";

const repository = fileURLToPath(new URL("../", import.meta.url));

await test("real Git hooks reject missing or invalid configured Bun and preserve literal message arguments and exit status", async () => {
  const root = await mkdtemp("teamagent-git-hook-");
  const git = await resolveVerificationTool("git", repository);
  const env = currentBunEnvironment({
    ...process.env,
    TEAMAGENT_BUN_PATH: process.execPath,
    GIT_CONFIG_GLOBAL: process.platform === "win32" ? "NUL" : "/dev/null",
    GIT_CONFIG_NOSYSTEM: "1",
  });
  const run = (args: readonly string[]) =>
    spawnSync(git, args, {
      cwd: root,
      env,
      shell: false,
      windowsHide: true,
      timeout: 20000,
      maxBuffer: 65536,
      encoding: "utf8",
    });
  const setup = (args: readonly string[]) => {
    const result = run(args);
    assert.equal(result.error, undefined);
    assert.equal(result.status, 0, result.stderr);
  };
  setup(["init", "--template="]);
  setup(["config", "core.hooksPath", ".githooks"]);
  for (const file of [
    ".githooks/pre-commit",
    ".githooks/commit-msg",
    "app/hooks/git-launch.sh",
    "app/toolchain.ps1",
  ]) {
    await mkdir(dirname(join(root, file)), { recursive: true });
    await writeFile(join(root, file), await readFile(join(repository, file)));
    if (file.startsWith(".githooks/")) await chmod(join(root, file), 0o755);
  }
  await writeFile(join(root, ".bun-version"), "1.4.2\n", "utf8");
  await writeFile(
    join(root, "package.json"),
    JSON.stringify({ engines: { bun: "1.4.2" }, packageManager: "aube@2.5.1" }) + "\n",
    "utf8",
  );
  await writeFile(
    join(root, "app/hooks/git-launch.ts"),
    'process.stdout.write(JSON.stringify(process.argv.slice(2)) + "\\n"); process.exit(7);\n',
    "utf8",
  );
  const missing = run(["hook", "run", "pre-commit"]);
  assert.equal(missing.error, undefined);
  assert.equal(missing.status, 1);
  assert.match(missing.stderr, /Missing repository Bun configuration/);
  assert.equal(missing.stdout, "");
  for (const invalid of ["bun", join(root, ".shims", "bun.exe"), ""]) {
    setup(["config", "teamagent.bunPath", invalid]);
    const rejected = run(["hook", "run", "pre-commit"]);
    assert.equal(rejected.error, undefined);
    assert.equal(rejected.status, 1, rejected.stderr);
    assert.equal(rejected.stdout, "");
  }
  setup(["config", "teamagent.bunPath", process.execPath]);
  const argument = join(root, "message $(literal) with spaces.txt");
  const accepted = run(["hook", "run", "commit-msg", "--", argument]);
  assert.equal(accepted.error, undefined);
  assert.equal(accepted.status, 7, accepted.stderr);
  // Git forwards hook stdout to its own stderr; preserve the actual native protocol.
  assert.equal(accepted.stdout, "");
  const output: unknown = JSON.parse(accepted.stderr);
  assert.deepEqual(output, ["commit-msg", argument]);
});

await test("shared Git launcher rejects unsupported targets and arguments before running an adapter", () => {
  for (const args of [
    [],
    ["unknown"],
    ["pre-commit", "unexpected"],
    ["commit-msg"],
    ["commit-msg", "bad\npath"],
  ]) {
    const result = spawnSync(
      process.execPath,
      [join(repository, "app/hooks/git-launch.ts"), ...args],
      {
        cwd: repository,
        shell: false,
        windowsHide: true,
        timeout: 10000,
        maxBuffer: 65536,
        encoding: "utf8",
      },
    );
    assert.equal(result.error, undefined);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Expected pre-commit or commit-msg/);
    assert.equal(result.stdout, "");
  }
});
