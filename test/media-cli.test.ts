import { mkdtemp } from "./temporary.ts";
import { strict as assert } from "node:assert";
import { mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { Effect, Schema } from "effect";
import { ChannelTurnSchema, ChannelReceiptSchema, SpeechStateSchema } from "@/channels";
import { validateMediaBackends } from "@/media";

const root = dirname(fileURLToPath(new URL("../package.json", import.meta.url)));
async function command(args: readonly string[], cwd: string) {
  const child = Bun.spawn([process.execPath, join(root, "app/cli/index.ts"), ...args], {
    cwd,
    stdin: "ignore",
    stdout: "pipe",
    stderr: "pipe",
  });
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
const json = (value: string): unknown =>
  Schema.decodeUnknownSync(Schema.fromJsonString(Schema.Unknown))(value);
await test("media and channel CLI enforce options, avoid ambient config, and persist text receipts", async () => {
  const directory = await mkdtemp(join(tmpdir(), "teamagent-media-cli-"));
  const input = join(directory, "input");
  const data = join(directory, "data");
  await mkdir(input);
  await writeFile(join(directory, "teamagent.config.ts"), 'throw new Error("AMBIENT_EXECUTED")');
  await writeFile(
    join(directory, "teamagent-media.config.ts"),
    'throw new Error("AMBIENT_EXECUTED")',
  );
  const config = join(directory, "media.json");
  await writeFile(
    config,
    JSON.stringify({
      inputRoot: input,
      ffmpeg: {
        executable: "definitely-missing-ffmpeg",
        probeExecutable: "definitely-missing-ffprobe",
      },
    }),
  );
  try {
    const backends = await command(["media", "backends", "--config", config], directory);
    assert.equal(backends.status, 0, backends.stderr);
    assert.ok((await Effect.runPromise(validateMediaBackends(json(backends.stdout)))).length >= 4);
    for (const args of [
      ["media", "inspect", "sample.wav", "--voice", "irrelevant"],
      ["media", "synthesize", "text", "--text-file", "also.txt"],
      ["media", "record", "--duration-seconds", "999"],
      ["channels", "inspect", "hello", "--kind", "unknown"],
      ["channels", "speech", "--session", "fixture"],
      ["channels", "ingest", "text", "--kind", "text", "--backend", "auto"],
    ])
      assert.notEqual((await command(args, directory)).status, 0);
    const plannedConfig = join(directory, "plan-config.json");
    await writeFile(
      plannedConfig,
      JSON.stringify({
        inputRoot: input,
        ffmpeg: { executable: process.execPath, probeExecutable: process.execPath },
      }),
    );
    const request = join(directory, "request.json");
    await writeFile(
      request,
      JSON.stringify({
        operation: "inspect",
        input: "does-not-need-to-exist.wav",
        backend: "missing",
      }),
    );
    const planned = await command(
      ["media", "plan", request, "--config", plannedConfig, "--backend", "auto"],
      directory,
    );
    assert.equal(planned.status, 0, planned.stderr);
    assert.equal(
      Schema.decodeUnknownSync(Schema.Struct({ backend: Schema.Struct({ id: Schema.String }) }))(
        json(planned.stdout),
      ).backend.id,
      "ffmpeg",
    );
    const envelopeFile = join(directory, "envelope.json");
    await writeFile(
      envelopeFile,
      JSON.stringify({
        version: 1,
        channel: "cli",
        account: "local",
        conversation: "local",
        sender: "someone-else",
        messageId: "envelope-id",
        text: "text",
        attachments: [],
      }),
    );
    assert.notEqual((await command(["channels", "inspect", envelopeFile], directory)).status, 0);
    assert.notEqual(
      (
        await command(
          [
            "channels",
            "inspect",
            envelopeFile,
            "--sender",
            "someone-else",
            "--message-id",
            "ignored",
          ],
          directory,
        )
      ).status,
      0,
    );
    assert.equal(
      (await command(["channels", "inspect", envelopeFile, "--sender", "someone-else"], directory))
        .status,
      0,
    );
    const args = [
      "channels",
      "ingest",
      "hello",
      "--kind",
      "text",
      "--message-id",
      "cli-delivery",
      "--data",
      data,
      "--root",
      input,
      "--config",
      config,
    ];
    const first = await command(args, directory);
    assert.equal(first.status, 0, first.stderr);
    const resultSchema = Schema.Struct({ duplicate: Schema.Boolean, turn: ChannelTurnSchema });
    const result = Schema.decodeUnknownSync(resultSchema)(json(first.stdout));
    assert.equal(result.duplicate, false);
    assert.equal(result.turn.authentication, "local");
    const second = await command(args, directory);
    assert.equal(second.status, 0, second.stderr);
    assert.equal(Schema.decodeUnknownSync(resultSchema)(json(second.stdout)).duplicate, true);
    const receipt = await command(
      ["channels", "status", "cli-delivery", "--data", data],
      directory,
    );
    assert.equal(receipt.status, 0, receipt.stderr);
    assert.equal(
      Schema.decodeUnknownSync(ChannelReceiptSchema)(json(receipt.stdout)).status,
      "complete",
    );
    const events = join(directory, "speech.json");
    await writeFile(
      events,
      JSON.stringify([
        { sessionId: "speech-1", sequence: 0, type: "partial", utteranceId: "u1", text: "hel" },
        {
          sessionId: "speech-1",
          sequence: 1,
          type: "final",
          utteranceId: "u1",
          text: "hello",
          startMs: 0,
          endMs: 100,
        },
        { sessionId: "speech-1", sequence: 2, type: "end" },
      ]),
    );
    const speech = await command(["channels", "speech", events], directory);
    assert.equal(speech.status, 0, speech.stderr);
    const state = Schema.decodeUnknownSync(SpeechStateSchema)(json(speech.stdout));
    assert.equal(state.text, "hello");
    assert.equal(state.phase, "ended");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

await test("media setup and help expose official instructions without loading configuration", async () => {
  const directory = await mkdtemp(join(tmpdir(), "teamagent-media-setup-"));
  try {
    await writeFile(
      join(directory, "teamagent-media.config.ts"),
      'throw new Error("AMBIENT_EXECUTED")',
    );
    const help = await command(["media", "setup", "--help"], directory);
    assert.equal(help.status, 0, help.stderr);
    for (const url of [
      "https://developers.heygen.com/docs/models/heygen-voice",
      "https://docs.fish.audio/",
      "https://github.com/k2-fsa/OmniVoice",
    ])
      assert.ok(help.stdout.includes(url), url);
    const setupSchema = Schema.Array(
      Schema.Struct({
        backend: Schema.String,
        urls: Schema.Array(Schema.String),
        steps: Schema.Array(Schema.String),
        configuration: Schema.Record(Schema.String, Schema.Unknown),
      }),
    );
    for (const backend of [undefined, "heygen", "fish", "omnivoice"]) {
      const result = await command(
        ["media", "setup", ...(backend === undefined ? [] : [backend])],
        directory,
      );
      assert.equal(result.status, 0, result.stderr);
      const guides = Schema.decodeUnknownSync(setupSchema)(json(result.stdout));
      assert.equal(guides.length, backend === undefined ? 3 : 1);
      if (backend !== undefined) assert.equal(guides[0]?.backend, backend);
      assert.ok(guides.every((guide) => guide.urls.length > 0 && guide.steps.length > 0));
    }
    assert.notEqual((await command(["media", "setup", "unknown"], directory)).status, 0);
    assert.notEqual((await command(["media", "setup", "fish", "extra"], directory)).status, 0);
    const explicit = await command(
      ["media", "setup", "fish", "--config", "teamagent-media.config.ts"],
      directory,
    );
    assert.notEqual(explicit.status, 0);
    assert.ok(!explicit.stderr.includes("AMBIENT_EXECUTED"));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
