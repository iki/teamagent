import assert from "node:assert/strict";
import { test } from "node:test";
import { checkDecision } from "../app/hooks/decision.ts";
import { completeHook } from "../app/hooks/completion.ts";

await test("failed Stop verification requests one repair and never an endless continuation", () => {
  assert.deepEqual(checkDecision(true, false), {});
  assert.deepEqual(checkDecision(true, true), {});
  assert.equal(checkDecision(false, false).decision, "block");
  assert.equal(checkDecision(false, true).decision, undefined);
  assert.match(checkDecision(false, true).systemMessage ?? "", /still fails/);
});

await test("archive errors cannot skip the root verification gate", () => {
  const calls: string[] = [];
  const result = completeHook(
    "Stop",
    false,
    () => {
      calls.push("archive");
      throw new Error("Transcript unavailable");
    },
    () => {
      calls.push("verify");
      return false;
    },
  );
  assert.deepEqual(calls, ["archive", "verify"]);
  assert.equal(result.decision, "block");
  assert.match(result.systemMessage ?? "", /has not been saved/);
  const child = completeHook(
    "SubagentStop",
    false,
    () => true,
    () => {
      throw new Error("Subagents must not check incomplete shared edits");
    },
  );
  assert.deepEqual(child, {});
});
