import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { test } from "node:test";
import { Schema } from "effect";
import { defaultImportPython } from "../app/imports/documents.ts";

const maximumBytes = 8192;
const input = "Visibility fixture: žluťoučký\n";
const argument = 'argument with spaces and "quotes"\\';
const stderrMarker = "visibility-fixture-stderr\n";
const Visibility = Schema.Struct({
  api: Schema.Literal("win32-console-visibility-v1"),
  pid: Schema.Int.check(Schema.isGreaterThan(0)),
  consolePresent: Schema.Boolean,
  visible: Schema.Boolean,
  input: Schema.String.check(Schema.isMaxLength(1024)),
  argument: Schema.String.check(Schema.isMaxLength(1024)),
});

// Trusted, isolated stdlib-only probe. It measures its own console without creating one.
const probe = String.raw`
import ctypes
from ctypes import wintypes
import json
import os
import sys
kernel = ctypes.WinDLL("kernel32", use_last_error=True)
user = ctypes.WinDLL("user32", use_last_error=True)
kernel.GetConsoleWindow.argtypes = []
kernel.GetConsoleWindow.restype = wintypes.HWND
user.IsWindowVisible.argtypes = [wintypes.HWND]
user.IsWindowVisible.restype = wintypes.BOOL
window = kernel.GetConsoleWindow()
payload = sys.stdin.buffer.read(1025)
if len(payload) > 1024 or len(sys.argv) != 2:
    raise RuntimeError("visibility fixture input exceeds bounds")
result = {
    "api": "win32-console-visibility-v1",
    "pid": os.getpid(),
    "consolePresent": bool(window),
    "visible": bool(window and user.IsWindowVisible(window)),
    "input": payload.decode("utf-8", errors="strict"),
    "argument": sys.argv[1],
}
sys.stdout.buffer.write(json.dumps(result, ensure_ascii=True).encode("ascii") + b"\n")
sys.stderr.buffer.write(b"visibility-fixture-stderr\n")
sys.exit(23)
`;

function checkOutput(
  stdout: Uint8Array,
  stderr: Uint8Array,
  status: number,
): typeof Visibility.Type {
  assert.equal(status, 23, "Hidden native launch preserves the requested nonzero exit code");
  assert.ok(stdout.byteLength <= maximumBytes && stderr.byteLength <= maximumBytes);
  const decode = new TextDecoder("utf-8", { fatal: true });
  const value: unknown = JSON.parse(decode.decode(stdout));
  const observed = Schema.decodeUnknownSync(Visibility, { onExcessProperty: "error" })(value);
  assert.equal(observed.visible, false, "The native child must have no visible console window");
  assert.equal(observed.input, input);
  assert.equal(observed.argument, argument);
  assert.equal(decode.decode(stderr), stderrMarker);
  assert.equal(stdout.includes(13), false);
  assert.equal(stderr.includes(13), false);
  return observed;
}

async function boundedOutput(stream: AsyncIterable<unknown>): Promise<Uint8Array> {
  const chunks: Uint8Array[] = [];
  let size = 0;
  for await (const chunk of stream) {
    assert.ok(chunk instanceof Uint8Array, "Native probe streams must contain bytes");
    size += chunk.byteLength;
    assert.ok(size <= maximumBytes, "Native probe output exceeds its bound");
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

await test(
  "Bun async native subprocess hides its Windows console while preserving pipes and exit status",
  { skip: process.platform !== "win32", timeout: 20_000 },
  async () => {
    const child = Bun.spawn([defaultImportPython(), "-I", "-B", "-c", probe, argument], {
      windowsHide: true,
      stdin: new TextEncoder().encode(input),
      stdout: "pipe",
      stderr: "pipe",
      timeout: 10_000,
      maxBuffer: maximumBytes,
      killSignal: "SIGKILL",
    });
    const output = new Response(child.stdout).arrayBuffer();
    const diagnostic = new Response(child.stderr).arrayBuffer();
    const exited = child.exited;
    try {
      const [stdout, stderr, status] = await Promise.all([output, diagnostic, exited]);
      checkOutput(new Uint8Array(stdout), new Uint8Array(stderr), status);
    } finally {
      // This fixed probe starts no descendants; join its streams even after an assertion failure.
      if (child.exitCode === null) child.kill("SIGKILL");
      await Promise.allSettled([output, diagnostic, exited]);
    }
  },
);

await test(
  "Node-compatible native spawn uses the production platform policy without a Windows console",
  { skip: process.platform !== "win32", timeout: 20_000 },
  async () => {
    const child = spawn(defaultImportPython(), ["-I", "-B", "-c", probe, argument], {
      windowsHide: true,
      detached: process.platform !== "win32",
      shell: false,
      stdio: ["pipe", "pipe", "pipe"],
      timeout: 10_000,
      killSignal: "SIGKILL",
    });
    const output = boundedOutput(child.stdout);
    const diagnostic = boundedOutput(child.stderr);
    const closed = new Promise<number | null>((resolve, reject) => {
      child.once("error", reject);
      child.once("close", resolve);
    });
    const written = new Promise<void>((resolve, reject) => {
      child.stdin.once("error", reject);
      child.stdin.end(input, "utf8", resolve);
    });
    try {
      const [stdout, stderr, status] = await Promise.all([output, diagnostic, closed, written]);
      assert.ok(status !== null, "The native probe must exit with a measured status");
      const observed = checkOutput(stdout, stderr, status);
      assert.equal(
        observed.consolePresent,
        false,
        "The production Windows policy must not allocate a console",
      );
    } finally {
      // Join every stream after success or failure; the probe never starts descendants.
      if (child.exitCode === null) child.kill("SIGKILL");
      await Promise.allSettled([output, diagnostic, closed, written]);
    }
  },
);

await test(
  "Bun sync native subprocess hides its Windows console while preserving pipes and exit status",
  { skip: process.platform !== "win32", timeout: 20_000 },
  () => {
    const child = Bun.spawnSync([defaultImportPython(), "-I", "-B", "-c", probe, argument], {
      windowsHide: true,
      stdin: new TextEncoder().encode(input),
      stdout: "pipe",
      stderr: "pipe",
      timeout: 10_000,
      maxBuffer: maximumBytes,
      killSignal: "SIGKILL",
    });
    assert.equal(child.success, false);
    checkOutput(child.stdout, child.stderr, child.exitCode);
  },
);
