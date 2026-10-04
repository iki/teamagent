export const cli = {
  name: "workspaces",
  description: "Register and inspect local working directories.",
  commands: [
    { name: "list", description: "List registered workspaces." },
    { name: "add", description: "Register an existing local directory." },
    { name: "show", description: "Inspect a registered workspace." },
  ],
} as const;
