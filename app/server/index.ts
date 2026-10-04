import { Effect, Schema } from "effect";
import { readFile, realpath, stat } from "node:fs/promises";
import { dirname, extname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { HarnessError, CreateTaskInputSchema, type Store } from "@/tasks";
import { CreateWorkspaceInputSchema } from "@/workspaces";
import type { HarnessConfig } from "@/harness";
import { openStore } from "../storage/index.ts";
import { pathsOverlap } from "../storage/paths.ts";
import { describeAgents } from "../adapters/index.ts";
import { resolveModel, type ModelBinding } from "../adapters/models.ts";
import { acquireDaemonLock, authorized, ensureToken } from "./credentials.ts";
import { createScheduler, type Executor } from "./scheduler.ts";
import { version } from "../../package.json";

const maximumBody = 32768;
const JsonInput = Schema.fromJsonString(Schema.Unknown);
const desktopOrigins = new Set([
  "tauri://localhost",
  "http://tauri.localhost",
  "https://tauri.localhost",
]);
const json = (value: unknown, status = 200) => Response.json(value, { status });
const errorResponse = (code: string, message: string, status: number) =>
  json({ error: { code, message } }, status);
const errorStatus = (error: HarnessError) =>
  error.code === "not_found"
    ? 404
    : error.code === "conflict" || error.code === "stale_lease"
      ? 409
      : error.code === "capacity"
        ? 429
        : error.code === "invalid"
          ? 400
          : 500;

async function body(request: Request): Promise<unknown> {
  if (request.headers.get("content-type")?.split(";")[0]?.trim() !== "application/json")
    throw new HarnessError({ code: "invalid", message: "Expected application/json." });
  if (!request.body)
    throw new HarnessError({ code: "invalid", message: "Request body is required." });
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      const chunk = Schema.decodeUnknownSync(Schema.instanceOf(Uint8Array))(next.value);
      size += chunk.byteLength;
      if (size > maximumBody)
        throw new HarnessError({ code: "invalid", message: "Request exceeds 32768 bytes." });
      chunks.push(chunk);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return Schema.decodeUnknownSync(JsonInput)(
      new TextDecoder("utf-8", { fatal: true }).decode(bytes),
    );
  } catch (error) {
    await reader.cancel().catch(() => undefined);
    if (error instanceof HarnessError) throw error;
    throw new HarnessError({ code: "invalid", message: "Invalid JSON request body." });
  } finally {
    reader.releaseLock();
  }
}

export interface DaemonOptions {
  readonly config: HarnessConfig;
  readonly token?: string | undefined;
  readonly desktop?: boolean | undefined;
  readonly webDirectory?: string | undefined;
  readonly binding?: ModelBinding | undefined;
  readonly execute?: Executor | undefined;
}

export async function startDaemon(options: DaemonOptions) {
  const { config } = options;
  const binding = options.binding ?? resolveModel(config.pi);
  const agents = describeAgents(binding);
  const token = await ensureToken(config.data, options.token);
  const stateDirectory = await realpath(config.data);
  const release = await acquireDaemonLock(config.data);
  let store: Store;
  try {
    store = await Effect.runPromise(
      openStore({
        databasePath: join(config.data, "state.sqlite"),
        blobDirectory: join(config.data, "blobs"),
      }),
    );
  } catch (error) {
    await release();
    throw error;
  }
  const scheduler = createScheduler(store, binding, options.execute);
  const webDirectory =
    options.webDirectory ?? resolve(dirname(fileURLToPath(import.meta.url)), "../../data/web");
  const queryCheck = (url: URL, allowed: readonly string[] = []) => {
    if (
      url.href.length > 8192 ||
      [...url.searchParams.keys()].some(
        (key) => !allowed.includes(key) || url.searchParams.getAll(key).length !== 1,
      )
    )
      throw new HarnessError({ code: "invalid", message: "Invalid request query." });
  };
  const run = <A>(effect: Effect.Effect<A, HarnessError>) =>
    Effect.runPromise(effect.pipe(Effect.catch((error) => Effect.succeed(error))));
  const respond = async <A>(effect: Effect.Effect<A, HarnessError>, status = 200) => {
    const result = await run(effect);
    return result instanceof HarnessError
      ? errorResponse(result.code, result.message, errorStatus(result))
      : json(result, status);
  };
  async function route(request: Request, url: URL): Promise<Response> {
    const parts = url.pathname.split("/").filter(Boolean);
    if (url.pathname === "/api/health" && request.method === "GET") {
      queryCheck(url);
      return json({ status: "ok", version });
    }
    if (url.pathname.startsWith("/api/")) {
      if (!authorized(request.headers.get("authorization"), token))
        return errorResponse("unauthorized", "A local pairing token is required.", 401);
      queryCheck(url, parts[3] === "events" ? ["after"] : []);
      if (parts[1] === "agents" && parts.length === 2 && request.method === "GET")
        return json(agents);
      if (parts[1] === "workspaces" && parts.length === 2) {
        if (request.method === "GET") return respond(store.listWorkspaces());
        if (request.method === "POST") {
          const input = Schema.decodeUnknownSync(CreateWorkspaceInputSchema)(await body(request), {
            onExcessProperty: "error",
          });
          if (!isAbsolute(input.path))
            throw new HarnessError({
              code: "invalid",
              message: "Workspace paths must be absolute.",
            });
          const path = await realpath(input.path);
          if (pathsOverlap(path, stateDirectory))
            throw new HarnessError({
              code: "invalid",
              message: "Workspace directories cannot overlap the private service data directory.",
            });
          if (!(await stat(path)).isDirectory())
            throw new HarnessError({
              code: "invalid",
              message: "Workspace must be an existing directory.",
            });
          return respond(store.createWorkspace({ ...input, path }), 201);
        }
      }
      if (parts[1] === "tasks") {
        if (parts.length === 2 && request.method === "GET") return respond(store.listTasks());
        if (parts.length === 2 && request.method === "POST") {
          const input = Schema.decodeUnknownSync(CreateTaskInputSchema)(await body(request), {
            onExcessProperty: "error",
          });
          if (!agents.some((agent) => agent.id === input.adapterId && agent.available))
            return errorResponse(
              "invalid",
              "Selected adapter is unavailable; configure its model and credential first.",
              400,
            );
          return respond(store.createTask(input), 201);
        }
        const id = parts[2];
        if (id && parts.length === 3 && request.method === "GET") return respond(store.getTask(id));
        if (id && parts.length === 4) {
          if (parts[3] === "events" && request.method === "GET") {
            const raw = url.searchParams.get("after") ?? "0";
            if (!/^\d{1,9}$/.test(raw))
              return errorResponse("invalid", "Invalid event cursor.", 400);
            return respond(store.listEvents(id, Number(raw)));
          }
          if (parts[3] === "artifacts" && request.method === "GET")
            return respond(store.listArtifacts(id));
          if (parts[3] === "cancel" && request.method === "POST")
            return json(await scheduler.cancel(id));
        }
      }
      if (
        parts[1] === "artifacts" &&
        parts[2] &&
        parts[3] === "content" &&
        parts.length === 4 &&
        request.method === "GET"
      ) {
        const result = await run(store.readArtifact(parts[2]));
        if (result instanceof HarnessError)
          return errorResponse(result.code, result.message, errorStatus(result));
        return new Response(new Uint8Array(result.content), {
          headers: {
            "content-type": result.artifact.mediaType,
            "content-disposition": `attachment; filename*=UTF-8''${encodeURIComponent(result.artifact.name)}`,
            "x-content-sha256": result.artifact.sha256,
          },
        });
      }
      return errorResponse("not_found", "Endpoint not found.", 404);
    }
    queryCheck(url);
    if (request.method !== "GET" && request.method !== "HEAD")
      return errorResponse("not_found", "Endpoint not found.", 404);
    const pathname = decodeURIComponent(url.pathname);
    if (pathname.includes("\\") || pathname.includes("\0"))
      return errorResponse("invalid", "Invalid asset path.", 400);
    const root = await realpath(webDirectory).catch(() => undefined);
    if (!root)
      return new Response(
        "Build the web app with aube run --no-install build:web, then restart the service.",
        { status: 503 },
      );
    const path = await realpath(
      resolve(root, `.${pathname === "/" ? "/index.html" : pathname}`),
    ).catch(() => undefined);
    if (!path) return errorResponse("not_found", "Asset not found.", 404);
    const rel = relative(root, path);
    if (rel.startsWith(`..${sep}`) || isAbsolute(rel) || !(await stat(path)).isFile())
      return errorResponse("not_found", "Asset not found.", 404);
    const types: Readonly<Record<string, string>> = {
      ".html": "text/html; charset=utf-8",
      ".js": "text/javascript; charset=utf-8",
      ".css": "text/css; charset=utf-8",
      ".svg": "image/svg+xml",
    };
    return new Response(request.method === "HEAD" ? null : await readFile(path), {
      headers: { "content-type": types[extname(path)] ?? "application/octet-stream" },
    });
  }
  let server: ReturnType<typeof Bun.serve>;
  try {
    server = Bun.serve({
      hostname: "127.0.0.1",
      port: config.port,
      maxRequestBodySize: maximumBody,
      idleTimeout: 20,
      async fetch(request) {
        const url = new URL(request.url);
        const origin = request.headers.get("origin");
        const expected = `http://127.0.0.1:${server.port}`;
        const originAllowed =
          origin === null ||
          origin === expected ||
          (options.desktop === true && desktopOrigins.has(origin));
        if (
          url.origin !== expected ||
          request.headers.get("host") !== `127.0.0.1:${server.port}` ||
          !originAllowed
        )
          return errorResponse("forbidden", "Origin is not allowed.", 403);
        let response: Response;
        if (
          request.method === "OPTIONS" &&
          origin !== null &&
          options.desktop === true &&
          desktopOrigins.has(origin)
        ) {
          response = new Response(null, {
            status: 204,
            headers: {
              "access-control-allow-methods": "GET,POST",
              "access-control-allow-headers": "authorization,content-type",
            },
          });
        } else {
          try {
            response = await route(request, url);
          } catch (error) {
            response =
              error instanceof HarnessError
                ? errorResponse(error.code, error.message, errorStatus(error))
                : errorResponse(
                    "invalid",
                    "The request could not be completed; check its fields and local paths.",
                    400,
                  );
          }
        }
        response.headers.set("cache-control", "no-store");
        response.headers.set("x-content-type-options", "nosniff");
        response.headers.set("referrer-policy", "no-referrer");
        response.headers.set(
          "content-security-policy",
          "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
        );
        if (origin !== null && options.desktop === true && desktopOrigins.has(origin)) {
          response.headers.set("access-control-allow-origin", origin);
          response.headers.set("vary", "Origin");
        }
        return response;
      },
    });
  } catch (error) {
    await scheduler.close();
    await Effect.runPromise(store.close());
    await release();
    throw error;
  }
  let closing: Promise<void> | undefined;
  return {
    url: `http://127.0.0.1:${server.port}`,
    token,
    store,
    close: () => {
      closing ??= (async () => {
        try {
          await server.stop(true);
        } finally {
          try {
            await scheduler.close();
          } finally {
            try {
              await Effect.runPromise(store.close());
            } finally {
              await release();
            }
          }
        }
      })();
      return closing;
    },
  };
}
