import { afterEach, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { Effect, Schema } from "effect";
import { IntegrationError, IntegrationResultSchema } from "@/integrations";
import {
  createIntegrationService,
  discoverAgents,
  type IntegrationContext,
} from "../app/integrations/index.ts";

const temporary: string[] = [];
afterEach(() => {
  for (const path of temporary.splice(0)) {
    if (!realpathSync(path).startsWith(realpathSync(tmpdir())))
      throw new Error("Test cleanup escaped temporary root.");
    rmSync(path, { recursive: true, force: true });
  }
});
function fixture(): IntegrationContext {
  const root = mkdtempSync(join(tmpdir(), "teamagent-integrations-"));
  temporary.push(root);
  const home = join(root, "home");
  const projectRoot = join(root, "project with spaces");
  mkdirSync(home);
  mkdirSync(projectRoot);
  return {
    home,
    projectRoot,
    repositoryRoot: resolve(import.meta.dir, ".."),
    bunPath: process.execPath,
    dataDirectory: join(root, "data"),
    searchPath: "",
  };
}
const input = (
  agent = "codex",
  scope: "project" | "global" = "project",
  components: "skill" | "mcp" | "both" = "both",
) => ({ agent, scope, components });
async function failure(
  effect: Effect.Effect<unknown, IntegrationError>,
): Promise<IntegrationError> {
  const result = await Effect.runPromise(effect.pipe(Effect.result));
  if (result._tag !== "Failure") throw new Error("Expected typed integration failure.");
  return result.failure;
}

test("discovery reuses the complete registry and separates directory, executable and readiness evidence", async () => {
  const context = fixture();
  mkdirSync(join(context.home, ".codex"));
  mkdirSync(join(context.home, ".pi", "agent"), { recursive: true });
  const bin = join(context.home, "bin");
  mkdirSync(bin);
  const executable = join(bin, process.platform === "win32" ? "claude.cmd" : "claude");
  writeFileSync(executable, "not actually executable code", { mode: 0o700 });
  const agents = await Effect.runPromise(discoverAgents({ ...context, searchPath: bin }));
  expect(agents.length).toBe(79);
  const codex = agents.find((agent) => agent.id === "codex");
  expect(codex?.detected).toBe(true);
  expect(codex?.executable).toBeNull();
  expect(codex?.authentication).toBe("unknown");
  expect(codex?.runtimeCapabilities).toBe("untested");
  expect(agents.find((agent) => agent.id === "claude-code")?.executable).toBe(
    realpathSync(executable),
  );
  expect(agents.find((agent) => agent.id === "universal")?.detected).toBe(false);
  expect(agents.find((agent) => agent.id === "pi")?.detected).toBe(true);
});

test("project installation preserves TOML and becomes byte-for-byte idempotent", async () => {
  const context = fixture();
  const directory = join(context.projectRoot, ".codex");
  mkdirSync(directory);
  const path = join(directory, "config.toml");
  const before = '# retained comment\nmodel = "example"\n[mcp_servers.other]\ncommand = "other"\n';
  writeFileSync(path, before);
  const service = createIntegrationService(context);
  const plan = await Effect.runPromise(service.plan(input()));
  expect(plan.files.map((file) => file.status)).toEqual(["create", "update"]);
  expect(readFileSync(path, "utf8")).toBe(before);
  const installed = Schema.decodeUnknownSync(IntegrationResultSchema)(
    await Effect.runPromise(service.install(input())),
  );
  expect(installed.backups.length).toBe(1);
  expect(readFileSync(installed.backups[0] ?? "", "utf8")).toBe(before);
  const after = readFileSync(path, "utf8");
  expect(after.startsWith(before)).toBe(true);
  const root = Schema.decodeUnknownSync(Schema.Record(Schema.String, Schema.Unknown))(
    Bun.TOML.parse(after),
  );
  const servers = Schema.decodeUnknownSync(Schema.Record(Schema.String, Schema.Unknown))(
    root.mcp_servers,
  );
  const server = Schema.decodeUnknownSync(
    Schema.Struct({ command: Schema.String, args: Schema.Array(Schema.String) }),
  )(servers["teamagent-memory"]);
  expect(server.args).toEqual([
    join(context.repositoryRoot, "app", "cli", "index.ts"),
    "memory",
    "mcp",
    "--data",
    context.dataDirectory,
    "--root",
    realpathSync(context.projectRoot),
  ]);
  const again = await Effect.runPromise(service.install(input()));
  expect(again.plan.files.every((file) => file.status === "unchanged")).toBe(true);
  expect(again.backups).toEqual([]);
  expect(readFileSync(path, "utf8")).toBe(after);
});

test("JSON MCP installation retains other agent settings and explicit converter path", async () => {
  const context = fixture();
  const path = join(context.projectRoot, ".mcp.json");
  writeFileSync(
    path,
    JSON.stringify({
      custom: { enabled: true },
      mcpServers: { existing: { command: "unchanged" } },
    }),
  );
  const result = await Effect.runPromise(
    createIntegrationService({ ...context, python: process.execPath }).install(
      input("claude-code"),
    ),
  );
  const config: unknown = JSON.parse(readFileSync(path, "utf8"));
  expect(config).toEqual({
    custom: { enabled: true },
    mcpServers: {
      existing: { command: "unchanged" },
      "teamagent-memory": {
        type: "stdio",
        command: realpathSync(process.execPath),
        args: [...result.plan.args],
      },
    },
  });
  expect(result.plan.args.slice(-2)).toEqual(["--python", realpathSync(process.execPath)]);
  expect(result.backups.length).toBe(1);
  expect(
    readFileSync(
      join(context.projectRoot, ".claude", "skills", "teamagent-memory", "SKILL.md"),
      "utf8",
    ),
  ).toContain(`"python": ${JSON.stringify(realpathSync(process.execPath))}`);
});

test("conflicting MCP config prevents both skill and config writes", async () => {
  const context = fixture();
  const path = join(context.projectRoot, ".mcp.json");
  const before = '{"mcpServers":{"teamagent-memory":{"command":"preserve-me"}}}';
  writeFileSync(path, before);
  expect(
    (await failure(createIntegrationService(context).install(input("claude-code")))).code,
  ).toBe("conflict");
  expect(readFileSync(path, "utf8")).toBe(before);
  expect(readdirSync(context.projectRoot)).toEqual([".mcp.json"]);
});

test("a late configuration failure rolls back the newly installed skill", async () => {
  const context = fixture();
  const path = join(context.projectRoot, ".mcp.json");
  const before = '{"custom":true}';
  writeFileSync(path, before);
  const hash = createHash("sha256").update(before).digest("hex").slice(0, 16);
  const backup = `${path}.teamagent-backup-${hash}`;
  writeFileSync(backup, "do not overwrite this backup");
  expect(
    (await failure(createIntegrationService(context).install(input("claude-code")))).code,
  ).toBe("conflict");
  expect(readFileSync(path, "utf8")).toBe(before);
  expect(readFileSync(backup, "utf8")).toBe("do not overwrite this backup");
  expect(readdirSync(join(context.projectRoot, ".claude", "skills", "teamagent-memory"))).toEqual(
    [],
  );
});

test("conflicting skills and existing installation locks remain untouched", async () => {
  const context = fixture();
  const path = join(context.projectRoot, ".agents", "skills", "teamagent-memory");
  mkdirSync(path, { recursive: true });
  writeFileSync(join(path, "SKILL.md"), "user-owned skill");
  expect((await failure(createIntegrationService(context).install(input()))).code).toBe("conflict");
  expect(readFileSync(join(path, "SKILL.md"), "utf8")).toBe("user-owned skill");
  mkdirSync(join(context.projectRoot, ".teamagent-install.lock"));
  expect(
    (await failure(createIntegrationService(context).install(input("cursor", "project", "mcp"))))
      .code,
  ).toBe("conflict");
});

test("global and custom home locations remain tied to an explicit workspace", async () => {
  const context = fixture();
  const custom = join(context.home, "custom-codex");
  const service = createIntegrationService({ ...context, environment: { CODEX_HOME: custom } });
  const result = await Effect.runPromise(service.install(input("codex", "global")));
  expect(result.plan.files.map((file) => file.path)).toEqual([
    join(context.home, ".agents", "skills", "teamagent-memory", "SKILL.md"),
    join(custom, "config.toml"),
  ]);
  expect(result.plan.args.at(-1)).toBe(realpathSync(context.projectRoot));
  expect(
    readFileSync(join(context.home, ".agents", "skills", "teamagent-memory", "SKILL.md"), "utf8"),
  ).toContain(JSON.stringify(context.projectRoot));
});

test("registry supports skill-only installation without inventing an MCP config format", async () => {
  const context = fixture();
  const service = createIntegrationService(context);
  expect((await failure(service.plan(input("pi")))).code).toBe("unsupported");
  const result = await Effect.runPromise(service.install(input("pi", "project", "skill")));
  expect(result.plan.files.length).toBe(1);
  expect(result.plan.files[0]?.kind).toBe("skill");
  expect((await failure(service.plan(input("missing-agent")))).code).toBe("unsupported");
  expect((await failure(service.plan({ ...input(), unexpected: true }))).code).toBe("invalid");
});

test("installation rejects symlink parents and oversized or malformed configuration", async () => {
  const context = fixture();
  const outside = join(context.home, "outside");
  mkdirSync(outside);
  symlinkSync(
    outside,
    join(context.projectRoot, ".cursor"),
    process.platform === "win32" ? "junction" : "dir",
  );
  const service = createIntegrationService(context);
  expect((await failure(service.install(input("cursor", "project", "mcp")))).code).toBe("conflict");
  expect(readdirSync(outside)).toEqual([]);
  writeFileSync(join(context.projectRoot, ".mcp.json"), "x".repeat(1_048_577));
  expect((await failure(service.install(input("claude-code", "project", "mcp")))).code).toBe(
    "invalid",
  );
  writeFileSync(join(context.projectRoot, ".mcp.json"), "not json");
  await failure(service.install(input("claude-code", "project", "mcp")));
  expect(readFileSync(join(context.projectRoot, ".mcp.json"), "utf8")).toBe("not json");
});
