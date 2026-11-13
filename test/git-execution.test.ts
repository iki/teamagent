import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { chmod, lstat, mkdir, readFile, rename, symlink, writeFile } from "node:fs/promises";
import { basename, dirname, join, win32 } from "node:path";
import { test } from "bun:test";
import { Schema } from "effect";
import {
  gitPayloadProfile,
  gitPayloadProfiles,
  inspectGitRuntimePayload,
  resolveGitExecution,
  selectGitEnvironment,
  type GitExecution,
  type WindowsGitInstallation,
} from "../app/check/git-execution.ts";
import { fileContentDigest } from "../app/check/cache-fingerprint.ts";
import { gitPlatformArguments } from "../app/check/git-platform.ts";
import { gitEnvironment } from "../app/workflow/git.ts";
import { diagnostic, runProcess } from "../app/workflow/process.ts";
import { mkdtemp } from "./temporary.ts";
import { fixture } from "./workflow-fixture.ts";

const installation: WindowsGitInstallation = {
  root: "C:\\fixture\\Git",
  runtime: "ucrt64",
  core: "C:\\fixture\\Git\\ucrt64\\libexec\\git-core",
  launcher: "C:\\fixture\\Git\\cmd\\git.exe",
  payload: "C:\\fixture\\Git\\ucrt64\\libexec\\git-core\\git.exe",
};
const environment = Object.freeze({
  HOME: "C:\\fixture\\home",
  PATH: "C:\\inherited\\bin;C:\\inherited\\bin;;",
  MSYSTEM: "inherited-system",
  MSYS: "winsymlinks:nativestrict",
  PLINK_PROTOCOL: "",
  TEAMAGENT_GIT_PARITY: "synthetic-marker",
});

test("the direct Git profile remains bound to the reviewed launcher, payload and wrapper revision", () => {
  assert.equal(
    gitPayloadProfile.launcherSha256,
    "20d0dde30a65afb6e5810a883700a94dcd77fbf3b44b32868d45bf7c9b30137c",
  );
  assert.equal(
    gitPayloadProfile.payloadSha256,
    "9c75f3f41eb5686bacde4b7c4fdfcd7970e8b699ee05c8d7a0cc9c8a7ddaffe8",
  );
  assert.equal(gitPayloadProfile.sourceRevision, "20a412e3b61c853fb3a290f02e78f59611d20342");
  assert.deepEqual(gitPayloadProfiles, [
    gitPayloadProfile,
    {
      sourceRevision: "050f94fd8a2198a71f3efc9044e801430d83daef",
      sourceSha256: "c24bab1178721707c848b370aabfc3714a570d0ff34b664d318104a86098d58c",
      launcherSha256: "177bc8a9af84fa3a400c694c975fda731d048279c074e1a93947ce8b067ebb48",
      payloadSha256: "9bf8ee81d79f38a11eaf7799499a634c46a718e009a4a9b2b20b115804643302",
    },
  ]);
});

test("Git profile admission rejects every mixed release tuple and separates release identities", () => {
  const identities = new Set<string>();
  let admitted = 0,
    rejected = 0;
  for (const launcher of gitPayloadProfiles)
    for (const core of gitPayloadProfiles)
      for (const runtime of gitPayloadProfiles) {
        const selected = selectGitEnvironment(installation, environment, {
          launcherSha256: launcher.launcherSha256,
          payloadSha256: core.payloadSha256,
          runtimePayloadSha256: runtime.payloadSha256,
          wrapperConfigPresent: false,
        });
        if (launcher === core && core === runtime) {
          assert.equal(selected.mode, "payload");
          identities.add(selected.prerequisiteIdentity);
          admitted++;
        } else {
          assert.equal(selected.mode, "canonical");
          assert.equal(selected.reason, "unsupported-profile");
          assert.deepEqual(selected.env, environment);
          rejected++;
        }
      }
  assert.equal(admitted, 2);
  assert.equal(rejected, 6);
  assert.equal(identities.size, 2);
});

for (const profile of gitPayloadProfiles) {
  const facts = {
    launcherSha256: profile.launcherSha256,
    payloadSha256: profile.payloadSha256,
    runtimePayloadSha256: profile.payloadSha256,
    wrapperConfigPresent: false,
  };

  test(`direct Git translates only the reviewed wrapper environment and preserves the caller (${profile.sourceRevision})`, () => {
    const before = { ...environment };
    const selected = selectGitEnvironment(installation, environment, facts);
    assert.equal(selected.mode, "payload");
    assert.equal(selected.reason, null);
    assert.equal(selected.executable, installation.payload);
    assert.equal(selected.launcher, installation.launcher);
    assert.equal(selected.payload, installation.payload);
    assert.deepEqual(selected.env, {
      ...environment,
      MSYSTEM: "UCRT64",
      PLINK_PROTOCOL: "",
      PATH:
        "C:\\fixture\\Git\\ucrt64\\bin;C:\\fixture\\Git\\usr\\bin;" +
        "C:\\fixture\\home\\bin;" +
        environment.PATH,
    });
    assert.notEqual(selected.env, environment);
    assert.deepEqual(environment, before);
    assert.match(selected.identity, /^[a-f0-9]{64}$/u);
    assert.equal(
      selectGitEnvironment(installation, { ...environment }, { ...facts }).identity,
      selected.identity,
    );
    const changedPath = selectGitEnvironment(
      installation,
      { ...environment, PATH: environment.PATH + "extra" },
      facts,
    );
    assert.notEqual(changedPath.identity, selected.identity);
    assert.equal(changedPath.prerequisiteIdentity, selected.prerequisiteIdentity);
  });

  test(`direct Git preserves wrapper HOME suffix semantics and caller protocol choices (${profile.sourceRevision})`, () => {
    for (const home of ["C:\\fixture\\home", "C:\\fixture\\home\\", "C:/fixture/home/"]) {
      const selected = selectGitEnvironment(
        installation,
        { ...environment, HOME: home, PLINK_PROTOCOL: "custom-transport" },
        facts,
      );
      assert.equal(selected.mode, "payload");
      assert.equal(selected.env.HOME, home);
      assert.equal(selected.env.PLINK_PROTOCOL, "custom-transport");
      const suffix = home.endsWith("\\") ? "bin" : "\\bin";
      assert.equal(
        selected.env.PATH,
        "C:\\fixture\\Git\\ucrt64\\bin;C:\\fixture\\Git\\usr\\bin;" +
          home +
          suffix +
          ";" +
          environment.PATH,
      );
    }
    const withoutProtocol = { ...environment, PLINK_PROTOCOL: undefined };
    assert.equal(
      selectGitEnvironment(installation, withoutProtocol, facts).env.PLINK_PROTOCOL,
      "ssh",
    );
    const missingProtocol = { ...environment };
    Reflect.deleteProperty(missingProtocol, "PLINK_PROTOCOL");
    assert.equal(
      selectGitEnvironment(installation, missingProtocol, facts).env.PLINK_PROTOCOL,
      "ssh",
    );
    assert.equal(
      selectGitEnvironment(installation, { ...environment, HOME: "h".repeat(4088) }, facts).mode,
      "payload",
    );
  });

  test(`unsupported wrapper cases explicitly keep canonical Git and the untranslated environment (${profile.sourceRevision})`, () => {
    const cases = [
      {
        reason: "unsupported-profile",
        facts: { ...facts, launcherSha256: "0".repeat(64) },
        env: environment,
      },
      {
        reason: "unsupported-profile",
        facts: { ...facts, payloadSha256: "0".repeat(64) },
        env: environment,
      },
      {
        reason: "unsupported-profile",
        facts: { ...facts, runtimePayloadSha256: "0".repeat(64) },
        env: environment,
      },
      {
        reason: "wrapper-config-present",
        facts: { ...facts, wrapperConfigPresent: true, wrapperConfigSha256: "1".repeat(64) },
        env: environment,
      },
      { reason: "missing-home", facts, env: { ...environment, HOME: undefined } },
      { reason: "missing-home", facts, env: { ...environment, HOME: "" } },
      { reason: "home-path-bound", facts, env: { ...environment, HOME: "h".repeat(4089) } },
      {
        reason: "foreign-exec-path",
        facts,
        env: { ...environment, GIT_EXEC_PATH: "C:\\foreign\\git-core" },
      },
      {
        reason: "foreign-exec-path",
        facts,
        env: { ...environment, GIT_EXEC_PATH: "relative/git-core" },
      },
      { reason: "foreign-exec-path", facts, env: { ...environment, GIT_EXEC_PATH: "" } },
    ];
    for (const entry of cases) {
      const selected = selectGitEnvironment(installation, entry.env, entry.facts);
      assert.equal(selected.mode, "canonical", entry.reason);
      assert.equal(selected.reason, entry.reason);
      assert.equal(selected.executable, installation.launcher);
      assert.deepEqual(selected.env, entry.env);
      assert.notEqual(
        selected.identity,
        selectGitEnvironment(installation, environment, facts).identity,
      );
    }
    for (const runtime of ["mingw64", "mingw32"] as const) {
      const core = win32.join(installation.root, runtime, "libexec/git-core");
      const selected = selectGitEnvironment(
        { ...installation, runtime, core, payload: win32.join(core, "git.exe") },
        environment,
        facts,
      );
      assert.equal(selected.mode, "canonical");
      assert.equal(selected.reason, "unsupported-profile");
      assert.deepEqual(selected.env, environment);
    }
  });

  test(`the exact core override supports hook dispatch without hiding per-dispatch environment changes (${profile.sourceRevision})`, () => {
    const direct = selectGitEnvironment(installation, environment, facts);
    const hookEnvironment = {
      ...environment,
      PATH: installation.core + ";" + environment.PATH,
      GIT_EXEC_PATH: installation.core,
    };
    const selected = selectGitEnvironment(installation, hookEnvironment, facts);
    assert.equal(selected.mode, "payload");
    assert.equal(selected.env.GIT_EXEC_PATH, installation.core);
    assert.ok(selected.env.PATH?.endsWith(";" + hookEnvironment.PATH));
    assert.notEqual(selected.identity, direct.identity);
    assert.equal(selected.prerequisiteIdentity, direct.prerequisiteIdentity);
    assert.equal(
      selectGitEnvironment(installation, hookEnvironment, facts).identity,
      selected.identity,
    );
  });

  test(`review prerequisites bind effective wrapper inputs and present configuration contents (${profile.sourceRevision})`, () => {
    const direct = selectGitEnvironment(installation, environment, facts);
    for (const changed of [
      { ...environment, HOME: "C:\\fixture\\other-home" },
      { ...environment, PLINK_PROTOCOL: "custom-transport" },
      { ...environment, MSYS: "" },
    ])
      assert.notEqual(
        selectGitEnvironment(installation, changed, facts).prerequisiteIdentity,
        direct.prerequisiteIdentity,
      );
    const withoutProtocol = selectGitEnvironment(
      installation,
      { ...environment, PLINK_PROTOCOL: undefined },
      facts,
    );
    assert.notEqual(withoutProtocol.prerequisiteIdentity, direct.prerequisiteIdentity);
    assert.equal(
      withoutProtocol.prerequisiteIdentity,
      selectGitEnvironment(installation, { ...environment, PLINK_PROTOCOL: "ssh" }, facts)
        .prerequisiteIdentity,
    );
    const configured = {
      ...facts,
      wrapperConfigPresent: true,
      wrapperConfigSha256: "1".repeat(64),
    };
    assert.notEqual(
      selectGitEnvironment(installation, environment, configured).prerequisiteIdentity,
      selectGitEnvironment(installation, environment, {
        ...configured,
        wrapperConfigSha256: "2".repeat(64),
      }).prerequisiteIdentity,
    );
  });

  test(`Git execution rejects malformed environment values before translation (${profile.sourceRevision})`, () => {
    for (const value of [
      null,
      [],
      { HOME: 42 },
      { HOME: "C:\\fixture\0home" },
      { PATH: false },
      { PATH: "first", Path: "second" },
    ])
      assert.throws(() => selectGitEnvironment(installation, value, facts));
  });
}

const hash = (value: string | Uint8Array): string =>
  createHash("sha256").update(value).digest("hex");
const environmentHash = (value: Record<string, string | undefined>): string =>
  hash(JSON.stringify(Object.entries(value).sort(([left], [right]) => left.localeCompare(right))));
const Hash = Schema.String.check(Schema.isPattern(/^[a-f0-9]{64}$/u));
const HookEvidence = Schema.Struct({
  HOME: Hash,
  PATH: Hash,
  MSYSTEM: Hash,
  MSYS: Hash,
  PLINK_PROTOCOL: Hash,
  GIT_EXEC_PATH: Hash,
  TEAMAGENT_GIT_PARITY: Hash,
  arguments: Hash,
});

test("runtime payload inspection rejects a linked bin directory before dispatch", async () => {
  const root = await mkdtemp("git-runtime-");
  const runtime = "ucrt64";
  const bin = join(root, runtime, "bin");
  const core = join(root, runtime, "libexec/git-core");
  const inspected: WindowsGitInstallation = {
    root,
    runtime,
    core,
    launcher: join(root, "cmd/git.exe"),
    payload: join(core, "git.exe"),
  };
  await mkdir(bin, { recursive: true });
  const contents = "Runtime payload fixture; never executed.\n";
  await writeFile(join(bin, "git.exe"), contents, "utf8");
  assert.equal((await inspectGitRuntimePayload(inspected)).sha256, hash(contents));
  const original = join(root, runtime, "retained-bin");
  await rename(bin, original);
  await symlink(original, bin, "junction");
  await assert.rejects(inspectGitRuntimePayload(inspected), /Linked|physical/iu);
  assert.equal(await readFile(join(original, "git.exe"), "utf8"), contents);
});

async function assertInstalledProfileMode(selected: GitExecution): Promise<void> {
  if (process.platform !== "win32") {
    assert.equal(selected.mode, "posix");
    return;
  }
  assert.ok(selected.payload);
  const core = dirname(selected.payload);
  const runtimeDirectory = dirname(dirname(core));
  const runtime = Schema.decodeUnknownSync(Schema.Literals(["ucrt64", "mingw64", "mingw32"]))(
    basename(runtimeDirectory),
  );
  const inspected: WindowsGitInstallation = {
    root: dirname(runtimeDirectory),
    runtime,
    core,
    launcher: selected.launcher,
    payload: selected.payload,
  };
  const binaryDigest = async (path: string): Promise<string> =>
    await fileContentDigest(path, await lstat(path, { bigint: true }), {
      maximumBytes: 256 * 1024 ** 2,
    });
  const launcherSha256 = await binaryDigest(selected.launcher);
  const payloadSha256 = await binaryDigest(selected.payload);
  const runtimeSha256 = (await inspectGitRuntimePayload(inspected)).sha256;
  if (
    runtime === "ucrt64" &&
    gitPayloadProfiles.some(
      (profile) =>
        launcherSha256 === profile.launcherSha256 &&
        payloadSha256 === profile.payloadSha256 &&
        runtimeSha256 === profile.payloadSha256,
    )
  )
    assert.equal(
      selected.mode,
      "payload",
      "The reviewed installed profile must exercise actual payload parity",
    );
  else {
    assert.equal(selected.mode, "canonical");
    assert.equal(selected.reason, "unsupported-profile");
  }
}

test("selected Git matches canonical shell hooks, literal arguments, status and saved repository bytes", async () => {
  const root = await mkdtemp("git-parity-");
  const home = join(root, "home");
  const hooks = join(root, "hooks");
  await mkdir(home);
  await mkdir(hooks);
  const env: Record<string, string | undefined> = { ...gitEnvironment() };
  const overrides = {
    HOME: home,
    MSYSTEM: "synthetic-before-wrapper",
    MSYS: "winsymlinks:nativestrict",
    PLINK_PROTOCOL: "",
    GIT_EXEC_PATH: undefined,
    GIT_CONFIG_GLOBAL: process.platform === "win32" ? "NUL" : "/dev/null",
    GIT_CONFIG_NOSYSTEM: "1",
    TEAMAGENT_GIT_PARITY: "synthetic-marker",
    TEAMAGENT_GIT_PARITY_BUN: process.execPath,
    TEAMAGENT_GIT_PARITY_SCRIPT: join(root, "hook.ts"),
  };
  for (const name of Object.keys(overrides))
    for (const key of Object.keys(env))
      if (key.toLowerCase() === name.toLowerCase()) Reflect.deleteProperty(env, key);
  Object.assign(env, overrides);
  const originalEnvironment = environmentHash(env);
  const selected = await resolveGitExecution(root, env);
  assert.equal(environmentHash(env), originalEnvironment);
  await assertInstalledProfileMode(selected);
  if (selected.mode === "canonical") {
    assert.ok(selected.reason);
    assert.equal(selected.executable, selected.launcher);
    assert.equal(environmentHash(selected.env), environmentHash(env));
  } else if (process.platform === "win32") {
    assert.equal(selected.mode, "payload");
    assert.equal(selected.executable, selected.payload);
  } else {
    assert.equal(selected.mode, "posix");
    assert.equal(environmentHash(selected.env), environmentHash(env));
  }
  const run = async (
    executable: string,
    childEnvironment: Record<string, string | undefined>,
    args: readonly string[],
  ) => {
    const result = await runProcess(root, executable, gitPlatformArguments(args), {
      env: childEnvironment,
      timeoutMs: 20_000,
      maximumBytes: 65_536,
      maximumLineBytes: 8192,
    });
    assert.equal(result.outcome, "exited", diagnostic(result.stderr));
    assert.equal(result.termination, "closed", diagnostic(result.stderr));
    return result;
  };
  const initialized = await run(selected.launcher, env, ["init", "--quiet", "--template="]);
  assert.equal(initialized.code, 0, diagnostic(initialized.stderr));
  await writeFile(join(root, "tracked.txt"), "Preserve the staged fixture.\n", "utf8");
  const staged = await run(selected.launcher, env, [
    "-c",
    "core.autocrlf=false",
    "add",
    "--",
    "tracked.txt",
  ]);
  assert.equal(staged.code, 0, diagnostic(staged.stderr));
  const configuration = await readFile(join(root, ".git/config"));
  const index = await readFile(join(root, ".git/index"));
  await writeFile(
    join(hooks, "commit-msg"),
    '#!/bin/sh\nexec "$TEAMAGENT_GIT_PARITY_BUN" "$TEAMAGENT_GIT_PARITY_SCRIPT" "$@"\n',
    "utf8",
  );
  await chmod(join(hooks, "commit-msg"), 0o755);
  await writeFile(
    join(root, "hook.ts"),
    'import { createHash } from "node:crypto";\n' +
      'const hash = (value: string): string => createHash("sha256").update(value).digest("hex");\n' +
      'const names = ["HOME", "PATH", "MSYSTEM", "MSYS", "PLINK_PROTOCOL", "GIT_EXEC_PATH", "TEAMAGENT_GIT_PARITY"];\n' +
      'const evidence = Object.fromEntries(names.map((name) => [name, hash(process.env[name] ?? "<absent>")]));\n' +
      'process.stdout.write(JSON.stringify({ ...evidence, arguments: hash(JSON.stringify(process.argv.slice(2))) }) + "\\n");\n' +
      "process.exit(7);\n",
    "utf8",
  );
  const argument = join(root, "message $(literal) with spaces.txt");
  const args = ["-c", "core.hooksPath=" + hooks, "hook", "run", "commit-msg", "--", argument];
  const canonical = await run(selected.launcher, env, args);
  const actual = await run(selected.executable, selected.env, args);
  for (const result of [canonical, actual]) {
    assert.equal(result.code, 7, diagnostic(result.stderr));
    assert.equal(result.stdout, "");
    const input: unknown = JSON.parse(result.stderr);
    const evidence = Schema.decodeUnknownSync(HookEvidence)(input, { onExcessProperty: "error" });
    assert.equal(evidence.arguments, hash(JSON.stringify([argument])));
    assert.equal(evidence.TEAMAGENT_GIT_PARITY, hash("synthetic-marker"));
  }
  assert.equal(actual.stderr, canonical.stderr);
  assert.equal(hash(await readFile(join(root, ".git/config"))), hash(configuration));
  assert.equal(hash(await readFile(join(root, ".git/index"))), hash(index));
  assert.equal(environmentHash(env), originalEnvironment);
});

test("payload-backed workflow publication retains real hooks, SSH signatures and remote confirmation", async () => {
  const f = await fixture();
  await assertInstalledProfileMode(await resolveGitExecution(f.repo, gitEnvironment()));
  const hooks = [".githooks/pre-commit", ".githooks/commit-msg"];
  await mkdir(join(f.repo, ".cache/git-hooks"), { recursive: true });
  for (const path of hooks) {
    const name = basename(path);
    await writeFile(
      join(f.repo, path),
      `#!/bin/sh\nprintf '%s\\n' '${name}' >> '.cache/git-hooks/${name}.txt'\n`,
      "utf8",
    );
    await chmod(join(f.repo, path), 0o755);
  }
  const configuration = await readFile(join(f.repo, ".git/config"));
  await f.prepare({ files: ["owned.txt", ...hooks], approvedExistingFiles: hooks });
  const result = await f.call({ operation: "publish" });
  assert.equal(result.state, "pushed");
  assert.ok(result.commit);
  await f.git(["verify-commit", result.commit]);
  assert.equal((await f.git(["show", "-s", "--format=%G?", result.commit])).trim(), "G");
  for (const path of hooks) {
    const name = basename(path);
    assert.equal(
      await readFile(join(f.repo, ".cache/git-hooks", name + ".txt"), "utf8"),
      name + "\n",
    );
  }
  assert.deepEqual(f.counts(), { commits: 1, pushes: 1 });
  assert.equal(hash(await readFile(join(f.repo, ".git/config"))), hash(configuration));
  assert.equal(await f.git(["status", "--porcelain"]), "");
});
