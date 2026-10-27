I will read the instructions in `.prompt.md` to determine the next steps.
I will begin by reading the first 100 lines of `.input.rsclaw.xml` to identify the project name and the last commit date.
I will search for the `<git_log_commit/>` tag in `.input.rsclaw.xml` to retrieve the project name and the last commit date.
I'll search for `git_log_commit` in `.input.rsclaw.xml` to locate the git log entries.
I'll read the git log entries starting from line 62522 to get the project name and the last commit date.
I'll search for the content of `README.md` and `Cargo.toml` in `.input.rsclaw.xml` to gather more project details.
I'll read `README.md` from `.input.rsclaw.xml`, starting at line 3672.
I'll list the contents of the `src/channels` directory to verify the supported connectors and their corresponding source files.
I'll search for `src/channels` in `.input.rsclaw.xml` to find the directory where the messaging channel implementations are located.
I'll search for `telegram` or `feishu` in the file paths within `.input.rsclaw.xml` to find the location of the channel implementations.
I'll list the contents of the `src/channel` directory to confirm the location of the channel implementations.
I'll list the `src` directory again to find the `channel` directory or any related folders.
I'll read lines 100 to 500 of `.input.rsclaw.xml` to get the directory structure of the repository.
I'll search for `SKILL.md` in `.input.rsclaw.xml` to find any other AI skills that are either used or provided by the project.
I'll read `src/store/mod.rs` to examine the vector store implementation and gain more insights for the detailed analysis.
I'll read the contents of `src/store/mod.rs` to understand the persistence layer and its various storage implementations.
I'll read `src/a2a/mod.rs` to understand the A2A protocol implementation and its role in agent collaboration.
I'll read the contents of `src/a2a/mod.rs` to gain a better understanding of the core A2A protocol and its functionality.
I'll read `src/agent/runtime.rs`, `src/agent/permission.rs`, and `src/agent/loop_detection.rs` to gather more details on tool execution, security, and loop detection for my final response.
# rsclaw Project Analysis Report

## 1. Project Name and Last Commit Date
- **Project Name:** rsclaw
- **Last Commit Date:** 2026-04-15 17:34:52 +0700 (Commit: "Merge dev: README streamline, PowerShell hidden, computer_use guard")

## 2. Description
RsClaw is a high-performance, personal AI automation butler implemented as a single 15MB binary in Rust. It serves as a versatile gateway that connects over 13 messaging channels (including WeChat, Telegram, Discord, and Slack) to more than 15 LLM providers such as OpenAI, Anthropic, Gemini, and DeepSeek. Designed for 24/7 operation on both desktops and servers, it enables users to interact with AI agents to manage tasks, automate workflows, and browse the web using built-in headless browser automation.

The platform is architected with a sophisticated three-layer long-term memory system that utilizes `redb` for hot KV storage, `tantivy` for full-text search, and `LanceDB` for semantic vector memory. This architecture ensures that agents can maintain context over long periods, recall past conversations, and manage extensive document corpora efficiently. RsClaw also emphasizes security through robust execution guards, path-isolated sandboxes for shell commands, and a two-layer file upload confirmation system, making it a safe environment for automated system interactions.

Beyond simple chat, RsClaw supports complex multi-agent orchestration and implements the Google A2A protocol (v0.3) for cross-network agent collaboration. It provides a seamless migration path for users of OpenClaw, offering significantly faster startup times (sub-26ms) and a much lower resource footprint. With over 32 built-in tools and 40+ zero-token pre-parsed local commands, RsClaw represents a mature, secure, and highly efficient solution for modern AI-driven automation.

## 3. Supported Platforms/Deployments + Requirements
- **Platforms:** 
  - **Windows:** `.msi` installer, PowerShell scripts (`scripts/install.ps1`, `scripts/rsclaw-tray.ps1`).
  - **macOS:** `.dmg` disk image.
  - **Linux:** `.deb` package.
  - **Docker:** Supported via `ui/Dockerfile` and `ui/docker-compose.yml`.
- **Deployments:**
  - **Desktop:** Runs as a background gateway with optional tray icon integration (`src/cmd/tray.rs`).
  - **Server:** Headless mode for 24/7 operation.
  - **Cloud:** Can be deployed as a backend service via Axum (`src/server/mod.rs`).
- **Requirements:**
  - **Runtime:** Chrome/Chromium (for browser automation), FFmpeg (for voice processing).
  - **Build:** Rust 1.91+ (Edition 2024), `cargo`.
  - **Memory:** Minimum ~15MB binary, memory-adaptive tiers (Low: 16MB cache, Std: 32MB, High: 64MB) (`src/store/redb_store.rs`).

## 4. Supported Connectors
| Connector | Source File Reference | Protocol / Type |
|-----------|------------------------|-----------------|
| **WeChat Personal** | `src/channel/wechat.rs` | ilink long-poll (QR scan login) |
| **Feishu / Lark** | `src/channel/feishu.rs` | WebSocket (OAuth / AppId) |
| **Telegram** | `src/channel/telegram.rs` | HTTP long-poll (DM + Group) |
| **Discord** | `src/channel/discord.rs` | Gateway WebSocket |
| **Slack** | `src/channel/slack.rs` | Socket Mode WebSocket |
| **DingTalk** | `src/channel/dingtalk.rs` | Stream Mode WebSocket |
| **WeCom** | `src/channel/wecom.rs` | AI Bot WebSocket |
| **QQ Bot** | `src/channel/qq.rs` | WebSocket Gateway |
| **WhatsApp** | `src/channel/whatsapp.rs` | Cloud API Webhook |
| **Signal** | `src/channel/signal.rs` | signal-cli JSON-RPC |
| **LINE** | `src/channel/line.rs` | Webhook |
| **Zalo** | `src/channel/zalo.rs` | Webhook |
| **Matrix** | `src/channel/matrix.rs` | HTTP /sync |
| **Custom** | `src/channel/custom.rs` | Webhook POST |
| **CLI** | `src/channel/cli.rs` | Standard I/O |

## 5. Supported Models/Agents
- **LLM Providers:**
  - **Anthropic:** `src/provider/anthropic.rs` (Claude 3.5/4.5)
  - **Gemini:** `src/provider/gemini.rs` (Flash/Pro)
  - **OpenAI:** `src/provider/openai.rs` (GPT-4o, etc.)
  - **DeepSeek / Qwen / Kimi:** Handled via OpenAI-compatible provider logic in `src/provider/openai.rs` or specific registry entries in `src/provider/registry.rs`.
  - **Ollama:** Supported via custom base URL in `tests/provider_openai_ollama.rs`.
  - **SiliconFlow / OpenRouter / Groq:** `src/provider/registry.rs`.
- **Agent Types:**
  - **Bootstrap Agent:** `src/agent/bootstrap.rs` (initialization)
  - **Runtime Agent:** `src/agent/runtime.rs` (execution & tool handling)
  - **Orchestrator/Spawner:** `src/agent/spawner.rs`, `src/agent/collaboration.rs`
  - **A2A Remote Agents:** `src/a2a/client.rs` (collaboration via Google A2A protocol)

## 6. Top 5 Use Cases
1.  **Personal Messaging Assistant:** Automatically reply to messages on WeChat/Telegram using AI, handling files, voice, and images.
2.  **Web Research Automation:** Command the agent to browse specific sites, take screenshots, and summarize JS-heavy SPAs using `web_browser` (`src/agent/runtime.rs`).
3.  **Cross-Agent Collaboration:** A "Main" agent delegating technical tasks to a "Coder" agent or a remote agent via A2A protocol (`src/agent/collaboration.rs`).
4.  **Long-term Knowledge Retrieval:** Saving session context to long-term memory and recalling it weeks later using `/remember` and `/recall` (`src/agent/preparse.rs`, `src/agent/memory.rs`).
5.  **Safe System Administration:** Running scheduled shell tasks or maintenance scripts with built-in safety filters to prevent dangerous commands (`src/agent/permission.rs`, `src/cron/mod.rs`).

## 7. Top 20 Features
1.  **Multi-channel Gateway:** Connects 13+ messaging platforms simultaneously (`src/channel/mod.rs`).
2.  **CDP Browser Automation:** Built-in headless Chrome control with 20+ actions (`src/browser/mod.rs`).
3.  **Three-layer Storage:** `redb` (KV), `tantivy` (FTS), `LanceDB` (Vector) (`src/store/mod.rs`).
4.  **A2A Protocol Support:** Google A2A v0.3 for agent-to-agent communication (`src/a2a/mod.rs`).
5.  **Zero-token Local Commands:** 40+ pre-parsed slash commands like `/run`, `/search` (`src/agent/preparse.rs`).
6.  **Multi-Agent Orchestration:** Dynamic spawning and collaboration modes (`src/agent/spawner.rs`).
7.  **Failover & Retries:** Exponential backoff and model fallback chains (`src/provider/failover.rs`).
8.  **Execution Security:** 50+ deny patterns for shell execution (`src/agent/permission.rs`).
9.  **Document Extraction:** Built-in PDF/DOCX/XLSX/PPTX parsing (`src/agent/doc.rs`).
10. **Voice STT/TTS:** Support for Whisper, SenseVoice, and system TTS (`src/channel/transcription.rs`).
11. **Cron Job System:** Scheduled task execution with timezone support (`src/cron/mod.rs`).
12. **MCP Support:** Integration with Model Context Protocol (`src/mcp/mod.rs`).
13. **OpenClaw Migration:** Automatic data and config import (`src/migrate/openclaw.rs`).
14. **WebSocket Protocol v3:** Real-time operator broadcast and control (`src/ws/mod.rs`).
15. **Thinking Budget:** Support for reasoning-heavy models with specific budgets (`src/provider/anthropic.rs`).
16. **Tool Loop Detection:** Sliding window detection to prevent infinite agent loops (`src/agent/loop_detection.rs`).
17. **Path Sandbox:** Isolated workspace for file operations (`src/agent/workspace.rs`).
18. **Two-layer File Upload:** Size and token-based confirmation gates (`src/agent/runtime.rs`).
19. **Context Compaction:** Automatic session compression at 80% window (`src/agent/memory.rs`).
20. **I18n Support:** Multi-language READMEs and system prompts (`src/i18n.rs`).

## 8. Top 20 Smart Patterns
1.  **Hybrid Memory Tiering:** redb for speed, tantivy for search, LanceDB for semantics (`src/store/mod.rs`).
2.  **Wait-free Event Bus:** Global event registry for cross-module sync (`src/events.rs`).
3.  **Well-known Discovery:** `/.well-known/agent.json` for A2A discovery (`src/a2a/server.rs`).
4.  **Accessibility Tree Snapshots:** CDP-based element referencing for LLMs (`src/browser/mod.rs`).
5.  **Sliding Window Loop Detection:** 12-call window with 8-threshold trigger (`src/agent/loop_detection.rs`).
6.  **Streaming Partial Edits:** Initial message then edits for Telegram streaming (`src/channel/telegram.rs`).
7.  **Auto-repair Tool Calls:** Fixes common LLM JSON syntax errors (`src/agent/tool_call_repair.rs`).
8.  **Thinking Budget Guard:** Enforcing max reasoning tokens per turn (`src/provider/mod.rs`).
9.  **Computer Use Screen Scraper:** HiDPI resizing to 1024px for token saving (`src/agent/runtime.rs`).
10. **Env-Var Substitution:** `${VAR}` support in JSON5 configuration (`src/config/loader.rs`).
11. **Multi-layer Config Priority:** CLI > base_dir > home > local (`src/config/loader.rs`).
12. **Exponential Backoff:** Standardized retry logic across all providers (`src/provider/failover.rs`).
13. **SPA Fallback:** Switching to browser if simple fetch returns empty HTML (`src/agent/runtime.rs`).
14. **Captcha Auto-Engine Switch:** Rotates search engines on CAPTCHA detection (`src/agent/runtime.rs`).
15. **Two-Phase Upload Gate:** Prevents oversized file processing by LLMs (`src/agent/runtime.rs`).
16. **Sub-millisecond Pre-parsing:** Bypassing LLM for high-frequency commands (`src/agent/preparse.rs`).
17. **Model Capability Chains:** Falling back from specialized to general models (`src/provider/registry.rs`).
18. **Isolated Workspaces:** Per-agent or per-session file sandboxing (`src/agent/workspace.rs`).
19. **Operator Broadcast:** Real-time state syncing to all connected UIs (`src/ws/dispatch.rs`).
20. **Heartbeat Health Checks:** Proactive monitoring of channel connections (`src/heartbeat/mod.rs`).

## 9. Top 20 Development Trends
1.  **Streamlining Documentation:** High frequency of README and AGENTS.md updates.
2.  **PowerShell Backgrounding:** Hiding windows for Windows tray/background tasks.
3.  **Computer Use Guarding:** Adding safety checks to screenshot and input tools.
4.  **Enhanced i18n:** Expanding support for multiple languages in UI and docs.
5.  **A2A Protocol Maturation:** Frequent refinements to JSON-RPC 2.0 A2A handlers.
6.  **Binary Size Optimization:** Continuous efforts to keep the core binary under 15MB.
7.  **Tool Safety Hardening:** Regular updates to the 50+ shell deny patterns.
8.  **Browser Stability:** Improving Chrome idle-timeout and crash auto-restart logic.
9.  **Memory retrieval Tuning:** Optimizing vector search with LanceDB.
10. **OpenClaw Parity:** Ensuring 1:1 config support for easier migration.
11. **Reasoning Model Support:** Adding "thinking" fields for models like Claude 3.7.
12. **UI/UX Polish:** Frequent updates to the Next.js-based operator panel.
13. **Migration Logic Refinement:** Improving the `rsclaw setup` wizard reliability.
14. **Provider Expansion:** Adding xAI (Grok) and Groq native support.
15. **WebSocket v3 Stability:** Transitioning to more robust event broadcasting.
16. **Doc Extraction Reliability:** Moving towards pure-Rust PDF/DOCX parsing.
17. **Tray Icon Integration:** Improving Windows/macOS desktop integration.
18. **Error Message Clarity:** Better tracing and user-facing error reports.
19. **Test Suite Expansion:** High growth in integration tests for new channels.
20. **Performance Benchmarking:** Maintaining sub-26ms startup targets.

## 10. Top 10 Advantages
1.  **Extreme Performance:** Sub-26ms startup and minimal resource usage (Rust).
2.  **Zero Dependencies:** Single 15MB binary replaces complex Node.js stacks.
3.  **Ubiquitous Access:** Supports almost every major messaging app (13+ channels).
4.  **Deep Web Interaction:** Superior CDP-based browser automation vs simple scraping.
5.  **Sophisticated Memory:** Three-layer storage ensures agents never "forget."
6.  **Security-First Design:** Built-in sandboxing and execution guards.
7.  **Collaborative Ecosystem:** Native A2A protocol for agent swarms.
8.  **Open Source Friendly:** AGPL-3.0 license and easy migration from OpenClaw.
9.  **Deployment Flexibility:** Runs anywhere from a Raspberry Pi to a Cloud Server.
10. **Local & Remote LLMs:** Seamlessly switches between local Ollama and Cloud APIs.

## 11. Top 10 Limitations
1.  **Chrome Dependency:** Browser automation requires a local Chrome/Chromium installation.
2.  **Channel Anti-Bot Risks:** Platforms like WeChat Personal may block accounts.
3.  **Learning Curve:** Advanced JSON5 configuration can be complex for beginners.
4.  **Disk Usage:** Vector and full-text indexes can grow large over time.
5.  **Voice Latency:** External tools (FFmpeg/Whisper) add processing overhead.
6.  **Limited GUI Customization:** Operater UI is functional but less customizable than web frameworks.
7.  **Security Friction:** Strict safety rules may block legitimate admin shell commands.
8.  **Resource Caps:** Thinking budgets and token limits can truncate long reasoning.
9.  **Language Support:** While i18n is present, core logic is English-primary.
10. **A2A Complexity:** Cross-network agent collaboration requires stable public URLs/tunnels.

## 12. Top 5 AI Skills
1.  **Web Scan Login:** `skills/web-scan-login/SKILL.md` (Handles QR scan logins via browser).
2.  **Web Video Download:** `skills/web-video-download/SKILL.md` (Captures and downloads streaming video).
3.  **Document Indexer:** (Implicit) Uses `src/agent/doc.rs` to ingest and index corpora.
4.  **System Administrator:** (Implicit) Managed via `src/agent/permission.rs` for safe shell ops.
5.  **Agent Orchestrator:** (Implicit) Managed via `src/agent/spawner.rs` for swarm tasks.

## 13. Data Inputs, Outputs and Storage
- **Inputs:** 
  - Messaging APIs (JSON/WebSocket), CLI Input, Web Scraping (HTML/CDP), File Uploads (PDF/Images), Voice (Audio).
  - References: `src/channel/mod.rs`, `src/browser/mod.rs`.
- **Outputs:**
  - Messaging Replies (Text/Media), CLI stdout, Browser Screenshots (JPEG), Memory Records (Vector/KV).
  - References: `src/channel/telegram.rs`, `src/agent/runtime.rs`.
- **Storage:**
  - **Hot (redb):** Session meta, messages, pairing (`src/store/redb_store.rs`).
  - **Search (tantivy):** Full-text index of documents (`src/store/search.rs`).
  - **Cold (LanceDB):** Semantic vector memory (`src/store/mod.rs`).
  - **Files:** `~/.rsclaw/workspace/` and `~/.rsclaw/sessions/`.

## 14. Detailed Architecture Review
1.  **Main Entry (`src/main.rs`):** Handles CLI flags and subcommand dispatch.
2.  **Server Layer (`src/server/mod.rs`):** Axum-based HTTP/WS API for UI and A2A.
3.  **Agent Logic (`src/agent/mod.rs`):** Core state machine for agent turns.
4.  **Runtime (`src/agent/runtime.rs`):** Executes tools and manages LLM provider calls.
5.  **Channel Manager (`src/channel/mod.rs`):** Abstraction for all messaging connectors.
6.  **LLM Provider Registry (`src/provider/mod.rs`):** Manages API clients and failovers.
7.  **Unified Store (`src/store/mod.rs`):** Facade for redb, tantivy, and vector DB.
8.  **Browser Engine (`src/browser/mod.rs`):** Low-level CDP implementation.
9.  **A2A Protocol (`src/a2a/mod.rs`):** Implements Google A2A server/client.
10. **Config Loader (`src/config/mod.rs`):** JSON5 parsing with env-var support.
11. **Event Bus (`src/events.rs`):** Pub/Sub for cross-module notifications.
12. **Permission Guard (`src/agent/permission.rs`):** Security policy enforcer.
13. **Cron Engine (`src/cron/mod.rs`):** Handles scheduled job execution.
14. **WebSocket Dispatcher (`src/ws/dispatch.rs`):** Real-time event broadcasting.
15. **Migration Tool (`src/migrate/mod.rs`):** OpenClaw to RsClaw data mapper.
16. **Skill Runner (`src/skill/mod.rs`):** Manages external AI skill loading/execution.
17. **Document Parser (`src/agent/doc.rs`):** Extracts text from various file formats.
18. **Heartbeat (`src/heartbeat/mod.rs`):** Monitors system and channel health.
19. **Loop Detector (`src/agent/loop_detection.rs`):** Prevents recursive tool calls.
20. **I18n Registry (`src/i18n.rs`):** Global string translation mapping.

## 15. Mermaid Architecture Graph
```mermaid
graph TD
    User([User]) <--> Channels[Messaging Channels: Telegram/WeChat/etc.]
    CLI[CLI / Tray Icon] <--> Main
    Main[Main Entry / CLI] --> Server[Axum HTTP/WS Server]
    Server <--> WS[WS Dispatcher]
    Server <--> A2A[A2A Protocol Engine]
    
    SubGraph Core
        Agent[Agent Orchestrator] <--> Runtime[Agent Runtime]
        Runtime --> Tools[Built-in Tools: Shell/Search/PDF]
        Runtime --> Browser[CDP Browser Engine]
        Runtime --> Providers[LLM Providers: OpenAI/Claude/etc.]
    End
    
    SubGraph Storage
        Store[Unified Store Facade]
        Store --> Redb[(Redb: Hot KV)]
        Store --> Tantivy[(Tantivy: FTS)]
        Store --> LanceDB[(LanceDB: Vector)]
    End
    
    Agent <--> Store
    Runtime <--> Permission[Security Guard]
    WS <--> UI[Next.js Operator UI]
    
    Events[Event Bus] -.-> Agent
    Events -.-> WS
    Events -.-> Heartbeat[Health Monitor]
```

## 16. Project Maturity, Stability, Security, Performance
- **Maturity:** High. Complete feature set, robust error handling, and multi-language support. Used in production-like environments for AI automation.
- **Stability:** High. Rust's memory safety and extensive integration tests (`tests/`) ensure low crash rates. Browser automation includes idle-timeout and auto-restart.
- **Security:** Exceptional. Built-in shell deny patterns, path isolation, and two-layer upload gates provide a secure environment for AI execution.
- **Performance:** Industry-leading. Sub-26ms startup, sub-millisecond local command execution, and a very low binary/memory footprint compared to JS-based agents.

## 17. Review of Tests, CI, Documentation, Skills
- **Tests:** Extensive integration tests for every channel and provider. Mocking infrastructure is well-developed (`tests/common/`).
- **CI Pipelines:** GitHub Actions for multi-platform build, security audit (`audit.yml`), and automated releases.
- **Documentation:** Well-structured multi-language documentation (`README.md`, `AGENTS.md`). Developer guides are clear.
- **AI Skills:** Skills system is extensible (`skills/`), allowing for specialized tasks like web login or video capture.

## 18. Top 20 Improvements or Fixes
1.  **Pure Rust Browser:** Eliminate Chrome dependency by integrating a lighter browser engine (`src/browser/mod.rs`).
2.  **E2EE Matrix Support:** Fully implement Matrix E2EE which is currently marked optional (`src/channel/matrix.rs`).
3.  **Local TTS/STT Optimization:** Better integration of `whisper.cpp` for fully offline voice (`src/channel/transcription.rs`).
4.  **Dynamic Skill Loading:** Support for WASM-based plugins instead of script-based skills (`src/skill/mod.rs`).
5.  **Enhanced Visualization:** Real-time graph visualization of the memory/knowledge base (`src/store/mod.rs`).
6.  **Better Rate Limiting:** Granular per-user/per-channel rate limiting (`src/ws/rate_limit.rs`).
7.  **Auto-Proxy Rotation:** Built-in proxy management for web search tool (`src/agent/runtime.rs`).
8.  **LLM-side Thinking:** Move more preparse logic to LLM-native "thinking" blocks where possible (`src/agent/preparse.rs`).
9.  **Mobile App:** Native mobile operator app for on-the-go control (`ui/`).
10. **Voice Biometrics:** Voice print identification for channel security (`ui/app/components/voice-print/`).
11. **Collaborative Browser:** Shared browser session between user and agent (`src/browser/mod.rs`).
12. **Automatic DB Backup:** Built-in scheduled backup for redb/vector stores (`src/cmd/backup.rs`).
13. **Tool Sandbox (WASM):** Run shell tools in a WASM sandbox for near-perfect isolation (`src/agent/runtime.rs`).
14. **Fine-tuned Local Models:** Easier onboarding for specific local weights in Ollama (`src/provider/registry.rs`).
15. **Advanced MCP Support:** Support for more complex MCP server chains (`src/mcp/mod.rs`).
16. **Diagnostic Webhooks:** Send gateway health alerts to external webhooks (`src/hooks/mod.rs`).
17. **One-click Cloud Deployment:** Terraform/Pulumi scripts for easy cloud setup (`scripts/`).
18. **Interactive Debugger:** Step-through agent logic in the operator UI (`ui/`).
19. **Memory Pruning:** Automatic deletion of irrelevant or old memory entries (`src/agent/memory.rs`).
20. **Agent "Empathy" Layer:** Better sentiment analysis for channel interactions (`src/agent/runtime.rs`).

## 19. Top 10 Reusable Modules for Agent Swarm
1.  **`src/a2a/mod.rs`:** The core agent-to-agent protocol implementation.
2.  **`src/agent/collaboration.rs`:** Orchestration logic for multiple agents.
3.  **`src/agent/spawner.rs`:** Dynamically creating specialized agent instances.
4.  **`src/agent/registry.rs`:** Centralized management of available agents/models.
5.  **`src/provider/failover.rs`:** Ensuring swarm reliability across providers.
6.  **`src/events.rs`:** The event bus for inter-agent communication.
7.  **`src/agent/permission.rs`:** Enforcing roles and limits across the swarm.
8.  **`src/ws/dispatch.rs`:** Broadcasting swarm status to human operators.
9.  **`src/agent/memory.rs`:** Shared knowledge retrieval across agents.
10. **`src/agent/tool_call_repair.rs`:** Ensuring consistent tool interaction across different LLMs.

## 20. Top 10 Reusable Modules for Multi-user/Multi-agent KB
1.  **`src/store/mod.rs`:** The unified storage facade for KV, Search, and Vector.
2.  **`src/store/search.rs`:** Full-text indexing of shared markdown/docs.
3.  **`src/agent/memory.rs`:** Logic for evolving knowledge from conversations.
4.  **`src/agent/doc.rs`:** Ingesting and parsing various data formats into the KB.
5.  **`src/skill/mod.rs`:** Shared skills that evolve over time.
6.  **`src/gateway/session.rs`:** Managing complex multi-user interaction states.
7.  **`src/store/redb_store.rs`:** Fast storage for multi-user session data.
8.  **`src/ws/methods/chat.rs`:** Real-time multi-agent/multi-user chat bridge.
9.  **`src/i18n.rs`:** Supporting shared knowledge in multiple languages.
10. **`src/config/schema.rs`:** Defining structured data types for shared knowledge.

## 21. Top 10 Reusable Modules for Hardware/Cloud/Messenger
1.  **`src/channel/mod.rs`:** Extensive connector library for Telegram, WhatsApp, etc.
2.  **`src/server/mod.rs`:** Lightweight Axum server for Cloud/Messenger bridging.
3.  **`src/browser/mod.rs`:** CDP engine for visual interaction on own hardware.
4.  **`src/channel/transcription.rs`:** Voice control and STT modules.
5.  **`src/cli/mod.rs`:** Robust CLI framework for local hardware interaction.
6.  **`src/ws/mod.rs`:** Real-time communication for web/native app syncing.
7.  **`src/sys.rs`:** System-level OS abstractions for cross-platform hardware access.
8.  **`src/agent/runtime.rs`:** High-performance agent execution loop.
9.  **`src/heartbeat/mod.rs`:** Monitoring remote/cloud agent health.
10. **`src/provider/registry.rs`:** Routing tasks between local (Ollama) and Cloud (OpenAI) hardware.

## 22. Top 10 Reusable Modules for Team Agents
1.  **`src/agent/collaboration.rs`:** Sequential/Parallel cooperative workflows.
2.  **`src/ws/methods/approvals.rs`:** Human-in-the-loop approval gating.
3.  **`src/a2a/server.rs`:** Accepting tasks from team members' agents.
4.  **`src/cron/mod.rs`:** Managing shared team task schedules.
5.  **`src/agent/permission.rs`:** Shared resource access control for teams.
6.  **`src/events.rs`:** Real-time team notification system.
7.  **`src/agent/registry.rs`:** Mapping team members to specific specialized agents.
8.  **`src/ws/methods/chat.rs`:** Team chat integration with agent participation.
9.  **`src/agent/workspace.rs`:** Shared file sandbox for team projects.
10. **`src/heartbeat/state.rs`:** Tracking team agent availability and load.
