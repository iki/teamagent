import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { test } from "node:test";
import { gitEnvironment, stageScope, type Git } from "../app/workflow/git.ts";
import { runProcess } from "../app/workflow/process.ts";
import { gitPlatformArguments } from "../app/check/git-platform.ts";
import { mkdtemp } from "./temporary.ts";

await test(
  "scope staging handles a real index beyond the line bound without staging unrelated paths",
  { timeout: 120_000 },
  async () => {
    const root = await mkdtemp("stage-");
    const template = join(root, "template");
    await mkdir(template);
    const nullFile = process.platform === "win32" ? "NUL" : "/dev/null";
    const environment = {
      ...gitEnvironment(),
      GIT_CONFIG_NOSYSTEM: "1",
      GIT_CONFIG_GLOBAL: nullFile,
      GIT_ATTR_NOSYSTEM: "1",
      GIT_TEMPLATE_DIR: template,
    };
    const invoke = (args: readonly string[], input?: string) =>
      runProcess(
        root,
        "git",
        gitPlatformArguments([
          "-c",
          "core.fsmonitor=false",
          "-c",
          "core.autocrlf=false",
          "-c",
          "core.attributesFile=" + nullFile,
          ...args,
        ]),
        { env: environment, ...(input === undefined ? {} : { input }) },
      );
    const observed: string[][] = [];
    const git: Git = async (args, input) => {
      observed.push([...args]);
      const result = await invoke(args, input);
      assert.equal(result.outcome, "exited", result.stderr);
      assert.equal(result.code, 0, result.stderr);
      return result.stdout;
    };
    await git(["init", "--quiet", "--object-format=sha1"]);
    const blob = (await git(["hash-object", "-w", "--stdin"], "original\n")).trim();
    const filler = Array.from(
      { length: 20000 },
      (_, index) => "many/file-" + index.toString().padStart(5, "0") + ".txt",
    );
    const controls = [
      "present.txt",
      "deleted-before.txt",
      "deleted-now.txt",
      "literal[abc].txt",
      "literala.txt",
      "outside.txt",
    ];
    const seed = [...filler, ...controls]
      .map((path) => "100644 " + blob + "\t" + path + "\0")
      .join("");
    assert.ok(Buffer.byteLength(seed) > 1024 * 1024);
    await git(["update-index", "-z", "--index-info"], seed);
    const baseline = (await git(["write-tree"])).trim();
    const originalRead = await invoke(["ls-files", "--stage", "-z"]);
    assert.equal(
      originalRead.outcome,
      "output-limit",
      "The original framing reaches the unchanged line cap",
    );
    assert.equal(originalRead.termination, "closed");
    await git(["update-index", "--force-remove", "--", "deleted-before.txt"]);
    for (const path of ["present.txt", "literal[abc].txt", "literala.txt", "outside.txt"])
      await writeFile(join(root, path), "changed " + path + "\n", "utf8");
    observed.length = 0;
    const scope = ["present.txt", "deleted-before.txt", "deleted-now.txt", "literal[abc].txt"];
    await stageScope(root, git, scope);
    const changed = (await git(["diff", "--cached", "--name-only", "-z", baseline]))
      .split("\0")
      .filter(Boolean);
    assert.deepEqual(changed.sort(), [...scope].sort());
    assert.equal(await git(["show", ":present.txt"]), "changed present.txt\n");
    assert.equal(await git(["show", ":literal[abc].txt"]), "changed literal[abc].txt\n");
    assert.equal(await git(["show", ":literala.txt"]), "original\n");
    assert.equal(await git(["show", ":outside.txt"]), "original\n");
    const memberReads = observed.filter((args) => args.includes("--stage"));
    assert.deepEqual(memberReads, [
      [
        "--literal-pathspecs",
        "ls-files",
        "--stage",
        "-z",
        "--",
        "deleted-before.txt",
        "deleted-now.txt",
      ],
    ]);
    assert.deepEqual(observed[0], ["ls-files", "--format=%(stage)"]);
    // An unmerged path outside the declared scope must still stop all staging.
    await git(
      ["update-index", "-z", "--index-info"],
      "100644 " +
        blob +
        " 1\tconflict-outside.txt\0" +
        "100644 " +
        blob +
        " 2\tconflict-outside.txt\0",
    );
    const before = await readFile(join(root, ".git/index"));
    observed.length = 0;
    await assert.rejects(stageScope(root, git, ["present.txt"]), /unmerged/u);
    assert.deepEqual(observed, [["ls-files", "--format=%(stage)"]]);
    assert.deepEqual(await readFile(join(root, ".git/index")), before);
  },
);

await test("scope staging validates global stage framing and rejects control-character scope before Git", async () => {
  const root = await mkdtemp("stage-framing-");
  await writeFile(join(root, "present.txt"), "present\n", "utf8");
  for (const stages of ["0", "0\r\n", "0\n\n", "2\n", "0\0", "0\n".repeat(100001)]) {
    let reads = 0;
    const git: Git = async (args) => {
      reads++;
      assert.deepEqual(args, ["ls-files", "--format=%(stage)"]);
      return stages;
    };
    await assert.rejects(stageScope(root, git, ["present.txt"]), /index/u);
    assert.equal(reads, 1);
  }
  let reads = 0;
  await assert.rejects(
    stageScope(root, async () => {
      reads++;
      return "";
    }, ["line\nbreak.txt"]),
  );
  assert.equal(reads, 0, "Newline scope remains forbidden rather than becoming a path delimiter");
  const calls: Array<{ args: readonly string[]; input?: string }> = [];
  await stageScope(
    root,
    async (args, input) => {
      calls.push({ args, ...(input === undefined ? {} : { input }) });
      return "0\n";
    },
    ["present.txt"],
  );
  assert.deepEqual(calls, [
    { args: ["ls-files", "--format=%(stage)"] },
    {
      args: ["--literal-pathspecs", "add", "--pathspec-from-file=-", "--pathspec-file-nul"],
      input: "present.txt\0",
    },
  ]);
});

await test("absent scope membership rejects malformed, repeated and directory-prefix rows before staging", async () => {
  const root = await mkdtemp("stage-members-");
  const oid = "a".repeat(40);
  const row = "100644 " + oid + " 0\tretired.txt";
  for (const response of [
    row,
    row + "\0\0",
    row + "\0" + row + "\0",
    "100644 " + oid + " 1\tretired.txt\0",
    "100644 " + oid + " 0\tretired.txt/child.txt\0",
    "100644 " + oid + " 0\tunrequested.txt\0",
    "100644 " + oid + " 0\tretired.txt\nextra\0",
    "x".repeat(65537) + "\0",
  ]) {
    let reads = 0;
    const git: Git = async (args) => {
      reads++;
      if (reads === 1) {
        assert.deepEqual(args, ["ls-files", "--format=%(stage)"]);
        return "0\n";
      }
      assert.deepEqual(args, [
        "--literal-pathspecs",
        "ls-files",
        "--stage",
        "-z",
        "--",
        "retired.txt",
      ]);
      return response;
    };
    await assert.rejects(stageScope(root, git, ["retired.txt"]), /[Gg]it index/u);
    assert.equal(reads, 2);
  }
});

await test("absent scope membership bounds literal argument batches and retains already-staged deletions", async () => {
  const root = await mkdtemp("stage-batches-");
  const scope = Array.from({ length: 130 }, (_, index) => "absent-" + index + "[x].txt");
  const seen: string[] = [];
  let batches = 0;
  let added = "";
  const git: Git = async (args, input) => {
    if (args[0] === "ls-files") return "0\n".repeat(scope.length);
    if (args[1] === "add") {
      assert.deepEqual(args, [
        "--literal-pathspecs",
        "add",
        "--pathspec-from-file=-",
        "--pathspec-file-nul",
      ]);
      assert.equal(typeof input, "string");
      added = input ?? "";
      return "";
    }
    assert.deepEqual(args.slice(0, 5), ["--literal-pathspecs", "ls-files", "--stage", "-z", "--"]);
    const members = args.slice(5);
    assert.ok(members.length <= 64);
    assert.ok(members.reduce((total, path) => total + Buffer.byteLength(path) + 1, 0) <= 16384);
    batches++;
    seen.push(...members);
    // The first member was already removed from the index, so it must not be added again.
    return members
      .filter((path) => path !== scope[0])
      .map((path) => "100644 " + "b".repeat(64) + " 0\t" + path + "\0")
      .join("");
  };
  await stageScope(root, git, scope);
  assert.equal(batches, 3);
  assert.deepEqual(seen, scope);
  assert.equal(added, scope.slice(1).join("\0") + "\0");
});

await test("absent scope query batches honor UTF-8 argument bytes before their member cap", async () => {
  const root = await mkdtemp("stage-utf8-");
  const prefix = ("é".repeat(80) + "/").repeat(3);
  const scope = Array.from({ length: 40 }, (_, index) => prefix + "absent-" + index + ".txt");
  const batches: string[][] = [];
  let added = "";
  const git: Git = async (args, input) => {
    if (args[0] === "ls-files") return "0\n".repeat(scope.length);
    if (args[1] === "add") {
      added = input ?? "";
      return "";
    }
    assert.deepEqual(args.slice(0, 5), ["--literal-pathspecs", "ls-files", "--stage", "-z", "--"]);
    const members = args.slice(5);
    assert.ok(members.reduce((total, path) => total + Buffer.byteLength(path) + 1, 0) <= 16384);
    batches.push([...members]);
    return members.map((path) => "100644 " + "a".repeat(40) + " 0\t" + path + "\0").join("");
  };
  await stageScope(root, git, scope);
  assert.equal(batches.length, 2, "UTF-8 byte size splits fewer than 64 members");
  assert.deepEqual(batches.flat(), scope);
  assert.equal(added, scope.join("\0") + "\0");
});
