import { afterEach, describe, expect, test } from "bun:test";
import { rejects } from "node:assert/strict";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { isAbsolute, join, relative, resolve } from "node:path";
import { Effect, Schema } from "effect";
import {
  createAssistantMessageEventStream,
  type AssistantMessage,
  type Model,
  type Api,
  type TranscriptContext,
} from "@earendil-works/pi-ai";
import type { StreamFn } from "@earendil-works/pi-agent-core";
import { executeTask, describeAgents } from "../app/adapters/index.ts";
import {
  hash,
  listWorkspaceFiles,
  readWorkspaceFile,
  safePath,
  writeWorkspaceFile,
} from "../app/adapters/files.ts";
import { resolveModel } from "../app/adapters/models.ts";
import { openStore } from "../app/storage/index.ts";

const run = Effect.runPromise;
const directories: string[] = [];
afterEach(() => {
  for (const directory of directories.splice(0)) {
    const target = resolve(directory);
    const contained = relative(resolve(tmpdir()), target);
    if (
      isAbsolute(contained) ||
      contained.startsWith("..") ||
      !contained.startsWith("teamagent-adapter-")
    )
      throw new Error("Refusing to remove an unexpected adapter fixture path.");
    rmSync(target, { recursive: true, force: true });
  }
});

function filesFixture() {
  const root = mkdtempSync(join(tmpdir(), "teamagent-adapter-"));
  directories.push(root);
  const workspacePath = join(root, "workspace");
  mkdirSync(workspacePath);
  return { root, workspacePath, signal: new AbortController().signal };
}

async function executionFixture(
  options: { allowWrites?: boolean; maxTurns?: number; adapterId?: string } = {},
) {
  const files = filesFixture();
  const store = await run(
    openStore({
      databasePath: join(files.root, "store.sqlite"),
      blobDirectory: join(files.root, "blobs"),
    }),
  );
  const workspace = await run(
    store.createWorkspace({ name: "Adapter fixture", path: files.workspacePath }),
  );
  const task = await run(
    store.createTask({
      workspaceId: workspace.id,
      objective: "Inspect the input and explain any changes.",
      adapterId: options.adapterId ?? "pi",
      allowWrites: options.allowWrites ?? false,
      maxTurns: options.maxTurns ?? 8,
    }),
  );
  const claim = await run(store.claimTask(task.id, "fixture-worker", 60_000));
  return { ...files, store, workspace, task, claim };
}

const model: Model<Api> = {
  id: "fixture-model",
  name: "Deterministic fixture",
  api: "openai-completions",
  provider: "fixture",
  baseUrl: "http://127.0.0.1:1/unused",
  input: ["text"],
  reasoning: false,
  contextWindow: 32_000,
  maxTokens: 4096,
  cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
};
function message(
  content: AssistantMessage["content"],
  stopReason: AssistantMessage["stopReason"] = "stop",
): AssistantMessage {
  return {
    role: "assistant",
    content,
    api: model.api,
    provider: model.provider,
    model: model.id,
    usage: {
      input: 12,
      output: 7,
      cacheRead: 0,
      cacheWrite: 0,
      totalTokens: 19,
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
    },
    stopReason,
    timestamp: 1_000_000,
  };
}
function response(value: AssistantMessage) {
  const stream = createAssistantMessageEventStream();
  stream.push({ type: "start", partial: value });
  if (value.stopReason === "error" || value.stopReason === "aborted")
    stream.push({ type: "error", reason: value.stopReason, error: value });
  else if (value.stopReason !== "pending")
    stream.push({ type: "done", reason: value.stopReason, message: value });
  else stream.end(value);
  return stream;
}
function scripted(
  turns: readonly AssistantMessage[],
  inspect?: (context: TranscriptContext, call: number) => void,
): { stream: StreamFn; calls: () => number } {
  let calls = 0;
  return {
    calls: () => calls,
    stream: (_model, context, options) => {
      expect(options?.signal).toBeDefined();
      expect(options?.maxTokens).toBe(4096);
      inspect?.(context, calls);
      const next = turns[calls++];
      if (!next) throw new Error("Adapter requested an unexpected model turn.");
      return response(next);
    },
  };
}
const tool = (id: string, name: string, args: Record<string, string> = {}) => ({
  type: "toolCall" as const,
  id,
  name,
  arguments: args,
});
const text = (value: string) => ({ type: "text" as const, text: value });
const toolReceipt = Schema.Struct({
  effectId: Schema.String,
  tool: Schema.String,
  isError: Schema.Boolean,
});
const decodeReceipt = Schema.decodeUnknownSync(Schema.fromJsonString(toolReceipt));

describe("scoped workspace file adapter", () => {
  test("rejects traversal, private paths, symlink escape, malformed UTF-8, binary and oversized reads", async () => {
    const f = filesFixture();
    writeFileSync(join(f.workspacePath, "source.txt"), "hello 🌍");
    const read = await readWorkspaceFile(f.workspacePath, { path: "source.txt" }, f.signal);
    expect(read.content).toBe("hello 🌍");
    expect(read.sha256).toBe(hash(Buffer.from("hello 🌍")));
    writeFileSync(join(f.workspacePath, "bom.txt"), "\ufeffExact UTF-8");
    expect((await readWorkspaceFile(f.workspacePath, { path: "bom.txt" }, f.signal)).content).toBe(
      "\ufeffExact UTF-8",
    );
    for (const path of [
      "../private.txt",
      "..\\private.txt",
      "/absolute.txt",
      "C:\\private.txt",
      "file:stream",
      "folder//file",
      "./source.txt",
      ".env",
      ".env.production",
      ".git/config",
      "node_modules/pkg/a.js",
      "trailing.",
      "trailing ",
      "a\0b",
      "CON",
      "nul.txt",
      "COM1.log",
      "AUX",
    ])
      await rejects(safePath(f.workspacePath, path, true));
    const external = join(f.root, "external");
    mkdirSync(external);
    writeFileSync(join(external, "secret.txt"), "outside workspace");
    symlinkSync(external, join(f.workspacePath, "escape"), "junction");
    await rejects(
      readWorkspaceFile(f.workspacePath, { path: "escape/secret.txt" }, f.signal),
      /Symbolic links/,
    );
    writeFileSync(join(f.workspacePath, "binary"), Buffer.from([0, 1]));
    writeFileSync(join(f.workspacePath, "malformed"), Buffer.from([0xc3, 0x28]));
    writeFileSync(join(f.workspacePath, "large"), Buffer.alloc(128001, 97));
    for (const path of ["binary", "malformed", "large"])
      await rejects(readWorkspaceFile(f.workspacePath, { path }, f.signal));
    await rejects(
      readWorkspaceFile(f.workspacePath, { path: "source.txt", unexpected: true }, f.signal),
    );
    renameSync(f.workspacePath, join(f.root, "original-workspace"));
    symlinkSync(external, f.workspacePath, "junction");
    await rejects(
      readWorkspaceFile(f.workspacePath, { path: "secret.txt" }, f.signal),
      /root changed/,
    );
    await rejects(listWorkspaceFiles(f.workspacePath, f.signal), /root changed/);
  });

  test("writes require optimistic revisions and honor byte limits and cancellation", async () => {
    const f = filesFixture();
    const created = await writeWorkspaceFile(
      f.workspacePath,
      { path: "new.txt", content: "first" },
      f.signal,
    );
    expect(created).toMatchObject({ bytes: 5, sha256: hash(Buffer.from("first")) });
    for (const input of [
      { path: "new.txt", content: "overwrite" },
      { path: "new.txt", content: "overwrite", expectedSha256: "0".repeat(64) },
      { path: "missing.txt", content: "overwrite", expectedSha256: created.sha256 },
    ])
      await rejects(writeWorkspaceFile(f.workspacePath, input, f.signal));
    await writeWorkspaceFile(
      f.workspacePath,
      { path: "new.txt", content: "second", expectedSha256: created.sha256 },
      f.signal,
    );
    expect(readFileSync(join(f.workspacePath, "new.txt"), "utf8")).toBe("second");
    await rejects(
      writeWorkspaceFile(
        f.workspacePath,
        { path: "large.txt", content: "界".repeat(50_000) },
        f.signal,
      ),
      /128000 bytes/,
    );
    const cancelled = new AbortController();
    cancelled.abort();
    await rejects(
      writeWorkspaceFile(
        f.workspacePath,
        { path: "cancelled.txt", content: "no" },
        cancelled.signal,
      ),
    );
    expect(existsSync(join(f.workspacePath, "cancelled.txt"))).toBe(false);
    expect(readdirSync(f.workspacePath).filter((name) => name.startsWith(".teamagent-"))).toEqual(
      [],
    );
  });

  test("inventory is bounded and reports incomplete coverage explicitly", async () => {
    const f = filesFixture();
    mkdirSync(join(f.workspacePath, ".git"));
    writeFileSync(join(f.workspacePath, ".git", "private"), "private");
    writeFileSync(join(f.workspacePath, ".env.local"), "private");
    mkdirSync(join(f.workspacePath, "a", "b", "c", "d", "e"), { recursive: true });
    writeFileSync(join(f.workspacePath, "a", "b", "c", "d", "e", "deep.txt"), "too deep");
    for (let index = 0; index < 501; index++)
      writeFileSync(join(f.workspacePath, `file-${String(index).padStart(3, "0")}.txt`), "fixture");
    const inventory = await listWorkspaceFiles(f.workspacePath, f.signal);
    expect(inventory.files).toHaveLength(500);
    expect(inventory.truncated).toBe(true);
    expect(inventory.files.some((path) => path.includes(".git") || path.includes(".env"))).toBe(
      false,
    );
  });
});

describe("real Pi loop integration with deterministic transport", () => {
  test("read and approved write tools produce fenced receipts, usage and verified final artifact", async () => {
    const f = await executionFixture({ allowWrites: true });
    writeFileSync(join(f.workspacePath, "input.txt"), "original");
    const original = hash(Buffer.from("original"));
    const turns = scripted(
      [
        message([tool("read-1", "read_file", { path: "input.txt" })], "toolUse"),
        message(
          [
            tool("write-1", "write_file", {
              path: "input.txt",
              content: "updated",
              expectedSha256: original,
            }),
          ],
          "toolUse",
        ),
        message([
          { type: "thinking", thinking: "private reasoning fixture" },
          text("Updated the requested file. No test runner was invoked."),
        ]),
      ],
      (context, call) => {
        if (call === 0) {
          const systems = context.messages.filter((item) => item.role === "system");
          expect(
            systems.some(
              (item) =>
                typeof item.content === "string" &&
                item.content.includes("explicitly authorized workspace"),
            ),
          ).toBe(true);
          expect(
            systems.flatMap((item) => item.toolsAdded ?? []).map((item) => item.name),
          ).toContain("write_file");
        } else
          expect(context.messages.some((item) => item.role === "toolResult" && !item.isError)).toBe(
            true,
          );
      },
    );
    try {
      await run(executeTask({ ...f, binding: { model, stream: turns.stream } }, f.signal));
      expect(turns.calls()).toBe(3);
      expect(readFileSync(join(f.workspacePath, "input.txt"), "utf8")).toBe("updated");
      const events = await run(f.store.listEvents(f.task.id));
      expect(events.filter((event) => event.type === "tool.intent")).toHaveLength(2);
      const receipts = events
        .filter((event) => event.type === "tool.result")
        .map((event) => decodeReceipt(event.message));
      expect(receipts).toEqual([
        { effectId: `${f.claim.attempt.id}:read-1`, tool: "read_file", isError: false },
        { effectId: `${f.claim.attempt.id}:write-1`, tool: "write_file", isError: false },
      ]);
      expect(events.filter((event) => event.type === "usage")).toHaveLength(3);
      expect(
        events.some(
          (event) =>
            event.message.includes("private reasoning fixture") ||
            event.message.includes("expectedSha256"),
        ),
      ).toBe(false);
      const artifact = (await run(f.store.listArtifacts(f.task.id)))[0];
      expect(artifact?.name).toBe("answer.md");
      if (!artifact) throw new Error("Expected answer artifact");
      const loaded = await run(f.store.readArtifact(artifact.id));
      expect(hash(loaded.content)).toBe(artifact.sha256);
      expect(new TextDecoder().decode(loaded.content)).toContain("Updated the requested file.");
    } finally {
      await run(f.store.close());
    }
  });

  test("read-only grants withhold writes even when the model requests the write tool", async () => {
    const f = await executionFixture();
    const turns = scripted(
      [
        message(
          [tool("denied-1", "write_file", { path: "blocked.txt", content: "must not exist" })],
          "toolUse",
        ),
        message([text("Writing is unavailable for this read-only task.")]),
      ],
      (context, call) => {
        const names = context.messages
          .filter((item) => item.role === "system")
          .flatMap((item) => item.toolsAdded ?? [])
          .map((item) => item.name);
        expect(names).not.toContain("write_file");
        if (call === 1)
          expect(context.messages.some((item) => item.role === "toolResult" && item.isError)).toBe(
            true,
          );
      },
    );
    try {
      await run(executeTask({ ...f, binding: { model, stream: turns.stream } }, f.signal));
      expect(existsSync(join(f.workspacePath, "blocked.txt"))).toBe(false);
      const receipt = (await run(f.store.listEvents(f.task.id))).find(
        (event) => event.type === "tool.result",
      );
      expect(receipt && decodeReceipt(receipt.message)).toMatchObject({
        tool: "write_file",
        isError: true,
      });
    } finally {
      await run(f.store.close());
    }
  });

  test("turn and tool budgets stop further provider calls while preserving completed effect evidence", async () => {
    const f = await executionFixture({ maxTurns: 1 });
    const turns = scripted([
      message(
        Array.from({ length: 65 }, (_, index) => tool(`call-${index}`, "list_files")),
        "toolUse",
      ),
    ]);
    try {
      await rejects(
        run(executeTask({ ...f, binding: { model, stream: turns.stream } }, f.signal)),
        { code: "invalid" },
      );
      expect(turns.calls()).toBe(1);
      const receipts = (await run(f.store.listEvents(f.task.id)))
        .filter((event) => event.type === "tool.result")
        .map((event) => decodeReceipt(event.message));
      expect(receipts.filter((receipt) => !receipt.isError)).toHaveLength(64);
      expect(receipts.filter((receipt) => receipt.isError)).toHaveLength(1);
      expect(await run(f.store.listArtifacts(f.task.id))).toEqual([]);
    } finally {
      await run(f.store.close());
    }
  });

  test("cancellation reaches an active provider stream and cannot publish an answer", async () => {
    const f = await executionFixture();
    const entered = Promise.withResolvers<AbortSignal>();
    const controller = new AbortController();
    const stream: StreamFn = (_selected, _context, options) => {
      const pending = createAssistantMessageEventStream();
      const signal = options?.signal;
      if (!signal) throw new Error("Expected provider cancellation signal");
      signal.addEventListener(
        "abort",
        () => pending.push({ type: "error", reason: "aborted", error: message([], "aborted") }),
        { once: true },
      );
      entered.resolve(signal);
      return pending;
    };
    try {
      const result = run(executeTask({ ...f, binding: { model, stream } }, controller.signal));
      const providerSignal = await entered.promise;
      controller.abort();
      await rejects(result, { code: "invalid" });
      expect(providerSignal.aborted).toBe(true);
      expect(await run(f.store.listArtifacts(f.task.id))).toEqual([]);
    } finally {
      await run(f.store.close());
    }
  });

  test("the turn budget ends a continuing model even below the tool budget", async () => {
    const f = await executionFixture({ maxTurns: 1 });
    const turns = scripted([message([tool("only-call", "list_files")], "toolUse")]);
    try {
      await rejects(
        run(executeTask({ ...f, binding: { model, stream: turns.stream } }, f.signal)),
        { code: "invalid" },
      );
      expect(turns.calls()).toBe(1);
      const receipts = (await run(f.store.listEvents(f.task.id)))
        .filter((event) => event.type === "tool.result")
        .map((event) => decodeReceipt(event.message));
      expect(receipts).toEqual([
        { effectId: `${f.claim.attempt.id}:only-call`, tool: "list_files", isError: false },
      ]);
    } finally {
      await run(f.store.close());
    }
  });

  test("revoking the task lease before a requested write prevents filesystem mutation", async () => {
    const f = await executionFixture({ allowWrites: true });
    const stream: StreamFn = async () => {
      await run(f.store.cancelTask(f.task.id));
      return response(
        message(
          [
            tool("revoked-write", "write_file", {
              path: "blocked.txt",
              content: "must not be written",
            }),
          ],
          "toolUse",
        ),
      );
    };
    try {
      await rejects(run(executeTask({ ...f, binding: { model, stream } }, f.signal)), {
        code: "invalid",
      });
      expect(existsSync(join(f.workspacePath, "blocked.txt"))).toBe(false);
      expect((await run(f.store.getTask(f.task.id))).status).toBe("cancelled");
      expect(
        (await run(f.store.listEvents(f.task.id))).some((event) => event.type === "tool.intent"),
      ).toBe(false);
    } finally {
      await run(f.store.close());
    }
  });

  test("duplicate provider call IDs cannot authorize distinct file effects", async () => {
    const f = await executionFixture({ allowWrites: true });
    const turns = scripted([
      message(
        [
          tool("duplicate", "write_file", { path: "first.txt", content: "first approved effect" }),
          tool("duplicate", "write_file", {
            path: "second.txt",
            content: "duplicate effect identity",
          }),
        ],
        "toolUse",
      ),
      message([text("Duplicate call identifiers are not valid.")]),
    ]);
    try {
      await rejects(
        run(executeTask({ ...f, binding: { model, stream: turns.stream } }, f.signal)),
        { code: "invalid" },
      );
      expect(existsSync(join(f.workspacePath, "second.txt"))).toBe(false);
      const intents = (await run(f.store.listEvents(f.task.id))).filter(
        (event) => event.type === "tool.intent",
      );
      expect(intents.length).toBeLessThanOrEqual(1);
    } finally {
      await run(f.store.close());
    }
  });

  test("provider failures, truncation and unsupported incomplete responses never become success", async () => {
    for (const reason of ["error", "aborted", "length", "deferred", "pending"] as const) {
      const f = await executionFixture();
      const turns = scripted([message([text("An incomplete answer")], reason)]);
      try {
        await rejects(
          run(executeTask({ ...f, binding: { model, stream: turns.stream } }, f.signal)),
          { code: "invalid" },
        );
        expect(turns.calls()).toBe(1);
      } finally {
        await run(f.store.close());
      }
    }
  });

  test("nonfinite usage and excessive model output fail before being persisted as valid result data", async () => {
    for (const invalid of [
      message([text("x".repeat(256001))]),
      {
        ...message([text("Invalid accounting")]),
        usage: { ...message([]).usage, totalTokens: Number.NaN },
      },
    ]) {
      const f = await executionFixture();
      const turns = scripted([invalid]);
      try {
        await rejects(
          run(executeTask({ ...f, binding: { model, stream: turns.stream } }, f.signal)),
          { code: "invalid" },
        );
        expect(await run(f.store.listArtifacts(f.task.id))).toEqual([]);
        expect(
          (await run(f.store.listEvents(f.task.id))).some(
            (event) => event.type === "usage" && event.message.includes("null"),
          ),
        ).toBe(false);
      } finally {
        await run(f.store.close());
      }
    }
  });

  test("malformed dynamic provider text is rejected instead of becoming a fabricated string answer", async () => {
    const f = await executionFixture();
    const malformed = message([]);
    // A transport boundary can violate its TypeScript declaration at runtime.
    Object.defineProperty(malformed, "content", { value: [{ type: "text", text: 42 }] });
    const turns = scripted([malformed]);
    try {
      await rejects(
        run(executeTask({ ...f, binding: { model, stream: turns.stream } }, f.signal)),
        { code: "invalid" },
      );
      expect(await run(f.store.listArtifacts(f.task.id))).toEqual([]);
    } finally {
      await run(f.store.close());
    }
  });

  test("built-in inspection needs no model and publishes a bounded inventory artifact", async () => {
    const f = await executionFixture({ adapterId: "inspect" });
    writeFileSync(join(f.workspacePath, "visible.txt"), "fixture");
    try {
      await run(executeTask(f, f.signal));
      const artifact = (await run(f.store.listArtifacts(f.task.id)))[0];
      if (!artifact) throw new Error("Expected inventory artifact");
      expect(artifact.name).toBe("workspace-inventory.json");
      const contents = new TextDecoder().decode(
        (await run(f.store.readArtifact(artifact.id))).content,
      );
      expect(
        Schema.decodeUnknownSync(
          Schema.fromJsonString(
            Schema.Struct({
              schemaVersion: Schema.Literal(1),
              files: Schema.Array(Schema.String),
              truncated: Schema.Boolean,
            }),
          ),
        )(contents),
      ).toEqual({ schemaVersion: 1, files: ["visible.txt"], truncated: false });
    } finally {
      await run(f.store.close());
    }
    expect(resolveModel(undefined)).toBeUndefined();
    expect(describeAgents(undefined)).toMatchObject([
      { id: "inspect", available: true },
      { id: "pi", available: false },
    ]);
    expect(
      describeAgents({ model, stream: scripted([]).stream }).every(
        (agent) =>
          agent.capabilities.filesystemIsolation === "unsupported" &&
          agent.capabilities.networkIsolation === "unsupported",
      ),
    ).toBe(true);
  });
});
