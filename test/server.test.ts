import { assertTemporaryFixtureSync, mkdtempSync } from "./temporary.ts";
import { afterEach, describe, expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { Effect, Schema } from "effect";
import {
  ArtifactsSchema,
  EventsSchema,
  AgentsSchema,
  ErrorResponseSchema,
  HealthSchema,
} from "@/harness";
import { HarnessError, TaskSchema } from "@/tasks";
import { WorkspaceSchema } from "@/workspaces";
import { openStore } from "../app/storage/index.ts";
import { startDaemon, type DaemonOptions } from "../app/server/index.ts";
import { acquireDaemonLock, readToken } from "../app/server/credentials.ts";

const directories: string[] = [];
afterEach(() => {
  for (const directory of directories.splice(0)) {
    const target = resolve(directory);
    assertTemporaryFixtureSync(target);
    rmSync(target, { recursive: true, force: true });
  }
});
function paths() {
  const root = mkdtempSync(join(tmpdir(), "teamagent-http-"));
  directories.push(root);
  const workspace = join(root, "workspace");
  const webDirectory = join(root, "web");
  mkdirSync(workspace);
  mkdirSync(webDirectory);
  writeFileSync(join(workspace, "hello.txt"), "Hello, harness.");
  writeFileSync(join(workspace, ".env"), "PRIVATE=secret");
  writeFileSync(join(webDirectory, "index.html"), "<!doctype html><title>Harness fixture</title>");
  writeFileSync(join(root, "outside.txt"), "Must not be served");
  return { root, workspace, webDirectory, config: { data: join(root, "state"), port: 0 } };
}
async function decode<A>(response: Response, schema: Schema.Codec<A>): Promise<A> {
  const value: unknown = await response.json();
  return Schema.decodeUnknownSync(schema)(value);
}
async function fixture(extra: Omit<DaemonOptions, "config" | "webDirectory"> = {}) {
  const p = paths();
  const daemon = await startDaemon({ config: p.config, webDirectory: p.webDirectory, ...extra });
  const request = (path: string, init: RequestInit = {}) => {
    const headers = new Headers(init.headers);
    if (!headers.has("authorization")) headers.set("authorization", `Bearer ${daemon.token}`);
    return fetch(`${daemon.url}${path}`, { ...init, headers });
  };
  const post = (path: string, value?: unknown) =>
    request(
      path,
      value === undefined
        ? { method: "POST" }
        : {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(value),
          },
    );
  const workspace = await decode(
    await post("/api/workspaces", { name: "Workspace", path: p.workspace }),
    WorkspaceSchema,
  );
  return { ...p, daemon, request, post, workspace };
}
async function eventually<A>(
  operation: () => Promise<A>,
  ready: (value: A) => boolean,
): Promise<A> {
  for (let attempt = 0; attempt < 200; attempt++) {
    const value = await operation();
    if (ready(value)) return value;
    await new Promise<void>((resolve) => setTimeout(resolve, 25));
  }
  throw new Error("HTTP task did not reach the expected state before the test deadline.");
}

describe("local daemon HTTP boundary", () => {
  test("workspace registration cannot expose service state or nest inside it", async () => {
    const f = await fixture();
    try {
      const nested = join(f.config.data, "nested");
      mkdirSync(nested);
      for (const path of [f.root, f.config.data, nested]) {
        const response = await f.post("/api/workspaces", { name: "Unsafe workspace", path });
        expect(response.status).toBe(400);
        expect((await decode(response, ErrorResponseSchema)).error.message).toContain(
          "private service data",
        );
      }
    } finally {
      await f.daemon.close();
    }
  });

  test("records approved failure explanations without exposing arbitrary executor exceptions", async () => {
    const f = await fixture({
      execute: (context) =>
        context.claim.task.objective === "Typed failure"
          ? Effect.fail(
              new HarnessError({ code: "capacity", message: "The task tool limit was reached." }),
            )
          : Effect.fail(new Error("Untrusted exception containing private-token-123")),
    });
    try {
      for (const objective of ["Typed failure", "Unknown failure"]) {
        const task = await decode(
          await f.post("/api/tasks", {
            workspaceId: f.workspace.id,
            objective,
            adapterId: "inspect",
          }),
          TaskSchema,
        );
        await eventually(
          async () => decode(await f.request(`/api/tasks/${task.id}`), TaskSchema),
          (value) => value.status === "failed",
        );
        const events = await decode(await f.request(`/api/tasks/${task.id}/events`), EventsSchema);
        const final = events.at(-1);
        expect(final?.type).toBe("failed");
        if (objective === "Typed failure")
          expect(final?.message).toBe("The task tool limit was reached.");
        else expect(JSON.stringify(events)).not.toContain("private-token-123");
      }
    } finally {
      await f.daemon.close();
    }
  });

  test("shutdown interrupts active work and retains the final state across restart", async () => {
    const f = await fixture({
      execute: (_context, signal) =>
        Effect.promise(
          () =>
            new Promise<void>((resolve) => {
              if (signal.aborted) resolve();
              else signal.addEventListener("abort", () => resolve(), { once: true });
            }),
        ),
    });
    const task = await decode(
      await f.post("/api/tasks", {
        workspaceId: f.workspace.id,
        objective: "Pending operation",
        adapterId: "inspect",
      }),
      TaskSchema,
    );
    try {
      await eventually(
        async () => decode(await f.request(`/api/tasks/${task.id}`), TaskSchema),
        (value) => value.status === "running",
      );
      await f.daemon.close();
      const store = await Effect.runPromise(
        openStore({
          databasePath: join(f.config.data, "state.sqlite"),
          blobDirectory: join(f.config.data, "blobs"),
        }),
      );
      try {
        expect((await Effect.runPromise(store.getTask(task.id))).status).toBe("interrupted");
        expect((await Effect.runPromise(store.listEvents(task.id))).at(-1)?.message).toContain(
          "not replayed",
        );
      } finally {
        await Effect.runPromise(store.close());
      }
    } finally {
      await f.daemon.close();
    }
  });

  test("requires pairing, validates Host and Origin, and exposes only safe health metadata", async () => {
    const f = await fixture();
    try {
      const health = await decode(await fetch(`${f.daemon.url}/api/health`), HealthSchema);
      expect(health.status).toBe("ok");
      expect((await fetch(`${f.daemon.url}/api/tasks`)).status).toBe(401);
      expect(
        (await f.request("/api/tasks", { headers: { authorization: "Bearer incorrect" } })).status,
      ).toBe(401);
      expect(
        (await f.request("/api/tasks", { headers: { origin: "https://attacker.invalid" } })).status,
      ).toBe(403);
      expect(
        (await f.request("/api/tasks", { headers: { host: "attacker.invalid" } })).status,
      ).toBe(403);
      expect((await f.request("/api/tasks", { headers: { origin: "null" } })).status).toBe(403);
      const response = await f.request("/api/agents");
      expect(response.headers.get("cache-control")).toBe("no-store");
      expect(response.headers.get("x-content-type-options")).toBe("nosniff");
      expect(await decode(response, AgentsSchema)).toMatchObject([
        { id: "inspect", available: true },
        { id: "pi", available: false },
      ]);
      expect(await readToken(f.config.data)).toBe(f.daemon.token);
    } finally {
      await f.daemon.close();
    }
  });

  test("desktop CORS is opt-in and restricted to local Tauri origins", async () => {
    const f = await fixture({ desktop: true });
    try {
      const response = await f.request("/api/tasks", {
        method: "OPTIONS",
        headers: { origin: "http://tauri.localhost" },
      });
      expect(response.status).toBe(204);
      expect(response.headers.get("access-control-allow-origin")).toBe("http://tauri.localhost");
      expect(
        (await f.request("/api/tasks", { headers: { origin: "http://tauri.localhost" } })).status,
      ).toBe(200);
      expect(
        (
          await f.request("/api/tasks", {
            method: "OPTIONS",
            headers: { origin: "https://attacker.invalid" },
          })
        ).status,
      ).toBe(403);
    } finally {
      await f.daemon.close();
    }
    const web = await fixture();
    try {
      expect(
        (await web.request("/api/tasks", { headers: { origin: "http://tauri.localhost" } })).status,
      ).toBe(403);
    } finally {
      await web.daemon.close();
    }
  });

  test("rejects malformed, oversized, unexpected and ambiguous transport input", async () => {
    const f = await fixture();
    try {
      for (const path of [
        "/api/tasks?unknown=1",
        "/api/tasks/id/events?after=1&after=2",
        "/api/tasks/id/events?after=-1",
        "/api/tasks/id/events?after=NaN",
      ]) {
        expect((await f.request(path)).status).toBe(400);
      }
      const input = { workspaceId: f.workspace.id, objective: "Inspect", adapterId: "inspect" };
      expect((await f.post("/api/tasks", { ...input, unknown: true })).status).toBe(400);
      expect((await f.post("/api/tasks", { ...input, adapterId: "pi" })).status).toBe(400);
      expect((await f.post("/api/workspaces", { name: "Relative", path: "." })).status).toBe(400);
      expect((await f.request("/api/tasks", { method: "POST", body: "{}" })).status).toBe(400);
      expect(
        (
          await f.request("/api/tasks", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: "{",
          })
        ).status,
      ).toBe(400);
      expect(
        (
          await f.request("/api/tasks", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: new Uint8Array([0xc3, 0x28]),
          })
        ).status,
      ).toBe(400);
      const huge = await f.post("/api/tasks", { ...input, objective: "x".repeat(40_000) });
      expect([400, 413]).toContain(huge.status);
      expect((await f.post("/api/tasks/missing/cancel")).status).toBe(404);
    } finally {
      await f.daemon.close();
    }
  });

  test("durably executes an idempotent inspection and serves its verified artifact", async () => {
    const f = await fixture();
    try {
      const input = {
        workspaceId: f.workspace.id,
        objective: "Inventory this workspace",
        adapterId: "inspect",
        idempotencyKey: "http-request-1",
      };
      const accepted = await f.post("/api/tasks", input);
      expect(accepted.status).toBe(201);
      const task = await decode(accepted, TaskSchema);
      expect((await decode(await f.post("/api/tasks", input), TaskSchema)).id).toBe(task.id);
      expect(
        (await f.post("/api/tasks", { ...input, objective: "Different request" })).status,
      ).toBe(409);
      const completed = await eventually(
        async () => decode(await f.request(`/api/tasks/${task.id}`), TaskSchema),
        (value) => value.status === "succeeded" || value.status === "failed",
      );
      expect(completed.status).toBe("succeeded");
      const events = await decode(await f.request(`/api/tasks/${task.id}/events`), EventsSchema);
      expect(events.map((event) => event.sequence)).toEqual([1, 2, 3, 4, 5]);
      expect(events.map((event) => event.type)).toEqual([
        "accepted",
        "started",
        "progress",
        "artifact",
        "completed",
      ]);
      expect(
        (await decode(await f.request(`/api/tasks/${task.id}/events?after=4`), EventsSchema)).map(
          (event) => event.type,
        ),
      ).toEqual(["completed"]);
      const artifacts = await decode(
        await f.request(`/api/tasks/${task.id}/artifacts`),
        ArtifactsSchema,
      );
      expect(artifacts).toHaveLength(1);
      const artifact = artifacts[0];
      if (!artifact) throw new Error("Expected the inspection artifact.");
      const content = await f.request(`/api/artifacts/${artifact.id}/content`);
      expect(content.headers.get("x-content-sha256")).toBe(artifact.sha256);
      expect(content.headers.get("content-disposition")).toContain("attachment;");
      const inventory = await decode(
        content,
        Schema.Struct({
          schemaVersion: Schema.Literal(1),
          files: Schema.Array(Schema.String),
          truncated: Schema.Boolean,
        }),
      );
      expect(inventory.files).toEqual(["hello.txt"]);
      expect(inventory.truncated).toBe(false);
      const cancelled = await f.post(`/api/tasks/${task.id}/cancel`);
      expect(cancelled.status).toBe(409);
      expect((await decode(cancelled, ErrorResponseSchema)).error.code).toBe("conflict");
    } finally {
      await f.daemon.close();
    }
  });

  test("cancellation waits for cooperative cleanup before another task enters the workspace", async () => {
    let running = 0;
    let maximum = 0;
    let executions = 0;
    const f = await fixture({
      execute: (_context, signal) =>
        Effect.tryPromise({
          try: async () => {
            executions++;
            running++;
            maximum = Math.max(maximum, running);
            try {
              if (executions === 1)
                await new Promise<void>((resolve) => {
                  if (signal.aborted) resolve();
                  else
                    signal.addEventListener(
                      "abort",
                      () => {
                        setTimeout(resolve, 30);
                      },
                      { once: true },
                    );
                });
            } finally {
              running--;
            }
          },
          catch: (error) => error,
        }),
    });
    try {
      const input = {
        workspaceId: f.workspace.id,
        objective: "Wait for cancellation",
        adapterId: "inspect",
      };
      const first = await decode(await f.post("/api/tasks", input), TaskSchema);
      await eventually(
        async () => decode(await f.request(`/api/tasks/${first.id}`), TaskSchema),
        (value) => value.status === "running",
      );
      const second = await decode(
        await f.post("/api/tasks", { ...input, objective: "Next task" }),
        TaskSchema,
      );
      const response = await f.post(`/api/tasks/${first.id}/cancel`);
      expect(response.status).toBe(200);
      expect((await decode(response, TaskSchema)).status).toBe("cancelled");
      expect(running).toBe(0);
      const next = await eventually(
        async () => decode(await f.request(`/api/tasks/${second.id}`), TaskSchema),
        (value) => value.status === "succeeded",
      );
      expect(next.status).toBe("succeeded");
      expect(maximum).toBe(1);
      expect(executions).toBe(2);
    } finally {
      await f.daemon.close();
    }
  });

  test("resumes durable queued work after restart while refusing duplicate daemon owners", async () => {
    const p = paths();
    const store = await Effect.runPromise(
      openStore({
        databasePath: join(p.config.data, "state.sqlite"),
        blobDirectory: join(p.config.data, "blobs"),
      }),
    );
    const workspace = await Effect.runPromise(
      store.createWorkspace({ name: "Restart", path: p.workspace }),
    );
    const task = await Effect.runPromise(
      store.createTask({
        workspaceId: workspace.id,
        objective: "Persisted objective",
        adapterId: "inspect",
      }),
    );
    await Effect.runPromise(store.close());
    const daemon = await startDaemon({ config: p.config, webDirectory: p.webDirectory });
    try {
      const duplicate = await startDaemon({ config: p.config, webDirectory: p.webDirectory }).then(
        () => undefined,
        (error: unknown) => error,
      );
      expect(duplicate instanceof Error ? duplicate.message : "").toContain("already owns");
      expect(
        (
          await eventually(
            () => Effect.runPromise(daemon.store.getTask(task.id)),
            (value) => value.status === "succeeded",
          )
        ).status,
      ).toBe("succeeded");
      await daemon.close();
      await daemon.close();
      const restarted = await startDaemon({ config: p.config, webDirectory: p.webDirectory });
      try {
        expect((await Effect.runPromise(restarted.store.getTask(task.id))).status).toBe(
          "succeeded",
        );
        expect(await Effect.runPromise(restarted.store.listEvents(task.id))).toHaveLength(5);
      } finally {
        await restarted.close();
      }
    } finally {
      await daemon.close();
    }
  });

  test("static serving is contained and does not disclose files above the web root", async () => {
    const f = await fixture();
    try {
      const page = await fetch(`${f.daemon.url}/`);
      expect(page.status).toBe(200);
      expect(page.headers.get("content-security-policy")).toContain("frame-ancestors 'none'");
      expect(await page.text()).toContain("Harness fixture");
      expect((await fetch(`${f.daemon.url}/%2e%2e%2foutside.txt`)).status).toBe(404);
      expect((await fetch(`${f.daemon.url}/%5coutside.txt`)).status).toBe(400);
      const head = await fetch(`${f.daemon.url}/`, { method: "HEAD" });
      expect(await head.text()).toBe("");
    } finally {
      await f.daemon.close();
    }
  });

  test("daemon ownership recovers a dead process atomically without stealing a new owner", async () => {
    const p = paths();
    const release = await acquireDaemonLock(p.config.data);
    await release();
    const database = new Database(join(p.config.data, "daemon.sqlite"));
    try {
      database
        .query("INSERT INTO owner(singleton,pid,nonce) VALUES(1,?,?)")
        .run(2_147_483_647, "stale-owner");
    } finally {
      database.close();
    }
    const contenders = await Promise.allSettled([
      acquireDaemonLock(p.config.data),
      acquireDaemonLock(p.config.data),
    ]);
    expect(contenders.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(contenders.filter((result) => result.status === "rejected")).toHaveLength(1);
    for (const result of contenders) if (result.status === "fulfilled") await result.value();
    const next = await acquireDaemonLock(p.config.data);
    await next();
  });
});
