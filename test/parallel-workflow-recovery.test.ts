import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { parallelFixture, startParallelTask as start } from "./parallel-workflow-fixture.ts";

await test(
  "uncertain successful pushes reconcile once and concurrent main advancement never forces history",
  { timeout: 180_000 },
  async () => {
    const f = await parallelFixture();
    const uncertain = await start(f, "uncertain");
    const source = await f.publish(
      uncertain.path,
      "uncertain",
      "uncertain.txt",
      "Retained source\n",
    );
    f.failAfterPush();
    const outcome = await Promise.allSettled([
      f.call({ operation: "integrate", taskId: "uncertain" }),
    ]);
    assert.equal(outcome.length, 1);
    assert.equal(await f.main(), source, "Transport failure can follow a successful remote update");
    const attempts = f.pushes().length;
    const reconciled = (await f.call({ operation: "reconcile", taskId: "uncertain" })).entry;
    assert.equal(reconciled?.state, "integrated");
    assert.equal(reconciled?.result, source);
    assert.equal(f.pushes().length, attempts, "Reconciliation observes without replaying the push");
    await f.rawGit(f.repo)(["fetch", "--no-tags", "origin", "refs/heads/main"]);
    await f.rawGit(f.repo)(["merge", "--ff-only", source]);
    const race = await start(f, "race");
    await f.publish(race.path, "race", "race.txt", "Prepared task\n");
    let advanced: string | undefined;
    f.beforePush(async () => {
      advanced = await f.advanceMain("concurrent.txt", "Another publisher\n");
    });
    await assert.rejects(f.call({ operation: "integrate", taskId: "race" }));
    assert.ok(advanced);
    assert.equal(await f.main(), advanced);
    const rejectedAttempts = f.pushes().length;
    await assert.rejects(f.call({ operation: "integrate", taskId: "race" }));
    assert.equal(
      f.pushes().length,
      rejectedAttempts,
      "A failed attempt is not retried automatically",
    );
    assert.equal(await readFile(join(race.path, "race.txt"), "utf8"), "Prepared task\n");
  },
);
