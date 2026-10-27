export const cli = {
  name: "channels",
  description: "Normalize local channel deliveries and speech events with provenance",
  commands: [
    { name: "inspect", description: "Validate a channel envelope without processing attachments" },
    { name: "ingest", description: "Process text and attachments into a deduplicated input turn" },
    { name: "status", description: "Inspect the durable receipt for a channel message" },
    { name: "speech", description: "Replay ordered speech events, retaining only finalized text" },
  ],
} as const;
