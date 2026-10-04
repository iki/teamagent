export const cli = {
  name: "integrations",
  description: "Discover installed agents and install scoped memory access.",
  commands: [
    {
      name: "list",
      description: "List passive installation evidence and integration capabilities.",
    },
    { name: "plan", description: "Preview skill and MCP installation for one agent." },
    {
      name: "install",
      description: "Install a skill and optional MCP configuration without overwriting conflicts.",
    },
  ],
} as const;
