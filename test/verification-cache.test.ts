import { assertTemporaryFixture, mkdtemp } from "./temporary.ts";
import { expect, test } from "bun:test";
import { rejects } from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  mkdir,
  readdir,
  readFile,
  rm,
  symlink,
  writeFile,
  open,
  lstat,
  realpath,
  rename,
  appendFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  checkStagedVerificationCache,
  inputIdentity,
  invalidateCachedTask,
  runCachedTask,
  verificationCacheStatus,
  type CacheTask,
} from "../app/check/input-cache.ts";
import { installedPackageIdentity } from "../app/check/installed-inputs.ts";
import { withCacheLock, encodedDigest } from "../app/check/cache-io.ts";
import {
  assertTrackedVerificationInputs,
  verificationTask,
} from "../app/check/verification-cache.ts";
import { unitEnvironment } from "../app/check/test-groups.ts";
import {
  prepareWebBuildEnvironment,
  runBuildStage,
  webBuildEnvironmentIdentity,
  webBuildEnvironmentFiles,
} from "../app/check/build-cache.ts";
import { version } from "../package.json";
import { testBatches, testConcurrency, scheduleTestBatches } from "../app/check/test-groups.ts";
import { diagnostic, runProcess } from "../app/workflow/process.ts";

function git(root: string, args: readonly string[]): string {
  const result = spawnSync(
    "git",
    [
      "-c",
      "user.name=Fixture",
      "-c",
      "user.email=fixture@example.invalid",
      "-c",
      "commit.gpgsign=false",
      "-c",
      "core.hooksPath=/no-fixture-hooks",
      ...args,
    ],
    { cwd: root, encoding: "utf8", windowsHide: true, timeout: 15_000, maxBuffer: 1024 * 1024 },
  );
  if (result.error || result.status !== 0) throw new Error("Fixture Git operation failed");
  return result.stdout;
}
const initialFiles = {
  ".gitattributes": "* text eol=lf\n",
  ".gitignore": ".cache/\noutput/\n",
  "input.ts": "export const value = 1;\n",
} as const;

let workerSeed: Promise<string> | undefined;

async function createSeed(): Promise<string> {
  const root = await mkdtemp("teamagent-verification-seed-");
  git(root, ["init", "--quiet"]);
  for (const [name, bytes] of Object.entries(initialFiles))
    await writeFile(join(root, name), bytes, { encoding: "utf8", flag: "wx" });
  git(root, ["add", "--", ...Object.keys(initialFiles)]);
  git(root, ["commit", "--quiet", "-m", "Initial fixture"]);
  // Only this unsigned initial history is shared. Tests receive separate managed clones.
  return root;
}

async function assertPrivateClone(root: string, seed: string): Promise<void> {
  const gitDirectory = join(root, ".git");
  const objects = join(gitDirectory, "objects");
  for (const name of ["alternates", "http-alternates"])
    await rejects(lstat(join(objects, "info", name)), { code: "ENOENT" });
  const pending = [objects];
  let entries = 0;
  for (const directory of pending) {
    const info = await lstat(directory);
    expect(info.isDirectory() && !info.isSymbolicLink()).toBe(true);
    for (const name of await readdir(directory)) {
      if (++entries > 64) throw new Error("Unexpected cache fixture object inventory");
      const child = join(directory, name);
      const entry = await lstat(child);
      if (entry.isDirectory() && !entry.isSymbolicLink()) pending.push(child);
      else expect(entry.isFile() && !entry.isSymbolicLink() && entry.nlink === 1).toBe(true);
    }
  }
  expect((await readdir(root)).sort()).toEqual([".git", ...Object.keys(initialFiles)].sort());
  for (const [name, bytes] of Object.entries(initialFiles)) {
    const path = join(root, name);
    const info = await lstat(path);
    expect(info.isFile() && !info.isSymbolicLink() && info.nlink === 1).toBe(true);
    expect(await readFile(path, "utf8")).toBe(bytes);
  }
  const config = await readFile(join(gitDirectory, "config"), "utf8");
  expect(config).not.toMatch(/^\s*\[remote\s|^\s*(?:remote|merge|fetch|url)\s*=/imu);
  expect(await readFile(join(gitDirectory, "HEAD"), "utf8")).toBe(
    await readFile(join(seed, ".git/HEAD"), "utf8"),
  );
  const remoteRefs = await readdir(join(gitDirectory, "refs/remotes"), {
    recursive: true,
    withFileTypes: true,
  }).catch((error: unknown) => {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") return [];
    throw error;
  });
  expect(remoteRefs.every((entry) => entry.isDirectory() && !entry.isSymbolicLink())).toBe(true);
  const refs = await readFile(join(gitDirectory, "packed-refs"), "utf8").catch((error: unknown) => {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") return "";
    throw error;
  });
  expect(refs).not.toContain("refs/remotes/");
}

async function fixture(): Promise<string> {
  const seed = await (workerSeed ??= createSeed());
  await assertTemporaryFixture(seed);
  const root = await mkdtemp("teamagent-verification-");
  git(root, ["clone", "--quiet", "--no-hardlinks", "--origin", "origin", "--", seed, "."]);
  git(root, ["remote", "remove", "origin"]);
  await assertPrivateClone(root, seed);
  return root;
}
const task: CacheTask = {
  id: "fixture",
  kind: "verification",
  inputs: ["input.ts"],
  values: ["fixture-v1"],
};

test("GitHub Actions executes every verification store while preserving local and build reuse", async () => {
  const root = await fixture();
  const probe = join(root, "actions-policy.ts");
  const moduleUrl = new URL("../app/check/input-cache.ts", import.meta.url).href;
  // Only this owned child changes its Actions flag; concurrent workers and the
  // outer verification runner keep their original trust policy.
  await writeFile(
    probe,
    `import assert from "node:assert/strict";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { runCachedTask, type CacheTask } from ${JSON.stringify(moduleUrl)};
const root = process.cwd();
assert.equal(process.env.GITHUB_ACTIONS, "true");
assert.equal(process.env.CI, "true");
for (const storage of ["tracked", "local", "nonportable"] as const) {
  const task: CacheTask = {
    id: "actions-" + storage,
    kind: "verification",
    inputs: ["input.ts"],
    ...(storage === "nonportable" ? { portable: false } : {}),
  };
  const options = {
    receiptWritePolicy: storage === "local" ? "local" as const : "tracked" as const,
    forceFresh: false,
  };
  let calls = 0;
  const run = async () => { calls++; };
  delete process.env.GITHUB_ACTIONS;
  const supplied = await runCachedTask(root, task, run, options);
  assert.equal(supplied.hit, false);
  assert.equal((await runCachedTask(root, task, run, options)).hit, true, "CI alone retains local reuse");
  process.env.GITHUB_ACTIONS = "true";
  for (let attempt = 0; attempt < 2; attempt++) {
    const result = await runCachedTask(root, task, run, options);
    assert.equal(result.key, supplied.key, "Actions rejection is independent of input changes");
    assert.equal(result.hit, false, storage + " receipt cannot skip an Actions check");
  }
  assert.equal(calls, 3, "Even earlier Actions success cannot skip a later check");
  await assert.rejects(runCachedTask(root, task, async () => {
    throw new Error("Actions must observe this failure");
  }, options), /Actions must observe/);
  process.env.GITHUB_ACTIONS = "false";
  assert.equal((await runCachedTask(root, task, run, options)).hit, false, "Failed Actions evidence stays rejected outside Actions");
  assert.equal((await runCachedTask(root, task, run, options)).hit, true, "Fresh local success restores ordinary reuse");
  assert.equal(calls, 4);
}
process.env.GITHUB_ACTIONS = "true";
const build: CacheTask = {
  id: "actions-build", kind: "build", inputs: ["input.ts"], outputs: ["output"],
};
let builds = 0;
const output = join(root, "output", "result.js");
const runBuild = async () => {
  builds++;
  await mkdir(join(root, "output"), { recursive: true });
  await writeFile(output, "export const complete = true;\\n");
};
assert.equal((await runCachedTask(root, build, runBuild)).hit, false);
assert.equal((await runCachedTask(root, build, runBuild)).hit, true);
assert.equal(builds, 1, "Actions leaves validated build-output reuse available");
await writeFile(output, "changed output\\n");
assert.equal((await runCachedTask(root, build, runBuild)).hit, false);
await rm(output);
assert.equal((await runCachedTask(root, build, runBuild)).hit, false);
assert.equal((await runCachedTask(root, build, runBuild, { forceFresh: true })).hit, false);
assert.equal(builds, 4, "Corrupt, absent and force-fresh build outputs execute again");
process.stdout.write("Actions cache policy verified\\n");
`,
    "utf8",
  );
  const result = await runProcess(root, process.execPath, [probe], {
    env: { ...process.env, GITHUB_ACTIONS: "true", CI: "true" },
    timeoutMs: 60_000,
    maximumBytes: 64 * 1024,
    maximumLineBytes: 8192,
  });
  expect(result.termination).toBe("closed");
  expect(result.outcome).toBe("exited");
  expect(result.code, diagnostic(result.stderr).slice(-4000)).toBe(0);
  expect(result.stdout).toBe("Actions cache policy verified\n");
});

test("local verification keeps Git clean and tracked mode promotes validated local success", async () => {
  const root = await fixture();
  let calls = 0;
  try {
    const run = async (): Promise<void> => {
      calls++;
    };
    const cold = await runCachedTask(root, task, run, { receiptWritePolicy: "local" });
    expect(cold.hit).toBe(false);
    expect((await runCachedTask(root, task, run, { receiptWritePolicy: "local" })).hit).toBe(true);
    expect(git(root, ["status", "--porcelain"])).toBe("");
    await rejects(readFile(join(root, ".verification/verification-fixture.json")), /ENOENT/u);
    const local = await readFile(join(root, ".cache/verification/verification-fixture.json"));
    expect(await runCachedTask(root, task, run, { receiptWritePolicy: "tracked" })).toEqual({
      hit: true,
      key: cold.key,
    });
    expect(calls).toBe(1);
    expect(await readFile(join(root, ".verification/verification-fixture.json"))).toEqual(local);
    git(root, ["add", ".verification"]);
    await checkStagedVerificationCache(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("tracked verification writes one store and takes precedence without rewriting either receipt", async () => {
  const root = await fixture();
  const trackedPath = join(root, ".verification/verification-fixture.json");
  const localPath = join(root, ".cache/verification/verification-fixture.json");
  try {
    await runCachedTask(root, task, async () => {}, { receiptWritePolicy: "tracked" });
    await rejects(readFile(localPath), /ENOENT/u);
    const tracked = `${await readFile(trackedPath, "utf8")}\n`;
    await writeFile(trackedPath, tracked, "utf8");
    await writeFile(localPath, tracked.trimEnd() + "\n", "utf8");
    const run = async (): Promise<void> => {
      throw new Error("Both stores describe a passing verification");
    };
    expect((await runCachedTask(root, task, run, { receiptWritePolicy: "tracked" })).hit).toBe(
      true,
    );
    expect((await runCachedTask(root, task, run, { receiptWritePolicy: "local" })).hit).toBe(true);
    expect(await readFile(trackedPath, "utf8")).toBe(tracked);
    expect(await readFile(localPath, "utf8")).toBe(tracked.trimEnd() + "\n");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("promotion preserves reordered and whitespace-formatted validated local receipt bytes", async () => {
  const root = await fixture();
  const localPath = join(root, ".cache/verification/verification-fixture.json");
  try {
    await runCachedTask(root, task, async () => {}, { receiptWritePolicy: "local" });
    const original = await readFile(localPath, "utf8");
    expect(original.startsWith('{"version":1,')).toBe(true);
    const reordered = original
      .replace('{"version":1,', "{\n  ")
      .replace(/\}\n$/u, ',\n  "version":1\n}\n');
    await writeFile(localPath, reordered, "utf8");
    const local = await readFile(localPath);
    const result = await runCachedTask(
      root,
      task,
      async () => {
        throw new Error("Valid local evidence must be promoted without executing again");
      },
      { receiptWritePolicy: "tracked" },
    );
    expect(result.hit).toBe(true);
    expect(await readFile(join(root, ".verification/verification-fixture.json"))).toEqual(local);
    expect(await readFile(localPath)).toEqual(local);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("promotion rejects non-LF receipt text without rewriting its original bytes", async () => {
  const root = await fixture();
  const localPath = join(root, ".cache/verification/verification-fixture.json");
  try {
    await runCachedTask(root, task, async () => {}, { receiptWritePolicy: "local" });
    const original = (await readFile(localPath, "utf8")).replaceAll("\n", "\r\n");
    await writeFile(localPath, original, "utf8");
    await rejects(
      runCachedTask(root, task, async () => {}, { receiptWritePolicy: "tracked" }),
      /promotion requires LF text/u,
    );
    await rejects(readFile(join(root, ".verification/verification-fixture.json")), /ENOENT/u);
    expect(await readFile(localPath, "utf8")).toBe(original);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("local receipts with undeclared fields cannot be reused or copied into tracked evidence", async () => {
  const root = await fixture();
  const localPath = join(root, ".cache/verification/verification-fixture.json");
  let calls = 0;
  try {
    await runCachedTask(root, task, async () => {}, { receiptWritePolicy: "local" });
    const original = await readFile(localPath, "utf8");
    const undeclared = original.replace('{"version":1,', '{"undeclared":"fixture","version":1,');
    await writeFile(localPath, undeclared, "utf8");
    const result = await runCachedTask(
      root,
      task,
      async () => {
        calls++;
      },
      { receiptWritePolicy: "tracked" },
    );
    expect(result.hit).toBe(false);
    expect(calls).toBe(1);
    expect(await readFile(join(root, ".verification/verification-fixture.json"), "utf8")).toBe(
      original,
    );
    expect(await readFile(localPath, "utf8")).toBe(undeclared);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("malformed tracked receipts fall back to valid local evidence but invalid local receipts rerun", async () => {
  const root = await fixture();
  const trackedPath = join(root, ".verification/verification-fixture.json");
  const localPath = join(root, ".cache/verification/verification-fixture.json");
  let calls = 0;
  try {
    const run = async (): Promise<void> => {
      calls++;
    };
    await runCachedTask(root, task, run, { receiptWritePolicy: "local" });
    await mkdir(join(root, ".verification"));
    await writeFile(trackedPath, "malformed tracked evidence\n", "utf8");
    expect((await runCachedTask(root, task, run, { receiptWritePolicy: "local" })).hit).toBe(true);
    expect(await readFile(trackedPath, "utf8")).toBe("malformed tracked evidence\n");
    const local = await readFile(localPath, "utf8");
    await writeFile(localPath, local.replace('"passed":true', '"passed":false'), "utf8");
    expect((await runCachedTask(root, task, run, { receiptWritePolicy: "local" })).hit).toBe(false);
    expect(calls).toBe(2);
    expect(await readFile(trackedPath, "utf8")).toBe("malformed tracked evidence\n");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("local promotion rejects source drift during final validation", async () => {
  const root = await fixture();
  try {
    await runCachedTask(root, task, async () => {}, { receiptWritePolicy: "local" });
    await rejects(
      runCachedTask(root, task, async () => {}, {
        receiptWritePolicy: "tracked",
        validate: async () => {
          await writeFile(join(root, "input.ts"), "export const value = 2;\n", "utf8");
        },
      }),
      /reuse validation/u,
    );
    await rejects(readFile(join(root, ".verification/verification-fixture.json")), /ENOENT/u);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

for (const laterOutcome of ["success", "failure"]) {
  test(`failed tracked evidence stays rejected across a later local ${laterOutcome}`, async () => {
    const root = await fixture();
    const trackedPath = join(root, ".verification/verification-fixture.json");
    let calls = 0;
    try {
      await runCachedTask(root, task, async () => {}, { receiptWritePolicy: "tracked" });
      const tracked = await readFile(trackedPath);
      const fail = async (): Promise<void> => {
        throw new Error("Failed fresh verification");
      };
      await rejects(
        runCachedTask(root, task, fail, { forceFresh: true, receiptWritePolicy: "local" }),
        /Failed fresh verification/u,
      );
      await writeFile(join(root, "input.ts"), "export const value = 2;\n", "utf8");
      if (laterOutcome === "success") {
        await runCachedTask(root, task, async () => {}, { receiptWritePolicy: "local" });
      } else {
        await rejects(runCachedTask(root, task, fail, { receiptWritePolicy: "local" }));
      }
      await writeFile(join(root, "input.ts"), "export const value = 1;\n", "utf8");
      expect(
        (
          await runCachedTask(
            root,
            task,
            async () => {
              calls++;
            },
            { receiptWritePolicy: "local" },
          )
        ).hit,
      ).toBe(false);
      expect(calls).toBe(1);
      expect(await readFile(trackedPath)).toEqual(tracked);
      expect((await runCachedTask(root, task, fail, { receiptWritePolicy: "local" })).hit).toBe(
        true,
      );
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
}

test("explicit invalidation rejects the current local key even when tracked evidence is stale", async () => {
  const root = await fixture();
  let calls = 0;
  try {
    const run = async (): Promise<void> => {
      calls++;
    };
    await runCachedTask(root, task, run, { receiptWritePolicy: "tracked" });
    const tracked = await readFile(join(root, ".verification/verification-fixture.json"));
    await writeFile(join(root, "input.ts"), "export const value = 2;\n", "utf8");
    await runCachedTask(root, task, run, { receiptWritePolicy: "local" });
    await invalidateCachedTask(root, task);
    expect((await runCachedTask(root, task, run, { receiptWritePolicy: "local" })).hit).toBe(false);
    expect(calls).toBe(3);
    expect(await readFile(join(root, ".verification/verification-fixture.json"))).toEqual(tracked);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("explicit invalidation rejects both retained receipt keys after source drift", async () => {
  const root = await fixture();
  let calls = 0;
  try {
    const run = async (): Promise<void> => {
      calls++;
    };
    await runCachedTask(root, task, run, { receiptWritePolicy: "tracked" });
    await writeFile(join(root, "input.ts"), "export const value = 2;\n", "utf8");
    await runCachedTask(root, task, run, { receiptWritePolicy: "local" });
    await writeFile(join(root, "input.ts"), "export const value = 3;\n", "utf8");
    await invalidateCachedTask(root, task);
    await writeFile(join(root, "input.ts"), "export const value = 1;\n", "utf8");
    expect((await runCachedTask(root, task, run, { receiptWritePolicy: "tracked" })).hit).toBe(
      false,
    );
    await writeFile(join(root, "input.ts"), "export const value = 2;\n", "utf8");
    expect((await runCachedTask(root, task, run, { receiptWritePolicy: "local" })).hit).toBe(false);
    expect(calls).toBe(4);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("explicit invalidation revokes retained evidence even when current inputs cannot be hashed", async () => {
  const root = await fixture();
  const input = join(root, "input.ts");
  let calls = 0;
  try {
    const run = async (): Promise<void> => {
      calls++;
    };
    await runCachedTask(root, task, run, { receiptWritePolicy: "tracked" });
    await writeFile(input, "export const value = 2;\n", "utf8");
    await runCachedTask(root, task, run, { receiptWritePolicy: "local" });
    await rm(input);
    await mkdir(input);
    await rejects(invalidateCachedTask(root, task), /Unsupported verification input/u);
    await rm(input, { recursive: true });
    await writeFile(input, "export const value = 1;\n", "utf8");
    expect((await runCachedTask(root, task, run, { receiptWritePolicy: "tracked" })).hit).toBe(
      false,
    );
    await writeFile(input, "export const value = 2;\n", "utf8");
    expect((await runCachedTask(root, task, run, { receiptWritePolicy: "local" })).hit).toBe(false);
    expect(calls).toBe(4);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("legacy rejections remain effective and bounded rejection overflow blocks retained evidence", async () => {
  const root = await fixture();
  const rejectionPath = join(root, ".cache/verification/rejected-verification-fixture.json");
  let calls = 0;
  try {
    const run = async (): Promise<void> => {
      calls++;
    };
    const saved = await runCachedTask(root, task, run, { receiptWritePolicy: "tracked" });
    await writeFile(rejectionPath, `${JSON.stringify({ key: saved.key })}\n`, "utf8");
    expect((await runCachedTask(root, task, run, { receiptWritePolicy: "local" })).hit).toBe(false);
    expect(calls).toBe(2);
    const keys = Array.from({ length: 256 }, (_, index) => encodedDigest(["rejected", index]));
    await writeFile(rejectionPath, `${JSON.stringify({ version: 2, keys })}\n`, "utf8");
    await rejects(
      runCachedTask(
        root,
        task,
        async () => {
          throw new Error("Fresh failure must not revive retained evidence");
        },
        { forceFresh: true, receiptWritePolicy: "local" },
      ),
      /rejection history exceeds bounds/u,
    );
    expect(await readFile(rejectionPath, "utf8")).toBe('{"version":2,"blocked":true}\n');
    await rejects(
      runCachedTask(root, task, run, { receiptWritePolicy: "local" }),
      /history is blocked/u,
    );
    expect(calls).toBe(3);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("cache reuses unchanged bytes, force-fresh executes, and a failed fresh run invalidates reuse", async () => {
  const root = await fixture();
  let calls = 0;
  try {
    const run = async (): Promise<void> => {
      calls++;
    };
    expect((await runCachedTask(root, task, run)).hit).toBe(false);
    expect((await runCachedTask(root, task, run)).hit).toBe(true);
    expect((await runCachedTask(root, task, run, { forceFresh: true })).hit).toBe(false);
    expect(calls).toBe(2);
    await rejects(
      runCachedTask(
        root,
        task,
        async () => {
          throw new Error("fixture failure");
        },
        { forceFresh: true },
      ),
      /fixture failure/u,
    );
    expect((await runCachedTask(root, task, run)).hit).toBe(false);
    const receipt = await readFile(join(root, ".verification/verification-fixture.json"), "utf8");
    expect(receipt.length).toBeLessThan(2048);
    expect(receipt).not.toContain(root);
    expect(receipt).not.toContain("\r");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("working byte identity catches CRLF, assumed-unchanged edits and execution helper changes", async () => {
  const root = await fixture();
  try {
    const before = await inputIdentity(root, task);
    git(root, ["update-index", "--assume-unchanged", "input.ts"]);
    await writeFile(join(root, "input.ts"), "export const value = 1;\r\n", "utf8");
    expect((await inputIdentity(root, task)).key).not.toBe(before.key);
    await writeFile(join(root, "input.ts"), "export const value = 1;\n", "utf8");
    await mkdir(join(root, "app/check"), { recursive: true });
    await writeFile(join(root, "app/check/helper.ts"), "export const helper = 1;\n", "utf8");
    expect((await inputIdentity(root, { ...task, excludeInputs: ["app/check"] })).key).not.toBe(
      before.key,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("runtime argument changes invalidate otherwise identical cache inputs", async () => {
  const root = await fixture();
  const argumentsBefore = [...process.execArgv];
  try {
    const before = await inputIdentity(root, task);
    process.execArgv.push("--conditions=verification-fixture");
    expect((await inputIdentity(root, task)).key).not.toBe(before.key);
  } finally {
    process.execArgv.splice(0, process.execArgv.length, ...argumentsBefore);
    await rm(root, { recursive: true, force: true });
  }
});

test("Python fingerprint binds provisioned source/bytecode and restricts launcher aliases and bytecode mode", () => {
  const python =
    process.env.TEAMAGENT_TEST_PYTHON ??
    join(
      import.meta.dir,
      "../.cache/import-python",
      process.platform === "win32" ? "Scripts/python.exe" : "bin/python",
    );
  const result = spawnSync(
    python,
    [
      "-B",
      "-c",
      `
import hashlib, importlib.util, os, pathlib, tempfile
from unittest.mock import patch
spec = importlib.util.spec_from_file_location("prerequisites", os.environ["TEAMAGENT_ALIAS_HELPER"])
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
base = pathlib.Path("fixture").absolute()
alias = base / "python3.exe"
selected = {base / "python.exe"}
first, second = hashlib.sha256(), hashlib.sha256()
with patch.object(module.os, "readlink", return_value="foreign-one.exe") as readlink:
    assert module.record_unexecuted_launcher_alias(alias, base, selected, first, "nt")
    readlink.assert_called_once_with(alias)
with patch.object(module.os, "readlink", return_value="foreign-two.exe"):
    assert module.record_unexecuted_launcher_alias(alias, base, selected, second, "nt")
assert first.digest() != second.digest()
with patch.object(module.os, "readlink", side_effect=AssertionError("Unexpected link read")):
    assert not module.record_unexecuted_launcher_alias(alias, base, {alias}, first, "nt")
    assert not module.record_unexecuted_launcher_alias(base / "other.exe", base, selected, first, "nt")
    assert not module.record_unexecuted_launcher_alias(base / "nested/python3.exe", base, selected, first, "nt")
    assert not module.record_unexecuted_launcher_alias(alias, base, selected, first, "posix")
with patch.object(module.sys, "dont_write_bytecode", True), patch.object(module.sys, "pycache_prefix", None):
    module.check_bytecode_mode()
for writing, prefix in [(False, None), (True, "external-prefix")]:
    with patch.object(module.sys, "dont_write_bytecode", writing), patch.object(module.sys, "pycache_prefix", prefix):
        try:
            module.check_bytecode_mode()
            raise AssertionError("Unsupported bytecode mode was accepted")
        except RuntimeError:
            pass
with tempfile.TemporaryDirectory(prefix="teamagent-python-identity-") as directory:
    for name in ["source.py", "compiled.pyc"]:
        path = pathlib.Path(directory) / name
        path.write_bytes(b"return 1\\n")
        before = path.stat()
        first = module.file_content_identity(path, before)
        path.write_bytes(b"return 2\\n")
        os.utime(path, ns=(before.st_atime_ns, before.st_mtime_ns))
        assert path.stat().st_mtime_ns == before.st_mtime_ns
        assert module.file_content_identity(path, path.stat()) != first
`,
    ],
    {
      encoding: "utf8",
      timeout: 15_000,
      maxBuffer: 16_384,
      windowsHide: true,
      env: {
        ...process.env,
        TEAMAGENT_ALIAS_HELPER: join(import.meta.dir, "../app/check/python-prerequisites.py"),
      },
    },
  );
  expect(result.error).toBeUndefined();
  expect(result.status).toBe(0);
  expect(result.stderr).toBe("");
});

test("Python prerequisite rejection emits LF bytes without importing converters", async () => {
  const prefix = await mkdtemp(join(tmpdir(), "teamagent-python-prefix-"));
  try {
    const python =
      process.env.TEAMAGENT_TEST_PYTHON ??
      join(
        import.meta.dir,
        "../.cache/import-python",
        process.platform === "win32" ? "Scripts/python.exe" : "bin/python",
      );
    const result = spawnSync(python, ["-B", "app/check/python-prerequisites.py"], {
      encoding: "utf8",
      timeout: 15_000,
      maxBuffer: 16_384,
      windowsHide: true,
      env: { ...process.env, PYTHONPYCACHEPREFIX: prefix },
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("read-only provisioned bytecode");
    expect(result.stderr).not.toContain("\r");
    expect(result.stderr.endsWith("\n")).toBe(true);
  } finally {
    await rm(prefix, { recursive: true, force: true });
  }
});

test("staged receipts reject mismatched index without changing it and support an explicit alternate index", async () => {
  const root = await fixture();
  try {
    await runCachedTask(root, task, async () => {});
    git(root, ["add", ".verification"]);
    const before = await readFile(join(root, ".git/index"));
    await checkStagedVerificationCache(root);
    expect(await readFile(join(root, ".git/index"))).toEqual(before);
    const alternate = join(root, ".git/fixture-index");
    await writeFile(alternate, before);
    await writeFile(join(root, "input.ts"), "export const value = 2;\n", "utf8");
    git(root, ["add", "input.ts"]);
    await rejects(checkStagedVerificationCache(root), /Staged receipt/u);
    await checkStagedVerificationCache(root, { indexFile: alternate });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("tracked success is portable to a fresh local clone and has Git history provenance", async () => {
  const root = await fixture();
  const seed = await workerSeed;
  if (!seed) throw new Error("Missing verification fixture seed");
  const seedCommit = git(seed, ["rev-parse", "--verify", "HEAD"]).trim();
  const seedIndex = await readFile(join(seed, ".git/index"));
  const copy = await mkdtemp("teamagent-verification-copy-");
  try {
    await runCachedTask(root, task, async () => {});
    git(root, ["add", ".verification"]);
    git(root, ["commit", "--quiet", "-m", "Fixture verification"]);
    git(root, ["clone", "--quiet", "--no-hardlinks", root, copy]);
    expect(
      (
        await runCachedTask(copy, task, async () => {
          throw new Error("Should reuse cloned success");
        })
      ).hit,
    ).toBe(true);
    const status = await verificationCacheStatus(copy, "fixture");
    expect(status.repositoryInputsMatch).toBe(true);
    expect(status.commit).toMatch(/^[a-f0-9]{40}$/u);
    expect(status.commit).not.toBe(seedCommit);
    expect(git(seed, ["rev-parse", "--verify", "HEAD"]).trim()).toBe(seedCommit);
    expect(await readFile(join(seed, ".git/index"))).toEqual(seedIndex);
    expect(await readFile(join(seed, "input.ts"), "utf8")).toBe(initialFiles["input.ts"]);
    await rejects(lstat(join(seed, ".verification")), { code: "ENOENT" });
  } finally {
    await rm(root, { recursive: true, force: true });
    await rm(copy, { recursive: true, force: true });
  }
});

test("build reuse validates complete output bytes and ignored explicit inputs", async () => {
  const root = await fixture();
  let calls = 0;
  const build: CacheTask = {
    ...task,
    kind: "build",
    outputs: ["output"],
    externalInputs: [".cache/resource.txt"],
  };
  try {
    await mkdir(join(root, ".cache"), { recursive: true });
    await writeFile(join(root, ".cache/resource.txt"), "one\n", "utf8");
    const run = async (): Promise<void> => {
      calls++;
      await mkdir(join(root, "output"), { recursive: true });
      await writeFile(join(root, "output/result.txt"), "result\n", "utf8");
    };
    await runCachedTask(root, build, run);
    expect((await runCachedTask(root, build, run)).hit).toBe(true);
    await writeFile(join(root, "output/result.txt"), "corrupt\n", "utf8");
    expect((await runCachedTask(root, build, run)).hit).toBe(false);
    await writeFile(join(root, ".cache/resource.txt"), "two\n", "utf8");
    expect((await runCachedTask(root, build, run)).hit).toBe(false);
    await rm(join(root, "output/result.txt"));
    expect((await runCachedTask(root, build, run)).hit).toBe(false);
    expect(calls).toBe(4);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("build keys preserve raw locale and reject locale drift during execution or reuse", async () => {
  const root = await fixture();
  const saved = ["LANG", "LC_ALL"].map((name) => [name, process.env[name]] as const);
  let calls = 0;
  try {
    await writeFile(join(root, "package.json"), '{"version":"1"}\n', "utf8");
    process.env.LANG = "C";
    process.env.LC_ALL = "C";
    const stage = {
      id: "build-locale-fixture",
      inputs: ["input.ts"],
      outputs: ["output"],
    };
    const run = async (): Promise<void> => {
      calls++;
      await mkdir(join(root, "output"), { recursive: true });
      await writeFile(
        join(root, "output/result.txt"),
        `${process.env.LANG}\n${process.env.LC_ALL}\n`,
        "utf8",
      );
    };
    const execute = () => runBuildStage(root, stage, run, { enabled: true });
    const first = await execute();
    expect(first.hit).toBe(false);
    expect((await execute()).hit).toBe(true);
    expect(await readFile(join(root, "output/result.txt"), "utf8")).toBe("C\nC\n");
    process.env.LANG = "cs_CZ.UTF-8";
    const changedLanguage = await execute();
    expect(changedLanguage.hit).toBe(false);
    expect(changedLanguage.key).not.toBe(first.key);
    process.env.LC_ALL = "cs_CZ.UTF-8";
    const changedLocale = await execute();
    expect(changedLocale.hit).toBe(false);
    expect(changedLocale.key).not.toBe(changedLanguage.key);
    expect(await readFile(join(root, "output/result.txt"), "utf8")).toBe(
      "cs_CZ.UTF-8\ncs_CZ.UTF-8\n",
    );
    await rejects(
      runBuildStage(
        root,
        stage,
        async () => {
          process.env.LC_ALL = "C";
          await run();
        },
        { enabled: true, forceFresh: true },
      ),
      /Build prerequisites changed/u,
    );
    process.env.LC_ALL = "cs_CZ.UTF-8";
    expect((await execute()).hit).toBe(false);
    const beforeRejectedHit = calls;
    await rejects(
      runBuildStage(root, stage, run, {
        enabled: true,
        validate: async () => {
          process.env.LANG = "C";
        },
      }),
      /Build prerequisites changed/u,
    );
    expect(calls).toBe(beforeRejectedHit);
    process.env.LANG = "cs_CZ.UTF-8";
    expect((await execute()).hit).toBe(false);
    expect(calls).toBe(6);
  } finally {
    for (const [name, value] of saved) {
      if (value === undefined) Reflect.deleteProperty(process.env, name);
      else process.env[name] = value;
    }
    await rm(root, { recursive: true, force: true });
  }
}, 30_000);

test("Vite defaults precede build keys while exact ignored dotenv inputs and later mutations remain guarded", async () => {
  const root = await fixture();
  const names = [
    "NODE_ENV",
    "VITE_USER_NODE_ENV",
    "VITE_CACHE_FIXTURE_UNEXPECTED",
    "CACHE_FIXTURE_SUFFIX",
    "DEBUG",
  ];
  const saved = names.map((name) => [name, process.env[name]] as const);
  let calls = 0;
  try {
    for (const name of names) Reflect.deleteProperty(process.env, name);
    await mkdir(join(root, "app/web"), { recursive: true });
    await writeFile(join(root, "package.json"), '{"version":"1"}\n', "utf8");
    await writeFile(join(root, ".gitignore"), ".cache/\noutput/\n.env*\n", "utf8");
    await prepareWebBuildEnvironment(root);
    expect(process.env.NODE_ENV).toBe("production");
    process.env.NODE_ENV = "";
    await writeFile(
      join(root, "app/web/.env.production.local"),
      "NODE_ENV=development\nVITE_CACHE_FIXTURE_VALUE=first\n",
      "utf8",
    );
    await prepareWebBuildEnvironment(root);
    expect(process.env.NODE_ENV).toBe("development");
    process.env.NODE_ENV = "explicit-fixture";
    await prepareWebBuildEnvironment(root);
    expect(process.env.NODE_ENV).toBe("explicit-fixture");
    const stage = {
      id: "web-environment-fixture",
      inputs: ["input.ts"],
      outputs: ["output"],
      externalInputs: webBuildEnvironmentFiles,
    };
    const run = async (): Promise<void> => {
      calls++;
      // Pinned Vite's default assignment is now a no-op for the keyed environment.
      if (!process.env.NODE_ENV) process.env.NODE_ENV = "production";
      await mkdir(join(root, "output"), { recursive: true });
      await writeFile(join(root, "output/result.txt"), "result\n", "utf8");
    };
    const execute = async (callback = run, forceFresh = false, beforeValidation?: () => void) => {
      const environmentIdentity = await prepareWebBuildEnvironment(root);
      return runBuildStage(root, { ...stage, values: [environmentIdentity] }, callback, {
        enabled: true,
        forceFresh,
        validate: async () => {
          beforeValidation?.();
          if ((await webBuildEnvironmentIdentity(root)) !== environmentIdentity)
            throw new Error("Resolved Vite environment changed during preparation");
        },
      });
    };
    expect((await execute()).hit).toBe(false);
    expect((await execute()).hit).toBe(true);
    await writeFile(
      join(root, "app/web/.env.production.local"),
      "NODE_ENV=development\nVITE_CACHE_FIXTURE_VALUE=second\n",
      "utf8",
    );
    expect((await execute()).hit).toBe(false);
    expect(calls).toBe(2);
    await writeFile(
      join(root, "app/web/.env.production.local"),
      "NODE_ENV=development\nVITE_CACHE_FIXTURE_VALUE=${CACHE_FIXTURE_SUFFIX}\n",
      "utf8",
    );
    process.env.CACHE_FIXTURE_SUFFIX = "first-expanded";
    expect((await execute()).hit).toBe(false);
    process.env.CACHE_FIXTURE_SUFFIX = "second-expanded";
    expect((await execute()).hit).toBe(false);
    const beforeRejectedHit = calls;
    await rejects(
      execute(run, false, () => {
        process.env.CACHE_FIXTURE_SUFFIX = "unexpected-hit-change";
      }),
      /Resolved Vite environment changed/u,
    );
    expect(calls).toBe(beforeRejectedHit);
    process.env.CACHE_FIXTURE_SUFFIX = "second-expanded";
    expect((await execute()).hit).toBe(false);
    await rejects(
      execute(async () => {
        process.env.CACHE_FIXTURE_SUFFIX = "unexpected-build-change";
        await run();
      }, true),
      /Resolved Vite environment changed/u,
    );
    process.env.CACHE_FIXTURE_SUFFIX = "second-expanded";
    expect((await execute()).hit).toBe(false);
    await rejects(
      execute(async () => {
        process.env.VITE_CACHE_FIXTURE_UNEXPECTED = "changed";
        await run();
      }, true),
      /prerequisites changed/u,
    );
    await writeFile(join(root, "app/web/.env.unreviewed"), "FIXTURE=unreviewed\n", "utf8");
    expect(() => assertTrackedVerificationInputs(root)).toThrow("Ignored file");
  } finally {
    for (const [name, value] of saved) {
      if (value === undefined) Reflect.deleteProperty(process.env, name);
      else process.env[name] = value;
    }
    await rm(root, { recursive: true, force: true });
  }
}, 30_000);

test("Vite environment debug logging is rejected before secret expansion or import", async () => {
  const root = await mkdtemp(join(tmpdir(), "teamagent-vite-debug-"));
  const marker = "fixture-secret-must-not-be-logged";
  try {
    await mkdir(join(root, "app/web"), { recursive: true });
    await writeFile(
      join(root, "app/web/.env.production.local"),
      "VITE_FIXTURE_SECRET=${CACHE_FIXTURE_SECRET}\n",
      "utf8",
    );
    const entry = join(root, "debug-fixture.ts");
    await writeFile(
      entry,
      `import { prepareWebBuildEnvironment } from ${JSON.stringify(import.meta.resolve("../app/check/build-cache.ts"))};\nawait prepareWebBuildEnvironment(${JSON.stringify(root)});\n`,
      "utf8",
    );
    const result = spawnSync(process.execPath, [entry], {
      encoding: "utf8",
      windowsHide: true,
      timeout: 10_000,
      maxBuffer: 128 * 1024,
      env: { ...process.env, DEBUG: "vite:env", CACHE_FIXTURE_SECRET: marker },
    });
    expect(result.error).toBeUndefined();
    expect(result.status).not.toBe(0);
    expect(result.stdout + result.stderr).toContain("requires DEBUG to be unset");
    expect(result.stdout + result.stderr).not.toContain(marker);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("traversal, linked outputs, oversized inputs and mid-run edits never yield reusable success", async () => {
  const root = await fixture();
  const external = await mkdtemp(join(tmpdir(), "teamagent-verification-outside-"));
  try {
    await rejects(inputIdentity(root, { ...task, inputs: ["../outside"] }), /relative/u);
    await rejects(inputIdentity(root, { ...task, inputs: [".GIT/config"] }), /relative/u);
    await rejects(
      runCachedTask(root, { ...task, kind: "build", outputs: [".Verification"] }, async () => {}),
      /cannot contain/u,
    );
    await symlink(
      external,
      join(root, "output"),
      process.platform === "win32" ? "junction" : "dir",
    );
    await rejects(
      runCachedTask(root, { ...task, kind: "build", outputs: ["output"] }, async () => {}),
      /Linked/u,
    );
    const file = await open(join(root, "input.ts"), "w");
    await file.truncate(64 * 1024 ** 2 + 1);
    await file.close();
    await rejects(inputIdentity(root, task), /bounds/u);
    await writeFile(join(root, "input.ts"), "before\n", "utf8");
    await rejects(
      runCachedTask(root, task, async () => {
        await writeFile(join(root, "input.ts"), "after\n", "utf8");
      }),
      /changed during/u,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
    await rm(external, { recursive: true, force: true });
  }
});

test("same-task cache callers serialize and only one runs unchanged work", async () => {
  const root = await fixture();
  let calls = 0;
  try {
    const run = async (): Promise<void> => {
      calls++;
      await new Promise<void>((done) => setTimeout(done, 30));
    };
    const results = await Promise.all([
      runCachedTask(root, task, run),
      runCachedTask(root, task, run),
    ]);
    expect(calls).toBe(1);
    expect(
      results.map((result) => result.hit).sort((left, right) => Number(left) - Number(right)),
    ).toEqual([false, true]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("installed identity binds actual package API bytes and transitive resolution", async () => {
  const root = await mkdtemp(join(tmpdir(), "teamagent-installed-"));
  try {
    await writeFile(
      join(root, "package.json"),
      '{"version":"1","dependencies":{"fixture":"1.0.0"}}\n',
      "utf8",
    );
    await mkdir(join(root, "node_modules/fixture"), { recursive: true });
    await writeFile(
      join(root, "node_modules/fixture/package.json"),
      '{"name":"fixture","version":"1.0.0","main":"index.js","dependencies":{"leaf":"1.0.0"}}\n',
      "utf8",
    );
    await writeFile(join(root, "node_modules/fixture/index.js"), "module.exports=1;\n", "utf8");
    await mkdir(join(root, "node_modules/leaf"), { recursive: true });
    await writeFile(
      join(root, "node_modules/leaf/package.json"),
      '{"name":"leaf","version":"1.0.0"}\n',
      "utf8",
    );
    await writeFile(join(root, "node_modules/leaf/index.js"), "module.exports=1;\n", "utf8");
    const before = await installedPackageIdentity(root);
    await writeFile(join(root, "node_modules/fixture/index.js"), "module.exports=2;\n", "utf8");
    expect(await installedPackageIdentity(root)).not.toBe(before);
    const changedEntry = await installedPackageIdentity(root);
    await writeFile(join(root, "node_modules/leaf/index.js"), "module.exports=2;\n", "utf8");
    expect(await installedPackageIdentity(root)).not.toBe(changedEntry);
    const installedLeaf = await installedPackageIdentity(root);
    await rm(join(root, "node_modules/leaf/package.json"));
    const absentLeaf = await installedPackageIdentity(root);
    expect(absentLeaf).not.toBe(installedLeaf);
    await writeFile(
      join(root, "node_modules/leaf/package.json"),
      '{"name":"leaf","version":"1.0.0"}\n',
      "utf8",
    );
    expect(await installedPackageIdentity(root)).not.toBe(absentLeaf);
    await rm(join(root, "node_modules/fixture/package.json"));
    await rejects(installedPackageIdentity(root), /Missing provisioned/u);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

async function installedFixture(withLeaf = false): Promise<string> {
  const root = await realpath(await mkdtemp(join(tmpdir(), "teamagent-installed-identity-")));
  await writeFile(
    join(root, "package.json"),
    JSON.stringify({
      version: "1",
      dependencies: {
        fixture: "1.0.0",
        ...(withLeaf ? { leaf: "1.0.0" } : {}),
      },
    }) + "\n",
    "utf8",
  );
  for (const name of withLeaf ? ["fixture", "leaf"] : ["fixture"]) {
    await mkdir(join(root, "node_modules", name), { recursive: true });
    await writeFile(
      join(root, "node_modules", name, "package.json"),
      JSON.stringify({
        name,
        version: "1.0.0",
        description: "first",
        ...(withLeaf && name === "fixture" ? { dependencies: { leaf: "1.0.0" } } : {}),
      }) + "\n",
      "utf8",
    );
    await writeFile(
      join(root, "node_modules", name, "entry.js"),
      "x".repeat(128 * 1024) + "\n",
      "utf8",
    );
  }
  return root;
}

test("installed identity retains the original mode-prefix, DFS and row digest representation", async () => {
  const root = await installedFixture();
  try {
    const files: string[][] = [];
    for (const name of ["entry.js", "package.json"]) {
      const path = join(root, "node_modules/fixture", name);
      const mode = (await lstat(path)).mode & 0o777;
      files.push([
        name,
        createHash("sha256")
          .update(`${mode}\0`)
          .update(await readFile(path))
          .digest("hex"),
      ]);
    }
    const legacy = encodedDigest([
      ["package-0", "fixture@1.0.0", encodedDigest(files)],
      ["project", "fixture", "package-0"],
    ]);
    expect(await installedPackageIdentity(root)).toBe(legacy);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test.each([
  ["manifest", "grow"],
  ["manifest", "truncate"],
  ["manifest", "replace"],
  ["content", "grow"],
  ["content", "truncate"],
  ["content", "replace"],
  ["manifest", "replace-before-open"],
  ["content", "replace-before-open"],
] as const)(
  "installed %s read rejects real-file %s races and closes its handle",
  async (kind, action) => {
    const root = await installedFixture();
    const target = await realpath(
      join(root, "node_modules/fixture", kind === "manifest" ? "package.json" : "entry.js"),
    );
    const original = await readFile(target);
    let changed = false;
    let closed = false;
    try {
      await rejects(
        installedPackageIdentity(root, async (event) => {
          if (event.path !== target || event.kind !== kind) return;
          if (event.phase === "closed") closed = true;
          const phase = action === "replace-before-open" ? "before-open" : "after-read";
          if (changed || event.phase !== phase) return;
          changed = true;
          if (action === "grow") await appendFile(target, "\n", "utf8");
          else if (action === "truncate") {
            const file = await open(target, "r+");
            try {
              await file.truncate(0);
            } finally {
              await file.close();
            }
          } else {
            await rename(target, `${target}.replaced`);
            await writeFile(target, original);
          }
        }),
        /changed (?:before opening|while reading|during fingerprinting)/u,
      );
      expect(changed).toBe(true);
      expect(closed).toBe(true);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  },
);

test("parsed installed manifests must match their later hashed package inventory", async () => {
  const root = await installedFixture();
  const target = await realpath(join(root, "node_modules/fixture/package.json"));
  let changed = false;
  try {
    await rejects(
      installedPackageIdentity(root, async (event) => {
        if (
          changed ||
          event.path !== target ||
          event.kind !== "manifest" ||
          event.phase !== "closed"
        )
          return;
        changed = true;
        await writeFile(target, (await readFile(target, "utf8")).replace("first", "other"), "utf8");
      }),
      /Parsed installed metadata differs/u,
    );
    expect(changed).toBe(true);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("revisited manifests cannot change bytes while retaining their earlier graph node", async () => {
  const root = await installedFixture(true);
  const target = await realpath(join(root, "node_modules/leaf/package.json"));
  let changed = false;
  try {
    await rejects(
      installedPackageIdentity(root, async (event) => {
        if (
          changed ||
          event.path !== target ||
          event.kind !== "content" ||
          event.phase !== "closed"
        )
          return;
        changed = true;
        await writeFile(target, (await readFile(target, "utf8")).replace("first", "other"), "utf8");
      }),
      /metadata changed across graph traversal/u,
    );
    expect(changed).toBe(true);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("old or foreign cache locks are never stolen by age", async () => {
  const root = await mkdtemp(join(tmpdir(), "teamagent-cache-lock-"));
  try {
    await mkdir(join(root, ".cache/verification"), { recursive: true });
    const owner = '{"pid":123,"hostname":"foreign","token":"retained","started":0}\n';
    await writeFile(join(root, ".cache/verification/fixture.lock"), owner, "utf8");
    let ran = false;
    await rejects(
      withCacheLock(
        root,
        "fixture",
        async () => {
          ran = true;
        },
        { waitMs: 0 },
      ),
      /Inspect ownership/u,
    );
    expect(ran).toBe(false);
    expect(await readFile(join(root, ".cache/verification/fixture.lock"), "utf8")).toBe(owner);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("cache hits reject source changes during final prerequisite validation", async () => {
  const root = await fixture();
  try {
    await runCachedTask(root, task, async () => {});
    let executed = false;
    await rejects(
      runCachedTask(
        root,
        task,
        async () => {
          executed = true;
        },
        {
          validate: async () => {
            await writeFile(join(root, "input.ts"), "changed during validation\n", "utf8");
          },
        },
      ),
      /reuse validation/u,
    );
    expect(executed).toBe(false);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("test cache includes Python tools, skill templates and root file-policy inputs", async () => {
  const root = await fixture();
  try {
    await mkdir(join(root, "spec/tools"), { recursive: true });
    await mkdir(join(root, "skills/teamagent-memory"), { recursive: true });
    await writeFile(join(root, "spec/tools/validate.py"), "value = 1\n", "utf8");
    await writeFile(join(root, "skills/teamagent-memory/SKILL.md"), "# Original\n", "utf8");
    const definition = verificationTask("tests", []);
    const initial = await inputIdentity(root, definition);
    await writeFile(join(root, "spec/tools/validate.py"), "value = 2\n", "utf8");
    const changed = await inputIdentity(root, definition);
    expect(changed.key).not.toBe(initial.key);
    await writeFile(join(root, "skills/teamagent-memory/SKILL.md"), "# Changed\n", "utf8");
    expect((await inputIdentity(root, definition)).key).not.toBe(changed.key);
    for (const path of [".editorconfig", ".gitattributes", ".gitignore"]) {
      const before = await inputIdentity(root, definition);
      await writeFile(join(root, path), "# reviewed policy change\n", "utf8");
      expect((await inputIdentity(root, definition)).key).not.toBe(before.key);
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("ignored consumed sources fail closed even under binary output directories", async () => {
  const root = await fixture();
  try {
    await mkdir(join(root, "app/desktop/src-tauri/binaries"), { recursive: true });
    await writeFile(
      join(root, ".git/info/exclude"),
      "app/hidden.ts\napp/hidden.json\napp/desktop/src-tauri/binaries/\n",
      "utf8",
    );
    await writeFile(join(root, "app/hidden.ts"), "export const hidden = 1;\n", "utf8");
    expect(() => assertTrackedVerificationInputs(root)).toThrow("Ignored file");
    await rm(join(root, "app/hidden.ts"));
    await writeFile(join(root, "app/hidden.json"), "{}\n", "utf8");
    expect(() => assertTrackedVerificationInputs(root)).toThrow("Ignored file");
    await rm(join(root, "app/hidden.json"));
    await writeFile(
      join(root, "app/desktop/src-tauri/binaries/teamagent-daemon-test.exe"),
      "binary fixture\n",
      "utf8",
    );
    expect(() => assertTrackedVerificationInputs(root)).not.toThrow();
    await writeFile(join(root, "app/desktop/src-tauri/binaries/hidden.ts"), "export {};\n", "utf8");
    expect(() => assertTrackedVerificationInputs(root)).toThrow("Ignored file");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("ignored Python source bytecode is rejected instead of bypassing cache identity", async () => {
  const root = await fixture();
  try {
    await mkdir(join(root, "spec/tools/__pycache__"), { recursive: true });
    await writeFile(join(root, ".git/info/exclude"), "__pycache__/\n", "utf8");
    await writeFile(join(root, "spec/tools/validate.py"), "value = 1\n", "utf8");
    expect(() => assertTrackedVerificationInputs(root)).not.toThrow();
    await writeFile(
      join(root, "spec/tools/__pycache__/validate.cpython-312.pyc"),
      new Uint8Array([0, 1, 2]),
    );
    expect(() => assertTrackedVerificationInputs(root)).toThrow("Ignored file");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("unit child environment isolates Git indexes and Python bytecode without changing its parent", () => {
  const original = {
    GIT_DIR: "private-repo",
    GIT_INDEX_FILE: "private-index",
    GIT_CONFIG_COUNT: "1",
    GIT_CONFIG_KEY_0: "core.hooksPath",
    GIT_CONFIG_VALUE_0: "private-hooks",
    CUSTOM: "retained",
  };
  const env = unitEnvironment(original, "/owned/fresh-pycache");
  expect(env.GIT_DIR).toBeUndefined();
  expect(env.GIT_INDEX_FILE).toBeUndefined();
  expect(env.GIT_CONFIG_COUNT).toBeUndefined();
  expect(env.GIT_CONFIG_NOSYSTEM).toBe("1");
  expect(env.PYTHONDONTWRITEBYTECODE).toBe("1");
  expect(env.PYTHONPYCACHEPREFIX).toBe("/owned/fresh-pycache");
  expect(env.CUSTOM).toBe("retained");
  expect(original.GIT_INDEX_FILE).toBe("private-index");
});

test("check, cache and web build help/version stay passive with unavailable prerequisites", () => {
  for (const entry of ["app/check/index.ts", "app/check/cache.ts", "app/web/build.ts"])
    for (const flag of ["-h", "--help", "-V", "--version"]) {
      const result = spawnSync(process.execPath, [entry, flag], {
        encoding: "utf8",
        windowsHide: true,
        timeout: 10_000,
        maxBuffer: 256 * 1024,
        env: { ...process.env, TEAMAGENT_TEST_PYTHON: "/missing/fixture-python" },
      });
      expect(result.status).toBe(0);
      if (flag.includes("V") || flag.includes("version"))
        expect(result.stdout.trim()).toBe(version);
      else expect(result.stdout + result.stderr).toMatch(/usage:/iu);
      expect(result.stdout + result.stderr).not.toContain("prerequisite probe failed");
    }
}, 30_000);

test("audited groups cover every file once, preserve unknown order and fall back under resource pressure", async () => {
  const files = [
    "test/first.test.ts",
    "test/research-git.test.ts",
    "test/new.test.ts",
    "test/analysis-sync.test.ts",
    "test/workflow.test.ts",
    "test/verification-cache.test.ts",
  ];
  expect(
    testBatches(files)
      .flatMap((batch) => batch.files)
      .sort(),
  ).toEqual([...files].sort());
  expect(testBatches(files).at(0)?.files).toEqual(["test/first.test.ts", "test/new.test.ts"]);
  expect(testBatches(files, false).at(0)?.files).toEqual([
    "test/first.test.ts",
    "test/new.test.ts",
    "test/analysis-sync.test.ts",
    "test/verification-cache.test.ts",
  ]);
  expect(testBatches(files, false)).toHaveLength(3);
  expect(testBatches(files).map((batch) => batch.name)).toEqual([
    "remaining",
    "test/research-git.test.ts",
    "test/workflow.test.ts",
    "test/verification-cache.test.ts",
    "test/analysis-sync.test.ts",
  ]);
  expect(testBatches(["test/unknown.test.ts"])).toEqual([
    { name: "remaining", files: ["test/unknown.test.ts"] },
  ]);
  expect(testConcurrency({ cpus: 16, memoryBytes: 1.5 * 1024 ** 3 })).toBe(1);
  expect(testConcurrency({ cpus: 4, memoryBytes: 4 * 1024 ** 3 })).toBe(3);
  expect(testConcurrency({ cpus: Number.NaN, memoryBytes: 16 * 1024 ** 3 })).toBe(1);
  const seen: string[] = [];
  await scheduleTestBatches(files, 1, async (batch) => {
    seen.push(...batch.files);
  });
  expect(seen).toEqual(files);
  const finished: string[] = [];
  await rejects(
    scheduleTestBatches(files, 3, async (batch) => {
      finished.push(batch.name);
      if (batch.name === "remaining") throw new Error("expected");
    }),
    /failed/u,
  );
  expect(finished).toHaveLength(5);
  expect(finished.at(0)).toBe("remaining");
});

test("audited cache batch waits for a slot without exceeding the three-worker cap", async () => {
  const files = [
    "test/unknown.test.ts",
    "test/import-http-cache.test.ts",
    "test/research-git.test.ts",
    "test/workflow.test.ts",
    "test/analysis-sync.test.ts",
    "test/verification-cache.test.ts",
  ];
  const gates = new Map(
    testBatches(files).map((batch) => [batch.name, Promise.withResolvers<void>()] as const),
  );
  const analysisStarted = Promise.withResolvers<void>();
  const workflowStarted = Promise.withResolvers<void>();
  const cacheStarted = Promise.withResolvers<void>();
  const started: string[] = [];
  const completed: string[] = [];
  let active = 0;
  let maximum = 0;
  const finish = (name: string): void => {
    const gate = gates.get(name);
    if (!gate) throw new Error("Missing audited fixture batch");
    gate.resolve();
  };
  const scheduled = scheduleTestBatches(files, 3, async (batch) => {
    const gate = gates.get(batch.name);
    if (!gate) throw new Error("Unexpected audited fixture batch");
    maximum = Math.max(maximum, ++active);
    started.push(batch.name);
    if (batch.name === "test/workflow.test.ts") workflowStarted.resolve();
    if (batch.name === "test/analysis-sync.test.ts") analysisStarted.resolve();
    if (batch.name === "test/verification-cache.test.ts") cacheStarted.resolve();
    await gate.promise;
    completed.push(...batch.files);
    active--;
  });
  try {
    expect(started).toEqual(["remaining", "test/research-git.test.ts", "http-and-memory-cli"]);
    finish("http-and-memory-cli");
    await workflowStarted.promise;
    expect(started).not.toContain("test/verification-cache.test.ts");
    finish("test/research-git.test.ts");
    await cacheStarted.promise;
    expect(started).not.toContain("test/analysis-sync.test.ts");
    finish("test/verification-cache.test.ts");
    await analysisStarted.promise;
    expect(active).toBe(3);
    expect(maximum).toBe(3);
  } finally {
    for (const gate of gates.values()) gate.resolve();
    await scheduled;
  }
  expect(completed.sort()).toEqual([...files].sort());
  expect(active).toBe(0);
});
