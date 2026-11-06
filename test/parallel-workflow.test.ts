import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdir, readFile, readdir, symlink, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { taskKey } from "../app/workflow/storage.ts";
import {
  assertIntegrationWorkspace,
  assertParallelRegistry,
  parallelName,
} from "../app/workflow/parallel-store.ts";
import {
  parallelFixture,
  parallelIdentity,
  startParallelTask as start,
} from "./parallel-workflow-fixture.ts";

await test("parallel starts share one canonical cache root and preserve task identity and existing work", async () => {
  const f = await parallelFixture();
  await writeFile(join(f.repo, "owned.txt"), "Unrelated main work\n");
  const first = await start(f, "first");
  const second = await start(f, "second", first.path);
  const expectedRoot = resolve(f.repo, ".cache/worktrees");
  assert.equal(resolve(dirname(first.path)), expectedRoot);
  assert.equal(resolve(dirname(second.path)), expectedRoot);
  assert.notEqual(first.path, second.path);
  assert.notEqual(first.branch, second.branch);
  assert.equal(first.base, f.base);
  assert.equal(second.base, f.base);
  assert.equal((await start(f, "first", second.path)).path, first.path);
  assert.equal(f.installations.length, 2, "An exact start retry does not reinstall");
  await f.assertSource(f.repo, "owned.txt", "Unrelated main work\n");
  await f.assertSource(first.path, "owned.txt", "before\n");
  const before = await f.rawGit(f.repo)(["worktree", "list", "--porcelain"]);
  for (const name of ["../escape", "nested/path", "C:\\outside", ".", "Mixed", ""])
    await assert.rejects(f.call({ operation: "start", taskId: "invalid", name }));
  assert.equal(await f.rawGit(f.repo)(["worktree", "list", "--porcelain"]), before);
  const sameName = (await f.call({ operation: "start", taskId: "different-task", name: "first" }))
    .entry;
  assert.notEqual(sameName.path, first.path, "Distinct tasks may reuse a descriptive name");
  assert.notEqual(sameName.branch, first.branch);
  await assert.rejects(f.call({ operation: "start", taskId: "first", name: "renamed" }));
  await assert.rejects(
    assertIntegrationWorkspace(f.git(f.repo), first, f.repo, f.git(f.repo), true),
  );
  const target = join(dirname(f.repo), "redirect-target");
  await mkdir(target);
  await symlink(
    target,
    join(expectedRoot, parallelName("linked", parallelIdentity.sessionId, "linked")),
    process.platform === "win32" ? "junction" : "dir",
  );
  await assert.rejects(f.call({ operation: "start", taskId: "linked", name: "linked" }));
  assert.deepEqual(await readdir(target), [], "A redirected candidate never receives files");
  const record = join(
    f.repo,
    ".git/teamagent-parallel/entries",
    taskKey(parallelIdentity.sessionId, "first") + ".json",
  );
  const original = await readFile(record);
  await assert.rejects(assertParallelRegistry(f.git(f.repo), 0, { bytes: 1 }), /capacity/iu);
  assert.deepEqual(await readFile(record), original, "A full registry retains its task evidence");
  await assertParallelRegistry(f.git(f.repo));
  assert.equal(f.pushes().length, 0, "Starting work does not publish empty branches");
});
