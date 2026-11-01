import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { access, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { test } from "node:test";
import {
  inspectOwnedProcessArtifact,
  ownedProcessIdentity,
  spawnOwned,
  type OwnedProcess,
  type OwnedProcessOptions,
} from "../app/check/owned-process.ts";
import { createTemporaryWorkspace } from "../app/check/temporary-workspace.ts";

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
      const output = text(owned.child.stdout),
        error = text(owned.child.stderr);
      const result = await owned.closed;
      assert.equal(result.code, 7);
      assert.equal(result.error, undefined);
      assert.equal(result.termination, "closed");
      assert.equal((await output).trim(), JSON.stringify(args));
      assert.equal(await error, "input-marker\n");
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
        const output = text(owned.child.stdout),
          error = text(owned.child.stderr);
        const result = await owned.closed;
        assert.equal(result.code, 0, await error);
        assert.equal(result.termination, "closed");
        await output;
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
      const result = await owned.closed;
      assert.match(result.error?.message ?? "", /aborted/u);
      assert.equal(result.termination, "closed");
      await Promise.all([output, error]);
      await assert.rejects(start(script, [], { signal: controller.signal }));
      const timed = await start(script, [], { timeoutMs: 1000 });
      const timedOutput = text(timed.child.stdout),
        timedError = text(timed.child.stderr);
      const expired = await timed.closed;
      assert.match(expired.error?.message ?? "", /timed out/u);
      assert.equal(expired.termination, "closed");
      await Promise.all([timedOutput, timedError]);
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
      const output = text(owned.child.stdout),
        error = text(owned.child.stderr);
      assert.equal((await owned.closed).code, 0);
      assert.equal((await output).trim(), "inherited-out");
      assert.equal((await error).trim(), "inherited-error");
      await assert.rejects(
        spawnOwned(join(directory, "missing.exe"), [], { cwd: directory, stdio: "pipe" }),
      );
      const invalid = join(directory, "invalid.exe");
      await writeFile(invalid, "not an executable\n", "utf8");
      const failed = await spawnOwned(invalid, [], { cwd: directory, stdio: "pipe" });
      const failedOutput = text(failed.child.stdout),
        failedError = text(failed.child.stderr);
      const result = await failed.closed;
      assert.notEqual(result.code, 0);
      if (process.platform === "win32") assert.equal(result.termination, "closed");
      await Promise.all([failedOutput, failedError]);
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
        `import {spawnOwned} from ${JSON.stringify(adapter)}; const owned=await spawnOwned(process.execPath,[${JSON.stringify(target)}],{cwd:${JSON.stringify(directory)},stdio:"pipe"}); owned.child.stdout?.once("data",()=>process.exit(0));\n`,
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
      assert.equal(await closed, 0, await error);
      await output;
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
      owned = await spawnOwned(process.execPath, [script], { cwd: workspace.path, stdio: "pipe" });
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
