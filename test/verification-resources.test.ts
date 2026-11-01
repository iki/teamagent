import assert from "node:assert/strict";
import { access, readFile, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { test } from "node:test";
import { runProcess } from "../app/workflow/process.ts";
import { verificationEnvironmentIdentity } from "../app/check/verification-policy.ts";
import { verificationPrerequisites } from "../app/check/verification-cache.ts";
import { mkdtemp, assertTemporaryFixture } from "./temporary.ts";

await test("commands scope temporary paths and remove scratch only after closed execution", async () => {
  const cwd = await mkdtemp("command-resource-");
  try {
    const script = join(cwd, "observe.ts");
    await writeFile(
      script,
      'await Bun.write("scratch.txt", process.env.TEMP + "\\n"); await Bun.write(process.env.TEMP + "/owned.txt", "owned\\n"); process.exitCode = Number(process.argv[2]);\n',
      "utf8",
    );
    for (const code of [0, 7]) {
      const result = await runProcess(cwd, process.execPath, [script, String(code)]);
      assert.equal(result.code, code);
      assert.equal(result.outcome, "exited");
      assert.equal(result.termination, "closed");
      const scratch = (await readFile(join(cwd, "scratch.txt"), "utf8")).trim();
      assert.notEqual(scratch, cwd);
      await assert.rejects(access(scratch), { code: "ENOENT" });
      await access(cwd);
    }
    const cancelled = new AbortController();
    cancelled.abort();
    const result = await runProcess(cwd, process.execPath, [script, "0"], {
      signal: cancelled.signal,
    });
    assert.equal(result.outcome, "cancelled");
  } finally {
    await assertTemporaryFixture(cwd);
    await rm(cwd, { recursive: true });
  }
});

await test("scratch routing does not change keys but malformed routing fails before prerequisite reuse", async () => {
  const runtime = { locale: "en-US", timeZone: "UTC" };
  const base = { TEAMAGENT_MEANINGFUL: "one" };
  const key = verificationEnvironmentIdentity(base, runtime);
  assert.equal(
    verificationEnvironmentIdentity(
      {
        ...base,
        TEAMAGENT_TEMPORARY_ROOT: "/owned",
        TEAMAGENT_TEMPORARY_PARENT: "/owned/.tmp/lease",
        TEAMAGENT_TEMPORARY_PARENT_ID: "changed-per-child",
      },
      runtime,
    ),
    key,
  );
  assert.notEqual(
    verificationEnvironmentIdentity({ ...base, TEAMAGENT_MEANINGFUL: "two" }, runtime),
    key,
  );
  const name = "TEAMAGENT_TEMPORARY_PARENT_ID";
  const old = process.env[name];
  try {
    process.env[name] = "malformed";
    // The malformed routing field must fail before package hashing or cache reuse.
    await assert.rejects(
      verificationPrerequisites(resolve(import.meta.dir, "..")),
      /TEAMAGENT_TEMPORARY_(?:ROOT|PARENT|PARENT_ID)/u,
    );
  } finally {
    if (old === undefined) Reflect.deleteProperty(process.env, name);
    else process.env[name] = old;
  }
});
