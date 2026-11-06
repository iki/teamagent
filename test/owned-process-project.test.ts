import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { access, mkdir, readFile, readdir, rename, symlink, writeFile } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import { test } from "node:test";
import {
  assertWindowsNativePath,
  windowsNativePathLimit,
  ownedProcessIdentity,
  spawnOwned,
} from "../app/check/owned-process.ts";
import { mkdtemp } from "./temporary.ts";

await test("Windows native admission counts UTF-16 units and rejects deep owners before compilation", async () => {
  assert.equal(windowsNativePathLimit, 248);
  assert.doesNotThrow(() => assertWindowsNativePath("x".repeat(windowsNativePathLimit), "win32"));
  assert.throws(
    () => assertWindowsNativePath("x".repeat(windowsNativePathLimit + 1), "win32"),
    /compatibility bound/u,
  );
  assert.doesNotThrow(() =>
    assertWindowsNativePath("😀".repeat(windowsNativePathLimit / 2), "win32"),
  );
  assert.throws(
    () => assertWindowsNativePath("😀".repeat(windowsNativePathLimit / 2) + "x", "win32"),
    /compatibility bound/u,
  );
  assert.doesNotThrow(() => assertWindowsNativePath("x".repeat(1024), "linux"));
  if (process.platform === "win32") {
    const base = await mkdtemp("ng-");
    const project = join(base, "x".repeat(Math.max(1, windowsNativePathLimit - base.length)));
    assert.ok(project.length > windowsNativePathLimit);
    await mkdir(project);
    let observed = false;
    await assert.rejects(
      ownedProcessIdentity(project, () => {
        observed = true;
      }),
      /compatibility bound/u,
    );
    assert.equal(
      observed,
      false,
      "Unsupported paths never reach cache preparation or native compilation",
    );
    await assert.rejects(access(join(project, ".cache")), { code: "ENOENT" });
  }
});

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

await test(
  "warm native reuse ignores retained locks and preserves invalid or disappearing evidence",
  { skip: process.platform !== "win32", timeout: 30_000 },
  async () => {
    const fixture = await mkdtemp("w-");
    const source = join(fixture, "s");
    await mkdir(source);
    const legacyFolder = join(source, ".cache/verification/native-owned-process", "a".repeat(64));
    const legacyBytes = "retained legacy cache bytes\n";
    const legacyReceipt = createHash("sha256").update(legacyBytes).digest("hex") + "\n";
    await mkdir(legacyFolder, { recursive: true });
    await writeFile(join(legacyFolder, "owned-process.exe"), legacyBytes, "utf8");
    await writeFile(join(legacyFolder, "binary.sha256"), legacyReceipt, "utf8");
    let publications = 0;
    const identities = await Promise.all(
      [0, 1].map(() =>
        ownedProcessIdentity(source, (phase) => {
          if (phase === "locked") publications++;
        }),
      ),
    );
    assert.equal(publications, 1);
    assert.equal(identities[0], identities[1]);
    assert.equal(await readFile(join(legacyFolder, "owned-process.exe"), "utf8"), legacyBytes);
    assert.equal(await readFile(join(legacyFolder, "binary.sha256"), "utf8"), legacyReceipt);
    const parent = ".cache/native";
    const keys = await readdir(join(source, parent));
    assert.equal(
      keys.length,
      1,
      "Completed preparation leaves only the full-key artifact directory",
    );
    assert.match(keys[0] ?? "", /^[a-f0-9]{64}$/u);
    const key = keys[0];
    assert.ok(key);
    const binary = await readFile(join(source, parent, key, "run.exe"));
    const receipt = await readFile(join(source, parent, key, "binary.sha256"), "utf8");
    const invalidReceipt = `${"0".repeat(64)}\n`;
    const lock = join(source, ".cache/verification/native-owned-process.lock");
    const retainedLock = '{"retained":"unresolved-owner"}\n';
    await writeFile(lock, retainedLock, { flag: "wx" });
    const phases: string[] = [];
    assert.equal(
      await ownedProcessIdentity(source, (phase) => {
        phases.push(phase);
      }),
      identities[0],
    );
    assert.deepEqual(phases, ["optimistic-complete"]);
    assert.equal(await readFile(lock, "utf8"), retainedLock);

    for (const [index, scenario] of (
      ["corrupt", "partial", "missing", "empty", "completed", "changed"] as const
    ).entries()) {
      const project = join(fixture, `p${index}`);
      const folder = join(project, parent, key);
      await mkdir(folder, { recursive: true });
      await writeFile(join(folder, "run.exe"), binary, { flag: "wx" });
      if (scenario !== "partial" && scenario !== "completed")
        await writeFile(
          join(folder, "binary.sha256"),
          scenario === "changed" ? receipt : invalidReceipt,
          { flag: "wx" },
        );
      const phases: string[] = [];
      const operation = ownedProcessIdentity(project, async (phase) => {
        phases.push(phase);
        if (phase === "optimistic-invalid" && (scenario === "missing" || scenario === "empty")) {
          await rename(folder, join(project, "retained-evidence"));
          if (scenario === "empty") await mkdir(folder);
        } else if (phase === "optimistic-invalid" && scenario === "completed") {
          await writeFile(join(folder, "binary.sha256"), receipt);
        } else if (phase === "optimistic-complete" && scenario === "changed") {
          await writeFile(join(folder, "binary.sha256"), invalidReceipt);
        }
      });
      if (scenario === "completed") assert.equal(await operation, identities[0]);
      else await assert.rejects(operation, /(?:integrity|Incomplete)/u);
      assert.deepEqual(
        phases,
        scenario === "changed" ? ["optimistic-complete"] : ["optimistic-invalid", "locked"],
      );
      const retained =
        scenario === "missing" || scenario === "empty"
          ? join(project, "retained-evidence")
          : folder;
      assert.deepEqual(await readFile(join(retained, "run.exe")), binary);
      if (scenario === "partial") assert.deepEqual(await readdir(retained), ["run.exe"]);
      else
        assert.equal(
          await readFile(join(retained, "binary.sha256"), "utf8"),
          scenario === "completed" ? receipt : invalidReceipt,
        );
      if (scenario === "empty") assert.deepEqual(await readdir(folder), []);
      if (scenario === "missing") await assert.rejects(access(folder), { code: "ENOENT" });
      await assert.rejects(access(join(project, ".cache/verification/native-owned-process.lock")), {
        code: "ENOENT",
      });
    }
    for (const [index, disappearing] of ["run.exe", "binary.sha256"].entries()) {
      const project = join(fixture, `d${index}`);
      const folder = join(project, parent, key);
      await mkdir(folder, { recursive: true });
      await writeFile(join(folder, "run.exe"), binary, { flag: "wx" });
      await writeFile(join(folder, "binary.sha256"), receipt, { flag: "wx" });
      const phases: string[] = [];
      await assert.rejects(
        ownedProcessIdentity(project, async (phase) => {
          phases.push(phase);
          if (phase === "optimistic-complete")
            await rename(join(folder, disappearing), join(project, disappearing));
        }),
        /Incomplete/u,
      );
      assert.deepEqual(phases, ["optimistic-complete"]);
      assert.deepEqual(
        await readFile(join(project, disappearing)),
        disappearing === "run.exe" ? binary : Buffer.from(receipt),
      );
      assert.deepEqual(await readdir(folder), [
        disappearing === "run.exe" ? "binary.sha256" : "run.exe",
      ]);
      await assert.rejects(access(join(project, ".cache/verification/native-owned-process.lock")), {
        code: "ENOENT",
      });
    }
    assert.equal(await readFile(lock, "utf8"), retainedLock);
  },
);

await test(
  "native supervisors belong to the explicit project, independent of cwd and inherited routing",
  { skip: process.platform !== "win32", timeout: 30_000 },
  async () => {
    const fixture = await mkdtemp("o");
    const projects = [join(fixture, "a ž"), join(fixture, "b")];
    const cwd = join(fixture, "working");
    const foreign = join(fixture, "foreign");
    await Promise.all([...projects, cwd, foreign].map((path) => mkdir(path)));
    const script = join(cwd, "observe.ts");
    await writeFile(
      script,
      'process.stdout.write(process.cwd() + "\\n" + process.env.TEAMAGENT_TEMPORARY_ROOT + "\\n");\n',
      "utf8",
    );
    const results = await Promise.all(
      projects.map(async (projectRoot) => {
        const owned = await spawnOwned(process.execPath, [script], {
          cwd,
          projectRoot,
          env: {
            ...process.env,
            TEAMAGENT_TEMPORARY_ROOT: foreign,
            TEAMAGENT_TEMPORARY_PARENT: join(foreign, "not-an-owner"),
            TEAMAGENT_TEMPORARY_PARENT_ID: "not-an-owner",
          },
          stdio: "pipe",
          timeoutMs: 10_000,
        });
        owned.child.stdin?.end();
        const stdout = text(owned.child.stdout);
        const stderr = text(owned.child.stderr);
        try {
          const result = await owned.closed;
          assert.equal(result.termination, "closed");
          assert.equal(result.error, undefined);
          assert.equal(result.code, 0, await stderr);
          assert.equal(await stdout, `${cwd}\n${foreign}\n`);
          assert.ok(owned.child.spawnfile.startsWith(join(projectRoot, ".cache", "native")));
          return { projectRoot, executable: owned.child.spawnfile };
        } finally {
          await owned.stop();
          await Promise.all([stdout, stderr]);
        }
      }),
    );
    await assert.rejects(access(join(cwd, ".cache")), { code: "ENOENT" });
    await assert.rejects(access(join(foreign, ".cache")), { code: "ENOENT" });
    const first = results[0];
    const second = results[1];
    assert.ok(first && second);
    assert.notEqual(first.executable, second.executable);
    assert.equal(basename(dirname(first.executable)), basename(dirname(second.executable)));
    const firstIdentity = await ownedProcessIdentity(first.projectRoot);
    const identity = await ownedProcessIdentity(second.projectRoot);
    assert.match(firstIdentity, /^[a-f0-9]{64}$/u);
    assert.equal(await ownedProcessIdentity(first.projectRoot), firstIdentity);
    for (const project of projects)
      await assert.rejects(access(join(project, ".cache/verification/native-owned-process.lock")), {
        code: "ENOENT",
      });

    const receipt = join(dirname(first.executable), "binary.sha256");
    const invalid = `${"0".repeat(64)}\n`;
    await writeFile(receipt, invalid, "utf8");
    await assert.rejects(ownedProcessIdentity(first.projectRoot), /integrity/u);
    assert.equal(await readFile(receipt, "utf8"), invalid);
    assert.equal(await ownedProcessIdentity(second.projectRoot), identity);
  },
);

await test("explicit project ownership rejects relative, file and redirected roots before launch", async () => {
  const fixture = await mkdtemp("or-");
  const actual = join(fixture, "actual");
  await mkdir(join(actual, "child"), { recursive: true });
  const linked = join(fixture, "linked");
  await symlink(actual, linked, process.platform === "win32" ? "junction" : "dir");
  const file = join(fixture, "not-a-directory");
  await writeFile(file, "fixture\n", "utf8");
  const marker = join(fixture, "must-not-run");
  const script = join(fixture, "unexpected.ts");
  await writeFile(script, `await Bun.write(${JSON.stringify(marker)}, "ran\\n");\n`, "utf8");
  for (const projectRoot of [".", file, linked, join(linked, "child")]) {
    await assert.rejects(
      spawnOwned(process.execPath, [script], { cwd: fixture, projectRoot, stdio: "pipe" }),
      /Owned project root/u,
    );
    await assert.rejects(ownedProcessIdentity(projectRoot), /Owned project root/u);
  }
  await assert.rejects(access(marker), { code: "ENOENT" });
  await assert.rejects(access(join(actual, ".cache")), { code: "ENOENT" });
});

await test(
  "project-local native caches retain capacity and redirected-path boundaries",
  { skip: process.platform !== "win32", timeout: 30_000 },
  async () => {
    const fixture = await mkdtemp("c-");
    const full = join(fixture, "f");
    const cache = join(full, ".cache/native");
    await mkdir(cache, { recursive: true });
    for (let index = 0; index < 32; index++)
      await mkdir(join(cache, index.toString(16).padStart(64, "0")));
    await assert.rejects(ownedProcessIdentity(full), /capacity/u);
    await access(join(cache, "0".repeat(64)));
    await access(join(cache, "1f".padStart(64, "0")));

    const combined = join(fixture, "b");
    const oldCache = join(combined, ".cache/verification/native-owned-process");
    const newCache = join(combined, ".cache/native");
    const retained = "legacy native capacity evidence\n";
    const retainedDigest = createHash("sha256").update(retained).digest("hex") + "\n";
    for (let index = 0; index < 16; index++) {
      const key = index.toString(16).padStart(64, "0");
      await mkdir(join(newCache, key), { recursive: true });
      const old = join(oldCache, key);
      await mkdir(old, { recursive: true });
      await writeFile(join(old, "owned-process.exe"), retained, "utf8");
      await writeFile(join(old, "binary.sha256"), retainedDigest, "utf8");
    }
    await assert.rejects(ownedProcessIdentity(combined), /capacity/u);
    assert.equal((await readdir(newCache)).length, 16);
    assert.equal((await readdir(oldCache)).length, 16);
    assert.equal(
      await readFile(join(oldCache, "0".repeat(64), "owned-process.exe"), "utf8"),
      retained,
    );
    for (const [index, mode] of (["empty", "partial", "corrupt"] as const).entries()) {
      const rejected = join(fixture, `r${index}`);
      const old = join(rejected, ".cache/verification/native-owned-process", "b".repeat(64));
      await mkdir(old, { recursive: true });
      if (mode !== "empty") await writeFile(join(old, "owned-process.exe"), retained, "utf8");
      if (mode === "corrupt")
        await writeFile(join(old, "binary.sha256"), "0".repeat(64) + "\n", "utf8");
      const before = await readdir(old);
      await assert.rejects(ownedProcessIdentity(rejected), /(?:Incomplete|integrity)/u);
      assert.deepEqual(await readdir(old), before);
      if (mode !== "empty")
        assert.equal(await readFile(join(old, "owned-process.exe"), "utf8"), retained);
    }
    const malformed = join(fixture, "m");
    const unexpected = join(malformed, ".cache/verification/native-owned-process/not-a-key");
    await mkdir(unexpected, { recursive: true });
    await writeFile(join(unexpected, "evidence"), retained, "utf8");
    await assert.rejects(ownedProcessIdentity(malformed), /requires inspection/u);
    assert.equal(await readFile(join(unexpected, "evidence"), "utf8"), retained);
    const redirected = join(fixture, "l");
    const legacyParent = join(redirected, ".cache/verification/native-owned-process");
    const legacyOutside = join(fixture, "v");
    await Promise.all([mkdir(legacyParent, { recursive: true }), mkdir(legacyOutside)]);
    await writeFile(join(legacyOutside, "evidence"), retained, "utf8");
    await symlink(legacyOutside, join(legacyParent, "c".repeat(64)), "junction");
    await assert.rejects(ownedProcessIdentity(redirected), /requires inspection/u);
    assert.equal(await readFile(join(legacyOutside, "evidence"), "utf8"), retained);

    const interrupted = join(fixture, "i");
    const staging = join(interrupted, ".cache/native/compile-retained");
    await mkdir(staging, { recursive: true });
    await writeFile(join(staging, "evidence"), "unconfirmed compiler evidence\n", "utf8");
    await assert.rejects(ownedProcessIdentity(interrupted), /requires inspection/u);
    assert.equal(
      await readFile(join(staging, "evidence"), "utf8"),
      "unconfirmed compiler evidence\n",
    );

    const linked = join(fixture, "j");
    const outside = join(fixture, "untouched");
    await Promise.all([mkdir(linked), mkdir(outside)]);
    await symlink(outside, join(linked, ".cache"), "junction");
    await assert.rejects(ownedProcessIdentity(linked), /Linked cache path/u);
    await assert.rejects(access(join(outside, "native")), { code: "ENOENT" });
    // The default remains the implementation checkout, even after foreign project use.
    assert.match(await ownedProcessIdentity(resolve(import.meta.dir, "..")), /^[a-f0-9]{64}$/u);
  },
);
