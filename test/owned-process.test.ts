import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import {
  access,
  copyFile,
  link,
  mkdir,
  readFile,
  readdir,
  rm,
  unlink,
  writeFile,
} from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { test } from "node:test";
import { Schema } from "effect";
import { boundedRead } from "../app/check/cache-io.ts";
import {
  createPosixGroupCompletion,
  inspectOwnedProcessArtifact,
  inspectOwnedProcessCompletion,
  ownedProcessIdentity,
  spawnOwned,
  type OwnedProcess,
  type OwnedProcessOptions,
} from "../app/check/owned-process.ts";
import {
  borrowTemporaryWorkspace,
  createTemporaryWorkspace,
} from "../app/check/temporary-workspace.ts";

await test("POSIX cleanup joins one signal and does not revisit a disappeared group", async () => {
  let present = true;
  let signals = 0;
  let probes = 0;
  let completed = false;
  const observation = Promise.withResolvers<void>();
  const joinGroup = createPosixGroupCompletion({
    terminate: () => {
      signals++;
      return true;
    },
    exists: () => {
      probes++;
      return present;
    },
    wait: () => observation.promise,
    now: () => 0,
    timeoutMs: 100,
  });
  const first = joinGroup();
  void first.then(() => {
    completed = true;
  });
  assert.equal(joinGroup(), first);
  await Promise.resolve();
  assert.equal(completed, false, "Signal delivery alone is not confirmed shutdown");
  assert.equal(signals, 1);
  present = false;
  observation.resolve();
  await first;
  assert.equal(completed, true);
  assert.equal(probes, 2);
  present = true;
  assert.equal(joinGroup(), first);
  await joinGroup();
  assert.equal(signals, 1, "A recycled group ID must never receive another signal");
  assert.equal(probes, 2);
});

await test("POSIX cleanup retains its bounded timeout and never retries the group", async () => {
  let elapsed = 0;
  let signals = 0;
  let waits = 0;
  const joinGroup = createPosixGroupCompletion({
    terminate: () => {
      signals++;
      return true;
    },
    exists: () => true,
    wait: async () => {
      waits++;
      elapsed += 10;
    },
    now: () => elapsed,
    timeoutMs: 20,
  });
  const result = joinGroup();
  await assert.rejects(result, /process group cleanup timed out/u);
  assert.equal(joinGroup(), result);
  await assert.rejects(joinGroup(), /process group cleanup timed out/u);
  assert.equal(signals, 1);
  assert.equal(waits, 2);
});

await test("POSIX cleanup retains signal, probe and observation failures", async () => {
  for (const stage of ["terminate", "exists", "wait"] as const) {
    const failure = new Error("Fixture " + stage + " failure");
    let signals = 0;
    const joinGroup = createPosixGroupCompletion({
      terminate: () => {
        signals++;
        if (stage === "terminate") throw failure;
        return true;
      },
      exists: () => {
        if (stage === "exists") throw failure;
        return true;
      },
      wait: async () => {
        throw failure;
      },
      now: () => 0,
      timeoutMs: 20,
    });
    const result = joinGroup();
    await assert.rejects(result, (error: unknown) => error === failure);
    assert.equal(joinGroup(), result);
    await assert.rejects(joinGroup(), (error: unknown) => error === failure);
    assert.equal(signals, 1);
  }
});

await test("POSIX cleanup never probes after the initial signal reports an absent group", async () => {
  let signals = 0;
  const joinGroup = createPosixGroupCompletion({
    terminate: () => {
      signals++;
      return false;
    },
    exists: () => {
      throw new Error("A recycled group ID must not be probed");
    },
    wait: async () => {
      throw new Error("No wait is needed for an absent group");
    },
    now: () => 0,
    timeoutMs: 20,
  });
  const first = joinGroup();
  await first;
  assert.equal(joinGroup(), first);
  await joinGroup();
  assert.equal(signals, 1);
});

function alive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ESRCH") return false;
    throw error;
  }
}
async function text(stream: NodeJS.ReadableStream | null): Promise<string> {
  assert.ok(stream);
  let output = "";
  const chunks: AsyncIterable<unknown> = stream;
  for await (const chunk of chunks) {
    assert.ok(chunk instanceof Uint8Array);
    output += new TextDecoder().decode(chunk);
    assert.ok(Buffer.byteLength(output) < 64 * 1024);
  }
  return output;
}
async function fixture(
  run: (
    directory: string,
    start: (
      script: string,
      args?: readonly string[],
      options?: Partial<OwnedProcessOptions>,
    ) => Promise<OwnedProcess>,
  ) => Promise<void>,
): Promise<void> {
  const workspace = await createTemporaryWorkspace(resolve(import.meta.dir, ".."), "process-test");
  const processes: OwnedProcess[] = [];
  const failures: unknown[] = [];
  try {
    await run(workspace.path, async (script, args = [], options = {}) => {
      const owned = await spawnOwned(process.execPath, [script, ...args], {
        cwd: workspace.path,
        stdio: "pipe",
        ...options,
      });
      processes.push(owned);
      return owned;
    });
  } catch (error) {
    failures.push(error);
  }
  let confirmed = true;
  for (const owned of processes) {
    try {
      await owned.stop();
      if ((await owned.closed).termination !== "closed") confirmed = false;
    } catch (error) {
      confirmed = false;
      failures.push(error);
    }
  }
  if (confirmed) {
    try {
      await workspace.dispose();
    } catch (error) {
      failures.push(error);
    }
  } else failures.push(new Error("Owned fixture cleanup was unconfirmed; scratch was retained"));
  if (failures.length === 1) throw failures[0];
  if (failures.length)
    throw new AggregateError(failures, "Owned fixture operation and cleanup failed");
}

await test(
  "separate native callers join cold publication after observing the same absent artifact",
  { skip: process.platform !== "win32", timeout: 30_000 },
  async () => {
    await fixture(async (directory, start) => {
      const project = join(directory, "shared-project");
      const release = join(directory, "release");
      const script = join(directory, "cold-callers.ts");
      await mkdir(project);
      await writeFile(
        script,
        [
          `import { access, writeFile } from "node:fs/promises";`,
          `import { ownedProcessIdentity } from ${JSON.stringify(pathToFileURL(resolve(import.meta.dir, "../app/check/owned-process.ts")).href)};`,
          `const identity = await ownedProcessIdentity(${JSON.stringify(project)}, async phase => {`,
          `  if (phase !== "optimistic-absent") return;`,
          `  await writeFile(process.argv[2], "ready\\n", { flag: "wx" });`,
          `  const deadline = Date.now() + 5000;`,
          `  while (true) {`,
          `    try { await access(${JSON.stringify(release)}); break; }`,
          `    catch (error) { if (!(error instanceof Error) || !("code" in error) || error.code !== "ENOENT") throw error; }`,
          `    if (Date.now() >= deadline) throw new Error("Cold publication barrier timed out");`,
          `    await Bun.sleep(10);`,
          `  }`,
          `});`,
          `process.stdout.write(identity + "\\n");`,
          "",
        ].join("\n"),
        "utf8",
      );
      const processes: OwnedProcess[] = [];
      const streams: Promise<string>[] = [];
      try {
        for (const id of [0, 1]) {
          const owned = await start(script, [join(directory, `ready-${id}`)], {
            timeoutMs: 10_000,
          });
          processes.push(owned);
          owned.child.stdin?.end();
          streams.push(text(owned.child.stdout), text(owned.child.stderr));
        }
        const deadline = Date.now() + 5000;
        for (const id of [0, 1]) {
          while (true) {
            try {
              await access(join(directory, `ready-${id}`));
              break;
            } catch (error) {
              if (!(error instanceof Error) || !("code" in error) || error.code !== "ENOENT")
                throw error;
            }
            assert.ok(Date.now() < deadline, "Both callers must reach the absent-artifact barrier");
            await Bun.sleep(10);
          }
        }
        await writeFile(release, "release\n", { flag: "wx" });
        const results = await Promise.all(processes.map((owned) => owned.closed));
        for (const result of results) {
          assert.equal(result.termination, "closed");
          assert.equal(result.error, undefined);
          assert.equal(result.code, 0);
        }
        const outputs = await Promise.all(streams);
        assert.match(outputs[0] ?? "", /^[a-f0-9]{64}\n$/u);
        assert.equal(outputs[0], outputs[2]);
        assert.equal(outputs[1], "");
        assert.equal(outputs[3], "");
        const cache = join(project, ".cache/verification/native-owned-process");
        const keys = await readdir(cache);
        assert.equal(keys.length, 1);
        assert.ok(keys[0]);
        assert.deepEqual((await readdir(join(cache, keys[0]))).sort(), [
          "binary.sha256",
          "owned-process.exe",
        ]);
        await assert.rejects(
          access(join(project, ".cache/verification/native-owned-process.lock")),
          { code: "ENOENT" },
        );
      } finally {
        await Promise.allSettled(processes.map((owned) => owned.stop()));
        await Promise.allSettled(streams);
      }
    });
  },
);

await test(
  "warm native reuse detects changed implementation inputs in an isolated source copy",
  { skip: process.platform !== "win32", timeout: 30_000 },
  async () => {
    await fixture(async (directory, start) => {
      const project = join(directory, "implementation");
      const check = join(project, "app/check");
      await mkdir(check, { recursive: true });
      for (const name of [
        "owned-process.ts",
        "owned-process-windows.cs",
        "cache-io.ts",
        "cache-fingerprint.ts",
        "temporary-workspace.ts",
      ])
        await copyFile(resolve(import.meta.dir, "../app/check", name), join(check, name));
      // Exact copied source bytes share the real implementation's initial key.
      const identity = await ownedProcessIdentity(project);
      const cache = join(project, ".cache/verification/native-owned-process");
      const keys = await readdir(cache);
      const script = join(directory, "input-drift.ts");
      await writeFile(
        script,
        [
          `import assert from "node:assert/strict";`,
          `import { appendFile } from "node:fs/promises";`,
          `import { ownedProcessIdentity } from ${JSON.stringify(pathToFileURL(join(check, "owned-process.ts")).href)};`,
          `let observed = false;`,
          `await assert.rejects(ownedProcessIdentity(${JSON.stringify(project)}, async phase => {`,
          `  if (phase === "optimistic-complete") {`,
          `    observed = true;`,
          `    await appendFile(${JSON.stringify(join(check, "owned-process-windows.cs"))}, "\\n// Isolated fixture input drift.\\n");`,
          `  }`,
          `}), /inputs changed during reuse/);`,
          `assert.equal(observed, true);`,
          `process.stdout.write("input-drift-rejected\\n");`,
          "",
        ].join("\n"),
        "utf8",
      );
      const owned = await start(script, [], { timeoutMs: 10_000 });
      owned.child.stdin?.end();
      const streams = [text(owned.child.stdout), text(owned.child.stderr)] as const;
      try {
        const result = await owned.closed;
        assert.equal(result.termination, "closed");
        assert.equal(result.error, undefined);
        const [stdout, stderr] = await Promise.all(streams);
        assert.equal(result.code, 0, stderr);
        assert.equal(stdout, "input-drift-rejected\n");
        assert.equal(stderr, "");
        assert.deepEqual(await readdir(cache), keys);
        assert.equal(await ownedProcessIdentity(project), identity);
      } finally {
        await owned.stop();
        await Promise.allSettled(streams);
      }
    });
  },
);

await test(
  "native cancellation waits for its event before confirming startup cleanup",
  { skip: process.platform !== "win32", timeout: 30_000 },
  async () => {
    await fixture(async (directory, start) => {
      const project = join(directory, "s");
      const check = join(project, "app/check");
      await mkdir(check, { recursive: true });
      for (const name of [
        "owned-process.ts",
        "owned-process-windows.cs",
        "cache-io.ts",
        "cache-fingerprint.ts",
        "temporary-workspace.ts",
      ])
        await copyFile(resolve(import.meta.dir, "../app/check", name), join(check, name));
      const native = join(check, "owned-process-windows.cs");
      let source = await readFile(native, "utf8");
      const beforeEvent =
        "            cancellation = CreateEventW(IntPtr.Zero, true, false, arguments[1]);";
      const afterMissing =
        '                    if (error != 2) throw new Win32Exception(error, "Open owned cancellation event");';
      assert.equal(source.split(beforeEvent).length, 2);
      assert.equal(source.split(afterMissing).length, 2);
      // Change only this private source copy. The supervisor cannot create its event
      // until the real stop helper has observed ERROR_FILE_NOT_FOUND at least once.
      source = source.replace(
        beforeEvent,
        [
          '            string release = System.IO.Path.Combine(Environment.CurrentDirectory, "stop-observed-missing");',
          "            var startupDeadline = Stopwatch.StartNew();",
          "            while (!System.IO.File.Exists(release)) {",
          '                if (startupDeadline.ElapsedMilliseconds >= 4000) throw new Exception("Fixture startup barrier timed out");',
          "                Thread.Sleep(10);",
          "            }",
          beforeEvent,
        ].join("\n"),
      );
      source = source.replace(
        afterMissing,
        `${afterMissing}\n                    System.IO.File.WriteAllText(System.IO.Path.Combine(Environment.CurrentDirectory, "stop-observed-missing"), "missing\\n");`,
      );
      await writeFile(native, source, "utf8");
      const script = join(directory, "cancel-startup.ts");
      await writeFile(
        script,
        [
          'import assert from "node:assert/strict";',
          'import { readFile, readdir } from "node:fs/promises";',
          'import { text } from "node:stream/consumers";',
          `import { spawnOwned } from ${JSON.stringify(pathToFileURL(join(check, "owned-process.ts")).href)};`,
          `const project = ${JSON.stringify(project)};`,
          'const owned = await spawnOwned(process.execPath, ["-e", "setInterval(()=>{},1000)"], {cwd:project,projectRoot:project,stdio:"pipe"});',
          "assert.ok(owned.child.stdout && owned.child.stderr && owned.child.stdin);",
          "const output = [text(owned.child.stdout), text(owned.child.stderr)] as const;",
          "owned.child.stdin.end();",
          "try {",
          '  await owned.stop("fixture startup cancellation");',
          "  const result = await owned.closed;",
          "  const streams = await Promise.all(output);",
          '  assert.equal(result.termination, "closed", streams[1]);',
          "  assert.equal(result.code, 255);",
          '  assert.equal(result.error?.message, "fixture startup cancellation");',
          '  assert.equal(await readFile(project + "/stop-observed-missing", "utf8"), "missing\\n");',
          '  assert.deepEqual(await readdir(project + "/.tmp"), []);',
          '  process.stdout.write("startup-cancellation-confirmed\\n");',
          "} finally { await owned.stop(); await Promise.allSettled(output); }",
          "",
        ].join("\n"),
        "utf8",
      );
      // This enclosing owned worker joins even an inner regression before removing
      // the copied implementation or any retained completion lease.
      const owned = await start(script, [], { cwd: project, timeoutMs: 10_000 });
      owned.child.stdin?.end();
      const output = [text(owned.child.stdout), text(owned.child.stderr)] as const;
      try {
        const result = await owned.closed;
        const [stdout, stderr] = await Promise.all(output);
        assert.equal(result.termination, "closed");
        assert.equal(result.error, undefined);
        assert.equal(result.code, 0, stderr);
        assert.equal(stdout, "startup-cancellation-confirmed\n");
        assert.equal(stderr, "");
      } finally {
        await owned.stop();
        await Promise.allSettled(output);
      }
    });
  },
);

await test(
  "native completion receipts validate drainage while preserving byte exit codes",
  { skip: process.platform !== "win32", timeout: 30_000 },
  async () => {
    await fixture(async (directory, start) => {
      const script = join(directory, "exit-status.ts");
      await writeFile(script, "process.exitCode = Number(process.argv[2]);\n", "utf8");
      for (const code of [0, 1, 7, 254, 255]) {
        const owned = await start(script, [String(code)]);
        owned.child.stdin?.end();
        const stdout = text(owned.child.stdout);
        const stderr = text(owned.child.stderr);
        const result = await owned.closed;
        assert.equal(result.termination, "closed");
        assert.equal(result.error, undefined);
        assert.equal(result.code, code);
        assert.equal(owned.child.exitCode, code);
        const completionPath = owned.child.spawnargs[3];
        assert.ok(completionPath);
        await assert.rejects(access(dirname(completionPath)), { code: "ENOENT" });
        await Promise.all([stdout, stderr]);
      }
    });
  },
);

await test(
  "native completion creation preserves an existing receipt and remains unconfirmed",
  { skip: process.platform !== "win32", timeout: 30_000 },
  async () => {
    const workspace = await createTemporaryWorkspace(
      resolve(import.meta.dir, ".."),
      "completion-collision",
    );
    const script = join(workspace.path, "controlled.ts");
    const marker = join(workspace.path, "controlled.pid");
    const failures: unknown[] = [];
    let owned: OwnedProcess | undefined;
    let controlledPid: number | undefined;
    let nativeClosed = false;
    const streams: Promise<string>[] = [];
    try {
      // This controlled child creates no descendants and waits for our explicit release.
      await writeFile(
        script,
        `await Bun.write(${JSON.stringify(marker)}, String(process.pid) + "\\n"); process.stdout.write("ready\\n"); await Bun.stdin.text(); process.exitCode = 7;\n`,
        "utf8",
      );
      owned = await spawnOwned(process.execPath, [script], {
        cwd: workspace.path,
        projectRoot: workspace.path,
        stdio: "pipe",
        timeoutMs: 10_000,
      });
      owned.child.once("close", () => {
        nativeClosed = true;
      });
      const ready = new Promise<void>((done, reject) => {
        owned?.child.stdout?.once("data", () => done());
        owned?.child.once("error", reject);
        owned?.child.once("close", () => reject(new Error("Controlled child closed before ready")));
      });
      streams.push(text(owned.child.stdout), text(owned.child.stderr));
      await ready;
      const pid = Schema.decodeUnknownSync(
        Schema.fromJsonString(
          Schema.Int.check(Schema.isGreaterThan(0), Schema.isLessThanOrEqualTo(2 ** 31 - 1)),
        ),
      )(
        new TextDecoder("utf-8", { fatal: true }).decode(
          await boundedRead(workspace.path, "controlled.pid", 64),
        ),
      );
      assert.ok(alive(pid));
      controlledPid = pid;
      const completionPath = owned.child.spawnargs[3];
      const completionToken = owned.child.spawnargs[4];
      assert.ok(completionPath && completionToken);
      assert.equal(completionPath, join(dirname(completionPath), "completion.json"));
      // Validate the observed path's physical containment and original lease before writing.
      await borrowTemporaryWorkspace(workspace.path, dirname(completionPath), completionToken);
      const sentinel = "existing completion must remain unchanged\n";
      await writeFile(completionPath, sentinel, { encoding: "utf8", flag: "wx" });
      owned.child.stdin?.end();
      const result = await owned.closed;
      assert.equal(result.code, 253);
      assert.equal(result.termination, "unconfirmed");
      assert.ok(result.error);
      assert.equal(
        new TextDecoder("utf-8", { fatal: true }).decode(
          await boundedRead(dirname(completionPath), "completion.json", 256),
        ),
        sentinel,
      );
      assert.equal(nativeClosed, true);
      await access(join(dirname(completionPath), ".owner.json"));
    } catch (error) {
      failures.push(error);
    }
    try {
      owned?.child.stdin?.end();
      await owned?.stop();
      await Promise.all(streams);
      const deadline = performance.now() + 5000;
      while (controlledPid !== undefined && alive(controlledPid) && performance.now() < deadline)
        await new Promise<void>((done) => setTimeout(done, 10));
      // A retained protocol lease is removable only after independent fixture shutdown proof.
      if (!owned || (nativeClosed && controlledPid !== undefined && !alive(controlledPid)))
        await workspace.dispose();
      else throw new Error("Controlled fixture shutdown was unconfirmed; scratch was retained");
    } catch (error) {
      failures.push(error);
    }
    if (failures.length === 1) throw failures[0];
    if (failures.length)
      throw new AggregateError(failures, "Completion collision fixture and cleanup failed");
  },
);

await test(
  "owned processes preserve literal arguments, input, streams and nonzero status",
  { timeout: 30_000 },
  async () => {
    await fixture(async (directory, start) => {
      const script = join(directory, "arguments.ts");
      await writeFile(
        script,
        'process.stdout.write(JSON.stringify(process.argv.slice(2)) + "\\n"); process.stderr.write(await Bun.stdin.text()); process.exitCode = 7;\n',
        "utf8",
      );
      const args = ["", "space value", 'quoted"value', "trailing\\", "žluťoučký", "$(literal)"];
      const owned = await start(script, args);
      owned.child.stdin?.end("input-marker\n");
      const [result, output, error] = await Promise.all([
        owned.closed,
        text(owned.child.stdout),
        text(owned.child.stderr),
      ]);
      assert.equal(result.code, 7);
      assert.equal(result.error, undefined);
      assert.equal(result.termination, "closed");
      assert.equal(output.trim(), JSON.stringify(args));
      assert.equal(error, "input-marker\n");
    });
  },
);

await test(
  "early parent exit joins descendants with inherited or closed pipes and preserves a sentinel",
  { timeout: 30_000 },
  async () => {
    await fixture(async (directory, start) => {
      const idle = join(directory, "idle.ts");
      await writeFile(idle, "setInterval(() => {}, 1000);\n", "utf8");
      const sentinel = await start(idle);
      for (const streams of ["ignore", "inherit"] as const) {
        const marker = join(directory, `${streams}.pid`);
        const script = join(directory, `${streams}.ts`);
        await writeFile(
          script,
          `import {spawn} from "node:child_process"; import {writeFileSync} from "node:fs"; const child=spawn(process.execPath,[${JSON.stringify(idle)}],{stdio:${JSON.stringify(streams)},shell:false,windowsHide:true}); writeFileSync(${JSON.stringify(marker)}, String(child.pid) + "\\n"); process.exit(0);\n`,
          "utf8",
        );
        const owned = await start(script);
        const [result, , error] = await Promise.all([
          owned.closed,
          text(owned.child.stdout),
          text(owned.child.stderr),
        ]);
        assert.equal(result.code, 0, error);
        assert.equal(result.error, undefined);
        assert.equal(result.termination, "closed");
        const descendant = Number(await readFile(marker, "utf8"));
        assert.ok(Number.isSafeInteger(descendant) && descendant > 0);
        assert.equal(alive(descendant), false);
        assert.ok(sentinel.child.pid && alive(sentinel.child.pid));
      }
    });
  },
);

await test(
  "owned cancellation, timeout and pre-aborted launch preserve cleanup outcomes",
  { timeout: 30_000 },
  async () => {
    await fixture(async (directory, start) => {
      const script = join(directory, "wait.ts");
      await writeFile(
        script,
        'process.stdout.write("ready\\n"); setInterval(() => {}, 1000);\n',
        "utf8",
      );
      const controller = new AbortController();
      const owned = await start(script, [], { signal: controller.signal });
      await new Promise<void>((done) => owned.child.stdout?.once("data", () => done()));
      const output = text(owned.child.stdout),
        error = text(owned.child.stderr);
      controller.abort();
      const [result] = await Promise.all([owned.closed, output, error]);
      assert.match(result.error?.message ?? "", /aborted/u);
      assert.equal(result.termination, "closed");
      await assert.rejects(start(script, [], { signal: controller.signal }));
      const timed = await start(script, [], { timeoutMs: 1000 });
      const timedOutput = text(timed.child.stdout),
        timedError = text(timed.child.stderr);
      const [expired] = await Promise.all([timed.closed, timedOutput, timedError]);
      assert.match(expired.error?.message ?? "", /timed out/u);
      assert.equal(expired.termination, "closed");
    });
  },
);

await test(
  "nested owned commands retain inherited streams and launch failures settle",
  { timeout: 30_000 },
  async () => {
    await fixture(async (directory, start) => {
      const target = join(directory, "echo.ts");
      await writeFile(
        target,
        'process.stdout.write("inherited-out\\n"); process.stderr.write("inherited-error\\n");\n',
        "utf8",
      );
      const script = join(directory, "nested.ts");
      const adapter = pathToFileURL(resolve(import.meta.dir, "../app/check/owned-process.ts")).href;
      await writeFile(
        script,
        `import {spawnOwned} from ${JSON.stringify(adapter)}; const owned=await spawnOwned(process.execPath,[${JSON.stringify(target)}],{cwd:${JSON.stringify(directory)},stdio:"inherit"}); const result=await owned.closed; process.exitCode=result.error || result.termination!=="closed" ? 1 : result.code ?? 1;\n`,
        "utf8",
      );
      const owned = await start(script);
      owned.child.stdin?.end();
      const [nested, output, error] = await Promise.all([
        owned.closed,
        text(owned.child.stdout),
        text(owned.child.stderr),
      ]);
      assert.equal(nested.code, 0);
      assert.equal(nested.error, undefined);
      assert.equal(nested.termination, "closed");
      assert.equal(output.trim(), "inherited-out");
      assert.equal(error.trim(), "inherited-error");
      await assert.rejects(
        spawnOwned(join(directory, "missing.exe"), [], { cwd: directory, stdio: "pipe" }),
      );
      const invalid = join(directory, "invalid.exe");
      await writeFile(invalid, "not an executable\n", "utf8");
      const failed = await spawnOwned(invalid, [], { cwd: directory, stdio: "pipe" });
      // A failed POSIX spawn has no child output; its pipes may close without EOF.
      // Windows still has a supervisor whose output must be joined.
      const [result] = await Promise.all([
        failed.closed,
        process.platform === "win32"
          ? Promise.all([text(failed.child.stdout), text(failed.child.stderr)])
          : Promise.resolve([]),
      ]);
      assert.notEqual(result.code, 0);
      if (process.platform === "win32") assert.equal(result.termination, "closed");
      else {
        assert.equal(result.termination, "closed");
        assert.ok(result.error && "code" in result.error);
        assert.equal(result.error.code, "EACCES");
      }
      await failed.stop();
    });
  },
);

await test(
  "Windows native ownership survives abrupt exit of its JavaScript owner",
  { skip: process.platform !== "win32", timeout: 30_000 },
  async () => {
    await fixture(async (directory) => {
      const marker = join(directory, "descendant.pid");
      const target = join(directory, "descendant.ts");
      await writeFile(
        target,
        `await Bun.write(${JSON.stringify(marker)},String(process.pid)+"\\n"); process.stdout.write("ready\\n"); setInterval(()=>{},1000);\n`,
        "utf8",
      );
      const script = join(directory, "abrupt-owner.ts");
      const adapter = pathToFileURL(resolve(import.meta.dir, "../app/check/owned-process.ts")).href;
      await writeFile(
        script,
        `import {spawnOwned} from ${JSON.stringify(adapter)}; const owned=await spawnOwned(process.execPath,[${JSON.stringify(target)}],{cwd:${JSON.stringify(directory)},projectRoot:${JSON.stringify(directory)},stdio:"pipe"}); owned.child.stdout?.once("data",()=>process.exit(0));\n`,
        "utf8",
      );
      const child = spawn(process.execPath, [script], {
        cwd: directory,
        shell: false,
        windowsHide: true,
        detached: false,
        stdio: "pipe",
        timeout: 15_000,
      });
      const output = text(child.stdout),
        error = text(child.stderr);
      const closed = new Promise<number | null>((done, reject) => {
        child.once("error", reject);
        child.once("close", done);
      });
      const [code, , stderr] = await Promise.all([closed, output, error]);
      assert.equal(code, 0, stderr);
      const descendant = Number(await readFile(marker, "utf8"));
      assert.ok(Number.isSafeInteger(descendant) && descendant > 0);
      const deadline = performance.now() + 5000;
      while (alive(descendant) && performance.now() < deadline)
        await new Promise<void>((done) => setTimeout(done, 10));
      assert.equal(alive(descendant), false);
    });
  },
);

await test(
  "owned transport settles unconfirmed when its close notification is unavailable",
  { timeout: 20_000 },
  async () => {
    const workspace = await createTemporaryWorkspace(
      resolve(import.meta.dir, ".."),
      "transport-test",
    );
    const script = join(workspace.path, "idle.ts");
    let independentlyClosed = false;
    let owned: OwnedProcess | undefined;
    try {
      await writeFile(
        script,
        'process.stdout.write("ready\\n"); setInterval(() => {}, 1000);\n',
        "utf8",
      );
      owned = await spawnOwned(process.execPath, [script], {
        cwd: workspace.path,
        projectRoot: workspace.path,
        stdio: "pipe",
      });
      await new Promise<void>((done) => owned?.child.stdout?.once("data", () => done()));
      // Withhold the adapter's notification to model an unusable inherited-pipe transport.
      owned.child.removeAllListeners("close");
      owned.child.once("close", (code, signal) => {
        independentlyClosed =
          process.platform === "win32" ? code === 255 && signal === null : signal === "SIGKILL";
      });
      await owned.stop("Fixture transport failure");
      const result = await owned.closed;
      assert.equal(result.termination, "unconfirmed");
      assert.ok(result.error);
      if (process.platform === "win32") {
        assert.equal(owned.child.exitCode, 255);
        assert.equal(result.code, 255);
        const completionPath = owned.child.spawnargs[3];
        assert.ok(completionPath);
        await access(completionPath);
      }
      assert.equal(owned.child.stdout?.destroyed, true);
      assert.equal(owned.child.stderr?.destroyed, true);
      assert.equal(independentlyClosed, true);
      await access(join(workspace.path, ".owner.json"));
      await owned.stop();
    } finally {
      await owned?.stop();
      // No descendants are spawned; the fixture separately observes real transport closure.
      if (independentlyClosed) await workspace.dispose();
    }
  },
);

await test(
  "escaped POSIX pipes cannot make cancellation exceed the transport cleanup bound",
  { skip: process.platform === "win32", timeout: 20_000 },
  async () => {
    const workspace = await createTemporaryWorkspace(
      resolve(import.meta.dir, ".."),
      "escaped-pipe",
    );
    const idle = join(workspace.path, "idle.ts");
    const parent = join(workspace.path, "parent.ts");
    const marker = join(workspace.path, "escaped.pid");
    const release = join(workspace.path, "release");
    const ended = join(workspace.path, "ended");
    let released = false;
    let escapedPid: number | undefined;
    let owned: OwnedProcess | undefined;
    const failures: unknown[] = [];
    try {
      // The escaped fixture ends itself through a private file, never a discovered PID.
      await writeFile(
        idle,
        `import {existsSync,writeFileSync} from "node:fs"; const timer=setInterval(()=>{if(existsSync(${JSON.stringify(release)})){clearInterval(timer);writeFileSync(${JSON.stringify(ended)},"ended\\n");}},20);\n`,
        "utf8",
      );
      await writeFile(
        parent,
        `import {spawn} from "node:child_process"; import {writeFileSync} from "node:fs"; const child=spawn(process.execPath,[${JSON.stringify(idle)}],{detached:true,stdio:"inherit",shell:false}); writeFileSync(${JSON.stringify(marker)},String(child.pid)+"\\n"); process.stdout.write("ready\\n"); process.exit(0);\n`,
        "utf8",
      );
      owned = await spawnOwned(process.execPath, [parent], { cwd: workspace.path, stdio: "pipe" });
      await new Promise<void>((done) => owned?.child.stdout?.once("data", () => done()));
      const escaped = Number(await readFile(marker, "utf8"));
      assert.ok(Number.isSafeInteger(escaped) && escaped > 0 && alive(escaped));
      escapedPid = escaped;
      await owned.stop("Escaped pipe fixture");
      assert.equal((await owned.closed).termination, "unconfirmed");
      assert.equal(alive(escaped), true);
      await access(join(workspace.path, ".owner.json"));
    } catch (error) {
      failures.push(error);
    }
    try {
      await writeFile(release, "release\n", "utf8");
    } catch (error) {
      failures.push(error);
    }
    const deadline = performance.now() + 5000;
    while (performance.now() < deadline) {
      try {
        await access(ended);
        if (escapedPid !== undefined && !alive(escapedPid)) {
          released = true;
          break;
        }
      } catch {
        /* The fixture has not reported shutdown yet. */
      }
      await new Promise<void>((done) => setTimeout(done, 20));
    }
    try {
      await owned?.stop();
    } catch (error) {
      failures.push(error);
    }
    if (released) {
      try {
        await workspace.dispose();
      } catch (error) {
        failures.push(error);
      }
    } else
      failures.push(new Error("Escaped fixture shutdown was unconfirmed; scratch was retained"));
    if (failures.length === 1) throw failures[0];
    if (failures.length)
      throw new AggregateError(failures, "Escaped fixture operation and cleanup failed");
  },
);

await test(
  "native completion receipts reject mismatched, malformed and nonprivate evidence",
  { timeout: 30_000 },
  async () => {
    await fixture(async (directory) => {
      const completion = await createTemporaryWorkspace(directory, "receipt");
      try {
        const path = join(completion.path, "completion.json");
        const receipt = { version: 1, token: completion.token, code: 7 };
        await assert.rejects(
          inspectOwnedProcessCompletion(completion, 7),
          /could not be confirmed/u,
        );
        const invalid = [
          "not JSON\n",
          `${JSON.stringify(receipt)}\r\n`,
          JSON.stringify(receipt),
          `${JSON.stringify({ ...receipt, version: 2 })}\n`,
          `${JSON.stringify({ ...receipt, token: "00000000-0000-4000-8000-000000000000" })}\n`,
          `${JSON.stringify({ ...receipt, extra: "untrusted-payload" })}\n`,
          `${JSON.stringify({ ...receipt, code: 0 })}\n`,
          `${JSON.stringify({ ...receipt, code: 253 })}\n`,
          `${JSON.stringify({ ...receipt, code: 256 })}\n`,
          "x".repeat(257),
        ];
        for (const value of invalid) {
          await writeFile(path, value, "utf8");
          await assert.rejects(
            inspectOwnedProcessCompletion(completion, 7),
            /could not be confirmed/u,
          );
          assert.equal(await readFile(path, "utf8"), value);
        }
        await writeFile(path, new Uint8Array([0xff, 0xfe]));
        await assert.rejects(
          inspectOwnedProcessCompletion(completion, 7),
          /could not be confirmed/u,
        );
        await writeFile(path, `${JSON.stringify(receipt)}\n`, "utf8");
        await inspectOwnedProcessCompletion(completion, 7);
        await assert.rejects(
          inspectOwnedProcessCompletion(completion, 1),
          /could not be confirmed/u,
        );
        const alias = join(completion.path, "alias");
        await link(path, alias);
        await assert.rejects(
          inspectOwnedProcessCompletion(completion, 7),
          /could not be confirmed/u,
        );
        await unlink(alias);
        await inspectOwnedProcessCompletion(completion, 7);
      } finally {
        await completion.dispose();
      }
    });
  },
);

await test(
  "native artifact inspection preserves corrupt evidence and process identity is stable",
  { timeout: 30_000 },
  async () => {
    await fixture(async (directory) => {
      assert.equal(await ownedProcessIdentity(), await ownedProcessIdentity());
      const folder = join(directory, "artifact");
      await mkdir(folder);
      assert.equal(await inspectOwnedProcessArtifact(directory, "absent"), undefined);
      assert.equal(await inspectOwnedProcessArtifact(directory, "artifact"), undefined);
      const binary = join(folder, "owned-process.exe"),
        receipt = join(folder, "binary.sha256");
      await writeFile(binary, "fixture binary\n", "utf8");
      await assert.rejects(inspectOwnedProcessArtifact(directory, "artifact"), /Incomplete/u);
      const checksum = createHash("sha256").update("fixture binary\n").digest("hex");
      await writeFile(receipt, `${checksum}\n`, "utf8");
      assert.equal((await inspectOwnedProcessArtifact(directory, "artifact"))?.digest, checksum);
      await writeFile(binary, "changed binary\n", "utf8");
      await assert.rejects(inspectOwnedProcessArtifact(directory, "artifact"), /integrity/u);
      assert.equal(await readFile(binary, "utf8"), "changed binary\n");
      assert.equal(await readFile(receipt, "utf8"), `${checksum}\n`);
      await rm(binary);
      await assert.rejects(inspectOwnedProcessArtifact(directory, "artifact"), /Incomplete/u);
      assert.equal(await readFile(receipt, "utf8"), `${checksum}\n`);
    });
  },
);
