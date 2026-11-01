import { mkdtemp } from "./temporary.ts";
import { strict as assert } from "node:assert";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { Effect, Schema } from "effect";
import { readConfig } from "../app/cli/config.ts";
import { startDaemon } from "../app/server/index.ts";
import { WorkspaceSchema } from "@/workspaces";
import { TaskSchema } from "@/tasks";
import { ArtifactsSchema } from "@/harness";

const root = dirname(fileURLToPath(new URL("../package.json", import.meta.url)));
const json = (text: string): unknown =>
  Schema.decodeUnknownSync(Schema.fromJsonString(Schema.Unknown))(text);
async function command(args: readonly string[], cwd = root) {
  const process_ = Bun.spawn([process.execPath, join(root, "app/cli/index.ts"), ...args], {
    windowsHide: true,
    cwd,
    stdin: "ignore",
    stdout: "pipe",
    stderr: "pipe",
    env: { ...process.env, NO_COLOR: "1" },
  });
  const timer = setTimeout(() => process_.kill(), 15000);
  try {
    const [stdout, stderr, status] = await Promise.all([
      new Response(process_.stdout).text(),
      new Response(process_.stderr).text(),
      process_.exited,
    ]);
    return { stdout, stderr, status };
  } finally {
    clearTimeout(timer);
  }
}

await test("CLI help/version avoid config execution; strict flags and catalog stay usable", async () => {
  const directory = await mkdtemp(join(tmpdir(), "teamagent-cli-"));
  try {
    const config = join(directory, "bad.config.ts");
    await writeFile(config, 'throw new Error("MUST_NOT_EXECUTE")');
    for (const flag of ["--help", "-h", "--version", "-V"]) {
      const result = await command(["--config", config, flag], directory);
      assert.equal(result.status, 0, result.stderr);
      assert.ok(result.stdout.includes("0.1.0"));
      assert.equal(result.stderr, "");
    }
    for (const args of [
      ["--bogus"],
      ["harness", "missing"],
      ["harness", "modules", "--write"],
      ["tasks", "add"],
      ["harness", "modules", "--", "unhandled"],
      ["harness", "modules", "--no-write"],
    ]) {
      assert.notEqual((await command(args)).status, 0);
    }
    const modules = await command(["harness", "modules"]);
    const models = await command(["agents", "models"]);
    assert.equal(models.status, 0, models.stderr);
    assert.ok(
      Schema.decodeUnknownSync(Schema.Array(Schema.Unknown))(json(models.stdout)).length > 0,
    );
    assert.equal(modules.status, 0, modules.stderr);
    const catalog = Schema.decodeUnknownSync(
      Schema.Array(
        Schema.Struct({
          name: Schema.String,
          api: Schema.String,
          commands: Schema.Array(
            Schema.Struct({ name: Schema.String, description: Schema.String }),
          ),
        }),
      ),
    )(json(modules.stdout));
    assert.deepEqual(
      catalog.map((module) => module.name),
      [
        "harness",
        "workspaces",
        "tasks",
        "agents",
        "artifacts",
        "memory",
        "integrations",
        "media",
        "channels",
        "lint",
      ],
    );
    for (const module of catalog) {
      assert.equal(module.api, `@/${module.name}`);
      assert.ok(module.commands.length);
    }
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

await test("explicit C12 configuration validates precedence without ambient environment or layers", async () => {
  const directory = await mkdtemp(join(tmpdir(), "teamagent-config-"));
  const selected = join(directory, "selected");
  await mkdir(selected);
  try {
    await writeFile(
      join(directory, "teamagent.config.ts"),
      'throw new Error("ambient config must not run")',
    );
    await writeFile(join(directory, ".env"), "TEAMAGENT_UNEXPECTED=loaded");
    const basic = await Effect.runPromise(readConfig({ cwd: directory }));
    assert.equal(basic.port, 4318);
    assert.equal(process.env.TEAMAGENT_UNEXPECTED, undefined);
    const path = join(selected, "config.ts");
    await writeFile(
      path,
      'export default {port: 4444, data:"./state", pi:{provider:"openai",model:"explicit-model"}}',
    );
    const config = await Effect.runPromise(readConfig({ cwd: directory, config: path }));
    assert.equal(config.port, 4444);
    assert.equal(config.data, join(selected, "state"));
    const override = await Effect.runPromise(
      readConfig({ cwd: directory, config: path, data: "override", port: 5555 }),
    );
    assert.equal(override.data, join(directory, "override"));
    assert.equal(override.port, 5555);
    await assert.rejects(Effect.runPromise(readConfig({ cwd: directory, config: "missing.ts" })));
    for (const [index, source] of [
      "export default {port:null}",
      "export default {pi:[]}",
      'export default {extends:["https://example.invalid/config"]}',
      "export default {$production:{port:22}}",
      "export default {port:65536}",
    ].entries()) {
      const invalid = join(selected, `invalid-${index}.ts`);
      await writeFile(invalid, source);
      await assert.rejects(Effect.runPromise(readConfig({ config: invalid })));
    }
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

await test("CLI drives the real daemon through every user data module and verifies exports", async () => {
  const directory = await mkdtemp(join(tmpdir(), "teamagent-cli-live-"));
  const workspacePath = join(directory, "workspace");
  await mkdir(workspacePath);
  await writeFile(join(workspacePath, "README.md"), "A real fixture");
  const data = join(directory, "state");
  const daemon = await startDaemon({ config: { port: 0, data } });
  const options = ["--data", data, "--url", daemon.url];
  const run = async (args: readonly string[]) => {
    const result = await command([...args, ...options]);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stderr, "");
    return json(result.stdout);
  };
  try {
    await run(["harness", "status"]);
    const token = await command(["harness", "token", "--data", data]);
    assert.equal(token.stdout.trim(), daemon.token);
    await run(["agents", "list"]);
    const workspace = Schema.decodeUnknownSync(WorkspaceSchema)(
      await run(["workspaces", "add", workspacePath, "--name", "old", "--name", "Fixture"]),
    );
    assert.equal(workspace.name, "Fixture");
    await run(["workspaces", "list"]);
    await run(["workspaces", "show", workspace.id]);
    const task = Schema.decodeUnknownSync(TaskSchema)(
      await run([
        "tasks",
        "add",
        "Inventory",
        "--workspace",
        workspace.id,
        "--write=false",
        "--key",
        "same-request",
      ]),
    );
    assert.equal(task.allowWrites, false);
    const repeated = Schema.decodeUnknownSync(TaskSchema)(
      await run([
        "tasks",
        "add",
        "Inventory",
        "--workspace",
        workspace.id,
        "--write=false",
        "--key",
        "same-request",
      ]),
    );
    assert.equal(repeated.id, task.id);
    for (let attempt = 0; attempt < 100; attempt++) {
      const current = await Effect.runPromise(daemon.store.getTask(task.id));
      if (current.status === "succeeded") break;
      if (current.status === "failed") assert.fail("Inspection failed");
      await new Promise<void>((resolve) => setTimeout(resolve, 20));
    }
    await run(["tasks", "list"]);
    await run(["tasks", "show", task.id]);
    const artifacts = Schema.decodeUnknownSync(ArtifactsSchema)(
      await run(["artifacts", "list", task.id]),
    );
    const artifact = artifacts[0];
    assert.ok(artifact);
    await run(["artifacts", "show", artifact.id]);
    const output = join(directory, "export.json");
    await run(["artifacts", "export", artifact.id, "--output", output]);
    assert.ok((await readFile(output, "utf8")).includes("README.md"));
    assert.notEqual(
      (await command(["artifacts", "export", artifact.id, "--output", output, ...options])).status,
      0,
    );
    const queued = await Effect.runPromise(
      daemon.store.createTask({
        workspaceId: workspace.id,
        objective: "cancel",
        adapterId: "inspect",
      }),
    );
    // Claim keeps the task active long enough to exercise the user cancellation command deterministically.
    if (queued.status === "queued")
      await Effect.runPromise(daemon.store.claimTask(queued.id, "fixture-owner", 15000));
    await run(["tasks", "cancel", queued.id]);
  } finally {
    await daemon.close();
    await rm(directory, { recursive: true, force: true });
  }
});
