import { expect, test } from "bun:test";
import { readBounded, verifyArtifact } from "../app/web/api.ts";
import { createHash } from "node:crypto";
import { rejects } from "node:assert/strict";

test("browser transport rejects oversized and invalid UTF-8 responses", async () => {
  await rejects(readBounded(new Response(new Uint8Array(2 * 1024 * 1024 + 1))), /too large/);
  await rejects(readBounded(new Response(new Uint8Array([0xff]))));
});

test("artifact preview verifies exact UTF-8 bytes, including a BOM", async () => {
  const content = "\ufeffA café ☕";
  const digest = createHash("sha256").update(content).digest("hex");
  const decoded = await readBounded(new Response(content));
  expect(await verifyArtifact(decoded, digest)).toBe(content);
  await rejects(verifyArtifact(`${decoded}!`, digest), /integrity check/);
});

test("browser transport preserves Unicode split across chunks", async () => {
  const bytes = new TextEncoder().encode("A café ☕");
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const byte of bytes) controller.enqueue(new Uint8Array([byte]));
      controller.close();
    },
  });
  expect(await readBounded(new Response(stream))).toBe("A café ☕");
});
