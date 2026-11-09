/** Separate-process fixture. No global settings, task registration or publication. */
import { mkdir, open } from "node:fs/promises";
import { isAbsolute } from "node:path";
import { Schema } from "effect";
import { boundedRead, hasCode, safePath } from "../app/check/cache-io.ts";
import { sharedResultOwner } from "../app/check/shared-result-owner.ts";
import { beginSharedResult, completeSharedResult } from "../app/check/shared-results.ts";

const Input = Schema.Struct({
  root: Schema.NonEmptyString,
  action: Schema.Literals(["ownership", "inventory", "normal"]),
  key: Schema.String.check(Schema.isPattern(/^[a-f0-9]{64}$/u)),
});
async function main(): Promise<void> {
  if (process.argv.length !== 5) throw new Error("Unexpected shared-result child arguments");
  const input = Schema.decodeUnknownSync(Input)({
    root: process.argv[2],
    action: process.argv[3],
    key: process.argv[4],
  });
  if (!isAbsolute(input.root)) throw new Error("Fixture root must be absolute");
  const controls = ".cache/shared-result-test";
  await mkdir(await safePath(input.root, controls, true), { recursive: true });
  let paused = false;
  const pause = async (): Promise<void> => {
    if (paused) return;
    paused = true;
    const ready = await open(
      await safePath(input.root, controls + "/" + input.action + ".ready", true),
      "wx",
    );
    try {
      await ready.writeFile("ready\n", "utf8");
      await ready.sync();
    } finally {
      await ready.close();
    }
    const deadline = performance.now() + 90_000;
    for (;;) {
      try {
        const bytes = await boundedRead(input.root, controls + "/" + input.action + ".release", 32);
        if (new TextDecoder("utf-8", { fatal: true }).decode(bytes) !== "release\n")
          throw new Error("Invalid fixture release marker");
        return;
      } catch (error) {
        if (!hasCode(error, "ENOENT")) throw error;
      }
      if (performance.now() >= deadline) throw new Error("Separate-process pause was not released");
      await new Promise<void>((done) => setTimeout(done, 25));
    }
  };
  const owner = await sharedResultOwner(input.root, async (phase) => {
    if (input.action === "ownership" && phase === "discovery") await pause();
  });
  const attempt = await beginSharedResult(owner, input.key, async (phase) => {
    if (input.action === "inventory" && phase === "inventory-complete") await pause();
  });
  if (!attempt) throw new Error("Contention fixture unexpectedly exhausted shared capacity");
  if (!(await completeSharedResult(owner, attempt, new TextEncoder().encode('{"child":true}\n'))))
    throw new Error("Contention fixture lost its isolated generation");
  process.stdout.write('{"passed":true}\n');
}
try {
  await main();
} catch (error) {
  process.stderr.write(
    (error instanceof Error ? error.message.slice(0, 1024) : "Shared-result child fixture failed") +
      "\n",
  );
  process.exitCode = 1;
}
