import { fileURLToPath } from "node:url";
import { physicalToolPath, toolchainPins } from "../check/toolchain.ts";
import { checkCommitMessage } from "../workflow/commit-message.ts";
import { runPreCommit } from "../workflow/pre-commit.ts";

const root = fileURLToPath(new URL("../../", import.meta.url));
const args = process.argv.slice(2);
const hook = args[0];
const message = args[1];
if (
  !(
    (hook === "pre-commit" && args.length === 1) ||
    (hook === "commit-msg" &&
      args.length === 2 &&
      message &&
      message.length <= 32768 &&
      !/[\0\r\n]/u.test(message))
  )
)
  throw new Error("Expected pre-commit or commit-msg with one bounded message-file path");
physicalToolPath(process.execPath, "bun");
if (process.versions.bun !== toolchainPins(root).bun)
  throw new Error("Git hooks require the repository's pinned physical Bun version");
if (hook === "pre-commit") await runPreCommit(root);
else if (message !== undefined) await checkCommitMessage(message);
