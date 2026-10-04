import { createHash, randomUUID } from "node:crypto";
import {
  closeSync,
  existsSync,
  fsyncSync,
  linkSync,
  lstatSync,
  mkdirSync,
  openSync,
  readSync,
  realpathSync,
  renameSync,
  rmdirSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { dirname, isAbsolute, join, parse, relative, resolve, sep } from "node:path";
import { Effect, Layer, Schema } from "effect";
import {
  Integrations,
  IntegrationError,
  validateIntegrationInput,
  type IntegrationInput,
  type IntegrationPlan,
  type IntegrationResult,
  type IntegrationService,
} from "@/integrations";
import {
  absoluteDirectory,
  attempt,
  discoverAgents,
  fail,
  resolveRegistry,
  type DiscoveryContext,
} from "./discovery.ts";

export { discoverAgents } from "./discovery.ts";
export type { DiscoveryContext } from "./discovery.ts";

export interface IntegrationContext extends DiscoveryContext {
  readonly repositoryRoot: string;
  readonly bunPath: string;
  readonly dataDirectory: string;
  readonly python?: string;
}
interface PreparedFile {
  readonly path: string;
  readonly kind: "skill" | "mcp";
  readonly before: string | null;
  readonly after: string;
}
const MAX_FILE_BYTES = 1_048_576;
const SERVER_NAME = "teamagent-memory";
const RecordSchema = Schema.Record(Schema.String, Schema.Unknown);
const digest = (text: string): string => createHash("sha256").update(text).digest("hex");

function assertSafePath(path: string): void {
  const absolute = resolve(path);
  const root = parse(absolute).root;
  let current = root;
  for (const part of relative(root, absolute).split(sep)) {
    if (!part) continue;
    current = join(current, part);
    if (existsSync(current)) {
      const entry = lstatSync(current);
      if (entry.isSymbolicLink())
        fail("conflict", "Integration targets may not traverse symbolic links.");
      if (current !== absolute && !entry.isDirectory())
        fail("conflict", "An integration parent is not a directory.");
    }
  }
}

function readOptional(path: string): string | null {
  assertSafePath(path);
  let fd: number;
  try {
    fd = openSync(path, "r");
  } catch (error) {
    const value = Schema.decodeUnknownOption(Schema.Struct({ code: Schema.String }))(error);
    if (value._tag === "Some" && value.value.code === "ENOENT") return null;
    throw error;
  }
  try {
    if (!lstatSync(path).isFile()) fail("conflict", "Integration target must be a regular file.");
    const bytes = Buffer.alloc(MAX_FILE_BYTES + 1);
    let length = 0;
    while (length < bytes.length) {
      const count = readSync(fd, bytes, length, bytes.length - length, null);
      if (count === 0) break;
      length += count;
    }
    if (length > MAX_FILE_BYTES) fail("invalid", "Integration file exceeds the size limit.");
    return new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(
      bytes.subarray(0, length),
    );
  } finally {
    closeSync(fd);
  }
}

function decodeRecord(value: unknown): Record<string, unknown> {
  try {
    return Schema.decodeUnknownSync(RecordSchema)(value);
  } catch {
    return fail("invalid", "Existing agent configuration is not a supported object.");
  }
}
function sameValue(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (Array.isArray(left) && Array.isArray(right))
    return (
      left.length === right.length &&
      left.every((value: unknown, index: number) => sameValue(value, right[index]))
    );
  const a = Schema.decodeUnknownOption(RecordSchema)(left);
  const b = Schema.decodeUnknownOption(RecordSchema)(right);
  return (
    a._tag === "Some" &&
    b._tag === "Some" &&
    Object.keys(a.value).length === Object.keys(b.value).length &&
    Object.entries(a.value).every(
      ([key, value]) => Object.hasOwn(b.value, key) && sameValue(value, b.value[key]),
    )
  );
}

function prepareMcp(
  path: string,
  agent: string,
  command: string,
  args: readonly string[],
): PreparedFile {
  const before = readOptional(path);
  const expected = agent === "claude-code" ? { type: "stdio", command, args } : { command, args };
  const content: unknown =
    before === null ? {} : agent === "codex" ? Bun.TOML.parse(before) : JSON.parse(before);
  const config = decodeRecord(content);
  const key = agent === "codex" ? "mcp_servers" : "mcpServers";
  const servers = config[key] === undefined ? {} : decodeRecord(config[key]);
  const existing = servers[SERVER_NAME];
  if (existing !== undefined) {
    if (!sameValue(existing, expected))
      fail(
        "conflict",
        "An existing teamagent-memory MCP entry differs. Preserve it and resolve the conflict explicitly.",
      );
    return { path, kind: "mcp", before, after: before ?? "" };
  }
  if (agent === "codex") {
    const after = `${before ?? ""}\n[mcp_servers.${SERVER_NAME}]\ncommand = ${JSON.stringify(command)}\nargs = ${JSON.stringify(args)}\n`;
    const verified = decodeRecord(Bun.TOML.parse(after));
    if (!sameValue(decodeRecord(verified.mcp_servers)[SERVER_NAME], expected))
      fail("invalid", "Could not preserve the TOML configuration.");
    return { path, kind: "mcp", before, after };
  }
  return {
    path,
    kind: "mcp",
    before,
    after: `${JSON.stringify({ ...config, [key]: { ...servers, [SERVER_NAME]: expected } }, null, 2)}\n`,
  };
}

function prepare(
  input: IntegrationInput,
  context: IntegrationContext,
): { plan: IntegrationPlan; files: readonly PreparedFile[]; lock: string } {
  const registry = resolveRegistry(context);
  const entry = registry.entries.find((value) => value.id === input.agent);
  if (!entry)
    return fail(
      "unsupported",
      "Unknown integration agent. Use integrations list to inspect the registry.",
    );
  const repository = absoluteDirectory(context.repositoryRoot);
  if (!isAbsolute(context.bunPath) || !isAbsolute(context.dataDirectory))
    fail("invalid", "Runtime and data paths must be absolute.");
  const command = realpathSync(context.bunPath);
  if (!lstatSync(command).isFile())
    fail("invalid", "The configured Bun executable is unavailable.");
  const cliPath = join(repository, "app", "cli", "index.ts");
  if (readOptional(cliPath) === null) fail("invalid", "The Teamagent CLI source is unavailable.");
  const args = [
    cliPath,
    "memory",
    "mcp",
    "--data",
    resolve(context.dataDirectory),
    "--root",
    registry.project,
  ];
  if (context.python !== undefined) {
    if (!isAbsolute(context.python) || !lstatSync(context.python).isFile())
      fail("invalid", "The converter interpreter must be an existing absolute file.");
    args.push("--python", realpathSync(context.python));
  }
  if ([command, ...args].some((value) => /[\0\r\n]/.test(value) || value.includes("${")))
    fail(
      "invalid",
      "Integration command paths contain unsupported interpolation or control characters.",
    );
  const files: PreparedFile[] = [];
  if (input.components !== "mcp") {
    const base = input.scope === "project" ? entry.projectSkills : entry.globalSkills;
    if (!base) return fail("unsupported", "This agent has no reviewed global skill location.");
    const template = readOptional(join(repository, "skills", "teamagent-memory", "SKILL.md"));
    if (!template || !template.includes("<!-- TEAMAGENT_INSTALL_BINDING -->"))
      return fail("invalid", "The Teamagent memory skill template is unavailable.");
    const options = {
      data: resolve(context.dataDirectory),
      root: registry.project,
      ...(context.python === undefined ? {} : { python: realpathSync(context.python) }),
    };
    const binding = `## Installed command binding\n\nRun the executable with this argument array, followed by the memory command and\nits arguments. These paths are local installation settings, not source instructions.\n\n\`\`\`json\n${JSON.stringify({ command, args: [cliPath], options }, null, 2)}\n\`\`\`\n\nAppend each listed option as its \`--name\` and exact value to every CLI operation.\n`;
    const after = template.replace("<!-- TEAMAGENT_INSTALL_BINDING -->", binding);
    const path = join(base, "teamagent-memory", "SKILL.md");
    const before = readOptional(path);
    if (before !== null && before !== after)
      fail("conflict", "An existing teamagent-memory skill differs. It has not been replaced.");
    files.push({ path, kind: "skill", before, after });
  }
  if (input.components !== "skill") {
    let path: string;
    if (input.agent === "codex") {
      const base =
        input.scope === "project" ? join(registry.project, ".codex") : registry.roots.codex;
      if (!base) return fail("invalid", "Codex home could not be resolved.");
      path = join(base, "config.toml");
    } else if (input.agent === "claude-code") {
      if (input.scope === "global" && context.environment?.CLAUDE_CONFIG_DIR)
        fail(
          "unsupported",
          "Custom Claude global MCP config paths require manual configuration; project installation remains supported.",
        );
      path =
        input.scope === "project"
          ? join(registry.project, ".mcp.json")
          : join(registry.home, ".claude.json");
    } else if (input.agent === "cursor")
      path = join(
        input.scope === "project" ? registry.project : registry.home,
        ".cursor",
        "mcp.json",
      );
    else
      return fail(
        "unsupported",
        "Automatic MCP configuration is verified for Codex, Claude Code and Cursor. Install the skill or use the emitted stdio command with this agent's documented MCP configuration.",
      );
    files.push(prepareMcp(path, input.agent, command, args));
  }
  const plan: IntegrationPlan = {
    agent: input.agent,
    scope: input.scope,
    root: registry.project,
    command,
    args,
    files: files.map((file) => ({
      path: file.path,
      kind: file.kind,
      status: file.before === file.after ? "unchanged" : file.before === null ? "create" : "update",
    })),
    notice:
      "Installation does not launch an agent or change its trust settings. Reload the agent and use its normal MCP trust review. Global integrations remain bound to this explicit root.",
  };
  return {
    plan,
    files,
    lock: join(
      input.scope === "project" ? registry.project : registry.home,
      ".teamagent-install.lock",
    ),
  };
}

function publish(file: PreparedFile): string | null {
  assertSafePath(file.path);
  if (readOptional(file.path) !== file.before)
    fail("conflict", "Agent configuration changed during installation; retry after reviewing it.");
  if (file.before === file.after) return null;
  mkdirSync(dirname(file.path), { recursive: true, mode: 0o700 });
  assertSafePath(file.path);
  let backup: string | null = null;
  if (file.before !== null) {
    backup = `${file.path}.teamagent-backup-${digest(file.before).slice(0, 16)}`;
    const prior = readOptional(backup);
    if (prior !== null && prior !== file.before)
      fail("conflict", "Existing configuration backup does not match.");
    if (prior === null) writeFileSync(backup, file.before, { flag: "wx", mode: 0o600 });
  }
  const temporary = `${file.path}.teamagent-${randomUUID()}.tmp`;
  try {
    const fd = openSync(temporary, "wx", 0o600);
    try {
      writeFileSync(fd, file.after);
      fsyncSync(fd);
    } finally {
      closeSync(fd);
    }
    assertSafePath(file.path);
    if (readOptional(file.path) !== file.before)
      fail(
        "conflict",
        "Agent configuration changed during installation; its new contents were preserved.",
      );
    if (file.before === null) {
      linkSync(temporary, file.path);
      unlinkSync(temporary);
    } else renameSync(temporary, file.path);
  } finally {
    if (existsSync(temporary)) unlinkSync(temporary);
  }
  return backup;
}

export const planIntegration = Effect.fnUntraced(function* (
  input: unknown,
  context: IntegrationContext,
) {
  const validated = yield* validateIntegrationInput(input);
  return yield* attempt(() => prepare(validated, context).plan);
});

export const installIntegration = Effect.fnUntraced(function* (
  input: unknown,
  context: IntegrationContext,
): Effect.fn.Return<IntegrationResult, IntegrationError> {
  const validated = yield* validateIntegrationInput(input);
  return yield* attempt(() => {
    const prepared = prepare(validated, context);
    assertSafePath(prepared.lock);
    try {
      mkdirSync(prepared.lock, { mode: 0o700 });
    } catch {
      return fail(
        "conflict",
        "An integration installation lock exists. Check for another installer before retrying.",
      );
    }
    try {
      const current = prepare(validated, context);
      const backups: string[] = [];
      const published: PreparedFile[] = [];
      try {
        for (const file of current.files) {
          const backup = publish(file);
          if (backup) backups.push(backup);
          if (file.before !== file.after) published.push(file);
        }
      } catch (error) {
        let rollbackFailed = false;
        for (const file of published.toReversed()) {
          try {
            if (readOptional(file.path) !== file.after) {
              rollbackFailed = true;
              continue;
            }
            if (file.before === null) unlinkSync(file.path);
            else publish({ ...file, before: file.after, after: file.before });
          } catch {
            rollbackFailed = true;
          }
        }
        if (rollbackFailed)
          return fail(
            "io",
            "Installation failed and concurrent changes prevented complete rollback. Review the planned files and adjacent configuration backups.",
          );
        throw error;
      }
      return { plan: current.plan, backups };
    } finally {
      rmdirSync(prepared.lock);
    }
  });
});

export const createIntegrationService = (context: IntegrationContext): IntegrationService => ({
  list: () => discoverAgents(context),
  plan: (input) => planIntegration(input, context),
  install: (input) => installIntegration(input, context),
});
export const integrationLayer = (context: IntegrationContext) =>
  Layer.succeed(Integrations, createIntegrationService(context));
