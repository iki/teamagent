import { mkdtemp } from "./temporary.ts";
import { describe, expect, test } from "bun:test";
import { rejects } from "node:assert/strict";
import { writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { Effect, Schema } from "effect";
import {
  MediaError,
  MediaVoiceRequestSchema,
  MediaDiagnosticRequestSchema,
  MediaRecoveryRequestSchema,
  MediaResultSchema,
  SpeechTextImportSchema,
  validateMediaRequest,
  type MediaApi,
  type MediaResult,
  type MediaSelectionExplanation,
} from "@/media";
import { runMediaCommand, type MediaFlags } from "../app/cli/media.ts";

const result: MediaResult = {
  operation: "synthesize",
  backend: "fixture",
  model: null,
  artifact: { path: "fixture.wav", mimeType: "audio/wav", sha256: "a".repeat(64), sizeBytes: 48 },
  provenance: {
    inputSha256: null,
    referenceSha256: null,
    toolVersion: null,
    providerRequestId: null,
    elapsedMs: 1,
    limitations: ["Synthetic fixture; no inference was run."],
  },
};
function fixture() {
  const calls: { method: string; input: unknown }[] = [];
  let created = 0;
  const media: MediaApi = {
    listBackends: () => {
      calls.push({ method: "backends", input: null });
      return Effect.succeed([]);
    },
    plan: () =>
      Effect.fail(
        new MediaError({ code: "unsupported", message: "CLI must use passive explanation." }),
      ),
    run: (input) => {
      calls.push({ method: "run", input });
      return Effect.succeed(result);
    },
    explain: (input) => {
      calls.push({ method: "explain", input });
      return validateMediaRequest(input).pipe(
        Effect.map((request): MediaSelectionExplanation => ({
          request,
          backends: [],
          candidates: [],
          selected: null,
          rejection: { code: "policy", message: "Fixture policy denies execution." },
        })),
      );
    },
    voice: (input) => {
      calls.push({ method: "voice", input });
      return Schema.decodeUnknownEffect(MediaVoiceRequestSchema)(input).pipe(
        Effect.map((request) => ({
          action: request.action,
          backend: request.backend,
          voices: [],
          nextCursor: null,
          deleted: request.action === "delete",
        })),
        Effect.mapError(
          () => new MediaError({ code: "invalid", message: "Invalid fixture voice request." }),
        ),
      );
    },
    diagnose: (input) => {
      calls.push({ method: "diagnose", input });
      return Schema.decodeUnknownEffect(MediaDiagnosticRequestSchema)(input).pipe(
        Effect.map((request) => ({
          backend: request.backend,
          authenticated: true,
          credentialBinding: "fixture-key",
          accountId: "fixture-account",
          scopes: null,
          models: [],
          checkedAt: "2026-10-25T00:00:00Z",
          limitations: ["Synthetic identity fixture."],
        })),
        Effect.mapError(
          () => new MediaError({ code: "invalid", message: "Invalid fixture diagnosis." }),
        ),
      );
    },
    recovery: (input) => {
      calls.push({ method: "recovery", input });
      return Schema.decodeUnknownEffect(MediaRecoveryRequestSchema)(input).pipe(
        Effect.map(() => []),
        Effect.mapError(
          () => new MediaError({ code: "invalid", message: "Invalid fixture recovery." }),
        ),
      );
    },
  };
  return {
    calls,
    created: () => created,
    dependencies: {
      createHost: () => {
        created += 1;
        return Effect.succeed(media);
      },
    },
  };
}
const srt =
  "1\n00:00:00,000 --> 00:00:02,000\nFirst line.\nSecond line.\n\n2\n00:00:02,000 --> 00:00:04,000\nFinal words.\n";

describe("media CLI policy and recovery dispatch", () => {
  test("stored JSON cannot grant training opt-in and blocked plans expose explanation", async () => {
    const directory = await mkdtemp(join(tmpdir(), "teamagent-media-plan-"));
    const source = join(directory, "request.json");
    try {
      await writeFile(
        source,
        JSON.stringify({ operation: "inspect", input: "fixture.wav", allowTraining: true }),
      );
      for (const flags of [{}, { allowTraining: true }, { allowTraining: false }]) {
        const host = fixture();
        let output: unknown;
        await runMediaCommand(
          "plan",
          source,
          flags,
          (value) => {
            output = value;
          },
          host.dependencies,
        );
        const parsed = Schema.decodeUnknownSync(
          Schema.Struct({
            request: Schema.Struct({ allowTraining: Schema.Boolean }),
            selected: Schema.Null,
            rejection: Schema.Struct({ code: Schema.Literal("policy") }),
          }),
        )(output);
        expect(parsed.request.allowTraining).toBe(flags.allowTraining === true);
        expect(host.calls.map((call) => call.method)).toEqual(["explain"]);
      }
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  test("SRT import never constructs a host; synthesis retains cues while ordinary output stays flat", async () => {
    const directory = await mkdtemp(join(tmpdir(), "teamagent-media-srt-"));
    const source = join(directory, "approved.srt");
    try {
      await writeFile(source, srt);
      const host = fixture();
      let output: unknown;
      await runMediaCommand(
        "import-text",
        source,
        { textFormat: "srt" },
        (value) => {
          output = value;
        },
        host.dependencies,
      );
      const imported = Schema.decodeUnknownSync(SpeechTextImportSchema)(output);
      expect(imported.text).toBe("First line.\nSecond line.\n\nFinal words.");
      expect(host.created()).toBe(0);
      await runMediaCommand(
        "synthesize",
        undefined,
        {
          textFile: source,
          textFormat: "srt",
          language: "en",
          expressivenessBoost: 0.7,
          withTimestamps: true,
          allowTraining: true,
        },
        (value) => {
          output = value;
        },
        host.dependencies,
      );
      const wrapped = Schema.decodeUnknownSync(
        Schema.Struct({ result: MediaResultSchema, textImport: SpeechTextImportSchema }),
      )(output);
      expect(wrapped.textImport.cues).toEqual(imported.cues);
      const request = await Effect.runPromise(validateMediaRequest(host.calls[0]?.input));
      if (request.operation !== "synthesize") throw new Error("Expected synthesis request.");
      expect(request.text).toBe(imported.text);
      expect(request.expressivenessBoost).toBe(0.7);
      expect(request.withTimestamps).toBe(true);
      await runMediaCommand(
        "synthesize",
        "Plain text.",
        {},
        (value) => {
          output = value;
        },
        host.dependencies,
      );
      expect(Schema.decodeUnknownSync(MediaResultSchema)(output).operation).toBe("synthesize");
      await rejects(
        runMediaCommand(
          "synthesize",
          "ambiguous",
          { textFile: source },
          () => {},
          host.dependencies,
        ),
      );
      await rejects(
        runMediaCommand("synthesize", "plain", { textFormat: "srt" }, () => {}, host.dependencies),
      );
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  test("clone controls, voice lifecycle, diagnostics and recovery use their explicit ports", async () => {
    const host = fixture();
    await runMediaCommand(
      "clone",
      "reference.wav",
      {
        name: "Fixture",
        language: "en",
        similarity: "max",
        idempotencyKey: "fixture-key-123",
        allowTraining: true,
      },
      () => {},
      host.dependencies,
    );
    const clone = await Effect.runPromise(validateMediaRequest(host.calls[0]?.input));
    if (clone.operation !== "clone") throw new Error("Expected clone request.");
    expect(clone.similarity).toBe("max");
    expect(clone.idempotencyKey).toBe("fixture-key-123");
    await rejects(runMediaCommand("voice-delete", "voice-1", {}, () => {}, host.dependencies));
    await rejects(runMediaCommand("diagnose", undefined, {}, () => {}, host.dependencies));
    const cases: readonly {
      action: string;
      argument: string | undefined;
      flags: MediaFlags;
      method: string;
    }[] = [
      { action: "voice-get", argument: "voice-1", flags: { backend: "heygen" }, method: "voice" },
      {
        action: "voice-list",
        argument: undefined,
        flags: { backend: "heygen", cursor: "opaque", limit: 5 },
        method: "voice",
      },
      {
        action: "voice-wait",
        argument: "voice-1",
        flags: { backend: "heygen", timeoutMs: 1000, pollIntervalMs: 100 },
        method: "voice",
      },
      {
        action: "voice-delete",
        argument: "voice-1",
        flags: { backend: "heygen" },
        method: "voice",
      },
      {
        action: "diagnose",
        argument: undefined,
        flags: { backend: "heygen", voice: "voice-1" },
        method: "diagnose",
      },
      { action: "receipts", argument: undefined, flags: {}, method: "recovery" },
      { action: "receipt", argument: "receipt-1", flags: {}, method: "recovery" },
      {
        action: "resume",
        argument: "receipt-1",
        flags: { output: "recovered.wav" },
        method: "recovery",
      },
    ];
    for (const entry of cases) {
      await runMediaCommand(entry.action, entry.argument, entry.flags, () => {}, host.dependencies);
      expect(host.calls.at(-1)?.method).toBe(entry.method);
    }
    const last = Schema.decodeUnknownSync(MediaRecoveryRequestSchema)(host.calls.at(-1)?.input);
    expect(last).toEqual({ action: "resume", receiptId: "receipt-1", output: "recovered.wav" });
  });
});

async function command(args: readonly string[], cwd: string) {
  const child = Bun.spawn(
    [process.execPath, fileURLToPath(new URL("../app/cli/index.ts", import.meta.url)), ...args],
    { cwd, stdin: "ignore", stdout: "pipe", stderr: "pipe" },
  );
  const timer = setTimeout(() => child.kill(), 20_000);
  try {
    const [status, stdout, stderr] = await Promise.all([
      child.exited,
      new Response(child.stdout).text(),
      new Response(child.stderr).text(),
    ]);
    return { status, stdout, stderr };
  } finally {
    clearTimeout(timer);
  }
}

test("CLI rejects irrelevant flags before config and reports structured media failures on stderr", async () => {
  const directory = await mkdtemp(join(tmpdir(), "teamagent-media-flags-"));
  try {
    const config = join(directory, "untrusted.ts");
    await writeFile(config, 'throw new Error("CONFIG_MUST_NOT_RUN")');
    for (const args of [
      ["media", "voice-get", "voice-1", "--allow-training", "--config", config],
      ["media", "resume", "receipt-1", "--allow-training", "--config", config],
      ["media", "voice-delete", "voice-1", "--timeout-ms", "1000", "--config", config],
      ["media", "voice-list", "extra", "--config", config],
      ["media", "diagnose", "extra", "--config", config],
      ["media", "receipts", "extra", "--config", config],
      ["media", "import-text", "file.srt", "--text-format", "srt", "--config", config],
    ]) {
      const output = await command(args, directory);
      expect(output.status).not.toBe(0);
      expect(output.stderr).not.toContain("CONFIG_MUST_NOT_RUN");
    }
    const planConfig = join(directory, "plan-config.json");
    const planRequest = join(directory, "request.json");
    await writeFile(
      planConfig,
      JSON.stringify({
        ffmpeg: {
          executable: "missing-fixture-ffmpeg",
          probeExecutable: "missing-fixture-ffprobe",
        },
      }),
    );
    await writeFile(
      planRequest,
      JSON.stringify({ operation: "inspect", input: "fixture.wav", allowTraining: true }),
    );
    const negated = await command(
      [
        "media",
        "plan",
        planRequest,
        "--config",
        planConfig,
        "--allow-training",
        "--no-allow-training",
      ],
      directory,
    );
    expect(negated.status).toBe(0);
    const negativePlan = Schema.decodeUnknownSync(
      Schema.fromJsonString(
        Schema.Struct({ request: Schema.Struct({ allowTraining: Schema.Boolean }) }),
      ),
    )(negated.stdout);
    expect(negativePlan.request.allowTraining).toBe(false);
    const source = join(directory, "invalid.srt");
    await writeFile(source, "Invalid subtitle text.");
    const invalid = await command(
      ["media", "import-text", source, "--text-format", "srt"],
      directory,
    );
    expect(invalid.status).not.toBe(0);
    expect(invalid.stdout).toBe("");
    const failure = Schema.decodeUnknownSync(
      Schema.fromJsonString(
        Schema.Struct({
          error: Schema.Struct({ code: Schema.Literal("invalid"), message: Schema.String }),
        }),
      ),
    )(invalid.stderr);
    expect(failure.error.message.length).toBeGreaterThan(0);
    const help = await command(["media", "voice-wait", "--help"], directory);
    expect(help.status).toBe(0);
    for (const text of [
      "--allow-training",
      "--text-format",
      "media resume",
      "media voice-wait",
      "default false",
    ])
      expect(help.stdout).toContain(text);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
