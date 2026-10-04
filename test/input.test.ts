import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { readInput } from "../app/conversations/input.ts";

await test("JSON input preserves split UTF-8 characters and rejects invalid encoding", async () => {
  const encoded = Buffer.from('{"message":"žluťoučký 🐝"}');
  const split = Array.from(encoded, (byte) => Uint8Array.of(byte));
  assert.equal(await readInput(stream(split), encoded.byteLength), encoded.toString("utf8"));
  await assert.rejects(readInput(stream([Uint8Array.of(0xc3)])), /encoded data/);
  await assert.rejects(readInput(stream(["unexpected string chunk"])));
});

async function* stream(chunks: readonly unknown[]) {
  yield* chunks;
}

await test("input limits count bytes and stop reading immediately when exceeded", async () => {
  let read = 0;
  let closed = false;
  async function* oversized() {
    try {
      read++;
      yield Buffer.from("é");
      read++;
      yield Buffer.from("é");
      read++;
      yield Buffer.from("must not be read");
    } finally {
      closed = true;
    }
  }
  await assert.rejects(readInput(oversized(), 3), /Input limit exceeded/);
  assert.equal(read, 2);
  assert.equal(closed, true);
});

await test("machine adapters reject unknown arguments without waiting for stdin", async () => {
  const root = fileURLToPath(new URL("../", import.meta.url));
  for (const script of [
    "app/conversations/record.ts",
    "app/hooks/stop.ts",
    "app/hooks/install.ts",
  ]) {
    const child = spawn(process.execPath, [script, "--unsupported"], {
      cwd: root,
      stdio: ["pipe", "ignore", "ignore"],
      windowsHide: true,
      timeout: 5_000,
    });
    // Keep stdin open. A parser that waits for EOF instead of rejecting args times out.
    try {
      const status = await new Promise<number | null>((resolve, reject) => {
        child.once("error", reject);
        child.once("close", resolve);
      });
      assert.equal(status, 1, script);
    } finally {
      child.stdin?.destroy();
    }
  }
});
