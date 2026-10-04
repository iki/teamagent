import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { Effect } from "effect";
import { inspectModuleLayout, validateModuleGraph } from "@/lint";

function removeFixture(directory: string): void {
  const target = resolve(directory);
  const contained = relative(resolve(tmpdir()), target);
  if (
    isAbsolute(contained) ||
    contained.startsWith("..") ||
    !contained.startsWith("teamagent-module-")
  )
    throw new Error("Refusing to remove an unexpected module fixture path.");
  rmSync(target, { recursive: true, force: true });
}

await test("module graph rejects cycles, undeclared targets, duplicates, and host dependencies", () => {
  assert.deepEqual(
    validateModuleGraph([
      { name: "tasks", dependencies: ["agents"], portable: true },
      { name: "agents", dependencies: [], portable: true },
    ]),
    [],
  );
  const issues = validateModuleGraph([
    { name: "tasks", dependencies: ["agents", "missing", "agents", "host"], portable: true },
    { name: "agents", dependencies: ["tasks"], portable: true },
    { name: "agents", dependencies: [], portable: true },
    { name: "host", dependencies: [], portable: false },
  ]);
  for (const expected of [
    "cycle",
    "unknown module missing",
    "repeats dependency agents",
    "Duplicate module",
    "depends on host",
  ])
    assert.ok(
      issues.some((issue) => issue.includes(expected)),
      expected,
    );
});

await test("module inventory detects absent API/CLI files and unregistered directories", async () => {
  const root = mkdtempSync(join(tmpdir(), "teamagent-module-layout-"));
  const definition = [{ name: "tasks", dependencies: [], portable: true }];
  mkdirSync(join(root, "lib", "tasks"), { recursive: true });
  try {
    const missing = await Effect.runPromise(inspectModuleLayout(root, definition));
    assert.equal(missing.length, 2);
    assert.ok(missing.some((issue) => issue.includes("cli.ts")));
    writeFileSync(join(root, "lib", "tasks", "index.ts"), "export const api = 1;");
    writeFileSync(join(root, "lib", "tasks", "cli.ts"), "export const cli = {};");
    assert.deepEqual(await Effect.runPromise(inspectModuleLayout(root, definition)), []);
    mkdirSync(join(root, "lib", "unregistered"));
    assert.ok(
      (await Effect.runPromise(inspectModuleLayout(root, definition))).some((issue) =>
        issue.includes("Register module lib/unregistered"),
      ),
    );
    rmSync(join(root, "lib", "tasks", "index.ts"));
    mkdirSync(join(root, "lib", "tasks", "index.ts"));
    assert.ok(
      (await Effect.runPromise(inspectModuleLayout(root, definition))).some((issue) =>
        issue.includes("regular source file"),
      ),
    );
  } finally {
    removeFixture(root);
  }
});

await test("parsed module contracts require useful API exports and literal CLI metadata", () => {
  const repository = fileURLToPath(new URL("../", import.meta.url));
  const fixture = mkdtempSync(join(tmpdir(), "teamagent-module-contract-"));
  const files = ["lib/tasks/index.ts", "lib/tasks/cli.ts"];
  for (const file of files) mkdirSync(dirname(join(fixture, file)), { recursive: true });
  const run = () =>
    spawnSync(
      process.execPath,
      [
        join(repository, "node_modules", "oxlint", "bin", "oxlint"),
        "--config",
        join(repository, "oxlint.config.ts"),
        "--deny-warnings",
        ...files.map((file) => join(fixture, file)),
      ],
      { cwd: repository, encoding: "utf8", windowsHide: true, timeout: 60_000 },
    );
  const descriptor =
    'export const cli = { name: "tasks", description: "Manage tasks", commands: [{ name: "list", description: "List tasks" }] } as const;';
  try {
    writeFileSync(
      join(fixture, files[0] ?? ""),
      'export { cli } from "./cli.ts"; export { Task } from "./model.ts";',
    );
    writeFileSync(join(fixture, files[1] ?? ""), descriptor);
    const accepted = run();
    assert.ifError(accepted.error);
    assert.equal(accepted.status, 0, accepted.stdout + accepted.stderr);
    for (const [index, cli] of [
      ['export const Task = "task";', descriptor],
      ['export { cli } from "./cli.ts";', descriptor],
      ['export type { cli } from "./cli.ts"; export const Task = "task";', descriptor],
      [
        'export { cli } from "./cli.ts"; export const Task = "task";',
        descriptor.replace('"tasks"', '"workspaces"'),
      ],
      [
        'export { cli } from "./cli.ts"; export const Task = "task";',
        descriptor.replace(" } as const;", ", run: (() => 1)() } as const;"),
      ],
      [
        'export { cli } from "./cli.ts"; export const Task = "task";',
        descriptor + "\nexport const sideEffect = 1;",
      ],
      [
        'export { cli } from "./cli.ts"; export const Task = "task";',
        descriptor.replace('name: "list"', 'name: "Bad Name"'),
      ],
      [
        'export { cli } from "./cli.ts"; export const Task = "task";',
        descriptor.replace("commands: [", 'commands: [{name: "list", description: "Duplicate"}, '),
      ],
    ]) {
      assert.ok(index !== undefined && cli !== undefined);
      writeFileSync(join(fixture, files[0] ?? ""), index);
      writeFileSync(join(fixture, files[1] ?? ""), cli);
      const rejected = run();
      assert.ifError(rejected.error);
      assert.equal(rejected.status, 1, rejected.stdout + rejected.stderr);
      assert.ok(
        (rejected.stdout + rejected.stderr).includes("module-contract"),
        rejected.stdout + rejected.stderr,
      );
    }
  } finally {
    removeFixture(fixture);
  }
});

await test("parsed module dependencies and rendering boundaries accept interfaces and reject implementation coupling", () => {
  const repository = fileURLToPath(new URL("../", import.meta.url));
  const fixture = mkdtempSync(join(tmpdir(), "teamagent-module-imports-"));
  const fixtures = [
    {
      path: "lib/tasks/model.ts",
      valid: 'export { Agent } from "@/agents";',
      invalid: 'export { Api } from "@/harness";',
      rule: "module-dependencies",
    },
    {
      path: "lib/agents/model.ts",
      valid: 'export const id = "agent";',
      invalid: 'export { Task } from "@/tasks";',
      rule: "module-dependencies",
    },
    {
      path: "app/web/client.ts",
      valid: 'export { Task } from "@/tasks";',
      invalid: 'export { Store } from "../storage/store.ts";',
      rule: "module-dependencies",
    },
    {
      path: "app/desktop/client.ts",
      valid: 'export { Task } from "@/tasks";',
      invalid: 'export { service } from "../server/index.ts";',
      rule: "module-dependencies",
    },
    {
      path: "app/storage/store.ts",
      valid: 'export { Task } from "@/tasks";',
      invalid: 'export { View } from "../web/view.tsx";',
      rule: "module-dependencies",
    },
    {
      path: "app/web/private.ts",
      valid: 'export { Task } from "@/tasks";',
      invalid: 'export { Task } from "../../lib/tasks/private.ts";',
      rule: "boundaries",
    },
    {
      path: "app/web/view.tsx",
      valid: "export const View = ({text}: {text: string}) => <pre>{text}</pre>;",
      invalid:
        "export const View = ({text}: {text: string}) => <div dangerouslySetInnerHTML={{__html: text}} />;",
      rule: "safe-rendering",
    },
    {
      path: "app/web/markup.ts",
      valid: 'export const title = "Plain text";',
      invalid:
        "export function render(element: {innerHTML: string}, text: string) { element.innerHTML = text; }",
      rule: "safe-rendering",
    },
    {
      path: "lib/tasks/host.ts",
      valid: 'export const title = "Portable";',
      invalid: 'export { useState } from "react";',
      rule: "boundaries",
    },
    {
      path: "app/web/state.ts",
      valid:
        'export const state = { token: "" }; export function scoped(localStorage: {getItem(name: string): string}) { return localStorage.getItem("data"); }',
      invalid: 'export const saved = window.localStorage.getItem("token");',
      rule: "client-state",
    },
    {
      path: "app/adapters/process.ts",
      valid: "export function scoped(Bun: { spawn(): string }) { return Bun.spawn(); }",
      invalid:
        'import { spawn } from "node:child_process"; export const process = spawn("git", []);',
      rule: "adapter-authority",
    },
    {
      path: "app/adapters/shell.ts",
      valid: 'export const provider = "model transport";',
      invalid: 'export const process = Bun.spawn(["git", "status"]);',
      rule: "adapter-authority",
    },
  ];
  for (const fixtureCase of fixtures) {
    mkdirSync(dirname(join(fixture, fixtureCase.path)), { recursive: true });
    writeFileSync(join(fixture, fixtureCase.path), fixtureCase.valid);
  }
  const run = () =>
    spawnSync(
      process.execPath,
      [
        join(repository, "node_modules", "oxlint", "bin", "oxlint"),
        "--config",
        join(repository, "oxlint.config.ts"),
        "--deny-warnings",
        fixture,
      ],
      { cwd: repository, encoding: "utf8", windowsHide: true, timeout: 60_000 },
    );
  try {
    const accepted = run();
    assert.ifError(accepted.error);
    assert.equal(accepted.status, 0, accepted.stdout + accepted.stderr);
    for (const fixtureCase of fixtures)
      writeFileSync(join(fixture, fixtureCase.path), fixtureCase.invalid);
    const rejected = run();
    assert.ifError(rejected.error);
    assert.equal(rejected.status, 1, rejected.stdout + rejected.stderr);
    for (const rule of new Set(fixtures.map((fixtureCase) => fixtureCase.rule)))
      assert.ok(
        (rejected.stdout + rejected.stderr).includes(rule),
        rejected.stdout + rejected.stderr,
      );
    assert.equal(
      (rejected.stdout + rejected.stderr).match(/teamagent\(module-dependencies\)/g)?.length,
      5,
    );
    assert.equal(
      (rejected.stdout + rejected.stderr).match(/teamagent\(safe-rendering\)/g)?.length,
      2,
    );
  } finally {
    removeFixture(fixture);
  }
});
