# FrankClaw Repository Analysis

## 1. Project Name and Description

**FrankClaw** is a security-hardened personal AI assistant gateway written in Rust. It serves as a ground-up rewrite of the [OpenClaw](https://github.com/openclaw/openclaw) project, aiming to achieve functional parity while providing significantly stronger security guarantees. The project acts as a central hub that connects various messaging channels (like Telegram, Discord, and Slack) to multiple AI model providers (such as OpenAI, Anthropic, and local Ollama instances) through a local WebSocket control plane.

The core architecture is built around a defense-in-depth philosophy, leveraging Rust's memory safety, encryption at rest for session transcripts (via ChaCha20-Poly1305), and strict input validation. It features a sophisticated agent runtime that supports context compaction, subagent orchestration, and a robust command system. FrankClaw also includes an integrated tool registry with capabilities for browser automation using the Chrome DevTools Protocol, shell execution within an optional `ai-jail` sandbox, and a local visual workspace known as "Canvas."

Designed for local-first deployment, FrankClaw offers an extensive CLI for operators, including a full-screen TUI, an interactive REPL, and diagnostic tools like `frankclaw doctor` and `frankclaw audit`. It supports a wide array of advanced features adopted from the IronClaw project, such as per-provider circuit breakers, LLM response caching, cost tracking with budget guards, and credential leak detection. The project is licensed under the GNU Affero General Public License (AGPL-3.0-or-later).

## 2. Supported Platforms and Technologies

- **Programming Language:** Rust 1.93+ (2024 edition).
- **Messaging Channels:** Web, Telegram (Bot API), Discord (Gateway + REST), Slack (Events + Web API), Signal (`signal-cli` bridge), WhatsApp (Cloud API), and Email (IMAP/SMTP).
- **AI Model Providers:** OpenAI, Anthropic, Ollama (local), GitHub Copilot, Google Gemini, OpenRouter, Groq, Together, and DeepSeek.
- **Protocols:** WebSocket (control plane), JSON-RPC 2.0, Model Context Protocol (MCP), and ACP (Agent Client Protocol).
- **Storage:** SQLite (bundled via `rusqlite`) for sessions, memory (FTS5 + vectors), and cron jobs.
- **Security Technologies:** ChaCha20-Poly1305 (AEAD encryption), Argon2id (password hashing), HMAC-SHA256 (KDF), and `ai-jail` (bubblewrap + landlock for sandboxing).
- **Deployment:** Docker / Docker Compose, Systemd, and local binary execution.
- **Frontend/UI:** 8-tab Web Console, Ratatui (TUI), and Rustyline (REPL).

## 3. Top 5 Key Architectural Design Patterns

### 1. Unified Plugin System (Trait-based Dispatch)
FrankClaw uses a robust trait-based system for abstraction across channels, model providers, and tools. This allows the core runtime to treat various I/O and intelligence sources uniformly while maintaining strict type safety.
- **Files:** `crates/frankclaw-core/src/channel.rs`, `crates/frankclaw-core/src/model.rs`, `crates/frankclaw-tools/src/lib.rs` (the `Tool` trait).

### 2. Lock-Free Configuration Hot-Reloading
The gateway employs an `ArcSwap` pattern to allow configuration updates at runtime without interrupting in-flight requests or suffering from `RwLock` contention.
- **Files:** `crates/frankclaw-gateway/src/config_reload.rs`, `crates/frankclaw-gateway/src/state.rs`.

### 3. Hierarchical Subagent Orchestration
A parent agent can spawn child agents for complex, multi-step tasks. This system handles lifecycle tracking, depth limits, and push-based result delivery, allowing for collaborative agent workflows.
- **Files:** `crates/frankclaw-runtime/src/subagent.rs`.

### 4. Sliding Window Context Compaction
To manage LLM context window limits, the runtime implements a context engine that estimates tokens and prunes history (preserving system prompts and recent turns) while repairing tool result pairings.
- **Files:** `crates/frankclaw-runtime/src/context.rs`.

### 5. Multi-Provider Failover with Circuit Breaker
LLM requests are routed through a failover chain that monitors provider health (Closed/Open/Half-Open states) and implements exponential backoff with jitter to ensure resilience.
- **Files:** `crates/frankclaw-models/src/failover.rs`, `crates/frankclaw-models/src/circuit_breaker.rs`, `crates/frankclaw-models/src/retry.rs`.

## 4. Reusable Team Agent Components

- **Subagent Registry (`SubagentRegistry`):** A standalone system for managing the lifecycle, concurrency, and hierarchical limits of child agents.
  - **Reference:** `crates/frankclaw-runtime/src/subagent.rs`
- **Tool Registry (`ToolRegistry`):** A flexible dispatch layer for LLM tools with built-in risk level assessment (ReadOnly/Mutating/Destructive) and approval gating.
  - **Reference:** `crates/frankclaw-tools/src/lib.rs`
- **Context Engine (`ContextEngine`):** A reusable logic block for managing conversational state, token estimation, and transcript pruning for long-running agents.
  - **Reference:** `crates/frankclaw-runtime/src/context.rs`
- **MCP Client (`McpClient`):** A client implementation for the Model Context Protocol that can be used to dynamically pull tools from external stdio or HTTP servers.
  - **Reference:** `crates/frankclaw-tools/src/mcp/mod.rs`
- **Canvas Service (`CanvasService`):** A structured visual workspace model that supports incremental updates (patches) and revision conflict detection, ideal for human-agent collaboration on documents or code.
  - **Reference:** `crates/frankclaw-core/src/canvas.rs` (and implementation in `frankclaw-gateway`)
