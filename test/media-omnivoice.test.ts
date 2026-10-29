import { test } from "bun:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Effect, Schema } from "effect";
import { createMediaHost, runMediaProcess, type MediaTransport } from "../app/media/index.ts";
import { executable } from "../app/media/files.ts";
import { omniVoiceResourceFiles, omniVoiceResourcesReady } from "../app/media/omnivoice.ts";

const worker = fileURLToPath(new URL("../app/media/omnivoice-worker.py", import.meta.url));
const json = (input: unknown): Uint8Array => new TextEncoder().encode(JSON.stringify(input));
function wav(frames = 2400): Uint8Array {
  const bytes = Buffer.alloc(44 + frames * 2);
  bytes.write("RIFF");
  bytes.writeUInt32LE(bytes.length - 8, 4);
  bytes.write("WAVEfmt ", 8);
  bytes.writeUInt32LE(16, 16);
  bytes.writeUInt16LE(1, 20);
  bytes.writeUInt16LE(1, 22);
  bytes.writeUInt32LE(24000, 24);
  bytes.writeUInt32LE(48000, 28);
  bytes.writeUInt16LE(2, 32);
  bytes.writeUInt16LE(16, 34);
  bytes.write("data", 36);
  bytes.writeUInt32LE(frames * 2, 40);
  return bytes;
}
const fakeNumpy = `
class ndarray:
    def __init__(self, values):
        self.values = values
        self.size = len(values)
        self.ndim = 1
        self.dtype = type("DType", (), {"kind": "f"})()
class Finite:
    def __init__(self, values):
        self.values = values
    def all(self):
        import math
        return all(math.isfinite(v) for v in self.values)
def isfinite(audio):
    return Finite(audio.values)
`;
const fakeTorch = `
float16 = "fixture-float16"
float32 = "fixture-float32"
class inference_mode:
    def __enter__(self):
        return self
    def __exit__(self, *_args):
        return False
`;
const fakeSoundfile = `
import wave
import struct
def write(handle, audio, rate, format, subtype):
    assert format == "WAV" and subtype == "PCM_16"
    with wave.open(handle, "wb") as output:
        output.setnchannels(1)
        output.setsampwidth(2)
        output.setframerate(rate)
        output.writeframes(b"".join(struct.pack("<h", round(v * 32000)) for v in audio.values))
`;
const fakeOmniVoice = `
import json
import os
import pathlib
import socket
import sys
from numpy import ndarray
assert sys.flags.isolated == 1 and sys.dont_write_bytecode
assert sys.pycache_prefix is None
__version__ = "fixture-0.2.1"
ROOT = pathlib.Path(__file__).parent.parent
print("private dependency stdout")
print("private dependency stderr", file=sys.stderr)
class OmniVoice:
    sampling_rate = 24000
    @classmethod
    def from_pretrained(cls, path, **kwargs):
        assert pathlib.Path(path).is_dir()
        assert kwargs == {"device_map": "cpu", "dtype": "fixture-float32", "local_files_only": True,
                          "load_asr": False, "trust_remote_code": False, "attn_implementation": "sdpa"}
        assert os.environ["HF_HUB_OFFLINE"] == "1"
        assert os.environ["TRANSFORMERS_OFFLINE"] == "1"
        assert os.environ["HF_HUB_DISABLE_TELEMETRY"] == "1"
        try:
            socket.create_connection(("example.invalid", 443))
        except RuntimeError:
            pass
        else:
            raise AssertionError("network guard absent")
        (ROOT / "loaded.json").write_text(json.dumps(kwargs), encoding="utf-8")
        return cls()
    def generate(self, **kwargs):
        assert set(kwargs) == {"text", "ref_audio", "ref_text", "normalize_text", "preprocess_prompt"}
        assert kwargs["ref_text"] == "Reference transcript"
        assert kwargs["normalize_text"] is False
        assert kwargs["preprocess_prompt"] is False
        assert pathlib.Path(kwargs["ref_audio"]).is_file()
        mode = (ROOT / "mode.txt").read_text(encoding="utf-8")
        if mode == "wait":
            import time
            (ROOT / "started").write_text("1", encoding="utf-8")
            while True:
                time.sleep(0.05)
        if mode == "batch":
            return [ndarray([0.0]), ndarray([0.0])]
        if mode == "nan":
            return [ndarray([float("nan")])]
        if mode == "large":
            return [ndarray([0.0] * 20000)]
        return [ndarray([0.0, 0.125, -0.125])]
`;
async function fixture() {
  const root = await mkdtemp(join(tmpdir(), "teamagent-omnivoice-"));
  const packageRoot = join(root, "package");
  const weightsDirectory = join(root, "weights");
  const outputRoot = join(root, "output");
  await mkdir(join(packageRoot, "omnivoice", "models"), { recursive: true });
  await mkdir(outputRoot);
  for (const name of omniVoiceResourceFiles) {
    const path = join(weightsDirectory, name);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, "fixture resource");
  }
  await writeFile(join(packageRoot, "omnivoice", "__init__.py"), fakeOmniVoice);
  await writeFile(join(packageRoot, "omnivoice", "models", "omnivoice.py"), "# fixture API");
  await writeFile(join(packageRoot, "numpy.py"), fakeNumpy);
  await writeFile(join(packageRoot, "torch.py"), fakeTorch);
  await writeFile(join(packageRoot, "soundfile.py"), fakeSoundfile);
  await writeFile(join(packageRoot, "mode.txt"), "normal");
  await writeFile(join(root, "reference.wav"), wav());
  return {
    root,
    packageRoot,
    weightsDirectory,
    outputRoot,
    cleanup: () => rm(root, { recursive: true, force: true, maxRetries: 8, retryDelay: 100 }),
  };
}
async function pythonExecutable(): Promise<string> {
  const candidate =
    process.env.TEAMAGENT_TEST_PYTHON ?? resolve(".cache/import-python/Scripts/python.exe");
  const selected = await executable(candidate);
  if (selected === null)
    throw new Error(
      "OmniVoice protocol tests require an existing Python >=3.10; set TEAMAGENT_TEST_PYTHON explicitly.",
    );
  return selected;
}
async function invokeWorker(
  f: Awaited<ReturnType<typeof fixture>>,
  override: Readonly<Record<string, unknown>> = {},
  signal = new AbortController().signal,
) {
  return runMediaProcess(await pythonExecutable(), ["-I", "-B", worker], {
    signal,
    cwd: f.root,
    maxBytes: 8192,
    timeoutMs: 10_000,
    input: json({
      version: 1,
      packageRoot: f.packageRoot,
      weightsDirectory: f.weightsDirectory,
      device: "cpu",
      text: "Private target text",
      reference: join(f.root, "reference.wav"),
      referenceText: "Reference transcript",
      output: join(f.root, "output.wav"),
      maximumBytes: 32768,
      ...override,
    }),
    outputs: [{ path: join(f.root, "output.wav"), maxBytes: 32768 }],
  });
}

test("OmniVoice passive readiness requires complete materialized resources without executing them", async () => {
  const f = await fixture();
  try {
    assert.equal(await omniVoiceResourcesReady(f), true);
    assert.equal((await readdir(f.packageRoot)).includes("loaded.json"), false);
    await writeFile(
      join(f.weightsDirectory, "audio_tokenizer", "model.safetensors"),
      "version https://git-lfs.github.com/spec/v1\noid sha256:fixture\n",
    );
    assert.equal(await omniVoiceResourcesReady(f), false);
    await writeFile(
      join(f.weightsDirectory, "audio_tokenizer", "model.safetensors"),
      "fixture weights",
    );
    await rm(join(f.weightsDirectory, "tokenizer.json"));
    assert.equal(await omniVoiceResourcesReady(f), false);
  } finally {
    await f.cleanup();
  }
});

test("OmniVoice Python protocol uses offline explicit API and suppresses dependency output", async () => {
  const f = await fixture();
  try {
    const response = new TextDecoder().decode(await invokeWorker(f));
    const dynamic: unknown = JSON.parse(response);
    const reply = Schema.decodeUnknownSync(
      Schema.Struct({
        version: Schema.Literal(1),
        sampleRate: Schema.Literal(24000),
        channels: Schema.Literal(1),
        frames: Schema.Literal(3),
        network: Schema.Literal("python-sockets-disabled"),
        method: Schema.Literal("from_pretrained-local"),
        packageVersion: Schema.Literal("fixture-0.2.1"),
      }),
    )(dynamic, { onExcessProperty: "error" });
    assert.equal(reply.frames, 3);
    assert.equal(response.includes("private"), false);
    assert.equal((await readFile(join(f.root, "output.wav"))).subarray(8, 12).toString(), "WAVE");
    assert.equal((await readdir(f.packageRoot)).includes("loaded.json"), true);
    assert.equal(
      (await readdir(f.packageRoot, { recursive: true })).some((path) => path.endsWith(".pyc")),
      false,
    );
  } finally {
    await f.cleanup();
  }
});

test("OmniVoice Python rejects missing assets, malformed requests and unsafe output before imports", async () => {
  const f = await fixture();
  try {
    for (const override of [
      { referenceText: " " },
      { maximumBytes: true },
      { version: 2 },
      { extra: true },
      { output: join(f.outputRoot, "outside.wav") },
    ]) {
      await assert.rejects(invokeWorker(f, override), /Media process failed/);
    }
    await writeFile(join(f.root, "output.wav"), "original");
    await assert.rejects(invokeWorker(f), /Media process failed/);
    assert.equal(await readFile(join(f.root, "output.wav"), "utf8"), "original");
    await rm(join(f.root, "output.wav"));
    await rm(join(f.weightsDirectory, "audio_tokenizer", "config.json"));
    await assert.rejects(invokeWorker(f), /Media process failed/);
    assert.equal((await readdir(f.packageRoot)).includes("loaded.json"), false);
  } finally {
    await f.cleanup();
  }
});

test("OmniVoice Python rejects nonfinite, excessive and multiple output waveforms", async () => {
  const f = await fixture();
  try {
    for (const mode of ["nan", "large", "batch"]) {
      await writeFile(join(f.packageRoot, "mode.txt"), mode);
      await assert.rejects(invokeWorker(f), /Media process failed/);
      assert.equal((await readdir(f.root)).includes("output.wav"), false);
    }
    await writeFile(join(f.root, "reference.wav"), wav(30 * 24000 + 1));
    await assert.rejects(invokeWorker(f), /Media process failed/);
  } finally {
    await f.cleanup();
  }
});

test("OmniVoice Python cancellation joins process shutdown before staging cleanup", async () => {
  const f = await fixture();
  const controller = new AbortController();
  try {
    await writeFile(join(f.packageRoot, "mode.txt"), "wait");
    const pending = invokeWorker(f, {}, controller.signal);
    const rejected = assert.rejects(pending, /Media process failed/);
    let started = false;
    for (let attempt = 0; attempt < 100; attempt++) {
      if ((await readdir(f.packageRoot)).includes("started")) {
        started = true;
        break;
      }
      await new Promise((done) => setTimeout(done, 20));
    }
    controller.abort();
    await rejected;
    assert.equal(started, true);
    assert.equal((await readdir(f.root)).includes("output.wav"), false);
  } finally {
    controller.abort();
    await f.cleanup();
  }
}, 15_000);

test("OmniVoice host performs bounded normalization and publishes only validated worker output", async () => {
  const f = await fixture();
  try {
    const python = await pythonExecutable();
    const calls: string[] = [];
    let corruptReply = false;
    const transport: Partial<MediaTransport> = {
      environment: () => undefined,
      request: async () => {
        throw new Error("Unexpected network request");
      },
      process: async (command, args, options) => {
        if (args.includes(worker)) {
          calls.push("worker");
          assert.deepEqual(args, ["-I", "-B", worker]);
          const response = await runMediaProcess(command, args, options);
          return corruptReply ? json({ sampleRate: 8000 }) : response;
        }
        calls.push("normalize");
        assert.ok(args.includes("file,pipe"));
        assert.ok(args.includes("-fs"));
        await writeFile(join(options.cwd, "normalized-reference.wav"), wav());
        return new Uint8Array();
      },
    };
    const api = await Effect.runPromise(
      createMediaHost({
        config: {
          inputRoot: f.root,
          outputRoot: f.outputRoot,
          ffmpeg: { executable: process.execPath, probeExecutable: process.execPath },
          omnivoice: {
            pythonExecutable: python,
            packageRoot: f.packageRoot,
            weightsDirectory: f.weightsDirectory,
            device: "cpu",
          },
          limits: { outputBytes: 32768 },
        },
        transport,
      }),
    );
    await assert.rejects(
      Effect.runPromise(
        api.run({
          operation: "synthesize",
          backend: "omnivoice",
          text: "Private target text",
          reference: "reference.wav",
        }),
      ),
    );
    assert.deepEqual(calls, []);
    const result = await Effect.runPromise(
      api.run({
        operation: "synthesize",
        backend: "omnivoice",
        text: "Private target text",
        reference: "reference.wav",
        referenceText: "Reference transcript",
        output: "voice.wav",
      }),
    );
    assert.equal(result.operation, "synthesize");
    if (result.operation !== "synthesize") throw new Error("Unexpected result");
    assert.deepEqual(calls, ["normalize", "worker"]);
    assert.equal(result.provenance.toolVersion, "omnivoice/fixture-0.2.1");
    assert.match(result.provenance.referenceSha256 ?? "", /^[a-f0-9]{64}$/);
    assert.equal(result.artifact.mimeType, "audio/wav");
    assert.deepEqual(await readdir(f.outputRoot), ["voice.wav"]);
    corruptReply = true;
    await assert.rejects(
      Effect.runPromise(
        api.run({
          operation: "synthesize",
          backend: "omnivoice",
          text: "Private target text",
          reference: "reference.wav",
          referenceText: "Reference transcript",
          output: "invalid.wav",
        }),
      ),
    );
    assert.deepEqual(await readdir(f.outputRoot), ["voice.wav"]);
  } finally {
    await f.cleanup();
  }
}, 15_000);
