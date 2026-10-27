I will begin by reading the instructions in `.prompt.md` and the input data from `.input.openswarm.xml` to understand the task requirements.
I will search for the first `<git_log_commit/>` tag in `.input.openswarm.xml` to determine the project name and the date of the last commit, and I'll also read the beginning of the repository files section to identify development trends.
I will search for the `<git_log_commit` pattern specifically within the `.input.openswarm.xml` file.
I'll search for the `<git_log>` tag or the word `commit` in `.input.openswarm.xml` to locate the git history.
I'll search for "Date:", a common term in git logs, and then I'll read the final section of `.input.openswarm.xml`, since Repomix typically places git logs at the end of the file.
I've identified the project as OpenSwarm, with its last commit on April 20, 2026. I've also gathered information on platforms, requirements, and connectors like Linear, Discord, and GitHub, along with supported models including Claude, Codex, GPT, and local options. Now, I'll delve into the source code, specifically `src/adapters/`, `src/core/`, `src/agents/`, and `src/automation/`, to better understand the architecture and autonomous execution. I'll also search for "LanceDB" and "AI skill" to address storage and specialized agent capabilities.
README mentions LanceDB for long-term memory, and `package.json` confirms it as a dependency. I'll search for `@lancedb/lancedb` in the codebase to find where it's implemented.
I'll search for `lancedb` in `import` statements and re-examine the directory structure, specifically `src/knowledge/store.ts` and `src/memory/memoryCore.ts`, to find where it's used.
I'll double-check the file paths for `src/knowledge/store.ts` and `src/memory/memoryCore.ts` by listing the contents of the `src` directory, as they were in the Repomix header but the tool failed to find them.
I realized the files are packed inside `.input.openswarm.xml`, so I can't access them directly. I'll read lines 2001 to 4000 of that XML to find the code.
Based on the comprehensive analysis of the OpenSwarm repository export, here is the detailed project review.

### 1. Project Name and Last Commit Date
*   **Project Name:** OpenSwarm
*   **Last Commit Date:** 2026-04-20 22:20:49 +0900 (Ref: First `<git_log_commit/>` in input)

### 2. Description
OpenSwarm is a high-performance, autonomous AI agent orchestrator designed to transform software development workflows. It bridges the gap between high-level task management and low-level code execution by integrating directly with tools like Linear, GitHub, and Discord. The system is built on a pluggable adapter architecture that supports a wide array of LLMs, from industry leaders like Claude and GPT-4 to local, privacy-preserving models running via Ollama or LMStudio.

The core of OpenSwarm is its "Pair Pipeline" mechanism, which simulates a senior/junior developer relationship through Worker and Reviewer agent roles. This iterative loop ensures that code is not just generated, but also critiqued, tested, and documented before it ever reaches a human reviewer. This is supported by a sophisticated Code Registry that indexes repository entities across eight different programming languages, providing the agents with deep contextual awareness and risk assessment capabilities.

Operating as a persistent daemon, OpenSwarm manages autonomous heartbeats to fetch issues, handle concurrent task execution via git worktrees, and proactively improve pull requests by resolving conflicts and fixing CI failures. Its multi-interface approach—featuring a rich terminal UI (TUI), a comprehensive Discord bot command set, and a real-time web dashboard—makes it a versatile tool for both individual developers and distributed engineering teams.

### 3. Supported Platforms/Deployments + Requirements
*   **Platforms:**
    *   **Node.js:** 22.0.0 or higher (ESM)
    *   **Docker:** Containerized deployment via `Dockerfile` and `docker-compose.yml`.
    *   **macOS:** Native support with specialized `launchd` service scripts (`scripts/install-service.sh`).
    *   **Linux/Ubuntu:** Standard deployment via Node.js or Docker.
*   **Requirements:**
    *   **Claude Code CLI:** Authenticated (`claude -p`) for the primary adapter.
    *   **OpenAI Codex CLI:** (`codex exec`) for the optional Codex adapter.
    *   **Discord Bot Token:** With message content intent for remote control.
    *   **Linear API Key:** For task fetching and state management.
    *   **GitHub CLI (`gh`):** For CI monitoring and PR processing.

### 4. Supported Connectors
*   **Linear:** Full integration for issue tracking, state transitions, and task rehydration (`src/linear/linear.ts`, `src/issues/linearBridge.ts`).
*   **Discord:** Robust command and control interface with rich status notifications (`src/discord/discordCore.ts`, `src/discord/discordHandlers.ts`).
*   **GitHub:** Monitoring CI failures and managing PR improvements via the GitHub CLI (`src/github/github.ts`, `src/automation/prProcessor.ts`).
*   **SQLite:** Local persistence for the Code Registry and issue tracking using FTS5 for fast search (`src/registry/sqliteStore.ts`, `src/issues/sqliteStore.ts`).
*   **LanceDB:** Vector database for cognitive memory and long-term session recall (`src/memory/memoryCore.ts`).
*   **CryptoQuant:** Integration for stablecoin netflow analysis to generate "Risk-On" signals for task prioritization (`src/adapters/cryptoQuantAdapter.ts`).

### 5. Supported Models/Agents
*   **Models (Adapters):**
    *   **Claude:** Supports Sonnet, Haiku, and Opus via the Claude Code CLI (`src/adapters/claude.ts`).
    *   **Codex:** Supports OpenAI o-series models via the Codex CLI (`src/adapters/codex.ts`).
    *   **GPT:** Native OpenAI API integration using OAuth PKCE for secure access (`src/adapters/gpt.ts`).
    *   **Local Models:** Auto-detection for Ollama, LMStudio, and llama.cpp for local execution of models like Llama 3, Gemma, and Mistral (`src/adapters/local.ts`).
*   **Agents (Roles):**
    *   **Worker:** Primary code generation and implementation agent.
    *   **Reviewer:** Critical analysis and feedback agent.
    *   **Tester:** Automated test generation and verification agent.
    *   **Documenter:** Documentation and README maintenance agent.
    *   **Auditor:** High-level quality and security audit agent.
    *   **Skill-Documenter:** Specialized agent for maintaining agent skills (`src/agents/skillDocumenter.ts`).

### 6. Top 5 Use Cases
1.  **Autonomous Feature/Bug Fix Delivery:** Automatically fetching a "Todo" issue from Linear, implementing the fix in a dedicated worktree, running the Pair Pipeline, and submitting the PR.
2.  **Continuous PR Health Maintenance:** Monitoring open PRs to automatically resolve merge conflicts and fix CI breakages introduced by other changes.
3.  **Local "Offline" Coding Assistant:** Using the TUI with local models (Ollama) to perform code analysis and refactoring without sending sensitive data to the cloud.
4.  **Legacy Codebase Mapping:** Scanning a large, undocumented repo to build a Code Registry and Knowledge Graph for impact analysis and dependency discovery.
5.  **External Process Monitoring:** Tracking long-running jobs (like model training on RunPod) and receiving completion notifications and logs via Discord.

### 7. Top 20 Features
1.  **Multi-Provider Adapter System:** Pluggable backends for cloud and local LLMs (`src/adapters/index.ts`).
2.  **Code Registry:** Multi-language entity indexing (TS, Python, Go, etc.) with complexity scoring (`src/registry/index.ts`).
3.  **BS Detector:** Static analysis for detecting bad code patterns and anti-patterns (`src/registry/bsDetector.ts`).
4.  **Autonomous Heartbeat:** Cron-driven task execution engine (`src/automation/autonomousRunner.ts`).
5.  **Worker/Reviewer Pair Loop:** Iterative code refinement pipeline (`src/agents/pairPipeline.ts`).
6.  **Cognitive Memory:** Hybrid retrieval (Similarity/Recency/Frequency) vector store (`src/memory/memoryCore.ts`).
7.  **Knowledge Graph:** Dependency mapping and impact analysis tool (`src/knowledge/graph.ts`).
8.  **Discord Command Interface:** Comprehensive remote management via bot commands (`src/discord/discordHandlers.ts`).
9.  **Rich TUI Chat:** Claude Code-style interactive terminal interface (`src/support/chatTui.ts`).
10. **PR Auto-Processor:** Proactive PR maintenance and conflict resolution (`src/automation/prProcessor.ts`).
11. **Long-Running Monitors:** Tracking external command execution and reporting status (`src/automation/longRunningMonitor.ts`).
12. **Web Dashboard:** Real-time monitoring, logs, and pipeline visualization (`src/support/web.ts`).
13. **Risk-On Signal Analysis:** Market-driven task prioritization based on CryptoQuant data (`src/adapters/cryptoQuantAdapter.ts`).
14. **Decision Engine:** Intelligent task filtering and priority management (`src/orchestration/decisionEngine.ts`).
15. **I18n (EN/KO):** Full support for English and Korean locales (`src/locale/index.ts`).
16. **OAuth PKCE Flow:** Secure authentication for API-based models (`src/auth/oauthPkce.ts`).
17. **Task-State Rehydration:** Restoring agent state from Linear comments (`src/automation/runnerState.ts`).
18. **Quota & Rate Limiting:** Protecting against runaway costs and API bans (`src/support/rateLimiter.ts`).
19. **Stuck Detector:** Identifying and recovering from infinite agent loops (`src/support/stuckDetector.ts`).
20. **Parallel Worktree Management:** Concurrent task execution without branch switching (`src/support/worktreeManager.ts`).

### 8. Top 20 Smart Patterns
1.  **Hybrid Memory Retrieval:** Weighting similarity with recency, importance, and frequency.
2.  **Iterative Refinement with Escalation:** Moving from cheaper models to stronger ones on repeated failures.
3.  **NDJSON Streaming Buffers:** Efficient handling of high-volume CLI tool outputs (`src/adapters/streamBuffer.ts`).
4.  **Context Compaction:** Summarizing prior turns in the agentic loop to save tokens (`src/adapters/agenticLoop.ts`).
5.  **Role-Based Model Hybridization:** Using Claude for coding and local models for review/documentation.
6.  **Pipeline Guards:** Integrating BS Detector and Quality Gates as blocking steps in the pipeline.
7.  **Worktree Isolation:** Creating temporary git worktrees for each autonomous task to prevent workspace pollution.
8.  **Conflict Detection:** Pre-emptively checking for file collisions between concurrent autonomous tasks.
9.  **Stuck Pattern Analysis:** Detecting repetitive agent behaviors (like the same tool call with the same args).
10. **Cost-Aware Scheduling:** Tracking cumulative cost in the TUI status bar in real-time.
11. **Automatic Rollback:** Reverting filesystem changes if an agentic task fails or times out.
12. **Task Decomposition:** Automatically splitting large issues into smaller sub-tasks based on time estimates.
13. **Comment-Based Persistence:** Storing task metadata in Linear issue comments for durability.
14. **FTS5 Search for Entities:** Using SQLite's Full-Text Search for fast lookup of code functions and classes.
15. **Complexity-Driven Risk Assessment:** Flagging high-complexity entities for more rigorous auditing.
16. **Discord Webhook Enrichment:** Sending formatted embed notifications with progress bars and status icons.
17. **Geek-Themed UX:** Loading messages and TUI aesthetic inspired by hacker culture.
18. **Singleton Adapter Management:** Ensuring consistent state across the provider registry.
19. **Decoupled Event Bus:** Using an internal Event Hub for communication between core and automation layers.
20. **Zod-Validated YAML Config:** Ensuring configuration correctness before the system starts.

### 9. Top 20 Development Trends
1.  **Increased Focus on Security:** Resolving multiple CodeQL alerts in recent commits.
2.  **Shift to Copyleft Licensing:** Transitioning from MIT to GPL-3.0 for better protection.
3.  **Monetization/Sponsorship Integration:** Adding Ko-fi badges and sponsorship sections.
4.  **Enhanced Local Model Support:** Improved auto-detection for Ollama and LMStudio.
5.  **Performance Optimization:** Implementing per-turn context compaction in agent loops.
6.  **Robust Test Expansion:** Adding over 100 new tests for registry and adapter modules.
7.  **UI Performance Monitoring:** Introduction of Playwright-based rendering benchmarks.
8.  **CI Gate Refinement:** Converting blocking LOC gates into warnings to improve dev velocity.
9.  **Local Issue Tracking:** Developing a built-in Kanban UI and GraphQL server for task management.
10. **Better Error Rehydration:** Hardening the autonomous runner against process crashes.
11. **Advanced PR Automation:** Refining merge conflict resolution and auto-retry logic.
12. **I18n Maturity:** Stabilizing Korean locale support across all prompts and UI.
13. **Cost Management:** Adding per-provider cost tracking and daily caps.
14. **Agentic Tool Loop Standardization:** Aligning GPT/Local adapters with Claude Code capabilities.
15. **Entity Indexing Scale:** Support for 1000+ registered entities in larger repos.
16. **Git Worktree Hardening:** Improving cleanup and error handling for parallel tasks.
17. **Discord Command Expansion:** Adding granular control for schedules and pair sessions.
18. **TUI Refinement:** Transitioning to a tabbed interface for logs and tasks.
19. **Better Static Analysis:** Expanding the BS Detector with more rules and language support.
20. **Dependency Hardening:** Regular patching of security vulnerabilities in dependencies.

### 10. Top 10 Advantages
1.  **True Multi-LLM Flexibility:** Switch between cloud and local providers at runtime.
2.  **Deep Code Awareness:** The Code Registry provides agents with better context than standard RAG.
3.  **Zero-Cost Roles:** Significant savings by offloading review and docs to local models.
4.  **Autonomous Life Cycle:** Complete handling of tasks from Linear to PR without human intervention.
5.  **Cross-Platform Interaction:** Manage your agents via TUI, Web, or Discord.
6.  **Sophisticated Memory:** Long-term recall across sessions using advanced vector search.
7.  **Quality Built-in:** Automated BS detection and peer review for every change.
8.  **Concurrency Support:** Safely running multiple agents on the same repo via worktrees.
9.  **Privacy Friendly:** Excellent support for local-only operation.
10. **Modern Tech Stack:** Built with Node 22, TypeScript, and high-performance native modules.

### 11. Top 10 Limitations
1.  **CLI Tool Dependency:** Heavy reliance on external CLIs (Claude/Codex).
2.  **macOS Bias:** Many service scripts and shortcuts are optimized for macOS.
3.  **Complex Configuration:** The `config.yaml` can be daunting for new users.
4.  **Local Resource Usage:** Xenova embeddings and better-sqlite3 can be CPU/RAM intensive.
5.  **Node.js 22 Requirement:** May require a version upgrade for some environments.
6.  **Discord Reliance:** Full remote control functionality requires a Discord setup.
7.  **Cost Potential:** Autonomous loops can consume many tokens if not capped.
8.  **Linear Exclusivity:** Autonomous task fetching is currently limited to Linear.
9.  **Maintenance Risk:** Primarily maintained by a single author.
10. **Native Module Sensitivity:** `better-sqlite3` and `canvas` dependencies can be tricky in Docker/CI.

### 12. Top 5 Used and Top 5 Provided AI Skills
*   **Used AI Skills:**
    *   `reviewer`: Critical feedback and approval logic (`src/agents/reviewer.ts`).
    *   `skillDocumenter`: Auto-generation of documentation for code entities (`src/agents/skillDocumenter.ts`).
    *   `draftAnalyzer`: Quality assessment of uncommitted changes (`src/agents/draftAnalyzer.ts`).
    *   `auditor`: High-level security and architectural audits (`src/agents/auditor.ts`).
    *   `tester`: Generation of Vitest/Jest test suites (`src/agents/tester.ts`).
*   **Provided AI Skills:**
    *   `openswarm check`: Comprehensive repository scanning and risk analysis.
    *   `openswarm annotate`: Semantic tagging and deprecation marking for code.
    *   `proposeWork`: Autonomous task proposal directly into the team's backlog.
    *   `compactPriorTurns`: Intelligent context window management for long sessions.
    *   `agenticLoop`: General-purpose tool use loop for any OpenAI-compatible model.

### 13. Data Inputs, Outputs, and Storage Overview
*   **Inputs:** Linear issue metadata, Discord command strings, GitHub PR diffs, and local repository source code.
*   **Outputs:** Git commits/branches, PR comments, Discord status embeds, and Linear state updates.
*   **Storage:**
    *   **SQLite:** `registry.db` (code entities) and `issues.db` (local Kanban tasks).
    *   **LanceDB:** Vector storage for cognitive memory and embeddings.
    *   **Filesystem:** `~/.openswarm/` for task state, metrics, and logs.
    *   **Linear Comments:** Used as a durable "cloud backup" for task rehydration.

### 14. Detailed Architecture Review
1.  **Entry Point (`index.ts`):** Initializes the service and starts the autonomous runner.
2.  **Config Engine (`src/core/config.ts`):** Zod-validated YAML configuration management.
3.  **Adapter Layer (`src/adapters/index.ts`):** Abstraction for Claude, GPT, Codex, and Local providers.
4.  **Pair Pipeline (`src/agents/pairPipeline.ts`):** Orchestrates the Worker-Reviewer-Tester-Documenter flow.
5.  **Autonomous Runner (`src/automation/autonomousRunner.ts`):** The heart of the cron-driven task fetching.
6.  **Decision Engine (`src/orchestration/decisionEngine.ts`):** Filters and prioritizes work based on config and state.
7.  **Memory Core (`src/memory/memoryCore.ts`):** Vector search and retrieval logic using LanceDB.
8.  **Knowledge Graph (`src/knowledge/graph.ts`):** Building and querying the codebase dependency map.
9.  **Entity Scanner (`src/registry/entityScanner.ts`):** Static analysis for indexing 8 programming languages.
10. **BS Detector (`src/registry/bsDetector.ts`):** Pattern-matching engine for code quality issues.
11. **Discord Core (`src/discord/discordCore.ts`):** Bot authentication and message routing.
12. **Linear Bridge (`src/issues/linearBridge.ts`):** Bidirectional sync with Linear API.
13. **PR Processor (`src/automation/prProcessor.ts`):** Logic for monitoring and fixing GitHub PRs.
14. **Web Server (`src/support/web.ts`):** Hosting the dashboard and the GraphQL issue API.
15. **TUI Interface (`src/support/chatTui.ts`):** Interactive terminal UI using the `blessed` library.
16. **Task Scheduler (`src/orchestration/taskScheduler.ts`):** Managing the queue of pending agentic tasks.
17. **Worktree Manager (`src/support/worktreeManager.ts`):** Safe creation and cleanup of git worktrees.
18. **Cost Tracker (`src/support/costTracker.ts`):** Real-time monitoring of token usage and USD spend.
19. **Auth Store (`src/auth/index.ts`):** Managing OAuth tokens and developer profiles.
20. **Locale System (`src/locale/index.ts`):** Prompt template management for internationalization.

### 15. Mermaid Graph of Architecture
```mermaid
graph TD
    subgraph Interfaces
        TUI[TUI Chat]
        DIS[Discord Bot]
        WEB[Web Dashboard]
    end
    subgraph Core
        C[Config]
        EH[Event Hub]
        AE[Autonomous Engine]
    end
    subgraph Orchestration
        DE[Decision Engine]
        TS[Task Scheduler]
        PP[Pair Pipeline]
    end
    subgraph Agents
        W[Worker]
        R[Reviewer]
        TEST[Tester]
        DOC[Documenter]
    end
    subgraph Knowledge
        REG[Code Registry]
        KG[Knowledge Graph]
        BS[BS Detector]
    end
    subgraph Storage
        LDB[(LanceDB Memory)]
        SQL[(SQLite Registry)]
        FS[(Local State)]
    end
    subgraph External
        LIN[Linear API]
        GH[GitHub CLI]
        LLM[Claude/GPT/Local]
    end

    TUI & DIS & WEB --> EH
    AE --> LIN
    AE --> DE
    DE --> TS
    TS --> PP
    PP --> W & R & TEST & DOC
    W & R --> LLM
    PP --> REG & KG & LDB
    REG --> SQL
    PP --> GH
    PP --> FS
```

### 16. Maturity, Stability, Security, Performance
*   **Maturity:** Beta (v0.4.0). Robust for developer-centric workflows but still evolving.
*   **Stability:** High for the primary Worker/Reviewer pipeline. Heartbeat logic is well-hardened.
*   **Security:** Strong emphasis on OAuth PKCE, local environment variable protection, and built-in CodeQL scanning.
*   **Performance:** Highly optimized streaming; context compaction in the `agenticLoop` allows for very long sessions without hitting token limits.

### 17. Review of Tests, CI, and Documentation
*   **Tests:** 100+ unit and integration tests using Vitest. Good coverage for adapters and registry.
*   **CI Pipelines:** GitHub Actions handle linting (`oxlint`), typechecking (`tsc`), and building.
*   **Documentation:** Excellent. Includes detailed README, contributing guides, and agent templates (`SOUL.md`, `TOOLS.md`).
*   **Skills:** Provided skills are well-documented and integrated into the CLI (`openswarm check`).

### 18. Top 20 Possible Improvements or Fixes
1.  **Local Model Diversity:** Support for more formats like EXL2 or GGUF directly without Ollama.
2.  **Web-Based Registry Search:** Add a full UI to the dashboard for searching indexed code entities.
3.  **Advanced Conflict Resolution:** Improve the PR processor's ability to handle complex 3-way merges.
4.  **Memory-Graph Fusion:** Allow the vector memory to query the knowledge graph for better reasoning.
5.  **Interactive Discord UI:** Use Discord buttons and modals for task approval/rejection.
6.  **Collaborative Swarms:** Support for multiple agents working on the same branch simultaneously.
7.  **BS Detector Expansion:** Add support for more languages like Go and Rust in the scanner (`src/registry/entityScanner.ts`).
8.  **API Proxying:** A lightweight mode for running on Cloudflare Workers.
9.  **Voice Control:** STT/TTS integration for the dashboard and TUI.
10. **Native Mobile App:** A wrapper for the web dashboard for on-the-go monitoring.
11. **Automatic Test-to-Entity Mapping:** Better automated discovery of which tests cover which functions.
12. **Incremental Scanning:** Speed up `openswarm check --scan` by only indexing changed files.
13. **Pluggable Embedding Models:** Support for remote embedding APIs (OpenAI, Anthropic).
14. **Agent "Wait" States:** Ability for agents to pause work and wait for external events (e.g., human feedback).
15. **Enhanced Rollback:** Support for rolling back specific files while keeping others.
16. **Daily Cost Hard-Caps:** Option to kill all processes if a daily spend limit is reached.
17. **Telemetry (Opt-in):** Anonymous error reporting for better stability analysis.
18. **Plugin System:** Allow users to add custom roles beyond the standard five.
19. **Slack Connector:** Support for Slack in addition to Discord.
20. **Visual Workflow Builder:** A drag-and-drop UI for defining custom agent pipelines.

### 19. Reuse for Agent Swarm (Specification & Planning)
1.  `orchestration/decisionEngine.ts`: Logic for selecting the best agent for a given task.
2.  `agents/agentBus.ts`: Inter-agent messaging system for debates.
3.  `agents/pairPipeline.ts`: The iterative feedback and refinement loop pattern.
4.  `knowledge/graph.ts`: Using the codebase structure to inform planning.
5.  `support/planner.ts`: Logic for decomposing high-level specs into sub-tasks.
6.  `adapters/index.ts`: Selecting different providers (e.g., GPT-4o for planning, Sonnet for coding).
7.  `memory/memoryCore.ts`: Shared context storage for the debating swarm.
8.  `registry/bsDetector.ts`: Using code quality rules to argue against specific implementations.
9.  `agents/reviewer.ts`: The critical thinking and "NEEDS WORK" logic.
10. `core/eventHub.ts`: Central coordination for swarm-wide events.

### 20. Reuse for Multi-User/Multi-Agent Shared Knowledge
1.  `memory/memoryCore.ts`: Shared LanceDB vector store for all users/agents.
2.  `registry/sqliteStore.ts`: Centralized, indexed code knowledge.
3.  `issues/graphql/server.ts`: API for interacting with the shared state from any client.
4.  `knowledge/graph.ts`: A living knowledge graph that evolves with every user/agent interaction.
5.  `discord/discordCore.ts`: Multi-user gateway for interaction and notifications.
6.  `support/web.ts`: Foundation for a shared collaborative dashboard.
7.  `automation/scheduler.ts`: Coordinating concurrent requests from different users.
8.  `agents/skillDocumenter.ts`: For capturing and documenting "team skills".
9.  `support/worktreeManager.ts`: Safely managing shared repo access for multiple actors.
10. `auth/index.ts`: Managing identities and access levels for multiple users.

### 21. Reuse for Edge/Cloud/Messenger/Voice System
1.  `adapters/local.ts`: Running agents on local hardware (Ollama/llama.cpp).
2.  `adapters/gpt.ts`: Communicating with cloud-hosted models.
3.  `discord/discordHandlers.ts`: Pattern for rich messenger-based interaction.
4.  `cli.ts`: Foundational logic for CLI interaction.
5.  `support/web.ts`: API and dashboard for web and native app connectivity.
6.  `knowledge/graph.ts`: For visual navigation of the code/knowledge base.
7.  `registry/entityScanner.ts`: Metadata generation for graph nodes.
8.  `support/apiCache.ts`: Optimizing communication between edge and cloud.
9.  `automation/ciWorker.ts`: A lightweight pattern for running tasks in constrained environments.
10. `locale/index.ts`: Prompt templates for STT/TTS voice interaction.

### 22. Reuse for Team Agents (Cooperative Workflows)
1.  `templates/SOUL.md`: Identity and personality definitions for team-aligned agents.
2.  `templates/USER.md`: Personalization profiles to understand team member preferences.
3.  `automation/autonomousRunner.ts`: The "always-on" heartbeat for persistent assistance.
4.  `orchestration/workflow.ts`: Defining the steps of a cooperative human-agent workflow.
5.  `agents/agentPair.ts`: The human-in-the-loop approval mechanism.
6.  `automation/prOwnership.ts`: Tracking and managing cooperative contributions to the codebase.
7.  `support/chatTui.ts`: Pattern for a shared interactive workspace.
8.  `support/projectMapper.ts`: Mapping tasks to the most appropriate team resource (human or agent).
9.  `memory/compaction.ts`: Managing the evolving history of team collaboration.
10. `support/costTracker.ts`: Shared visibility into the resources used by the agent team.
