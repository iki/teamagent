import { loadDotenv } from "c12";
import { Schema } from "effect";
import { lstat } from "node:fs/promises";
import { resolve } from "node:path";

const SettingsSchema = Schema.Struct({
  TEAMAGENT_GIT_SOURCES_DIR: Schema.optional(Schema.String),
  TEAMAGENT_GIT_CACHE: Schema.optional(Schema.String),
  TEAMAGENT_GIT_AUTO_STASH: Schema.optional(Schema.String),
  TEAMAGENT_GIT_OUTDATED_THRESHOLD: Schema.optional(Schema.String),
  TEAMAGENT_GIT_OUTDATED_PREFIX: Schema.optional(Schema.String),
  TEAMAGENT_GIT_REMOVED_PREFIX: Schema.optional(Schema.String),
  TEAMAGENT_GIT_BACKUP_ACCOUNT: Schema.optional(Schema.String),
  TEAMAGENT_REPOMIX_CACHE: Schema.optional(Schema.String),
  TEAMAGENT_TEXT_CACHE: Schema.optional(Schema.String),
});

export interface ResearchSettings {
  readonly root: string;
  readonly sourcesDirectory: string | undefined;
  readonly gitCache: string;
  readonly autoStash: boolean;
  readonly outdatedThreshold: string;
  readonly outdatedPrefix: string;
  readonly removedPrefix: string;
  readonly backupAccount: string | undefined;
  readonly repomixCache: string;
  readonly textCache: string;
}

/** The same deliberately small data grammar is supported by the Git-only scripts. */
export function parseResearchEnv(text: string): Record<string, string> {
  if (Buffer.byteLength(text) > 65536 || text.includes("\0"))
    throw new Error("Project environment file exceeds its limit or contains invalid data.");
  const values: Record<string, string> = {};
  for (const line of text.replace(/^\uFEFF/, "").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = /^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(trimmed);
    if (!match || match[1] === undefined || match[2] === undefined)
      throw new Error("Invalid project environment assignment.");
    const key = match[1];
    if (!key.startsWith("TEAMAGENT_")) continue;
    if (!(key in SettingsSchema.fields))
      throw new Error("Unknown Teamagent project environment setting.");
    if (Object.hasOwn(values, key))
      throw new Error("Duplicate Teamagent project environment setting.");
    let value = match[2].trim();
    if (value.startsWith('"') || value.startsWith("'")) {
      if (value.length < 2 || !value.endsWith(value[0] ?? ""))
        throw new Error("Invalid quoted project environment setting.");
      value = value.slice(1, -1);
    }
    if (
      /["'`$]/.test(value) ||
      value
        .split("")
        .some((character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127)
    )
      throw new Error("Project environment values must be single-line literal data.");
    values[key] = value;
  }
  return values;
}

/** Host-only settings adapter; never mutates process.env or executes configuration. */
export async function loadResearchSettings(directory: string): Promise<ResearchSettings> {
  const root = resolve(directory);
  for (const filename of [".env", ".env.local"]) {
    const info = await lstat(resolve(root, filename)).catch((error: unknown) => {
      if (error instanceof Error && "code" in error && error.code === "ENOENT") return undefined;
      throw new Error("Cannot inspect a project environment file.");
    });
    if (info && (!info.isFile() || info.isSymbolicLink() || info.size > 65536))
      throw new Error("Project environment files must be bounded regular files.");
  }
  const input: unknown = await loadDotenv({
    cwd: root,
    fileName: [".env", ".env.local"],
    env: {},
    interpolate: false,
    expandFileReferences: false,
    parse: parseResearchEnv,
  });
  const config = Schema.decodeUnknownSync(SettingsSchema)(input, { onExcessProperty: "error" });
  const autoStash = config.TEAMAGENT_GIT_AUTO_STASH || "true";
  if (autoStash !== "true" && autoStash !== "false")
    throw new Error("Auto-stash must be true or false.");
  const outdatedThreshold = config.TEAMAGENT_GIT_OUTDATED_THRESHOLD || "4m";
  if (!/^[1-9][0-9]{0,3}[md]$/.test(outdatedThreshold))
    throw new Error("Outdated threshold must be a positive count of months (m) or days (d).");
  const outdatedPrefix = config.TEAMAGENT_GIT_OUTDATED_PREFIX || "xx-<YYMM>-";
  const removedPrefix = config.TEAMAGENT_GIT_REMOVED_PREFIX || "zz-<YYMM>-";
  for (const prefix of [outdatedPrefix, removedPrefix]) {
    if (!/^[a-zA-Z][a-zA-Z0-9_-]{0,20}-<YYMM>-$/.test(prefix))
      throw new Error("Repository prefixes must end in -<YYMM>- and contain safe name characters.");
  }
  if (outdatedPrefix === removedPrefix)
    throw new Error("Outdated and removed prefixes must be different.");
  const backupAccount = config.TEAMAGENT_GIT_BACKUP_ACCOUNT || undefined;
  if (backupAccount && !/^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/.test(backupAccount))
    throw new Error("Backup account must be a GitHub account name.");
  return {
    root,
    sourcesDirectory: config.TEAMAGENT_GIT_SOURCES_DIR
      ? resolve(root, config.TEAMAGENT_GIT_SOURCES_DIR)
      : undefined,
    gitCache: resolve(root, config.TEAMAGENT_GIT_CACHE || ".cache/git"),
    autoStash: autoStash === "true",
    outdatedThreshold,
    outdatedPrefix,
    removedPrefix,
    backupAccount,
    repomixCache: resolve(root, config.TEAMAGENT_REPOMIX_CACHE || ".cache/git.repomix"),
    textCache: resolve(root, config.TEAMAGENT_TEXT_CACHE || ".cache/text"),
  };
}
