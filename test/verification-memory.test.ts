import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { test } from "node:test";
import { pathToFileURL } from "node:url";
import {
  normalizeOutputChunk,
  scheduleTestBatches,
  TestBatchFailure,
  testBatches,
  testConcurrency,
} from "../app/check/test-groups.ts";
import { mkdtemp } from "./temporary.ts";

const gib = 1024 ** 3;
const files = [
  "test/first.test.ts",
  "test/research-git.test.ts",
  "test/workflow.test.ts",
  "test/analysis-sync.test.ts",
];
const resources = (memoryBytes: number) => ({ cpus: 8, memoryBytes });

await test("expanded private-fixture batches preserve discovery coverage, order and worker limits", async () => {
  const inventory = [
    "test/unknown-first.test.ts",
    "test/workflow-revisions.test.ts",
    "test/import-http-cache.test.ts",
    "test/research-git.test.ts",
    "test/owned-process-project.test.ts",
    "test/unknown-last.test.ts",
    "test/project-environment.test.ts",
    "test/memory-cli-mcp.test.ts",
    "test/analysis-sync.test.ts",
    "test/workflow.test.ts",
    "test/pre-commit.test.ts",
    "test/verification-cache.test.ts",
    "test/owned-process.test.ts",
    "test/imports.test.ts",
    "test/project-launcher.test.ts",
    "test/native-lifetime.test.ts",
  ];
  for (const expanded of [false, true]) {
    const batches = testBatches(inventory, expanded);
    // At three workers, research starts alongside the private HTTP/CLI fixtures.
    assert.deepEqual(
      batches.slice(0, 3).map((batch) => batch.name),
      expanded
        ? ["remaining", "test/research-git.test.ts", "http-and-memory-cli"]
        : ["remaining", "test/workflow.test.ts", "test/research-git.test.ts"],
    );
    assert.deepEqual(batches.flatMap((batch) => batch.files).sort(), [...inventory].sort());
    for (const batch of batches)
      assert.deepEqual(
        batch.files,
        inventory.filter((file) => batch.files.includes(file)),
      );
    const remaining = batches.find((batch) => batch.name === "remaining");
    assert.ok(remaining);
    if (expanded) {
      assert.deepEqual(
        batches.map((batch) => batch.name),
        [
          "remaining",
          "test/research-git.test.ts",
          "http-and-memory-cli",
          "owned-launchers",
          "test/workflow.test.ts",
          "test/workflow-revisions.test.ts",
          "test/verification-cache.test.ts",
          "test/pre-commit.test.ts",
          "test/analysis-sync.test.ts",
          "test/imports.test.ts",
        ],
      );
      assert.deepEqual(batches.find((batch) => batch.name === "http-and-memory-cli")?.files, [
        "test/import-http-cache.test.ts",
        "test/memory-cli-mcp.test.ts",
      ]);
      assert.deepEqual(batches.find((batch) => batch.name === "test/imports.test.ts")?.files, [
        "test/imports.test.ts",
      ]);
      assert.deepEqual(remaining.files, [
        "test/unknown-first.test.ts",
        "test/unknown-last.test.ts",
      ]);
    } else
      for (const file of [
        "test/imports.test.ts",
        "test/pre-commit.test.ts",
        "test/native-lifetime.test.ts",
      ])
        assert.ok(remaining.files.includes(file));
  }
  for (const limit of [1, 2, 3]) {
    let active = 0;
    let maximum = 0;
    const completed: string[] = [];
    await scheduleTestBatches(inventory, limit, async (batch) => {
      maximum = Math.max(maximum, ++active);
      await new Promise<void>((done) => setTimeout(done, 1));
      completed.push(...batch.files);
      active--;
    });
    assert.equal(active, 0);
    assert.ok(maximum <= limit);
    assert.deepEqual([...completed].sort(), [...inventory].sort());
    if (limit === 1) assert.deepEqual(completed, inventory);
  }
});

await test("unit output preserves CRLF and lone CR across every chunk boundary", () => {
  const original = "first\rsecond\r\nthird\nžluťoučký\r";
  const expected = "first\nsecond\nthird\nžluťoučký\n";
  for (let index = 0; index <= original.length; index++) {
    let pendingCR = false;
    let output = "";
    for (const chunk of [original.slice(0, index), "", original.slice(index)]) {
      const normalized = normalizeOutputChunk(chunk, pendingCR);
      output += normalized.text;
      pendingCR = normalized.pendingCR;
    }
    const end = normalizeOutputChunk("", pendingCR, true);
    assert.equal(output + end.text, expected);
    assert.equal(end.pendingCR, false);
  }
});

await test("tool cancellation rejects success and removes its signal listeners after cleanup", async () => {
  const root = await mkdtemp("teamagent-tool-cancel-");
  const script = join(root, "cancel.ts");
  const module = pathToFileURL(resolve(import.meta.dir, "../app/check/tools.ts")).href;
  await writeFile(
    script,
    `import assert from "node:assert/strict";
import { runTool } from ${JSON.stringify(module)};
const before = [process.listenerCount("SIGINT"), process.listenerCount("SIGTERM")];
let delivered = false;
const timer = setInterval(() => {
  if (!delivered && process.listenerCount("SIGTERM") > before[1]) {
    delivered = true;
    process.emit("SIGTERM");
  }
}, 1);
try {
  await assert.rejects(runTool("format", ["--check"]), /abort/i);
  assert.equal(delivered, true);
  assert.deepEqual([process.listenerCount("SIGINT"), process.listenerCount("SIGTERM")], before);
  process.stdout.write("cancellation joined; listeners removed\\n");
} finally { clearInterval(timer); }
`,
    "utf8",
  );
  const result = spawnSync(process.execPath, [script], {
    cwd: root,
    shell: false,
    windowsHide: true,
    timeout: 20000,
    maxBuffer: 65536,
    encoding: "utf8",
  });
  assert.equal(result.error, undefined);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, "cancellation joined; listeners removed\n");
});

await test("memory admission preserves existing caps while refusing known pressure below one GiB", () => {
  assert.equal(testConcurrency(resources(0)), 0);
  assert.equal(testConcurrency(resources(gib - 1)), 0);
  assert.equal(testConcurrency(resources(gib)), 1);
  assert.equal(testConcurrency(resources(2 * gib)), 2);
  assert.equal(testConcurrency(resources(4 * gib)), 3);
  assert.equal(testConcurrency(resources(Number.NaN)), 1);
  assert.equal(testConcurrency({ cpus: 1, memoryBytes: 8 * gib }), 1);
});

await test("no-memory admission reports every pending file as incomplete without starting work", async () => {
  let started = 0;
  await assert.rejects(
    scheduleTestBatches(
      files,
      3,
      async () => {
        started++;
      },
      () => resources(0),
    ),
    /4 test file\(s\) not run.*verification remains incomplete/u,
  );
  assert.equal(started, 0);
});

await test("batch diagnostics retain fixed reasons and labels only after every admitted child joins", async () => {
  const inventory = [...files, "test/verification-cache.test.ts"];
  const secret = "private-batch-output-sentinel";
  const release = Promise.withResolvers<void>();
  const waiting = Promise.withResolvers<void>();
  const seen: string[] = [];
  let joined = false;
  const scheduled = scheduleTestBatches(inventory, 3, async (batch) => {
    seen.push(...batch.files);
    const label = batch.name;
    // Diagnostic labels are captured from the scheduler's fixed inventory.
    Object.defineProperty(batch, "name", { value: secret });
    if (label === "remaining") {
      waiting.resolve();
      await release.promise;
      joined = true;
      throw new TestBatchFailure("deadline");
    }
    if (label === "test/research-git.test.ts") throw new TestBatchFailure("exit");
    if (label === "test/workflow.test.ts") throw new TestBatchFailure("cleanup");
    if (label === "test/analysis-sync.test.ts") throw new Error(secret, { cause: secret });
    const malformed = new TestBatchFailure("transport");
    Object.defineProperty(malformed, "reason", { value: secret });
    throw malformed;
  });
  const rejected = assert.rejects(scheduled, (error: unknown) => {
    assert.ok(error instanceof Error);
    assert.equal(joined, true);
    assert.match(error.message, /5 test batch\(es\) failed; every scheduled child was joined/u);
    for (const detail of [
      "remaining=deadline",
      "test/research-git.test.ts=exit",
      "test/workflow.test.ts=cleanup",
      "test/analysis-sync.test.ts=unknown",
      "test/verification-cache.test.ts=unknown",
    ])
      assert.ok(error.message.includes(detail));
    assert.equal(error.cause, undefined);
    assert.doesNotMatch(error.stack ?? "", /private-batch-output-sentinel/u);
    assert.ok(error.message.length < 512);
    return true;
  });
  await waiting.promise;
  assert.equal(joined, false);
  release.resolve();
  await rejected;
  assert.deepEqual([...seen].sort(), [...inventory].sort());
});

await test("sequential batch diagnostics preserve fixed reasons without exposing input filenames", async () => {
  for (const reason of ["cancelled", "output-limit", "transport", "launch"] as const) {
    await assert.rejects(
      scheduleTestBatches(["private-source-name.test.ts"], 1, async () => {
        throw new TestBatchFailure(reason);
      }),
      (error: unknown) => {
        assert.ok(error instanceof Error);
        assert.equal(
          error.message,
          `1 test batch(es) failed; every scheduled child was joined; failures: all=${reason}`,
        );
        return true;
      },
    );
  }
});

await test("admission resamples before each batch, joins running failures and preserves incomplete work", async () => {
  const released = Promise.withResolvers<void>();
  const started = Promise.withResolvers<void>();
  let available = 4 * gib;
  let joined = false;
  const seen: string[] = [];
  const scheduled = scheduleTestBatches(
    files,
    3,
    async (batch) => {
      seen.push(batch.name);
      available = 0;
      started.resolve();
      await released.promise;
      joined = true;
      throw new TestBatchFailure("cleanup");
    },
    () => resources(available),
  );
  const rejected = assert.rejects(
    scheduled,
    /3 test file\(s\) not run.*1 batch\(es\) failed.*children were joined.*remaining=cleanup/u,
  );
  await started.promise;
  assert.deepEqual(seen, ["remaining"]);
  assert.equal(joined, false);
  released.resolve();
  await rejected;
  assert.equal(joined, true);
});

await test("admission can recover after an active batch releases memory without dropping coverage", async () => {
  let available = 4 * gib;
  let first = true;
  const seen: string[] = [];
  await scheduleTestBatches(
    files,
    3,
    async (batch) => {
      seen.push(...batch.files);
      if (first) {
        first = false;
        available = 0;
        await Promise.resolve();
        available = 4 * gib;
      }
    },
    () => resources(available),
  );
  assert.deepEqual([...seen].sort(), [...files].sort());
  assert.equal(seen.length, files.length);
});

await test("failed probes admit at most one active batch and sequential mode preserves file order", async () => {
  let active = 0;
  let maximum = 0;
  const seen: string[] = [];
  await scheduleTestBatches(
    files,
    3,
    async (batch) => {
      maximum = Math.max(maximum, ++active);
      seen.push(...batch.files);
      await Promise.resolve();
      active--;
    },
    () => {
      throw new Error("fixture probe failed");
    },
  );
  assert.equal(maximum, 1);
  assert.deepEqual([...seen].sort(), [...files].sort());
  const ordered: string[] = [];
  await scheduleTestBatches(
    files,
    1,
    async (batch) => {
      ordered.push(...batch.files);
    },
    () => resources(8 * gib),
  );
  assert.deepEqual(ordered, files);
});
