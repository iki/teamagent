export const cli = {
  name: "artifacts",
  description: "Inspect and export verified task outputs.",
  commands: [
    { name: "list", description: "List a task's immutable artifacts." },
    { name: "show", description: "Read an artifact after checking its digest." },
    { name: "export", description: "Export verified bytes to a new local file." },
  ],
} as const;
