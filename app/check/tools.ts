import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { verificationLocaleEnvironment } from "./verification-policy.ts";
import { spawnOwned } from "./owned-process.ts";
import { createTemporaryWorkspace, temporaryParent } from "./temporary-workspace.ts";
import { resolveNativeTypeScript } from "./native-typescript.ts";

export const root = fileURLToPath(new URL("../../", import.meta.url));

const entries = {
  format: "oxfmt/bin/oxfmt",
  typecheck: "@typescript/native-preview/bin/tsgo",
  lint: "oxlint/bin/oxlint",
};

export type Tool = keyof typeof entries;

/** Scope checks to maintained code and configuration, leaving research imports intact. */
export const sourcePaths = ["app", "lib", "test", "oxlint.config.ts", "extractors.config.ts"];
export const formatPaths = [
  ...sourcePaths,
  "package.json",
  "tsconfig.json",
  "tsconfig.lib.json",
  "tsconfig.tools.json",
  "aube-workspace.yaml",
  "spec/harness.md",
  "spec/harness-verification.md",
  "spec/memory-imports.md",
  "spec/media-runtime.md",
  "spec/benchmarks",
  "spec/benchmark-competitors.md",
  "skills",
  "THIRD_PARTY_NOTICES.md",
  ".oxfmtrc.json",
  ".codex/hooks.json",
  ".agents/hooks",
  "AGENTS.md",
  "README.md",
  "spec/architecture",
  "spec/conversation-logging.md",
  "spec/verification.md",
  "spec/workflow.md",
  "spec/parallel-workflow.md",
  "spec/reusable-skills.md",
  "spec/dependencies.md",
  "spec/cache.md",
  "spec/resources.md",
  "spec/project-launcher.md",
  ".workflow.json",
  "patches/trigon/registry.json",
  "spec/skills-audit.md",
];

export function isTool(value: string | undefined): value is Tool {
  return value !== undefined && Object.hasOwn(entries, value);
}

/** Own installed tool execution; native TypeScript skips its unhidden JS child launch. */
export async function runTool(tool: Tool, args: readonly string[]): Promise<number> {
  if (!process.versions.bun) throw new Error("Repository tools require Bun");

  const env = verificationLocaleEnvironment(process.env);
  if (tool === "lint") {
    // Use the native backend directly: Windows package-manager shims require Node.
    const backend = createRequire(import.meta.resolve("oxlint-tsgolint/package.json"));
    env.OXLINT_TSGOLINT_PATH = backend.resolve(
      `@oxlint-tsgolint/${process.platform}-${process.arch}/tsgolint${process.platform === "win32" ? ".exe" : ""}`,
    );
  }

  const paths = tool === "format" ? formatPaths : tool === "lint" ? sourcePaths : [];
  const executable = tool === "typecheck" ? await resolveNativeTypeScript(root) : process.execPath;
  const arguments_ = [
    ...(tool === "typecheck" ? [] : [resolve(root, "node_modules", entries[tool])]),
    ...args,
    ...paths.filter((path) => existsSync(resolve(root, path))),
  ];
  const parent = await temporaryParent(env, root);
  const controller = new AbortController();
  const interrupt = (): void => controller.abort();
  process.once("SIGINT", interrupt);
  process.once("SIGTERM", interrupt);
  let workspace: Awaited<ReturnType<typeof createTemporaryWorkspace>> | undefined;
  let safeToDispose = true;
  try {
    workspace = await createTemporaryWorkspace(parent?.root ?? root, `tool-${tool}`, parent);
    const owned = await spawnOwned(executable, arguments_, {
      cwd: root,
      stdio: "inherit",
      env: workspace.environment(env),
      timeoutMs: 120_000,
      signal: controller.signal,
    });
    safeToDispose = false;
    const result = await owned.closed;
    safeToDispose = result.termination === "closed";
    if (!safeToDispose) throw new Error("Verification tool cleanup could not be confirmed");
    if (result.error) throw result.error;
    controller.signal.throwIfAborted();
    return result.code ?? 1;
  } finally {
    try {
      if (safeToDispose) await workspace?.dispose();
    } finally {
      process.removeListener("SIGINT", interrupt);
      process.removeListener("SIGTERM", interrupt);
    }
  }
}
