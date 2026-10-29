import { spawnSync } from "node:child_process";
import { chmodSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
function git(args: readonly string[]) {
  const result = spawnSync("git", args, {
    cwd: root,
    encoding: "utf8",
    shell: false,
    windowsHide: true,
  });
  if (result.error) throw result.error;
  return result;
}

if (!process.versions.bun) throw new Error("Hook installation requires Bun");
if (process.argv.length > 2) throw new Error("Usage: bun app/hooks/install.ts");
const existing = git(["config", "--get", "core.hooksPath"]);
if (existing.status !== 0 && existing.status !== 1)
  throw new Error("Cannot read Git hook configuration");
if (existing.stdout.trim() && existing.stdout.trim() !== ".githooks") {
  throw new Error(
    "Existing core.hooksPath differs; integrate its hooks before changing this setting",
  );
}
if (process.platform !== "win32") {
  chmodSync(new URL("../../.githooks/pre-commit", import.meta.url), 0o755);
  chmodSync(new URL("../../.githooks/commit-msg", import.meta.url), 0o755);
}
for (const [key, value] of [
  ["teamagent.bunPath", process.execPath],
  ["core.hooksPath", ".githooks"],
] as const) {
  if (git(["config", "--local", key, value]).status !== 0) throw new Error(`Cannot set ${key}`);
}
process.stdout.write(
  "Git verification hook installed. Review and trust the project hooks in Codex to enable automatic conversation logging.\n",
);
