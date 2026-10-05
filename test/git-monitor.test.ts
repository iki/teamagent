import { test } from "bun:test";
import assert from "node:assert/strict";
import { join, resolve } from "node:path";
import { gitStagingBytes } from "../app/imports/git.ts";
import { importLimits } from "../app/imports/limits.ts";

const root = resolve("git-monitor-fixture");
const info = (kind: "file" | "directory" | "link", size = 0) => ({
  size,
  isFile: () => kind === "file",
  isDirectory: () => kind === "directory",
  isSymbolicLink: () => kind === "link",
});
const failure = (code: string) => Object.assign(new Error("Fixture filesystem failure"), { code });

test("Git monitor tolerates a temporary lock disappearing between enumeration and stat", async () => {
  const bytes = await gitStagingBytes(root, {
    inspect: async (path) => {
      if (path === root) return info("directory");
      if (path === join(root, "temporary.lock")) throw failure("ENOENT");
      return info("file", 37);
    },
    entries: async function* () {
      yield { name: "temporary.lock" };
      yield { name: "pack" };
    },
  });
  assert.equal(bytes, 37);
});

test("Git monitor tolerates a temporary directory disappearing before opening its iterator", async () => {
  const bytes = await gitStagingBytes(root, {
    inspect: async () => info("directory"),
    entries: async function* (path) {
      if (path !== root) throw failure("ENOENT");
      yield { name: "temporary" };
    },
  });
  assert.equal(bytes, 0);
});

test("Git monitor keeps root loss, permissions, links and size limits as failures", async () => {
  for (const code of ["ENOENT", "EACCES", "EPERM"]) {
    await assert.rejects(
      gitStagingBytes(root, {
        inspect: async () => {
          throw failure(code);
        },
        entries: async function* () {},
      }),
      (error: unknown) => error instanceof Error && "code" in error && error.code === code,
    );
  }
  for (const code of ["EACCES", "EPERM"]) {
    await assert.rejects(
      gitStagingBytes(root, {
        inspect: async (path) => {
          if (path !== root) throw failure(code);
          return info("directory");
        },
        entries: async function* () {
          yield { name: "pack" };
        },
      }),
      (error: unknown) => error instanceof Error && "code" in error && error.code === code,
    );
  }
  await assert.rejects(
    gitStagingBytes(root, {
      inspect: async (path) => info(path === root ? "directory" : "link"),
      entries: async function* () {
        yield { name: "link" };
      },
    }),
    /staging link/,
  );
  await assert.rejects(
    gitStagingBytes(root, {
      inspect: async (path) =>
        path === root ? info("directory") : info("file", importLimits.totalBytes + 1),
      entries: async function* () {
        yield { name: "large.pack" };
      },
    }),
    /byte limit/,
  );
});
