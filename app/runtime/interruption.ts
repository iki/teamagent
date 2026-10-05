/** Keep signal handlers installed until the host operation and its cleanup settle. */
export async function withHostInterruption<A>(
  operation: (signal: AbortSignal) => Promise<A>,
): Promise<A> {
  const controller = new AbortController();
  const interrupt = () => controller.abort();
  const signals: readonly NodeJS.Signals[] =
    process.platform === "win32" ? ["SIGINT", "SIGTERM", "SIGBREAK"] : ["SIGINT", "SIGTERM"];
  for (const signal of signals) process.on(signal, interrupt);
  try {
    return await operation(controller.signal);
  } finally {
    for (const signal of signals) process.removeListener(signal, interrupt);
  }
}
