import { Schema } from "effect";
import { createHash } from "node:crypto";
import { ErrorResponseSchema } from "@/harness";
import { readToken } from "../server/credentials.ts";

export async function connectClient(data: string, explicitUrl?: string, port = 4318) {
  const url = new URL(explicitUrl ?? `http://127.0.0.1:${port}`);
  if (
    url.protocol !== "http:" ||
    url.hostname !== "127.0.0.1" ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  )
    throw new Error("Client URL must be a loopback HTTP origin");
  const token = await readToken(data);
  return {
    async request(path: string, method = "GET", input?: unknown): Promise<unknown> {
      const response = await fetch(new URL(path, url), {
        method,
        signal: AbortSignal.timeout(30000),
        redirect: "error",
        headers: {
          authorization: `Bearer ${token}`,
          ...(input === undefined ? {} : { "content-type": "application/json" }),
        },
        ...(input === undefined ? {} : { body: JSON.stringify(input) }),
      });
      const value: unknown = await response.json();
      if (!response.ok) {
        const problem = Schema.decodeUnknownSync(ErrorResponseSchema)(value);
        throw new Error(problem.error.message);
      }
      return value;
    },
    async download(id: string): Promise<Uint8Array> {
      const response = await fetch(
        new URL(`/api/artifacts/${encodeURIComponent(id)}/content`, url),
        {
          signal: AbortSignal.timeout(30000),
          redirect: "error",
          headers: { authorization: `Bearer ${token}` },
        },
      );
      if (!response.ok) throw new Error("Artifact download failed");
      const maximum = 4 * 1024 * 1024;
      const reader = response.body?.getReader();
      if (!reader) throw new Error("Artifact response is empty");
      const chunks: Uint8Array[] = [];
      let size = 0;
      try {
        while (true) {
          const chunk = await reader.read();
          if (chunk.done) break;
          const bytes = Schema.decodeUnknownSync(Schema.instanceOf(Uint8Array))(chunk.value);
          size += bytes.byteLength;
          if (size > maximum) throw new Error("Artifact exceeds size limit");
          chunks.push(bytes);
        }
      } finally {
        await reader.cancel();
        reader.releaseLock();
      }
      const bytes = new Uint8Array(size);
      let offset = 0;
      for (const chunk of chunks) {
        bytes.set(chunk, offset);
        offset += chunk.byteLength;
      }
      const digest = response.headers.get("x-content-sha256");
      if (!digest || createHash("sha256").update(bytes).digest("hex") !== digest)
        throw new Error("Artifact integrity check failed");
      return bytes;
    },
  };
}
