#!/usr/bin/env bun
import { cli } from "cleye";
import { createConsola } from "consola";
import { configure, dispose } from "@logtape/logtape";
import { Effect, Schema } from "effect";
import { open } from "node:fs/promises";
import { resolve } from "node:path";
import { createInterface } from "node:readline";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { cli as workspacesCli, WorkspaceSchema } from "@/workspaces";
import { cli as tasksCli, TaskSchema } from "@/tasks";
import { cli as agentsCli } from "@/agents";
import { cli as artifactsCli } from "@/artifacts";
import {
  cli as harnessCli,
  WorkspacesSchema,
  TasksSchema,
  EventsSchema,
  ArtifactsSchema,
  AgentsSchema,
  HealthSchema,
} from "@/harness";
import { cli as lintCli } from "@/lint";
import { cli as memoryCli, MemoryError } from "@/memory";
import { cli as integrationsCli, IntegrationError } from "@/integrations";
import { version } from "../../package.json";
import { readConfig } from "./config.ts";
import { connectClient } from "./client.ts";
import { startDaemon } from "../server/index.ts";
import { readToken } from "../server/credentials.ts";
import { catalogModels } from "../adapters/models.ts";
import { runMemoryCommand } from "./memory.ts";
import { runIntegrationCommand } from "./integrations.ts";

const catalog = [
  harnessCli,
  workspacesCli,
  tasksCli,
  agentsCli,
  artifactsCli,
  memoryCli,
  integrationsCli,
  lintCli,
] as const;
type ModuleCommand<M extends (typeof catalog)[number] = (typeof catalog)[number]> =
  M extends (typeof catalog)[number] ? `${M["name"]}:${M["commands"][number]["name"]}` : never;
const reporter = createConsola({
  reporters: [
    {
      log: (entry) => process.stderr.write(`${entry.type}: ${entry.args.map(String).join(" ")}\n`),
    },
  ],
});
const flags = {
  version: { type: Boolean, alias: "V", description: "Show version" },
  config: { type: String, alias: "C", description: "Explicit trusted configuration file" },
  data: { type: String, alias: "D", description: "Local state directory" },
  port: { type: Number, description: "Service port (0 selects a free port when serving)" },
  url: { type: String, description: "Running loopback service origin" },
  workspace: { type: String, description: "Registered workspace ID" },
  name: { type: String, description: "Workspace display name" },
  adapter: { type: String, description: "inspect or configured pi" },
  duration: { type: Number, description: "Task time limit in milliseconds (default 120000)" },
  turns: { type: Number, description: "Maximum model turns (default 8)" },
  write: { type: Boolean, description: "Grant scoped file writes for this task" },
  key: { type: String, description: "Idempotency key for task submission" },
  output: { type: String, description: "Exclusive artifact export file path" },
  desktop: { type: Boolean, description: "Desktop sidecar mode (requires TEAMAGENT_TOKEN)" },
  root: { type: String, description: "Memory workspace or integration project directory" },
  kind: { type: String, description: "Source kind: auto, url, file, folder or git" },
  convert: { type: Boolean, description: "Convert source to Markdown and images (default true)" },
  sourceVersion: { type: String, description: "Immutable source version ID" },
  path: { type: String, description: "Path within the imported version" },
  limit: { type: Number, description: "Maximum search results or list/history page size" },
  offset: { type: Number, description: "Page offset, or byte offset for memory read" },
  length: { type: Number, description: "Maximum memory read bytes (1–262144)" },
  scope: { type: String, description: "Integration installation scope: project or global" },
  components: { type: String, description: "Install skill, mcp or both" },
  python: {
    type: String,
    description: "Explicit Python interpreter with the pinned document converter",
  },
  allowRoot: {
    type: [String] as const,
    description: "Additional local source directory allowed for MCP (repeatable)",
  },
  allowPrivateNetwork: {
    type: Boolean,
    description: "Allow retrieval from private networks for this invocation",
  },
};
const commands = catalog.flatMap((module) =>
  module.commands.map((command) => `  ${module.name} ${command.name} — ${command.description}`),
);
const parsed = cli({
  name: "teamagent",
  parameters: ["[module]", "[action]", "[arguments...]"],
  flags,
  strictFlags: true,
  help: {
    version,
    description: `Local agent work, shared across CLI, web and desktop.\n\n${commands.join("\n")}`,
    examples: [
      "teamagent harness serve",
      "teamagent workspaces add C:/work/project --name Project",
      'teamagent tasks add "Inspect this workspace" --workspace <id> --adapter inspect',
    ],
  },
});
const print = (value: unknown) => process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);

async function main() {
  if (parsed.flags.version) {
    process.stdout.write(`${version}\n`);
    return;
  }
  const module = parsed._.module ?? "harness";
  const action = parsed._.action ?? (parsed._.module === "serve" ? "serve" : "modules");
  const moduleName = module === "serve" ? "harness" : module;
  if (
    !catalog.some(
      (entry) => entry.name === moduleName && entry.commands.some((item) => item.name === action),
    )
  )
    throw new Error("Unknown module command; use --help");
  const args = parsed._.arguments;
  const allowed = {
    "harness:serve": ["config", "data", "port", "desktop"],
    "harness:status": ["config", "data", "url", "port"],
    "harness:modules": [],
    "harness:token": ["config", "data"],
    "workspaces:add": ["config", "data", "url", "port", "name"],
    "workspaces:list": ["config", "data", "url", "port"],
    "workspaces:show": ["config", "data", "url", "port"],
    "tasks:add": [
      "config",
      "data",
      "url",
      "port",
      "workspace",
      "adapter",
      "duration",
      "turns",
      "write",
      "key",
    ],
    "tasks:list": ["config", "data", "url", "port"],
    "tasks:show": ["config", "data", "url", "port"],
    "tasks:cancel": ["config", "data", "url", "port"],
    "agents:list": ["config", "data", "url", "port"],
    "agents:models": [],
    "artifacts:list": ["config", "data", "url", "port"],
    "artifacts:show": ["config", "data", "url", "port"],
    "artifacts:export": ["config", "data", "url", "port", "output"],
    "lint:check": [],
    "memory:get": [
      "config",
      "data",
      "root",
      "workspace",
      "kind",
      "convert",
      "python",
      "allowPrivateNetwork",
    ],
    "memory:sync": ["config", "data", "root", "workspace", "python", "allowPrivateNetwork"],
    "memory:list": ["config", "data", "root", "workspace", "offset", "limit"],
    "memory:show": ["config", "data", "root", "workspace", "offset", "limit"],
    "memory:read": [
      "config",
      "data",
      "root",
      "workspace",
      "sourceVersion",
      "path",
      "offset",
      "length",
    ],
    "memory:search": ["config", "data", "root", "workspace", "limit"],
    "memory:export": ["config", "data", "root", "workspace", "sourceVersion", "output"],
    "memory:delete": ["config", "data", "root", "workspace"],
    "memory:mcp": [
      "config",
      "data",
      "root",
      "workspace",
      "python",
      "allowRoot",
      "allowPrivateNetwork",
    ],
    "memory:doctor": ["python"],
    "memory:setup": [],
    "integrations:list": ["config", "data", "root"],
    "integrations:plan": ["config", "data", "root", "scope", "components", "python"],
    "integrations:install": ["config", "data", "root", "scope", "components", "python"],
  } satisfies Record<ModuleCommand, readonly string[]>;
  const options: Readonly<Record<string, readonly string[]>> = allowed;
  const accepted = options[`${moduleName}:${action}`];
  if (!accepted) throw new Error("Module command is not wired to its host adapter");
  for (const [name, value] of Object.entries(parsed.flags))
    if (
      value !== undefined &&
      !(Array.isArray(value) && value.length === 0) &&
      name !== "version" &&
      name !== "help" &&
      !accepted.includes(name)
    )
      throw new Error(`--${name} is not supported by this command`);
  const positionalCount =
    moduleName === "memory"
      ? ["get", "sync", "show", "read", "search", "export", "delete"].includes(action)
        ? 1
        : 0
      : moduleName === "integrations"
        ? action === "list"
          ? 0
          : 1
        : ["add", "show", "cancel", "export"].includes(action) || moduleName === "artifacts"
          ? 1
          : 0;
  if (args.length !== positionalCount || parsed._["--"].length > 0)
    throw new Error(`Expected ${positionalCount} positional argument(s); use --help`);
  if (moduleName === "harness" && action === "modules") {
    print(catalog.map((entry) => ({ ...entry, api: `@/${entry.name}` })));
    return;
  }
  if (moduleName === "lint") {
    const result = spawnSync(
      process.execPath,
      [fileURLToPath(new URL("../check/index.ts", import.meta.url))],
      { stdio: "inherit", shell: false, windowsHide: true },
    );
    process.exitCode = result.status ?? 1;
    return;
  }
  if (moduleName === "agents" && action === "models") {
    print(catalogModels());
    return;
  }
  const config = await Effect.runPromise(
    readConfig({ config: parsed.flags.config, data: parsed.flags.data, port: parsed.flags.port }),
  );
  if (moduleName === "memory") {
    await runMemoryCommand(action, args[0], config, parsed.flags, print);
    return;
  }
  if (moduleName === "integrations") {
    await runIntegrationCommand(action, args[0], config, parsed.flags, print);
    return;
  }
  if (moduleName === "harness" && action === "token") {
    process.stdout.write(`${await readToken(config.data)}\n`);
    return;
  }
  if (moduleName === "harness" && action === "serve") {
    if (parsed.flags.desktop && !process.env.TEAMAGENT_TOKEN)
      throw new Error("Desktop mode requires its host pairing credential");
    await configure({
      sinks: {
        stderr: (record) => {
          process.stderr.write(`${record.level}: ${record.message.map(String).join("")}\n`);
        },
      },
      loggers: [
        { category: ["teamagent"], lowestLevel: "info", sinks: ["stderr"] },
        { category: ["logtape", "meta"], sinks: [] },
      ],
    });
    let daemon;
    try {
      daemon = await startDaemon({
        config,
        desktop: parsed.flags.desktop,
        token: parsed.flags.desktop ? process.env.TEAMAGENT_TOKEN : undefined,
      });
    } catch (error) {
      await dispose();
      throw error;
    }
    process.stdout.write(`${JSON.stringify({ url: daemon.url, dataDirectory: config.data })}\n`);
    if (!parsed.flags.desktop)
      reporter.info(
        `Open ${daemon.url}. Use 'harness token' with the same data directory to pair the browser.`,
      );
    let closing = false;
    const shutdown = async () => {
      if (closing) return;
      closing = true;
      try {
        await daemon.close();
      } finally {
        await dispose();
      }
    };
    process.once("SIGINT", () => {
      void shutdown().catch(() => {
        process.exitCode = 1;
      });
    });
    process.once("SIGTERM", () => {
      void shutdown().catch(() => {
        process.exitCode = 1;
      });
    });
    if (parsed.flags.desktop) {
      const input = createInterface({ input: process.stdin });
      input.on("line", (line) => {
        if (line === "shutdown") {
          input.close();
          process.stdin.destroy();
          void shutdown().catch(() => {
            process.exitCode = 1;
          });
        }
      });
      input.once("close", () => {
        void shutdown().catch(() => {
          process.exitCode = 1;
        });
      });
    }
    return;
  }
  const client = await connectClient(config.data, parsed.flags.url, config.port);
  const argument = args[0];
  switch (`${moduleName}:${action}`) {
    case "harness:status":
      print(Schema.decodeUnknownSync(HealthSchema)(await client.request("/api/health")));
      break;
    case "workspaces:list":
      print(Schema.decodeUnknownSync(WorkspacesSchema)(await client.request("/api/workspaces")));
      break;
    case "workspaces:add": {
      if (!argument || !parsed.flags.name)
        throw new Error("Workspace path and --name are required");
      print(
        Schema.decodeUnknownSync(WorkspaceSchema)(
          await client.request("/api/workspaces", "POST", {
            name: parsed.flags.name,
            path: resolve(argument),
          }),
        ),
      );
      break;
    }
    case "workspaces:show": {
      const workspaces = Schema.decodeUnknownSync(WorkspacesSchema)(
        await client.request("/api/workspaces"),
      );
      const workspace = workspaces.find((item) => item.id === argument);
      if (!workspace) throw new Error("Workspace not found");
      print(workspace);
      break;
    }
    case "tasks:list":
      print(Schema.decodeUnknownSync(TasksSchema)(await client.request("/api/tasks")));
      break;
    case "tasks:add": {
      if (!argument || !parsed.flags.workspace)
        throw new Error("Objective and --workspace are required");
      print(
        Schema.decodeUnknownSync(TaskSchema)(
          await client.request("/api/tasks", "POST", {
            objective: argument,
            workspaceId: parsed.flags.workspace,
            adapterId: parsed.flags.adapter ?? "inspect",
            ...(parsed.flags.duration === undefined
              ? {}
              : { maxDurationMs: parsed.flags.duration }),
            ...(parsed.flags.turns === undefined ? {} : { maxTurns: parsed.flags.turns }),
            ...(parsed.flags.write === undefined ? {} : { allowWrites: parsed.flags.write }),
            ...(parsed.flags.key === undefined ? {} : { idempotencyKey: parsed.flags.key }),
          }),
        ),
      );
      break;
    }
    case "tasks:show": {
      if (!argument) throw new Error("Task ID required");
      const id = encodeURIComponent(argument);
      const [task, events, artifacts] = await Promise.all([
        client.request(`/api/tasks/${id}`),
        client.request(`/api/tasks/${id}/events`),
        client.request(`/api/tasks/${id}/artifacts`),
      ]);
      print({
        task: Schema.decodeUnknownSync(TaskSchema)(task),
        events: Schema.decodeUnknownSync(EventsSchema)(events),
        artifacts: Schema.decodeUnknownSync(ArtifactsSchema)(artifacts),
      });
      break;
    }
    case "tasks:cancel":
      if (argument)
        print(
          Schema.decodeUnknownSync(TaskSchema)(
            await client.request(`/api/tasks/${encodeURIComponent(argument)}/cancel`, "POST"),
          ),
        );
      break;
    case "agents:list":
      print(Schema.decodeUnknownSync(AgentsSchema)(await client.request("/api/agents")));
      break;
    case "artifacts:list":
      if (argument)
        print(
          Schema.decodeUnknownSync(ArtifactsSchema)(
            await client.request(`/api/tasks/${encodeURIComponent(argument)}/artifacts`),
          ),
        );
      break;
    case "artifacts:show":
      if (argument) {
        const bytes = await client.download(argument);
        print({ id: argument, encoding: "base64", content: Buffer.from(bytes).toString("base64") });
      }
      break;
    case "artifacts:export": {
      if (!argument || !parsed.flags.output)
        throw new Error("Artifact ID and --output are required");
      const bytes = await client.download(argument);
      const file = await open(resolve(parsed.flags.output), "wx", 0o600);
      try {
        await file.writeFile(bytes);
      } finally {
        await file.close();
      }
      print({ path: resolve(parsed.flags.output), size: bytes.length });
      break;
    }
    default:
      throw new Error("Command implementation missing");
  }
}

await main().catch((error: unknown) => {
  if (error instanceof MemoryError || error instanceof IntegrationError) {
    reporter.error(`${error.code}: ${error.message}`);
    process.exitCode = 1;
    return;
  }
  reporter.error(
    "Command failed. Check arguments, trusted configuration, service availability and local permissions. Use --help for the command contract.",
  );
  process.exitCode = 1;
});
