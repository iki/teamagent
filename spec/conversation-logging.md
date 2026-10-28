# Conversation records

Every completed agent reply gets one new Markdown file in [`.conversations`](.conversations), named `YYMMDD-<absolute-number>-<description>.<agent>-<model>-<effort>.md`. Numbering starts at 1, continues from the existing maximum, and never resets by date, task, or agent. Existing records are append-only, except for an explicitly authorized LF migration that retains original bytes as described below. Dates use UTC completion time. Model and effort come from actual turn metadata; unavailable values are `unknown`, never inferred from defaults.

Conversation text is stored as UTF-8 with LF. The writer converts CRLF and lone CR in public text to LF before fingerprinting and writing. This changes line-ending representation, not the recorded wording. The [migration ledger](analyses/line-endings.json) records original and LF hashes and retained-original locations without changing record numbers or session/turn metadata.

## Trigger and fallback

Project hooks run the Bun [hook adapter](../app/hooks/stop.ts) on `Stop` and `SubagentStop`. It calls the internal [writer](../app/conversations/record.ts) for both events, then runs the codebase verification gate for the root `Stop`. Subagent completion archives its reply; verification of assembled work belongs to the parent. The completed reply owns its visible progress updates; each progress update does not create a separate record. Interrupted turns without a final response are not archived automatically. A subagent uses its own supplied transcript and latest turn, without carrying an earlier reply or model into the current record.

Codex hooks require the hooks feature and project trust review. Review the project definitions through `/hooks` in the Codex CLI and resume/reopen an existing task after adding hooks. Do not modify trust state or bypass review. Existing personal hooks and notifications remain intact. See the [official hooks documentation](https://learn.chatgpt.com/docs/hooks). A successful fixture replay verifies the writer, not host activation.

Until native hooks are active, and for other agents, invoke `bun app/conversations/record.ts` with JSON on stdin immediately before delivering the final reply. Use the actual prompt, visible progress, and exact final text; preserve real metadata or use `unknown`. This is a pre-delivery fallback, not evidence that an after-response hook ran.

```json
{
  "sessionId": "actual-session-id",
  "turnId": "actual-turn-id",
  "agent": "codex",
  "model": "unknown",
  "reasoning": "unknown",
  "date": "2026-10-04T12:00:00Z",
  "description": "conversation-records",
  "prompt": "Actual user prompt, including steering updates.",
  "response": "Exact final reply about to be delivered.",
  "processingLog": ["Actual visible progress update."],
  "redactions": ["optional literal text explicitly requested to be omitted"]
}
```

The writer also accepts the native `Stop`/`SubagentStop` payload, with optional `description` and `redactions` fields. Its supplied final response takes precedence when the transcript has not flushed that message. A missing matching turn or final response is an error. Root exports also require a public prompt and validate session identity when the transcript includes it. Some native subagent transcripts store the delegation in private context rather than as a public user message: those records use an explicit “Delegated prompt unavailable” marker, retain the public final/progress, and record parent session/turn identifiers. If a forked transcript retains the parent's session metadata, the host-supplied child agent ID identifies the child session instead; otherwise its native session ID is retained. They never borrow inherited prompts or expose internal context. An explicit manual record may instead use the actual visible delegation. A failure prints no raw input and exits nonzero without requesting a continuation loop. Inputs are limited to 8 MiB and native transcripts to 128 MiB; use a narrowly selected explicit public record for larger sessions.

## Public content and privacy

Both machine-facing adapters accept JSON stdin only and reject unsupported arguments before reading it. A shared reader counts UTF-8 bytes before retaining each chunk, stops at 8 MiB, preserves split characters, and rejects malformed UTF-8. It does not buffer an unbounded stream before enforcing the limit. Human diagnostics stay on stderr and successful stdout remains JSON.

Each record has `## Prompt`, `## Response`, and `## Processing Log` sections. Native exports retain user messages and assistant commentary/final messages only. System/developer instructions, environment metadata, private analysis/reasoning, command scripts, tool inputs/outputs, patches, and raw event payloads are excluded. Do not reconstruct hidden reasoning or manufacture missing text. Manually supplied processing logs describe publicly visible activity only.

Recognized credentials (including common token forms, bearer authorization, password/key assignments, private keys, and credential-bearing URLs) are redacted before writing. Optional literal redactions apply to content and filenames, and each record clearly declares sanitization. This import task anonymizes the named source repository as requested by the user. Redaction is defense in depth, not a guarantee that arbitrary secrets can be detected: never intentionally put secrets in a manual log.

Unambiguous absolute file links and paths become relative to the record directory; URLs and existing relative paths are unchanged. Leading-slash paths rebase only under known current/former checkout roots or an explicit file:// reference, preserving API routes and site-root web links. An optional `previousRoot` maps a renamed checkout to its current location. Different Windows volumes use `external-file-<basename>` placeholders because a real relative link is unavailable.

## Reliability and verification

Allocation uses a directory lock and publishes through a rename, preserving existing records. A fingerprint of the session, turn, agent and sanitized response with LF line endings makes retries idempotent; changed final replies get new numbers. Concurrent writers share the lock. Invalid or duplicate existing numbers stop allocation instead of overwriting history. A crash or failed publication can leave `.conversations/.write-lock` with a partial record. Inspect and recover it manually, only after confirming no writer is active; the writer never steals an old lock.

Conversation files are excluded from general formatting so historical wording and layout stay intact; this does not exempt their active text representation from the LF policy. Original public bytes are retained under `spec/archive/line-endings/originals/<sha>.bin`; private-cache originals stay under `.cache/line-endings/originals/<sha>.bin`. Migration manifests explicitly list `retainedOriginals` paths and hashes. These preserved originals are evidence, not active text outputs.

Regression tests cover concurrent global numbering, duplicate delivery, changed replies, corrupt numbering, invalid metadata, redaction, portable paths, selected turn/session isolation, steering updates, missing finals, subagent context reset, and private/tool data exclusion. The [normal verification gate](verification.md) includes these tests, the writer and LF checks.
