import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile, readdir, stat } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import type { Schema } from "effect";
import { parseJson } from "./contracts.ts";

export const repository = resolve(import.meta.dir, "../..");
export const cache = resolve(repository, ".cache/memory-benchmark");
export const sha256 = (value: string | Uint8Array): string =>
  createHash("sha256").update(value).digest("hex");
export async function readJson<A>(path: string, schema: Schema.Codec<A>): Promise<A> {
  const info = await stat(path);
  if (info.size > 100_000_000) throw new Error("Benchmark JSON exceeds 100 MB input bound");
  return parseJson(schema, await readFile(path, "utf8"));
}
export async function writeJson(path: string, value: unknown): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(value, null, 2) + "\n", { flag: "wx" });
}
export async function directoryBytes(path: string): Promise<number> {
  let bytes = 0;
  for (const entry of await readdir(path, { withFileTypes: true })) {
    const target = resolve(path, entry.name);
    if (entry.isSymbolicLink()) continue;
    if (entry.isDirectory()) bytes += await directoryBytes(target);
    else bytes += (await stat(target)).size;
  }
  return bytes;
}
