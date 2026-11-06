---
name: conversation-records
description: Maintain public agent conversation records tied to logical repository tasks. Use when adding logging hooks, recording a changed task, or repairing archive continuity; not for exporting private model reasoning or raw tool transcripts.
---

# Public task conversation records

Read the project's logging policy, record schema, archive location, task identity contract, and actual agent hook support. Use its validated writer. Preserve one logical task across follow-ups and delegation; do not create a new publication record for every agent turn. Subagent progress belongs to the parent task unless the user actually assigned an independent task.

Record actual user prompts, visible progress, relevant public clarification questions and answers, and the exact implementation response. Reconcile pending answers before freezing. Preserve known agent/model metadata and label unknown values honestly. Exclude hidden reasoning, system/developer instructions, raw tool inputs/outputs, tool-only command scripts and patches, credentials, and private payloads. Do not reconstruct missing content from inference.

Apply the project's explicit redactions and privacy boundary before writing. Label redaction honestly; automatic secret matching is defense in depth, not a guarantee that arbitrary secrets are safe to log. Normalize maintained text only as the policy permits, preserving required original bytes and hash provenance. Use descriptive collision-safe filenames and portable archive-relative links; never overwrite another task or renumber historical records for convenience.

Freeze the record's path and content/response identity at the project's defined checkpoint before final verification and publication. Later check, integration, and push outcomes belong in separate receipts. A retry must reconcile the whole record identity; matching only the final response must not discard added prompts or visible context. A repair to source hashes does not authorize rewriting the frozen conversation.

## Hook integration

Repository descriptors are not universal agent hook APIs. Check the actual host's supported event, payload, trust, lifecycle, and exit semantics. Installation does not prove activation. Preserve existing personal hooks and permissions. Until host activation has been observed, invoke the writer explicitly and report that manual recording separately from native hook execution.

Bound transcript input while streaming, cumulative public text, line lengths, archive inventory, and diagnostics. Decode UTF-8 strictly and validate external JSON before selecting public content. Keep the source transcript unchanged. Use atomic publication and exact-owner locking; retain uncertain partial state instead of stealing locks or pruning history. Logging failure must not bypass required verification or trigger an unbounded completion loop.
