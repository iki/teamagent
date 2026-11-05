import { cli } from "cleye";
import { createConsola } from "consola";
import { Schema } from "effect";
import { version } from "../../package.json";
import { launchProject, projectLauncherIdentity } from "./project-launcher.ts";

const argv = cli({
  name: "project-launch",
  strictFlags: true,
  flags: {
    version: { type: Boolean, alias: "V", description: "Show the shared Teamagent version" },
    project: { type: String, description: "Absolute physical target checkout" },
    tool: { type: String, description: "Pinned bun or aube; default bun" },
    bunPath: { type: String, description: "Absolute physical Bun override" },
    aubePath: { type: String, description: "Absolute physical Aube override" },
    misePath: { type: String, description: "Opt in to trusted native Windows Mise evaluation" },
    path: { type: [String], description: "Replacement PATH directory; repeat for each" },
    timeout: { type: Number, description: "Owned command timeout in milliseconds" },
    identity: { type: Boolean, description: "Print implementation identity without launching" },
  },
  help: {
    version,
    description: "Run a project's pinned tool with its environment and owned cleanup.",
    usage: "project-launch --project <absolute-root> [flags] -- <tool arguments...>",
  },
});

const reporter = createConsola({
  reporters: [
    {
      log: (entry) => process.stderr.write(`${entry.type}: ${entry.args.map(String).join(" ")}\n`),
    },
  ],
});

try {
  if (argv.flags.version) process.stdout.write(`${version}\n`);
  else if (argv.flags.identity) {
    if (
      argv._.length ||
      argv.flags.project !== undefined ||
      argv.flags.tool !== undefined ||
      argv.flags.bunPath !== undefined ||
      argv.flags.aubePath !== undefined ||
      argv.flags.misePath !== undefined ||
      argv.flags.path.length ||
      argv.flags.timeout !== undefined
    )
      throw new Error("--identity cannot be combined with launch options or arguments");
    process.stdout.write(`${await projectLauncherIdentity()}\n`);
  } else {
    if (!argv.flags.project) throw new Error("--project is required");
    if (argv._.length !== argv._["--"].length || !argv._["--"].length)
      throw new Error("Place tool arguments after --");
    let tool: "bun" | "aube";
    try {
      tool = Schema.decodeUnknownSync(Schema.Literals(["bun", "aube"]))(argv.flags.tool ?? "bun");
    } catch {
      throw new Error("--tool must be bun or aube");
    }
    const cancellation = new AbortController();
    const cancel = (): void => cancellation.abort();
    process.once("SIGINT", cancel);
    process.once("SIGTERM", cancel);
    try {
      const running = await launchProject({
        projectRoot: argv.flags.project,
        tool,
        args: argv._["--"],
        runtimes: {
          ...(argv.flags.bunPath === undefined ? {} : { bun: argv.flags.bunPath }),
          ...(argv.flags.aubePath === undefined ? {} : { aube: argv.flags.aubePath }),
        },
        ...(argv.flags.misePath === undefined ? {} : { misePath: argv.flags.misePath }),
        ...(argv.flags.path.length ? { pathDirectories: argv.flags.path } : {}),
        ...(argv.flags.timeout === undefined ? {} : { timeoutMs: argv.flags.timeout }),
        stdio: "inherit",
        signal: cancellation.signal,
      });
      const result = await running.closed;
      if (result.error) throw result.error;
      if (result.termination !== "closed")
        throw new Error("Project descendant shutdown is unconfirmed");
      process.exitCode = result.code ?? 1;
    } finally {
      process.removeListener("SIGINT", cancel);
      process.removeListener("SIGTERM", cancel);
    }
  }
} catch (error) {
  reporter.error(error instanceof Error ? error.message : "Project launch failed");
  process.exitCode = 1;
}
