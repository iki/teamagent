import { fileURLToPath } from "node:url";
import { lstat, realpath } from "node:fs/promises";
import { resolve } from "node:path";
import { verifyStagedVerificationReceipts } from "../check/verification-cache.ts";
import { gitAt, worktreeTree, type Git } from "./git.ts";
import { verificationHost } from "./workflow.ts";
import type { VerificationWritePolicy } from "../check/verification-policy.ts";

class PreCommitBoundaryError extends Error {}

interface PreCommitHost {
  readonly git?: Git;
  readonly review?: (
    root: string,
    options: { readonly receiptWritePolicy: VerificationWritePolicy },
  ) => Promise<void>;
  readonly staged?: typeof verifyStagedVerificationReceipts;
  readonly indexFile?: string;
}

async function activeIndex(root: string, value: string | undefined): Promise<string | undefined> {
  if (value === undefined) return undefined;
  if (!value || value.length > 32768 || /[\0\r\n]/u.test(value))
    throw new PreCommitBoundaryError("Pre-commit index path is invalid.");
  const path = resolve(root, value);
  const info = await lstat(path);
  const canonical = await realpath(path);
  const samePath =
    process.platform === "win32"
      ? canonical.toLowerCase() === path.toLowerCase()
      : canonical === path;
  if (!info.isFile() || info.isSymbolicLink() || info.size > 64 * 1024 * 1024 || !samePath)
    throw new PreCommitBoundaryError("Pre-commit index must be a bounded regular, unlinked file.");
  return path;
}

/** Preserve existing unstaged work while rejecting any tree changed by verification. */
export async function verifyPreCommit(root: string, host: PreCommitHost = {}): Promise<void> {
  const indexFile = await activeIndex(root, host.indexFile);
  const baseGit = host.git ?? gitAt(root);
  const git: Git = (args, input, index) => baseGit(args, input, index ?? indexFile);
  const tree = (value: string): string => {
    const result = value.trim();
    if (!/^[a-f0-9]{40}(?:[a-f0-9]{24})?$/u.test(result))
      throw new PreCommitBoundaryError("Pre-commit Git tree identity is invalid.");
    return result;
  };
  async function snapshot(): Promise<{ staged: string; working: string }> {
    const staged = tree(await git(["write-tree"]));
    const working = tree(await worktreeTree(root, git));
    if (tree(await git(["write-tree"])) !== staged)
      throw new PreCommitBoundaryError("The Git index changed during pre-commit inspection.");
    return { staged, working };
  }
  const before = await snapshot();
  await (
    host.review ?? ((directory, options) => verificationHost.run(directory, "review", options))
  )(root, { receiptWritePolicy: "local" });
  await (host.staged ?? verifyStagedVerificationReceipts)(
    root,
    indexFile === undefined ? {} : { indexFile },
  );
  const after = await snapshot();
  if (before.staged !== after.staged || before.working !== after.working)
    throw new PreCommitBoundaryError(
      "Pre-commit verification changed the staged or working tree. Review and stage the changed files, then verify again before committing.",
    );
}

if (import.meta.main) {
  const root = fileURLToPath(new URL("../../", import.meta.url));
  try {
    const indexFile = process.env.GIT_INDEX_FILE;
    await verifyPreCommit(root, indexFile === undefined ? {} : { indexFile });
    process.stderr.write("Review and staged verification receipts passed without tree drift.\n");
  } catch (error) {
    process.stderr.write(
      error instanceof PreCommitBoundaryError
        ? `${error.message}\n`
        : "Pre-commit verification failed; inspect .cache/workflow/verification.log.\n",
    );
    process.exitCode = 1;
  }
}
