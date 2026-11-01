import { assertTemporaryFixture, mkdtemp } from "./temporary.ts";
import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { fromTranscript, type StopInput } from "../app/conversations/transcript.ts";

const context = JSON.stringify({ type: "turn_context", payload: { turn_id: "selected" } });
const message = (role: string, text: string, phase?: string) =>
  JSON.stringify({
    type: "response_item",
    payload: {
      type: "message",
      role,
      ...(phase ? { phase } : {}),
      content: [{ type: "text", text }],
    },
  });

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), "teamagent-transcript-bounds-"));
  const file = join(root, "input.jsonl");
  const input: StopInput = {
    hook_event_name: "Stop",
    session_id: "session",
    turn_id: "selected",
    transcript_path: file,
    last_assistant_message: "Final",
  };
  return {
    root,
    file,
    input,
    async close() {
      await assertTemporaryFixture(root);
      assert.ok(basename(root).startsWith("teamagent-transcript-bounds-"));
      await rm(root, { recursive: true, force: true });
    },
  };
}

await test("native transcript rejects malformed UTF-8 without rewriting original evidence", async () => {
  const f = await fixture();
  try {
    const original = Buffer.concat([
      Buffer.from(`${context}\n${message("user", "before")}`),
      Uint8Array.of(0xff),
    ]);
    await writeFile(f.file, original);
    await assert.rejects(fromTranscript(f.input), /encoded data/);
    assert.deepEqual(await readFile(f.file), original);
  } finally {
    await f.close();
  }
});

await test("native transcript bounds selected public text and releases large prior finals", async () => {
  const f = await fixture();
  const large = "a".repeat(2 * 1024 * 1024);
  try {
    await writeFile(
      f.file,
      `${context}\n${message("user", "Prompt")}\n${Array.from({ length: 4 }, () => message("assistant", large, "commentary")).join("\n")}\n`,
      "utf8",
    );
    await assert.rejects(fromTranscript(f.input), /Selected public transcript exceeds 8 MiB/);
    await writeFile(
      f.file,
      `${context}\n${message("user", "Prompt")}\n${Array.from({ length: 5 }, () => message("assistant", large, "final")).join("\n")}\n${message("assistant", "Latest final", "final")}\n`,
      "utf8",
    );
    const parsed = await fromTranscript({ ...f.input, last_assistant_message: null });
    assert.equal(parsed.response, "Latest final");
    assert.equal(parsed.prompt, "Prompt");
    assert.deepEqual(parsed.processingLog, []);
  } finally {
    await f.close();
  }
});
