import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { readBoundedLines, readInput } from "../app/conversations/input.ts";

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

async function lines(source: AsyncIterable<unknown>, bytes = 100, lineBytes = 50) {
  const result: string[] = [];
  for await (const line of readBoundedLines(source, { bytes, lineBytes })) result.push(line);
  return result;
}

await test("bounded transcript lines preserve split UTF-8 and LF, CRLF and lone CR boundaries", async () => {
  const encoded = Buffer.from("ž🐝\r\nsecond\rthird\nlast");
  assert.deepEqual(await lines(stream(Array.from(encoded, (byte) => Uint8Array.of(byte)))), [
    "ž🐝",
    "second",
    "third",
    "last",
  ]);
  for (const bytes of [Uint8Array.of(0xc3), Uint8Array.of(0xc3, 10), Uint8Array.of(0xff, 10)])
    await assert.rejects(lines(stream([bytes])), /encoded data/);
  await assert.rejects(lines(stream(["not bytes"])));
});

await test("transcript streaming enforces cumulative and unterminated-line bounds before retaining more input", async () => {
  for (const bound of ["total", "line"] as const) {
    let reads = 0;
    let closed = false;
    async function* growing() {
      try {
        reads++;
        yield Buffer.from(bound === "total" ? "é\n" : "é");
        reads++;
        yield Buffer.from("é");
        reads++;
        yield Buffer.from("must not be read");
      } finally {
        closed = true;
      }
    }
    await assert.rejects(
      lines(growing(), bound === "total" ? 4 : 100, bound === "line" ? 3 : 50),
      /byte limit/,
    );
    assert.equal(reads, 2);
    assert.equal(closed, true);
  }
  assert.deepEqual(await lines(stream([Buffer.from("é\n")]), 3, 2), ["é"]);
  await assert.rejects(lines(stream([]), 0), /Invalid/);
});

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
