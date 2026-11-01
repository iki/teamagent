import { assertTemporaryFixture, mkdtemp } from "./temporary.ts";
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdir, readFile, writeFile, rm, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { Effect, Schema } from "effect";
import { createDependencyRuntime as createRuntime } from "../app/dependencies/runtime.ts";
import {
  buildDependencyPlan,
  decodeManifest,
  decodeRegistry,
  dependencyCommands,
} from "../app/dependencies/plan.ts";
import {
  digest,
  json,
  runCommand,
  type CommandRequest,
  type CommandResult,
} from "../app/dependencies/io.ts";
import { PlanSchema } from "../app/dependencies/model.ts";

const repository = dirname(fileURLToPath(new URL("../package.json", import.meta.url)));
function createDependencyRuntime(options: Parameters<typeof createRuntime>[0]) {
  return createRuntime({ ...options, resolveAube: (root) => resolve(root, "fixture-aube.exe") });
}
const bytes = (value: string): Uint8Array => new TextEncoder().encode(value);
const result = (stdout = "", status = 0, stderr = ""): CommandResult => ({
  status,
  stdout: bytes(stdout),
  stderr: bytes(stderr),
  uncertain: false,
});
const registryBytes = await readFile(join(repository, "patches/trigon/registry.json"));
const registry = await Effect.runPromise(decodeRegistry(json(registryBytes)));
const projectManifest = await Effect.runPromise(
  decodeManifest(json(await readFile(join(repository, "package.json")))),
);
const manifest = {
  name: "dependency-fixture",
  version: "0.1.0",
  packageManager: "aube@2.5.1",
  scripts: { unchanged: "retained" },
  dependencies: { effect: "4.0.0-rc.118" },
  devDependencies: { "@tauri-apps/cli": "2.12.1" },
  // Mirror active supplied package patches without inventing direct fixture dependencies.
  aube: { patchedDependencies: projectManifest.aube?.patchedDependencies ?? {} },
};
const report = {
  effect: {
    current: "4.0.0-rc.118",
    wanted: "4.0.0-rc.118",
    latest: "4.0.6",
    dependencyType: "dependencies",
  },
};
const baseline = {
  manifest: "a".repeat(64),
  lock: "b".repeat(64),
  trust: "c".repeat(64),
  registry: "d".repeat(64),
  cargo: "e".repeat(64),
};

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), "teamagent-deps-"));
  const write = async (path: string, value: string | Uint8Array) => {
    await mkdir(dirname(join(root, path)), { recursive: true });
    await writeFile(join(root, path), value);
  };
  await write("package.json", JSON.stringify(manifest) + "\n");
  await write("aube-lock.yaml", "lockfileVersion: 9\n");
  await write("aube-workspace.yaml", "allowBuilds:\n  protobufjs: false\n");
  await write("app/desktop/src-tauri/Cargo.lock", "# Retained native lock\n");
  await write("patches/trigon/registry.json", registryBytes);
  await write(
    registry.license.artifactPath,
    await readFile(join(repository, registry.license.artifactPath)),
  );
  for (const fix of registry.fixes)
    for (const file of fix.files)
      await write(file.artifactPath, await readFile(join(repository, file.artifactPath)));
  await write(".cache/dependencies/report.json", JSON.stringify(report) + "\n");
  return {
    root,
    write,
    close: async () => {
      await assertTemporaryFixture(root);
      assert.ok(basename(root).startsWith("teamagent-deps-"));
      await rm(root, { recursive: true, force: true });
    },
  };
}

await test("dependency plans validate exact pins, preserve groups and block absent Trigon compatibility", async () => {
  const plan = await Effect.runPromise(
    buildDependencyPlan({ manifest, registry, report, status: 1, baseline }),
  );
  assert.deepEqual(dependencyCommands(plan), [["add", "--save-exact", "effect@4.0.6"]]);
  assert.equal(plan.automaticRepair, false);
  const blocked = await Effect.runPromise(
    buildDependencyPlan({
      manifest,
      registry,
      report: {
        "@tauri-apps/cli": {
          current: "2.12.1",
          wanted: "2.12.1",
          latest: "2.13.0",
          dependencyType: "devDependencies",
        },
      },
      status: 1,
      baseline,
    }),
  );
  assert.equal(blocked.blocked[0]?.action, "ask-user-for-trigon-fix");
  assert.deepEqual(dependencyCommands(blocked), []);
  const compatible = await Effect.runPromise(
    buildDependencyPlan({
      manifest,
      registry,
      report: {
        "@tauri-apps/cli": {
          current: "2.12.1",
          wanted: "2.12.1",
          latest: "2.12.4",
          dependencyType: "devDependencies",
        },
      },
      status: 1,
      baseline,
    }),
  );
  assert.deepEqual(dependencyCommands(compatible), [
    ["add", "--save-exact", "--save-dev", "@tauri-apps/cli@2.12.4"],
  ]);
  for (const input of [
    { report: {}, status: 1 },
    { report, status: 2 },
    { report: { effect: { ...report.effect, current: "4.0.5" } }, status: 1 },
    { report: { effect: { ...report.effect, latest: "$(unexpected)" } }, status: 1 },
    { report: { effect: { ...report.effect, unexpected: true } }, status: 1 },
  ])
    await assert.rejects(
      Effect.runPromise(buildDependencyPlan({ manifest, registry, baseline, ...input })),
    );
  await assert.rejects(
    Effect.runPromise(
      buildDependencyPlan({
        manifest: {
          ...manifest,
          aube: {
            patchedDependencies: {
              ...manifest.aube.patchedDependencies,
              "effect@4.0.0-rc.118": "patches/unprovided.patch",
            },
          },
        },
        registry,
        report,
        status: 1,
        baseline,
      }),
    ),
    /ASK/,
  );
});

await test("transitive package patches require their own active exact supplied selector", async () => {
  const path = "patches/trigon/fixture-transitive.patch";
  const fix = {
    id: "fixture-transitive",
    kind: "package-patch",
    packages: [{ name: "fixture-transitive", versions: ["2.2.0"] }],
    files: [
      {
        sourcePath: "patches/fixture-transitive.patch",
        artifactPath: path,
        sha256: "a".repeat(64),
      },
    ],
    evidence: "Fixture supplied source; this policy test does not establish installed patch bytes.",
  };
  const selectedRegistry = { ...registry, fixes: [fix] };
  const selectedManifest = {
    ...manifest,
    aube: { patchedDependencies: { "fixture-transitive@2.2.0": path } },
  };
  const plan = (candidateManifest: unknown, candidateRegistry: unknown = selectedRegistry) =>
    Effect.runPromise(
      buildDependencyPlan({
        manifest: candidateManifest,
        registry: candidateRegistry,
        report: {},
        status: 0,
        baseline,
      }),
    );
  assert.equal(Object.hasOwn(selectedManifest.dependencies, "fixture-transitive"), false);
  assert.equal(Object.hasOwn(selectedManifest.devDependencies, "fixture-transitive"), false);
  assert.deepEqual((await plan(selectedManifest)).upgrades, []);
  for (const patchedDependencies of [
    {},
    { "fixture-transitive@2.3.0": path },
    { "fixture-transitive@2.2.0": "patches/trigon/wrong-artifact.patch" },
    { "fixture-transitive@2.2.0": path, "unknown-patch@1.0.0": path },
  ])
    await assert.rejects(plan({ ...selectedManifest, aube: { patchedDependencies } }), /ASK/);
  await assert.rejects(
    plan(selectedManifest, { ...selectedRegistry, fixes: [{ ...fix, kind: "host-adapter" }] }),
    /ASK/,
  );
  await assert.rejects(
    plan({
      ...selectedManifest,
      devDependencies: { ...selectedManifest.devDependencies, "fixture-transitive": "2.3.0" },
    }),
    /ASK/,
  );
  const otherPath = "patches/trigon/other-transitive.patch";
  await assert.rejects(
    plan(
      {
        ...selectedManifest,
        aube: {
          patchedDependencies: {
            "fixture-transitive@2.2.0": otherPath,
            "other-transitive@1.0.0": otherPath,
          },
        },
      },
      {
        ...selectedRegistry,
        fixes: [
          fix,
          {
            ...fix,
            id: "other-transitive",
            packages: [{ name: "other-transitive", versions: ["1.0.0"] }],
            files: [
              {
                sourcePath: "patches/other.patch",
                artifactPath: otherPath,
                sha256: "b".repeat(64),
              },
            ],
          },
        ],
      },
    ),
    /ASK/,
  );
});

await test("offline checks/plans need no sibling checkout or subprocess and reject modified mirrors", async () => {
  const setup = await fixture();
  let calls = 0;
  const runtime = createRuntime({
    root: setup.root,
    resolveAube: () => {
      throw new Error("Offline checks must not resolve Aube");
    },
    command: async () => {
      calls++;
      throw new Error("Must remain passive");
    },
  });
  try {
    const check = await Effect.runPromise(runtime.check());
    assert.equal(check.network, false);
    const plan = await Effect.runPromise(
      runtime.plan(".cache/dependencies/report.json", ".cache/dependencies/plan.json"),
    );
    assert.equal(plan.upgrades.length, 1);
    assert.equal(calls, 0);
    await assert.rejects(
      Effect.runPromise(runtime.plan(undefined, ".cache/dependencies/plan.json")),
      /exists/,
    );
    const file = registry.fixes[0]?.files[0];
    assert.ok(file);
    await setup.write(file.artifactPath, "unapproved source change\n");
    await assert.rejects(Effect.runPromise(runtime.check()), /ASK/);
    await rm(join(setup.root, file.artifactPath));
    await assert.rejects(Effect.runPromise(runtime.check()), /ASK/);
    assert.equal(calls, 0);
  } finally {
    await setup.close();
  }
});

await test("discovery checks output before remote work and records only validated Aube results", async () => {
  const setup = await fixture();
  const calls: CommandRequest[] = [];
  const runtime = createDependencyRuntime({
    root: setup.root,
    command: async (request) => {
      calls.push(request);
      return request.arguments[0] === "--version"
        ? result("aube 2.5.1\n")
        : result(JSON.stringify(report), 1, "Authorization: PRIVATE_FIXTURE_TOKEN\n");
    },
  });
  try {
    await setup.write(".cache/dependencies/existing.json", "preserved\n");
    await assert.rejects(
      Effect.runPromise(runtime.discover(".cache/dependencies/existing.json")),
      /exists/,
    );
    await assert.rejects(Effect.runPromise(runtime.discover("outside-cache.json")), /cache/);
    assert.equal(calls.length, 0);
    const found = await Effect.runPromise(runtime.discover(".cache/dependencies/found.json"));
    assert.equal(found.upgrades, 1);
    assert.equal(calls.length, 2);
    assert.ok(
      calls.every(
        (call) =>
          call.executable === "aube" &&
          call.physicalExecutable === resolve(setup.root, "fixture-aube.exe"),
      ),
    );
    assert.ok(calls[1]?.arguments.includes("--fetch-retries"));
    assert.equal(JSON.stringify(found).includes("PRIVATE_FIXTURE_TOKEN"), false);
    Schema.decodeUnknownSync(PlanSchema)(json(await readFile(join(setup.root, found.plan))));
    const relativeRuntime = createRuntime({
      root: setup.root,
      resolveAube: () => "aube",
      command: async () => {
        throw new Error("Relative executable must never launch");
      },
    });
    await assert.rejects(
      Effect.runPromise(relativeRuntime.discover(".cache/dependencies/relative.json")),
      /absolute physical/,
    );
  } finally {
    await setup.close();
  }
});

await test("stale, edited and blocked dependency plans cannot invoke Aube", async () => {
  const setup = await fixture();
  let calls = 0;
  const runtime = createDependencyRuntime({
    root: setup.root,
    command: async () => {
      calls++;
      return result();
    },
  });
  try {
    const plan = await Effect.runPromise(
      runtime.plan(".cache/dependencies/report.json", ".cache/dependencies/plan.json"),
    );
    await setup.write(
      ".cache/dependencies/edited.json",
      JSON.stringify({ ...plan, upgrades: [] }) + "\n",
    );
    await assert.rejects(
      Effect.runPromise(runtime.apply(".cache/dependencies/edited.json")),
      /edited/,
    );
    await setup.write("aube-workspace.yaml", "allowBuilds:\n  protobufjs: true\n");
    await assert.rejects(
      Effect.runPromise(runtime.apply(".cache/dependencies/plan.json")),
      /changed/,
    );
    assert.equal(calls, 0);
  } finally {
    await setup.close();
  }
});

await test("explicit apply verifies exact changes and completes without trust or Cargo mutation", async () => {
  const setup = await fixture();
  const observed: string[][] = [];
  const runtime = createDependencyRuntime({
    root: setup.root,
    command: async (request) => {
      observed.push([...request.arguments]);
      if (request.arguments[0] === "--version") return result("aube 2.5.1\n");
      if (request.arguments[0] === "add") {
        await setup.write(
          "package.json",
          JSON.stringify({ ...manifest, dependencies: { effect: "4.0.6" } }) + "\n",
        );
        await setup.write("aube-lock.yaml", "lockfileVersion: 9\n# changed fixture\n");
        return result("PRIVATE_FIXTURE_INPUT", 0, "PRIVATE_FIXTURE_AUTHORIZATION");
      }
      assert.deepEqual(request.arguments, ["run", "--no-install", "review:check"]);
      return result();
    },
  });
  try {
    await Effect.runPromise(
      runtime.plan(".cache/dependencies/report.json", ".cache/dependencies/plan.json"),
    );
    const applied = await Effect.runPromise(runtime.apply(".cache/dependencies/plan.json"));
    assert.equal(applied.status, "complete");
    assert.equal(observed.length, 3);
    await assert.rejects(readFile(join(setup.root, ".cache/dependencies/active.json")));
    const directory = dirname(join(setup.root, applied.receipt));
    for (const name of await readdir(directory)) {
      const text = await readFile(join(directory, name), "utf8");
      assert.equal(text.includes("PRIVATE_FIXTURE"), false);
      assert.equal(text.includes("\r"), false);
    }
    assert.equal(
      await readFile(join(setup.root, "aube-workspace.yaml"), "utf8"),
      "allowBuilds:\n  protobufjs: false\n",
    );
    assert.equal(
      await readFile(join(setup.root, "app/desktop/src-tauri/Cargo.lock"), "utf8"),
      "# Retained native lock\n",
    );
  } finally {
    await setup.close();
  }
});

await test("uncertain apply retains its intent and lease and never retries or invokes repair", async () => {
  const setup = await fixture();
  const calls: CommandRequest[] = [];
  const runtime = createDependencyRuntime({
    root: setup.root,
    command: async (request) => {
      calls.push(request);
      if (request.arguments[0] === "--version") return result("2.5.1\n");
      return { status: null, stdout: bytes(""), stderr: bytes("PRIVATE_SECRET"), uncertain: true };
    },
  });
  try {
    await Effect.runPromise(
      runtime.plan(".cache/dependencies/report.json", ".cache/dependencies/plan.json"),
    );
    await assert.rejects(
      Effect.runPromise(runtime.apply(".cache/dependencies/plan.json")),
      /uncertain/,
    );
    const retained = await readFile(join(setup.root, ".cache/dependencies/active.json"), "utf8");
    assert.ok(retained.includes("intent.json"));
    await assert.rejects(
      Effect.runPromise(runtime.apply(".cache/dependencies/plan.json")),
      /lease/,
    );
    assert.equal(calls.length, 2);
    assert.equal(
      calls.some((entry) =>
        entry.arguments.some((arg) => /allow-build|repair|agent|retry/.test(arg)),
      ),
      false,
    );
  } finally {
    await setup.close();
  }
});

await test("dependency policy is rechecked after the preflight executable probe before mutation", async () => {
  const setup = await fixture();
  let calls = 0;
  const runtime = createDependencyRuntime({
    root: setup.root,
    command: async () => {
      calls++;
      await setup.write("aube-workspace.yaml", "allowBuilds:\n  protobufjs: true\n");
      return result("2.5.1\n");
    },
  });
  try {
    await Effect.runPromise(
      runtime.plan(".cache/dependencies/report.json", ".cache/dependencies/plan.json"),
    );
    await assert.rejects(
      Effect.runPromise(runtime.apply(".cache/dependencies/plan.json")),
      /changed/,
    );
    assert.equal(calls, 1);
    assert.equal(
      await readFile(join(setup.root, "package.json"), "utf8"),
      JSON.stringify(manifest) + "\n",
    );
  } finally {
    await setup.close();
  }
});

await test("source refresh verifies canonical origin and stages original candidate bytes without promotion", async () => {
  const setup = await fixture();
  const blobs = new Map<string, Uint8Array>();
  for (const fix of registry.fixes)
    for (const file of fix.files)
      blobs.set(file.sourcePath, await readFile(join(repository, file.artifactPath)));
  blobs.set(
    registry.license.sourcePath,
    await readFile(join(repository, registry.license.artifactPath)),
  );
  const objectBytes = new Map(
    [...blobs.values()].map((value) => [digest(value).slice(0, 40), value]),
  );
  let mode = "100644";
  const calls: CommandRequest[] = [];
  const runtime = createDependencyRuntime({
    root: setup.root,
    command: async (request) => {
      calls.push(request);
      assert.equal(request.executable, "git");
      assert.equal(request.isolatedGit, true);
      assert.ok(request.arguments.includes("core.fsmonitor=false"));
      if (request.arguments.includes("config")) return result("https://github.com/iki/trigon\n");
      if (request.arguments.includes("-e")) return result();
      const object = request.arguments.at(-1);
      assert.ok(object);
      if (request.arguments.includes("ls-tree")) {
        const value = blobs.get(object);
        assert.ok(value);
        return result(`${mode} blob ${digest(value).slice(0, 40)}\t${object}\0`);
      }
      const data = objectBytes.get(object);
      assert.ok(data);
      return { status: 0, stdout: data, stderr: bytes(""), uncertain: false };
    },
  });
  try {
    const before = digest(await readFile(join(setup.root, "patches/trigon/registry.json")));
    const refreshed = await Effect.runPromise(
      runtime.sourceRefresh(setup.root, "f".repeat(40), ".cache/dependencies/candidates/fixture"),
    );
    assert.equal(refreshed.promoted, false);
    assert.equal(refreshed.approvalRequired, true);
    assert.equal(refreshed.candidate.startsWith(".cache/"), true);
    assert.equal(digest(await readFile(join(setup.root, "patches/trigon/registry.json"))), before);
    const first = registry.fixes[0]?.files[0];
    assert.ok(first);
    assert.equal(
      digest(
        await readFile(
          join(setup.root, ".cache/dependencies/candidates/fixture", first.artifactPath),
        ),
      ),
      first.sha256,
    );
    const previousCalls = calls.length;
    await assert.rejects(
      Effect.runPromise(
        runtime.sourceRefresh(setup.root, "f".repeat(40), ".cache/dependencies/candidates/fixture"),
      ),
      /exists/,
    );
    assert.equal(calls.length, previousCalls);
    mode = "120000";
    await assert.rejects(
      Effect.runPromise(
        runtime.sourceRefresh(setup.root, "f".repeat(40), ".cache/dependencies/candidates/link"),
      ),
      /regular file/,
    );
    await assert.rejects(
      readFile(join(setup.root, ".cache/dependencies/candidates/link/candidate.json")),
    );
    assert.ok(
      (
        await readFile(join(setup.root, ".cache/dependencies/candidates/link/intent.json"), "utf8")
      ).includes("candidate-refresh-started"),
    );
  } finally {
    await setup.close();
  }
});

await test("desktop build help/version do not probe native prerequisites or write output", () => {
  for (const args of [["--help"], ["-h"], ["--version"], ["-V"], ["test", "--cache", "--help"]]) {
    const child = spawnSync(process.execPath, [join(repository, "app/desktop/build.ts"), ...args], {
      cwd: tmpdir(),
      encoding: "utf8",
      timeout: 10000,
      windowsHide: true,
      env: { ...process.env, PATH: "" },
    });
    assert.equal(child.status, 0, child.stderr);
    assert.ok(child.stdout.includes("0.1.0"));
    if (args.includes("--help")) assert.ok(child.stdout.includes("native"));
  }
});

await test("dependency CLI help/version and bare invocation stay passive and flags remain strict", () => {
  for (const args of [
    [],
    ["--help"],
    ["-h"],
    ["--version"],
    ["-V"],
    ["plan", "--report", "does-not-exist.json", "--help"],
  ]) {
    const child = spawnSync(
      process.execPath,
      [join(repository, "app/dependencies/index.ts"), ...args],
      { cwd: tmpdir(), encoding: "utf8", timeout: 10000, windowsHide: true },
    );
    assert.equal(child.status, 0, child.stderr);
    assert.ok(child.stdout.includes("0.1.0"));
  }
  for (const args of [
    ["check", "--report", "bad.json"],
    ["apply"],
    ["discover"],
    ["unknown"],
    ["--unknown"],
    ["check", "--", "unexpected"],
  ]) {
    const child = spawnSync(
      process.execPath,
      [join(repository, "app/dependencies/index.ts"), ...args],
      { encoding: "utf8", timeout: 10000, windowsHide: true },
    );
    assert.notEqual(child.status, 0);
  }
});

await test("dependency subprocess adapter caps output and classifies an aborted process as uncertain", async () => {
  for (const physicalExecutable of [undefined, "aube"]) {
    await assert.rejects(
      runCommand({
        executable: "aube",
        arguments: ["--version"],
        cwd: repository,
        timeoutMs: 1000,
        bytes: 1024,
        signal: new AbortController().signal,
        ...(physicalExecutable === undefined ? {} : { physicalExecutable }),
      }),
      /host-resolved absolute Aube/,
    );
  }
  await assert.rejects(
    runCommand({
      executable: "git",
      physicalExecutable: process.execPath,
      arguments: ["--version"],
      cwd: repository,
      timeoutMs: 1000,
      bytes: 1024,
      signal: new AbortController().signal,
    }),
    /fixed Git operation/,
  );
  const controller = new AbortController();
  controller.abort();
  const outcome = await runCommand({
    executable: "git",
    arguments: ["--version"],
    cwd: repository,
    timeoutMs: 1000,
    bytes: 1024,
    signal: controller.signal,
    isolatedGit: true,
  });
  assert.equal(outcome.uncertain, true);
  assert.equal(outcome.status, null);
  const bounded = await runCommand({
    executable: "git",
    arguments: ["--version"],
    cwd: repository,
    timeoutMs: 1000,
    bytes: 1,
    signal: new AbortController().signal,
    isolatedGit: true,
  });
  assert.equal(bounded.uncertain, true);
});
