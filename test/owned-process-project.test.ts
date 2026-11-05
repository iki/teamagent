import assert from "node:assert/strict";
import { access, mkdir, readFile, readdir, rename, symlink, writeFile } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import { test } from "node:test";
import { ownedProcessIdentity, spawnOwned } from "../app/check/owned-process.ts";
import { mkdtemp } from "./temporary.ts";

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
    const fixture = await mkdtemp("ow-");
    const source = join(fixture, "source");
    await mkdir(source);
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
    const parent = ".cache/verification/native-owned-process";
    const keys = await readdir(join(source, parent));
    assert.equal(keys.length, 1);
    const key = keys[0];
    assert.ok(key);
    const binary = await readFile(join(source, parent, key, "owned-process.exe"));
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

    for (const scenario of [
      "corrupt",
      "partial",
      "missing",
      "empty",
      "completed",
      "changed",
    ] as const) {
      const project = join(fixture, scenario);
      const folder = join(project, parent, key);
      await mkdir(folder, { recursive: true });
      await writeFile(join(folder, "owned-process.exe"), binary, { flag: "wx" });
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
      assert.deepEqual(await readFile(join(retained, "owned-process.exe")), binary);
      if (scenario === "partial") assert.deepEqual(await readdir(retained), ["owned-process.exe"]);
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
    for (const disappearing of ["owned-process.exe", "binary.sha256"]) {
      const project = join(fixture, `disappearing-${disappearing}`);
      const folder = join(project, parent, key);
      await mkdir(folder, { recursive: true });
      await writeFile(join(folder, "owned-process.exe"), binary, { flag: "wx" });
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
        disappearing === "owned-process.exe" ? binary : Buffer.from(receipt),
      );
      assert.deepEqual(await readdir(folder), [
        disappearing === "owned-process.exe" ? "binary.sha256" : "owned-process.exe",
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
    const fixture = await mkdtemp("op-");
    const projects = [join(fixture, "a space ž"), join(fixture, "b")];
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
          assert.ok(
            owned.child.spawnfile.startsWith(
              join(projectRoot, ".cache", "verification", "native-owned-process"),
            ),
          );
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
    const fixture = await mkdtemp("oc-");
    const full = join(fixture, "full");
    const cache = join(full, ".cache/verification/native-owned-process");
    await mkdir(cache, { recursive: true });
    for (let index = 0; index < 32; index++)
      await mkdir(join(cache, index.toString(16).padStart(64, "0")));
    await assert.rejects(ownedProcessIdentity(full), /capacity/u);
    await access(join(cache, "0".repeat(64)));
    await access(join(cache, "1f".padStart(64, "0")));

    const linked = join(fixture, "linked-cache");
    const outside = join(fixture, "untouched");
    await Promise.all([mkdir(linked), mkdir(outside)]);
    await symlink(outside, join(linked, ".cache"), "junction");
    await assert.rejects(ownedProcessIdentity(linked), /Linked cache path/u);
    await assert.rejects(access(join(outside, "verification")), { code: "ENOENT" });
    // The default remains the implementation checkout, even after foreign project use.
    assert.match(await ownedProcessIdentity(resolve(import.meta.dir, "..")), /^[a-f0-9]{64}$/u);
  },
);
