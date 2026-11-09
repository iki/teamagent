import { beforeAll, expect, test } from "bun:test";
import { rejects } from "node:assert/strict";
import { createHash } from "node:crypto";
import { link, lstat, mkdir, readFile, rename, rm, symlink, writeFile } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { copyFileContent, fingerprintChunkBytes } from "../app/check/cache-fingerprint.ts";
import { gitText } from "../app/check/cache-io.ts";
import { nativeArtifactOwner } from "../app/check/native-artifact-owner.ts";
import {
  copyOwnedProcessArtifact,
  inspectOwnedProcessArtifact,
  ownedProcessIdentity,
  spawnOwned,
} from "../app/check/owned-process.ts";
import { mkdtemp } from "./temporary.ts";

function git(root: string, args: readonly string[]): string {
  return gitText(root, [
    "-c",
    "user.name=Artifact fixture",
    "-c",
    "user.email=fixture@example.invalid",
    "-c",
    "commit.gpgsign=false",
    "-c",
    "core.hooksPath=/no-fixture-hooks",
    ...args,
  ]);
}
async function repository(): Promise<string> {
  const root = await mkdtemp("na-");
  git(root, ["init", "--quiet"]);
  await writeFile(join(root, ".gitignore"), ".cache/\n.tmp/\nw/\nd/\n", "utf8");
  await writeFile(join(root, "input.txt"), "Native artifact fixture\n", "utf8");
  git(root, ["add", "--", ".gitignore", "input.txt"]);
  git(root, ["commit", "--quiet", "-m", "test: Initialize native artifact fixture"]);
  return root;
}
let fixture: {
  readonly root: string;
  readonly worktree: string;
  readonly detached: string;
  readonly foreign: string;
  readonly privateRoot: string;
};
beforeAll(async () => {
  const root = await repository();
  // Topology-only artifact fixtures need no task-registry layout. Short physical
  // children keep real managed executables within the unchanged Windows bound.
  const worktree = join(root, "w"),
    detached = join(root, "d");
  git(root, ["worktree", "add", "--quiet", "-b", "codex/artifact-fixture", worktree, "HEAD"]);
  git(root, ["worktree", "add", "--quiet", "--detach", detached, "HEAD"]);
  const privateRoot = join(root, ".tmp/private");
  await mkdir(privateRoot, { recursive: true });
  fixture = { root, worktree, detached, foreign: await repository(), privateRoot };
}, 120_000);

test("only exact physically related roots select their canonical primary", async () => {
  for (const root of [fixture.root, fixture.worktree, fixture.detached]) {
    const owner = await nativeArtifactOwner(fixture.worktree, root);
    expect(owner.shared).toBe(true);
    expect(owner.canonical).toBe(fixture.root);
    expect(owner.project).toBe(root);
    await owner.validate();
  }
  for (const root of [fixture.foreign, fixture.privateRoot]) {
    const owner = await nativeArtifactOwner(fixture.root, root);
    expect(owner.shared).toBe(false);
    expect(owner.canonical).toBe(root);
  }
  const noImplementationRepository = await nativeArtifactOwner(fixture.privateRoot, fixture.root);
  expect(noImplementationRepository.shared).toBe(false);
  expect(noImplementationRepository.canonical).toBe(fixture.root);
  // No task registration is fabricated: immutable artifact storage grants no task authority.
  await rejects(lstat(join(fixture.root, ".git/teamagent-parallel")), { code: "ENOENT" });
}, 120_000);

test("artifact ownership permits branch movement but rejects changed physical Git bindings", async () => {
  const owner = await nativeArtifactOwner(fixture.root, fixture.worktree);
  git(fixture.worktree, ["switch", "--quiet", "-c", "codex/artifact-fixture-followup"]);
  await owner.validate();
  git(fixture.worktree, ["switch", "--quiet", "codex/artifact-fixture"]);
  const marker = join(fixture.worktree, ".git"),
    original = await readFile(marker);
  try {
    await writeFile(marker, "gitdir: " + join(fixture.foreign, ".git") + "\n", "utf8");
    await rejects(owner.validate());
    await rejects(nativeArtifactOwner(fixture.root, fixture.worktree));
  } finally {
    await writeFile(marker, original);
  }
  await owner.validate();
}, 120_000);

test("missing, malformed, oversized and linked Git metadata never becomes local fallback", async () => {
  const marker = join(fixture.worktree, ".git"),
    original = await readFile(marker);
  const admin = git(fixture.worktree, ["rev-parse", "--absolute-git-dir"]).trim();
  const back = join(admin, "gitdir"),
    backBytes = await readFile(back),
    saved = join(admin, "gitdir.fixture-original");
  try {
    await rename(back, saved);
    await rejects(nativeArtifactOwner(fixture.root, fixture.worktree));
  } finally {
    await rename(saved, back);
  }
  for (const invalid of ["not a Git pointer\n", "x".repeat(4097) + "\n"]) {
    try {
      await writeFile(marker, invalid, "utf8");
      await rejects(nativeArtifactOwner(fixture.root, fixture.worktree));
    } finally {
      await writeFile(marker, original);
    }
  }
  try {
    await writeFile(back, join(fixture.foreign, ".git") + "\n", "utf8");
    await rejects(nativeArtifactOwner(fixture.root, fixture.worktree));
  } finally {
    await writeFile(back, backBytes);
  }
  const linked = join(fixture.privateRoot, "linked-worktree");
  await symlink(fixture.worktree, linked, process.platform === "win32" ? "junction" : "dir");
  await rejects(nativeArtifactOwner(fixture.root, linked));
}, 120_000);

test("positive absence stays local and cannot silently change classification during a run", async () => {
  const root = await mkdtemp("na-local-"),
    owner = await nativeArtifactOwner(fixture.root, root);
  expect(owner.shared).toBe(false);
  await writeFile(join(root, ".git"), "unconfirmed marker\n", "utf8");
  await rejects(owner.validate());
  await rejects(nativeArtifactOwner(fixture.root, root));
  const commonPointer = join(fixture.root, ".git/commondir");
  try {
    await writeFile(commonPointer, "../foreign\n", { encoding: "utf8", flag: "wx" });
    await rejects(nativeArtifactOwner(fixture.root, fixture.root));
  } finally {
    await rm(commonPointer);
  }
}, 120_000);

test("aliased primary metadata and independent failures stay live in every observation", async () => {
  const owner = await nativeArtifactOwner(fixture.root, fixture.root);
  const head = join(fixture.root, ".git/HEAD"),
    originalHead = await readFile(head);
  try {
    await writeFile(head, "unsupported HEAD form\n", "utf8");
    await rejects(owner.validate());
  } finally {
    await writeFile(head, originalHead);
  }
  await owner.validate();
  const objects = join(fixture.root, ".git/objects"),
    refs = join(fixture.root, ".git/refs"),
    savedObjects = join(fixture.root, ".git/objects.saved-fixture"),
    savedRefs = join(fixture.root, ".git/refs.saved-fixture");
  await rename(objects, savedObjects);
  try {
    await rename(refs, savedRefs);
    try {
      await rejects(
        owner.validate(),
        (error: unknown) =>
          error instanceof AggregateError &&
          error.message === "Native artifact ownership observations failed" &&
          error.errors.length === 2 &&
          error.errors.every(
            (failure: unknown) =>
              failure instanceof Error && "code" in failure && failure.code === "ENOENT",
          ),
      );
    } finally {
      await rename(savedRefs, refs);
    }
  } finally {
    await rename(savedObjects, objects);
  }
  await owner.validate();
}, 120_000);

test("bounded artifact copies preserve bytes, reject replacement and use exclusive targets", async () => {
  const root = await mkdtemp("na-copy-"),
    source = join(root, "source.bin"),
    target = join(root, "copy.bin");
  const bytes = new Uint8Array(fingerprintChunkBytes + 17).map((_, index) => index % 251);
  await writeFile(source, bytes);
  const expected = createHash("sha256").update(bytes).digest("hex");
  const checksum = await copyFileContent(source, await lstat(source, { bigint: true }), target, {
    maximumBytes: bytes.length,
    validatePaths: async () => {},
  });
  expect(checksum).toBe(expected);
  expect(await readFile(target)).toEqual(Buffer.from(bytes));
  await rejects(
    copyFileContent(source, await lstat(source, { bigint: true }), target, {
      maximumBytes: bytes.length,
      validatePaths: async () => {},
    }),
    { code: "EEXIST" },
  );
  expect(await readFile(target)).toEqual(Buffer.from(bytes));
  const tooSmall = join(root, "too-small.bin");
  await rejects(
    copyFileContent(source, await lstat(source, { bigint: true }), tooSmall, {
      maximumBytes: bytes.length - 1,
      validatePaths: async () => {},
    }),
    /bounded/u,
  );
  await rejects(lstat(tooSmall), { code: "ENOENT" });
  const changed = join(root, "changed.bin");
  let modified = false;
  await rejects(
    copyFileContent(source, await lstat(source, { bigint: true }), changed, {
      maximumBytes: bytes.length,
      validatePaths: async () => {},
      observe: async (event) => {
        if (event.phase === "read" && !modified) {
          modified = true;
          await writeFile(source, new Uint8Array(bytes.length + 1));
        }
      },
    }),
    /changed/u,
  );
  expect((await lstat(changed)).size).toBeLessThanOrEqual(bytes.length);
}, 120_000);

test("artifact copies reject multiply linked source bytes and preserve existing target evidence", async () => {
  const root = await mkdtemp("na-links-"),
    source = join(root, "source.bin"),
    alias = join(root, "alias.bin");
  await writeFile(source, "retained fixture bytes\n", "utf8");
  await link(source, alias);
  const target = join(root, "copy.bin");
  await rejects(
    copyFileContent(source, await lstat(source, { bigint: true }), target, {
      maximumBytes: 1024,
      validatePaths: async () => {},
    }),
    /private regular/u,
  );
  expect(await readFile(source, "utf8")).toBe("retained fixture bytes\n");
  await rejects(lstat(target), { code: "ENOENT" });
});

async function capture(stream: NodeJS.ReadableStream | null): Promise<string> {
  if (!stream) throw new Error("Missing native fixture stream");
  const chunks: AsyncIterable<unknown> = stream;
  let text = "";
  for await (const chunk of chunks) {
    if (!(chunk instanceof Uint8Array)) throw new Error("Invalid native fixture stream chunk");
    text += new TextDecoder().decode(chunk);
    if (Buffer.byteLength(text) > 4096) throw new Error("Native fixture output exceeds bounds");
  }
  return text;
}
async function nativeCommand(project: string): Promise<string> {
  const owned = await spawnOwned(
    process.execPath,
    ["-e", "process.stdout.write('owned artifact fixture\\n')"],
    {
      projectRoot: project,
      cwd: project,
      stdio: "pipe",
      timeoutMs: 15_000,
    },
  );
  const output = capture(owned.child.stdout).catch(async (error: unknown) => {
    await owned.stop("Fixture capture failed");
    throw error;
  });
  const errors = capture(owned.child.stderr).catch(async (error: unknown) => {
    await owned.stop("Fixture capture failed");
    throw error;
  });
  const [out, err, closed] = await Promise.allSettled([output, errors, owned.closed]);
  if (out.status !== "fulfilled" || err.status !== "fulfilled" || closed.status !== "fulfilled")
    throw new Error("Native fixture transport did not settle successfully");
  expect(out.value).toBe("owned artifact fixture\n");
  expect(err.value).toBe("");
  expect(closed.value.code).toBe(0);
  expect(closed.value.signal).toBeNull();
  expect(closed.value.error).toBeUndefined();
  expect(closed.value.termination).toBe("closed");
  return owned.child.spawnfile;
}

test.skipIf(process.platform !== "win32")(
  "real supervisor bytes copy to linked owners and launch locally with equal identity",
  async () => {
    const implementation = fileURLToPath(new URL("../", import.meta.url));
    const executable = await nativeCommand(implementation),
      key = basename(dirname(executable));
    expect(key).toMatch(/^[a-f0-9]{64}$/u);
    const realIdentity = await ownedProcessIdentity(implementation);
    const folder = ".cache/native/" + key;
    const current = await inspectOwnedProcessArtifact(implementation, folder);
    if (!current) throw new Error("Actual prepared supervisor disappeared");
    const canonicalFolder = join(fixture.root, folder);
    await mkdir(canonicalFolder, { recursive: true });
    const checksum = await copyFileContent(
      current.path,
      await lstat(current.path, { bigint: true }),
      join(canonicalFolder, "run.exe"),
      {
        maximumBytes: 16 * 1024 * 1024,
        validatePaths: async () => {
          await lstat(current.path);
        },
      },
    );
    expect(checksum).toBe(current.digest);
    await writeFile(join(canonicalFolder, "binary.sha256"), checksum + "\n", {
      encoding: "utf8",
      flag: "wx",
    });
    const canonical = await inspectOwnedProcessArtifact(fixture.root, folder);
    if (!canonical) throw new Error("Copied fixture canonical artifact disappeared");
    const before = async (): Promise<string> => {
      if ((await ownedProcessIdentity(implementation)) !== realIdentity)
        throw new Error("Actual fixture supervisor source or binary changed");
      return key;
    };
    for (const root of [fixture.worktree, fixture.detached]) {
      const owner = await nativeArtifactOwner(fixture.root, root);
      const path = await copyOwnedProcessArtifact(owner, { key, before }, canonical);
      expect(path).toBe(join(root, folder, "run.exe"));
      expect(path).not.toBe(canonical.path);
      expect((await inspectOwnedProcessArtifact(root, folder))?.digest).toBe(canonical.digest);
      expect(await ownedProcessIdentity(root)).toBe(realIdentity);
      expect(await nativeCommand(root)).toBe(path);
    }
    const owner = await nativeArtifactOwner(fixture.root, fixture.worktree);
    await rejects(
      copyOwnedProcessArtifact(owner, { key, before: async () => "0".repeat(64) }, canonical),
      /inputs changed/u,
    );
    const local = join(fixture.worktree, folder),
      originalLocal = join(fixture.worktree, ".cache/native-original-artifact");
    await rename(local, originalLocal);
    try {
      await mkdir(local);
      const conflicting = "retained different complete artifact\n";
      await writeFile(join(local, "run.exe"), conflicting, "utf8");
      await writeFile(
        join(local, "binary.sha256"),
        createHash("sha256").update(conflicting).digest("hex") + "\n",
        "utf8",
      );
      await rejects(
        copyOwnedProcessArtifact(owner, { key, before }, canonical),
        /differs from the canonical/u,
      );
      expect(await readFile(join(local, "run.exe"), "utf8")).toBe(conflicting);
    } finally {
      await rename(local, join(fixture.worktree, ".cache/retained-conflicting-artifact"));
      await rename(originalLocal, local);
    }
    const canonicalReceipt = join(canonicalFolder, "binary.sha256"),
      savedReceipt = join(fixture.root, ".cache/canonical-receipt.original");
    try {
      await rename(canonicalReceipt, savedReceipt);
      await rejects(copyOwnedProcessArtifact(owner, { key, before }, canonical), /Incomplete/u);
      expect((await inspectOwnedProcessArtifact(fixture.worktree, folder))?.digest).toBe(
        canonical.digest,
      );
    } finally {
      await rename(savedReceipt, canonicalReceipt);
    }
    const localParent = dirname(local),
      originalParent = join(fixture.worktree, ".cache/native-original-parent");
    await rename(localParent, originalParent);
    try {
      await mkdir(localParent);
      for (let index = 0; index < 32; index++)
        await mkdir(
          join(
            localParent,
            createHash("sha256")
              .update("retained capacity " + index)
              .digest("hex"),
          ),
        );
      await rejects(copyOwnedProcessArtifact(owner, { key, before }, canonical), /capacity/u);
    } finally {
      await rename(localParent, join(fixture.worktree, ".cache/retained-native-capacity"));
      await rename(originalParent, localParent);
    }
    expect(await ownedProcessIdentity(fixture.worktree)).toBe(realIdentity);
    // The source-bound fixture adapter invokes the same production copy algorithm.
    // The later registered-task acceptance additionally covers automatic owner selection.
  },
  120_000,
);
