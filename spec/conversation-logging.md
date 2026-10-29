# Conversation records

Each changed logical repository task has one public record in [`.conversations`](.conversations), named `YYMMDD-<description>.<agent>-<model>-<effort>.md`. Stable identity suffixes resolve filename collisions without overwriting another task. Preserve the logical `taskId` through follow-ups, clarification and continuation. Global numbering is no longer used. The authorized [name migration](analyses/conversation-names.json) renamed 86 historical files without changing their content and retained exact originals. Dates use UTC checkpoint time; historical dates remain untouched. Model and effort come from actual metadata; unavailable values are `unknown`, never inferred from defaults.

Conversation text is UTF-8 with LF. The writer converts CRLF and lone CR before fingerprinting and writing. This changes line-ending representation, not wording. The [LF ledger](analyses/line-endings.json) and filename migration preserve original hashes, old-to-new paths and retained-original locations without altering historical session/turn metadata.

## Trigger and fallback

Project hooks use the Bun [adapter](../app/hooks/stop.ts) for `Stop` and `SubagentStop`. Native root recording requires an explicitly begun active workflow task and changed content. No active task, no change or an already frozen task produces an explicit skip; the writer does not fabricate a per-response task. Subagent progress belongs to the root task and does not create a separate publication record. Verification of assembled work belongs to the parent. Keep each visible update with its actual task; interrupted turns without a final response are not archived automatically.

Codex hooks require the hooks feature and project trust review. Review the project definitions through `/hooks` in the Codex CLI and resume/reopen an existing task after adding hooks. Do not modify trust state or bypass review. Existing personal hooks and notifications remain intact. See the [official hooks documentation](https://learn.chatgpt.com/docs/hooks). A successful fixture replay verifies the writer, not host activation.

Until native hooks are active, invoke the JSON writer explicitly with a stable logical `taskId`. Use actual prompts, visible progress and the exact implementation response; preserve real metadata or use `unknown`. The [workflow checkpoint](workflow.md) freezes the record path and response/content hashes before final verification and publication. Later check/push outcomes belong in receipts. A changed response cannot silently replace or append to a frozen record. The manual fallback is not evidence that a host hook ran.

```json
{
  "sessionId": "actual-session-id",
  "turnId": "actual-turn-id",
  "taskId": "actual-logical-task-id",
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

Native input retains optional `description` and `redactions`. A supplied final response takes precedence when the transcript has not flushed it. A missing matching turn/final is an error; root parsing requires a public prompt and validates available session identity. The bounded transcript parser preserves fork/subagent metadata handling without exposing inherited private delegation or borrowing a previous turn's prompt. The task-level hook rules above determine whether it writes. A failure prints no raw input and exits nonzero without requesting a continuation loop. Inputs are limited to 8 MiB and native transcripts to 128 MiB; use a narrowly selected explicit public record for larger sessions.

## Public content and privacy

Both machine-facing adapters accept JSON stdin only and reject unsupported arguments before reading it. A shared reader counts UTF-8 bytes before retaining each chunk, stops at 8 MiB, preserves split characters, and rejects malformed UTF-8. It does not buffer an unbounded stream before enforcing the limit. Human diagnostics stay on stderr and successful stdout remains JSON.

Each record has prompt, response and processing-log sections; follow-ups remain within the same open task record. Optional numbered questions and lettered options retain user-visible choices and actual answers. Pending answers must be reconciled before freezing. Native parsing retains user and assistant commentary/final messages only. System/developer instructions, environment metadata, private analysis/reasoning, command scripts, tool inputs/outputs, patches and raw event payloads are excluded. Do not reconstruct hidden reasoning or manufacture missing text. Manual processing logs contain publicly visible activity only.

Exact-retry identity covers the sanitized prompt, visible progress and public
metadata as well as the response. Repeating only the response text cannot
silently discard additional public context. Q/A answers are reconciled
separately before freezing. The direct library entry also enforces an aggregate
8 MiB validated-text input limit before cleaning, hashing or writing; per-field
bounds do not replace the aggregate limit.

Recognized credentials (including common token forms, bearer authorization, password/key assignments, private keys and credential-bearing URLs) are redacted before writing. Optional literal redactions apply to content and filenames, and each record declares sanitization. Historical explicitly requested anonymization remains preserved; do not silently invent new redactions or remove existing ones. Redaction is defense in depth, not a guarantee that arbitrary secrets can be detected: never intentionally put secrets in a manual log.

Unambiguous absolute file links and paths become relative to the record directory; URLs and existing relative paths are unchanged. Leading-slash paths rebase only under known current/former checkout roots or an explicit file:// reference, preserving API routes and site-root web links. An optional `previousRoot` maps a renamed checkout to its current location. Different Windows volumes use `external-file-<basename>` placeholders because a real relative link is unavailable.

## Reliability and verification

The writer uses an exclusive lock and atomic publication. Task and response fingerprints make exact retries idempotent; changed open-task responses append a public follow-up, while frozen-task drift is rejected. Duplicate identities and unresolved filename collisions fail instead of overwriting history. Reads have per-file and aggregate bounds. Never steal a live, foreign or unknown lock because it is old; recover only with the ownership evidence required by the workflow lock contract. Preserve partial state and inspect it after interrupted publication.

An explicit workflow checkpoint revision can renew repaired source hashes and
scope while preserving this record byte-for-byte. It retains a separate
immutable revision receipt and requires fresh verification. It cannot amend
the public response, change the original task baseline or restart an uncertain
commit/push. No automatic lock reclamation or archive pruning is implemented.

Conversation files are excluded from general formatting so historical wording and layout stay intact; this does not exempt their active text representation from the LF policy. Original public bytes are retained under `spec/archive/line-endings/originals/<sha>.bin`; private-cache originals stay under `.cache/line-endings/originals/<sha>.bin`. Migration manifests explicitly list `retainedOriginals` paths and hashes. These preserved originals are evidence, not active text outputs.

Regression coverage includes concurrent task records, duplicate delivery, descriptive-name collisions, follow-ups, frozen drift, pending/answered questions, redaction, portable paths, turn/session isolation, missing finals, subagent context reset and private/tool data exclusion. The [normal gate](verification.md) includes these boundaries and LF checks; [task publication](workflow.md) independently verifies frozen content and scope.
