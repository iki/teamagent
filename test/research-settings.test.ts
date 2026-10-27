import { describe, expect, test } from "bun:test";
import { rejects } from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadResearchSettings, parseResearchEnv } from "../app/research/settings.ts";

describe("research settings", () => {
  test("uses project-relative defaults and local overrides without changing process.env", async () => {
    const root = await mkdtemp(join(tmpdir(), "teamagent-settings-"));
    const before = process.env.TEAMAGENT_GIT_CACHE;
    try {
      const defaults = await loadResearchSettings(root);
      expect(defaults.gitCache).toBe(join(root, ".cache", "git"));
      expect(defaults.sourcesDirectory).toBeUndefined();
      expect(defaults.autoStash).toBe(true);
      expect(defaults.backupAccount).toBeUndefined();
      await writeFile(join(root, ".env"), "TEAMAGENT_GIT_CACHE=cache\n");
      await writeFile(
        join(root, ".env.local"),
        "TEAMAGENT_GIT_CACHE='..'\nTEAMAGENT_GIT_SOURCES_DIR=..\nTEAMAGENT_GIT_OUTDATED_THRESHOLD=4m\nTEAMAGENT_GIT_AUTO_STASH=false\n",
      );
      const local = await loadResearchSettings(root);
      expect(local.gitCache).toBe(tmpdir());
      expect(local.sourcesDirectory).toBe(tmpdir());
      expect(local.autoStash).toBe(false);
      expect(local.textCache).toBe(join(root, ".cache", "text"));
      expect(process.env.TEAMAGENT_GIT_CACHE).toBe(before);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  test("rejects interpolation, executable input, duplicate settings and unknown keys", () => {
    for (const source of [
      "TEAMAGENT_GIT_CACHE=$(touch unwanted)",
      "TEAMAGENT_GIT_CACHE=${HOME}",
      "TEAMAGENT_GIT_CACHE=`command`",
      "TEAMAGENT_GIT_CACHE=first\nTEAMAGENT_GIT_CACHE=second",
      "TEAMAGENT_GIT_CAHCE=oops",
      "TEAMAGENT_GIT_CACHE='unterminated",
      "x".repeat(65537),
    ])
      expect(() => parseResearchEnv(source)).toThrow();
    expect(parseResearchEnv("# comment\nUNRELATED=value\nTEAMAGENT_GIT_CACHE=.cache/git")).toEqual({
      TEAMAGENT_GIT_CACHE: ".cache/git",
    });
  });

  test("rejects invalid threshold and path-bearing prefixes", async () => {
    const root = await mkdtemp(join(tmpdir(), "teamagent-settings-"));
    try {
      for (const setting of [
        "TEAMAGENT_GIT_OUTDATED_THRESHOLD=0m",
        "TEAMAGENT_GIT_AUTO_STASH=yes",
        "TEAMAGENT_GIT_REMOVED_PREFIX=../<YYMM>-",
        "TEAMAGENT_GIT_BACKUP_ACCOUNT=user/repository",
      ]) {
        await writeFile(join(root, ".env"), setting);
        await rejects(loadResearchSettings(root));
      }
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
