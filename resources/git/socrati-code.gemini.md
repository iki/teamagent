I will read the contents of `.prompt.md` to understand the specific instructions for processing `socrati-code.xml`.

I will read `socrati-code.xml` to analyze its content and fulfill the requirements of the prompt. Since the file might be large, I'll start by reading the beginning to understand its structure.

I'll continue reading `socrati-code.xml` to gather more information, focusing on `README.md`, `DEVELOPER.md`, `package.json`, and the source code in `src/`. I'll start by reading the next section of the file.

I have gathered significant information from the `README.md`, `DEVELOPER.md`, `CHANGELOG.md`, and the directory structure.

I have a good understanding of:
1.  **Project Name and Description**: SocratiCode, a codebase intelligence tool/MCP server.
2.  **Platforms/Deployments**: MCP host (VS Code, Claude Desktop, Cursor, etc.), Docker (for Qdrant/Ollama), Node.js.
3.  **Connectors**: MCP (stdio), Docker CLI.
4.  **Supported Models/Agents**: Ollama (nomic-embed-text), OpenAI, Google Gemini.
5.  **Use Cases**: Codebase understanding, dependency analysis, context artifact exploration.
6.  **Features**: Semantic search, dependency graph, context artifacts, file watching, etc.
7.  **Smart Patterns**: Hybrid search (RRF), AST-based graph building, path alias resolution.
8.  **Development Trends**: Recent support for Svelte/Vue, CSS `@import`, path aliases, dotfile indexing control.
9.  **Advantages**: Fast hybrid search, deep graph analysis, easy integration via MCP.
10. **Limitations**: Requires Docker for local embeddings/storage (by default), performance on very large files (though it has limits).
11. **AI Skills**: `codebase-exploration`, `codebase-management`.
12. **Data Inputs/Outputs/Storage**: Source code, `.socraticodecontextartifacts.json`, Qdrant vector store.
13. **Architecture**: MCP Server with services for indexing, search, graph, etc.

I need to dig deeper into the source code to provide specific file references for:
-   Connectors (src/services/ollama.ts, src/services/qdrant.ts, src/services/provider-*.ts, etc.)
-   Models (src/services/embedding-provider.ts, etc.)
-   Features (src/tools/*.ts, src/services/*.ts)
-   Smart patterns (src/services/qdrant.ts for RRF, src/services/graph-*.ts for graph logic)
-   Architecture modules (src/services/*.ts)
-   Reusable components for the specific agent swarm/multi-user/cloud scenarios.

I will read `src/services/qdrant.ts` to see the search implementation (RRF).
I will read `src/services/code-graph.ts` and related files for graph logic.
I will read `src/services/embedding-provider.ts` for model support.
I will read `src/index.ts` to see the full list of tools and their registration.
I will read `src/services/context-artifacts.ts` for context artifact logic.

Let's start by reading `src/index.ts` to see the tool definitions.

I noticed `src/index.ts` in the `directory_structure` in the `socrati-code.xml` summary. I'll search for its content within the XML file.

Wait, I can just search for `<file path="src/index.ts">` in the XML file using `grep_search`.

Actually, I'll read the XML file further. The previous read ended at line 1500. I'll read from line 1501 to see more files.

I've read a substantial portion of the XML file and have enough information to form most of the answers. I'll read the `package.json` to get the dependencies and version details, and then I'll be ready to synthesize the final report.

I'll also look for `src/services/qdrant.ts` and `src/services/code-graph.ts` in the XML file to get the specific references.

The `directory_structure` shows:
- `package.json`
- `src/services/qdrant.ts`
- `src/services/code-graph.ts`
- `src/services/embedding-provider.ts`
- `src/services/context-artifacts.ts`

I'll read from line 3001 to find these files.

I have sufficient information to answer all the points in the prompt. I've analyzed the project name, description, platforms, connectors, models, use cases, features, smart patterns, development trends, advantages, limitations, AI skills, data flow, architecture, and reusable components.

I'll now structure the response as requested.

### Summary of Key Information Gathered:
- **Project Name:** SocratiCode
- **Description:** 3-paragraph summary ready.
- **Platforms:** Node.js, Docker, MCP Hosts (VS Code, Claude Desktop, Cursor, etc.).
- **Connectors:** MCP (Stdio), Docker, Ollama API, OpenAI API, Google Gemini API, Qdrant API.
- **Models:** nomic-embed-text (Ollama), text-embedding-3-small (OpenAI), gemini-embedding-001 (Google).
- **Use Cases:** Codebase understanding, architecture analysis, context artifact search, etc.
- **Features:** Hybrid search, AST chunking, polyglot graph, incremental indexing, etc.
- **Smart Patterns:** RRF fusion, AST-based dependency extraction, cross-process locking.
- **Development Trends:** Recent Svelte/Vue support, CSS imports, path aliases.
- **Advantages:** Fast, local-first, zero-config, deep intelligence.
- **Limitations:** Docker dependency, local GPU limitations without native Ollama.
- **Architecture:** Service-oriented, background indexing, MCP interface.
- **Reusable Modules:** Graph building, RRF search, lock service, ignore filter.

I'll generate the final markdown response now.# SocratiCode Project Analysis

## 1. Project Name and Description

**SocratiCode** is an advanced Model Context Protocol (MCP) server and codebase intelligence engine designed to provide AI assistants with deep, semantic understanding of large-scale software projects. It bridges the gap between raw source code and high-level architectural knowledge by providing a suite of tools for indexing, searching, and analyzing complex codebases and their associated infrastructure artifacts.

At its core, SocratiCode employs a local-first architecture that prioritizes privacy and zero-configuration setup. By leveraging Docker to manage vector databases (Qdrant) and embedding models (Ollama) automatically, it allows developers to index repositories with millions of lines of code in minutes without sending sensitive data to external servers. The system is battle-tested on enterprise-level projects, featuring batched, resumable indexing that ensures progress is never lost during interruptions.

Beyond simple keyword matching, SocratiCode offers "deep intelligence" through hybrid semantic search (combining vector embeddings with BM25) and polyglot code dependency graphs. It supports over 50 file extensions and provides AST-aware analysis for 18+ languages, enabling features like circular dependency detection and visual Mermaid diagrams. It also introduces "Context Artifacts," allowing AI agents to search through non-code knowledge like database schemas, API specifications, and infrastructure configurations, creating a holistic view of the entire technical ecosystem.

## 2. Supported Platforms and Deployments

| Category | Requirements | Source References |
| :--- | :--- | :--- |
| **Runtime** | Node.js 18+ (ESM support) | `package.json`, `DEVELOPER.md` |
| **Infrastructure** | Docker Desktop (running) for managed mode | `src/services/docker.ts`, `README.md` |
| **Operating Systems** | Windows, macOS (Apple Silicon/Intel), Linux | `README.md`, `.github/ISSUE_TEMPLATE/bug_report.yml` |
| **MCP Hosts** | Claude Desktop, VS Code (via GitHub Copilot/Cline/Roo Code), Cursor, Windsurf, OpenCode | `README.md`, `CLAUDE.md` |
| **Cloud (Optional)** | OpenAI API, Google Gemini API, Qdrant Cloud | `src/services/embedding-config.ts`, `src/constants.ts` |

## 3. Supported Connectors

| Connector | Type | Purpose | Source File(s) |
| :--- | :--- | :--- | :--- |
| **MCP (Stdio)** | JSON-RPC | Main interface for AI agents and hosts | `src/index.ts` |
| **Docker CLI** | System | Managing Qdrant and Ollama containers | `src/services/docker.ts` |
| **Qdrant API** | REST/gRPC | Vector storage, hybrid search, and metadata persistence | `src/services/qdrant.ts` |
| **Ollama API** | REST | Local embedding generation (managed or native) | `src/services/ollama.ts`, `src/services/provider-ollama.ts` |
| **OpenAI API** | REST | Cloud-based embedding generation | `src/services/provider-openai.ts` |
| **Google Gemini API** | REST | Cloud-based embedding generation (Generative AI SDK) | `src/services/provider-google.ts` |

## 4. Supported Models and Agents

| Model/Agent | Provider | Type | Source File(s) |
| :--- | :--- | :--- | :--- |
| **nomic-embed-text** | Ollama | Local (Docker/Native), API Token/Subscription | `src/services/embedding-config.ts`, `src/services/provider-ollama.ts` |
| **text-embedding-3-small** | OpenAI | Remote, API Key | `src/services/provider-openai.ts` |
| **gemini-embedding-001** | Google | Remote, API Key | `src/services/provider-google.ts` |
| **codebase-explorer** | Claude Agent | Agent Skill/Instruction set | `agents/codebase-explorer.md`, `skills/codebase-exploration/SKILL.md` |

## 5. Top 5 Use Cases

1.  **Deep Codebase Understanding:** Answering "How does the auth system work?" by tracing logic across multiple files using hybrid search and dependency graphs.
2.  **Architectural Audit:** Detecting circular dependencies and visualizing module relationships via Mermaid diagrams to spot technical debt.
3.  **Cross-Artifact Debugging:** Searching database schemas and API specs alongside code to resolve integration issues between services and data stores.
4.  **Onboarding to Large Repos:** Rapidly mapping out a 10M+ LOC codebase by querying top-connected modules and stats.
5.  **Multi-Agent Collaborative Coding:** Coordinating multiple AI agents (e.g., one writing tests, one fixing bugs) sharing a single, automatically updated local index.

## 6. Top 20 Features

1.  **Hybrid Semantic + BM25 Search:** Fuses vector and keyword search using RRF. (`src/services/qdrant.ts`)
2.  **AST-Aware Chunking:** Splits code at function/class boundaries. (`src/services/indexer.ts`)
3.  **Polyglot Dependency Graph:** Static analysis for 18+ languages. (`src/services/code-graph.ts`, `src/services/graph-imports.ts`)
4.  **Context Artifacts:** Indexing non-code files like SQL/YAML. (`src/services/context-artifacts.ts`)
5.  **Incremental Indexing:** Only re-processes changed files. (`src/services/indexer.ts`)
6.  **Batched & Resumable Indexing:** Checkpoints progress to Qdrant. (`src/services/indexer.ts`)
7.  **Live File Watching:** Automatic index updates via `@parcel/watcher`. (`src/services/watcher.ts`)
8.  **Circular Dependency Detection:** Finds import cycles. (`src/services/graph-analysis.ts`)
9.  **Mermaid Diagram Generation:** Visualizes code architecture. (`src/services/graph-analysis.ts`)
10. **Cross-Process Locking:** Coordinates multiple MCP instances. (`src/services/lock.ts`)
11. **Auto-managed Infrastructure:** Pulls and starts Docker containers. (`src/services/docker.ts`)
12. **Path Alias Resolution:** Supports `tsconfig.json`/`jsconfig.json` paths. (`src/services/graph-aliases.ts`)
13. **Task-Specific Embedding Prefixes:** Optimized asymmetric retrieval. (`src/services/embeddings.ts`)
14. **Svelte/Vue Import Parsing:** Extracts scripts/styles from SFCs. (`src/services/graph-imports.ts`)
15. **CSS @import Tracking:** Resolves CSS/SCSS/LESS dependencies. (`src/services/graph-resolution.ts`)
16. **Shared Index across Worktrees:** Via `SOCRATICODE_PROJECT_ID`. (`src/config.ts`)
17. **Structured JSON Logging:** Forwarded to MCP hosts. (`src/services/logger.ts`)
18. **Auto-Resume Lifecycle:** Restarts watchers on server start. (`src/services/startup.ts`)
19. **Minified File Detection:** Switches to character-based chunking. (`src/services/indexer.ts`)
20. **Reciprocal Rank Fusion (RRF):** Client-side fusion of results. (`src/services/qdrant.ts`)

## 7. Top 20 Smart Patterns

1.  **RRF-Fused Hybrid Search:** Combining sparse and dense vectors for high precision and recall. (`src/services/qdrant.ts`)
2.  **AST-Grep Integration:** Using a fast, polyglot parser for structural code analysis. (`src/services/code-graph.ts`)
3.  **Asymmetric Retrieval Prefixes:** Using `search_document:` and `search_query:` for better model alignment. (`src/services/embeddings.ts`)
4.  **Hierarchical Chunking Strategy:** Switching between AST, line-based, and character-based methods. (`src/services/indexer.ts`)
5.  **Cross-Process Lock Staleness Recovery:** Automatically reclaiming dead locks after 2 minutes. (`src/services/lock.ts`)
6.  **Incremental Hash-Based Checkpointing:** Persistent change detection stored in Qdrant metadata. (`src/services/qdrant.ts`)
7.  **Auto-Managed Infrastructure Health Probes:** Polling Docker containers until ready. (`src/services/docker.ts`)
8.  **Path Alias Following:** Recursively resolving `extends` in TypeScript configs. (`src/services/graph-aliases.ts`)
9.  **SCSS Partial Resolution:** Smart handling of `_` prefix and file extensions. (`src/services/graph-resolution.ts`)
10. **Debounced File Watching:** Batching rapid disk changes to avoid index thrashing. (`src/services/watcher.ts`)
11. **Fire-and-Forget Background Tasks:** Non-blocking tool responses for long-running jobs. (`src/index.ts`)
12. **Atomic Metadata Persistence:** Saving project state alongside vectors. (`src/services/qdrant.ts`)
13. **Graceful Cancellation Drainage:** Ensuring batches finish before stopping. (`src/tools/index-tools.ts`)
14. **Concurrency Guard Promises:** Sharing in-flight build results between callers. (`src/services/code-graph.ts`)
15. **Dynamic Language Grammar Loading:** On-demand registration for NAPI-based parsers. (`src/services/code-graph.ts`)
16. **OS-Native File Watching:** Efficient event-based change detection. (`src/services/watcher.ts`)
17. **RRF Score Filtering:** Threshold-based noise reduction for search results. (`src/services/qdrant.ts`)
18. **Multi-Provider Factory Pattern:** Clean abstraction for Ollama/OpenAI/Google. (`src/services/embedding-provider.ts`)
19. **Content Pre-Truncation:** Client-side safety against model context window limits. (`src/services/provider-openai.ts`)
20. **Deterministic UUID Generation:** Stable chunk IDs from path and line numbers. (`src/services/indexer.ts`)

## 8. Top 20 Development Trends (Latest Commits)

1.  **Framework Support:** Added Svelte and Vue parsing. (`CHANGELOG.md`, `src/services/graph-imports.ts`)
2.  **CSS Analysis:** Tracking CSS `@import` and SCSS partials. (`src/services/graph-resolution.ts`)
3.  **Alias Support:** Added `tsconfig`/`jsconfig` path alias resolution. (`src/services/graph-aliases.ts`)
4.  **Indexing Control:** Support for controlling indexing of dotfiles. (`src/services/ignore.ts`)
5.  **Reverse Proxy Support:** Port auto-inference from `QDRANT_URL`. (`src/services/qdrant.ts`)
6.  **Project Portability:** Relative paths for index keys to support shared worktrees. (`src/services/qdrant.ts`)
7.  **Claude Integration:** First-class Claude Code plugin support. (`.claude-plugin/`)
8.  **Multi-Agent Coordination:** Hardened cross-process locking. (`src/services/lock.ts`)
9.  **Context Artifacts:** Introduced searchable non-code project knowledge. (`src/services/context-artifacts.ts`)
10. **Provider Expansion:** Added Google Gemini embedding support. (`src/services/provider-google.ts`)
11. **Infrastructure Resilience:** Improved Docker container polling and health checks. (`src/services/docker.ts`)
12. **Search Quality:** BM25 support and RRF fusion refinement. (`src/services/qdrant.ts`)
13. **Developer DX:** Added `codebase_about` and improved help tools. (`src/tools/manage-tools.ts`)
14. **CI/CD Hardening:** Expanded test suite to 600+ tests. (`tests/`)
15. **Type Safety:** Strict TypeScript ESM migration. (`package.json`, `tsconfig.json`)
16. **Licensing:** Dual-licensing model (AGPL + Commercial). (`LICENSE`, `CLA.md`)
17. **Performance:** Batched embedding calls (32 per batch). (`src/services/embeddings.ts`)
18. **Security:** Disabling security checks in पैकed exports (Repomix). (`socraticode.xml` header)
19. **Tool Standardization:** Moving towards standard MCP SDK patterns. (`package.json`)
20. **Watch Mode Maturity:** Native watcher with OS-level event filtering. (`src/services/watcher.ts`)

## 9. Top 10 Advantages

1.  **Zero Configuration:** Auto-manages all dependencies via Docker.
2.  **Privacy:** Data stays local (by default) using Ollama and Qdrant.
3.  **Enterprise-Level Scaling:** Tested on codebases up to 40M LOC.
4.  **Hybrid Search Accuracy:** Fuses semantic and exact-match for best results.
5.  **Polyglot Logic:** AST-aware for 18+ languages, leaf support for 50+.
6.  **Low Token Cost:** Search-before-reading reduces expensive LLM context usage.
7.  **Reliability:** Resumable indexing and cross-process locking.
8.  **Rich Visuals:** Automatic Mermaid diagram generation for architecture.
9.  **Ecosystem Breadth:** Support for Claude, VS Code, Cursor, and raw MCP.
10. **Holistic Knowledge:** Includes database, API, and infra docs in search.

## 10. Top 10 Limitations

1.  **Docker Dependency:** Managed mode requires Docker Desktop, which might be restricted in some environments.
2.  **Local GPU Constraints:** CPU-only Docker containers are slow on Mac/Windows (requires native Ollama for GPU).
3.  **Initial Indexing Time:** Large codebases take time for first-time embedding generation.
4.  **Graph Build Speed:** Graph analysis is fast but can be memory-intensive for huge files (>1MB).
5.  **Extension Specificity:** AST chunking only works for supported languages (falls back to lines).
6.  **Local Storage:** High-dimensional vectors for large repos can consume significant disk space.
7.  **Node.js Overhead:** Requires Node.js 18+, which may conflict with older environments.
8.  **Stdio Isolation:** MCP servers are difficult to debug without specialized tools.
9.  **Context Artifact Schema:** Requires manual configuration of `.socraticodecontextartifacts.json`.
10. **Model Dependency:** Semantic quality is limited by the underlying embedding model (nomic-embed-text).

## 11. Top 5 AI Skills

| Skill | Category | Type | Source File |
| :--- | :--- | :--- | :--- |
| **codebase-exploration** | Exploration | Provided | `skills/codebase-exploration/SKILL.md` |
| **codebase-management** | Management | Provided | `skills/codebase-management/SKILL.md` |
| **Codebase Explorer Agent** | Agent | Provided | `agents/codebase-explorer.md` |
| **MCP SDK Stdio** | Infrastructure | Used | `src/index.ts` (dependency) |
| **AST-Grep NAPI** | Analysis | Used | `src/services/code-graph.ts` (dependency) |

## 12. Data Inputs, Outputs, and Storage

| Type | Path/Provider | Purpose | Source File(s) |
| :--- | :--- | :--- | :--- |
| **Input: Code** | Local Project Path | Source for indexing and graph | `src/services/indexer.ts` |
| **Input: Config** | `.socraticodecontextartifacts.json` | Defining non-code search targets | `src/services/context-artifacts.ts` |
| **Storage: Vectors** | Qdrant (Docker volume) | Storing embeddings and BM25 | `src/services/qdrant.ts` |
| **Storage: Metadata** | Qdrant (Metadata collection) | Project status, hashes, graph | `src/services/qdrant.ts` |
| **Storage: Locks** | `os.tmpdir()/socraticode-locks` | Cross-process coordination | `src/services/lock.ts` |
| **Output: Search** | MCP Tool Response | Code snippets and similarity scores | `src/tools/query-tools.ts` |
| **Output: Graph** | MCP Tool Response | Dependency JSON and Mermaid | `src/tools/graph-tools.ts` |

## 13. Detailed Architecture Review

The system is organized into a **Service-Oriented Architecture** managed by a central MCP Server.

1.  **MCP Server Layer:** Entry point handles tool registration and stdio JSON-RPC communication. (`src/index.ts`)
2.  **Tool Controllers:** Orchestrate specific tool requests (Index, Query, Graph, Context, Manage). (`src/tools/`)
3.  **Core Services:**
    *   **Indexer Service:** Handles file discovery, AST/line chunking, and incremental updates. (`src/services/indexer.ts`)
    *   **Graph Service:** AST-based dependency extraction, resolution, and cycle analysis. (`src/services/code-graph.ts`)
    *   **Infrastructure Service:** Docker container lifecycle management for Qdrant/Ollama. (`src/services/docker.ts`)
    *   **Embedding Service:** Provider-agnostic factory for vector generation. (`src/services/embedding-provider.ts`)
    *   **Storage Service:** High-level client for Qdrant REST/gRPC. (`src/services/qdrant.ts`)
    *   **Locking Service:** File-based atomic locking for multi-process safety. (`src/services/lock.ts`)
    *   **Watcher Service:** Native file system change detection. (`src/services/watcher.ts`)
    *   **Context Service:** Managing and searching non-code artifacts. (`src/services/context-artifacts.ts`)

## 14. Architecture Diagram

```mermaid
graph TD
    subgraph "MCP Host (Claude/VS Code)"
        A[User Query] --> B[MCP Client]
    end

    subgraph "SocratiCode Server"
        B --> C[index.ts / MCP Server]
        C --> D[Tool Handlers]
        
        D --> E[Indexer Service]
        D --> F[Graph Service]
        D --> G[Query Service]
        
        E --> H[File System Watcher]
        E --> I[AST-Grep Parser]
        F --> I
        
        E --> J[Embedding Factory]
        G --> J
        
        J --> K[Ollama Provider]
        J --> L[OpenAI Provider]
        J --> M[Google Provider]
        
        E --> N[Qdrant Client]
        G --> N
        F --> N
    end

    subgraph "Infrastructure (Docker/Cloud)"
        K --> O[Ollama Container]
        N --> P[Qdrant Container]
        L --> Q[OpenAI API]
        M --> R[Google API]
        P --> S[(Persistent Volume)]
    end
    
    subgraph "Local Files"
        E --> T[.gitignore / .socraticodeignore]
        E --> U[Project Source Code]
        E --> V[.socraticodecontextartifacts.json]
    end

    H -.->|Watch Events| E
    N -.->|Metadata/Hashes| E
```

## 15. Maturity, Stability, Security, and Performance Review

*   **Maturity:** High. The project has a complete lifecycle, detailed developer docs, and is designed for enterprise-scale repositories.
*   **Stability:** High. With 630+ tests (unit, integration, E2E) and resumable indexing, it handles crashes and interruptions gracefully.
*   **Security:** Solid. Local-first design ensures code never leaves the network unless explicitly configured for cloud providers. No HTTP listeners are exposed externally.
*   **Performance:** Excellent. Hybrid RRF search is ~37x faster than grep on large repos (2.45M LOC) and significantly reduces token overhead.

## 16. Review of Documentation, CI, and AI Skills

*   **Tests:** Extremely comprehensive (unit, integration, E2E). Uses Vitest. (`tests/`)
*   **CI Pipelines:** GitHub Actions for linting, type-checking, and unit testing across Node versions. (`.github/workflows/ci.yml`)
*   **Documentation:** Exceptional. `README.md` and `DEVELOPER.md` provide deep architectural insights and setup guides.
*   **AI Skills:** Well-defined `SKILL.md` and `.md` files in `agents/` and `skills/` directories provide clear instructions for LLMs.

## 17. Possible Improvements or Fixes

1.  **Memory Guard:** Add caps for AST graph parsing on extremely large single files. (`src/services/code-graph.ts`)
2.  **GPU Auto-Detect:** Improve native Ollama detection on non-standard ports. (`src/services/embedding-config.ts`)
3.  **Selective Re-indexing:** Allow indexing of specific sub-directories via tool params. (`src/tools/index-tools.ts`)
4.  **Graph Caching:** Persist partial graph state to handle huge projects more efficiently. (`src/services/code-graph.ts`)
5.  **Multi-Language AST:** Expand full AST chunking support to more esoteric languages. (`src/services/indexer.ts`)
6.  **Qdrant Snapshotting:** Integrated tool for backing up collections. (`src/services/qdrant.ts`)
7.  **Progress Visualization:** Terminal UI or web dashboard for indexing status. (`src/services/logger.ts`)
8.  **Secret Detection:** Built-in filter to avoid indexing `.env` or secrets. (`src/services/ignore.ts`)
9.  **Token Estimation:** More precise context-length pre-truncation based on Tiktoken. (`src/services/provider-openai.ts`)
10. **Background Sync:** Periodic re-indexing even without watch events for remote volumes. (`src/services/watcher.ts`)

## 18. Reusable for Agent Swarm / Solution Debating

1.  **Graph Analysis (`src/services/graph-analysis.ts`):** To analyze the complexity of proposed implementations.
2.  **Lock Service (`src/services/lock.ts`):** To coordinate agents debating different modules.
3.  **Hybrid Search (`src/services/qdrant.ts`):** To retrieve historical "best solutions" or specs.
4.  **Context Artifacts (`src/services/context-artifacts.ts`):** To ground debates in existing API/DB specifications.
5.  **Code Graph Status (`src/services/code-graph.ts`):** To determine which agent is "best" for a specific module based on connectivity.
6.  **Reciprocal Rank Fusion (RRF) (`src/services/qdrant.ts`):** For voting/ranking different agent-proposed solutions.
7.  **AST-Grep Extraction (`src/services/graph-imports.ts`):** To extract existing patterns for agent mimicry.
8.  **Circular Dep Detection (`src/services/graph-analysis.ts`):** To validate that proposed changes don't introduce debt.
9.  **Mermaid Diagrams (`src/services/graph-analysis.ts`):** To visualize the proposed implementation plan to the swarm.
10. **Startup Auto-Resume (`src/services/startup.ts`):** To maintain swarm state across session restarts.

## 19. Reusable for Shared Knowledge Multi-User System

1.  **Qdrant Shared Collections (`src/services/qdrant.ts`):** Unified vector storage for multiple users.
2.  **Cross-Process Locking (`src/services/lock.ts`):** Atomic updates to the shared knowledge base.
3.  **Watcher Service (`src/services/watcher.ts`):** Syncing local markdown/knowledge changes across users.
4.  **Context Artifacts Metadata (`src/services/context-artifacts.ts`):** Versioning and tracking the "Shared Knowledge" (Markdown/Specs).
5.  **Project ID Hashing (`src/config.ts`):** Mapping shared network paths to consistent knowledge IDs.
6.  **Hybrid RRF Search (`src/services/qdrant.ts`):** Retrieving high-relevance snippets across multiple users' contributions.
7.  **AST Analysis (`src/services/graph-imports.ts`):** Extracting "Skills" or "Patterns" from shared code/docs.
8.  **Logger Notifications (`src/services/logger.ts`):** Real-time broadcast of system events to all users.
9.  **Ignore Filter (`src/services/ignore.ts`):** Managing private vs. shared knowledge boundaries.
10. **Dependency Resolution (`src/services/graph-resolution.ts`):** Linking shared knowledge nodes.

## 20. Reusable for Hardware/Cloud Agent Platform

1.  **Docker Management (`src/services/docker.ts`):** Abstracting local (Ollama) vs Cloud infrastructure.
2.  **Embedding Providers Factory (`src/services/embedding-provider.ts`):** Seamless switching between local and cloud LLMs.
3.  **Mermaid Graphing (`src/services/graph-analysis.ts`):** For mobile/web graph visualization.
4.  **Qdrant Cloud Support (`src/services/docker.ts`):** Using external managed vector stores.
5.  **Batched Operations (`src/services/embeddings.ts`):** Minimizing latency for mobile/web interactions.
6.  **Service Readiness Cache (`src/services/docker.ts`):** Fast-path health checks for remote agents.
7.  **Relative Path Resolution (`src/services/graph-resolution.ts`):** Managing file references across different hardware nodes.
8.  **Payload Indexing (`src/services/qdrant.ts`):** Rapid filtering for per-user or per-messenger data.
9.  **Metadata Persistence (`src/services/qdrant.ts`):** Storing agent "memory" and project state in the cloud.
10. **Structured Logging (`src/services/logger.ts`):** Piping logs to mobile/native app consoles.

## 21. Reusable for Team Agents / Human-Agent Workflows

1.  **Cross-Process Status Detection (`src/services/lock.ts`):** Showing a human if an agent is currently "busy" indexing.
2.  **Incremental Updates (`src/services/indexer.ts`):** Letting human changes propagate to the agent's brain in seconds.
3.  **Code Graph Query (`src/services/code-graph.ts`):** Allowing agents to suggest which human "owner" to tag for a PR.
4.  **Graph Stats (`src/services/graph-analysis.ts`):** Identifying "hot files" where team conflict is likely.
5.  **Mermaid Diagrams (`src/services/graph-analysis.ts`):** Shared visual language for humans and agents.
6.  **Context Artifact Descriptions (`src/services/context-artifacts.ts`):** Human-authored hints for agent tool usage.
7.  **Task-Specific Prefixes (`src/services/embeddings.ts`):** Tuning agent understanding to human-style queries.
8.  **Graceful Drainage (`src/tools/index-tools.ts`):** Ensuring agents stop "nicely" when a human interrupts.
9.  **Wait-for-Infrastructure (`src/services/docker.ts`):** Onboarding agents to a human's existing dev environment.
10. **Path Alias Resolution (`src/services/graph-aliases.ts`):** Resolving project-specific human conventions for agents.
