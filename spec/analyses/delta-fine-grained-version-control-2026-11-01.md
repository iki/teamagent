# Delta: fine-grained artifact history

[Architecture](../architecture.md) · [Agents](../agents.md) · [Memory](../memory.md) · [Applications](../architecture/applications.md) · [Evaluation](../evaluation.md)

Source: [Building fine-grained version control for agents with Rust and Durable Objects](https://delta.dev/blog/fine-grained-version-control-for-agents), Antonio Scandurra. The page displays **2026-10-29** as its publication date; this is publisher-reported, without an independently verified creation timestamp. Reviewed **2026-11-01**. Source kind: static vendor article, registered as `agents.261029.fine-grained-version-control.delta.md` in [the text source list](../../.urls.md.conf). No repository revision was inspected and no Git SHA applies to this article review.

The [static import report](texts/agents.261029.fine-grained-version-control.delta.md.report.md)
records version `a006e2cb-2ab2-438c-936f-04d8eabcc6ff` and content SHA-256
`6e188765049d9c9caa679bdad9b4a56e62286d866798b5279260364bb95faef2`.
Retained HTML also records the displayed date through
`article:published_time`; both remain publisher assertions. All five exported
files match their recorded sizes and hashes. The three captured images are author
avatars; their count does not establish preservation of the interactive diagrams.

## Supported description and evidence limits

The article describes SQLite-backed CRDT deltas in a causal DAG, compact frontier versions, copy-on-write B+ tree snapshots, and timelines synchronized over WebSockets. A Durable Object owns each shared thread. File history connects to Git without requiring commits for every coordination event. Foreground snapshots and background persistence separate interactive editing from durable storage. These are the author's implementation descriptions; this review did not inspect that implementation, execute its interactive demonstrations, or reproduce performance claims.

## Teamagent design inferences

The separately inspected [Delta Claude client](https://github.com/zed-industries/delta-claude)
has its own [commit-pinned source report](unreviewed/ai-skills--repo.delta-claude.md).
Its selected delivery and outbox helpers validate pending sequences and
acknowledged prefixes. That narrower client evidence does not verify the
article's server storage, causal-history implementation or performance claims.

The following are proposed Teamagent requirements, not claims that Delta provides these guarantees or that Teamagent has implemented a replicated history system.

- Keep an optional artifact-history plane separate from task authorization, effect receipts and signed Git publication. Bind a file/tree version to permitted public actions and conclusions; never make private model reasoning a retention requirement.
- Preserve the existing isolated-writer and integrator contract until an alternative passes semantic acceptance on combined changes. Convergent text alone cannot establish a valid schema, safe dependency update or authorized external action.
- Distinguish an edit visible in the UI from one committed locally and one acknowledged remotely. Retain uncertain external effects independently; replaying history must not repeat them.
- Authorize historical reads and reconnects against current permissions. Define deletion and retention for old versions before collecting more granular history. Content identity is not an access grant.
- Bound graph traversal, replay, retained versions and reconnect work. Preserve incomplete-coverage states when a limit prevents reconstruction. A historical view must expose its exact version and persistence status.

This is a candidate experiment within the existing TypeScript/Effect, React and Tauri boundaries. The article does not justify replacing those adopted choices or relaxing the repository publication workflow.

## Evaluation before adoption

Compare with the current event-log and isolated-Git-worktree approach using equal workloads and resource budgets. Measure cold reconstruction, reconnect bytes, interaction latency, memory/disk growth and concurrent edit bursts. Inject interruption before and after persistence, duplicate/out-of-order delivery, stale writer epochs and permission revocation while offline. Require independently checked combined-code correctness and exact source attribution. Report unsupported extraction of interactive material separately from preserved article text. No such experiment was run in this review.
