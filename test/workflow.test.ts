import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { hostname } from "node:os";
import { join } from "node:path";
import { loadTask } from "../app/workflow/workflow.ts";
import { publicPath, stageScope, type Git } from "../app/workflow/git.ts";
import { runProcess, diagnostic } from "../app/workflow/process.ts";
import { boundedText, withLock, workflowCapacity } from "../app/workflow/storage.ts";
import { directory, fixture, fixtureVerifier, identity } from "./workflow-fixture.ts";

await test("workflow publishes a real SSH-signed fixture commit once and verifies its remote", async () => {
  const f = await fixture();
  await f.prepare();
  await withLock(join(f.repo, ".cache/workflow/.lock"), async () => {
    assert.equal((await f.call({ operation: "status" })).state, "ready");
  });
  const result = await f.call({ operation: "publish" });
  assert.equal(result.state, "pushed");
  assert.ok(result.commit);
  assert.equal((await f.git(["show", "-s", "--format=%G?", "HEAD"])).trim(), "G");
  await f.git(["verify-commit", "HEAD"]);
  assert.deepEqual(f.counts(), { commits: 1, pushes: 1 });
  assert.equal((await f.call({ operation: "publish" })).commit, result.commit);
  assert.deepEqual(f.counts(), { commits: 1, pushes: 1 });
});

await test("workflow preserves a pre-staged deletion while publishing new files with its verified signature", async () => {
  const f = await fixture();
  await f.call({ operation: "begin" });
  await f.git(["rm", "--", "retired.txt"]);
  await writeFile(join(f.repo, "added.txt"), "new reviewed file\n");
  assert.equal((await f.git(["diff", "--cached", "--name-status"])).trim(), "D\tretired.txt");
  await f.prepare({ files: ["owned.txt", "retired.txt", "added.txt"] });
  const prepared = await loadTask(f.repo, identity.sessionId, identity.taskId);
  assert.ok(prepared?.verification);
  const result = await f.call({ operation: "publish" });
  assert.equal(result.state, "pushed");
  assert.equal((await f.git(["rev-parse", "HEAD^{tree}"])).trim(), prepared.verification.tree);
  assert.equal(await f.git(["ls-files", "--", "retired.txt"]), "");
  assert.equal(await f.git(["show", "HEAD:added.txt"]), "new reviewed file\n");
  assert.equal(await f.git(["show", "HEAD:owned.txt"]), "after\n");
  assert.equal((await f.git(["show", "-s", "--format=%G?", "HEAD"])).trim(), "G");
  await f.git(["verify-commit", "HEAD"]);
  assert.deepEqual(f.counts(), { commits: 1, pushes: 1 });
  assert.equal(await f.git(["status", "--porcelain"]), "");
});

await test("publication rechecks disabled signing and forbidden destinations at its mutation boundary", async () => {
  const f = await fixture();
  await f.prepare();
  await f.git(["config", "commit.gpgsign", "false"]);
  await assert.rejects(f.call({ operation: "publish" }), /Signed SSH/);
  assert.deepEqual(f.counts(), { commits: 0, pushes: 0 });
  await f.git(["config", "commit.gpgsign", "true"]);
  f.denyRemote();
  await assert.rejects(f.call({ operation: "publish" }), /outside the approved/);
  assert.deepEqual(f.counts(), { commits: 0, pushes: 0 });
});

await test("publication invalidates changed signer trust and rechecks ignored live evidence", async () => {
  let evidenceValid = true;
  const f = await fixture({
    ...fixtureVerifier,
    async live() {
      if (!evidenceValid) throw new Error("Live evidence changed");
    },
  });
  await f.prepare();
  evidenceValid = false;
  await assert.rejects(f.call({ operation: "publish" }), /Live evidence changed/);
  evidenceValid = true;
  await writeFile(f.allowed, (await readFile(f.allowed, "utf8")) + "# changed trust\n");
  await assert.rejects(f.call({ operation: "publish" }), /Signing identity changed/);
  assert.deepEqual(f.counts(), { commits: 0, pushes: 0 });
});

await test("unrelated initial dirt is preserved and rejected before archive freeze", async () => {
  const f = await fixture();
  const unrelated = join(f.repo, "unrelated.txt");
  await writeFile(unrelated, "existing work\n");
  await assert.rejects(f.prepare(), /Unscoped worktree changes/);
  assert.equal((await f.call({ operation: "status" })).state, "open");
  assert.equal(await readFile(unrelated, "utf8"), "existing work\n");
  await assert.rejects(readdir(join(f.repo, "spec/.conversations")), { code: "ENOENT" });
  assert.deepEqual(f.counts(), { commits: 0, pushes: 0 });
});

await test("managed receipts already dirty at begin require explicit adoption", async () => {
  const f = await fixture();
  await mkdir(join(f.repo, ".verification"));
  const receipt = join(f.repo, ".verification/verification-tests.json");
  await writeFile(receipt, "existing user evidence\n");
  await f.call({ operation: "begin" });
  await assert.rejects(
    f.call({ operation: "verify", phase: "review" }),
    /explicit checkpoint adoption/,
  );
  assert.equal(await readFile(receipt, "utf8"), "existing user evidence\n");
});

await test("frozen scope and unrelated partial staging cannot bypass publication checks", async () => {
  const f = await fixture();
  await f.prepare();
  await writeFile(join(f.repo, "unrelated.txt"), "private user work\n");
  await f.git(["add", "unrelated.txt"]);
  await assert.rejects(f.call({ operation: "publish" }), /Unrelated staged/);
  assert.deepEqual(f.counts(), { commits: 0, pushes: 0 });
  await f.git(["reset", "--", "unrelated.txt"]);
  await writeFile(join(f.repo, "owned.txt"), "changed after review\n");
  await assert.rejects(f.call({ operation: "publish" }), /Unreviewed|Checkpoint/);
});

await test("live, reused and foreign lock owners are never stolen", async () => {
  const root = await directory();
  const lock = join(root, "lock");
  await mkdir(lock);
  for (const owner of [
    { token: "live", pid: process.pid, hostname: hostname(), startedAt: 0 },
    { token: "foreign", pid: 999999, hostname: "other-host", startedAt: 0 },
    { token: "reused", pid: process.pid, hostname: hostname(), startedAt: 0 },
  ]) {
    await writeFile(join(lock, "owner.json"), JSON.stringify(owner) + "\n");
    await assert.rejects(
      withLock(lock, async () => assert.fail("Lock stolen"), 30),
      /locked/,
    );
    assert.ok((await readFile(join(lock, "owner.json"), "utf8")).includes(owner.token));
  }
});

await test("workflow aggregate cache bounds reject new writes without deleting evidence", async () => {
  const root = await directory();
  const cache = join(root, ".cache/workflow");
  await mkdir(cache, { recursive: true });
  const evidence = join(cache, "evidence.json");
  await writeFile(evidence, "existing evidence\n");
  await assert.rejects(workflowCapacity(root, 100, { bytes: 110 }), /capacity reached/);
  await assert.rejects(workflowCapacity(root, 0, { files: 1 }), /capacity reached/);
  assert.equal(await readFile(evidence, "utf8"), "existing evidence\n");
});

await test("process time, total output, long lines and cancellation are bounded", async () => {
  const root = await directory();
  const hang = join(root, "hang.ts"),
    flood = join(root, "flood.ts");
  await writeFile(hang, "setInterval(() => {}, 1000);\n");
  await writeFile(flood, "process.stdout.write('x'.repeat(200000));\n");
  assert.equal(
    (await runProcess(root, process.execPath, [hang], { timeoutMs: 150 })).outcome,
    "timeout",
  );
  assert.equal(
    (await runProcess(root, process.execPath, [flood], { maximumBytes: 1000 })).outcome,
    "output-limit",
  );
  assert.equal(
    (await runProcess(root, process.execPath, [flood], { maximumLineBytes: 1000 })).outcome,
    "output-limit",
  );
  const abort = new AbortController();
  abort.abort();
  assert.equal(
    (await runProcess(root, process.execPath, [hang], { signal: abort.signal })).outcome,
    "cancelled",
  );
  const file = join(root, "large.txt");
  await writeFile(file, "large");
  await assert.rejects(boundedText(file, 2), /oversized/);
  for (const path of ["../outside", ".env.local", ".cache/private.json", "private.key"])
    assert.throws(() => publicPath(path));
  let gitCalls = 0;
  const untouchedGit: Git = async () => {
    gitCalls++;
    return "";
  };
  await assert.rejects(stageScope(root, untouchedGit, ["large.txt", ".env.local"]), /Private/);
  await assert.rejects(stageScope(root, untouchedGit, ["large.txt", "large.txt"]), /duplicate/);
  assert.equal(gitCalls, 0);
  assert.equal(
    diagnostic("Bearer sensitive https://user:password@example.com/path?token=secret#private\r\n"),
    "Bearer [redacted] https://example.com/path\n",
  );
});

await test("process timeout terminates its child tree instead of leaving inherited pipes open", async (context) => {
  const root = await directory();
  const marker = join(root, "child.pid");
  await writeFile(
    join(root, "child.ts"),
    "import { writeFileSync, renameSync } from 'node:fs';\nwriteFileSync('child.pid.pending', String(process.pid) + '\\n', { flag: 'wx' });\nrenameSync('child.pid.pending', 'child.pid');\nsetInterval(() => {}, 1000);\n",
  );
  await writeFile(
    join(root, "parent.ts"),
    "import { spawn } from 'node:child_process';\nspawn(process.execPath, ['child.ts'], { stdio: 'inherit', windowsHide: true });\nsetInterval(() => {}, 1000);\n",
  );
  const controller = new AbortController();
  const abort = () => controller.abort();
  context.signal.addEventListener("abort", abort, { once: true });
  if (context.signal.aborted) abort();
  const began = performance.now();
  let completed = false;
  const pending = runProcess(root, process.execPath, ["parent.ts"], {
    timeoutMs: 10_000,
    signal: controller.signal,
  }).then(
    (result) => {
      completed = true;
      return { ok: true as const, result };
    },
    (error: unknown) => {
      completed = true;
      return { ok: false as const, error };
    },
  );
  const failures: unknown[] = [];
  try {
    let pid: number | undefined;
    while (pid === undefined) {
      if (completed) {
        const settled = await pending;
        if (!settled.ok) throw settled.error;
        assert.fail(
          `Owned command completed before descendant readiness: ${settled.result.outcome}`,
        );
      }
      assert.ok(performance.now() - began < 5000, "Descendant readiness exceeded five seconds");
      let text: string | undefined;
      try {
        text = await readFile(marker, "utf8");
      } catch (error) {
        if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) throw error;
      }
      if (text !== undefined) {
        assert.match(text, /^[1-9]\d*\n$/u, "Descendant PID marker must be a complete LF line");
        const value = Number(text.trim());
        assert.ok(Number.isSafeInteger(value) && value > 0, "Descendant PID must be valid");
        pid = value;
      } else await new Promise<void>((done) => setTimeout(done, 20));
    }
    assert.ok(performance.now() - began < 5000, "Descendant readiness exceeded five seconds");
    assert.equal(completed, false, "The owned command must still be running at readiness");
    const descendant = pid;
    assert.equal(process.kill(descendant, 0), true, "The descendant must be alive before timeout");
    const settled = await pending;
    if (!settled.ok) throw settled.error;
    assert.equal(settled.result.outcome, "timeout");
    assert.equal(settled.result.termination, "closed");
    assert.ok(performance.now() - began < 15_000);
    assert.throws(() => process.kill(descendant, 0), { code: "ESRCH" });
  } catch (error) {
    failures.push(error);
  } finally {
    if (!completed) controller.abort();
    try {
      const settled = await pending;
      if (!settled.ok) {
        if (!failures.includes(settled.error)) failures.push(settled.error);
      } else if (settled.result.termination !== "closed") {
        failures.push(new Error("Fixture command cleanup must be confirmed"));
      }
    } finally {
      context.signal.removeEventListener("abort", abort);
    }
  }
  if (failures.length) throw new AggregateError(failures, "Process timeout fixture failed");
});
