import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  access,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { hostname } from "node:os";
import { basename, join, relative, resolve, sep } from "node:path";
import { test } from "node:test";
import {
  borrowTemporaryWorkspace,
  createTemporaryWorkspace,
  pruneTemporaryWorkspaces,
  temporaryLimits,
  temporaryParent,
  temporaryRootPath,
} from "../app/check/temporary-workspace.ts";

async function fixture() {
  const base = resolve(import.meta.dir, "../.cache/verification");
  await mkdir(base, { recursive: true });
  const root = await mkdtemp(join(base, "temporary-case-"));
  return {
    root,
    async close() {
      const child = relative(base, root);
      assert.ok(child && child !== ".." && !child.startsWith(`..${sep}`));
      assert.equal(await realpath(root), root);
      assert.equal((await lstat(root)).isSymbolicLink(), false);
      await rm(root, { recursive: true, force: true });
    },
  };
}

await test("temporary ownership isolates environment, preserves siblings and separates borrowing from disposal", async () => {
  const f = await fixture();
  try {
    const owner = await createTemporaryWorkspace(f.root, "first");
    assert.equal(owner.path.startsWith(join(f.root, temporaryRootPath) + sep), true);
    const sibling = await createTemporaryWorkspace(f.root, "second");
    await writeFile(join(sibling.path, "sentinel.txt"), "preserve\n", "utf8");
    const base = {
      Path: "tools",
      Temp: "old",
      TEAMAGENT_TEMPORARY_ROOT: "old-root",
      teamagent_temporary_parent: "old",
      TEAMAGENT_TEMPORARY_PARENT_ID: "old",
    };
    const actual = owner.environment(base);
    assert.deepEqual(actual, {
      Path: "tools",
      TEMP: owner.path,
      TMP: owner.path,
      TMPDIR: owner.path,
      TEAMAGENT_TEMPORARY_ROOT: f.root,
      TEAMAGENT_TEMPORARY_PARENT: owner.path,
      TEAMAGENT_TEMPORARY_PARENT_ID: owner.token,
    });
    assert.equal(base.Temp, "old");
    assert.equal(await temporaryParent({}, f.root), undefined);
    const parent = await temporaryParent(actual, f.root);
    assert.equal(parent?.path, owner.path);
    const borrowed = await borrowTemporaryWorkspace(f.root, owner.path, owner.token);
    assert.equal(Object.hasOwn(borrowed, "dispose"), false);
    const nested = await createTemporaryWorkspace(f.root, "nested", borrowed);
    assert.equal(nested.environment().TEAMAGENT_TEMPORARY_PARENT, owner.path);
    await nested.dispose();
    await access(owner.path);
    await Promise.all([owner.dispose(), owner.dispose()]);
    await assert.rejects(access(owner.path));
    assert.equal(await readFile(join(sibling.path, "sentinel.txt"), "utf8"), "preserve\n");
    await sibling.dispose();
  } finally {
    await f.close();
  }
});

await test("temporary borrowing rejects incomplete, conflicting, foreign and redirected ownership", async () => {
  const f = await fixture();
  try {
    const owner = await createTemporaryWorkspace(f.root, "borrow");
    await assert.rejects(temporaryParent({ TEAMAGENT_TEMPORARY_PARENT: owner.path }, f.root));
    await assert.rejects(
      temporaryParent(
        { ...owner.environment(), teamagent_temporary_parent: join(f.root, "different") },
        f.root,
      ),
    );
    await assert.rejects(borrowTemporaryWorkspace(f.root, owner.path, "invalid"));
    await assert.rejects(
      borrowTemporaryWorkspace(f.root, `${owner.path}/../${basename(owner.path)}`, owner.token),
    );
    const foreignRoot = join(f.root, "foreign-project");
    await mkdir(foreignRoot);
    await assert.rejects(temporaryParent(owner.environment(), foreignRoot));
    const marker = join(owner.path, ".owner.json");
    const saved = await readFile(marker, "utf8");
    const legacy = join(f.root, ".cache/temporary", basename(owner.path));
    await mkdir(legacy, { recursive: true });
    await writeFile(join(legacy, ".owner.json"), saved, "utf8");
    await assert.rejects(borrowTemporaryWorkspace(f.root, legacy, owner.token));
    await assert.rejects(
      temporaryParent({ ...owner.environment(), TEAMAGENT_TEMPORARY_PARENT: legacy }, f.root),
    );
    assert.equal(await readFile(join(legacy, ".owner.json"), "utf8"), saved);
    await writeFile(
      marker,
      `${JSON.stringify({ version: 1, token: owner.token, host: "foreign-host", pid: process.pid, createdAt: Date.now() })}\n`,
      "utf8",
    );
    await assert.rejects(borrowTemporaryWorkspace(f.root, owner.path, owner.token));
    await assert.rejects(owner.dispose());
    await writeFile(marker, saved, "utf8");
    const outside = join(f.root, "outside");
    await mkdir(outside);
    await writeFile(join(outside, "sentinel.txt"), "preserve\n", "utf8");
    await owner.dispose();
    await symlink(outside, owner.path, process.platform === "win32" ? "junction" : "dir");
    await assert.rejects(borrowTemporaryWorkspace(f.root, owner.path, owner.token));
    assert.equal(await readFile(join(outside, "sentinel.txt"), "utf8"), "preserve\n");
  } finally {
    await f.close();
  }
});

await test("dead temporary owners cannot be borrowed by stale environments or fresh child scopes", async () => {
  const f = await fixture();
  try {
    const ended = spawnSync(process.execPath, ["--version"], {
      shell: false,
      windowsHide: true,
      encoding: "utf8",
      timeout: 5000,
      maxBuffer: 1024,
    });
    assert.equal(ended.error, undefined);
    assert.equal(ended.status, 0);
    assert.ok(Number.isSafeInteger(ended.pid) && ended.pid > 0);
    assert.throws(() => process.kill(ended.pid, 0), { code: "ESRCH" });
    const owner = await createTemporaryWorkspace(f.root, "stale");
    const marker = join(owner.path, ".owner.json");
    await writeFile(
      marker,
      `${JSON.stringify({ version: 1, token: owner.token, host: hostname(), pid: ended.pid, createdAt: Date.now() - 86_400_001 })}\n`,
      "utf8",
    );
    await assert.rejects(
      borrowTemporaryWorkspace(f.root, owner.path, owner.token),
      /affirmatively alive/u,
    );
    await assert.rejects(temporaryParent(owner.environment(), f.root), /affirmatively alive/u);
    await assert.rejects(createTemporaryWorkspace(f.root, "child", owner), /affirmatively alive/u);
    await access(owner.path);
  } finally {
    await f.close();
  }
});

await test("scratch removal never follows child links and refuses redirected parents or changed markers", async () => {
  const f = await fixture();
  try {
    const owner = await createTemporaryWorkspace(f.root, "links");
    const outside = join(f.root, "outside");
    await mkdir(outside);
    await writeFile(join(outside, "sentinel.txt"), "preserve\n", "utf8");
    await symlink(
      outside,
      join(owner.path, "link"),
      process.platform === "win32" ? "junction" : "dir",
    );
    await owner.dispose();
    assert.equal(await readFile(join(outside, "sentinel.txt"), "utf8"), "preserve\n");
    const corrupt = await createTemporaryWorkspace(f.root, "corrupt");
    const marker = join(corrupt.path, ".owner.json");
    const saved = await readFile(marker, "utf8");
    for (const value of [
      "{}\n",
      "x".repeat(temporaryLimits.markerBytes + 1),
      saved.replace('"version":1', '"version":2'),
      saved.replace('"version":1', '"extra":true,"version":1'),
    ]) {
      await writeFile(marker, value, "utf8");
      await assert.rejects(corrupt.dispose());
      await access(corrupt.path);
    }
    await writeFile(marker, saved, "utf8");
    await corrupt.dispose();
    const redirected = await createTemporaryWorkspace(f.root, "parent");
    // Remove only known fixture-owned state before replacing its parent with a link.
    await redirected.dispose();
    const parent = join(f.root, temporaryRootPath);
    await rm(parent, { recursive: true });
    await symlink(outside, parent, process.platform === "win32" ? "junction" : "dir");
    await assert.rejects(createTemporaryWorkspace(f.root, "redirected"));
    assert.equal(await readFile(join(outside, "sentinel.txt"), "utf8"), "preserve\n");
  } finally {
    await f.close();
  }
});

await test("explicit recovery preserves old live, reused, foreign, malformed and unknown leases", async () => {
  const f = await fixture();
  try {
    const now = Date.now();
    const leases = await Promise.all(
      ["dead", "live", "foreign", "unknown", "newer", "fresh"].map((label) =>
        createTemporaryWorkspace(f.root, label),
      ),
    );
    const dead = leases[0];
    assert.ok(dead);
    for (const lease of leases) {
      await writeFile(
        join(lease.path, ".owner.json"),
        `${JSON.stringify({ version: lease.path.includes("-newer-") ? 2 : 1, token: lease.token, host: lease.path.includes("-foreign-") ? "another-host" : hostname(), pid: lease.path.includes("-dead-") ? 1 : lease.path.includes("-unknown-") ? 2 : process.pid, createdAt: lease.path.includes("-fresh-") ? now : now - 86_400_001 })}\n`,
        "utf8",
      );
    }
    const unmarked = join(f.root, temporaryRootPath, "historical-fixture");
    await mkdir(unmarked);
    await writeFile(join(unmarked, "evidence.txt"), "preserve\n", "utf8");
    // Creating another lease must not trigger abandoned-state cleanup.
    const latest = await createTemporaryWorkspace(f.root, "latest");
    await access(dead.path);
    const result = await pruneTemporaryWorkspaces(f.root, {
      now,
      isAlive: (pid) => (pid === 1 ? false : pid === 2 ? undefined : true),
    });
    assert.deepEqual(result.removed, [dead.path]);
    assert.equal(result.preserved, 7);
    assert.equal(await readFile(join(unmarked, "evidence.txt"), "utf8"), "preserve\n");
    for (const lease of leases.slice(1)) await access(lease.path);
    await latest.dispose();
  } finally {
    await f.close();
  }
});

await test(
  "recovery bounds the directory inventory before deleting any lease",
  { timeout: 30_000 },
  async () => {
    const f = await fixture();
    try {
      const owner = await createTemporaryWorkspace(f.root, "old");
      const now = Date.now();
      await writeFile(
        join(owner.path, ".owner.json"),
        `${JSON.stringify({ version: 1, token: owner.token, host: hostname(), pid: 1, createdAt: now - 86_400_001 })}\n`,
        "utf8",
      );
      const parent = join(f.root, temporaryRootPath);
      for (let offset = 0; offset < temporaryLimits.entries; offset += 32) {
        await Promise.all(
          Array.from({ length: Math.min(32, temporaryLimits.entries - offset) }, (_, index) =>
            writeFile(join(parent, `unknown-${offset + index}`), "", "utf8"),
          ),
        );
      }
      await assert.rejects(
        pruneTemporaryWorkspaces(f.root, { now, isAlive: () => false }),
        /inventory bounds/u,
      );
      await access(owner.path);
    } finally {
      await f.close();
    }
  },
);
