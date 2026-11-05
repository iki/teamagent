import { test } from "bun:test";
import assert from "node:assert/strict";
import { lstat } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { temporaryEnvironmentNames, temporaryParent } from "../app/check/temporary-workspace.ts";
import { diagnostic, runProcess } from "../app/workflow/process.ts";

// These fixtures use only local Git remotes and stub the GitHub API where needed.
async function researchFixture(identity: boolean): Promise<void> {
  const root = resolve(".");
  const inherited = { ...process.env };
  await temporaryParent(inherited, root);
  // A direct command lease keeps Windows recovery ref paths within Git's path bound.
  // runProcess owns cleanup; abrupt worker exit leaves this lease for explicit recovery.
  const environment = Object.fromEntries(
    Object.entries(inherited).filter(
      ([name]) => !temporaryEnvironmentNames.some((key) => key === name.toUpperCase()),
    ),
  );
  const executable = Bun.which("pwsh");
  assert.ok(executable, "PowerShell 7 is required for research maintenance fixtures.");
  const result = await runProcess(
    root,
    executable,
    [
      "-NoLogo",
      "-NoProfile",
      "-NonInteractive",
      "-File",
      resolve("test/research-git-fixtures.ps1"),
      ...(identity ? ["-IdentityFixture"] : []),
    ],
    { timeoutMs: 120_000, env: environment },
  );
  const detail = diagnostic(result.stdout + result.stderr).slice(-6000);
  assert.equal(result.termination, "closed", detail);
  assert.equal(result.outcome, "exited", detail);
  assert.equal(result.code, 0, detail);
  const match = /^FIXTURE_PATH (\.tmp\/run-command-[a-f0-9-]{36}\/g)\n$/u.exec(
    result.stdout.slice(result.stdout.lastIndexOf("\n", result.stdout.length - 2) + 1),
  );
  assert.ok(match?.[1], "The fixture completed in its marked command workspace");
  const checkout = resolve(root, match[1]);
  await assert.rejects(lstat(checkout), { code: "ENOENT" });
  await assert.rejects(lstat(dirname(checkout)), { code: "ENOENT" });
}

test(
  "Git research maintenance preserves local evidence and validates source configuration",
  () => researchFixture(false),
  125_000,
);

test(
  "Git identity reconciliation preserves exact source identities and offline object evidence",
  () => researchFixture(true),
  125_000,
);
