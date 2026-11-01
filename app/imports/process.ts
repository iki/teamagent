import { execFile } from "node:child_process";
import { importLimits } from "./limits.ts";

export function processEnvironment(): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = {};
  for (const name of [
    "PATH",
    "SystemRoot",
    "SYSTEMROOT",
    "WINDIR",
    "TEMP",
    "TMP",
    "HOME",
    "USERPROFILE",
    "LANG",
  ]) {
    const value = process.env[name];
    if (value !== undefined) env[name] = value;
  }
  return env;
}

export function runProcess(
  executable: string,
  arguments_: readonly string[],
  options: {
    signal: AbortSignal;
    cwd?: string;
    env?: NodeJS.ProcessEnv;
    bytes?: number;
    timeoutMs?: number;
  },
): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    options.signal.throwIfAborted();
    execFile(
      executable,
      [...arguments_],
      {
        encoding: "buffer",
        maxBuffer: options.bytes ?? importLimits.totalBytes,
        timeout: options.timeoutMs ?? importLimits.processMs,
        killSignal: "SIGKILL",
        signal: options.signal,
        env: options.env ?? processEnvironment(),
        ...(options.cwd === undefined ? {} : { cwd: options.cwd }),
        // Fixed background policy wins over optional settings.
        windowsHide: true,
      },
      (error, stdout) => {
        if (error !== null)
          reject(
            new Error(
              options.signal.aborted
                ? "Import cancelled"
                : "Import worker failed or exceeded its limit",
            ),
          );
        else resolve(stdout);
      },
    );
  });
}
