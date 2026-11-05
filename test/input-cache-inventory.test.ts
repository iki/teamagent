import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { test } from "bun:test";
import { encodedDigest } from "../app/check/cache-io.ts";
import { inputIdentity, runCachedTask, workingInventory } from "../app/check/input-cache.ts";
import { unitEnvironment } from "../app/check/test-groups.ts";
import { mkdtemp } from "./temporary.ts";

const sha1 = "a".repeat(40);
const sha256 = "b".repeat(64);
const parserRoot = resolve("inventory space ž");
const metadata = (root = parserRoot, format = "sha1"): string => `${format}\n${root}\n`;
function parsed(inventory: unknown, header: unknown = metadata(), root = parserRoot) {
  return workingInventory(root, (args) => (args[0] === "rev-parse" ? header : inventory));
}

test("working inventory uses two fresh queries with tagged tracked and untracked paths", () => {
  const calls: Array<readonly string[]> = [];
  const root = `${parserRoot}\nroot\n`;
  let untracked = "H 100644 looks like index metadata.txt";
  const query = (args: readonly string[]): unknown => {
    calls.push(args);
    return args[0] === "rev-parse"
      ? metadata(root)
      : `? ${untracked}\0H 100644 ${sha1} 0\ttracked.ts\0S 100755 ${sha1} 0\tsparse.ts\0`;
  };
  const first = workingInventory(root, query);
  assert.equal(first.format, "sha1");
  assert.deepEqual([...first.names], [untracked, "tracked.ts", "sparse.ts"]);
  assert.deepEqual(
    [...first.indexed],
    [
      ["tracked.ts", { mode: "100644", object: sha1 }],
      ["sparse.ts", { mode: "100755", object: sha1 }],
    ],
  );
  assert.deepEqual(calls, [
    ["rev-parse", "--show-object-format=storage", "--show-toplevel"],
    ["ls-files", "--cached", "--stage", "--others", "--exclude-standard", "-t", "-z"],
  ]);
  untracked = "later.txt";
  const second = workingInventory(root, query);
  assert.equal(calls.length, 4);
  assert.ok(second.names.has("later.txt"));
  assert.ok(!second.names.has("H 100644 looks like index metadata.txt"));
  assert.deepEqual([...parsed("").names], []);
  assert.equal(
    parsed(`H 100644 ${sha256} 0\tfile\0`, metadata(parserRoot, "sha256")).format,
    "sha256",
  );
});

test("working inventory rejects unknown, malformed, foreign and private metadata safely", () => {
  const secret = "PRIVATE_INVENTORY_METADATA_SENTINEL";
  for (const header of [
    null,
    [],
    { root: parserRoot },
    "sha1",
    `sha1\n${parserRoot}`,
    metadata(join(parserRoot, "foreign")),
    `sha1\nrelative\n`,
    `sha1\n${parserRoot}\0\n`,
    `${secret}\n${parserRoot}\n`,
    `sha1\n${parserRoot}\n${secret}\n`,
  ]) {
    assert.throws(
      () => parsed("", header),
      (error: unknown) => {
        assert.ok(error instanceof Error);
        assert.ok(!error.message.includes(secret));
        assert.equal(error.cause, undefined);
        return true;
      },
    );
  }
  for (const value of [null, [], {}, 1, "x".repeat(16 * 1024 ** 2 + 1)])
    assert.throws(() => parsed(value), /bounded UTF-8 text/u);
  assert.throws(() => parsed("ž".repeat(8 * 1024 ** 2 + 1)), /bounded UTF-8 text/u);
});

test("working inventory rejects truncated, conflicting, unsafe and unmerged records", () => {
  for (const inventory of [
    "? unfinished",
    "\0",
    "? \0",
    "? ../outside\0",
    "? file\nname\0",
    "? repeated\0? repeated\0",
    `? file\0H 100644 ${sha1} 0\tfile\0`,
    `H 100644 ${sha1} 0\tfile\0H 100644 ${sha1} 0\tfile\0`,
    `H 100644 ${sha1} 0\tfile\0\0`,
    `M 100644 ${sha1} 1\tfile\0`,
    `H 100644 ${sha1} 2\tfile\0`,
    `h 100644 ${sha1} 0\tfile\0`,
    `C 100644 ${sha1} 0\tfile\0`,
    `H 100648 ${sha1} 0\tfile\0`,
    `H 100644 ${"a".repeat(41)} 0\tfile\0`,
    `H 100644 ${sha256} 0\tfile\0`,
    `H 100644 ${sha1} 0 file\0`,
  ])
    assert.throws(() => parsed(inventory));
  assert.throws(
    () => parsed(`H 100644 ${sha1} 0\tfile\0`, metadata(parserRoot, "sha256")),
    /malformed Git index/u,
  );
});

test("working inventory bounds the combined tracked and untracked expansion", () => {
  const others = Array.from({ length: 100_000 }, (_, index) => `? untracked-${index}\0`).join("");
  assert.equal(parsed(others).names.size, 100_000);
  assert.throws(() => parsed(`${others}? extra\0`), /inventory exceeds verification bounds/u);
  assert.throws(
    () => parsed(`${others}H 100644 ${sha1} 0\ttracked\0`),
    /inventory exceeds verification bounds/u,
  );
});

function git(root: string, args: readonly string[], input?: string): string {
  const nullFile = process.platform === "win32" ? "NUL" : "/dev/null";
  const result = spawnSync(
    "git",
    [
      "--no-optional-locks",
      "-c",
      "core.autocrlf=false",
      "-c",
      `core.hooksPath=${nullFile}`,
      ...args,
    ],
    {
      cwd: root,
      env: unitEnvironment(process.env, join(root, ".cache/python")),
      encoding: "utf8",
      ...(input === undefined ? {} : { input }),
      timeout: 15_000,
      maxBuffer: 16 * 1024 ** 2,
      windowsHide: true,
    },
  );
  assert.equal(result.error, undefined, "Fixture Git must finish within its bounds");
  assert.equal(result.status, 0, "Fixture Git must succeed");
  return result.stdout;
}

async function fixture(format: "sha1" | "sha256" = "sha1"): Promise<string> {
  const parent = await mkdtemp("input-cache-inventory-");
  const root = join(parent, process.platform === "win32" ? "space ž" : "space ž\nroot\n");
  await mkdir(root);
  git(root, ["init", "--quiet", `--object-format=${format}`, "--template="]);
  await writeFile(join(root, "input.ts"), "export const value = 1;\n");
  await writeFile(join(root, ".gitignore"), "*.ignored\n.cache/\n");
  git(root, ["add", "."]);
  return root;
}

function expectedProjection(format: "sha1" | "sha256", files: ReadonlyMap<string, string>): string {
  return encodedDigest(
    [...files]
      .sort(([left], [right]) => left.localeCompare(right, "en"))
      .map(([path, text]) => [
        path,
        "100644",
        createHash(format)
          .update(`blob ${Buffer.byteLength(text)}\0`)
          .update(text)
          .digest("hex"),
      ]),
  );
}

test("batched inventory preserves actual bytes, ignored tracking, sparse flags and missing files", async () => {
  const root = await fixture();
  const files = new Map([
    [".gitignore", "*.ignored\n.cache/\n"],
    ["input.ts", "export const value = 1;\r\n"],
    ["sparse.ts", "changed sparse bytes\n"],
    ["tracked.ignored", "tracked despite exclusion\n"],
    ["H 100644 metadata ž.txt", "untracked bytes\n"],
  ]);
  await writeFile(join(root, "sparse.ts"), "initial sparse bytes\n");
  await writeFile(join(root, "deleted.ts"), "removed after staging\n");
  await writeFile(join(root, "tracked.ignored"), "tracked despite exclusion\n");
  git(root, ["add", "--force", "sparse.ts", "deleted.ts", "tracked.ignored"]);
  git(root, ["update-index", "--assume-unchanged", "input.ts"]);
  git(root, ["update-index", "--skip-worktree", "sparse.ts"]);
  for (const [path, text] of files) await writeFile(join(root, path), text);
  await writeFile(join(root, "excluded.ignored"), "must not enter inventory\n");
  await rm(join(root, "deleted.ts"));
  const inventory = workingInventory(root);
  assert.ok(inventory.indexed.has("deleted.ts"));
  assert.ok(inventory.indexed.has("tracked.ignored"));
  assert.ok(!inventory.names.has("excluded.ignored"));
  assert.ok(!inventory.indexed.has("H 100644 metadata ž.txt"));
  assert.equal(
    (await inputIdentity(root, { id: "bytes", kind: "verification" })).projection,
    expectedProjection("sha1", files),
  );
  await mkdir(join(root, "nested"));
  assert.throws(() => workingInventory(join(root, "nested")), /actual repository root/u);
});

test("batched inventory hashes SHA-256 repository blobs with complete object identities", async () => {
  const root = await fixture("sha256");
  const inventory = workingInventory(root);
  assert.equal(inventory.format, "sha256");
  for (const entry of inventory.indexed.values()) assert.equal(entry.object.length, 64);
  const files = new Map([
    [".gitignore", "*.ignored\n.cache/\n"],
    ["input.ts", "export const value = 1;\n"],
  ]);
  assert.equal(
    (await inputIdentity(root, { id: "sha256", kind: "verification" })).projection,
    expectedProjection("sha256", files),
  );
});

test("batched inventory rejects real unmerged indexes and linked source inputs", async () => {
  const root = await fixture();
  const object = git(root, ["hash-object", "-w", "--stdin"], "target\n").trim();
  git(root, ["update-index", "--index-info"], `100644 ${object} 1\tconflict.ts\n`);
  assert.throws(() => workingInventory(root), /unmerged or malformed Git index/u);
  git(root, ["update-index", "--force-remove", "conflict.ts"]);
  git(root, ["update-index", "--add", "--cacheinfo", `120000,${object},linked.ts`]);
  await assert.rejects(
    inputIdentity(root, { id: "link", kind: "verification" }),
    /Linked\/submodule/u,
  );
  git(root, ["update-index", "--force-remove", "linked.ts"]);
  const outside = await mkdtemp("input-cache-inventory-linked-");
  await writeFile(join(outside, "private.txt"), "external fixture bytes\n");
  await symlink(outside, join(root, "escape"), process.platform === "win32" ? "junction" : "dir");
  await assert.rejects(inputIdentity(root, { id: "link", kind: "verification" }), /Linked/u);
  assert.equal(await readFile(join(outside, "private.txt"), "utf8"), "external fixture bytes\n");
});

test("batched cache reads remain live across execution and final reuse validation", async () => {
  const root = await fixture();
  const task = { id: "live", kind: "verification" } as const;
  const first = await runCachedTask(root, task, async () => {});
  assert.equal(first.hit, false);
  await assert.rejects(
    runCachedTask(root, task, async () => assert.fail("Unexpected execution"), {
      validate: async () => writeFile(join(root, "input.ts"), "changed during validation\n"),
    }),
    /reuse validation/u,
  );
  await assert.rejects(
    runCachedTask(root, { ...task, id: "execution" }, async () => {
      await writeFile(join(root, "input.ts"), "changed during execution\n");
    }),
    /changed during/u,
  );
  assert.notEqual((await inputIdentity(root, task)).key, first.key);
});
