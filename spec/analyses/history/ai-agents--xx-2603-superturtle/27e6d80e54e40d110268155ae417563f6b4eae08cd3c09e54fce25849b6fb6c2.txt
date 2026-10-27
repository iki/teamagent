# xx-2603-superturtle

Source: [xx-2603-superturtle](https://github.com/Rigos0/superturtle) · Category: [ai-agents](../categories/ai-agents.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `247db1f16ae7eef8984cb96c9f65bfacaf228ef4`; commit timestamp `2026-03-28T17:33:57+01:00`; 675 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/Rigos0/superturtle/blob/247db1f16ae7eef8984cb96c9f65bfacaf228ef4/README.md)):

> SuperTurtle is an autonomous coding agent you control from Telegram. Send a voice message or text from your phone, and SuperTurtle gets to work on your machine using Codex and Claude Code. Whether you're on the couch, out for a walk, or on a different machine entirely, SuperTurtle keeps the work moving. For bigger tasks it spins up parallel workers called SubTurtles and supervises them to completion. You get milestone updates as things land, not a wall of logs. For normal local use, `superturtle start` is the command that makes the bot run cont

Build/package evidence: [super_turtle/claude-telegram-bot/package.json](https://github.com/Rigos0/superturtle/blob/247db1f16ae7eef8984cb96c9f65bfacaf228ef4/super_turtle/claude-telegram-bot/package.json); [super_turtle/package.json](https://github.com/Rigos0/superturtle/blob/247db1f16ae7eef8984cb96c9f65bfacaf228ef4/super_turtle/package.json); [super_turtle/subturtle/pyproject.toml](https://github.com/Rigos0/superturtle/blob/247db1f16ae7eef8984cb96c9f65bfacaf228ef4/super_turtle/subturtle/pyproject.toml)

License evidence: [LICENSE](https://github.com/Rigos0/superturtle/blob/247db1f16ae7eef8984cb96c9f65bfacaf228ef4/LICENSE) Classification hint: MIT. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents**. Its category places it in the candidate set for agents, models, channels; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [models](../models.md) · [channels](../channels.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.
