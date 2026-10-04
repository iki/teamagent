export const cli = {
  name: "memory",
  description: "Capture, sync and retrieve versioned source evidence.",
  commands: [
    {
      name: "get",
      description: "Retrieve a source and retain its original bytes and derivatives.",
    },
    { name: "sync", description: "Check a source and publish a new version only when it changed." },
    { name: "list", description: "List sources in the selected workspace." },
    { name: "show", description: "Inspect a source and its immutable versions." },
    { name: "read", description: "Read a verified original, Markdown document or image." },
    { name: "search", description: "Search current source text with versioned citations." },
    { name: "export", description: "Export a verified source version and its manifest." },
    {
      name: "delete",
      description: "Delete source metadata and search entries from this workspace.",
    },
    {
      name: "doctor",
      description: "Inspect available source converters and their supported formats.",
    },
    { name: "setup", description: "Provision the project document converter." },
    { name: "mcp", description: "Serve the memory API over the MCP stdio protocol." },
  ],
} as const;
