import { test } from "bun:test";
import assert from "node:assert/strict";
import { resolve } from "node:path";
import { runProcess } from "../app/workflow/process.ts";
import { mkdtemp } from "./temporary.ts";

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
    { cwd: resolve("."), stdout: "pipe", stderr: "pipe", timeout: 120_000, windowsHide: true },
  );
  assert.equal(
    result.exitCode,
    0,
    new TextDecoder().decode(result.stdout) + new TextDecoder().decode(result.stderr),
  );
}, 125_000);

test("Git identity reconciliation preserves exact source identities and offline object evidence", async () => {
  const executable = Bun.which("pwsh");
  assert.ok(executable, "PowerShell 7 is required for research identity fixtures.");
  const fixture = await mkdtemp("research-git-identities-");
  const result = await runProcess(
    resolve("."),
    executable,
    [
      "-NoLogo",
      "-NoProfile",
      "-NonInteractive",
      "-File",
      resolve("test/research-git-identities-fixtures.ps1"),
      "-FixtureRoot",
      fixture,
    ],
    { timeoutMs: 120_000 },
  );
  assert.equal(result.outcome, "exited", result.stdout + result.stderr);
  assert.equal(result.termination, "closed", result.stdout + result.stderr);
  assert.equal(result.code, 0, result.stdout + result.stderr);
}, 125_000);
