import { assertTemporaryFixture, mkdtemp } from "./temporary.ts";
import { describe, expect, test } from "bun:test";
import { rejects } from "node:assert/strict";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadResearchSettings, parseResearchEnv } from "../app/research/settings.ts";

describe("research settings", () => {
  test("uses project-relative defaults and local overrides without changing process.env", async () => {
    const fixture = await mkdtemp(join(tmpdir(), "teamagent-settings-"));
    // An explicit project parent makes path expectations independent of temporary routing.
    const root = join(fixture, "project");
    const before = { ...process.env };
    try {
      await mkdir(root);
      const defaults = await loadResearchSettings(root);
      expect(defaults.gitCache).toBe(join(root, ".cache", "git"));
      expect(defaults.sourcesDirectory).toBeUndefined();
      expect(defaults.autoStash).toBe(true);
      expect(defaults.backupAccount).toBeUndefined();
      await writeFile(join(root, ".env"), "TEAMAGENT_GIT_CACHE=cache\n");
      const shared = await loadResearchSettings(root);
      expect(shared.gitCache).toBe(join(root, "cache"));
      await writeFile(
        join(root, ".env.local"),
        "TEAMAGENT_GIT_CACHE='..'\nTEAMAGENT_GIT_SOURCES_DIR=..\nTEAMAGENT_GIT_OUTDATED_THRESHOLD=4m\nTEAMAGENT_GIT_AUTO_STASH=false\n",
      );
      const local = await loadResearchSettings(root);
      expect(local.root).toBe(root);
      expect(local.gitCache).toBe(fixture);
      expect(local.sourcesDirectory).toBe(fixture);
      expect(local.autoStash).toBe(false);
      expect(local.textCache).toBe(join(root, ".cache", "text"));
      const after = { ...process.env };
      const environmentUnchanged =
        Object.keys(after).length === Object.keys(before).length &&
        Object.entries(before).every(
          ([key, value]) => Object.hasOwn(after, key) && after[key] === value,
        );
      expect(environmentUnchanged).toBe(true);
    } finally {
      await assertTemporaryFixture(fixture);
      await rm(fixture, { recursive: true, force: true });
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
