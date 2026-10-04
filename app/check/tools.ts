import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const root = fileURLToPath(new URL("../../", import.meta.url));

const entries = {
  format: "oxfmt/bin/oxfmt",
  typecheck: "@typescript/native-preview/bin/tsgo",
  lint: "oxlint/bin/oxlint",
};

export type Tool = keyof typeof entries;

/** Scope checks to maintained code and configuration, leaving research imports intact. */
const sourcePaths = ["app", "lib", "test", "oxlint.config.ts"];
const formatPaths = [
  ...sourcePaths,
  "package.json",
  "tsconfig.json",
  ".oxfmtrc.json",
  "AGENTS.md",
  "README.md",
  "spec/architecture",
  "spec/conversation-logging.md",
  "spec/verification.md",
];

export function isTool(value: string | undefined): value is Tool {
  return value !== undefined && Object.hasOwn(entries, value);
}

/** Run installed JavaScript tool entries through the current Bun executable. */
export function runTool(tool: Tool, args: readonly string[]): number {
  if (!process.versions.bun) throw new Error("Repository tools require Bun");

  const env = { ...process.env };
  if (tool === "lint") {
    // Use the native backend directly: Windows package-manager shims require Node.
    const backend = createRequire(import.meta.resolve("oxlint-tsgolint/package.json"));
    env.OXLINT_TSGOLINT_PATH = backend.resolve(
      `@oxlint-tsgolint/${process.platform}-${process.arch}/tsgolint${process.platform === "win32" ? ".exe" : ""}`,
    );
  }

  const paths = tool === "format" ? formatPaths : tool === "lint" ? sourcePaths : [];
  const result = spawnSync(
    process.execPath,
    [
      resolve(root, "node_modules", entries[tool]),
      ...args,
      ...paths.filter((path) => existsSync(resolve(root, path))),
    ],
    { cwd: root, stdio: "inherit", shell: false, windowsHide: true, env },
  );
  if (result.error) throw result.error;
  return result.status ?? 1;
}
