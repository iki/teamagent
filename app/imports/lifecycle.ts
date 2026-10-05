import { Effect } from "effect";

/** Effect.tryPromise aborts without joining its Promise; adapter cleanup must be awaited. */
export function scopedHostPromise<A, E>(options: {
  readonly try: (signal: AbortSignal) => Promise<A>;
  readonly catch: (error: unknown) => E;
}): Effect.Effect<A, E> {
  return Effect.acquireUseRelease(
    Effect.sync(() => {
      const controller = new AbortController();
      const work = Promise.resolve().then(() => {
        controller.signal.throwIfAborted();
        return options.try(controller.signal);
      });
      return { controller, work };
    }),
    ({ work }) => Effect.tryPromise({ try: () => work, catch: options.catch }),
    ({ controller, work }) =>
      Effect.promise(async () => {
        controller.abort();
        await work.catch(() => undefined);
      }),
  );
}
