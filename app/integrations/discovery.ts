import {
  accessSync,
  constants,
  existsSync,
  lstatSync,
  readFileSync,
  realpathSync,
  statSync,
} from "node:fs";
import { delimiter, isAbsolute, join, resolve } from "node:path";
import { Effect, Schema } from "effect";
import { IntegrationError, type DiscoveredAgent } from "@/integrations";
import { agentRegistry } from "./registry.ts";

export interface DiscoveryContext {
  readonly home: string;
  readonly projectRoot: string;
  readonly environment?: Readonly<Record<string, string | undefined>>;
  readonly searchPath?: string;
}

export const fail = (code: IntegrationError["code"], message: string): never => {
  throw new IntegrationError({ code, message });
};
export const attempt = <A>(body: () => A): Effect.Effect<A, IntegrationError> =>
  Effect.try({
    try: body,
    catch: (error) =>
      error instanceof IntegrationError
        ? error
        : new IntegrationError({
            code: "io",
            message: "Agent integration could not access its local files.",
          }),
  });

export function absoluteDirectory(value: string): string {
  if (!isAbsolute(value) || /[\0\r\n]/.test(value) || value.length > 4096)
    fail("invalid", "Integration directories must be absolute paths.");
  const path = realpathSync(value);
  if (!statSync(path).isDirectory())
    fail("invalid", "Integration root must be an existing directory.");
  return path;
}

export function resolveRegistry(context: DiscoveryContext) {
  const home = absoluteDirectory(context.home);
  const project = absoluteDirectory(context.projectRoot);
  const environment = context.environment ?? {};
  const envPath = (name: string, fallback: string) => {
    const value = environment[name]?.trim() || fallback;
    if (!isAbsolute(value) || /[\0\r\n]/.test(value))
      fail("invalid", `Agent configuration directory ${name} must be absolute.`);
    return resolve(value);
  };
  const roots: Readonly<Record<string, string | undefined>> = {
    home,
    project,
    config: envPath("XDG_CONFIG_HOME", join(home, ".config")),
    codex: envPath("CODEX_HOME", join(home, ".codex")),
    claude: envPath("CLAUDE_CONFIG_DIR", join(home, ".claude")),
    vibe: envPath("VIBE_HOME", join(home, ".vibe")),
    hermes: envPath("HERMES_HOME", join(home, ".hermes")),
    autohand: envPath("AUTOHAND_HOME", join(home, ".autohand")),
    grok: envPath("GROK_HOME", join(home, ".grok")),
    sarvam: envPath("SARVAM_HOME", join(home, ".sarvam")),
    appdata: environment.APPDATA ? envPath("APPDATA", home) : undefined,
    flatpak: environment.FLATPAK_XDG_CONFIG_HOME
      ? envPath("FLATPAK_XDG_CONFIG_HOME", home)
      : undefined,
    openclaw:
      [".openclaw", ".clawdbot", ".moltbot"]
        .map((name) => join(home, name))
        .find((path) => existsSync(path)) ?? join(home, ".openclaw"),
  };
  const expand = (template: string): string | null => {
    const match = /^\{([a-z]+)\}(.*)$/.exec(template);
    if (!match)
      return process.platform === "win32" && template.startsWith("/") ? null : resolve(template);
    const name = match[1];
    const root = name ? roots[name] : undefined;
    return root ? join(root, match[2] ?? "") : null;
  };
  return {
    home,
    project,
    roots,
    entries: agentRegistry.map((entry) => ({
      ...entry,
      projectSkills: join(project, entry.projectSkills),
      globalSkills: entry.globalSkills ? expand(entry.globalSkills) : null,
      detectPaths: entry.detectPaths.map(expand).filter((path): path is string => path !== null),
    })),
  };
}

function executableOnPath(name: string | null, searchPath: string): string | null {
  if (!name || searchPath.length > 65536) return null;
  const directories = searchPath.split(delimiter).filter((path) => path && isAbsolute(path));
  if (directories.length > 512) fail("invalid", "Executable search path has too many entries.");
  const suffixes = process.platform === "win32" ? [".exe", ".cmd", ".bat", ""] : [""];
  for (const directory of directories) {
    for (const suffix of suffixes) {
      const candidate = join(directory, name + suffix);
      try {
        if (!statSync(candidate).isFile()) continue;
        accessSync(candidate, process.platform === "win32" ? constants.F_OK : constants.X_OK);
        return realpathSync(candidate);
      } catch {
        /* Missing or inaccessible PATH entries are not installation evidence. */
      }
    }
  }
  return null;
}

function eveEvidence(project: string): boolean {
  const manifest = join(project, "package.json");
  if (!existsSync(join(project, "agent")) || !existsSync(manifest)) return false;
  if (!lstatSync(manifest).isFile() || statSync(manifest).size > 262144) return false;
  try {
    const raw: unknown = JSON.parse(readFileSync(manifest, "utf8"));
    const record = Schema.decodeUnknownSync(Schema.Record(Schema.String, Schema.Unknown))(raw);
    const Dependencies = Schema.Record(Schema.String, Schema.String);
    const dependencies = Schema.decodeUnknownSync(Dependencies)(record.dependencies ?? {});
    const devDependencies = Schema.decodeUnknownSync(Dependencies)(record.devDependencies ?? {});
    return Boolean(dependencies.eve || devDependencies.eve);
  } catch {
    return false;
  }
}

export const discoverAgents = (
  context: DiscoveryContext,
): Effect.Effect<readonly DiscoveredAgent[], IntegrationError> =>
  attempt(() => {
    const registry = resolveRegistry(context);
    return registry.entries.map((entry) => {
      const paths =
        entry.detector === "eve"
          ? eveEvidence(registry.project)
            ? [join(registry.project, "agent")]
            : []
          : entry.detectPaths.filter((path) => existsSync(path));
      const executable = executableOnPath(entry.executable, context.searchPath ?? "");
      return {
        id: entry.id,
        name: entry.name,
        detected: paths.length > 0 || executable !== null,
        evidence: [
          ...paths.map((path) => `Configuration path exists: ${path}`),
          ...(executable ? [`Executable resolved without running: ${executable}`] : []),
        ],
        executable,
        authentication: "unknown",
        runtimeCapabilities: "untested",
        projectSkills: entry.projectSkills,
        globalSkills: entry.globalSkills,
        mcpInstallation:
          entry.id === "codex" || entry.id === "claude-code" || entry.id === "cursor",
      };
    });
  });
