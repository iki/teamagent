import { Effect, Schema } from "effect";
import { AgentDescriptorSchema } from "@/agents";
import { ArtifactSchema } from "@/artifacts";
import { ConnectionSchema, ErrorResponseSchema } from "@/harness";
import { TaskEventSchema, TaskSchema, type CreateTaskInput } from "@/tasks";
import { WorkspaceSchema, type CreateWorkspaceInput } from "@/workspaces";

export interface Connection {
  readonly url: string;
  readonly token: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status = 0,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const responseLimit = 2 * 1024 * 1024;
export async function readBounded(response: Response): Promise<string> {
  if (!response.body) return "";
  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true });
  let bytes = 0;
  let result = "";
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      bytes += part.value.byteLength;
      if (bytes > responseLimit)
        throw new ApiError("The response is too large. Use the CLI to export this record.");
      result += decoder.decode(part.value, { stream: true });
    }
    return result + decoder.decode();
  } finally {
    await reader.cancel();
    reader.releaseLock();
  }
}

export async function verifyArtifact(content: string, expectedSha256: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(content));
  const actual = [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  if (actual !== expectedSha256)
    throw new ApiError(
      "The artifact failed its integrity check. Do not use this copy; reload the task and try again.",
    );
  return content;
}

async function request(
  connection: Connection,
  path: string,
  signal: AbortSignal,
  method = "GET",
  body?: unknown,
): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(`${connection.url}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${connection.token}`,
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      signal,
      credentials: "omit",
      cache: "no-store",
      referrerPolicy: "no-referrer",
      redirect: "error",
    });
  } catch {
    throw new ApiError(
      "The local service could not be reached. Check that it is running and reconnect.",
    );
  }
  const text = await readBounded(response);
  let payload: unknown;
  try {
    payload = JSON.parse(text);
  } catch {
    throw new ApiError("The service returned an invalid response. Check the service version.");
  }
  if (!response.ok) {
    if (response.status === 401 || response.status === 403)
      throw new ApiError(
        "Connection was refused. Check your access token and reconnect.",
        response.status,
      );
    const failure = await Effect.runPromise(
      Schema.decodeUnknownEffect(ErrorResponseSchema)(payload).pipe(Effect.option),
    );
    throw new ApiError(
      failure._tag === "Some"
        ? failure.value.error.message
        : "The service could not complete this request.",
      response.status,
    );
  }
  return payload;
}

function decode<A>(schema: Schema.Codec<A>, promise: Promise<unknown>): Promise<A> {
  return Effect.runPromise(
    Effect.tryPromise({ try: () => promise, catch: (error) => error }).pipe(
      Effect.flatMap(Schema.decodeUnknownEffect(schema)),
    ),
  );
}

export const api = {
  workspaces: (c: Connection, signal: AbortSignal) =>
    decode(Schema.Array(WorkspaceSchema), request(c, "/api/workspaces", signal)),
  agents: (c: Connection, signal: AbortSignal) =>
    decode(Schema.Array(AgentDescriptorSchema), request(c, "/api/agents", signal)),
  tasks: (c: Connection, signal: AbortSignal) =>
    decode(Schema.Array(TaskSchema), request(c, "/api/tasks", signal)),
  createWorkspace: (c: Connection, input: CreateWorkspaceInput, signal: AbortSignal) =>
    decode(WorkspaceSchema, request(c, "/api/workspaces", signal, "POST", input)),
  createTask: (c: Connection, input: CreateTaskInput, signal: AbortSignal) =>
    decode(TaskSchema, request(c, "/api/tasks", signal, "POST", input)),
  cancel: (c: Connection, id: string, signal: AbortSignal) =>
    decode(
      TaskSchema,
      request(c, `/api/tasks/${encodeURIComponent(id)}/cancel`, signal, "POST", {}),
    ),
  events: (c: Connection, id: string, after: number, signal: AbortSignal) =>
    decode(
      Schema.Array(TaskEventSchema),
      request(c, `/api/tasks/${encodeURIComponent(id)}/events?after=${after}`, signal),
    ),
  artifacts: (c: Connection, id: string, signal: AbortSignal) =>
    decode(
      Schema.Array(ArtifactSchema),
      request(c, `/api/tasks/${encodeURIComponent(id)}/artifacts`, signal),
    ),
  async content(c: Connection, id: string, sha256: string, signal: AbortSignal): Promise<string> {
    const response = await fetch(`${c.url}/api/artifacts/${encodeURIComponent(id)}/content`, {
      headers: { Authorization: `Bearer ${c.token}` },
      signal,
      credentials: "omit",
      cache: "no-store",
      referrerPolicy: "no-referrer",
      redirect: "error",
    });
    if (!response.ok)
      throw new ApiError("The artifact could not be loaded. Refresh the task and try again.");
    return verifyArtifact(await readBounded(response), sha256);
  },
};

export async function desktopConnection(): Promise<Connection | null> {
  const { isTauri, invoke } = await import("@tauri-apps/api/core");
  if (!isTauri()) return null;
  let value: unknown;
  try {
    value = await invoke<unknown>("daemon_connection");
  } catch (error: unknown) {
    const message = await Effect.runPromise(
      Schema.decodeUnknownEffect(Schema.String.check(Schema.isMaxLength(500)))(error).pipe(
        Effect.option,
      ),
    );
    throw new ApiError(
      message._tag === "Some"
        ? message.value
        : "The desktop service could not start. Rebuild or reinstall Team Agent, then try again.",
    );
  }
  const connection = await Effect.runPromise(Schema.decodeUnknownEffect(ConnectionSchema)(value));
  const url = new URL(connection.url);
  if (
    url.protocol !== "http:" ||
    url.hostname !== "127.0.0.1" ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash ||
    connection.token.length < 32
  )
    throw new ApiError("The desktop service returned an invalid connection.");
  return { url: url.origin, token: connection.token };
}

export function errorMessage(error: unknown): string {
  return error instanceof ApiError
    ? error.message
    : "This action could not be completed. Reconnect and try again.";
}
