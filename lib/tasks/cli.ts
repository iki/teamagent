export const cli = {
  name: "tasks",
  description: "Submit and inspect durable agent work.",
  commands: [
    { name: "list", description: "List persisted tasks." },
    { name: "add", description: "Queue an objective in a registered workspace." },
    { name: "show", description: "Inspect a task and its progress." },
    { name: "cancel", description: "Cancel queued or running work." },
  ],
} as const;
