import assert from "node:assert/strict";
import { access, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { Schema } from "effect";
import { runProcess } from "../app/workflow/process.ts";
import { mkdtemp } from "./temporary.ts";
import manifest from "../package.json" with { type: "json" };

const root = fileURLToPath(new URL("../", import.meta.url));
const entry = join(root, "node_modules/skills/bin/cli.mjs");
const names = [
  "task-worktrees",
  "rebase-integration",
  "verification-evidence",
  "project-toolchain",
  "resource-lifecycle",
  "conversation-records",
  "typed-modules",
  "skills-distribution",
];
const Lock = Schema.Struct({
  version: Schema.Literal(1),
  skills: Schema.Record(Schema.String, Schema.Unknown),
});

await test("pinned Skills runs under Bun and copies selected sources without global state", async () => {
  await assert.rejects(access(join(root, "skills/dependency-patches/SKILL.md")), {
    code: "ENOENT",
  });
  const target = await mkdtemp("skills-distribution-");
  const state = join(target, "state");
  const installed = join(target, ".agents/skills");
  await mkdir(join(installed, "foreign"), { recursive: true });
  const foreign =
    "---\nname: foreign\ndescription: Existing fixture skill.\n---\nPreserve local content.\n";
  await writeFile(join(installed, "foreign/SKILL.md"), foreign, "utf8");
  const run = async (args: readonly string[]) => {
    const result = await runProcess(target, process.execPath, [entry, ...args], {
      timeoutMs: 60_000,
      maximumBytes: 1024 * 1024,
      env: {
        ...process.env,
        XDG_STATE_HOME: state,
        DISABLE_TELEMETRY: "1",
        NODE_DISABLE_COMPILE_CACHE: "1",
      },
    });
    assert.equal(result.outcome, "exited");
    assert.equal(result.termination, "closed");
    assert.equal(result.code, 0, result.stderr);
    return result.stdout;
  };
  assert.equal((await run(["--version"])).trim(), manifest.devDependencies.skills);
  const add = (selected: readonly string[]) =>
    run([
      "add",
      join(root, "skills"),
      "--skill",
      ...selected,
      "--agent",
      "codex",
      "--copy",
      "--yes",
      "--json",
    ]);
  await add(names);
  assert.deepEqual((await readdir(installed)).sort(), [...names, "foreign"].sort());
  for (const name of names) {
    const actual = await readFile(join(installed, name, "SKILL.md"));
    assert.deepEqual(actual, await readFile(join(root, "skills", name, "SKILL.md")));
    assert.equal(actual.includes(13), false);
  }
  const readLock = async () =>
    Schema.decodeUnknownSync(Schema.fromJsonString(Lock))(
      await readFile(join(target, "skills-lock.json"), "utf8"),
    );
  const before = await readLock();
  assert.deepEqual(Object.keys(before.skills).sort(), [...names].sort());
  await add(["task-worktrees"]);
  assert.deepEqual((await readLock()).skills, before.skills);
  assert.equal(await readFile(join(installed, "foreign/SKILL.md"), "utf8"), foreign);
  await assert.rejects(access(join(state, "skills/.skill-lock.json")), { code: "ENOENT" });
});
