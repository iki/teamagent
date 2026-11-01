import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { test } from "node:test";
import { pathToFileURL } from "node:url";
import {
  normalizeOutputChunk,
  scheduleTestBatches,
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
      throw new Error("fixture batch failure");
    },
    () => resources(available),
  );
  const rejected = assert.rejects(
    scheduled,
    /3 test file\(s\) not run.*1 batch\(es\) failed.*children were joined/u,
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
