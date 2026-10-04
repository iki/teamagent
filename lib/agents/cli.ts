export const cli = {
  name: "agents",
  description: "Inspect adapters and their verified capabilities.",
  commands: [
    { name: "list", description: "List available adapters and capability evidence." },
    { name: "models", description: "List the pinned provider model catalog without inference." },
  ],
} as const;
