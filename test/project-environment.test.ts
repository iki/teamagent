import assert from "node:assert/strict";
import { access, readFile, readdir, realpath, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { test } from "node:test";
import { Schema } from "effect";
import {
  captureEnvironmentSnapshot,
  decodeMiseEnvironment,
  EnvironmentCaptureError,
  miseEnvironmentArguments,
  resolveMiseEnvironment,
  validateProjectEnvironment,
} from "../app/check/project-environment.ts";
import { createTemporaryWorkspace } from "../app/check/temporary-workspace.ts";
import { assertTemporaryFixture, mkdtemp } from "./temporary.ts";

const snapshot = (environment: NodeJS.ProcessEnv): string =>
  JSON.stringify({ version: 1, environment });
async function close(root: string): Promise<void> {
  await assertTemporaryFixture(root);
  await rm(root, { recursive: true });
}

await test("Mise replacement preserves unsets and empty values and restores only injected controls", () => {
  const original = {
    KEEP: "old",
    REMOVED: "removed",
    EMPTY: "previous",
    MISE_AUTO_INSTALL: "true",
    TEMP: "original",
    TEAMAGENT_TEMPORARY_ROOT: "root",
    TEAMAGENT_TEMPORARY_PARENT: "parent",
    TEAMAGENT_TEMPORARY_PARENT_ID: "token",
  };
  const result = decodeMiseEnvironment(
    snapshot({
      KEEP: "new",
      EMPTY: "",
      ADDED: "private-fixture",
      TEMP: "foreign",
      TMP: "foreign",
      MISE_AUTO_INSTALL: "false",
      MISE_EXEC_AUTO_INSTALL: "false",
      MISE_ENV_CACHE: "false",
      TEAMAGENT_TEMPORARY_ROOT: "foreign",
      TEAMAGENT_TEMPORARY_PARENT: "foreign",
      TEAMAGENT_TEMPORARY_PARENT_ID: "foreign",
    }),
    original,
  );
  assert.deepEqual(result, {
    KEEP: "new",
    EMPTY: "",
    ADDED: "private-fixture",
    MISE_AUTO_INSTALL: "true",
    TEMP: "original",
    TEAMAGENT_TEMPORARY_ROOT: "root",
    TEAMAGENT_TEMPORARY_PARENT: "parent",
    TEAMAGENT_TEMPORARY_PARENT_ID: "token",
  });
  assert.equal(original.KEEP, "old");
});

await test("environment boundaries reject invalid and oversized values without exposing them", () => {
  const secret = "private-environment-sentinel";
  for (const input of [
    secret,
    JSON.stringify({ version: 1, environment: { TOKEN: { secret } } }),
    JSON.stringify({ version: 2, environment: { secret } }),
    JSON.stringify({ version: 1, environment: {}, unexpected: secret }),
    snapshot({ "BAD=KEY": secret }),
    snapshot({ BAD: `embedded\0${secret}` }),
    snapshot({ HUGE: secret.repeat(100_000) }),
    ...(process.platform === "win32" ? [snapshot({ Path: secret, PATH: secret })] : []),
  ]) {
    assert.throws(
      () => decodeMiseEnvironment(input, {}),
      (error: unknown) => {
        assert.ok(error instanceof Error);
        assert.equal(error.message, "Mise environment snapshot is invalid");
        assert.equal(error.cause, undefined);
        assert.doesNotMatch(error.stack ?? "", /private-environment-sentinel/u);
        return true;
      },
    );
  }
  assert.throws(
    () =>
      validateProjectEnvironment(
        Object.fromEntries(Array.from({ length: 4097 }, (_, index) => [`K${index}`, ""])),
      ),
    /Project environment is invalid/u,
  );
  for (const input of [
    [],
    ["private-fixture"],
    "private-fixture",
    null,
    { "BAD=KEY": undefined },
    { VALUE: 42 },
  ])
    assert.throws(() => validateProjectEnvironment(input), /Project environment is invalid/u);
  assert.deepEqual(validateProjectEnvironment({ OMITTED: undefined, EMPTY: "" }), { EMPTY: "" });
});

await test("Mise protocol uses a static native profile-free helper without an installation fallback", () => {
  const shell = join(
    process.env.SystemRoot ?? "C:\\Windows",
    "System32/WindowsPowerShell/v1.0/powershell.exe",
  );
  const args = miseEnvironmentArguments(shell);
  assert.deepEqual(args.slice(0, 8), [
    "exec",
    "--no-deps",
    "--",
    shell,
    "-NoLogo",
    "-NoProfile",
    "-NonInteractive",
    "-File",
  ]);
  assert.match(args.at(-1) ?? "", /environment-snapshot\.ps1$/u);
  assert.ok(!args.includes("-Command") && !args.includes("-ExecutionPolicy"));
});

await test(
  "native capture avoids dotenv and Bun preloads and retains private values only in memory",
  { skip: process.platform !== "win32" },
  async () => {
    const root = await mkdtemp("environment-native-");
    try {
      await writeFile(join(root, ".env"), "REMOVED_BY_PROVIDER=must-not-return\n", "utf8");
      await writeFile(join(root, "bunfig.toml"), 'preload = ["missing-preload.ts"]\n', "utf8");
      const shell = await realpath(
        join(
          process.env.SystemRoot ?? "C:\\Windows",
          "System32/WindowsPowerShell/v1.0/powershell.exe",
        ),
      );
      const env = {
        ...process.env,
        REMOVED_BY_PROVIDER: undefined,
        PRIVATE_SENTINEL: "preserved",
        BUN_OPTIONS: "--preload missing-options.ts",
      };
      const text = await captureEnvironmentSnapshot(
        root,
        shell,
        miseEnvironmentArguments(shell).slice(4),
        env,
      );
      const decoded = decodeMiseEnvironment(text, env);
      assert.equal(decoded.REMOVED_BY_PROVIDER, undefined);
      assert.equal(decoded.PRIVATE_SENTINEL, env.PRIVATE_SENTINEL);
      assert.equal(decoded.BUN_OPTIONS, env.BUN_OPTIONS);
      assert.deepEqual(await readdir(join(root, ".tmp")), []);
    } finally {
      await close(root);
    }
  },
);

await test("sensitive capture bounds both outputs, joins failure and timeout, and removes only confirmed scratch", async () => {
  const root = await mkdtemp("environment-capture-");
  try {
    const text = await captureEnvironmentSnapshot(
      root,
      process.execPath,
      [
        "--no-env-file",
        "-e",
        'process.stdout.write("private-fixture");process.stderr.write("private-stderr")',
      ],
      process.env,
    );
    assert.equal(text, "private-fixture");
    for (const [label, script] of [
      ["nonzero", 'process.stdout.write("private-fixture");process.exit(7)'],
      ["stdout-overflow", 'process.stdout.write("private-fixture".repeat(100000))'],
      ["stderr-overflow", 'process.stderr.write("private-fixture".repeat(100000))'],
      ["invalid-utf8", "process.stdout.write(new Uint8Array([255]))"],
      ["timeout", "setInterval(()=>{},1000)"],
    ] as const) {
      await assert.rejects(
        captureEnvironmentSnapshot(
          root,
          process.execPath,
          ["--no-env-file", "-e", script],
          process.env,
          undefined,
          1000,
        ),
        (error: unknown) => {
          assert.ok(error instanceof EnvironmentCaptureError);
          assert.equal(error.termination, "closed", label);
          assert.equal(error.message, "Mise environment capture failed");
          assert.equal(error.cause, undefined);
          assert.doesNotMatch(error.stack ?? "", /private-fixture/u);
          return true;
        },
      );
      assert.deepEqual(await readdir(join(root, ".tmp")), []);
    }
    const aborted = new AbortController();
    aborted.abort(new Error("private-fixture"));
    await assert.rejects(
      captureEnvironmentSnapshot(root, process.execPath, [], process.env, aborted.signal),
      /Mise environment capture failed/u,
    );
    await assert.rejects(access(join(root, ".cache/workflow")), { code: "ENOENT" });
  } finally {
    await close(root);
  }
});

await test("borrowed capture preserves generated credentials through command lifetime", async () => {
  const root = await mkdtemp("environment-lease-");
  const temporary = await createTemporaryWorkspace(root, "command");
  try {
    const body =
      'import {writeFileSync} from "node:fs";import {join} from "node:path";const file=join(process.env.TEMP,"credential.txt");writeFileSync(file,"disposable-fixture\\n");process.stdout.write(JSON.stringify({version:1,environment:{CREDENTIAL_FILE:file}}));';
    const env = temporary.environment(process.env);
    const text = await captureEnvironmentSnapshot(
      root,
      process.execPath,
      ["--no-env-file", "-e", body],
      env,
      undefined,
      30_000,
      temporary,
    );
    const result = decodeMiseEnvironment(text, env);
    const path = join(temporary.path, "credential.txt");
    assert.equal(result.CREDENTIAL_FILE, path);
    assert.equal(result.TEAMAGENT_TEMPORARY_ROOT, root);
    assert.equal(await readFile(path, "utf8"), "disposable-fixture\n");
    await assert.rejects(
      captureEnvironmentSnapshot(
        root,
        process.execPath,
        ["--no-env-file", "-e", "process.exit(7)"],
        env,
        undefined,
        30_000,
        temporary,
      ),
      /Mise environment capture failed/u,
    );
    await access(path);
    await temporary.dispose();
    await assert.rejects(access(path), { code: "ENOENT" });
  } finally {
    await temporary.dispose();
    await close(root);
  }
});

await test("provider refuses relative paths and shims without evaluating project configuration", async () => {
  for (const path of ["mise", "mise.exe", join(process.cwd(), "shims", "mise.exe")])
    await assert.rejects(
      resolveMiseEnvironment(process.cwd(), path, process.execPath, process.env),
    );
});

for (const mode of ["reserved-status", "external-supervisor-termination"] as const)
  await test(
    `provider retains scratch after ${mode}`,
    { skip: process.platform !== "win32" },
    async () => {
      const root = await mkdtemp("environment-retention-");
      let descendantsStopped = false;
      try {
        // 253 is deliberately ambiguous in the native protocol. Even a fixture's
        // deliberate child status cannot be promoted to confirmed cleanup.
        const body =
          'import {writeFileSync} from "node:fs";writeFileSync("provider-pid.txt",String(process.pid)+"\\n");' +
          (mode === "reserved-status"
            ? "process.exit(253);"
            : 'process.kill(process.ppid,"SIGKILL");setInterval(()=>{},1000);');
        await assert.rejects(
          captureEnvironmentSnapshot(
            root,
            process.execPath,
            ["--no-env-file", "-e", body],
            process.env,
          ),
          (error: unknown) => {
            assert.ok(error instanceof EnvironmentCaptureError);
            assert.equal(error.termination, "unconfirmed");
            assert.equal(error.cause, undefined);
            assert.match(error.message, /scratch retained/u);
            return true;
          },
        );
        const pid = Schema.decodeUnknownSync(
          Schema.fromJsonString(Schema.Int.check(Schema.isGreaterThan(0))),
        )(await readFile(join(root, "provider-pid.txt"), "utf8"));
        const deadline = performance.now() + 5000;
        while (performance.now() < deadline) {
          try {
            process.kill(pid, 0);
          } catch (error) {
            if (error instanceof Error && "code" in error && error.code === "ESRCH") {
              descendantsStopped = true;
              break;
            }
            throw error;
          }
          await new Promise<void>((done) => setTimeout(done, 10));
        }
        assert.equal(
          descendantsStopped,
          true,
          "Native job release must stop the actual fixture before test disposal",
        );
        const retained = await readdir(join(root, ".tmp"));
        assert.equal(retained.length, 2);
        assert.equal(retained.filter((name) => name.startsWith("run-environment-")).length, 1);
        assert.equal(retained.filter((name) => name.startsWith("run-completion-")).length, 1);
        for (const name of retained) {
          await access(join(root, ".tmp", name, ".owner.json"));
          await assert.rejects(access(join(root, ".tmp", name, "completion.json")), {
            code: "ENOENT",
          });
        }
      } finally {
        if (descendantsStopped) await close(root);
      }
    },
  );
