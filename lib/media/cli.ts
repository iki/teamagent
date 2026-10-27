export const cli = {
  name: "media",
  description: "Run bounded media work with general provider training disabled by default.",
  commands: [
    {
      name: "setup",
      description:
        "Show official backend setup and training-policy conditions (optional backend argument).",
    },
    {
      name: "backends",
      description: "Passively inspect backend capabilities and unresolved training conditions.",
    },
    {
      name: "plan",
      description:
        "Explain a request JSON without provider calls; only --allow-training grants invocation opt-in.",
    },
    { name: "inspect", description: "Inspect a local media file." },
    { name: "convert", description: "Convert local audio with explicit output settings." },
    {
      name: "transcribe",
      description:
        "Transcribe local audio; general provider training requires explicit --allow-training.",
    },
    {
      name: "synthesize",
      description:
        "Generate speech; --text-file with --text-format srt retains subtitle cue mapping.",
    },
    {
      name: "clone",
      description:
        "Enroll a reference recording with language, similarity and an optional idempotency key.",
    },
    {
      name: "record",
      description: "Capture bounded WAV audio from an explicitly selected device.",
    },
    { name: "voice-get", description: "Read one provider voice by ID (requires --backend)." },
    { name: "voice-list", description: "Read a bounded provider voice page (requires --backend)." },
    {
      name: "voice-wait",
      description:
        "Poll a voice ID with explicit --backend, bounded --timeout-ms and --poll-interval-ms.",
    },
    {
      name: "voice-delete",
      description: "Delete the named voice resource on an explicit --backend.",
    },
    {
      name: "diagnose",
      description: "Authenticate an explicit --backend and report safe account/access diagnostics.",
    },
    { name: "receipts", description: "List bounded local media recovery receipts." },
    { name: "receipt", description: "Read a local media recovery receipt by ID." },
    {
      name: "resume",
      description: "Resume an existing receipt without automatically resubmitting paid work.",
    },
    {
      name: "import-text",
      description:
        "Import FILE --text-format srt without inference; preserve wording and cue mappings.",
    },
  ],
} as const;
