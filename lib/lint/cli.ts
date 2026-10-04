export const cli = {
  name: "lint",
  description: "Check architecture, reliability, and source conventions.",
  commands: [{ name: "check", description: "Run the repository verification gate." }],
} as const;
