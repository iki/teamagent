#!/usr/bin/env bun
import { cli } from "cleye";
import { createConsola } from "consola";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { version } from "../../package.json";

const parsed = cli({
  name: "teamagent-research",
  parameters: ["[action]"],
  strictFlags: true,
  flags: {
    root: {
      type: String,
      description: "Project root with .env, owned git-sources.json and text source lists",
    },
    xApi: {
      type: Boolean,
      description:
        "Use official X API for initial or refresh-marked posts only; captured static posts stay offline",
    },
    limit: { type: Number, description: "Maximum sources per stage (default all)" },
    category: { type: String, description: "One Git source category" },
    repository: { type: String, description: "One exact repository report ID" },
    noAutoStash: { type: Boolean, description: "Preserve dirty repositories without updating" },
    usePrimaryBranch: {
      type: Boolean,
      description:
        "Preserve an untracked local branch and switch to the verified remote primary branch",
    },
    timeoutSeconds: { type: Number, description: "Per Git operation timeout (default 120)" },
    concurrency: { type: Number, description: "Parallel Git workers (default 4)" },
    version: { type: Boolean, alias: "V", description: "Show version" },
  },
  help: {
    version,
    description:
      "Maintain source lists, Git checkouts, analysis evidence and text resources.\nActions: sources imports external lists into owned git-sources.json; repos uses that owned inventory; status inspects checkouts without publishing; observe records all known local checkout revisions for analysis without fetching; analysis prepares evidence; texts captures uncaptured resources and checks captured static snapshots locally unless marked refresh=true; sync runs all stages.",
  },
});
const logger = createConsola({
  reporters: [
    {
      log: (entry) => process.stderr.write(`${entry.type}: ${entry.args.map(String).join(" ")}\n`),
    },
  ],
});
const scripts = fileURLToPath(new URL("./", import.meta.url));

async function run(command: string, args: readonly string[], cwd: string): Promise<number> {
  return await new Promise<number>((resolveStatus, reject) => {
    const child = spawn(command, [...args], {
      cwd,
      shell: false,
      windowsHide: true,
      stdio: "inherit",
    });
    const cancel = () => child.kill();
    process.once("SIGINT", cancel);
    process.once("SIGTERM", cancel);
    const timer = setTimeout(cancel, 4 * 60 * 60 * 1000);
    const cleanup = () => {
      clearTimeout(timer);
      process.off("SIGINT", cancel);
      process.off("SIGTERM", cancel);
    };
    child.once("error", () => {
      cleanup();
      reject(new Error("Cannot launch research maintenance tool."));
    });
    child.once("close", (status) => {
      cleanup();
      resolveStatus(status ?? 1);
    });
  });
}

async function main(): Promise<void> {
  if (parsed.flags.version) {
    process.stdout.write(`${version}\n`);
    return;
  }
  const action = parsed._.action ?? "";
  if (!["sources", "repos", "status", "observe", "analysis", "texts", "sync"].includes(action))
    throw new Error("Unknown research action; use --help.");
  if (parsed._["--"].length) throw new Error("Unexpected positional arguments.");
  if (
    action === "observe" &&
    (parsed.flags.limit !== undefined ||
      parsed.flags.category !== undefined ||
      parsed.flags.repository !== undefined ||
      parsed.flags.noAutoStash ||
      parsed.flags.usePrimaryBranch ||
      parsed.flags.xApi)
  )
    throw new Error(
      "Observe inspects all known checkouts and does not accept update or source-selection options.",
    );
  for (const value of [parsed.flags.limit, parsed.flags.timeoutSeconds, parsed.flags.concurrency])
    if (value !== undefined && (!Number.isSafeInteger(value) || value < 1))
      throw new Error("Limits, timeouts and concurrency must be positive integers.");
  const root = resolve(parsed.flags.root ?? fileURLToPath(new URL("../../", import.meta.url)));
  const gitArgs = [
    "-NoLogo",
    "-NoProfile",
    "-NonInteractive",
    "-File",
    resolve(scripts, "git-sync.ps1"),
    "-ProjectRoot",
    root,
  ];
  if (parsed.flags.limit !== undefined) gitArgs.push("-Limit", String(parsed.flags.limit));
  if (parsed.flags.category !== undefined) gitArgs.push("-Category", parsed.flags.category);
  if (parsed.flags.timeoutSeconds !== undefined)
    gitArgs.push("-TimeoutSeconds", String(parsed.flags.timeoutSeconds));
  if (parsed.flags.concurrency !== undefined)
    gitArgs.push("-Concurrency", String(parsed.flags.concurrency));
  if (parsed.flags.repository !== undefined) gitArgs.push("-Repository", parsed.flags.repository);
  if (parsed.flags.noAutoStash) gitArgs.push("-NoAutoStash");
  if (parsed.flags.usePrimaryBranch) gitArgs.push("-UsePrimaryBranch");
  const shell = "pwsh";
  const stages = action === "sync" ? ["sources", "repos", "analysis", "texts"] : [action];
  let failed = false;
  for (const stage of stages) {
    logger.info(`Starting ${stage}.`);
    let status: number;
    if (stage === "sources" || stage === "repos" || stage === "status" || stage === "observe") {
      status = await run(
        shell,
        [...gitArgs, "-Action", stage === "sources" ? "lists" : stage === "repos" ? "sync" : stage],
        root,
      );
    } else {
      const args = [
        resolve(scripts, stage === "analysis" ? "analysis-sync.ts" : "text-sync.ts"),
        "--root",
        root,
      ];
      if (stage === "analysis") args.push("--write");
      if (stage === "texts" && parsed.flags.xApi) args.push("--x-api");
      if (stage === "texts" && parsed.flags.limit !== undefined)
        args.push("--limit", String(parsed.flags.limit));
      status = await run(process.execPath, args, root);
    }
    if (status !== 0) {
      failed = true;
      logger.warn(`${stage} reported incomplete work (exit ${status}); inspect its report.`);
      // A failed list publication must never cause updates from stale or different inputs.
      if (stage === "sources") break;
    }
  }
  if (failed) process.exitCode = 1;
}
await main().catch(() => {
  logger.error("Research maintenance failed; inspect the stage report and --help.");
  process.exitCode = 1;
});
