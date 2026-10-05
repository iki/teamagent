import { strict as assert } from "node:assert";
import { mkdtemp, mkdir, readFile, readdir, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { test } from "node:test";
import { Effect, Schema } from "effect";
import { openMemoryHost } from "teamagent/memory/bun";
import { runExtractorBenchmark } from "../app/benchmark/extractors.ts";
import {
  inspectExtractorProfile,
  loadExtractorConfig,
  resolveExtractorProfile,
} from "../app/imports/extractors.ts";
import { contained } from "../app/imports/limits.ts";
import { defaultImportPython } from "../app/imports/documents.ts";
import { withHostInterruption } from "../app/runtime/interruption.ts";
import { scopedHostPromise } from "../app/imports/lifecycle.ts";

const repository = resolve(import.meta.dir, "..");
const cliPath = join(repository, "app/cli/index.ts");
const ReadySchema = Schema.Struct({
  pid: Schema.Int.check(Schema.isGreaterThan(0)),
  childPid: Schema.Int.check(Schema.isGreaterThan(0)),
  staging: Schema.String,
});
type Ready = typeof ReadySchema.Type;
const CommandResultSchema = Schema.Struct({
  status: Schema.Int,
  stdout: Schema.String,
  stderr: Schema.String,
});
const worker = String.raw`
import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
if (process.argv.includes("--child")) await Bun.sleep(60000);
else if ((process.argv.includes("--version") && process.env.FIXTURE_MODE !== "probe") || process.env.FIXTURE_MODE === "version") process.stdout.write("fixture 1.0.0\n");
else if (process.env.FIXTURE_MODE === "slow" || process.env.FIXTURE_MODE === "probe") {
  const child = spawn(process.execPath, [process.argv[1], "--child"], { stdio: "ignore", windowsHide: true });
  await writeFile(process.env.FIXTURE_READY, JSON.stringify({ pid: process.pid, childPid: child.pid, staging: process.cwd() }));
  await Bun.sleep(60000);
} else {
  const output = process.argv[3];
  await mkdir(output, { recursive: true });
  await writeFile(join(output, "document.md"), "# Original successful extraction\n");
}
`;

async function fixture() {
  const directory = await realpath(await mkdtemp(join(tmpdir(), "teamagent-host-interruption-")));
  const root = join(directory, "workspace");
  const data = join(directory, "state");
  const ready = join(directory, "ready.json");
  const script = join(directory, "extractor.mjs");
  const config = join(directory, "extractors.json");
  await mkdir(root);
  await writeFile(script, worker);
  await writeFile(join(root, "source.pdf"), "%PDF-1.4\nfixture source\n");
  const profile = (id: string, mode: string) => ({
    id,
    engine: "xberg",
    version: "1.0.0",
    command: process.execPath,
    args: [script, "{input}", "{outputDir}"],
    versionArgs: [script, "--version"],
    env: { FIXTURE_MODE: mode, FIXTURE_READY: ready },
    timeoutMs: 30000,
  });
  const configure = async (mode: string) =>
    writeFile(
      config,
      JSON.stringify({
        version: 1,
        defaultProfile: "selected",
        profiles: [profile("selected", mode)],
      }),
    );
  await configure("fast");
  return { directory, root, data, ready, script, config, profile, configure };
}

async function waitReady(path: string): Promise<Ready> {
  for (let attempt = 0; attempt < 1000; attempt++) {
    try {
      const dynamic: unknown = JSON.parse(await readFile(path, "utf8"));
      return Schema.decodeUnknownSync(ReadySchema)(dynamic);
    } catch {
      await Bun.sleep(20);
    }
  }
  throw new Error("Fixture extractor did not become ready");
}

function assertReaped(ready: Ready) {
  assert.throws(() => process.kill(ready.pid, 0));
  assert.throws(() => process.kill(ready.childPid, 0));
}

async function cleanup(directory: string, readyPath: string) {
  try {
    const dynamic: unknown = JSON.parse(await readFile(readyPath, "utf8"));
    const ready = Schema.decodeUnknownSync(ReadySchema)(dynamic);
    for (const pid of [ready.childPid, ready.pid]) {
      try {
        process.kill(pid, "SIGKILL");
      } catch {
        /* Fixture already reaped. */
      }
    }
  } catch {
    /* Fixture may not have started. */
  }
  try {
    const dynamic: unknown = JSON.parse(
      await readFile(join(directory, "console-host.json"), "utf8"),
    );
    const pid = Schema.decodeUnknownSync(Schema.Int.check(Schema.isGreaterThan(0)))(dynamic);
    try {
      process.kill(pid, "SIGKILL");
    } catch {
      /* Host already exited. */
    }
  } catch {
    /* Non-Windows fixture or console host was not started. */
  }
  const base = await realpath(tmpdir());
  const target = resolve(directory);
  assert.ok(
    contained(base, target) && target !== base && target.includes("teamagent-host-interruption-"),
  );
  await rm(target, { recursive: true, force: true });
}

async function interruptCommand(
  f: Awaited<ReturnType<typeof fixture>>,
  args: readonly string[],
  event: "SIGINT" | "SIGTERM" | "SIGBREAK",
) {
  const command = [process.execPath, cliPath, ...args];
  if (process.platform === "win32") {
    assert.notEqual(
      event,
      "SIGTERM",
      "Windows process.kill(SIGTERM) is force termination, not a console interrupt",
    );
    const specification = join(f.directory, "console.json");
    await writeFile(
      specification,
      JSON.stringify({
        command,
        cwd: f.root,
        ready: f.ready,
        hostPid: join(f.directory, "console-host.json"),
        event: event === "SIGBREAK" ? 1 : 0,
      }),
    );
    const child = Bun.spawn(
      [
        defaultImportPython(),
        "-I",
        "-B",
        join(repository, "test/host-console-fixture.py"),
        specification,
      ],
      { stdout: "pipe", stderr: "pipe", stdin: "ignore" },
    );
    const timer = setTimeout(() => child.kill(), 50000);
    try {
      const [stdout, stderr, status] = await Promise.all([
        new Response(child.stdout).text(),
        new Response(child.stderr).text(),
        child.exited,
      ]);
      assert.equal(status, 0, stderr);
      const dynamic: unknown = JSON.parse(stdout);
      return Schema.decodeUnknownSync(CommandResultSchema)(dynamic);
    } finally {
      clearTimeout(timer);
    }
  }
  const child = Bun.spawn(command, {
    cwd: f.root,
    stdin: "ignore",
    stdout: "pipe",
    stderr: "pipe",
  });
  const timer = setTimeout(() => child.kill("SIGKILL"), 25000);
  try {
    await waitReady(f.ready);
    child.kill(event === "SIGBREAK" ? "SIGTERM" : event);
    const [stdout, stderr, status] = await Promise.all([
      new Response(child.stdout).text(),
      new Response(child.stderr).text(),
      child.exited,
    ]);
    return { stdout, stderr, status };
  } finally {
    clearTimeout(timer);
    child.kill();
  }
}

await test("scoped host Promise interruption joins asynchronous cleanup before returning", async () => {
  const controller = new AbortController();
  let ready = () => {};
  const started = new Promise<void>((resolveStarted) => {
    ready = resolveStarted;
  });
  let cleaned = false;
  const operation = Effect.runPromise(
    scopedHostPromise({
      try: async (signal) => {
        try {
          ready();
          await new Promise<void>((_, reject) =>
            signal.addEventListener("abort", () => reject(new Error("cancelled")), { once: true }),
          );
        } finally {
          await Bun.sleep(40);
          cleaned = true;
        }
      },
      catch: (error) => error,
    }),
    { signal: controller.signal },
  );
  await started;
  controller.abort();
  await assert.rejects(operation);
  assert.equal(cleaned, true);
});

await test("host interruption scope removes only its handlers after success and failure", async () => {
  const signals: readonly NodeJS.Signals[] =
    process.platform === "win32" ? ["SIGINT", "SIGTERM", "SIGBREAK"] : ["SIGINT", "SIGTERM"];
  const before = signals.map((signal) => process.listeners(signal));
  await withHostInterruption(async () => {
    await Bun.sleep(1);
  });
  await assert.rejects(
    withHostInterruption(async () => {
      throw new Error("fixture failure");
    }),
  );
  assert.deepEqual(
    signals.map((signal) => process.listeners(signal)),
    before,
  );
});

await test("a pre-aborted host signal does not start the Promise operation", async () => {
  let started = false;
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(
    Effect.runPromise(
      scopedHostPromise({
        try: async () => {
          started = true;
        },
        catch: (error) => error,
      }),
      { signal: controller.signal },
    ),
  );
  assert.equal(started, false);
});

await test("interrupted extractor doctor waits until the probe and its child are reaped", async () => {
  const f = await fixture();
  const controller = new AbortController();
  try {
    await f.configure("probe");
    const config = await Effect.runPromise(loadExtractorConfig(f.config));
    const profile = await Effect.runPromise(resolveExtractorProfile(config));
    const operation = Effect.runPromise(inspectExtractorProfile(profile), {
      signal: controller.signal,
    });
    const ready = await waitReady(f.ready);
    controller.abort();
    await assert.rejects(operation);
    assertReaped(ready);
  } finally {
    controller.abort();
    await cleanup(f.directory, f.ready);
  }
});

for (const action of ["get", "sync", "doctor"] as const) {
  await test(`memory ${action} handles a real console/process interruption and completes cleanup`, async () => {
    const f = await fixture();
    let previousId: string | undefined;
    let sourceId: string | undefined;
    try {
      if (action === "sync") {
        const memory = await Effect.runPromise(
          openMemoryHost({ data: f.data, root: f.root, extractorsConfig: f.config }),
        );
        try {
          const initial = await Effect.runPromise(memory.get({ locator: "source.pdf" }));
          previousId = initial.version.id;
          sourceId = initial.source.id;
        } finally {
          await Effect.runPromise(memory.close());
        }
      }
      await f.configure(action === "doctor" ? "probe" : "slow");
      const args =
        action === "doctor"
          ? ["memory", "doctor", "--extractors-config", f.config]
          : [
              "memory",
              action,
              sourceId ?? "source.pdf",
              "--root",
              f.root,
              "--data",
              f.data,
              "--extractors-config",
              f.config,
            ];
      const result = await interruptCommand(f, args, action === "sync" ? "SIGBREAK" : "SIGINT");
      assert.notEqual(result.status, 0);
      assert.match(result.stderr, /cancelled/);
      assert.equal(result.stdout, "");
      const ready = await waitReady(f.ready);
      assertReaped(ready);
      if (action !== "doctor") {
        await assert.rejects(readdir(ready.staging));
        const memory = await Effect.runPromise(openMemoryHost({ data: f.data, root: f.root }));
        try {
          if (sourceId === undefined)
            assert.equal((await Effect.runPromise(memory.list())).total, 0);
          else
            assert.equal(
              (await Effect.runPromise(memory.show(sourceId))).source.currentVersionId,
              previousId,
            );
        } finally {
          await Effect.runPromise(memory.close());
        }
      }
    } finally {
      await cleanup(f.directory, f.ready);
    }
  });
}

await test("operator-aborted benchmark preserves completed measurements and leaves its active invocation unmeasured", async () => {
  const f = await fixture();
  const controller = new AbortController();
  const output = join(f.directory, "benchmark");
  try {
    await writeFile(
      f.config,
      JSON.stringify({
        version: 1,
        defaultProfile: "fast",
        profiles: [f.profile("fast", "fast"), f.profile("slow", "slow")],
      }),
    );
    const operation = runExtractorBenchmark({
      configPath: f.config,
      profileIds: ["fast", "slow"],
      outputDirectory: output,
      repeats: 1,
      sourceIds: ["synthetic-scanned-en-cs"],
      signal: controller.signal,
    });
    const ready = await waitReady(f.ready);
    controller.abort();
    await assert.rejects(operation);
    assertReaped(ready);
    const source = "synthetic-scanned-en-cs";
    for (const repeat of ["0", "1"]) {
      const dynamic: unknown = JSON.parse(
        await readFile(join(output, "fast", source, repeat, "measurement.json"), "utf8"),
      );
      assert.equal(
        Schema.decodeUnknownSync(Schema.Struct({ status: Schema.String }))(dynamic).status,
        "success",
      );
    }
    await assert.rejects(readFile(join(output, "slow", source, "0/measurement.json")));
    await assert.rejects(readdir(join(output, "slow", source, "1")));
    await assert.rejects(readFile(join(output, "results.json")));
    assert.deepEqual(await readdir(join(output, "slow", source, "0/work")), []);
  } finally {
    controller.abort();
    await cleanup(f.directory, f.ready);
  }
});
