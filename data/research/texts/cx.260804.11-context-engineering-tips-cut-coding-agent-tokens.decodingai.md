---
author: "Paul Iusztin"
title: "11 Tips to Run Coding Agents 24/7 on One Subscription"
publisher: "Decoding AI Magazine"
date: "2026-08-04T11:04:10.000Z"
description: "Context engineering techniques to avoid wasting tokens on what doesn’t matter"
url: "https://www.decodingai.com/p/11-context-engineering-tips-cut-coding-agent-tokens"
lang: "en"
image_url: "https://substackcdn.com/image/fetch/$s_!-mAQ!,w_1200,h_675,c_fill,f_jpg,q_auto:good,fl_progressive:steep,g_auto/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2Ff89ec8d0-4fe0-4c4e-be76-04cb2528a742_1376x768.png"
image_type: "jpg"
image_size: 144356
image_height: 675
image_width: 1200
image_size_pretty: "144 kB"
logo_url: "https://substackcdn.com/image/fetch/$s_!6sU6!,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F7088785c-ba54-485c-aa94-e03e6286c5d7%2Fapple-touch-icon-1024x1024.png"
logo_type: "png"
logo_size: 57482
logo_height: 1024
logo_width: 1024
logo_size_pretty: "57.5 kB"
word_count: 452
reading_time: "2 min read"
---

## Table of Contents

- [Context engineering techniques to avoid wasting tokens on what doesn't matter](#context-engineering-techniques-to-avoid-wasting-tokens-on-what-doesnt-matter)
- [1. Progressive disclosure is the foundation everything else sits on](#1-progressive-disclosure-is-the-foundation-everything-else-sits-on)
- [2. Plan like crazy, then let a cheaper model execute](#2-plan-like-crazy-then-let-a-cheaper-model-execute)
- [3. For greenfield work, an LLM wiki is the context you point at](#3-for-greenfield-work-an-llm-wiki-is-the-context-you-point-at)
- [4. Send a cheap subagent to read the whole thing](#4-send-a-cheap-subagent-to-read-the-whole-thing)
- [5. An ADR and a glossary per feature](#5-an-adr-and-a-glossary-per-feature)
- [6. I don’t graph-index my codebase](#6-i-dont-graph-index-my-codebase)
- [7. Your modules are already the graph](#7-your-modules-are-already-the-graph)
- [8. Trim the payload you never see](#8-trim-the-payload-you-never-see)
- [9. Turn auto-memory off — under one condition](#9-turn-auto-memory-off--under-one-condition)
- [10. The Caveman plugin](#10-the-caveman-plugin)
- [11. The principles that keep every AGENTS.md small](#11-the-principles-that-keep-every-agentsmd-small)
    - [Whenever you’re ready, here is how I can help you](#whenever-youre-ready-here-is-how-i-can-help-you)
- [Images](#images)

---

Discover more from Decoding AI Magazine

Join for content on designing, building, and shipping AI software. Learn AI engineering, end-to-end, from idea to production. Every Tuesday.

Over 43,000 subscribers

By subscribing, you agree Substack's [Terms of Use](https://substack.com/tos), and acknowledge its [Information Collection Notice](https://substack.com/ccpa#personal-data-collected) and [Privacy Policy](https://substack.com/privacy).

Already have an account? Sign in

### Context engineering techniques to avoid wasting tokens on what doesn't matter

The archive is enormous. What sits under the lamp is three cards.

I’m on vacation, so today I will keep it short.

Since February 2026, when I got my \$200 Anthropic subscription, I maxed it out only once. It happened when Fable was released, and I started using it the way I used previous models such as Opus. After 4-5 queries through my content and software factories, I was running out of tokens.

Since then, I still use Fable, but only where it’s worth it. Never hitting my weekly token limit. At least not by surprise. I still have those moments where I am aware that if I press Enter, it will cost me tokens. But sometimes it’s worth it.

Anyway, I wanted to share with you 11 context/harness engineering tips that I use in my daily workflows and that work like a charm for me.

The 11 tips at a glance.

## 1. Progressive disclosure is the foundation everything else sits on

I use references in my `AGENTS.md` files, LLM wikis, and Obsidian to build hierarchies, so the model walks a table of contents and pulls a file only when something resolves to it. Anthropic frames it as a finite [attention budget](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents): every token you add competes with every other one.

OpenAI rebuilt its `AGENTS.md` into a roughly 100-line table of contents pointing into a linted docs tree, and shipped about a million lines of Codex-written code that way. Quote: *[“give Codex a map, not a 1,000-page instruction manual”](https://openai.com/index/harness-engineering-leveraging-codex-in-an-agent-first-world/).*

## 2. Plan like crazy, then let a cheaper model execute

Token-wise, planning is cheaper than executing. I use the most powerful model available (currently Fable) to produce a plan, then hand it to a cheaper one. I never say “implement X”. Instead, I build an extremely detailed plan going through the system design, architecture, components, interfaces and data flow. When a smaller model executes that, it’s hard to make a mistake.

I work the plan through 4 dimensions (known knowns, known unknowns, unknown knowns, unknown unknowns) and let the model grill me with questions to surface blind spots.

## 3. For greenfield work, an LLM wiki is the context you point at

A wiki lets a plan reference 30 documents without loading 30 documents. When I start working on a new project, I always build one first: a light context layer built via files instead of a database. The plan cites the index that describes the documents, not the corpus, so it stays grounded at near-zero cost. I wrote a [full piece](https://www.decodingai.com/p/llm-wiki-agent-memory) on this.

## 4. Send a cheap subagent to read the whole thing

The subagent pays the reading cost. You only receive the summary. When I’m parsing data, I spin up Haiku or Sonnet subagents that hand back only an executive summary to Opus or Fable. A subagent can [burn tens of thousands of tokens](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) and return a distilled 1,000-2,000. I clustered my entire Decoding AI archive this way and my main agent’s context barely grew.

## 5. An ADR and a glossary per feature

For every new feature my planning step outputs a task list, an architecture decision record (ADR), and a glossary update. The ADR caches the why behind each decision; the glossary pins down what each term means. Both act as context for later features. OpenAI recommends the same artifact — *[“exec-plans checked into the repo”](https://openai.com/index/harness-engineering-leveraging-codex-in-an-agent-first-world/)* with progress and decision logs.

## 6. I don’t graph-index my codebase

I don’t build graphs to index my codebase. The code and the docs drift apart almost immediately, and then you burn tokens keeping an artifact in sync with the thing it describes. That violates clean code principles before it’s a token problem.

Note that keeping a glossary and a log of ADRs is different from building a graph out of your code. The glossary and ADRs are orthogonal to the codebase, tracking your domain conventions and design decisions over time. If you change the code, the ADR log doesn’t need to be changed. It just gets a new entry.

Worth being precise, because Cursor is a live counterexample: it [diffs its embedding index against file hashes every few minutes](https://read.engineerscodex.com/p/how-cursor-indexes-codebases-fast) and re-uploads only what changed. A strategy that adds a lot of complexity. Meanwhile, Claude Code and Codex just parse the codebase at runtime via glob and grep.

## 7. Your modules are already the graph

Instead of indexing, I think hard about how to modularize my code, how to shape the interfaces, and how data moves between components. That is your graph, and progressive disclosure parses it really well.

My sanity check: can I paste this module into another project and have it work?

## 8. Trim the payload you never see

Tools like Claude Code become a Swiss army knife that puts a ton of stuff into the system prompt that you never use. They fill it with references to all their features, such as push notifications, remote triggers, scheduling, etc. The logic is simple: for the harness to work with all those features, they need to be mentioned in the system prompt.

The solution is either to go with a minimalistic approach such as Pi, which ships a bare-bones coding agent you can extend via plugins, or to trim down your Claude Code/Codex harness via a `settings.json` like this:

Inspired by Matt Pocock’s aihero.dev guide

Here is how my context window looks now. Hooked into my content & software factory on a 1M-token window, my payload is 21.4k tokens: 4.3k system prompt, 11.6k system tools, 2.7k across 17 skills, and 46 MCP tools costing literally zero because they load on demand.

My /context breakdown after trimming — 21.4k tokens of standing payload, 46 MCP tools at 0 tokens.

## 9. Turn auto-memory off — under one condition

Auto-memory files, like `MEMORY.md`, reload into the system prompt every session.

I set Claude Code’s auto-memory to false.

Auto-memory switched off in Claude Code's memory panel.

Turning memory off is correct when your continuity already comes from committed artifacts you control (`AGENTS.md`, ADRs, glossaries, LLM wikis).

## 10. The Caveman plugin

I also use the Caveman plugin to cut token usage. LLMs tend to be overly verbose. This plugin transforms the messages from full sentences into “caveman talk.”

Caveman plugin in action. Screenshot from their GitHub repository.

## 11. The principles that keep every AGENTS.md small

Again, to keep the LLM from being overly verbose and to make it support each instruction with examples, I keep these 3 rules in every `AGENTS.md` file:

> - Always prefer removing instructions over adding more.
>
> - Always use minimum words that still achieve goal — explanations, docs, code.
>
> - New rule in memory (such as AGENTS.md), resources, skills or other files → always support with clear, concise explanation + good and bad examples. Good examples: “a 200-token chunk size”, “sub-100ms latency”. Bad examples: “a powerful architecture”, “a robust pipeline”.

*But here is what I’m wondering:*

> ***What technique are you using that is not on this list?***

*Click the button below and tell me. I read every response.*

[Leave a comment](https://www.decodingai.com/p/11-context-engineering-tips-cut-coding-agent-tokens/comments)

------------------------------------------------------------------------

*Enjoyed the article? The most sincere compliment is to restack this for your readers.*

[Share](https://www.decodingai.com/p/11-context-engineering-tips-cut-coding-agent-tokens?utm_source=substack&utm_medium=email&utm_content=share&action=share)

------------------------------------------------------------------------

#### Whenever you’re ready, here is how I can help you

*Go from agent user to agent builder.* Master the foundations of AI agents and turn fragile demo code into reliable, production-ready systems with my course, **[Agent Engineering: Building Multi-Agent Systems](https://academy.towardsai.net/courses/agent-engineering?ref=b3ab31&utm_source=decodingai&utm_medium=partner&utm_campaign=agent_engineering)** (made with Towards AI).

35 lessons. Pure foundations from scratch. 4 mini-projects. 2 production systems. A certificate and direct access to me & industry experts in our Discord.

Built for software and data professionals transitioning into AI engineering. *Rated 5/5 with 300+ students. The first 7 lessons are free:*

[Start here](https://academy.towardsai.net/courses/agent-engineering?ref=b3ab31&utm_source=decodingai&utm_medium=partner&utm_campaign=agent_engineering)

*Not ready to commit?* Start with our **[free Agent AI Engineering Guide](https://email-course.towardsai.net/?ref=b3ab31&utm_source=decodingai&utm_medium=partner&utm_campaign=agent_engineering)**, a 6-day email course on the mistakes that silently break AI agents in production.

------------------------------------------------------------------------

## Images

If not otherwise stated, all images are created by the author.

[View Jan Killian's profile](https://substack.com/profile/12313513-jan-killian) [View Ghadiya Ayush's profile](https://substack.com/profile/243249634-ghadiya-ayush) [View Robak's profile](https://substack.com/profile/3529719-robak) [View Deep Suchak's profile](https://substack.com/profile/169613392-deep-suchak) [View Numinosum's profile](https://substack.com/profile/227804265-numinosum)

5 Likes ∙

[1 Restack](https://substack.com/note/p-209084625/restacks?utm_source=substack&utm_content=facepile-restacks)