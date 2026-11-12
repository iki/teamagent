import assert from "node:assert/strict";
import { test } from "node:test";
import { validatePullRequest } from "../app/workflow/parallel-pr.ts";
import { parallelFixture, type ParallelHost } from "./parallel-workflow-fixture.ts";

const expected = {
  number: 7,
  branch: "codex/reviewed",
  head: "a".repeat(40),
  main: "b".repeat(40),
};
const observation = {
  number: 7,
  repository: "github.com/iki/teamagent",
  headBranch: expected.branch,
  baseBranch: "main",
  head: expected.head,
  base: expected.main,
  state: "OPEN",
  isDraft: false,
  approved: true,
  checksPassed: true,
  mergeable: true,
};

await test("PR admission requires approval, checks and exact repository, task head and main base", () => {
  assert.equal(validatePullRequest(observation, expected).head, expected.head);
  const invalid: readonly Record<string, unknown>[] = [
    { number: 8 },
    { repository: "github.com/other/project" },
    { headBranch: "codex/other" },
    { baseBranch: "other" },
    { head: "c".repeat(40) },
    { base: "c".repeat(40) },
    { state: "CLOSED" },
    { state: "MERGED" },
    { isDraft: true },
    { approved: false },
    { checksPassed: false },
    { mergeable: false },
    { approved: "true" },
    { unrecognized: true },
  ];
  for (const change of invalid)
    assert.throws(() => validatePullRequest({ ...observation, ...change }, expected));
  for (const value of [null, [], "approved", { ...observation, head: "not-a-commit" }])
    assert.throws(() => validatePullRequest(value, expected));
});

await test(
  "PR integration admits reviewed heads, rechecks approval and never legitimizes failed attempts",
  { timeout: 240_000 },
  async () => {
    const f = await parallelFixture("pr", "pr");
    const accepted = (await f.call({ operation: "start", taskId: "approved", name: "approved" }))
      .entry;
    const acceptedSource = await f.publish(
      accepted.path,
      "approved",
      "approved.txt",
      "Approved source\n",
    );
    const approvedHost: ParallelHost = {
      ...f.host,
      pullRequest: {
        async create() {
          return 7;
        },
        async inspect() {
          return {
            ...observation,
            headBranch: accepted.branch,
            head: acceptedSource,
            base: accepted.base,
          };
        },
      },
    };
    const integrated = (
      await f.call(
        { operation: "integrate", taskId: "approved", prNumber: 7 },
        f.repo,
        approvedHost,
      )
    ).entry;
    assert.equal(integrated.state, "integrated");
    assert.equal(integrated.result, acceptedSource);
    await f.assertSignature(acceptedSource);
    const started = (
      await f.call({ operation: "start", taskId: "review-race", name: "review-race" })
    ).entry;
    assert.ok(started);
    const source = await f.publish(
      started.path,
      "review-race",
      "reviewed.txt",
      "Reviewed source\n",
    );
    let inspections = 0;
    const host: ParallelHost = {
      ...f.host,
      pullRequest: {
        async create() {
          return 8;
        },
        async inspect() {
          inspections++;
          return {
            ...observation,
            number: 8,
            headBranch: started.branch,
            head: source,
            base: started.base,
            approved: inspections === 1,
          };
        },
      },
    };
    const before = f.pushes().length;
    await assert.rejects(
      f.call({ operation: "integrate", taskId: "review-race", prNumber: 8 }, f.repo, host),
    );
    assert.ok(inspections >= 2);
    assert.equal(f.pushes().length, before);
    assert.equal(await f.main(), acceptedSource);
    assert.equal((await f.rawGit(started.path)(["rev-parse", "HEAD"])).trim(), source);
    assert.equal(
      (await f.call({ operation: "status", taskId: "review-race" })).entry.state,
      "failed",
    );
    // A different actor can publish to the private fixture remote. Its action
    // cannot turn this workflow's refused approval into a successful attempt.
    await f.rawGit(started.path)(["push", "origin", source + ":refs/heads/main"]);
    assert.equal(await f.main(), source);
    await assert.rejects(f.call({ operation: "reconcile", taskId: "review-race" }));
    assert.equal(
      (await f.call({ operation: "status", taskId: "review-race" })).entry.state,
      "failed",
    );
  },
);
