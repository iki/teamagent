import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { Schema } from "effect";
import { runProcess } from "../app/workflow/process.ts";
import { mkdtemp } from "./temporary.ts";

// Adapted from Trigon's supplied test/tinypool-windows-hide.test.ts.
// patches/trigon/registry.json records the selected fix's immutable source revision.
// This consumer regression is adapted host wiring, not a modified patch artifact.
const repository = fileURLToPath(new URL("../", import.meta.url));
const bootstrap = String.raw`
import { createRequire } from "node:module";
import { realpath } from "node:fs/promises";
import { join, dirname } from "node:path";
import { pathToFileURL } from "node:url";
import { Schema } from "effect";
import { boundedRead } from ${JSON.stringify(new URL("../app/check/cache-io.ts", import.meta.url).href)};
const root = process.cwd();
const formatterManifest = await realpath(join(root, "node_modules/oxfmt/package.json"));
const requireFormatter = createRequire(formatterManifest);
const poolEntry = await realpath(requireFormatter.resolve("tinypool"));
const Package = Schema.Struct({ name: Schema.String, version: Schema.String });
const decode = new TextDecoder("utf-8", { fatal: true });
const readPackage = async (directory) => Schema.decodeUnknownSync(Schema.fromJsonString(Package))(decode.decode(await boundedRead(directory, "package.json", 1024 * 1024)));
const formatter = await readPackage(dirname(formatterManifest));
const poolPackage = await readPackage(join(dirname(poolEntry), ".."));
if (formatter.name !== "oxfmt" || formatter.version !== "0.74.0" || poolPackage.name !== "tinypool" || poolPackage.version !== "2.2.0") throw new Error("Review the exact package versions before changing this regression");
const loadPool = async () => {
  const imported = Schema.decodeUnknownSync(Schema.Struct({ default: Schema.Unknown }))(await import(pathToFileURL(poolEntry).href));
  if (typeof imported.default !== "function") throw new Error("Expected provisioned Tinypool constructor");
  return imported.default;
};
`;

// The inspected Node child-process and worker-thread launch routes are intercepted before import.
const noLaunchProbe = String.raw`
import { mock } from "bun:test";
import * as native from "node:child_process";
import * as threads from "node:worker_threads";
const sentinel = new Error("Stopped before fork");
let capture;
let forkCalls = 0;
const reject = () => { throw new Error("Unexpected launch blocked"); };
const fork = (_module, _argv, options) => {
  forkCalls++;
  const parsed = Schema.decodeUnknownSync(Schema.Struct({ windowsHide: Schema.optional(Schema.Boolean), stdio: Schema.String, env: Schema.Record(Schema.String, Schema.String) }))(options);
  capture = { windowsHide: parsed.windowsHide ?? null, stdio: parsed.stdio, envKeys: Object.keys(parsed.env).sort() };
  throw sentinel;
};
const guards = { fork, spawn: reject, spawnSync: reject, exec: reject, execSync: reject, execFile: reject, execFileSync: reject };
await mock.module("node:child_process", () => ({ ...native, ...guards, default: { ...native, ...guards } }));
class BlockedWorker { constructor() { reject(); } }
await mock.module("node:worker_threads", () => ({ ...threads, Worker: BlockedWorker, default: { ...threads, Worker: BlockedWorker } }));
if (!Object.is((await import("node:child_process")).fork, fork) || !Object.is((await import("node:worker_threads")).Worker, BlockedWorker)) throw new Error("Mock binding did not replace native launch");
const Tinypool = await loadPool();
let stoppedBeforeFork = false;
try {
  Reflect.construct(Tinypool, [{ filename: new URL("./never-loaded.mjs", import.meta.url).href, minThreads: 1, maxThreads: 1, runtime: "child_process", env: {}, execArgv: [] }]);
} catch (error) { if (error !== sentinel) throw error; stoppedBeforeFork = true; }
if (!capture || forkCalls !== 1 || !stoppedBeforeFork) throw new Error("Expected exactly one intercepted fork");
process.stdout.write(JSON.stringify({ ...capture, forkCalls, stoppedBeforeFork }) + "\n");
`;

const realWorker = String.raw`
const Tinypool = await loadPool();
const instance = Reflect.construct(Tinypool, [{ filename: new URL("./worker.mjs", import.meta.url).href, minThreads: 1, maxThreads: 1, runtime: "child_process", env: {}, execArgv: [] }]);
const pool = Schema.decodeUnknownSync(Schema.Struct({ run: Schema.Unknown, destroy: Schema.Unknown }))(instance);
if (typeof pool.run !== "function" || typeof pool.destroy !== "function") throw new Error("Invalid provisioned pool methods");
try {
  const result = Schema.decodeUnknownSync(Schema.Struct({ value: Schema.Literal(42), runtime: Schema.Literal("child_process") }))(await pool.run.call(instance, 41));
  process.stdout.write(JSON.stringify(result) + "\n");
} finally { await pool.destroy.call(instance); }
`;

async function probe(code: string): Promise<string> {
  const directory = await mkdtemp("tinypool-regression-");
  await writeFile(join(directory, "probe.mjs"), bootstrap + code, { encoding: "utf8", flag: "wx" });
  await writeFile(
    join(directory, "worker.mjs"),
    'export default (input) => { if (input !== 41) throw new Error("Invalid fixture input"); return { value: input + 1, runtime: "child_process" }; };\n',
    { encoding: "utf8", flag: "wx" },
  );
  const result = await runProcess(repository, process.execPath, [join(directory, "probe.mjs")], {
    timeoutMs: 30_000,
    maximumLineBytes: 16_384,
    maximumBytes: 262_144,
  });
  assert.equal(result.outcome, "exited", result.stderr);
  assert.equal(result.termination, "closed", result.stderr);
  assert.equal(result.code, 0, result.stderr);
  assert.equal(result.stderr, "");
  return result.stdout;
}

async function requireHiddenFork(): Promise<void> {
  const result = Schema.decodeUnknownSync(
    Schema.fromJsonString(
      Schema.Struct({
        windowsHide: Schema.NullOr(Schema.Boolean),
        stdio: Schema.Literal("pipe"),
        envKeys: Schema.Array(Schema.String),
        forkCalls: Schema.Literal(1),
        stoppedBeforeFork: Schema.Literal(true),
      }),
    ),
    { onExcessProperty: "error" },
  )(await probe(noLaunchProbe));
  assert.equal(
    result.windowsHide,
    true,
    "Installed process worker must explicitly request hidden native children",
  );
  assert.deepEqual(result.envKeys, ["TINYPOOL_WORKER_ID"]);
}

await test(
  "installed Tinypool requests hidden process workers without changing pipe or env behavior",
  { timeout: 40_000 },
  requireHiddenFork,
);

await test(
  "patched installed Tinypool completes a real process-worker task and teardown",
  { timeout: 70_000 },
  async () => {
    // Reject unpatched installs before any real worker, even if another test failed.
    await requireHiddenFork();
    const result = Schema.decodeUnknownSync(
      Schema.fromJsonString(
        Schema.Struct({ value: Schema.Literal(42), runtime: Schema.Literal("child_process") }),
      ),
      { onExcessProperty: "error" },
    )(await probe(realWorker));
    assert.equal(result.value, 42);
  },
);
