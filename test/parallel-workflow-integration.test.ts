import assert from "node:assert/strict";
import { test } from "node:test";
import { writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { commonDirectoryAndBranch, headAndBranch } from "../app/workflow/git.ts";
import { withLock } from "../app/workflow/storage.ts";
import { loadTask } from "../app/workflow/workflow.ts";
import {
  parallelFixture,
  parallelIdentity,
  startParallelTask as start,
  parallelTaskStatus as status,
} from "./parallel-workflow-fixture.ts";

await test(
  "two signed task branches integrate linearly, serialize publication and preserve dirty main",
  { timeout: 360_000 },
  async () => {
    const f = await parallelFixture("local", "integration");
    const first = await start(f, "alpha");
    const second = await start(f, "beta");
    const fetchesBeforePublication = f.fetches().length;
    const publications = await Promise.allSettled([
      f.publish(first.path, "alpha", "alpha.txt", "Alpha task\n"),
      f.publish(second.path, "beta", "beta.txt", "Beta task\n"),
    ]);
    const failures: unknown[] = [];
    for (const publication of publications) {
      if (publication.status === "rejected") failures.push(publication.reason);
    }
    if (failures.length) throw new AggregateError(failures, "Independent task publications failed");
    assert.equal(
      f.fetches().length,
      fetchesBeforePublication,
      "Exact-current-main publication needs no redundant fetch",
    );
    const [alphaPublication, betaPublication] = publications;
    assert.ok(alphaPublication.status === "fulfilled");
    assert.ok(betaPublication.status === "fulfilled");
    const alpha = alphaPublication.value;
    const beta = betaPublication.value;
    assert.deepEqual(await headAndBranch(f.rawGit(first.path)), {
      head: alpha,
      branch: first.branch,
    });
    const alphaTask = await loadTask(first.path, parallelIdentity.sessionId, "alpha");
    const betaTask = await loadTask(second.path, parallelIdentity.sessionId, "beta");
    assert.ok(alphaTask?.checkpoint);
    assert.ok(betaTask?.checkpoint);
    assert.notEqual(
      alphaTask.checkpoint.archive,
      betaTask.checkpoint.archive,
      "Independent tasks with identical descriptions must not collide during integration",
    );
    await writeFile(join(f.repo, "owned.txt"), "Retained local edits\n");
    const dirty = await f.rawGit(f.repo)(["status", "--porcelain=v1"]);
    await withLock(join(f.repo, ".git/teamagent-parallel/.integration-lock"), async () => {
      await assert.rejects(f.call({ operation: "integrate", taskId: "alpha" }), /locked/iu);
    });
    const fetchesBeforeIntegration = f.fetches().length;
    const a = (await f.call({ operation: "integrate", taskId: "alpha" })).entry;
    assert.equal(
      f.fetches().length,
      fetchesBeforeIntegration,
      "Exact-base integration needs no redundant fetch",
    );
    assert.ok(a?.result);
    assert.equal(a.state, "integrated");
    assert.equal(a.result, alpha, "Unchanged main preserves the original signed task commit");
    const fetchesBeforePreparation = f.fetches().length;
    await f.call({ operation: "prepare", taskId: "beta" });
    assert.ok(
      f.fetches().length > fetchesBeforePreparation,
      "Changed-base preparation still fetches current main",
    );
    const prepared = await status(f, "beta");
    assert.equal(prepared.state, "prepared");
    assert.ok(prepared.workspace);
    const fetchesAfterPreparation = f.fetches().length;
    assert.equal(
      (await f.call({ operation: "prepare", taskId: "beta" })).entry?.workspace,
      prepared.workspace,
    );
    const candidate = f.rawGit(prepared.workspace);
    const binding = await commonDirectoryAndBranch(candidate);
    assert.equal(resolve(binding.directory), resolve(join(f.repo, ".git")));
    assert.equal(binding.branch, null, "Real Git identifies the prepared checkout as detached");
    assert.equal(
      f.fetches().length,
      fetchesAfterPreparation,
      "Matching prepared refs need no second fetch",
    );
    await candidate(["switch", "-c", "candidate-inspection"]);
    await assert.rejects(f.call({ operation: "integrate", taskId: "beta" }), /detached/iu);
    assert.equal((await status(f, "beta")).state, "prepared");
    assert.equal(await f.main(), a.result);
    await candidate(["switch", "--detach", "HEAD"]);
    const b = (await f.call({ operation: "integrate", taskId: "beta" })).entry;
    assert.equal(
      f.fetches().length,
      fetchesAfterPreparation,
      "Integrating matching prepared refs needs no refetch",
    );
    assert.ok(b?.result);
    assert.equal(b.state, "integrated");
    assert.notEqual(b.result, beta, "The second task is replayed on the integrated first task");
    assert.equal(
      await f.rawGit(f.repo)(["show", "-s", "--format=%an%x00%ae%x00%aI", b.result]),
      await f.rawGit(f.repo)(["show", "-s", "--format=%an%x00%ae%x00%aI", beta]),
      "Signed replay preserves the original author name, email and author date",
    );
    assert.equal((await f.rawGit(f.repo)(["rev-parse", b.result + "^"])).trim(), a.result);
    const commits = (await f.rawGit(f.repo)(["rev-list", "--reverse", f.base + ".." + b.result]))
      .trim()
      .split("\n");
    assert.deepEqual(commits, [a.result, b.result]);
    assert.equal(await f.rawGit(f.repo)(["rev-list", "--merges", f.base + ".." + b.result]), "");
    for (const commit of commits) await f.assertSignature(commit);
    assert.equal((await f.rawGit(first.path)(["rev-parse", "HEAD"])).trim(), alpha);
    assert.equal((await f.rawGit(second.path)(["rev-parse", "HEAD"])).trim(), beta);
    assert.match(
      await f.rawGit(f.repo)(["ls-remote", "--refs", "origin", "refs/heads/" + second.branch]),
      new RegExp("^" + beta + "\\s", "u"),
    );
    assert.equal(await f.main(), b.result);
    assert.equal(await f.rawGit(f.repo)(["status", "--porcelain=v1"]), dirty);
    await f.assertSource(f.repo, "owned.txt", "Retained local edits\n");
    assert.equal((await f.rawGit(f.repo)(["rev-parse", "HEAD"])).trim(), f.base);
    assert.equal(await f.rawGit(f.repo)(["show", b.result + ":alpha.txt"]), "Alpha task\n");
    assert.equal(await f.rawGit(f.repo)(["show", b.result + ":beta.txt"]), "Beta task\n");
    assert.ok(
      f
        .pushes()
        .every((args) => !args.some((arg) => arg.startsWith("--force") || arg.startsWith("+"))),
    );
  },
);
