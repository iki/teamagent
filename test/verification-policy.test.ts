import { assertTemporaryFixture, mkdtemp } from "./temporary.ts";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { test } from "node:test";
import {
  resolveVerificationWritePolicy,
  verificationEnvironmentIdentity,
  verificationLocaleEnvironment,
  verificationWriteVariable,
} from "../app/check/verification-policy.ts";
import { unitEnvironment } from "../app/check/test-groups.ts";
import { verificationHost } from "../app/workflow/workflow.ts";

async function fixture() {
  const root = await mkdtemp("test-verification-policy-");
  return {
    root,
    async close() {
      await assertTemporaryFixture(root);
      await rm(root, { recursive: true, force: true });
    },
  };
}

await test("verification storage policy is explicit and rejects unsupported values", () => {
  assert.equal(resolveVerificationWritePolicy({}), "tracked");
  for (const value of ["tracked", "local"])
    assert.equal(resolveVerificationWritePolicy({ [verificationWriteVariable]: value }), value);
  for (const value of ["", "shared", "LOCAL", " local", "off"])
    assert.throws(() => resolveVerificationWritePolicy({ [verificationWriteVariable]: value }));
});

await test("verification locale and worker policy do not mutate the parent or erase meaningful settings", () => {
  const base = {
    LANG: "cs_CZ.UTF-8",
    LC_ALL: "C",
    TZ: "Europe/Prague",
    CI: "true",
    GITHUB_ACTIONS: "true",
    TEAMAGENT_FIXTURE: "kept",
    [verificationWriteVariable]: "local",
  };
  const before = { ...base };
  const normalized = verificationLocaleEnvironment(base);
  assert.deepEqual(normalized, { ...base, LANG: "C.UTF-8", LC_ALL: "C.UTF-8" });
  const worker = unitEnvironment(base, "/owned/fixture-bytecode");
  assert.equal(worker[verificationWriteVariable], undefined);
  assert.equal(worker.GITHUB_ACTIONS, undefined);
  assert.equal(worker.CI, "true");
  assert.equal(worker.TEAMAGENT_FIXTURE, "kept");
  assert.equal(worker.TZ, "Europe/Prague");
  assert.equal(worker.LANG, "C.UTF-8");
  assert.equal(worker.LC_ALL, "C.UTF-8");
  assert.equal(worker.PYTHONDONTWRITEBYTECODE, "1");
  assert.equal(worker.PYTHONPYCACHEPREFIX, "/owned/fixture-bytecode");
  assert.deepEqual(base, before);
});

await test("receipt routing is excluded from keys while actual Intl defaults and meaningful inputs remain bound", () => {
  const runtime = { locale: "en-US", timeZone: "UTC" };
  const base = { LANG: "C", LC_ALL: "C", TEAMAGENT_FIXTURE: "one" };
  const key = verificationEnvironmentIdentity(base, runtime);
  assert.match(key, /^[a-f0-9]{64}$/u);
  for (const policy of ["tracked", "local"])
    assert.equal(
      verificationEnvironmentIdentity(
        {
          ...base,
          LANG: "cs_CZ.UTF-8",
          LC_ALL: "cs_CZ.UTF-8",
          [verificationWriteVariable]: policy,
        },
        runtime,
      ),
      key,
    );
  for (const changed of [
    { ...base, TEAMAGENT_FIXTURE: "two" },
    { ...base, TZ: "Europe/Prague" },
    { ...base, PYTHONPATH: "/different" },
  ])
    assert.notEqual(verificationEnvironmentIdentity(changed, runtime), key);
  assert.notEqual(verificationEnvironmentIdentity(base, { ...runtime, locale: "cs-CZ" }), key);
  assert.notEqual(
    verificationEnvironmentIdentity(base, { ...runtime, timeZone: "Europe/Prague" }),
    key,
  );
});

await test("normalized verification subprocesses use the keyed locale and retain timezone sensitivity", async () => {
  const f = await fixture();
  try {
    const script = join(f.root, "probe.ts");
    const moduleUrl = pathToFileURL(
      resolve(import.meta.dir, "../app/check/verification-policy.ts"),
    ).href;
    await writeFile(
      script,
      `import { verificationEnvironmentIdentity } from ${JSON.stringify(moduleUrl)};\nprocess.stdout.write(JSON.stringify({ key: verificationEnvironmentIdentity(process.env), lang: process.env.LANG, all: process.env.LC_ALL, runtime: Intl.DateTimeFormat().resolvedOptions().timeZone }) + "\\n");\n`,
      "utf8",
    );
    const run = (env: NodeJS.ProcessEnv): string => {
      const result = spawnSync(process.execPath, [script], {
        cwd: f.root,
        env: verificationLocaleEnvironment(env),
        encoding: "utf8",
        shell: false,
        windowsHide: true,
        timeout: 15_000,
        maxBuffer: 16384,
      });
      assert.equal(result.error, undefined);
      assert.equal(result.status, 0, result.stderr);
      assert.ok(result.stdout.includes('"lang":"C.UTF-8"'));
      assert.ok(result.stdout.includes('"all":"C.UTF-8"'));
      return result.stdout;
    };
    const base = {
      ...process.env,
      LANG: "C",
      LC_ALL: "C",
      TZ: "UTC",
      [verificationWriteVariable]: "tracked",
    };
    const first = run(base);
    assert.equal(
      run({
        ...base,
        LANG: "cs_CZ.UTF-8",
        LC_ALL: "cs_CZ.UTF-8",
        [verificationWriteVariable]: "local",
      }),
      first,
    );
    assert.notEqual(run({ ...base, TZ: "Europe/Prague" }), first);
  } finally {
    await f.close();
  }
});

await test("workflow verification launches final checks locally and preserves explicit tracked review", async () => {
  const f = await fixture();
  try {
    await mkdir(join(f.root, "app/check"), { recursive: true });
    await writeFile(
      join(f.root, "app/check/index.ts"),
      `await Bun.write("observed.json", JSON.stringify({ phase: process.argv[2], policy: process.env.TEAMAGENT_VERIFICATION_CACHE_WRITE, lang: process.env.LANG, all: process.env.LC_ALL }) + "\\n");\n`,
      "utf8",
    );
    for (const policy of ["tracked", "local"] as const) {
      await verificationHost.run(f.root, "review", { receiptWritePolicy: policy });
      const observed: unknown = JSON.parse(await readFile(join(f.root, "observed.json"), "utf8"));
      assert.deepEqual(observed, { phase: "review", policy, lang: "C.UTF-8", all: "C.UTF-8" });
    }
    await verificationHost.run(f.root, "final");
    const observed: unknown = JSON.parse(await readFile(join(f.root, "observed.json"), "utf8"));
    assert.deepEqual(observed, {
      phase: "review",
      policy: "local",
      lang: "C.UTF-8",
      all: "C.UTF-8",
    });
  } finally {
    await f.close();
  }
});
