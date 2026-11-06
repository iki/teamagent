import assert from "node:assert/strict";
import { test } from "node:test";
import { scheduleTestBatches, TestBatchFailure, testBatches } from "../app/check/test-groups.ts";

const research = "test/research-git.test.ts";
const workflows = [
  "test/workflow.test.ts",
  "test/workflow-revisions.test.ts",
  "test/parallel-workflow-integration.test.ts",
  "test/parallel-workflow-failures.test.ts",
  "test/parallel-workflow-recovery.test.ts",
  "test/parallel-workflow-pr.test.ts",
];
const bootstrap = "parallel-workflow-bootstrap";
const bootstrapFiles = [
  "test/parallel-workflow-migration.test.ts",
  "test/parallel-workflow.test.ts",
];
const workflowBatches = [...workflows, bootstrap];
const integration = "test/parallel-workflow-integration.test.ts";
const heavyScenarios = [
  integration,
  "test/parallel-workflow-failures.test.ts",
  "test/parallel-workflow-recovery.test.ts",
  "test/parallel-workflow-pr.test.ts",
];
const cache = "test/verification-cache.test.ts";
const http = "http-and-memory-cli";

function fixture(
  files: readonly string[],
  workers: number,
  fail?: string,
  onAdmission?: (active: ReadonlySet<string>, completed: readonly string[]) => void,
) {
  const batches = testBatches(files);
  const gates = new Map(
    batches.map((batch) => [batch.name, Promise.withResolvers<void>()] as const),
  );
  const arrivals = new Map(
    batches.map((batch) => [batch.name, Promise.withResolvers<void>()] as const),
  );
  const started: string[] = [];
  const completed: string[] = [];
  const overlaps: string[] = [];
  const active = new Set<string>();
  let maximum = 0;
  let maximumWorkflows = 0;
  let maximumDuringHeavy = 0;
  const scheduled = scheduleTestBatches(
    files,
    workers,
    async (batch) => {
      const label = batch.name;
      const gate = gates.get(label);
      const arrival = arrivals.get(label);
      assert.ok(gate);
      assert.ok(arrival);
      if ((label === research && active.size > 0) || (label !== research && active.has(research)))
        overlaps.push(label);
      active.add(label);
      maximum = Math.max(maximum, active.size);
      if ([...active].some((name) => heavyScenarios.includes(name)))
        maximumDuringHeavy = Math.max(maximumDuringHeavy, active.size);
      maximumWorkflows = Math.max(
        maximumWorkflows,
        [...active].filter((name) => workflowBatches.includes(name)).length,
      );
      started.push(label);
      arrival.resolve();
      try {
        await gate.promise;
        if (label === fail) throw new TestBatchFailure("exit");
      } finally {
        completed.push(...batch.files);
        active.delete(label);
      }
    },
    () => {
      onAdmission?.(active, completed);
      return { cpus: 8, memoryBytes: 8 * 1024 ** 3 };
    },
  );
  return {
    scheduled,
    started,
    completed,
    overlaps,
    active,
    get maximum() {
      return maximum;
    },
    get maximumWorkflows() {
      return maximumWorkflows;
    },
    get maximumDuringHeavy() {
      return maximumDuringHeavy;
    },
    startedBatch(name: string): Promise<void> {
      const arrival = arrivals.get(name);
      assert.ok(arrival);
      return arrival.promise;
    },
    release(name: string): void {
      const gate = gates.get(name);
      assert.ok(gate);
      gate.resolve();
    },
    releaseAll(): void {
      for (const gate of gates.values()) gate.resolve();
    },
  };
}

await test("research runs first and alone before ordinary three-worker batches", async () => {
  const files = [
    "test/unknown-first.test.ts",
    ...workflows,
    ...bootstrapFiles,
    "test/import-http-cache.test.ts",
    research,
    cache,
    "test/unknown-last.test.ts",
    "test/analysis-sync.test.ts",
  ];
  const f = fixture(files, 3);
  try {
    assert.deepEqual(f.started, [research]);
    assert.deepEqual([...f.active], [research]);
    f.release(research);
    await f.startedBatch(http);
    assert.deepEqual(f.started, [research, "remaining", bootstrap, http]);
    assert.equal(f.active.has(research), false);
    assert.ok(f.completed.includes(research));
    f.release(http);
    await f.startedBatch("test/workflow.test.ts");
    assert.deepEqual([...f.active], ["remaining", bootstrap, "test/workflow.test.ts"]);
    assert.equal(f.started.includes(integration), false);
  } finally {
    f.releaseAll();
    await f.scheduled;
  }
  assert.deepEqual(f.overlaps, []);
  assert.equal(f.maximum, 3);
  assert.equal(f.maximumDuringHeavy, 2);
  assert.deepEqual([...f.completed].sort(), [...files].sort());
  assert.equal(f.active.size, 0);
});

await test("research runs first and alone before ordinary two-worker batches", async () => {
  const files = [
    ...workflows,
    "test/unknown.test.ts",
    research,
    ...bootstrapFiles,
    "test/import-http-cache.test.ts",
  ];
  const f = fixture(files, 2);
  try {
    assert.deepEqual(f.started, [research]);
    assert.deepEqual([...f.active], [research]);
    f.release(research);
    await f.startedBatch(bootstrap);
    assert.deepEqual(f.started, [research, "remaining", bootstrap]);
    assert.equal(f.active.has(research), false);
    assert.ok(f.completed.includes(research));
    f.release("remaining");
    await f.startedBatch(http);
    assert.deepEqual([...f.active], [bootstrap, http]);
    assert.equal(f.started.includes(integration), false);
  } finally {
    f.releaseAll();
    await f.scheduled;
  }
  assert.deepEqual(f.overlaps, []);
  assert.equal(f.maximum, 2);
  assert.equal(f.maximumDuringHeavy, 2);
  assert.deepEqual([...f.completed].sort(), [...files].sort());
  assert.equal(f.active.size, 0);
});

await test("a joined research failure releases all later batches and retains complete coverage", async () => {
  const files = [research, integration, "test/import-http-cache.test.ts"];
  const f = fixture(files, 3, research);
  const rejected = assert.rejects(
    f.scheduled,
    /1 test batch\(es\) failed; every scheduled child was joined; failures: test\/research-git.test.ts=exit/u,
  );
  try {
    assert.deepEqual(f.started, [research]);
    f.release(research);
    await f.startedBatch(integration);
    assert.equal(f.active.has(research), false);
    assert.ok(f.completed.includes(research));
    assert.equal(f.active.has(http), true);
  } finally {
    f.releaseAll();
    await rejected;
  }
  assert.deepEqual(f.overlaps, []);
  assert.deepEqual([...f.completed].sort(), [...files].sort());
  assert.equal(f.active.size, 0);
});

await test("ordinary workflow batches use three slots while preserving the two-workflow cap", async () => {
  const workflow = "test/workflow.test.ts";
  const revisions = "test/workflow-revisions.test.ts";
  const files = [workflow, revisions, ...bootstrapFiles, "test/import-http-cache.test.ts", cache];
  const f = fixture(files, 3);
  try {
    assert.deepEqual(f.started, [bootstrap, http, workflow]);
    f.release(http);
    await Promise.race([f.startedBatch(cache), f.startedBatch(revisions)]);
    assert.deepEqual(f.started, [bootstrap, http, workflow, cache]);
    assert.equal(f.active.size, 3);
    f.release(bootstrap);
    await f.startedBatch(revisions);
    assert.equal(f.active.has(workflow), true);
    assert.equal(f.active.has(cache), true);
    assert.equal(f.active.size, 3);
  } finally {
    f.releaseAll();
    await f.scheduled;
  }
  assert.deepEqual(f.overlaps, []);
  assert.equal(f.maximum, 3);
  assert.equal(f.maximumWorkflows, 2);
  assert.equal(f.maximumDuringHeavy, 0);
  assert.deepEqual([...f.completed].sort(), [...files].sort());
  assert.equal(f.active.size, 0);
});

await test("a heavy scenario waits for fewer than two ordinary batches before admission", async () => {
  const files = ["test/unknown.test.ts", integration, "test/import-http-cache.test.ts", cache];
  const resampled = Promise.withResolvers<void>();
  const f = fixture(files, 3, undefined, (active, completed) => {
    if (completed.includes(cache) && active.size === 2) resampled.resolve();
  });
  try {
    assert.deepEqual(f.started, ["remaining", http, cache]);
    f.release(cache);
    await resampled.promise;
    assert.deepEqual([...f.active], ["remaining", http]);
    assert.equal(f.started.includes(integration), false);
    f.release(http);
    await f.startedBatch(integration);
    assert.deepEqual([...f.active], ["remaining", integration]);
  } finally {
    f.releaseAll();
    await f.scheduled;
  }
  assert.equal(f.maximumDuringHeavy, 2);
  assert.equal(f.maximum, 3);
  assert.deepEqual([...f.completed].sort(), [...files].sort());
  assert.equal(f.active.size, 0);
});

await test("a joined workflow failure retains the heavy cap while later scenarios run", async () => {
  const failures = "test/parallel-workflow-failures.test.ts";
  const recovery = "test/parallel-workflow-recovery.test.ts";
  const files = [integration, failures, recovery, "test/import-http-cache.test.ts"];
  const f = fixture(files, 3, integration);
  const rejected = assert.rejects(
    f.scheduled,
    /1 test batch\(es\) failed; every scheduled child was joined; failures: test\/parallel-workflow-integration.test.ts=exit/u,
  );
  try {
    assert.deepEqual(f.started, [http, integration]);
    f.release(integration);
    await f.startedBatch(failures);
    assert.equal(f.active.has(integration), false);
    assert.ok(f.completed.includes(integration));
    assert.deepEqual([...f.active], [http, failures]);
    assert.equal(f.started.includes(recovery), false);
    f.release(http);
    await f.startedBatch(recovery);
    assert.deepEqual([...f.active], [failures, recovery]);
  } finally {
    f.releaseAll();
    await rejected;
  }
  assert.equal(f.maximumDuringHeavy, 2);
  assert.equal(f.maximum, 2);
  assert.equal(f.maximumWorkflows, 2);
  assert.deepEqual([...f.completed].sort(), [...files].sort());
  assert.equal(f.active.size, 0);
});

await test("a heavy failure is reported only after the earlier ordinary batch joins", async () => {
  const files = ["test/unknown.test.ts", integration, "test/import-http-cache.test.ts", cache];
  const failureJoined = Promise.withResolvers<void>();
  const f = fixture(files, 3, integration, (active, completed) => {
    if (completed.includes(integration) && active.has("remaining")) failureJoined.resolve();
  });
  let reported = false;
  const rejected = assert
    .rejects(
      f.scheduled,
      /1 test batch\(es\) failed; every scheduled child was joined; failures: test\/parallel-workflow-integration.test.ts=exit/u,
    )
    .then(() => {
      reported = true;
    });
  try {
    assert.deepEqual(f.started, ["remaining", http, cache]);
    f.release(cache);
    f.release(http);
    await f.startedBatch(integration);
    assert.deepEqual([...f.active], ["remaining", integration]);
    f.release(integration);
    await failureJoined.promise;
    assert.deepEqual([...f.active], ["remaining"]);
    assert.equal(reported, false);
  } finally {
    f.releaseAll();
    await rejected;
  }
  assert.equal(reported, true);
  assert.equal(f.maximumDuringHeavy, 2);
  assert.equal(f.maximum, 3);
  assert.deepEqual([...f.completed].sort(), [...files].sort());
  assert.equal(f.active.size, 0);
});
