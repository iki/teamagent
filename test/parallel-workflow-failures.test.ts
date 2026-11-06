import assert from "node:assert/strict";
import { test } from "node:test";
import { lstat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { installPreparedCandidate } from "../app/workflow/parallel-install.ts";
import {
  parallelFixture,
  startParallelTask as start,
  parallelTaskStatus as status,
} from "./parallel-workflow-fixture.ts";

await test(
  "conflicts, failed verification and changed source refs retain evidence without publication",
  { timeout: 180_000 },
  async () => {
    const f = await parallelFixture();
    const conflict = await start(f, "conflict");
    const failed = await start(f, "failed");
    const moved = await start(f, "moved");
    const publications = await Promise.allSettled([
      f.publish(conflict.path, "conflict", "owned.txt", "Task conflict\n"),
      f.publish(failed.path, "failed", "extra.txt", "Separate task\n"),
    ]);
    const failures: unknown[] = [];
    for (const publication of publications) {
      if (publication.status === "rejected") failures.push(publication.reason);
    }
    if (failures.length) throw new AggregateError(failures, "Independent task publications failed");
    const main = await f.advanceMain("owned.txt", "Main conflict\n");
    await assert.rejects(f.call({ operation: "prepare", taskId: "conflict" }));
    const conflictState = await status(f, "conflict");
    assert.equal(conflictState.state, "failed");
    assert.ok(conflictState.workspace);
    assert.equal((await lstat(conflictState.workspace)).isDirectory(), true);
    assert.equal(await f.main(), main);
    await f.call({ operation: "prepare", taskId: "failed" });
    f.beforeVerify(async () => {
      throw new Error("Fixture combined-source review failure");
    });
    const before = f.pushes().length;
    await assert.rejects(f.call({ operation: "integrate", taskId: "failed" }));
    const failure = await status(f, "failed");
    assert.equal(failure.state, "failed");
    assert.ok(failure.workspace);
    assert.equal((await lstat(failure.workspace)).isDirectory(), true);
    assert.equal(f.pushes().length, before);
    assert.equal(await f.main(), main);
    // Reuse this retained, owned candidate to exercise installer staging without
    // creating another signed fixture or changing its failed workflow state.
    const candidate = f.rawGit(failure.workspace);
    const sourceTree = (await candidate(["write-tree"])).trim();
    await assert.rejects(
      installPreparedCandidate(failure.workspace, candidate, async (root) => {
        await writeFile(join(root, "extra.txt"), "Unexpected staged installer change\n");
        await candidate(["add", "--", "extra.txt"]);
      }),
      /Frozen installation changed the source candidate/u,
    );
    assert.notEqual((await candidate(["write-tree"])).trim(), sourceTree);
    assert.equal((await status(f, "failed")).state, "failed");
    await f.assertSource(failed.path, "extra.txt", "Separate task\n");
    assert.equal(f.pushes().length, before);
    f.beforeVerify(async () => {});
    const fetchesBeforeMovedPublication = f.fetches().length;
    await f.publish(moved.path, "moved", "moved.txt", "Reviewed task\n");
    assert.ok(
      f.fetches().length > fetchesBeforeMovedPublication,
      "Advanced-main publication still fetches and checks ancestry",
    );
    await writeFile(join(moved.path, "moved.txt"), "Later unreviewed source\n");
    const git = f.rawGit(moved.path);
    await git(["add", "--", "moved.txt"]);
    await git(["commit", "--gpg-sign", "-m", "test: Move the published task ref"]);
    await git(["push", "origin", "HEAD:refs/heads/" + moved.branch]);
    await assert.rejects(f.call({ operation: "integrate", taskId: "moved" }));
    assert.equal(await f.main(), main);
  },
);
