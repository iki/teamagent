import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  access,
  mkdir,
  readFile,
  readdir,
  realpath,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { delimiter, dirname, join } from "node:path";
import { text } from "node:stream/consumers";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { Schema } from "effect";
import {
  launchProject,
  projectLauncherIdentity,
  projectLauncherInputs,
  resolveProject,
  type ProjectProcess,
} from "../app/check/project-launcher.ts";
import {
  physicalToolPath,
  pinnedTool,
  toolchainPins,
  toolVersionOutput,
} from "../app/check/toolchain.ts";
import { createTemporaryWorkspace } from "../app/check/temporary-workspace.ts";
import { assertTemporaryFixture, mkdtemp } from "./temporary.ts";

const repository = fileURLToPath(new URL("../", import.meta.url));
const pins = toolchainPins(repository);
const entry = join(repository, "app/check/project-launch.ts");
async function project(directory?: string): Promise<string> {
  const root = directory ?? (await mkdtemp("project-launch-"));
  await writeFile(join(root, ".bun-version"), `${pins.bun}\n`, "utf8");
  await writeFile(
    join(root, "package.json"),
    `${JSON.stringify({ engines: { bun: pins.bun }, packageManager: `aube@${pins.aube}` })}\n`,
    "utf8",
  );
  return root;
}
async function close(root: string): Promise<void> {
  await assertTemporaryFixture(root);
  await rm(root, { recursive: true });
}
function drain(running: ProjectProcess): void {
  running.child.stdout?.resume();
  running.child.stderr?.resume();
  running.child.stdin?.end();
}
function withoutPath(): NodeJS.ProcessEnv {
  return Object.fromEntries(
    Object.entries(process.env).filter(([key]) => key.toLowerCase() !== "path"),
  );
}

await test("launcher isolates physical target selection, preserves literal input and secrets, and joins scratch cleanup", async () => {
  const root = await project();
  let running: ProjectProcess | undefined;
  try {
    const marker = join(root, "observed.json");
    const script = join(root, "probe.ts");
    await writeFile(
      script,
      'import {writeFileSync} from "node:fs";writeFileSync("observed.json",JSON.stringify({root:process.cwd(),args:process.argv.slice(2),input:await Bun.stdin.text(),secret:process.env.LAUNCH_SECRET,temp:process.env.TEMP,override:process.env.TEAMAGENT_BUN_PATH??null,empty:process.env.EMPTY}));process.exitCode=17;\n',
      "utf8",
    );
    const args = ["a b", "", 'a"b', "$(literal)", "&|<>^", "ženy", "trailing\\"];
    const env = {
      ...withoutPath(),
      LAUNCH_SECRET: "private-fixture",
      EMPTY: "",
      TEAMAGENT_BUN_PATH: "foreign-shim",
      PATH: "Z:\\unused;".repeat(950),
    };
    running = await launchProject({
      projectRoot: root,
      tool: "bun",
      args: [script, ...args],
      env,
      runtimes: { bun: process.execPath },
      stdio: "pipe",
    });
    running.child.stdout?.resume();
    running.child.stderr?.resume();
    running.child.stdin?.end("private-input");
    const result = await running.closed;
    assert.equal(result.code, 17);
    assert.equal(result.error, undefined);
    assert.equal(result.termination, "closed");
    const observed: unknown = JSON.parse(await readFile(marker, "utf8"));
    assert.deepEqual(observed, {
      root,
      args,
      input: "private-input",
      secret: "private-fixture",
      temp: running.temporaryPath,
      override: null,
      empty: "",
    });
    assert.equal(dirname(running.temporaryPath), join(root, ".tmp"));
    await assert.rejects(access(running.temporaryPath), { code: "ENOENT" });
    assert.equal(env.TEAMAGENT_BUN_PATH, "foreign-shim");
  } finally {
    await running?.stop();
    await close(root);
  }
});

await test("independent projects reject wrong pins and foreign overrides and select PATH explicitly", async () => {
  const roots = await Promise.all([project(), project()]);
  try {
    for (const root of roots) {
      const env = {
        ...withoutPath(),
        TEAMAGENT_BUN_PATH: "foreign",
        PATH: "unwanted;".repeat(1200),
        KEEP: "private-fixture",
      };
      const selected = await resolveProject({
        projectRoot: root,
        tool: "bun",
        env,
        runtimes: { bun: process.execPath },
        pathDirectories: [dirname(physicalToolPath(process.execPath, "bun"))],
      });
      assert.equal(selected.projectRoot, root);
      assert.equal(selected.environment.KEEP, env.KEEP);
      assert.equal(selected.environment.TEAMAGENT_BUN_PATH, undefined);
      assert.equal(selected.environment.PATH?.split(delimiter).length, 1);
      assert.ok(env.PATH.length > 8191);
      await assert.rejects(
        resolveProject({ projectRoot: root, tool: "bun", pathDirectories: ["relative"] }),
        /absolute/u,
      );
      await assert.rejects(
        resolveProject({
          projectRoot: root,
          tool: "bun",
          pathDirectories: [root + delimiter + "relative"],
        }),
        /absolute/u,
      );
      await assert.rejects(
        resolveProject({ projectRoot: root, tool: "bun", misePath: "unused" }),
        /launchProject/u,
      );
    }
    const root = roots[1];
    assert.ok(root);
    await writeFile(join(root, ".bun-version"), "99.0.0\n", "utf8");
    await writeFile(
      join(root, "package.json"),
      `${JSON.stringify({ engines: { bun: "99.0.0" }, packageManager: `aube@${pins.aube}` })}\n`,
      "utf8",
    );
    await assert.rejects(
      resolveProject({ projectRoot: root, tool: "bun", runtimes: { bun: process.execPath } }),
      /version check/u,
    );
  } finally {
    for (const root of roots) await close(root);
  }
});

await test("launcher executes the selected pinned Aube and rejects a target's mismatched Aube pin", async () => {
  const root = await project();
  const aube = pinnedTool(repository, "aube");
  let running: ProjectProcess | undefined;
  try {
    running = await launchProject({
      projectRoot: root,
      tool: "aube",
      args: ["--version"],
      runtimes: { bun: process.execPath, aube },
      stdio: "pipe",
    });
    const { child } = running;
    assert.ok(child.stdout && child.stderr && child.stdin);
    const stdout = text(child.stdout),
      stderr = text(child.stderr);
    child.stdin.end();
    const outcome = await running.closed;
    assert.equal(outcome.code, 0, await stderr);
    assert.equal(outcome.termination, "closed");
    assert.equal(outcome.error, undefined);
    assert.equal(toolVersionOutput("aube", await stdout), pins.aube);
    await assert.rejects(access(running.temporaryPath), { code: "ENOENT" });
    await writeFile(
      join(root, "package.json"),
      `${JSON.stringify({ engines: { bun: pins.bun }, packageManager: "aube@99.0.0" })}\n`,
      "utf8",
    );
    await assert.rejects(
      resolveProject({
        projectRoot: root,
        tool: "aube",
        runtimes: { bun: process.execPath, aube },
      }),
      /Expected aube 99\.0\.0/u,
    );
  } finally {
    await running?.stop();
    await close(root);
  }
});

await test("launcher rejects redirected roots and joins cancellation before scratch removal", async () => {
  // Independent ownership keeps uncertainty out of the ordinary fixture after-hook.
  const workspace = await createTemporaryWorkspace(repository, "cancel-launch");
  const root = workspace.path;
  let running: ProjectProcess | undefined;
  let confirmed = true;
  try {
    await project(root);
    await assert.rejects(resolveProject({ projectRoot: ".", tool: "bun" }), /absolute/u);
    const target = join(root, "target"),
      alias = join(root, "alias");
    await mkdir(target);
    await symlink(target, alias, process.platform === "win32" ? "junction" : "dir");
    await assert.rejects(resolveProject({ projectRoot: alias, tool: "bun" }), /physical/u);
    running = await launchProject({
      projectRoot: root,
      tool: "bun",
      args: ["-e", "setInterval(()=>{},1000)"],
      runtimes: { bun: process.execPath },
      stdio: "pipe",
    });
    confirmed = false;
    drain(running);
    await access(running.temporaryPath);
    await running.stop("fixture cancellation");
    const outcome = await running.closed;
    confirmed = outcome.termination === "closed";
    assert.ok(outcome.error);
    assert.equal(outcome.termination, "closed");
    await assert.rejects(access(running.temporaryPath), { code: "ENOENT" });
  } finally {
    await running?.stop();
    // An uncertain child retains this independent marked workspace for explicit recovery.
    if (running) confirmed = (await running.closed).termination === "closed";
    if (confirmed) await workspace.dispose();
  }
});

await test("CLI forwards stdin and literal flags and preserves a failing command status", async () => {
  const root = await project();
  let running: ProjectProcess | undefined;
  try {
    const script = join(root, "probe.ts");
    await writeFile(
      script,
      "process.stdout.write(JSON.stringify({args:process.argv.slice(2),input:await Bun.stdin.text()}));process.exitCode=19;\n",
      "utf8",
    );
    running = await launchProject({
      projectRoot: root,
      tool: "bun",
      args: [
        entry,
        "--project",
        root,
        "--bun-path",
        process.execPath,
        "--",
        script,
        "--literal",
        "value with spaces",
        "",
      ],
      runtimes: { bun: process.execPath },
      stdio: "pipe",
    });
    const { child } = running;
    assert.ok(child.stdout && child.stderr && child.stdin);
    const stdout = text(child.stdout),
      stderr = text(child.stderr);
    child.stdin.end("CLI input");
    assert.equal((await running.closed).code, 19, await stderr);
    assert.equal(
      await stdout,
      JSON.stringify({ args: ["--literal", "value with spaces", ""], input: "CLI input" }),
    );
  } finally {
    await running?.stop();
    await close(root);
  }
});

await test("passive CLI identity/help never evaluate Mise or create target scratch", async () => {
  const root = await project();
  try {
    const before = await readdir(root);
    for (const args of [["--help"], ["-h"], ["--version"], ["-V"], ["--identity"]]) {
      const result = spawnSync(process.execPath, [entry, ...args], {
        cwd: root,
        windowsHide: true,
        shell: false,
        encoding: "utf8",
        timeout: 30_000,
        maxBuffer: 65536,
      });
      assert.equal(result.error, undefined);
      assert.equal(result.status, 0, result.stderr);
      if (args[0] === "--identity")
        assert.equal(result.stdout.trim(), await projectLauncherIdentity());
    }
    for (const args of [
      ["--identity", "--mise-path", "unavailable"],
      ["--identity", "--", "run"],
    ]) {
      const result = spawnSync(process.execPath, [entry, ...args], {
        cwd: root,
        windowsHide: true,
        shell: false,
        encoding: "utf8",
        timeout: 30_000,
        maxBuffer: 65536,
      });
      assert.equal(result.status, 1);
      assert.match(result.stderr, /cannot be combined/u);
      assert.equal(result.stdout, "");
    }
    const invalidAlias = spawnSync(process.execPath, [entry, "-v"], {
      cwd: root,
      windowsHide: true,
      shell: false,
      encoding: "utf8",
      timeout: 30_000,
      maxBuffer: 65536,
    });
    assert.notEqual(invalidAlias.status, 0);
    assert.deepEqual(await readdir(root), before);
    assert.ok(projectLauncherInputs.includes("app/check/cache-io.ts"));
    assert.ok(projectLauncherInputs.includes("app/check/cache-fingerprint.ts"));
  } finally {
    await close(root);
  }
});

await test("launcher API and CLI redact malformed toolchain metadata without discarding controlled errors", async () => {
  const root = await project();
  const secret = "private-toolchain-fixture-must-not-appear";
  const manifest = JSON.stringify({
    engines: { bun: pins.bun },
    packageManager: `aube@${pins.aube}`,
  });
  const safeMessage = "Project runtime metadata or tool version output is invalid";
  const cases = [
    {
      manifest: JSON.stringify({ engines: { bun: pins.bun }, packageManager: secret }),
      bun: pins.bun,
    },
    {
      manifest: JSON.stringify({ engines: { bun: secret }, packageManager: `aube@${pins.aube}` }),
      bun: pins.bun,
    },
    { manifest: `{"private":"${secret}"`, bun: pins.bun },
    { manifest, bun: secret },
  ];
  try {
    for (const fixture of cases) {
      await writeFile(join(root, "package.json"), `${fixture.manifest}\n`, "utf8");
      await writeFile(join(root, ".bun-version"), `${fixture.bun}\n`, "utf8");
      await assert.rejects(
        resolveProject({ projectRoot: root, tool: "bun", runtimes: { bun: process.execPath } }),
        (error: unknown) => {
          assert.ok(error instanceof Error);
          assert.equal(error.message, safeMessage);
          assert.equal(error.cause, undefined);
          assert.doesNotMatch(error.stack ?? "", /private-toolchain-fixture/u);
          return true;
        },
      );
      const result = spawnSync(
        process.execPath,
        [entry, "--project", root, "--bun-path", process.execPath, "--", "--version"],
        {
          cwd: repository,
          windowsHide: true,
          shell: false,
          encoding: "utf8",
          timeout: 30_000,
          maxBuffer: 65536,
        },
      );
      assert.equal(result.error, undefined);
      assert.equal(result.status, 1);
      assert.equal(result.stdout, "");
      assert.equal(result.stderr, `error: ${safeMessage}\n`);
      assert.deepEqual(await readdir(join(root, ".tmp")), []);
    }
    await writeFile(join(root, "package.json"), `${manifest}\n`, "utf8");
    await writeFile(join(root, ".bun-version"), "99.0.0\n", "utf8");
    await assert.rejects(
      resolveProject({ projectRoot: root, tool: "bun" }),
      /Bun version pins disagree/u,
    );
  } finally {
    await close(root);
  }
});

await test("launcher API and CLI redact invalid native tool-version output", async () => {
  const root = await project();
  const secret = "private-version-fixture-must-not-appear";
  const executable = join(root, process.platform === "win32" ? "aube.exe" : "aube");
  const safeMessage = "Project runtime metadata or tool version output is invalid";
  try {
    if (process.platform === "win32") {
      const system = process.env.SystemRoot ?? process.env.SYSTEMROOT;
      assert.ok(system);
      const compiler = await realpath(join(system, "Microsoft.NET/Framework64/v4.0.30319/csc.exe"));
      const source = join(root, "version.cs");
      await writeFile(
        source,
        `using System; internal static class VersionFixture { static int Main() { Console.WriteLine("${secret}"); return 0; } }\n`,
        "utf8",
      );
      const compiled = spawnSync(
        compiler,
        [
          "/nologo",
          "/noconfig",
          "/nostdlib+",
          "/target:exe",
          `/reference:${join(dirname(compiler), "mscorlib.dll")}`,
          `/out:${executable}`,
          source,
        ],
        {
          cwd: root,
          windowsHide: true,
          shell: false,
          encoding: "utf8",
          timeout: 30_000,
          maxBuffer: 65536,
        },
      );
      assert.equal(compiled.error, undefined);
      assert.equal(
        compiled.status,
        0,
        "The provisioned native compiler must prepare the bounded version fixture",
      );
    } else {
      await writeFile(executable, `#!/bin/sh\nprintf '%s\\n' '${secret}'\n`, {
        encoding: "utf8",
        mode: 0o700,
      });
    }
    await assert.rejects(
      resolveProject({
        projectRoot: root,
        tool: "aube",
        runtimes: { bun: process.execPath, aube: executable },
      }),
      (error: unknown) => {
        assert.ok(error instanceof Error);
        assert.equal(error.message, safeMessage);
        assert.equal(error.cause, undefined);
        assert.doesNotMatch(error.stack ?? "", /private-version-fixture/u);
        return true;
      },
    );
    const result = spawnSync(
      process.execPath,
      [
        entry,
        "--project",
        root,
        "--tool",
        "aube",
        "--bun-path",
        process.execPath,
        "--aube-path",
        executable,
        "--",
        "--version",
      ],
      {
        cwd: repository,
        windowsHide: true,
        shell: false,
        encoding: "utf8",
        timeout: 30_000,
        maxBuffer: 65536,
      },
    );
    assert.equal(result.error, undefined);
    assert.equal(result.status, 1);
    assert.equal(result.stdout, "");
    assert.equal(result.stderr, `error: ${safeMessage}\n`);
    assert.deepEqual(await readdir(join(root, ".tmp")), []);
  } finally {
    await close(root);
  }
});

for (const mode of ["owner-handle", "external-termination"] as const)
  await test(
    `launcher retains marked scratch after supervisor ${mode}`,
    { skip: process.platform !== "win32" },
    async () => {
      const root = await project();
      let running: ProjectProcess | undefined;
      let descendantsStopped = false;
      try {
        const script =
          'import {writeFileSync} from "node:fs";writeFileSync("child-pid.txt",String(process.pid)+"\\n");' +
          (mode === "external-termination" ? 'process.kill(process.ppid,"SIGKILL");' : "") +
          "setInterval(()=>{},1000);";
        running = await launchProject({
          projectRoot: root,
          tool: "bun",
          args: ["--no-env-file", "-e", script],
          runtimes: { bun: process.execPath },
          stdio: "pipe",
          timeoutMs: 10_000,
        });
        drain(running);
        const readiness = performance.now() + 5000;
        let ready = false;
        while (performance.now() < readiness) {
          try {
            await access(join(root, "child-pid.txt"));
            ready = true;
            break;
          } catch (error) {
            if (!(error instanceof Error && "code" in error && error.code === "ENOENT"))
              throw error;
          }
          await new Promise<void>((done) => setTimeout(done, 10));
        }
        assert.equal(ready, true);
        // Both this owner's signal bookkeeping and termination by another process
        // must lack the native completion receipt and retain scratch.
        if (mode === "owner-handle") assert.equal(running.child.kill("SIGKILL"), true);
        const result = await running.closed;
        assert.equal(result.termination, "unconfirmed");
        assert.ok(result.error);
        const pid = Schema.decodeUnknownSync(
          Schema.fromJsonString(Schema.Int.check(Schema.isGreaterThan(0))),
        )(await readFile(join(root, "child-pid.txt"), "utf8"));
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
          "Native job release must stop the fixture before test disposal",
        );
        await access(join(running.temporaryPath, ".owner.json"));
        const retained = await readdir(join(root, ".tmp"));
        assert.equal(retained.length, 2);
        assert.equal(retained.filter((name) => name.startsWith("run-project-launch-")).length, 1);
        assert.equal(retained.filter((name) => name.startsWith("run-completion-")).length, 1);
        for (const name of retained) {
          await access(join(root, ".tmp", name, ".owner.json"));
          await assert.rejects(access(join(root, ".tmp", name, "completion.json")), {
            code: "ENOENT",
          });
        }
      } finally {
        await running?.stop();
        if (descendantsStopped) await close(root);
      }
    },
  );
