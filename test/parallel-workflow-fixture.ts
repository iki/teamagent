import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { GitFailure, type Git } from "../app/workflow/git.ts";
import { parallelWorkflow } from "../app/workflow/parallel.ts";
import { workflow, type VerificationHost } from "../app/workflow/workflow.ts";
import { fixture, fixtureVerifier } from "./workflow-fixture.ts";

export type ParallelHost = NonNullable<Parameters<typeof parallelWorkflow>[2]>;
export const parallelIdentity = { sessionId: "parallel-fixture", taskId: "parallel-task" };

/** All Git effects use a private bare remote; only its approved URL observation is substituted. */
export async function parallelFixture(mode: "local" | "pr" = "local") {
  const f = await fixture();
  await writeFile(
    join(f.repo, ".workflow.json"),
    JSON.stringify({
      version: 2,
      repository: "github.com/iki/teamagent",
      remote: "origin",
      ref: "refs/heads/main",
      mode,
    }) + "\n",
  );
  await f.git(["add", "--", ".workflow.json"]);
  await f.git(["commit", "--gpg-sign", "-m", "test: Configure isolated parallel workflow"]);
  await f.git(["push", "origin", "HEAD:refs/heads/main"]);
  const base = (await f.git(["rev-parse", "HEAD"])).trim();
  const attempts: string[][] = [];
  const fetches: string[] = [];
  const installations: string[] = [];
  const verified: string[] = [];
  let uncertainAfterPush = false;
  let rejectPush = false;
  let beforePush: (() => Promise<void>) | undefined;
  let beforeVerify: ((root: string) => Promise<void>) | undefined;
  const rawGit =
    (root: string): Git =>
    (args, input, index) =>
      f.git(["-C", root, ...args], input, index);
  const git =
    (root: string): Git =>
    async (args, input, index) => {
      if (args[0] === "remote" && args[1] === "get-url")
        return "https://github.com/iki/teamagent.git\n";
      if (args[0] === "fetch") fetches.push(root);
      if (args.includes("push")) {
        attempts.push([...args]);
        await beforePush?.();
        if (rejectPush)
          throw new GitFailure({
            code: 1,
            outcome: "exited",
            stdout: "",
            stderr: "fixture rejection",
          });
        const result = await rawGit(root)(args, input, index);
        if (uncertainAfterPush) {
          uncertainAfterPush = false;
          throw new GitFailure({ code: null, outcome: "transport", stdout: "", stderr: "" });
        }
        return result;
      }
      return rawGit(root)(args, input, index);
    };
  const verification: VerificationHost = {
    ...fixtureVerifier,
    async run(root) {
      verified.push(root);
      await beforeVerify?.(root);
    },
  };
  const host: ParallelHost = {
    git,
    verification,
    async install(root) {
      installations.push(root);
    },
  };
  const call = (request: Record<string, unknown>, root = f.repo, selectedHost = host) =>
    parallelWorkflow(root, { ...parallelIdentity, ...request }, selectedHost);
  const publish = async (root: string, taskId: string, file: string, content: string) => {
    const id = { ...parallelIdentity, taskId };
    const run = (request: Record<string, unknown>) =>
      workflow(root, { ...id, ...request }, { git: git(root), verification });
    await run({ operation: "begin" });
    await writeFile(join(root, file), content);
    await run({
      operation: "checkpoint",
      files: [file],
      message: "test: Publish isolated task source",
      record: {
        ...id,
        turnId: "fixture-turn",
        agent: "codex",
        model: "fixture",
        reasoning: "fixture",
        date: "2026-11-06T12:00:00Z",
        description: "Parallel workflow fixture",
        prompt: "Publish isolated fixture source",
        response: "Changed and checked the isolated fixture.",
        processingLog: [],
      },
    });
    await run({ operation: "verify", phase: "review" });
    await run({ operation: "prepare" });
    const result = await run({ operation: "publish" });
    assert.equal(result.state, "pushed");
    assert.ok(result.commit);
    return result.commit;
  };
  return {
    repo: f.repo,
    base,
    host,
    git,
    rawGit,
    call,
    publish,
    installations,
    verified,
    pushes: () => [...attempts],
    fetches: () => [...fetches],
    async main() {
      const value = await f.git(["ls-remote", "--refs", "origin", "refs/heads/main"]);
      const commit = value.trim().split(/\s/u)[0];
      assert.ok(commit);
      return commit;
    },
    async advanceMain(file = "main-only.txt", content = "Independent main source\n") {
      await writeFile(join(f.repo, file), content);
      await f.git(["add", "--", file]);
      await f.git(["commit", "--gpg-sign", "-m", "test: Advance main independently"]);
      await f.git(["push", "origin", "HEAD:refs/heads/main"]);
      return (await f.git(["rev-parse", "HEAD"])).trim();
    },
    failAfterPush() {
      uncertainAfterPush = true;
    },
    rejectPush() {
      rejectPush = true;
    },
    beforePush(action: () => Promise<void>) {
      beforePush = action;
    },
    beforeVerify(action: (root: string) => Promise<void>) {
      beforeVerify = action;
    },
    async assertSignature(commit: string) {
      await f.git(["verify-commit", commit]);
      assert.equal((await f.git(["show", "-s", "--format=%G?", commit])).trim(), "G");
    },
    async assertSource(root: string, file: string, expected: string) {
      assert.equal(await readFile(join(root, file), "utf8"), expected);
    },
  };
}

export type ParallelFixture = Awaited<ReturnType<typeof parallelFixture>>;

export async function startParallelTask(f: ParallelFixture, name: string, root = f.repo) {
  const result = await f.call({ operation: "start", taskId: name, name, install: true }, root);
  assert.ok(result.entry);
  return result.entry;
}

export async function parallelTaskStatus(f: ParallelFixture, taskId: string) {
  const result = await f.call({ operation: "status", taskId });
  assert.ok(result.entry);
  return result.entry;
}
