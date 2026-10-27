import { test } from "bun:test";
import assert from "node:assert/strict";
import { resolve } from "node:path";

// These fixtures use only local Git remotes and stub the GitHub API where needed.
test("Git research maintenance preserves local evidence and validates source configuration", () => {
  const executable = Bun.which("pwsh");
  assert.ok(executable, "PowerShell 7 is required for research maintenance fixtures.");
  const result = Bun.spawnSync(
    [
      executable,
      "-NoLogo",
      "-NoProfile",
      "-NonInteractive",
      "-File",
      resolve("test/research-git-fixtures.ps1"),
    ],
    { cwd: resolve("."), stdout: "pipe", stderr: "pipe", timeout: 120_000 },
  );
  assert.equal(
    result.exitCode,
    0,
    new TextDecoder().decode(result.stdout) + new TextDecoder().decode(result.stderr),
  );
}, 125_000);
