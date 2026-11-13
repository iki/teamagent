import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";
import { copyFile, mkdir, readFile, rename, symlink, unlink, writeFile } from "node:fs/promises";
import { join, win32 } from "node:path";
import { test } from "bun:test";
import { which } from "bun";
import { gitBytes, gitText } from "../app/check/cache-io.ts";
import {
  gitFileFingerprintSync,
  gitPayloadProfiles,
  resolveGitExecutionSync,
  selectGitEnvironment,
  synchronousGitInstallation,
} from "../app/check/git-execution.ts";
import { mkdtemp } from "./temporary.ts";

const hash = (value: Uint8Array): string => createHash("sha256").update(value).digest("hex");

test("synchronous cache Git shares existing policy and leaves unsupported dispatch unchanged", () => {
  const root = "C:/fixture/Git",
    installation = synchronousGitInstallation(root + "/cmd/git.exe");
  assert.ok(installation);
  assert.deepEqual(synchronousGitInstallation(root + "/bin/git.exe"), installation);
  assert.deepEqual(synchronousGitInstallation(root + "/ucrt64/bin/git.exe"), installation);
  assert.deepEqual(
    synchronousGitInstallation(root + "/ucrt64/libexec/git-core/git.exe"),
    installation,
  );
  for (const nestedRoot of ["C:/tools/bin/Git", "C:/tools/ucrt64/Git"]) {
    const expected = synchronousGitInstallation(nestedRoot + "/cmd/git.exe");
    assert.ok(expected);
    assert.equal(expected.root, win32.normalize(nestedRoot));
    for (const suffix of ["bin/git.exe", "ucrt64/bin/git.exe", "ucrt64/libexec/git-core/git.exe"])
      assert.deepEqual(synchronousGitInstallation(nestedRoot + "/" + suffix), expected);
  }
  for (const candidate of ["relative/git.exe", "C:/foreign/git.exe", "C:/bad\ngit.exe"])
    assert.equal(synchronousGitInstallation(candidate), null);
  const environment = { PATH: "", HOME: "fixture", PLINK_PROTOCOL: "" };
  const before = { ...environment };
  const unavailable = resolveGitExecutionSync(process.cwd(), environment);
  assert.equal(unavailable.executable, "git");
  assert.deepEqual(unavailable.env, environment);
  assert.deepEqual(environment, before);
  assert.throws(
    () => resolveGitExecutionSync(process.cwd(), { PATH: 123 }),
    /environment is invalid/u,
  );
  for (const profile of gitPayloadProfiles) {
    const selected = selectGitEnvironment(installation, environment, {
      launcherSha256: profile.launcherSha256,
      payloadSha256: profile.payloadSha256,
      runtimePayloadSha256: profile.payloadSha256,
      wrapperConfigPresent: false,
    });
    assert.equal(selected.mode, "payload");
    assert.equal(selected.env.PLINK_PROTOCOL, "");
  }
});

test("synchronous complete-byte inspection rejects mutation and closes its descriptor", async () => {
  const root = await mkdtemp("sg-"),
    source = join(root, "source.bin");
  const original = new Uint8Array(128 * 1024).fill(7);
  await writeFile(source, original);
  assert.equal(gitFileFingerprintSync(source), hash(original));
  assert.throws(() => gitFileFingerprintSync(source, original.length - 1), /bound/u);
  for (const size of [original.length - 1, original.length + 1]) {
    await writeFile(source, original);
    let changed = false;
    assert.throws(
      () =>
        gitFileFingerprintSync(source, original.length + 1, (phase) => {
          if (phase === "read" && !changed) {
            changed = true;
            writeFileSync(source, new Uint8Array(size).fill(9));
          }
        }),
      /changed/u,
    );
    assert.equal(changed, true);
    await rename(source, source + ".retained");
    await rename(source + ".retained", source);
  }
  const target = join(root, "target"),
    linked = join(root, "linked");
  await mkdir(target);
  await writeFile(join(target, "file.bin"), original);
  await symlink(target, linked, process.platform === "win32" ? "junction" : "dir");
  assert.throws(() => gitFileFingerprintSync(join(linked, "file.bin")), /physical/u);
});

test("every synchronous selection rechecks all actual executables and wrapper configuration", async () => {
  const root = await mkdtemp("sg-");
  if (process.platform !== "win32") {
    const env = { PATH: process.env.PATH, HOME: root };
    assert.deepEqual(resolveGitExecutionSync(root, env), {
      executable: "git",
      env,
      mode: "posix",
      reason: null,
    });
    return;
  }
  const selected = which("git", { PATH: process.env.PATH ?? "", cwd: root });
  assert.ok(selected);
  const actual = synchronousGitInstallation(selected);
  if (!actual) {
    assert.equal(resolveGitExecutionSync(root).executable, "git");
    return;
  }
  let profile: (typeof gitPayloadProfiles)[number] | undefined;
  try {
    const launcher = gitFileFingerprintSync(actual.launcher),
      core = gitFileFingerprintSync(actual.payload),
      runtime = gitFileFingerprintSync(win32.join(actual.root, "ucrt64/bin/git.exe"));
    profile = gitPayloadProfiles.find(
      (candidate) =>
        launcher === candidate.launcherSha256 &&
        core === candidate.payloadSha256 &&
        runtime === candidate.payloadSha256,
    );
  } catch {
    /* Missing or unsupported installations retain the original native dispatch. */
  }
  if (profile === undefined) {
    const originalEnvironment = { ...process.env };
    const unsupported = resolveGitExecutionSync(root, originalEnvironment);
    assert.equal(unsupported.executable, "git");
    assert.deepEqual(unsupported.env, originalEnvironment);
    return;
  }
  const fixture = synchronousGitInstallation(join(root, "Git/cmd/git.exe"));
  assert.ok(fixture);
  for (const folder of ["cmd", "bin", "ucrt64/bin", "ucrt64/libexec/git-core", "usr/bin", "etc"])
    await mkdir(win32.join(fixture.root, folder), { recursive: true });
  const copies = [
    "cmd/git.exe",
    "bin/git.exe",
    "ucrt64/bin/git.exe",
    "ucrt64/libexec/git-core/git.exe",
  ];
  for (const path of copies)
    await copyFile(
      path === "bin/git.exe" ? actual.launcher : win32.join(actual.root, path),
      win32.join(fixture.root, path),
    );
  const env = { HOME: root, PATH: win32.join(fixture.root, "bin"), PLINK_PROTOCOL: "" };
  const before = { ...env },
    admitted = resolveGitExecutionSync(root, env);
  assert.ok(
    gitFileFingerprintSync(fixture.launcher) === profile.launcherSha256 &&
      gitFileFingerprintSync(win32.join(fixture.root, "bin/git.exe")) === profile.launcherSha256 &&
      gitFileFingerprintSync(fixture.payload) === profile.payloadSha256 &&
      gitFileFingerprintSync(win32.join(fixture.root, "ucrt64/bin/git.exe")) ===
        profile.payloadSha256,
  );
  assert.equal(admitted.mode, "payload");
  assert.equal(admitted.executable, fixture.payload);
  assert.equal(admitted.env.PLINK_PROTOCOL, "");
  assert.deepEqual(env, before);
  for (const path of copies) {
    const file = win32.join(fixture.root, path),
      original = await readFile(file);
    try {
      await writeFile(file, Buffer.concat([original, Buffer.from("changed")]));
      const rejected = resolveGitExecutionSync(root, env);
      assert.equal(rejected.executable, "git", path);
      assert.deepEqual(rejected.env, env, path);
    } finally {
      await writeFile(file, original);
    }
    assert.equal(resolveGitExecutionSync(root, env).executable, fixture.payload);
  }
  const config = win32.join(fixture.root, "etc/git-bash.config");
  await writeFile(config, "fixture-option\n");
  assert.equal(resolveGitExecutionSync(root, env).executable, "git");
  await unlink(config);
  for (const altered of [
    { ...env, HOME: "" },
    { ...env, GIT_EXEC_PATH: root },
  ]) {
    const rejected = resolveGitExecutionSync(root, altered);
    assert.equal(rejected.executable, "git");
    assert.deepEqual(rejected.env, altered);
  }
  const hook = {
    ...admitted.env,
    PATH: fixture.core + ";" + admitted.env.PATH,
    GIT_EXEC_PATH: fixture.core,
  };
  const direct = resolveGitExecutionSync(root, hook);
  assert.equal(direct.mode, "payload");
  assert.equal(direct.executable, "git");
  assert.deepEqual(direct.env, hook, "Already-direct Git must not translate the wrapper twice");
  const runtime = win32.join(fixture.root, "ucrt64/bin/git.exe");
  await rename(runtime, runtime + ".retained");
  try {
    assert.equal(resolveGitExecutionSync(root, env).executable, "git");
  } finally {
    await rename(runtime + ".retained", runtime);
  }
});

test("actual cache Git preserves raw bytes, strict text, alternate indexes and native failure", async () => {
  const root = await mkdtemp("sg-");
  gitBytes(root, ["init", "--quiet", "--template="]);
  const name = "literal [a] Žluťoučký.txt";
  await writeFile(join(root, name), "Fixture text\n", "utf8");
  gitBytes(root, ["add", "--", name]);
  const ordinaryIndex = join(root, ".git/index"),
    original = await readFile(ordinaryIndex);
  const alternate = join(root, "alternate-index");
  await copyFile(ordinaryIndex, alternate);
  const listed = gitBytes(root, ["ls-files", "-z"], { indexFile: alternate });
  assert.deepEqual(Buffer.from(listed), Buffer.from(name + "\0", "utf8"));
  assert.equal(gitText(root, ["ls-files", "-z"], { indexFile: alternate }), name + "\0");
  gitBytes(root, ["read-tree", "--empty"], { indexFile: alternate });
  assert.equal(gitBytes(root, ["ls-files", "-z"], { indexFile: alternate }).length, 0);
  assert.deepEqual(
    await readFile(ordinaryIndex),
    original,
    "Alternate-index operations leave the ordinary index untouched",
  );
  const raw = new Uint8Array([0xff, 0, 13, 10, 7]);
  const oid = new TextDecoder()
    .decode(gitBytes(root, ["hash-object", "-w", "--stdin"], { input: raw }))
    .trim();
  assert.match(oid, /^[a-f0-9]{40}(?:[a-f0-9]{24})?$/u);
  assert.deepEqual(Buffer.from(gitBytes(root, ["cat-file", "blob", oid])), Buffer.from(raw));
  assert.throws(() => gitText(root, ["cat-file", "blob", oid]), TypeError);
  assert.throws(
    () => gitBytes(root, ["not-a-real-cache-command"]),
    /Verification Git inspection failed.*no result can be reused/u,
  );
  const inherited = process.env.GIT_INDEX_FILE;
  try {
    process.env.GIT_INDEX_FILE = join(root, "absent-parent/index");
    assert.equal(
      gitText(root, ["ls-files", "-z"]),
      name + "\0",
      "Ambient index override is still removed",
    );
  } finally {
    if (inherited === undefined) Reflect.deleteProperty(process.env, "GIT_INDEX_FILE");
    else process.env.GIT_INDEX_FILE = inherited;
  }
}, 120_000);
