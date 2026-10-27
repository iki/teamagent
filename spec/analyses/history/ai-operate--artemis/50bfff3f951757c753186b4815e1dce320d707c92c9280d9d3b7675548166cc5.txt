# Artemis: mobile operation as an asynchronous device tool

Source: [artemis](https://github.com/google/artemis) · Category: `ai-operate`

Review depth: **source-reviewed**. Snapshot `351ca8422f7b5b54e80a9c1ce03a222e02415b6b`; assessed 2026-10-04. This is a focused static review of the listed files, not an audit of every code path or a reproduced benchmark. No repository code, model weights, paid endpoints, or installers were run.

## Observed architecture

Artemis exposes mobile task execution through MCP. The inspected runner integrates a device execution lock, device pool, daemon submission, trace storage, and notifications. A startup watchdog checks whether a spawned runner opened its logs, marks a hung startup failed, releases a queue reservation, and attempts process-tree termination. This addresses an important operational failure mode: a dead worker must not leave a phone permanently reserved by a task that still appears to run.

The README describes visual/element targeting and Android automation. Its speed and benchmark success claims were not reproduced. Mobile operation is also different from the user's requirement for a fast mobile harness app: Artemis can act on a phone, while the harness still needs its own authenticated mobile interface.

## Harness adoption

Implement as an optional device worker with one active controller per device, explicit task ownership, bounded time, and replayable observations. Persist screenshots and UI state as artifacts; extract only needed observations into model context. Use task-scoped authorization for account actions and dispatch external side effects through the same policy layer as API tools.

The watchdog and device-lock pattern generalizes to browsers, GPUs, and other exclusive resources. Separate queue admission, worker bootstrap, task execution, and terminal status; make cancellation release resources even if the original process disappears.

## Limitations and decision

Prototype for authorized device testing or personal automation. Do not interpret benchmark badges as proof of reliability on arbitrary apps, locales, permissions, or device states. UI actions can have externally visible effects and often lack idempotency keys, so retry policies must inspect the resulting state before repeating taps. Evaluate interruption, reconnect, lock recovery, secrets in screenshots, and task ownership before exposing remote device access through public chat channels.

## Evidence read

- [Task-runner dependencies and spawn watchdog](https://github.com/google/artemis/blob/351ca8422f7b5b54e80a9c1ce03a222e02415b6b/mcp_server/tools/task_runner.py#L15-L119)
- [Declared product scope](https://github.com/google/artemis/blob/351ca8422f7b5b54e80a9c1ce03a222e02415b6b/README.md#L35-L43)

## Related directions

[Agents](../agents.md) · [Channels](../channels.md) · [Decisions](../decisions.md) · [Security](../security.md)
