import { test } from "bun:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, readdir, realpath, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { isAbsolute, join, relative, resolve, sep } from "node:path";
import { Effect } from "effect";
import { MemoryError } from "@/memory";
import { preflightGitEntries } from "../app/imports/git.ts";
import { createSourceCapture } from "../app/imports/index.ts";
import { importLimits } from "../app/imports/limits.ts";
import { processEnvironment } from "../app/imports/process.ts";

const object = "a".repeat(40);
const location = resolve(tmpdir(), "teamagent-git-preflight-selection");
const dataDirectory = join(location, "private-state");
const record = (path: string, mode = "100644", type = "blob") =>
  `${mode} ${type} ${object}\t${path}\0`;
const signal = () => AbortSignal.timeout(10_000);

test("Git preflight counts only eligible blobs and preserves selection and exclusion order at the exact limit", () => {
  const names = Array.from({ length: importLimits.files - 2 }, (_, index) => `file-${index}.txt`);
  names.push("private-state-neighbor/note.txt", "docs/credential-reference.ts");
  const excluded = [
    ".env",
    ".env.local",
    "node_modules/dependency.ts",
    ".teamagent/state.txt",
    "private-state/nested/private.txt",
    "unsafe/../escape.txt",
    "link.txt",
    "nested-repository",
  ];
  const initialWarnings = ["Existing local-repository provenance warning"];
  const tree = [
    ...excluded.slice(0, 6).map((path) => record(path)),
    record("link.txt", "120000"),
    record("nested-repository", "160000", "commit"),
    ...names.map((path) => record(path)),
  ].join("");
  const selected = preflightGitEntries(tree, location, dataDirectory, initialWarnings, signal());
  assert.deepEqual(
    selected.entries,
    names.map((path) => ({ path, object })),
  );
  assert.equal(selected.entries.length, importLimits.files);
  assert.deepEqual(selected.warnings, [
    ...initialWarnings,
    ...excluded.map((path) => `Excluded Git entry: ${path}`),
  ]);
  assert.deepEqual(initialWarnings, ["Existing local-repository provenance warning"]);
  assert.throws(
    () => preflightGitEntries(tree + record("one-more.txt"), location, dataDirectory, [], signal()),
    (error: unknown) => error instanceof MemoryError && error.code === "capacity",
  );
});

test("Git preflight keeps remote and local private-path decisions distinct", () => {
  const tree = record("private-state/nested/private.txt") + record("ordinary.txt");
  const local = preflightGitEntries(tree, location, dataDirectory, [], signal());
  const remote = preflightGitEntries(
    tree,
    "https://example.org/reference.git",
    dataDirectory,
    [],
    signal(),
  );
  assert.deepEqual(
    local.entries.map((entry) => entry.path),
    ["ordinary.txt"],
  );
  assert.deepEqual(
    remote.entries.map((entry) => entry.path),
    ["private-state/nested/private.txt", "ordinary.txt"],
  );
  assert.deepEqual(remote.warnings, []);
});

test("Git preflight retains manifest, exclusion, malformed-entry and cancellation bounds", () => {
  assert.throws(
    () =>
      preflightGitEntries(
        record("note.txt").repeat(importLimits.entries + 1),
        location,
        dataDirectory,
        [],
        signal(),
      ),
    (error: unknown) => error instanceof MemoryError && error.code === "capacity",
  );
  assert.throws(
    () => preflightGitEntries(record(".env").repeat(256), location, dataDirectory, [], signal()),
    (error: unknown) => error instanceof MemoryError && error.code === "capacity",
  );
  assert.equal(
    preflightGitEntries(record(".env").repeat(255), location, dataDirectory, [], signal()).warnings
      .length,
    255,
  );
  assert.throws(
    () => preflightGitEntries("not a Git tree entry\0", location, dataDirectory, [], signal()),
    /Malformed Git tree/,
  );
  const cancelled = new AbortController();
  cancelled.abort();
  assert.throws(() =>
    preflightGitEntries(record("note.txt"), location, dataDirectory, [], cancelled.signal),
  );
});

test("real Git import rejects 257 eligible files before attempting to read their unavailable blob", async () => {
  const parent = await realpath(tmpdir());
  const directory = await realpath(await mkdtemp(join(parent, "teamagent-git-preflight-")));
  const repo = join(directory, "repo");
  const data = join(directory, "private");
  const temporaryDirectory = join(data, "temporary");
  const git = (args: readonly string[], input?: string) =>
    execFileSync(
      "git",
      [
        "-c",
        "core.hooksPath=",
        "-c",
        "commit.gpgsign=false",
        "-c",
        "user.name=Fixture",
        "-c",
        "user.email=fixture@example.invalid",
        ...args,
      ],
      {
        encoding: "utf8",
        windowsHide: true,
        timeout: 10_000,
        maxBuffer: 1_048_576,
        env: {
          ...processEnvironment(),
          GIT_CONFIG_NOSYSTEM: "1",
          GIT_CONFIG_GLOBAL: join(directory, "absent-config"),
        },
        stdio: ["pipe", "pipe", "pipe"],
        ...(input === undefined ? {} : { input }),
      },
    ).trim();
  try {
    await mkdir(temporaryDirectory, { recursive: true });
    git(["init", "--object-format=sha1", "--template=", repo]);
    const treeInput = Array.from(
      { length: importLimits.files + 1 },
      (_, index) => `100644 blob ${object}\tfile-${String(index).padStart(4, "0")}.txt\n`,
    ).join("");
    const tree = git(["-C", repo, "mktree", "--missing"], treeInput);
    assert.match(tree, /^[a-f0-9]{40}$/);
    const commit = git(["-C", repo, "commit-tree", tree, "-m", "preflight fixture"]);
    assert.match(commit, /^[a-f0-9]{40}$/);
    git(["-C", repo, "update-ref", "HEAD", commit]);
    assert.throws(() => git(["-C", repo, "cat-file", "-s", object]));

    const outcome = await Effect.runPromise(
      createSourceCapture({ allowedRoots: [repo] })({
        locator: repo,
        kind: "git",
        convert: false,
        workspaceRoot: repo,
        temporaryDirectory,
        dataDirectory: data,
      }).pipe(
        Effect.match({
          onFailure: (error) => ({ error }),
          onSuccess: (value) => ({ value }),
        }),
      ),
    );
    assert.ok("error" in outcome);
    assert.equal(outcome.error.code, "capacity");
    assert.match(outcome.error.message, /more than 256 eligible files/);
    assert.deepEqual(await readdir(temporaryDirectory), []);
  } finally {
    const canonical = await realpath(directory);
    const part = relative(parent, canonical);
    if (
      canonical === directory &&
      !isAbsolute(part) &&
      part.startsWith("teamagent-git-preflight-") &&
      !part.includes(sep)
    )
      await rm(canonical, { recursive: true, force: true });
  }
});
