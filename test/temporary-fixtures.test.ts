import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { access, mkdir, readFile, realpath, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { Schema } from "effect";
import {
  createTemporaryWorkspace,
  temporaryEnvironmentNames,
  temporaryRootPath,
} from "../app/check/temporary-workspace.ts";
import { excludedName } from "../app/imports/limits.ts";
import { runProcess } from "../app/workflow/process.ts";
import {
  assertTemporaryFixture,
  assertTemporaryFixtureSync,
  mkdtemp,
  mkdtempSync,
} from "./temporary.ts";

const repository = await realpath(fileURLToPath(new URL("../", import.meta.url)));
const preload = fileURLToPath(new URL("./temporary.ts", import.meta.url));
const helper = JSON.stringify(pathToFileURL(preload).href);
const Receipt = Schema.fromJsonString(
  Schema.Struct({ fixture: Schema.String, parent: Schema.String }),
);
function bareEnvironment(): NodeJS.ProcessEnv {
  return Object.fromEntries(
    Object.entries(process.env).filter(
      ([name]) => !temporaryEnvironmentNames.some((field) => field === name.toUpperCase()),
    ),
  );
}

await test("temporary fixture ownership rejects normalized prefixes and unregistered paths", async () => {
  for (const prefix of [".", "..", "nested/.."]) {
    await assert.rejects(mkdtemp(prefix), /Invalid temporary fixture prefix/);
    assert.throws(() => mkdtempSync(prefix), /Invalid temporary fixture prefix/);
  }
  const fixture = await mkdtemp("fixture-boundary-");
  await assertTemporaryFixture(fixture);
  assert.equal(dirname(dirname(fixture)), join(repository, temporaryRootPath));
  assert.equal(
    fixture.split(/[\\/]/u).some(excludedName),
    false,
    "Managed inputs must remain eligible under the real import policy",
  );
  await assert.rejects(assertTemporaryFixture(dirname(fixture)), /owned temporary workspace/);
  await mkdir(join(fixture, "nested"));
  await assert.rejects(
    assertTemporaryFixture(join(fixture, "nested")),
    /owned temporary workspace/,
  );
  const synchronous = mkdtempSync("synchronous-");
  assertTemporaryFixtureSync(synchronous);
});

for (const failure of [false, true]) {
  await test(`bare test worker cleans fixtures once after both ${failure ? "failing" : "successful"} files`, async () => {
    const control = await mkdtemp("multi-file-control-");
    const receipt = join(control, "created.jsonl");
    await writeFile(receipt, "", "utf8");
    const files: string[] = [];
    for (const name of ["first", "second"]) {
      const file = join(control, `${name}.test.ts`);
      await writeFile(
        file,
        `import { test } from "node:test";
import assert from "node:assert/strict";
import { access, appendFile, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { Schema } from "effect";
import { mkdtemp } from ${helper};
await test(${JSON.stringify(name)}, async () => {
  const previous = (await readFile(${JSON.stringify(receipt)}, "utf8")).trim();
  if (previous) await access(Schema.decodeUnknownSync(Schema.fromJsonString(Schema.Struct({ fixture: Schema.String, parent: Schema.String })))(previous).fixture);
  const fixture = await mkdtemp(${JSON.stringify(`${name}-`)});
  await writeFile(join(fixture, "sentinel"), "scratch\\n");
  await appendFile(${JSON.stringify(receipt)}, JSON.stringify({ fixture, parent: dirname(fixture) }) + "\\n");
  ${failure ? 'if (previous) throw new Error("Intentional fixture failure");' : "assert.ok(fixture);"}
});
`,
        "utf8",
      );
      files.push(file);
    }
    const child = spawnSync(process.execPath, ["test", "--preload", preload, ...files], {
      cwd: repository,
      env: bareEnvironment(),
      encoding: "utf8",
      shell: false,
      windowsHide: true,
      timeout: 20_000,
      maxBuffer: 1024 * 1024,
    });
    assert.equal(child.error, undefined);
    assert.equal(child.status, failure ? 1 : 0, child.stdout + child.stderr);
    if (failure) assert.match(child.stderr + child.stdout, /Intentional fixture failure/);
    const created = (await readFile(receipt, "utf8"))
      .trim()
      .split("\n")
      .map((line) => Schema.decodeUnknownSync(Receipt)(line));
    assert.equal(created.length, 2, "Both test files must execute before worker cleanup");
    assert.equal(
      new Set(created.map((item) => item.parent)).size,
      1,
      "Preload must own one worker lease",
    );
    for (const item of created) {
      await assert.rejects(access(item.fixture), { code: "ENOENT" });
      await assert.rejects(access(item.parent), { code: "ENOENT" });
    }
  });
}

await test("managed fixtures borrow the exact parent and preserve sibling resources", async () => {
  const control = await mkdtemp("borrow-control-");
  const receipt = join(control, "created.json");
  const entry = join(control, "borrowed.test.ts");
  const parent = await createTemporaryWorkspace(repository, "fixture-parent");
  try {
    await writeFile(join(parent.path, "sentinel"), "keep\n", "utf8");
    await writeFile(
      entry,
      `import { test } from "node:test";
import { writeFile } from "node:fs/promises";
import { mkdtemp } from ${helper};
await test("borrowed fixture", async () => {
  const fixture = await mkdtemp("borrowed-");
  await writeFile(${JSON.stringify(receipt)}, JSON.stringify({ fixture, parent: process.env.TEAMAGENT_TEMPORARY_PARENT }) + "\\n");
});
`,
      "utf8",
    );
    const child = spawnSync(process.execPath, ["test", "--preload", preload, entry], {
      cwd: control,
      env: parent.environment(),
      encoding: "utf8",
      shell: false,
      windowsHide: true,
      timeout: 20_000,
      maxBuffer: 1024 * 1024,
    });
    assert.equal(child.error, undefined);
    assert.equal(child.status, 0, child.stdout + child.stderr);
    const saved = Schema.decodeUnknownSync(Receipt)(await readFile(receipt, "utf8"));
    assert.equal(saved.parent, parent.path);
    assert.equal(dirname(saved.fixture), parent.path);
    await assert.rejects(access(saved.fixture), { code: "ENOENT" });
    assert.equal(await readFile(join(parent.path, "sentinel"), "utf8"), "keep\n");
    await access(join(parent.path, ".owner.json"));
  } finally {
    await parent.dispose();
  }
});

await test("owned command removes fixtures after an abrupt test worker exit", async () => {
  const control = await mkdtemp("abrupt-control-");
  const receipt = join(control, "created.json");
  const entry = join(control, "abrupt.test.ts");
  await writeFile(
    entry,
    `import { test } from "node:test";
import { writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { mkdtemp } from ${helper};
await test("abrupt fixture", async () => {
  const fixture = await mkdtemp("abrupt-child-");
  await writeFile(${JSON.stringify(receipt)}, JSON.stringify({ fixture, parent: dirname(fixture) }) + "\\n");
  process.exit(42);
});
`,
    "utf8",
  );
  const result = await runProcess(
    repository,
    process.execPath,
    ["test", "--preload", preload, entry],
    {
      env: bareEnvironment(),
      timeoutMs: 20_000,
      maximumBytes: 1024 * 1024,
    },
  );
  assert.equal(result.outcome, "exited");
  assert.equal(result.code, 42, result.stderr);
  assert.equal(result.termination, "closed");
  const saved = Schema.decodeUnknownSync(Receipt)(await readFile(receipt, "utf8"));
  await assert.rejects(access(saved.fixture), { code: "ENOENT" });
  await assert.rejects(access(saved.parent), { code: "ENOENT" });
});
