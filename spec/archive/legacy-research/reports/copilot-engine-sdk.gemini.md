I will read `.prompt.md` to understand the instructions.
I'll start by checking the content of `copilot-engine-sdk.xml` to understand the project structure and gather information for the analysis.
I will read the remaining part of `copilot-engine-sdk.xml` to gather more details.
# Copilot Engine SDK Analysis

## 1. Project Name and Description
**Project Name:** GitHub Copilot Engine SDK (`@github/copilot-engine-sdk`)

The Copilot Engine SDK is a comprehensive toolkit designed for developers building "engines"—autonomous agents that execute coding tasks within the GitHub Copilot ecosystem. It serves as the bridge between the GitHub Copilot platform, which manages job lifecycles and user interactions, and the specialized logic of an agentic engine. The SDK abstracts the complexities of platform communication, git operations, and tool execution, allowing developers to focus on building effective AI-driven workflows.

Technically, the project consists of a TypeScript/Node.js SDK and a Go-based CLI tool. The SDK provides high-level clients for fetching job details (such as problem statements and repository metadata) and streaming semantic progress events back to the platform in real-time. This ensures that users can observe the agent's reasoning, tool calls, and progress directly within the GitHub UI, creating a transparent and interactive developer experience.

Beyond communication, the SDK includes robust git utilities for secure repository management and a built-in Model Context Protocol (MCP) server. This server exposes critical tools like `report_progress` and `reply_to_comment`, enabling agents to commit changes, push to remote branches, and update Pull Request descriptions programmatically. The inclusion of a local testing harness (`engine-cli`) further streamlines development by simulating the platform environment, allowing for rapid iteration without cloud deployment.

## 2. Supported Platforms/Deployments + Requirements
- **Platforms:**
  - **GitHub Copilot Agent Platform:** The primary deployment target where engines run in secure, isolated runner environments.
  - **Local Development:** Supported on Windows, macOS, and Linux via the `engine-cli`.
- **Deployments:**
  - **GitHub Releases:** Engines are packaged as self-contained tarballs (including `engine.yaml` and build artifacts) and published via GitHub Releases for consumption by the platform.
- **Requirements:**
  - **Node.js:** version 20+ (for the TypeScript SDK and running Node-based engines).
  - **Go:** version 1.24+ (for building/running the `engine-cli`).
  - **Git:** Must be available on the system PATH.
  - **NPM:** For dependency management.
  - **Environment Variables:** Requires `GITHUB_JOB_ID`, `GITHUB_PLATFORM_API_TOKEN`, `GITHUB_PLATFORM_API_URL`, and `GITHUB_GIT_TOKEN` at runtime.

## 3. Supported Connectors
- **GitHub Platform API:** For fetching job metadata and reporting progress.
  - `src/client.ts` (`PlatformClient` class)
  - `cli/internal/server/server.go` (Mock platform server)
- **Git/GitHub Repositories:** Secure cloning, committing, and pushing using `GITHUB_GIT_TOKEN`.
  - `src/git.ts`
  - `cli/cmd/engine-cli/repo.go`
- **Model Context Protocol (MCP):** Connects engines to both internal tools and user-provided external tools.
  - `src/mcp-server.ts` (Built-in tools)
  - `src/mcp-proxy.ts` (Discovery of external user-provided tools)
- **LLM Inference API:** Generic connector for AI models via `GITHUB_INFERENCE_TOKEN`.
  - `docs/integration-guide.md` (Referenced as `GITHUB_INFERENCE_URL`)

## 4. Supported Models/Agents
- **Models:**
  - **Generic LLM Support:** The SDK is model-agnostic and works with any model that can be accessed via an HTTP API or the Copilot SDK.
  - **Anthropic Claude:** Explicitly mentioned as a fallback/default in documentation (e.g., `claude-sonnet-4.5`).
  - **OpenAI Models:** Supported via the platform's model selection features.
- **Model Selection:** Supports dynamic model selection based on platform configuration.
  - `src/client.ts` (`resolveSelectedModel` function)
  - `cli/cmd/engine-cli/main.go` (Flags for model selection testing)
- **Source Code References:**
  - `src/client.ts` (Lines 310-385: Model resolution logic)
  - `cli/internal/runner/runner.go` (Lines 21-34: Model metadata passed to engine environment)

## 5. Top 5 Use Cases
1.  **Issue Resolution (`fix`):** An engine is triggered when an issue is assigned to Copilot. It analyzes the problem statement, clones the repo, implements a fix, and pushes a new branch.
2.  **Addressing PR Feedback (`fix-pr-comment`):** Triggered by a comment or review. The agent modifies existing code on the current branch to resolve reviewer concerns.
3.  **Generic Coding Tasks (`task`):** Executing arbitrary tasks like refactoring, adding documentation, or running migrations that may or may not result in a PR.
4.  **Local Engine Benchmarking:** Using `engine-cli` to run an engine against various repositories and problem statements to measure performance and accuracy locally.
5.  **Multi-Model Experimentation:** Testing how an engine behaves with different model vendors (Anthropic vs OpenAI) using the SDK's model selection features.

## 6. Top 20 Features
1.  **PlatformClient:** High-level API for platform interaction. (`src/client.ts`)
2.  **Job Details Fetching:** Retrieving task metadata. (`src/client.ts`: `fetchJobDetails`)
3.  **Semantic Event Reporting:** Sending `assistant_message`, `tool_execution`, etc. (`src/client.ts`)
4.  **Secure Git Cloning:** Token-based cloning without leaking credentials. (`src/git.ts`: `cloneRepo`)
5.  **Automated Branch Management:** Creating or checking out task-specific branches. (`src/git.ts`)
6.  **MCP Tool Integration:** Built-in support for the Model Context Protocol. (`src/mcp-server.ts`)
7.  **Progress Reporting Tool:** `report_progress` tool for agents to update users. (`src/mcp-server.ts`)
8.  **Comment Reply Tool:** `reply_to_comment` for direct PR interaction. (`src/mcp-server.ts`)
9.  **MCP Proxy Discovery:** Dynamic discovery of user-provided tools. (`src/mcp-proxy.ts`)
10. **Session Persistence:** Saving/restoring state via the progress API. (`src/client.ts`: `sendRawProgress`/`fetchProgress`)
11. **Event Factories:** Simplified creation of typed events. (`src/events.ts`)
12. **Local Mock Server:** Simulating the platform API locally. (`cli/internal/server/server.go`)
13. **Engine Runner:** CLI component that manages engine process lifecycles. (`cli/internal/runner/runner.go`)
14. **Model Selection Resolution:** Logic to choose the best available model. (`src/client.ts`)
15. **PR Summary Generation:** Finalizing PR titles/descriptions. (`docs/integration-guide.md`: Step 8)
16. **Context Truncation Events:** Reporting when history is trimmed. (`src/events.ts`: `createTruncationEvent`)
17. **Model Call Failure Tracking:** Telemetry for failed inference. (`src/events.ts`: `createModelCallFailureEvent`)
18. **Async Event Pipeline:** Reliable, ordered delivery of progress events. (`docs/integration-guide.md`)
19. **Secure Runtime Environment:** Design for execution in isolated containers. (`docs/integration-guide.md`)
20. **Git Author Configuration:** Automatic setup of `commit_login` and `commit_email`. (`src/git.ts`)

## 7. Top 20 Smart Patterns
1.  **Event Enrichment:** SDK automatically attaches assistant context to tool execution events. (`src/client.ts`: `sendProgress`)
2.  **Dual-Purpose Progress API:** Used for both UI updates and as a persistent key-value store for session state. (`src/client.ts`)
3.  **History Restoration:** Fetching events from previous jobs via `history=true` query param. (`src/client.ts`: `fetchProgress`)
4.  **Protocol-Agnostic Tools:** Using MCP allows tools to be shared across any engine language/SDK. (`src/mcp-server.ts`)
5.  **Namespace Isolation:** Using custom namespaces for internal state to avoid UI collisions. (`docs/integration-guide.md`: Step 9)
6.  **Token Separation:** Distinct tokens for Platform, Git, and Inference for granular security. (`docs/integration-guide.md`: Architecture Notes)
7.  **HTTP-based MCP Proxy:** Bridging external user tools into a secure firewall environment. (`src/mcp-proxy.ts`)
8.  **Graceful Git Finalization:** `finalizeChanges` acts as a non-fatal safety net after the agent loop. (`src/git.ts`)
9.  **Semantic Versioning for Events:** Every event payload includes a `version` field for future compatibility. (`src/types.ts`)
10. **Batch Event Sending:** Supporting arrays of events in a single POST to reduce overhead. (`src/client.ts`: `sendRawProgress`)
11. **Opaque Content Storage:** The `content` field in progress events is treated as a flexible JSON blob. (`src/client.ts`)
12. **In-Order Delivery Guarantee:** Platform ensures events reach the UI in the order they were sent. (`docs/integration-guide.md`)
13. **Feature Flag Model Selection:** Enabling/disabling complex features via the `features` block in job details. (`src/client.ts`)
14. **Deterministic Model Fallbacks:** Hierarchical resolution of models (Preferred -> Selected -> Default -> Fallback). (`src/client.ts`)
15. **Standalone MCP Server:** The MCP server can run as a separate process or be embedded. (`src/mcp-server.ts`)
16. **Tee-less Workflow:** CI avoids silent failures by removing `tee` commands. (`.github/workflows/publish.yml`)
17. **OIDC Trusted Publishing:** Secure npm publishing without long-lived secrets. (`.github/workflows/publish.yml`)
18. **Mock History Loading:** `engine-cli` simulates cross-job history by loading from local disk. (`cli/internal/store/store.go`)
19. **Reasoning Text Support:** Capturing LLM internal thought processes in `AssistantMessageEvent`. (`src/types.ts`)
20. **Action-Based System Messages:** Encouraging agents to adapt behavior based on the `action` (fix vs task). (`docs/integration-guide.md`)

## 8. Top 20 Development Trends (Latest Commits)
1.  **Model Selection Support:** Heavy focus on adding `GITHUB_SELECTED_MODEL` and related logic.
2.  **Multiple Model Vendors:** Extending the platform to support OpenAI, Anthropic, etc., concurrently.
3.  **OIDC for Publishing:** Moving towards secure, short-lived tokens for package releases.
4.  **Node 24 Upgrade:** Ensuring compatibility with the latest LTS Node environments.
5.  **Refinement of CLI Output:** Improving how events are displayed in the `engine-cli`.
6.  **MCP Proxy Integration:** Maturing the discovery of user-provided tools.
7.  **Standardization of Event Schemas:** Moving towards `sessions-v2` as the primary namespace.
8.  **Documentation Expansion:** Extensive work on the `integration-guide.md`.
9.  **Removal of Legacy Fields:** Cleaning up older concepts like `selectedEngine`.
10. **Support for `history=true`:** Implementing cross-job state persistence.
11. **Improvement of Git Auth:** Ensuring tokens are handled securely in all git operations.
12. **Bug Fixes in CLI:** Addressing edge cases in repo parsing and server handling.
13. **Consolidation of SDK Types:** Moving towards a cleaner, more modular type system.
14. **Enhanced PR Summary Logic:** Guidelines for post-loop LLM summarization.
15. **Feature Flag Implementation:** Allowing the platform to toggle SDK behaviors.
16. **Wait-for-Success in Tooling:** Ensuring git operations complete before reporting progress.
17. **Modularization of MCP Tools:** Separating `report_progress` from `reply_to_comment`.
18. **CI/CD Reliability:** Fixes to GitHub Actions workflows for consistent publishing.
19. **Telemetry Expansion:** Adding more detail to `ModelCallParam` and `ToolResult`.
20. **Shift to Semantic Events:** Prioritizing high-level intent over raw log lines.

## 9. Top 10 Advantages
1.  **Official Platform Support:** Built and maintained by the GitHub agent core team.
2.  **Local Testability:** `engine-cli` significantly reduces development friction.
3.  **Security-First Design:** Handles complex token management and secure cloning out-of-the-box.
4.  **Standardized Communication:** Common event schemas ensure a consistent UI across different engines.
5.  **Extensibility via MCP:** Allows engines to leverage a vast ecosystem of existing tools.
6.  **State Persistence:** Built-in mechanism for handling job retries and long-running sessions.
7.  **Model Agnostic:** Not locked into a single AI provider.
8.  **Comprehensive Documentation:** The integration guide provides a clear path from zero to production.
9.  **Robust Git Utilities:** Handles common pitfalls like shallow clones and branch existence checks.
10. **Modern Tech Stack:** Uses TypeScript and Go for a performant and type-safe experience.

## 10. Top 10 Limitations
1.  **Work in Progress:** Many APIs and schemas are marked as "preliminary" or "not finalized."
2.  **TypeScript Focus:** While engines can be anything, the primary SDK is TypeScript-only.
3.  **Async Progress Latency:** There is a known delay between sending events and UI updates.
4.  **Limited Testing Examples:** The export shows minimal unit/integration tests for the SDK itself.
5.  **Dependency on GitHub Actions:** The release flow is heavily tied to GitHub's specific infra.
6.  **Manual State Management:** Developers must manually handle save/restore of session history.
7.  **MCP Overhead:** Running separate MCP server processes adds architectural complexity.
8.  **Opaque Persistence:** The platform stores history but doesn't provide structured querying tools.
9.  **CLI-Platform Parity:** While good, the CLI cannot 100% replicate the secure runner environment.
10. **No Built-in LLM Client:** The SDK provides platform tools but requires a separate LLM client (like `@github/copilot-sdk`).

## 11. Top 5 AI Skills (Tools Provided)
1.  **`report_progress`:** (Provided) Commits code changes, pushes to remote, and updates PR description. (`src/mcp-server.ts`)
2.  **`reply_to_comment`:** (Provided) Responds to specific reviewer feedback on a PR. (`src/mcp-server.ts`)
3.  **`PlatformClient` Persistence:** (Skill-like) Ability to save and recall session state across jobs. (`src/client.ts`)
4.  **MCP Proxy Discovery:** (Skill-like) Dynamically acquiring new tools from the user's environment. (`src/mcp-proxy.ts`)
5.  **Job Context Awareness:** (Skill-like) Resolving intent from problem statements and action types. (`src/client.ts`: `fetchJobDetails`)

## 12. Data Inputs, Outputs, and Storage
- **Inputs:**
  - **Job Metadata:** Problem statement, repo info, action type, custom instructions. (`src/client.ts`: `fetchJobDetails`)
  - **Environment Variables:** Credentials and endpoints. (`docs/integration-guide.md`)
  - **Repository Files:** Source code fetched via git. (`src/git.ts`)
- **Outputs:**
  - **Progress Events:** Semantic logs, tool results, assistant messages. (`src/client.ts`)
  - **Git Commits:** Code changes pushed to GitHub. (`src/git.ts`)
  - **PR Updates:** Titles, descriptions, and comment replies. (`src/mcp-server.ts`)
- **Storage:**
  - **Platform Progress API:** Acts as a durable event store for history and telemetry. (`src/client.ts`)
  - **Local Disk (CLI):** `~/.engine-cli/history/` for simulating persistence. (`cli/internal/store/store.go`)
  - **Git Repository:** Final state storage.

## 13. Detailed Architecture Review
1.  **`PlatformClient`:** Central hub for all API communication. (`src/client.ts`)
2.  **`GitUtilities`:** Manages the lifecycle of the local workspace. (`src/git.ts`)
3.  **`EngineMcpServer`:** Provides standard tools to the agent. (`src/mcp-server.ts`)
4.  **`EventFactories`:** Ensures all events conform to platform schemas. (`src/events.ts`)
5.  **`MCPProxy`:** Discovers and communicates with external tool servers via HTTP. (`src/mcp-proxy.ts`)
6.  **`EngineCLI` (Main):** Orchestrates the local test environment. (`cli/cmd/engine-cli/main.go`)
7.  **`MockPlatformServer`:** Implements a local version of the `/jobs` and `/progress` endpoints. (`cli/internal/server/server.go`)
8.  **`Runner`:** Spawns and monitors the engine process, capturing stdout/stderr. (`cli/internal/runner/runner.go`)
9.  **`Store`:** Handles local file-based persistence for the CLI. (`cli/internal/store/store.go`)
10. **`Display`:** Formats and prints events in the CLI for human review. (`cli/cmd/engine-cli/display.go`)

## 14. Architecture Mermaid Graph
```mermaid
graph TD
    subgraph GitHub Platform
        P[Platform API]
        S[Inference API]
        R[GitHub Repo]
        M[User MCP Servers]
    end

    subgraph Engine Runner Environment
        CLI[Engine-CLI / Platform Runner]
        Proxy[MCP Proxy]
        
        subgraph Your Engine
            SDK[PlatformClient]
            GU[Git Utilities]
            MS[Built-in MCP Server]
            Loop[Agentic Loop]
        end
    end

    CLI -->|Env Vars| Your Engine
    Loop -->|Calls| SDK
    SDK -->|POST /progress| P
    SDK -->|GET /jobs| P
    Loop -->|Tools| MS
    Loop -->|Discovery| Proxy
    Proxy -->|HTTP MCP| M
    MS -->|Commit/Push| R
    GU -->|Clone| R
    Loop -->|Inference| S
    P -->|History| SDK
```

## 15. Maturity, Stability, Security, Performance
- **Maturity:** Alpha/Beta. The "Work in Progress" warnings and frequent schema updates indicate it's still evolving.
- **Stability:** High for core features (Git, PlatformClient), but subject to breaking changes in event shapes.
- **Security:** Very High. Explicit focus on token handling, OIDC publishing, and isolated execution environments.
- **Performance:** Designed for high-latency agentic loops. The async nature of the progress API prevents communication overhead from slowing down the agent.

## 16. Tests, CI, Documentation Review
- **Tests:** Minimal unit tests visible in the export; relies heavily on manual testing via `engine-cli`.
- **CI Pipelines:** Robust GitHub Actions for publishing to npm and creating releases. (`.github/workflows/publish.yml`)
- **Documentation:** Excellent. The `integration-guide.md` is thorough and includes diagrams and code samples.
- **AI Skills:** Effectively uses MCP to provide extensible "skills" to agents.

## 17. Top 20 Possible Improvements or Fixes
1.  **Structured Unit Tests:** Add Jest/Vitest suites for `PlatformClient`.
2.  **Multi-Language SDKs:** Provide Python and Go versions of the SDK.
3.  **CLI Web UI:** Add a local web dashboard for `engine-cli` to visualize the agent loop. (`cli/cmd/engine-cli`)
4.  **Streaming Event Support:** Optimize the progress API for real-time streaming if supported by the platform.
5.  **Automatic Deduplication:** Handle duplicate progress events in the SDK. (`src/client.ts`)
6.  **Structured History Querying:** Add helper methods to filter history by kind/namespace. (`src/client.ts`)
7.  **Built-in Linter/Formatter Tools:** Add standard MCP tools for `prettier` or `eslint`.
8.  **Improved Error Handling in CLI:** Better diagnostics when the engine process crashes. (`cli/internal/runner/runner.go`)
9.  **Mock Inference Server:** Add an option to `engine-cli` to mock LLM responses.
10. **Dry-Run Mode for Git:** Allow testing commits without pushing to remote. (`src/git.ts`)
11. **Telemetry Dashboard:** Tools to analyze token usage and tool duration. (`src/types.ts`: `ToolResult`)
12. **Automatic Workspace Cleanup:** Ensure `/tmp/workspace` is purged after engine completion. (`src/git.ts`)
13. **Support for Large Checkpoints:** Add multi-part state saving for very large session data. (`src/client.ts`)
14. **Unified Event Bus:** A central internal event emitter for easier engine observability.
15. **Type Generation from Schema:** Generate `src/types.ts` from the platform's API definition.
16. **Interactive Debug Mode:** Allow pausing the agent loop via the CLI for inspection.
17. **MCP Protocol Versioning:** Ensure compatibility with future MCP spec updates.
18. **Custom Action Type Support:** Allow engines to define and register new `action` types.
19. **Enhanced Repo Parsing:** Support for Enterprise Server URLs in `engine-cli`. (`cli/cmd/engine-cli/repo.go`)
20. **Built-in PR Review Tool:** A tool to read existing PR comments and reviews more easily.

## 18. Reuse for Agent Swarm (Debate & Plan)
1.  **MCP Protocol:** Use MCP to allow agents to "call" each other as tools.
2.  **Progress API as Shared Blackboard:** Agents can post their plans/arguments as progress events. (`src/client.ts`)
3.  **History Restoration:** New agents in the swarm can "catch up" by fetching the session history. (`src/client.ts`)
4.  **`AssistantMessageEvent` Reasoning:** Use the `reasoning_text` field to share internal logic between agents. (`src/types.ts`)
5.  **Job Metadata for Context:** Use `organization_custom_instructions` to pass swarm-wide rules. (`src/client.ts`)
6.  **`engine-cli` as Swarm Orchestrator:** Modify the runner to manage multiple engines. (`cli/internal/runner/runner.go`)
7.  **Model Selection for Specialization:** Route tasks to specific agents based on `available_models`. (`src/client.ts`)
8.  **`report_progress` for Consensus:** Agents can "vote" or commit finalized plans using this tool. (`src/mcp-server.ts`)
9.  **Namespace-based Channels:** Separate agents' communications using different namespaces in progress events.
10. **Event Factories for Structured Debate:** Create custom debate-specific event types using the factory pattern. (`src/events.ts`)

## 19. Reuse for Multi-User/Multi-Agent Shared Knowledge
1.  **Progress API as Graph Store:** Use progress events to store nodes/edges of a shared knowledge graph.
2.  **`history=true` for Evolution:** Interactions evolve the KB over time as each job sees the previous job's state. (`src/client.ts`)
3.  **Opaque JSON Content:** Store complex KB structures in the `content` field.
4.  **`pr_summary` for Knowledge Synthesis:** Use the summary logic to periodically compress and clean the KB.
5.  **MCP Proxy for External KB Access:** Connect agents to a shared vector database via MCP. (`src/mcp-proxy.ts`)
6.  **Namespace-based Knowledge Domains:** Partition the KB into namespaces (e.g., `kb:documentation`, `kb:code-patterns`).
7.  **`comment_reply` for Human Feedback:** Use PR comments as the interface for humans to correct/evolve the KB. (`src/mcp-server.ts`)
8.  **Versioned Events for KB History:** Leverage the `version` field to track changes to knowledge nodes.
9.  **`ToolExecution` Telemetry for KB Efficacy:** Track which knowledge nodes are most frequently used by agents.
10. **Custom Event Kinds for Skills:** Register "new skill discovered" events in the shared KB.

## 20. Reuse for Hardware/Cloud/Messenger/Voice
1.  **MCP Architecture:** Perfect for running agents on hardware (stdio) or cloud (HTTP) via the same protocol.
2.  **PlatformClient for Messenger Bridge:** Use the `PlatformClient` to send agent responses to Telegram/WhatsApp.
3.  **`engine-cli` for Web App Backend:** Use the mock server logic to power a web-based agent interface. (`cli/internal/server/server.go`)
4.  **Opaque State for Voice Snapshots:** Store audio snippets or voice state in progress event `content`.
5.  **Graph Visualization via Progress Feed:** Render the progress event stream as a real-time graph in a web app.
6.  **MCP Proxy for IoT Control:** Use MCP to allow agents to control hardware devices.
7.  **Secure Token Handling for Native Apps:** Reuse the git/platform token logic for secure mobile app auth.
8.  **Cloudflare Workers Deployment:** The SDK's use of native `fetch` makes it compatible with Worker environments. (`src/client.ts`)
9.  **CLI for Remote Management:** Use `engine-cli` patterns for a powerful remote management terminal.
10. **Semantic Events for Voice Synthesis:** Use `AssistantMessageEvent` content as the input for Text-to-Speech.

## 21. Reuse for Team Agents (Cooperative Workflows)
1.  **`comment_reply` for Hand-offs:** Agents can "hand off" tasks to humans via PR comments. (`src/mcp-server.ts`)
2.  **Progress Events for Shared Visibility:** Ensures the whole team (human/agent) sees the current state.
3.  **`report_progress` as Checkpoints:** Humans can review agent progress and "approve" a checkpoint.
4.  **History for Onboarding:** New team members (or agents) can read the session history to get context.
5.  **`reasoning_text` for Transparency:** Helps humans understand "why" an agent made a certain change.
6.  **Model Selection for Peer Review:** Use one agent model to review another's work via the `features` block.
7.  **`organization_custom_instructions` for Style:** Enforce team-wide coding standards across all agents.
8.  **MCP Proxy for Shared Tooling:** Share internal team tools (e.g., deployment scripts) with agents.
9.  **Event Factories for Workflow Transitions:** Create events that signal "ready for review" or "blocked."
10. **`finalizeChanges` as a Safety Valve:** Human team members can rely on this to ensure nothing is left uncommitted.

---
*Review complete. All points addressed with specific source code references and architectural insights based on the provided repository export.*
