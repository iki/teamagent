import { assertTemporaryFixture, mkdtemp } from "./temporary.ts";
import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { runCachedTask } from "../app/check/input-cache.ts";
import { verifyStagedVerificationReceipts } from "../app/check/verification-cache.ts";
import { gitEnvironment, type Git } from "../app/workflow/git.ts";
import { verifyPreCommit } from "../app/workflow/pre-commit.ts";
import { runProcess } from "../app/workflow/process.ts";

const receipt = ".verification/verification-fixture.json";
const definition = { id: "fixture", kind: "verification", inputs: ["source.ts"] } as const;

async function fixture() {
  const root = await mkdtemp("test-pre-commit-");
  const template = join(root, ".cache/template");
  await mkdir(template, { recursive: true });
  const nullFile = process.platform === "win32" ? "NUL" : "/dev/null";
  const git: Git = async (args, input, index) => {
    const result = await runProcess(
      root,
      "git",
      ["-c", "core.autocrlf=false", "-c", `core.attributesFile=${nullFile}`, ...args],
      {
        ...(input === undefined ? {} : { input }),
        env: {
          ...gitEnvironment(index),
          GIT_CONFIG_NOSYSTEM: "1",
          GIT_CONFIG_GLOBAL: nullFile,
          GIT_ATTR_NOSYSTEM: "1",
          GIT_TEMPLATE_DIR: template,
        },
      },
    );
    assert.equal(result.outcome, "exited");
    assert.equal(result.code, 0, result.stderr);
    return result.stdout;
  };
  await git(["init", "--quiet"]);
  await writeFile(join(root, ".gitignore"), ".cache/\n", "utf8");
  await writeFile(join(root, ".gitattributes"), "* text eol=lf\n", "utf8");
  await writeFile(join(root, "source.ts"), "export const value = 1;\n", "utf8");
  await writeFile(join(root, "unrelated.txt"), "original\n", "utf8");
  await git(["add", "."]);
  await runCachedTask(root, definition, async () => {});
  await git(["add", receipt]);
  return {
    root,
    git,
    async close() {
      await assertTemporaryFixture(root);
      await rm(root, { recursive: true, force: true });
    },
  };
}

await test("pre-commit preserves an unchanged review and pre-existing unstaged work", async () => {
  const f = await fixture();
  try {
    await writeFile(join(f.root, "unrelated.txt"), "intentionally unstaged\n", "utf8");
    await writeFile(join(f.root, "untracked.txt"), "intentionally untracked\n", "utf8");
    const before = await f.git(["write-tree"]);
    let reviewed = 0;
    await verifyPreCommit(f.root, {
      git: f.git,
      async review() {
        reviewed++;
      },
    });
    assert.equal(reviewed, 1);
    assert.equal(await f.git(["write-tree"]), before);
    assert.equal(await readFile(join(f.root, "unrelated.txt"), "utf8"), "intentionally unstaged\n");
    assert.equal(
      await readFile(join(f.root, "untracked.txt"), "utf8"),
      "intentionally untracked\n",
    );
  } finally {
    await f.close();
  }
});

await test("pre-commit rejects a successful review that rewrites a tracked verification receipt", async () => {
  const f = await fixture();
  try {
    const staged = await f.git(["show", `:${receipt}`]);
    await assert.rejects(
      verifyPreCommit(f.root, {
        git: f.git,
        async review() {
          await runCachedTask(
            f.root,
            { ...definition, values: ["new environment"] },
            async () => {},
          );
        },
      }),
      /changed the staged or working tree/u,
    );
    assert.equal(await f.git(["show", `:${receipt}`]), staged);
    assert.notEqual(await readFile(join(f.root, receipt), "utf8"), staged);
    // The unchanged staged receipt is individually valid; the new guard detects its drift.
    await verifyStagedVerificationReceipts(f.root);
  } finally {
    await f.close();
  }
});

await test("pre-commit requests local receipts and can verify changed prerequisites without tree drift", async () => {
  const f = await fixture();
  try {
    const tracked = await readFile(join(f.root, receipt), "utf8");
    const staged = await f.git(["write-tree"]);
    let executions = 0;
    const review = async (
      root: string,
      options: { readonly receiptWritePolicy: "tracked" | "local" },
    ) => {
      assert.equal(options.receiptWritePolicy, "local");
      await runCachedTask(
        root,
        { ...definition, values: ["different prerequisite identity"] },
        async () => {
          executions++;
        },
        options,
      );
    };
    await verifyPreCommit(f.root, { git: f.git, review });
    await verifyPreCommit(f.root, { git: f.git, review });
    assert.equal(executions, 1);
    assert.equal(await readFile(join(f.root, receipt), "utf8"), tracked);
    assert.equal(await f.git(["write-tree"]), staged);
    assert.equal(await f.git(["diff", "--name-only"]), "");
  } finally {
    await f.close();
  }
});

await test("pre-commit rejects source changes and index-only changes during a successful review", async () => {
  for (const change of ["source", "index"] as const) {
    const f = await fixture();
    try {
      await writeFile(join(f.root, "unrelated.txt"), "intentionally unstaged\n", "utf8");
      await assert.rejects(
        verifyPreCommit(f.root, {
          git: f.git,
          async review() {
            if (change === "source")
              await writeFile(join(f.root, "source.ts"), "export const value = 2;\n", "utf8");
            else await f.git(["add", "unrelated.txt"]);
          },
        }),
        /changed the staged or working tree/u,
      );
    } finally {
      await f.close();
    }
  }
});

await test("pre-commit retains review and staged-receipt failure checks", async () => {
  const f = await fixture();
  try {
    let staged = false;
    await assert.rejects(
      verifyPreCommit(f.root, {
        git: f.git,
        async review() {
          throw new Error("fixture review failure");
        },
        async staged() {
          staged = true;
        },
      }),
      /fixture review failure/u,
    );
    assert.equal(staged, false);
    await writeFile(join(f.root, receipt), "invalid receipt\n", "utf8");
    await f.git(["add", receipt]);
    await assert.rejects(verifyPreCommit(f.root, { git: f.git, async review() {} }));
  } finally {
    await f.close();
  }
});

await test("pre-commit binds the active alternate index without touching the ordinary index", async () => {
  const f = await fixture();
  try {
    const before = await f.git(["write-tree"]);
    const indexFile = join(f.root, ".cache/alternate-index");
    await f.git(["read-tree", before.trim()], undefined, indexFile);
    await writeFile(join(f.root, "unrelated.txt"), "alternate staged value\n", "utf8");
    await f.git(["add", "unrelated.txt"], undefined, indexFile);
    const alternate = await f.git(["write-tree"], undefined, indexFile);
    assert.notEqual(alternate, before);
    let selected: string | undefined;
    await verifyPreCommit(f.root, {
      git: f.git,
      indexFile,
      async review() {},
      async staged(root, options) {
        selected = options?.indexFile;
        await verifyStagedVerificationReceipts(root, options);
      },
    });
    assert.equal(selected, indexFile);
    assert.equal(await f.git(["write-tree"]), before);
    assert.equal(await f.git(["write-tree"], undefined, indexFile), alternate);
    await writeFile(join(f.root, receipt), "invalid alternate receipt\n", "utf8");
    await f.git(["add", receipt], undefined, indexFile);
    await assert.rejects(verifyPreCommit(f.root, { git: f.git, indexFile, async review() {} }));
    assert.equal(await f.git(["write-tree"]), before);
  } finally {
    await f.close();
  }
});

await test("pre-commit rejects invalid active index paths before review", async () => {
  const f = await fixture();
  try {
    for (const indexFile of ["", "invalid\0index", ".cache", ".cache/missing-index"]) {
      let reviewed = false;
      await assert.rejects(
        verifyPreCommit(f.root, {
          git: f.git,
          indexFile,
          async review() {
            reviewed = true;
          },
        }),
      );
      assert.equal(reviewed, false);
    }
  } finally {
    await f.close();
  }
});
