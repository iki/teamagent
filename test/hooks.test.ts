import { mkdtemp } from "./temporary.ts";
import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { Schema } from "effect";
import { checkDecision } from "../app/hooks/decision.ts";
import { completeHook } from "../app/hooks/completion.ts";
import { HookReceipt, runHookCommand } from "../app/hooks/process.ts";
import {
  hookDiagnosticPaths,
  hookDiagnosticRoot,
  reserveHookDiagnostics,
} from "../app/hooks/storage.ts";
import { runProcess } from "../app/workflow/process.ts";
import { digest } from "../app/workflow/storage.ts";

async function hookFixture(): Promise<string> {
  await mkdir(".cache/conversations", { recursive: true });
  return await mkdtemp(resolve(".cache/conversations/test-hook-process-"));
}
async function receipt(root: string, path: string): Promise<HookReceipt> {
  return Schema.decodeUnknownSync(Schema.fromJsonString(HookReceipt))(
    await readFile(join(root, path), "utf8"),
  );
}

await test("failed Stop verification requests one repair and never an endless continuation", () => {
  assert.deepEqual(checkDecision(true, false), {});
  assert.deepEqual(checkDecision(true, true), {});
  assert.equal(checkDecision(false, false).decision, "block");
  assert.equal(checkDecision(false, true).decision, undefined);
  assert.match(checkDecision(false, true).systemMessage ?? "", /still fails/);
});

await test("archive errors cannot skip the root verification gate", async () => {
  const calls: string[] = [];
  const result = await completeHook(
    "Stop",
    false,
    async () => {
      calls.push("archive");
      throw new Error("Transcript unavailable");
    },
    () => {
      calls.push("verify");
      return false;
    },
  );
  assert.deepEqual(calls, ["archive", "verify"]);
  assert.equal(result.decision, "block");
  assert.match(result.systemMessage ?? "", /has not been saved/);
  const child = await completeHook(
    "SubagentStop",
    false,
    () => true,
    () => {
      throw new Error("Subagents must not check incomplete shared edits");
    },
  );
  assert.deepEqual(child, {});
});

await test("a thrown verification timeout still archives and permits only one repair continuation", async () => {
  for (const alreadyContinued of [false, true]) {
    const calls: string[] = [];
    const result = await completeHook(
      "Stop",
      alreadyContinued,
      async () => {
        calls.push("archive");
        return true;
      },
      () => {
        calls.push("verify");
        throw new Error("Verification timeout");
      },
    );
    assert.deepEqual(calls, ["archive", "verify"]);
    if (alreadyContinued) {
      assert.equal(result.decision, undefined);
      assert.match(result.systemMessage ?? "", /still fails/u);
    } else {
      assert.equal(result.decision, "block");
    }
  }
});

await test("hook receipts retain pending intent and distinguish confirmed exit with redacted LF diagnostics", async () => {
  const root = await hookFixture();
  const script = join(root, "exit.ts");
  await writeFile(
    script,
    "process.stderr.write('api_key=fixture-private-value\\r\\nBearer fixture-bearer-value\\r\\n');\nprocess.exitCode = Number(process.argv[2]);\n",
  );
  for (const status of [7, 0]) {
    const result = await runHookCommand(root, "review", undefined, {
      runner: async (cwd, command, args, options) => {
        assert.ok(options, "Hook adapter must provide explicit process bounds");
        assert.equal(command, process.execPath);
        assert.deepEqual(args, ["app/check/index.ts", "review"]);
        assert.equal(options.timeoutMs, 300_000);
        assert.equal(options.maximumBytes, 16 * 1024 * 1024);
        const records = (await readdir(join(root, hookDiagnosticRoot))).filter(
          (name) => name !== ".lock",
        );
        const pending = await Promise.all(
          records.map((name) => receipt(root, `${hookDiagnosticRoot}/${name}/receipt.json`)),
        );
        assert.equal(
          pending.filter((entry) => entry.state === "pending" && entry.result === null).length,
          1,
        );
        return await runProcess(cwd, command, [script, String(status)], options);
      },
    });
    assert.equal(result.passed, status === 0);
    const saved = await receipt(root, result.receipt);
    assert.equal(saved.state, "completed");
    assert.equal(saved.result?.status, status);
    assert.equal(saved.result?.outcome, "exited");
    assert.equal(saved.result?.termination, "closed");
    assert.equal(
      saved.cleanupScope,
      process.platform === "win32" ? "windows-job-object" : "process-group",
    );
    const historical = Schema.decodeUnknownSync(HookReceipt)({
      ...saved,
      cleanupScope: "windows-child-tree",
    });
    assert.equal(historical.cleanupScope, "windows-child-tree");
    assert.ok(saved.log);
    const text = await readFile(join(root, saved.log.path), "utf8");
    assert.doesNotMatch(text, /fixture-private-value|fixture-bearer-value|\r/u);
    assert.match(text, /\[redacted\]/u);
    assert.equal(saved.log.sha256, digest(text));
    assert.equal(saved.log.bytes, Buffer.byteLength(text));
    assert.equal(saved.log.truncated, false);
  }
});

await test("hook timeout terminates its actual child tree and retains a failed outcome", async () => {
  const root = await hookFixture();
  await writeFile(join(root, "child.ts"), "setInterval(() => {}, 1000);\n");
  await writeFile(
    join(root, "parent.ts"),
    "import { spawn } from 'node:child_process';\nimport { writeFileSync } from 'node:fs';\nconst child = spawn(process.execPath, ['child.ts'], { stdio: 'inherit', windowsHide: true, detached: process.platform === 'win32' });\nwriteFileSync('child.pid', String(child.pid) + '\\n');\nprocess.stderr.write('fixture verification started\\n');\nsetInterval(() => {}, 1000);\n",
  );
  const began = Date.now();
  const result = await runHookCommand(root, "review", undefined, {
    runner: async (cwd, command, _args, options) => {
      assert.ok(options, "Hook adapter must provide explicit process bounds");
      assert.equal(options.timeoutMs, 300_000);
      return await runProcess(cwd, command, ["parent.ts"], { ...options, timeoutMs: 1000 });
    },
  });
  assert.equal(result.passed, false);
  assert.ok(Date.now() - began < 6000);
  const saved = await receipt(root, result.receipt);
  assert.equal(saved.result?.outcome, "timeout");
  assert.equal(saved.result?.termination, "closed");
  assert.equal(
    saved.cleanupScope,
    process.platform === "win32" ? "windows-job-object" : "process-group",
  );
  const pid = Number((await readFile(join(root, "child.pid"), "utf8")).trim());
  assert.ok(Number.isSafeInteger(pid) && pid > 0);
  assert.throws(() => process.kill(pid, 0), { code: "ESRCH" });
});

await test("hook cancellation preserves absent status and never logs raw archive input", async () => {
  const root = await hookFixture();
  const controller = new AbortController();
  controller.abort();
  const result = await runHookCommand(root, "archive", "private-archive-input", {
    signal: controller.signal,
    runner: async (cwd, command, args, options) => {
      assert.ok(options, "Hook adapter must provide explicit process bounds");
      assert.deepEqual(args, ["app/conversations/record.ts"]);
      assert.equal(options.timeoutMs, 60_000);
      assert.equal(options.maximumBytes, 2_000_000);
      return await runProcess(cwd, command, args, options);
    },
  });
  assert.equal(result.passed, false);
  const saved = await receipt(root, result.receipt);
  assert.equal(saved.result?.status, null);
  assert.equal(saved.result?.outcome, "cancelled");
  assert.equal(saved.result?.termination, null);
  assert.ok(saved.log);
  assert.doesNotMatch(
    (await readFile(join(root, result.receipt), "utf8")) +
      (await readFile(join(root, saved.log.path), "utf8")),
    /private-archive-input/u,
  );
});

await test("unconfirmed cleanup cannot become a successful hook and sanitized logs stay bounded", async () => {
  const root = await hookFixture();
  const result = await runHookCommand(root, "archive", undefined, {
    runner: async () => ({
      code: 0,
      outcome: "exited",
      termination: "unconfirmed",
      stdout: "é".repeat(1_100_000),
      stderr: "",
    }),
  });
  assert.equal(result.passed, false);
  const saved = await receipt(root, result.receipt);
  assert.equal(saved.result?.termination, "unconfirmed");
  assert.ok(saved.log);
  assert.equal(saved.log.truncated, true);
  const bytes = await readFile(join(root, saved.log.path));
  assert.ok(bytes.byteLength <= 2_000_000);
  assert.doesNotThrow(() => new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  assert.equal(saved.log.sha256, digest(bytes));
});

await test("concurrent hook admission reserves capacity before starting another child", async () => {
  const root = await hookFixture();
  const diagnosticBudget = { bytes: 2_050_000 };
  let calls = 0;
  let release: (() => void) | undefined;
  let started: (() => void) | undefined;
  const waiting = new Promise<void>((done) => {
    release = done;
  });
  const observed = new Promise<void>((done) => {
    started = done;
  });
  const first = runHookCommand(root, "archive", undefined, {
    diagnosticBudget,
    runner: async () => {
      calls++;
      started?.();
      await waiting;
      return {
        code: 0,
        outcome: "exited",
        termination: "closed",
        stdout: "complete\n",
        stderr: "",
      };
    },
  });
  try {
    await observed;
    await assert.rejects(
      runHookCommand(root, "archive", undefined, {
        diagnosticBudget,
        runner: async () => {
          calls++;
          throw new Error("Capacity rejection must precede child launch");
        },
      }),
      /capacity reserved/u,
    );
    assert.equal(calls, 1);
  } finally {
    release?.();
    assert.equal((await first).passed, true);
  }
  // Finalization refunds unused capacity; it never held the lock through the child wait.
  const next = await runHookCommand(root, "archive", undefined, {
    diagnosticBudget,
    runner: async () => ({
      code: 0,
      outcome: "exited",
      termination: "closed",
      stdout: "",
      stderr: "",
    }),
  });
  assert.equal(next.passed, true);
});

await test("abandoned and malformed hook reservations fail closed without age reclamation", async () => {
  const root = await hookFixture();
  const diagnosticBudget = { bytes: 2_050_000 };
  const reserved = await reserveHookDiagnostics(root, "archive", 2_000_000, diagnosticBudget);
  const path = join(root, hookDiagnosticPaths(reserved).reservation);
  const original = await readFile(path, "utf8");
  let launched = false;
  const runner = async () => {
    launched = true;
    throw new Error("Reserved capacity must block child launch");
  };
  await assert.rejects(
    runHookCommand(root, "archive", undefined, { diagnosticBudget, runner }),
    /capacity reserved/u,
  );
  assert.equal(await readFile(path, "utf8"), original);
  await writeFile(path, '{"version":1}\n', "utf8");
  await assert.rejects(runHookCommand(root, "archive", undefined, { diagnosticBudget, runner }));
  assert.equal(await readFile(path, "utf8"), '{"version":1}\n');
  assert.equal(launched, false);
});

await test(
  "Windows Job Object timeout cleanup works with an empty launcher PATH",
  { skip: process.platform !== "win32" },
  async () => {
    const root = await hookFixture();
    await writeFile(join(root, "restricted-child.ts"), "setInterval(() => {}, 1000);\n", "utf8");
    await writeFile(
      join(root, "restricted-parent.ts"),
      "import { spawn } from 'node:child_process';\nimport { writeFileSync } from 'node:fs';\nconst child = spawn(process.execPath, ['restricted-child.ts'], { stdio: 'inherit', windowsHide: true, detached: true });\nwriteFileSync('restricted-child.pid', String(child.pid) + '\\n');\nsetInterval(() => {}, 1000);\n",
      "utf8",
    );
    const source = new URL("../app/workflow/process.ts", import.meta.url).href;
    await writeFile(
      join(root, "restricted-launcher.ts"),
      `import { runProcess } from ${JSON.stringify(source)};\nconst result = await runProcess(process.cwd(), process.execPath, ['restricted-parent.ts'], { timeoutMs: 1000 });\nprocess.stdout.write(JSON.stringify({ outcome: result.outcome, termination: result.termination }) + '\\n');\n`,
      "utf8",
    );
    const result = await runProcess(root, process.execPath, ["restricted-launcher.ts"], {
      env: { ...process.env, PATH: "" },
      timeoutMs: 8000,
    });
    assert.equal(result.code, 0);
    const observed = Schema.decodeUnknownSync(
      Schema.fromJsonString(Schema.Struct({ outcome: Schema.String, termination: Schema.String })),
    )(result.stdout);
    assert.equal(observed.outcome, "timeout");
    assert.equal(observed.termination, "closed");
    const pid = Number((await readFile(join(root, "restricted-child.pid"), "utf8")).trim());
    assert.ok(Number.isSafeInteger(pid) && pid > 0);
    assert.throws(() => process.kill(pid, 0), { code: "ESRCH" });
  },
);
