import { spawnOwned, type OwnedProcess } from "../check/owned-process.ts";
import { createTemporaryWorkspace, temporaryParent } from "../check/temporary-workspace.ts";
import { isAbsolute } from "node:path";
import { fileURLToPath } from "node:url";
import { stripVTControlCharacters } from "node:util";
import { redact } from "../conversations/privacy.ts";
import { lf } from "./storage.ts";

const resourceRoot = fileURLToPath(new URL("../../", import.meta.url));

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

/** Bounded capture owns descendants and scratch until joined cleanup completes. */
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
  const environment = options.env ?? process.env;
  const executable = isAbsolute(command)
    ? command
    : Bun.which(command, { PATH: environment.PATH ?? "", cwd: root });
  if (!executable)
    return { code: null, outcome: "transport", stdout: "", stderr: "", termination: "closed" };
  const parent = await temporaryParent(environment, resourceRoot);
  const workspace = await createTemporaryWorkspace(resourceRoot, "command", parent);
  let safeToDispose = true;
  try {
    let owned: OwnedProcess;
    try {
      owned = await spawnOwned(executable, args, {
        cwd: root,
        env: workspace.environment(environment),
        stdio: "pipe",
        ...(options.signal === undefined ? {} : { signal: options.signal }),
      });
    } catch {
      return {
        code: null,
        outcome: options.signal?.aborted ? "cancelled" : "transport",
        stdout: "",
        stderr: "Owned command could not be launched.\n",
        termination: "closed",
      };
    }
    safeToDispose = false;
    const { child } = owned;
    const stdin = child.stdin,
      stdout = child.stdout,
      stderr = child.stderr;
    if (!stdin || !stdout || !stderr) {
      await owned.stop("Required process streams are unavailable");
      safeToDispose = (await owned.closed).termination === "closed";
      throw new Error("Required process streams are unavailable");
    }
    const stdoutDecoder = new TextDecoder("utf-8", { fatal: true });
    const stderrDecoder = new TextDecoder("utf-8", { fatal: true });
    let outcome: ProcessResult["outcome"] = "exited";
    let bytes = 0,
      out = "",
      err = "",
      outLine = 0,
      errLine = 0;
    let stopFailure = false;
    let stopping: Promise<void> | undefined;
    const stop = (reason: ProcessResult["outcome"]): void => {
      if (outcome !== "exited") return;
      outcome = reason;
      stopping = owned.stop("Bounded command stopped").catch(() => {
        stopFailure = true;
      });
    };
    const receive = (chunk: unknown, isError: boolean): void => {
      if (!(chunk instanceof Uint8Array)) {
        stop("transport");
        return;
      }
      if (outcome !== "exited") return;
      bytes += chunk.byteLength;
      let line = isError ? errLine : outLine;
      for (const byte of chunk) {
        line = byte === 10 ? 0 : line + 1;
        if (line > lineMaximum) {
          stop("output-limit");
          return;
        }
      }
      if (isError) errLine = line;
      else outLine = line;
      if (bytes > maximum) {
        stop("output-limit");
        return;
      }
      try {
        const text = (isError ? stderrDecoder : stdoutDecoder).decode(chunk, { stream: true });
        if (isError) err += text;
        else out += text;
      } catch {
        stop("transport");
      }
    };
    const abort = (): void => stop("cancelled");
    const timer = setTimeout(() => stop("timeout"), timeout);
    stdout.on("data", (chunk: unknown) => receive(chunk, false));
    stderr.on("data", (chunk: unknown) => receive(chunk, true));
    child.on("error", () => stop("transport"));
    stdin.on("error", () => stop("transport"));
    options.signal?.addEventListener("abort", abort, { once: true });
    try {
      if (options.signal?.aborted) abort();
      stdin.end(options.input);
      const result = await owned.closed;
      await stopping;
      if (outcome === "exited") {
        try {
          out += stdoutDecoder.decode();
          err += stderrDecoder.decode();
        } catch {
          outcome = "transport";
        }
        if (result.error || result.code === null) outcome = "transport";
      }
      safeToDispose = !stopFailure && result.termination === "closed";
      if (!safeToDispose && outcome === "exited") outcome = "transport";
      return {
        code: result.code,
        outcome,
        stdout: out,
        stderr: err,
        termination: safeToDispose ? "closed" : "unconfirmed",
      };
    } finally {
      clearTimeout(timer);
      options.signal?.removeEventListener("abort", abort);
      if (!safeToDispose) {
        await owned.stop("Command scope closed").catch(() => {
          stopFailure = true;
        });
        const result = await owned.closed;
        safeToDispose = !stopFailure && result.termination === "closed";
      }
    }
  } finally {
    // Retain scratch when descendant shutdown cannot be proved; never infer cleanup from a PID.
    if (safeToDispose) await workspace.dispose();
  }
}
