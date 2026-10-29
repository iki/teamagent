import { spawn } from "node:child_process";
import { isAbsolute, join } from "node:path";
import { stripVTControlCharacters } from "node:util";
import { redact } from "../conversations/privacy.ts";
import { lf } from "./storage.ts";

export type ProcessResult = {
  code: number | null;
  outcome: "exited" | "timeout" | "output-limit" | "cancelled" | "transport";
  stdout: string;
  stderr: string;
  termination?: "closed" | "unconfirmed";
};
export function diagnostic(text: string): string {
  const secrets = Object.entries(process.env)
    .filter(([key]) => /TOKEN|SECRET|PASSWORD|AUTHORIZATION|API_KEY/iu.test(key))
    .flatMap(([, value]) => (value ? [value] : []));
  return lf(redact(stripVTControlCharacters(text), secrets)).replace(
    /https?:\/\/[^\s<>"']+/giu,
    (value) => {
      try {
        const url = new URL(value);
        url.username = "";
        url.password = "";
        url.search = "";
        url.hash = "";
        return url.href;
      } catch {
        return "[redacted URL]";
      }
    },
  );
}

/** Bounded in memory; write the redacted result once, never queue unbounded log writes. */
export async function runProcess(
  root: string,
  command: string,
  args: readonly string[],
  options: {
    input?: string;
    timeoutMs?: number;
    maximumBytes?: number;
    maximumLineBytes?: number;
    signal?: AbortSignal;
    env?: Record<string, string | undefined>;
  } = {},
): Promise<ProcessResult> {
  const maximum = options.maximumBytes ?? 16 * 1024 * 1024;
  const lineMaximum = options.maximumLineBytes ?? 1024 * 1024;
  const timeout = options.timeoutMs ?? 60_000;
  if (
    ![maximum, lineMaximum, timeout].every((value) => Number.isSafeInteger(value) && value > 0) ||
    maximum > 16 * 1024 * 1024 ||
    lineMaximum > 1024 * 1024 ||
    timeout > 600_000 ||
    Buffer.byteLength(options.input ?? "") > 8 * 1024 * 1024
  )
    throw new Error("Invalid process bounds");
  if (options.signal?.aborted) return { code: null, outcome: "cancelled", stdout: "", stderr: "" };
  return await new Promise<ProcessResult>((done) => {
    const stdoutDecoder = new TextDecoder("utf-8", { fatal: true });
    const stderrDecoder = new TextDecoder("utf-8", { fatal: true });
    const child = spawn(command, [...args], {
      cwd: root,
      shell: false,
      windowsHide: true,
      detached: process.platform !== "win32",
      stdio: ["pipe", "pipe", "pipe"],
      env: options.env ?? process.env,
    });
    let outcome: ProcessResult["outcome"] = "exited",
      bytes = 0,
      out = "",
      err = "",
      outLine = 0,
      errLine = 0;
    let deadline: ReturnType<typeof setTimeout> | undefined;
    let treeTermination: Promise<boolean> | undefined;
    let finished = false;
    const finish = (code: number | null, confirmed: boolean) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      if (deadline) clearTimeout(deadline);
      options.signal?.removeEventListener("abort", abort);
      done({
        code,
        outcome: code === null && outcome === "exited" ? "transport" : outcome,
        stdout: out,
        stderr: err,
        termination: confirmed ? "closed" : "unconfirmed",
      });
    };
    const stop = (reason: ProcessResult["outcome"]) => {
      if (outcome !== "exited") return;
      outcome = reason;
      const pid = child.pid;
      if (pid !== undefined && child.exitCode === null && process.platform === "win32") {
        treeTermination = new Promise<boolean>((resolveTree) => {
          const windowsRoot = process.env.SystemRoot ?? process.env.SYSTEMROOT ?? "C:\\Windows";
          if (!isAbsolute(windowsRoot)) {
            resolveTree(false);
            return;
          }
          const killer = spawn(
            join(windowsRoot, "System32/taskkill.exe"),
            ["/PID", String(pid), "/T", "/F"],
            {
              shell: false,
              windowsHide: true,
              stdio: "ignore",
              timeout: 3000,
            },
          );
          killer.on("error", () => resolveTree(false));
          killer.on("close", (code) => resolveTree(code === 0));
        });
      } else if (pid !== undefined && process.platform !== "win32") {
        try {
          process.kill(-pid, "SIGKILL");
          treeTermination = Promise.resolve(true);
        } catch {
          treeTermination = Promise.resolve(false);
        }
      } else {
        treeTermination = Promise.resolve(pid === undefined);
      }
      deadline = setTimeout(() => {
        child.stdin.destroy();
        child.stdout.destroy();
        child.stderr.destroy();
        finish(null, false);
      }, 5000);
    };
    const receive = (chunk: unknown, stderr: boolean) => {
      if (!(chunk instanceof Uint8Array)) {
        stop("transport");
        return;
      }
      if (outcome !== "exited") return;
      bytes += chunk.byteLength;
      let line = stderr ? errLine : outLine;
      for (const byte of chunk) {
        line = byte === 10 ? 0 : line + 1;
        if (line > lineMaximum) {
          stop("output-limit");
          return;
        }
      }
      if (stderr) errLine = line;
      else outLine = line;
      if (bytes > maximum) {
        stop("output-limit");
        return;
      }
      try {
        const text = (stderr ? stderrDecoder : stdoutDecoder).decode(chunk, { stream: true });
        if (stderr) err += text;
        else out += text;
      } catch {
        stop("transport");
      }
    };
    child.stdout.on("data", (chunk: unknown) => receive(chunk, false));
    child.stderr.on("data", (chunk: unknown) => receive(chunk, true));
    child.on("error", () => stop("transport"));
    child.stdin.on("error", () => stop("transport"));
    const timer = setTimeout(() => stop("timeout"), timeout);
    const abort = () => stop("cancelled");
    options.signal?.addEventListener("abort", abort, { once: true });
    if (options.signal?.aborted) abort();
    child.on("close", (code) => {
      if (outcome === "exited") {
        try {
          out += stdoutDecoder.decode();
          err += stderrDecoder.decode();
        } catch {
          outcome = "transport";
        }
      }
      if (treeTermination)
        treeTermination
          .then((confirmed) => finish(code, confirmed))
          .catch(() => finish(code, false));
      else finish(code, true);
    });
    child.stdin.end(options.input);
  });
}
