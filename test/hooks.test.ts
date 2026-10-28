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

await test("a thrown verification timeout still archives and permits only one repair continuation", () => {
  for (const alreadyContinued of [false, true]) {
    const calls: string[] = [];
    const result = completeHook(
      "Stop",
      alreadyContinued,
      () => {
        calls.push("archive");
        return true;
      },
      () => {
        calls.push("verify");
        throw new Error("Verification timeout");
      },
    );
    assert.deepEqual(calls, ["archive", "verify"]);
    if (alreadyContinued) {
      assert.equal(result.decision, undefined);
      assert.match(result.systemMessage ?? "", /still fails/u);
    } else {
      assert.equal(result.decision, "block");
    }
  }
});
