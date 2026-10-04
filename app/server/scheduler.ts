import { randomUUID } from "node:crypto";
import { Effect } from "effect";
import { getLogger } from "@logtape/logtape";
import { HarnessError, type Store, type Task } from "@/tasks";
import { executeTask, type ExecutionContext } from "../adapters/index.ts";
import type { ModelBinding } from "../adapters/models.ts";

const logger = getLogger(["teamagent", "scheduler"]);
export type Executor = (
  context: ExecutionContext,
  signal: AbortSignal,
) => Effect.Effect<void, unknown>;
export function createScheduler(
  store: Store,
  binding?: ModelBinding,
  execute: Executor = executeTask,
) {
  const owner = randomUUID();
  const active = new Map<
    string,
    { task: Task; controller: AbortController; done: Promise<void> }
  >();
  let closed = false;
  let ticking = false;
  const settle = async (work: Effect.Effect<unknown, unknown>) => {
    await Effect.runPromise(
      work.pipe(
        Effect.catch(() => Effect.sync(() => logger.warning("A fenced task update was rejected"))),
      ),
    );
  };
  const tick = async () => {
    if (closed || ticking) return;
    ticking = true;
    try {
      await Effect.runPromise(store.recoverExpiredTasks());
      const tasks = await Effect.runPromise(store.listTasks());
      for (const task of [...tasks].reverse()) {
        if (closed || active.size >= 2) break;
        if (
          task.status !== "queued" ||
          [...active.values()].some((entry) => entry.task.workspaceId === task.workspaceId)
        )
          continue;
        const claimed = await Effect.runPromise(
          store.claimTask(task.id, owner, 15000).pipe(Effect.option),
        );
        if (claimed._tag === "None") continue;
        const claim = claimed.value;
        const controller = new AbortController();
        const timeout = setTimeout(
          () => controller.abort(new Error("Task deadline reached")),
          task.maxDurationMs,
        );
        const heartbeat = setInterval(() => {
          void Effect.runPromise(
            store.renewLease(task.id, owner, claim.attempt.epoch, 15000),
          ).catch(() => controller.abort(new Error("Lease lost")));
        }, 4000);
        const done = (async () => {
          try {
            const workspace = await Effect.runPromise(store.getWorkspace(task.workspaceId));
            const current = await Effect.runPromise(store.getTask(task.id));
            if (current.status !== "running" || current.attemptId !== claim.attempt.id)
              throw new Error("Task was cancelled before execution started");
            const result = await Effect.runPromise(
              execute({ claim, store, workspace, binding }, controller.signal).pipe(
                Effect.catch((error) => Effect.succeed({ failure: error })),
              ),
            );
            if (result !== undefined) throw result.failure;
            if (controller.signal.aborted) {
              await settle(
                store.finishTask(
                  task.id,
                  owner,
                  claim.attempt.epoch,
                  closed ? "interrupted" : "failed",
                  closed
                    ? "Service stopped before completion; effects were not replayed."
                    : "Execution deadline reached.",
                ),
              );
            } else
              await settle(
                store.finishTask(
                  task.id,
                  owner,
                  claim.attempt.epoch,
                  "succeeded",
                  "Execution completed. Artifacts contain the adapter's result and verification limits.",
                ),
              );
          } catch (error) {
            const message = closed
              ? "Service stopped before completion; effects were not replayed."
              : controller.signal.aborted
                ? "Execution deadline reached. Completed effects are retained."
                : error instanceof HarnessError
                  ? error.message
                  : "Execution stopped without a successful result. Review progress and retained artifacts before submitting another task.";
            await settle(
              store.finishTask(
                task.id,
                owner,
                claim.attempt.epoch,
                closed ? "interrupted" : "failed",
                message,
              ),
            );
          } finally {
            clearInterval(heartbeat);
            clearTimeout(timeout);
            active.delete(task.id);
          }
        })();
        active.set(task.id, { task, controller, done });
      }
    } catch {
      logger.error("Scheduler storage operation failed");
    } finally {
      ticking = false;
    }
  };
  const timer = setInterval(() => {
    void tick();
  }, 200);
  return {
    tick,
    cancel: async (id: string) => {
      const task = await Effect.runPromise(
        store.cancelTask(id).pipe(Effect.catch((error) => Effect.succeed(error))),
      );
      if (task instanceof HarnessError) throw task;
      const running = active.get(id);
      if (running) {
        running.controller.abort(new Error("Task cancelled"));
        // Retain workspace ownership until every granted tool has returned.
        await running.done;
      }
      return task;
    },
    close: async () => {
      closed = true;
      clearInterval(timer);
      while (ticking) await new Promise<void>((resolve) => setTimeout(resolve, 5));
      for (const running of active.values())
        running.controller.abort(new Error("Service stopping"));
      await Promise.all([...active.values()].map((running) => running.done));
    },
  };
}
