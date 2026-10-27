I will read the instructions in `..\.prompt.md` to understand the task.
I will read `.input.sage.xml` to see if it contains any clues or instructions.
I will try to list the parent directory to see if I can access `.prompt.md`.
I will use `glob` to see if `.prompt.md` exists in the current directory.
I will use `grep_search` to see if `.prompt.md` is mentioned in `.input.sage.xml`.
I will read `agentmemory.gemini.md` to understand the standard 21-point structure.
I will read the `README.md` file from `.input.sage.xml` to get the project description and basic information.
I will read `README.md` from `.input.sage.xml`.
I will read `sagents/agent/agent_base.py` and `sagents/agent/fibre/agent_definition.py` to understand the agent patterns.
I will search for `<file path="sagents/agent/agent_base.py">` in `.input.sage.xml`.
I will read `sagents/agent/agent_base.py` from `.input.sage.xml`.
I will read `sagents/agent/fibre/agent_definition.py` to understand the Fibre agent pattern.
I will list the current directory to see which files are actually available on disk.
I will search for `<file path="sagents/agent/fibre/agent_definition.py">` in `.input.sage.xml`.
I will search for `<file path="sagents/agent/fibre/fibre_agent.py">` in `.input.sage.xml`.
I will read the git logs from the end of `.input.sage.xml`.
I have completed the technical analysis of the Sage Agent Platform. The following report details its architecture, features, and AI integration based on the codebase provided in `.input.sage.xml`.

# Sage Agent Platform Technical Analysis

## 1. Project Name and Description
**Project Name:** Sage Agent Platform
**Description:** A production-ready agent platform designed for complex task execution, automation, browser workflows, and omnichannel IM delivery. It features a multi-agent orchestration kernel (SAgents) that handles planning, execution, self-check, and memory recall. Sage provides a visual workbench for inspecting diverse data formats and offers multiple entry points, including desktop, web, CLI, and Chrome extension, making it suitable for both individual power users and enterprise deployments.

## 2. Supported Platforms, Deployments & Requirements
- **Platforms:** Windows, macOS (Intel & Apple Silicon), Linux (Ubuntu/Debian), and Web.
- **Deployments:**
    - **Desktop:** Native installers (`.dmg`, `.exe`, `.msi`, `.deb`).
    - **Web:** FastAPI backend with a Vue3/Vite frontend.
    - **CLI:** Python-based command-line interface.
    - **Extension:** Chrome extension for browser integration.
    - **Docker:** Support for containerized deployment via `docker-compose`.
- **Requirements:**
    - **Python:** 3.10+
    - **Node.js:** 18+ (for frontend and desktop builds).
    - **Database:** SQLite (minimal) or MySQL (full).
    - **Search:** Elasticsearch (for advanced search features).
    - **Storage:** RustFS or local file system.

## 3. Supported Connectors
- **IM Channels:** WeChat Personal (via iLink), WeChat Work (WeCom), Feishu (Lark), and DingTalk.
- **MCP (Model Context Protocol):** Full support for integrating external MCP servers and tools.
- **Browser Automation:** Direct interaction via a Chrome extension and browser bridge.
- **Unified Search:** Integration with multiple search providers (Brave, SerpApi, Tavily, etc.).
- **Unified Image Generation:** Support for Minimax, Qwen, and others.
- **Enterprise Auth:** OAuth2, OIDC, and email-based verification.

## 4. Supported Models & Agents
- **Models:** DeepSeek (default), OpenAI, Anthropic (Claude), and any OpenAI-compatible API.
- **Agents (SAgents Kernel):**
    - **PlanAgent:** Strategic task decomposition and planning.
    - **SimpleAgent:** Basic reactive agent for straightforward tasks.
    - **FibreAgent:** Orchestrator for dynamic multi-agent parallel execution.
    - **SelfCheckAgent:** Automated verification of task completion and quality.
    - **MemoryRecallAgent:** Context injection from long-term memory.
    - **TaskExecutorAgent:** Specialized agent for individual task step execution.
    - **ToolSuggestionAgent:** Identifies the best tools for a given prompt.

## 5. Top 5 Use Cases & Workflows
1. **End-to-End Task Planning & Execution:** Breaking down a vague user request into a concrete plan, executing it using various tools, and performing a final self-check before delivery.
2. **Automated Web Data Collection:** Using the browser bridge and Chrome extension to navigate websites, extract data, and format it for analysis.
3. **Omnichannel Report Delivery:** Generating an analysis or report and automatically sending it to a designated IM channel (e.g., Feishu or WeChat).
4. **Scheduled Operational Tasks:** Setting up recurring jobs for monitoring, reporting, or data synchronization.
5. **Collaborative Knowledge Management:** Building a shared repository of agent "skills" and "lessons" that can be reused across different sessions and team members.

## 6. Top 20 Features
1. **Visual Workbench:** Inspection of Mermaid diagrams, Draw.io charts, ECharts, code, and more.
2. **Multi-Agent Orchestration:** Seamless handoff between planning, execution, and check agents.
3. **Omnichannel Messaging:** Native support for the top 4 enterprise IM platforms.
4. **Desktop UI:** A polished, cross-platform app for Windows, macOS, and Linux.
5. **Interactive CLI:** Terminal-based agent interaction with JSON-stat output.
6. **Chrome Extension Bridge:** Bringing agent intelligence directly into the browser.
7. **Sandboxed Execution:** Multiple isolation levels (Local, Passthrough, Remote) for safe tool use.
8. **Memory Recall System:** Semantic and keyword-based retrieval of past session context.
9. **Questionnaire Workflows:** Structured data gathering to guide agent behavior.
10. **Unified Tool Manager:** Centralized registry for built-in tools, Skills, and MCP servers.
11. **Scheduled Tasks:** Robust cron-like scheduler for autonomous agent runs.
12. **Self-Correction Loops:** Agents can reflect on errors and retry with adjusted strategies.
13. **Reasoning Content Visibility:** Users can see the agent's internal "thought process" in real-time.
14. **Workspace Management:** Integrated file tree with remote file previewing.
15. **Multimodal Support:** Handling and compressing images for vision-capable models.
16. **Enterprise Auth:** Secure login via OAuth2 and verified email.
17. **Observability:** Full tracing and logging via OpenTelemetry and Jaeger.
18. **I18n Support:** Comprehensive English and Chinese localization.
19. **Skill Sync:** Sharing and syncing reusable agent behaviors across environments.
20. **Prompt Caching:** Native support for Anthropic-style prompt caching to reduce costs.

## 7. Top 20 Smart Patterns
1. **AgentBase Abstraction:** Unified interface for LLM calls, multimodal handling, and retries.
2. **Fibre Parallel Execution:** Orchestrating multiple agents in parallel for complex sub-tasks.
3. **Context Budgeting:** Dynamically managing token usage to fit within model limits.
4. **Shared Common Core:** `common/` package for consistent logic across all app surfaces.
5. **Strategy-Based Providers:** Pluggable backends for search, image gen, and sandboxing.
6. **Worker-Function-Trigger Design:** Event-driven design for task handling and service modularity.
7. **Keyed Mutex Locking:** Preventing race conditions in shared state updates.
8. **Structured XML Prompting:** Enforcing reliable LLM parsing through XML-tagged blocks.
9. **Image Compression Middleware:** Automatically resizing images to 512px before LLM submission.
10. **Session Runtime Lifecycle:** Standardized `init` -> `run` -> `shutdown` flow for sessions.
11. **Tool Proxying:** Wrapping external tools in a proxy for security and observability.
12. **User Memory Extraction:** Automatically extracting entities and facts from chat history.
13. **Recursive Task Decomposition:** Breaking large tasks into smaller, manageable sub-goals.
14. **Prompt Instruction Optimization:** Refined system prompts that guide agent role-play.
15. **Sidecar Packaging:** Bundling Node and Python runtimes for a "no-install" user experience.
16. **Environment-First Configuration:** Zero-code setup through a comprehensive `.env` system.
17. **Jaccard-Based De-duplication:** Filtering redundant memory observations.
18. **Heartbeat-Safe Event Loops:** Explicit `await sleep(0)` to prevent event loop starvation.
19. **Resilient LLM Call Wrappers:** Intelligent retries and fallback-chain support.
20. **Choice-Delta Mapping:** Consistent handling of streaming chunks across different LLM providers.

## 8. Top 20 Development Trends (Latest Commits)
1. **Structured Output Support:** Enhancing agents' ability to return clean, schema-valid JSON.
2. **Fibre Orchestrator Refinement:** Improving the dynamic multi-agent coordination logic.
3. **Sandbox Hardening:** Fixes for session management and isolation in local/remote runtimes.
4. **Unified Session Handling:** Migrating to `get_live_session` for consistent state access.
5. **I18n Expansion:** Significant updates to English and Chinese localization across all UIs.
6. **Task Scheduler Improvements:** Better integration of scheduled jobs with the agent kernel.
7. **IM Delivery Flow Optimization:** Enhancing file and message reliability for WeChat/Feishu.
8. **Workbench Renderer Expansion:** New renderers for code execution, search, and skills.
9. **Loop Detection:** Adding cross-call pattern detection to prevent infinite agent loops.
10. **Skill Synchronization:** Implementing logic to sync agent skills across different workspaces.
11. **Dark Mode Polishing:** UI/UX refinements for the desktop and web themes.
12. **CLI Error Diagnostics:** Adding `sage doctor` and better error reporting for the CLI.
13. **Prompt Caching Support:** Enabling Anthropic-compatible cache control headers.
14. **Multimodal Refactoring:** Consolidating image processing in the `AgentBase` layer.
15. **Auth Security:** Adding email verification and strengthening OAuth2 flows.
16. **Browser Bridge Connectivity:** Improving the connection between the agent and Chrome extension.
17. **Session Interruptibility:** Better handling of user-initiated task cancellations.
18. **RustFS/Local FS Unification:** Streamlining how the workbench interacts with files.
19. **Observability via Jaeger:** Integration of OTLP tracing for complex agent workflows.
20. **Minimal Setup Mode:** Optimizing the `dev-up.sh` script for zero-dependency starts.

## 9. Top 10 Advantages
1. **Multi-Entry Versatility:** Use the same powerful agents via Desktop, Web, CLI, or Browser.
2. **Production-Ready Kernel:** SAgents provides a robust foundation for multi-step tasks.
3. **Superior Visibility:** The Visual Workbench makes "black box" agent work transparent.
4. **Omnichannel Native:** No need for third-party bridges to reach your team on Feishu/WeChat.
5. **Enterprise-Grade Security:** Sandboxed execution and robust auth protect your data.
6. **High Performance:** Parallel orchestration via Fibre minimizes execution latency.
7. **Developer Friendly:** Extensible "Skills" system and full MCP support.
8. **Cost Efficiency:** Smart context budgeting and prompt caching significantly lower API costs.
9. **Seamless Installation:** `dev-up.sh` and one-click desktop installers lower the barrier to entry.
10. **Rich Ecosystem:** Built-in tools for search, coding, image gen, and browser automation.

## 10. Top 10 Limitations
1. **Resource Intensity:** Full mode requires MySQL, ES, and RustFS, which can be heavy.
2. **Complex Config:** The vast number of environment variables can be daunting for new users.
3. **Model Dependence:** Highly optimized for DeepSeek/OpenAI/Claude; other models may struggle.
4. **Python/Node Hybrid:** Requires both runtimes, which can complicate some deployments.
5. **Sandbox Overhead:** High-security isolation modes add latency to tool execution.
6. **Browser Extension Friction:** Requires manual installation and permission management.
7. **Learning Curve:** Understanding the interaction between different agents (Plan/Fibre/etc.) takes time.
8. **IM API Limits:** Subject to the throttling and policies of WeChat/Feishu/DingTalk.
9. **Context Window Limits:** Despite budgeting, extremely long tasks still hit LLM boundaries.
10. **Local Embedding RAM:** Running local embedding models adds ~300MB to the memory footprint.

## 11. Top AI Skills
- **Provided AI Skills:**
  1. **Multi-Agent Task Planning:** Decomposing complex goals into actionable sub-tasks.
  2. **Autonomous Tool Selection:** Identifying the right tool for the job across disparate systems.
  3. **Visual Data Synthesis:** Turning raw tool output into diagrams, charts, and previews.
  4. **Dynamic Context Injection:** Recalling relevant session history for better continuity.
  5. **Automated Self-Correction:** Critically evaluating its own output and fixing errors.
- **Used AI Skills:**
  1. **Reasoning & Planning:** Logic-heavy decision making for task paths.
  2. **Code Understanding & Writing:** Generating and debugging scripts in various languages.
  3. **Multimodal Perception:** Analyzing and describing image content for vision tasks.
  4. **Semantic Extraction:** Identifying key entities and relationships from unstructured text.
  5. **Contextual Compression:** Summarizing long histories into dense, useful observations.

## 12. Data Inputs, Outputs & Storage
- **Inputs:** User prompts (Web/Desktop/CLI), IM messages (WeChat/Feishu), Browser events, Cron triggers, Questionnaires.
- **Outputs:** Streaming chat responses, Delivered IM messages, Executed code results, Visual workbench artifacts (Mermaid/SVG), Exported Markdown/JSON.
- **Storage:**
  - **Relational:** MySQL or SQLite for session, user, and agent metadata.
  - **Search:** Elasticsearch for full-text and vector-based memory indexing.
  - **Object/File:** RustFS or local disk for workbench files and artifacts.

## 13. Detailed Architecture Review
Sage is built on a distributed, shared-service architecture. At its heart is the **SAgents Kernel**, a Python-based framework that defines the agent lifecycle and coordination logic. This kernel is consumed by the **App Service Layer**, which exposes functionality via a FastAPI server. This server supports multiple frontends: a **Vue3 Web App** and a **Tauri-based Desktop App**. Both share the same UI components and business logic where possible. The system also includes specialized **MCP Servers** and a **Browser Bridge** for external tool integration. Infrastructure services like **Sandbox Runtimes** and **Object Storage (RustFS)** ensure safe and scalable execution.

## 14. Architecture Diagram
```mermaid
graph TD
    User[User] --> Desktop[💻 Desktop App]
    User --> Web[🌐 Web App]
    User --> CLI[⌨️ CLI]
    User --> Ext[🧩 Chrome Extension]
    User --> IM[💬 IM Channels]

    subgraph "Product Layer (FastAPI / Vue3)"
        Desktop --> AppLayer[App Service Layer]
        Web --> AppLayer
        AppLayer --> Chat[Sessions & Chat]
        AppLayer --> Workbench[Visual Workbench]
        AppLayer --> Tasks[Automation & Cron]
    end

    subgraph "SAgents Kernel (Python)"
        AppLayer --> Runtime[Session Runtime]
        Runtime --> Flows[AgentFlows]
        Flows --> Agents[Agents: Plan / Fibre / Simple]
        Agents --> Memory[Memory Recall]
        Agents --> ToolMgr[Tool Manager]
    end

    subgraph "Execution & Integration"
        ToolMgr --> MCP[MCP Servers]
        ToolMgr --> Browser[Browser Bridge]
        ToolMgr --> Sandbox[Sandbox: Local / Remote]
        ToolMgr --> IMProviders[IM: WeChat / Feishu / DingTalk]
    end

    subgraph "Infrastructure"
        AppLayer <--> DB[(SQL: MySQL / SQLite)]
        Memory <--> ES[(Elasticsearch)]
        Workbench <--> FS[(Storage: RustFS / Local)]
        Runtime -.-> OTel[Observability: OpenTelemetry]
    end
```

## 15. Project Review: Maturity, Security & Performance
- **Maturity:** **Enterprise-Ready.** Version 1.1.0 shows a stable, feature-rich platform with extensive documentation and CI coverage.
- **Security:** **Robust.** Native sandbox isolation, OAuth2 auth, and secret-redacted logs demonstrate high security awareness.
- **Performance:** **Optimized.** Parallel multi-agent execution via Fibre and efficient context budgeting ensure high responsiveness.

## 16. Review: Infrastructure & AI readiness
- **Testing:** Strong CI suite with Pytest for the backend and Vitest for the frontend.
- **CI/CD:** Automated workflows for builds, releases (desktop and server), and documentation deployment.
- **AI Readiness:** Native support for MCP, structured outputs, and prompt caching makes it a top-tier platform for LLM applications.

## 17. Top 20 Possible Improvements
1. **Multi-Tenant Support:** Granular project-level isolation for different teams.
2. **Mobile Native App:** Dedicated iOS/Android clients for on-the-go agent management.
3. **Voice Interface:** Native STT/TTS support for verbal agent interaction.
4. **Autonomous Skill Discovery:** Agents automatically identifying and proposing new skills.
5. **Real-time Collaboration:** Multiple users interacting with the same agent session.
6. **Edge Deployment:** Running the SAgents kernel on low-power devices.
7. **Native VSCode Extension:** Deeper integration into developer IDEs.
8. **Automated Unit Test Generation:** Agents creating tests for the code they write.
9. **Advanced Vector Store Support:** Integration with Milvus or Pinecone for massive scaling.
10. **Human-in-the-Loop Approval Steps:** Configurable manual checkpoints for high-stakes tasks.
11. **Predictive Resource Allocation:** Dynamically choosing LLMs based on task complexity.
12. **Custom Workbench Renderers:** A plugin system for adding new visual previewers.
13. **Git-Centric Memory:** Branch-aware recall for better development continuity.
14. **Autonomous Document Ingestion:** Agents proactively reading and indexing new project docs.
15. **Cross-Platform State Sync:** Seamlessly switching between CLI, Desktop, and Web.
16. **Fine-Tuning Integration:** Automated data collection for training project-specific models.
17. **Deeper Observability UI:** Visualizing OTel traces directly within the workbench.
18. **Multi-Agent Conflict Resolution:** Better handling of conflicting tool results in parallel runs.
19. **Context Recovery from Failure:** Resuming long-running tasks from the exact point of error.
20. **Interactive Agent Training:** Users "teaching" agents through corrective feedback loops.

## 18. Reuse for Agent Swarm (Specification & Implementation)
Sage's **SAgents Kernel** and **Fibre Orchestrator** are perfectly suited for swarms. The `FibreAgent` already demonstrates parallel multi-agent management. By extending the `Orchestrator` to support decentralized peer-to-peer communication between agent instances, Sage can power large swarms that collaborate on massive distributed tasks. The `common/` models for messages and tasks provide the necessary shared language for such a swarm.

## 19. Reuse for Multi-User/Multi-Agent Shared Knowledge
The **Memory Recall** system and **Skill Sync** features provide the foundation for shared knowledge. By deploying Sage with a central Elasticsearch and MySQL backend, a whole organization's agents can learn from each other. A "lesson" learned by one agent in a developer's CLI can be instantly recalled by another agent assisting a manager in the Web UI.

## 20. Reuse for Own Hardware / Cloud / Multi-Channel Messaging
Sage is designed for flexibility. Its **Minimal Mode** (SQLite + Local FS) is ideal for personal hardware, while **Full Mode** (MySQL + ES + RustFS) scales to the cloud. The abstracted **IM Providers** allow Sage to be the intelligent brain behind any messaging channel, from private Slack bots to public-facing WeChat assistants.

## 21. Reuse for Cooperative Team Agents
The **Visual Workbench** and **Questionnaire Workflows** are specifically designed for human-agent cooperation. Team members can use questionnaires to "brief" agents, and then use the workbench to audit their work. The native **IM integrations** keep the entire team in the loop, turning agents into first-class citizens in a company's existing communication flow.

---
*Generated by Gemini CLI following .prompt.md instructions.*
