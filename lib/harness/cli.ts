export const cli = {
  name: "harness",
  description: "Run and inspect the local control plane.",
  commands: [
    { name: "serve", description: "Start the local task service and web application." },
    { name: "status", description: "Check the connected task service." },
    { name: "modules", description: "List public module APIs and commands." },
    { name: "token", description: "Read the local browser pairing credential." },
  ],
} as const;
