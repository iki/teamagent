import { Schema } from "effect";
import { digest } from "../workflow/storage.ts";
import { diagnostic, runProcess, type ProcessResult } from "../workflow/process.ts";
import {
  finalizeHookDiagnostics,
  hookDiagnosticPaths,
  reserveHookDiagnostics,
  writeHookDiagnostic,
  type HookDiagnosticBudget,
} from "./storage.ts";

export const HookReceipt = Schema.Struct({
  version: Schema.Literal(1),
  phase: Schema.Literals(["archive", "review"]),
  state: Schema.Literals(["pending", "completed"]),
  hostPid: Schema.Int,
  bun: Schema.String,
  startedAt: Schema.String,
  completedAt: Schema.NullOr(Schema.String),
  elapsedMs: Schema.NullOr(Schema.Number),
  timeoutMs: Schema.Int,
  maximumOutputBytes: Schema.Int,
  // Retain the former Windows scope for immutable historical receipt decoding.
  cleanupScope: Schema.Literals(["windows-job-object", "windows-child-tree", "process-group"]),
  result: Schema.NullOr(
    Schema.Struct({
      status: Schema.NullOr(Schema.Int),
      outcome: Schema.Literals(["exited", "timeout", "output-limit", "cancelled", "transport"]),
      termination: Schema.NullOr(Schema.Literals(["closed", "unconfirmed"])),
    }),
  ),
  log: Schema.NullOr(
    Schema.Struct({
      path: Schema.String,
      sha256: Schema.String,
      bytes: Schema.Int,
      truncated: Schema.Boolean,
    }),
  ),
});
export type HookReceipt = typeof HookReceipt.Type;

function boundedDiagnostic(value: string, maximum: number): { text: string; truncated: boolean } {
  const safe = diagnostic(value);
  const bytes = Buffer.from(safe, "utf8");
  if (bytes.byteLength <= maximum) return { text: safe, truncated: false };
  const marker = "\n[diagnostic truncated]\n";
  let end = maximum - Buffer.byteLength(marker);
  while (end > 0) {
    const byte = bytes[end];
    if (byte === undefined || byte < 128 || byte >= 192) break;
    end--;
  }
  return {
    text: new TextDecoder("utf-8", { fatal: true }).decode(bytes.subarray(0, end)) + marker,
    truncated: true,
  };
}

/** Fixed hook operations; the optional runner is a trusted host/test capability, never JSON input. */
export async function runHookCommand(
  root: string,
  phase: "archive" | "review",
  input: string | undefined,
  host: {
    runner?: typeof runProcess;
    signal?: AbortSignal;
    diagnosticBudget?: HookDiagnosticBudget;
  } = {},
): Promise<{ passed: boolean; receipt: string }> {
  const timeoutMs = phase === "archive" ? 60_000 : 300_000;
  const maximumOutputBytes = phase === "archive" ? 2_000_000 : 16 * 1024 * 1024;
  const reservation = await reserveHookDiagnostics(
    root,
    phase,
    maximumOutputBytes,
    host.diagnosticBudget,
  );
  const { receipt: receiptPath, log: logPath } = hookDiagnosticPaths(reservation);
  const began = performance.now();
  const pending: HookReceipt = {
    version: 1,
    phase,
    state: "pending",
    hostPid: process.pid,
    bun: process.versions.bun ?? "unknown",
    startedAt: new Date().toISOString(),
    completedAt: null,
    elapsedMs: null,
    timeoutMs,
    maximumOutputBytes,
    cleanupScope: process.platform === "win32" ? "windows-job-object" : "process-group",
    result: null,
    log: null,
  };
  const saveReceipt = async (receipt: HookReceipt): Promise<string> => {
    const text = JSON.stringify(Schema.decodeUnknownSync(HookReceipt)(receipt), null, 2) + "\n";
    if (Buffer.byteLength(text) > 8192) throw new Error("Hook receipt byte limit exceeded");
    await writeHookDiagnostic(root, reservation, "receipt", text);
    return text;
  };
  await saveReceipt(pending);
  let result: ProcessResult;
  try {
    result = await (host.runner ?? runProcess)(
      root,
      process.execPath,
      [
        phase === "archive" ? "app/conversations/record.ts" : "app/check/index.ts",
        ...(phase === "review" ? ["review"] : []),
      ],
      {
        ...(input === undefined ? {} : { input }),
        timeoutMs,
        maximumBytes: maximumOutputBytes,
        ...(host.signal ? { signal: host.signal } : {}),
      },
    );
  } catch {
    result = {
      code: null,
      outcome: "transport",
      termination: "unconfirmed",
      stdout: "",
      stderr: "Hook child could not be observed; raw error details were not retained.\n",
    };
  }
  const log = boundedDiagnostic(
    `[stdout]\n${result.stdout}\n[stderr]\n${result.stderr}`,
    maximumOutputBytes,
  );
  await writeHookDiagnostic(root, reservation, "log", log.text);
  const completed = await saveReceipt({
    ...pending,
    state: "completed",
    completedAt: new Date().toISOString(),
    elapsedMs: performance.now() - began,
    result: {
      status: result.code,
      outcome: result.outcome,
      termination: result.termination ?? null,
    },
    log: {
      path: logPath,
      sha256: digest(log.text),
      bytes: Buffer.byteLength(log.text),
      truncated: log.truncated || result.outcome === "output-limit",
    },
  });
  await finalizeHookDiagnostics(root, reservation, {
    receiptHash: digest(completed),
    logHash: digest(log.text),
  });
  return {
    passed: result.code === 0 && result.outcome === "exited" && result.termination === "closed",
    receipt: receiptPath,
  };
}
