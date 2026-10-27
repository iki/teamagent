I will read the instructions in `.prompt.md` to understand the required task.
I will check the size and content of `gitnexus.xml` to determine the best way to analyze it.
I will read the beginning of `gitnexus.xml` to understand its structure and decide how to process the file.
I will read the directory structure to gain an overview of the project's architecture and components.
I will read `gitnexus/README.md` to gather a comprehensive project description and understand its core objectives.
I will examine `gitnexus/src/core/embeddings/text-generator.ts` and `gitnexus-web/src/core/llm/agent.ts` to identify the supported models and agents.
I will search for the content of `gitnexus/src/core/embeddings/text-generator.ts` within `gitnexus.xml` to understand the supported models.
I will examine `gitnexus-web/src/core/llm/agent.ts` and `gitnexus-web/src/core/llm/settings-service.ts` to identify the models supported in the web UI.
I have identified several key LLM providers and inferred some primary use cases. Now, I will examine `gitnexus/src/core/ingestion/pipeline.ts` to understand the ingestion process and identify top features and smart patterns for Points 6 and 7.
I have identified several key features from `pipeline.ts`, including topological sorting, multi-language support (including COBOL/JCL), and complex extraction capabilities like route and heritage processing. I will now examine the git logs in `gitnexus.xml` to identify the top 20 development trends for Point 8.
I have gathered sufficient information to address the requested points. I will now synthesize this data into a structured markdown response, carefully reviewing the architecture and reuse components. The project's monorepo structure, key modules like `KnowledgeGraph` and `Pipeline`, and its multi-language support will be central to my answer.
# GitNexus: Graph-Powered Code Intelligence for AI Agents

## 1. Project Name and Description
**GitNexus**

GitNexus is a high-performance, graph-powered code intelligence platform designed to provide AI agents with deep, structural awareness of complex codebases. By indexing repositories into a multi-layered knowledge graph, it precomputes every dependency, call chain, and inheritance relationship, transforming a flat collection of files into a queryable semantic map. This structural understanding allows AI coding tools to perform edits, refactors, and impact analysis with a level of precision that exceeds traditional RAG (Retrieval-Augmented Generation) approaches.

The platform integrates seamlessly into modern developer workflows through the Model Context Protocol (MCP), supporting industry-leading AI editors like Claude Code, Cursor, Windsurf, and Codex. It eliminates the "context window blindness" of LLMs by providing surgical access to relevant code patterns and relationships, ensuring that an agent editing a single function is fully aware of its 47 downstream dependencies across disparate modules.

GitNexus is built for scale and polyglot environments, supporting over 15 programming languages including TypeScript, Java, Rust, Go, and legacy systems like COBOL. It features a sophisticated ingestion pipeline that handles everything from AST-based symbol extraction to cross-file type inference and community-based clustering. Whether used via its interactive CLI, the integrated web-based graph visualizer, or as a background service for AI agents, GitNexus serves as the essential "brain" for autonomous software engineering.

## 2. Supported Platforms and Deployments
*   **Operating Systems:** Windows (win32), macOS, Linux (Node.js 20+ environment).
*   **Host Environments:**
    *   **Claude Code:** Deep integration with PreToolUse hooks and agent skills.
    *   **Cursor / Codex / Windsurf / Cline / OpenCode:** Supported via standard MCP configuration.
*   **Web Deployment:** Vercel (pre-configured for `gitnexus-web`).
*   **Local Development:** Node.js 20.0.0+ (`gitnexus/package.json`).
*   **Evaluation/Testing:** Docker-based environments for agent evaluation (`eval/environments/gitnexus_docker.py`).

## 3. Supported Connectors
*   **Claude Code Hook:** Automatically enriches shell commands with graph context.
    *   *Reference:* `gitnexus/hooks/claude/gitnexus-hook.cjs`
*   **MCP (Model Context Protocol):** Universal connector for AI editors.
    *   *Reference:* `gitnexus/src/mcp/server.ts`, `gitnexus/src/cli/mcp.ts`
*   **Cursor Integration:** Specialized hooks for the Cursor editor.
    *   *Reference:* `gitnexus-cursor-integration/hooks/hooks.json`
*   **Web API:** Express-based server for the web frontend.
    *   *Reference:* `gitnexus/src/server/api.ts`
*   **pi-gitnexus:** Community-driven connector for the `pi` agent.
    *   *Reference:* `gitnexus/README.md` (External)

## 4. Supported Models and Agents
*   **Remote LLMs (API Token/Subscription):**
    *   **OpenAI:** GPT-4o, GPT-4-turbo, etc.
    *   **Anthropic:** Claude 3.5 Sonnet, Claude 3 Opus (Primary target).
    *   **Gemini:** Pro and Flash models.
    *   **Azure OpenAI:** Enterprise-grade deployments.
    *   **OpenRouter:** Access to diverse open-source and proprietary models.
    *   **MiniMax / GLM:** Specialized Asian market models.
    *   *Reference:* `gitnexus-web/src/core/llm/settings-service.ts`, `gitnexus-web/src/core/llm/types.ts`
*   **Local Models:**
    *   **Ollama:** Support for local execution of Llama 3, Mistral, etc.
    *   *Reference:* `gitnexus-web/src/core/llm/settings-service.ts`
*   **Embedding Models:**
    *   Configurable via `GITNEXUS_EMBEDDING_URL` and `GITNEXUS_EMBEDDING_MODEL` for OpenAI-compatible endpoints.
    *   *Reference:* `gitnexus/src/core/embeddings/http-client.ts`

## 5. Top 5 Use Cases
1.  **Surgical Impact Analysis:** Determine exactly which modules or APIs will break before applying a breaking change to a core utility.
    *   *Workflow:* Query `impact-analysis` skill -> Traverse `CALLS` edges in graph -> Report affected files.
2.  **Autonomous Code Exploration:** Quickly orient an agent in a massive, unfamiliar codebase.
    *   *Workflow:* Run `analyze` -> Generate `CLAUDE.md`/`AGENTS.md` -> Agent reads high-level summaries and entry points.
3.  **Automated Documentation (Wiki):** Keep codebase documentation in sync with actual structural changes.
    *   *Workflow:* Run `wiki` command -> Extract graph patterns -> Generate Markdown/HTML wiki with Mermaid diagrams.
4.  **Graph-RAG Refactoring:** Assist agents in complex refactors by providing full call-chain visibility.
    *   *Workflow:* Agent uses MCP tools to find all implementations of an interface -> Identifies circular dependencies -> Proposes plan.
5.  **Legacy System Modernization (COBOL):** Extract business logic from legacy mainframes for migration to modern stacks.
    *   *Workflow:* Index COBOL/JCL files -> Map data flows through Copybooks -> Visualize legacy architecture.

## 6. Top 20 Features
1.  **Multi-Language AST Parsing:** 15+ languages via Tree-sitter (`gitnexus/src/core/ingestion/parsing-processor.ts`).
2.  **Topological Parallel Ingestion:** Kahn’s algorithm for dependency-aware parallel processing (`gitnexus/src/core/ingestion/pipeline.ts`).
3.  **Cross-File Type Inference:** `BindingAccumulator` for propagating types across modules (`gitnexus/src/core/ingestion/binding-accumulator.ts`).
4.  **Method Resolution Order (MRO):** Accurate call resolution for complex inheritance (`gitnexus/src/core/ingestion/mro-processor.ts`).
5.  **COBOL/JCL Support:** Specialized processing for legacy enterprise code (`gitnexus/src/core/ingestion/cobol-processor.ts`).
6.  **Next.js/Expo Route Extraction:** Mapping file-system routing to API endpoints (`gitnexus/src/core/ingestion/route-extractors/`).
7.  **Community Detection:** Graph clustering to identify logical service boundaries (`gitnexus/src/core/ingestion/community-processor.ts`).
8.  **Hybrid Search:** Combined BM25 and vector embedding search (`gitnexus/src/core/search/hybrid-search.ts`).
9.  **MCP Tool Suite:** Standardized tools for agent interaction (search, get_node, get_impact) (`gitnexus/src/mcp/tools.ts`).
10. **Interactive Graph Visualizer:** Web-based Sigma.js explorer (`gitnexus-web/src/components/GraphCanvas.tsx`).
11. **Automated Wiki Generation:** LLM-powered documentation from graph data (`gitnexus/src/core/wiki/generator.ts`).
12. **Claude Code Auto-Augmentation:** Hook-based context enrichment (`gitnexus/hooks/claude/gitnexus-hook.cjs`).
13. **Worker Pool Orchestration:** Efficient multi-core parsing (`gitnexus/src/core/ingestion/workers/worker-pool.ts`).
14. **Heritage Mapping:** Comprehensive tracking of `EXTENDS` and `IMPLEMENTS` (`gitnexus/src/core/ingestion/heritage-map.ts`).
15. **Markdown Ingestion:** Indexing documentation alongside code (`gitnexus/src/core/ingestion/markdown-processor.ts`).
16. **Assignment Fixpoint Loop:** Resolving multi-depth assignment chains (`gitnexus/src/core/ingestion/type-env.ts`).
17. **Middleware Chain Extraction:** Mapping request flows in web frameworks (`gitnexus/src/core/ingestion/route-extractors/middleware.ts`).
18. **Response Shape Analysis:** Inferring API schemas from return statements (`gitnexus/src/core/ingestion/route-extractors/response-shapes.ts`).
19. **AST Caching:** LRU-based performance optimization for large repos (`gitnexus/src/core/ingestion/ast-cache.ts`).
20. **Self-Correction Logic:** Evaluation framework to verify agent performance (`eval/run_eval.py`).

## 7. Top 20 Smart Patterns
1.  **Topological Level Batching:** Grouping files by dependency level for race-condition-free parallel parsing.
2.  **Top-Down/Bottom-Up Type Propagation:** Using `BindingAccumulator` to resolve symbols across file boundaries.
3.  **Heuristic Class Detection:** Identifying constructor calls without the `new` keyword in languages like Kotlin/Dart.
4.  **Variadic Arity Disambiguation:** Differentiating overloaded methods by parameter count in graph IDs.
5.  **Copybook Expansion:** Virtualizing COBOL `COPY` statements for complete AST reconstruction.
6.  **JCL Step Chaining:** Linking Job Control Language steps to their underlying program executions.
7.  **Fixpoint Assignment Resolution:** Iteratively resolving chains like `a = b; b = c; c = getX()`.
8.  **Framework-Specific Route Synthesis:** Automatically generating `ROUTE` nodes from Next.js or Expo file structures.
9.  **Response Shape Heuristics:** Detecting common API response patterns (JSON, Redirects) from AST nodes.
10. **Community-Based Service Boundary Detection:** Using Louvain/Girvan-Newman logic to find microservices in a monolith.
11. **JSDoc/PHPDoc Type Fallbacks:** Using documentation comments when static types are missing.
12. **Generic Iterable Unrolling:** Inferring element types in `for...of` loops from container types.
13. **Wildcard Import Synthesis:** Synthesizing bindings for whole-module imports (Go, Rust).
14. **Constructor-Visible Virtual Dispatch:** Resolving calls to overridden methods within same-file class hierarchies.
15. **Context-Aware Snippet Generation:** Truncating code for embeddings while preserving structural integrity.
16. **Staleness Tracking:** Using Git hashes to determine which graph nodes need re-indexing.
17. **Interactive Onboarding Guides:** Dynamic, state-aware setup for first-time users in the web UI.
18. **WebGPU Embedding Fallback:** Handling browser-based embedding generation when local hardware is unavailable.
19. **Hybrid Prompt Injection:** Appending graph context at the *end* of system prompts for better LLM adherence.
20. **Multi-Stage Tool Call Cards:** Rich UI rendering for complex agent tool interactions.

## 8. Top 20 Development Trends (Latest Commits)
1.  **Type-System Hardening:** Shift towards more robust cross-file type resolution via `BindingAccumulator`.
2.  **Security Focused Refactoring:** Critical fixes for `git-clone` and API endpoints (PR #709).
3.  **Modular Call Resolution:** Breaking down `resolveCallTarget` into specialized `resolveMemberCall`, `resolveStaticCall`, etc.
4.  **Inheritance Depth Support:** Introducing `HeritageMap` and `MRO` fast-paths for deeper hierarchy traversal.
5.  **Large Repo Optimization:** Streaming graph data to the web UI and fixing memory bottlenecks (PR #732).
6.  **User Personalization:** Support for `GITNEXUS_HOME` to allow custom global configurations.
7.  **Improved Observability:** Printing skipped large files and providing more verbose analysis logs.
8.  **Editor Integration Parity:** Aligning skills and hooks across Claude Code and Cursor.
9.  **Standardization of Skill Formats:** Moving towards a unified `SKILL.md` format for all integrations.
10. **Testing Rigor:** Significant increase in integration tests for language-specific resolvers (C++, C#, Java, Kotlin).
11. **Dependency Modernization:** Pinning tree-sitter versions to resolve peer dependency conflicts.
12. **UI Polish:** Fixing onboarding guides and install links in documentation.
13. **Expanded Language Coverage:** Ongoing refinement of Swift and C++ extraction gaps.
14. **Fixpoint Loop Convergence:** Ensuring deterministic results in complex assignment resolution.
15. **Performance Profiling:** Introduction of unit tests specifically for performance optimizations.
16. **Async/Await Refinement:** Cleaning up promise handling in the ingestion worker pool.
17. **Documentation-Driven Development:** High-quality specs for new features (e.g., COBOL deep indexing).
18. **Agent Self-Evaluation:** Maturing the `eval/` framework for benchmarking different LLM agents.
19. **Streamlined CLI Commands:** Refining the `setup` and `analyze` UX.
20. **Community Integration:** Actively supporting external wrappers like `pi-gitnexus`.

## 9. Top 10 Advantages
1.  **Structural Precision:** Far more accurate than vector-only RAG for code tasks.
2.  **Polyglot Mastery:** Unified graph model for 15+ disparate languages.
3.  **Enterprise-Ready (COBOL):** Unique capability to bridge legacy and modern stacks.
4.  **High-Performance Ingestion:** Parallel, topological processing for fast indexing.
5.  **Deep Editor Integration:** Native hooks that make agents "feel" smarter instantly.
6.  **Minimalist Agent Interface:** Simple MCP tools that hide complex graph traversals.
7.  **Offline-First:** Local-first graph storage and optional local LLM support.
8.  **Automated Maintenance:** Staleness detection keeps the graph in sync with Git.
9.  **Visual Debugging:** Web UI allows humans to verify what the agent "sees."
10. **Extensible Architecture:** Easy to add new languages or custom extraction rules.

## 10. Top 10 Limitations
1.  **Memory Intensity:** Large repos can consume significant RAM during peak ingestion.
2.  **Swift Ingestion Gaps:** Certain Swift-specific patterns (like complex optional binding) are still maturing.
3.  **Cross-File Inferred Binding Propagation:** Limited propagation of types inferred in one file to others.
4.  **Node ID Collisions:** Overloaded methods in the same file can sometimes share a graph ID.
5.  **Browser Embedding Limits:** Large-scale embeddings in the web app are limited by browser memory.
6.  **Setup Complexity:** Initial MCP setup can be daunting for non-technical users (mitigated by `gitnexus setup`).
7.  **Dependency on Tree-Sitter:** Limited to languages with mature tree-sitter grammars.
8.  **No Real-Time Indexing:** Requires a re-scan (incremental) rather than live "watch" mode for now.
9.  **MRO Search Performance:** Deep inheritance chains can slow down complex call resolution.
10. **Learning Curve for Skills:** Writing custom skills requires understanding the underlying graph schema.

## 11. Top AI Skills
*   **Provided Skills:**
    1.  `gitnexus-impact-analysis`: Traces consequences of code changes. (`gitnexus/skills/gitnexus-impact-analysis.md`)
    2.  `gitnexus-refactoring`: Guides agents through complex structural changes. (`gitnexus/skills/gitnexus-refactoring.md`)
    3.  `gitnexus-exploring`: High-level codebase orientation and navigation. (`gitnexus/skills/gitnexus-exploring.md`)
    4.  `gitnexus-debugging`: Context-aware bug hunting using call chains. (`gitnexus/skills/gitnexus-debugging.md`)
    5.  `gitnexus-pr-review`: Structural review of Pull Requests. (`gitnexus/skills/gitnexus-pr-review.md`)
*   **Used Skills (by the system):**
    *   `skill-gen`: Automated generation of MCP skill definitions from code patterns. (`gitnexus/src/cli/skill-gen.ts`)

## 12. Data Inputs, Outputs, and Storage
*   **Inputs:**
    *   Source Code (Filesystem/Git).
    *   Git Logs (via `git log`).
    *   User Configuration (`.env`, `gitnexus.json`).
*   **Outputs:**
    *   Knowledge Graph (stored as JSON/LBUG files).
    *   Markdown Context Files (`AGENTS.md`, `CLAUDE.md`).
    *   HTML/Markdown Wiki.
    *   MCP Tool Results (JSON).
*   **Storage:**
    *   **Local Filesystem:** Stored in `~/.gitnexus/` or `.gitnexus/` relative to repo.
    *   **Graph Format:** LBUG (Lightweight Binary Unified Graph) or JSON.
    *   *Reference:* `gitnexus/src/storage/repo-manager.ts`, `gitnexus/src/core/lbug/csv-generator.ts`

## 13. Detailed Architecture Review
1.  **Pipeline (`gitnexus/src/core/ingestion/pipeline.ts`):** The orchestrator. Orchestrates the ingestion stages: Structure -> Parsing -> Imports -> Calls -> Heritage -> Communities.
2.  **KnowledgeGraph (`gitnexus/src/core/graph/graph.ts`):** The central state. In-memory graph with nodes (File, Class, Method, etc.) and edges (CONTAINS, CALLS, EXTENDS).
3.  **ParserLoader (`gitnexus/src/core/tree-sitter/parser-loader.ts`):** Dynamic loader for tree-sitter WASM/native parsers.
4.  **BindingAccumulator (`gitnexus/src/core/ingestion/binding-accumulator.ts`):** Monorepo-wide symbol registry for cross-file type resolution.
5.  **TypeEnv (`gitnexus/src/core/ingestion/type-env.ts`):** Local scope manager for tracking variable assignments and types during a single file walk.
6.  **CallProcessor (`gitnexus/src/core/ingestion/call-processor.ts`):** The "brain" of the resolver. Connects `call_expression` nodes to their likely definitions.
7.  **HeritageMap (`gitnexus/src/core/ingestion/heritage-map.ts`):** Maintains the global inheritance tree.
8.  **WorkerPool (`gitnexus/src/core/ingestion/workers/worker-pool.ts`):** Manages a cluster of worker threads for CPU-intensive parsing.
9.  **MCPServer (`gitnexus/src/mcp/server.ts`):** Implements the Model Context Protocol, exposing graph tools to LLMs.
10. **AnalyzeWorker (`gitnexus/src/server/analyze-worker.ts`):** Offloads indexing tasks from the main server process.
11. **EmbeddingPipeline (`gitnexus/src/core/embeddings/embedding-pipeline.ts`):** Batches code snippets for vectorization.
12. **HybridSearch (`gitnexus/src/core/search/hybrid-search.ts`):** Combines keyword (BM25) and semantic (Vector) search.
13. **WikiGenerator (`gitnexus/src/core/wiki/generator.ts`):** Uses LLMs to synthesize documentation from graph patterns.
14. **CobolProcessor (`gitnexus/src/core/ingestion/cobol-processor.ts`):** Specialized logic for COBOL Copybooks and JCL steps.
15. **RepoManager (`gitnexus/src/storage/repo-manager.ts`):** Handles indexing state, metadata, and path resolution.

## 14. Architecture Diagram (Mermaid)
```mermaid
graph TD
    subgraph CLI/MCP Layer
        CLI[GitNexus CLI]
        MCP[MCP Server]
        SkillGen[Skill Generator]
    end

    subgraph Ingestion Pipeline
        Pipeline[Orchestrator]
        FS[Filesystem Walker]
        WorkerPool[Worker Pool]
        TreeSitter[Tree-Sitter Parsers]
    end

    subgraph Analysis Engine
        BA[Binding Accumulator]
        CallProc[Call Processor]
        Heritage[Heritage Map]
        MRO[MRO Processor]
        Comm[Community Processor]
    end

    subgraph Data Store
        KG[Knowledge Graph]
        Embed[Embedding Index]
        LBUG[LBUG Storage]
    end

    CLI --> Pipeline
    MCP --> KG
    Pipeline --> FS
    FS --> WorkerPool
    WorkerPool --> TreeSitter
    TreeSitter --> BA
    BA --> CallProc
    CallProc --> KG
    Heritage --> KG
    MRO --> CallProc
    Comm --> KG
    KG --> LBUG
    Embed --> Data Store
    SkillGen --> MCP
```

## 15. Maturity, Stability, Security, Performance
*   **Maturity:** Highly mature for the AI-agent niche. It has survived multiple refactors to support 15+ languages and complex type systems.
*   **Stability:** High. Extensive use of unit and integration tests (especially for language resolvers) ensures reliability.
*   **Security:** Improving. Recent commits focus on securing `git-clone` and API endpoints. Local-first architecture minimizes data leakage.
*   **Performance:** Optimized for speed via topological parallel parsing and AST caching. Memory management for massive repos is an active area of refinement.

## 16. Review of Ecosystem
*   **Tests:** Robust suite of unit, integration, and E2E tests (`gitnexus/test`, `gitnexus-web/test`).
*   **CI Pipelines:** Comprehensive GitHub Actions for quality, tests, and reporting (`.github/workflows/`).
*   **Documentation:** Good high-level docs (README, ARCHITECTURE, AGENTS), though some internal module docs could be improved.
*   **AI Skills:** Well-defined skills for core agent tasks.

## 17. Top 20 Possible Improvements
1.  **Live Indexing:** Implement a "watch" mode for real-time graph updates.
2.  **Language Server Protocol (LSP) Integration:** Use LSP data to augment tree-sitter extraction.
3.  **Generalized Cross-File Propagation:** Allow inferred types to flow between files.
4.  **Method Overload Node Splitting:** Give unique IDs to overloaded methods.
5.  **Python Instance Attribute Tracking:** Support `self.x` in `TypeEnv`.
6.  **Improved Swift Optional Handling:** Full support for complex Swift patterns.
7.  **Graph Database Export:** Support exporting to Neo4j or KuzuDB for advanced querying.
8.  **Automated Dependency Pruning:** Remove unused nodes from the graph.
9.  **Enhanced Community Descriptions:** Use LLMs to describe identified clusters.
10. **Collaborative Graph Editing:** Allow multiple users to annotate the graph.
11. **Browser Worker Support:** Move ingestion to Web Workers in `gitnexus-web`.
12. **Native Mobile App:** For on-the-go codebase exploration.
13. **Voice Control:** Add voice-to-Cypher querying capabilities.
14. **CI Impact Reports:** Automatically post impact analysis as PR comments.
15. **Code Style Enforcement:** Use graph patterns to detect style violations.
16. **Security Vulnerability Mapping:** Link CVEs to specific graph nodes.
17. **Custom Extraction DSL:** Allow users to define new relationships via a simple config.
18. **Better COBOL Data-Flow:** Track field-level dependencies in mainframes.
19. **Next.js Server Component Support:** Deepen routing extraction for RSC.
20. **Self-Healing Index:** Automatically retry failed files with different parser configurations.

## 18. Reuse for "Agent Swarm" (Graph & Knowledge)
1.  **KnowledgeGraph (`gitnexus/src/core/graph/graph.ts`):** Ideal as the shared blackboard for agents to debate.
2.  **HybridSearch (`gitnexus/src/core/search/hybrid-search.ts`):** For agents to find relevant previous "debates" or solutions.
3.  **WikiGenerator (`gitnexus/src/core/wiki/generator.ts`):** To synthesize the final debate outcome into a spec.
4.  **SkillGen (`gitnexus/src/cli/skill-gen.ts`):** To automatically create tools for agents based on the debate's conclusions.
5.  **AnalyzeWorker (`gitnexus/src/server/analyze-worker.ts`):** To offload complex reasoning tasks to background agents.
6.  **BindingAccumulator:** For tracking "intent" bindings across agent messages.
7.  **CommunityProcessor:** To group related agent sub-tasks.
8.  **Eval Framework (`eval/`):** To benchmark which agent/model combination performed best on a given task.
9.  **Mermaid Generator:** For visualizing the agent swarm's decision tree.
10. **MCP Core:** As the communication protocol between agents in the swarm.

## 19. Reuse for "Multi-User Shared Knowledge"
1.  **LBUG Adapter (`gitnexus/src/core/lbug/lbug-adapter.ts`):** Efficient binary format for sharing large graphs across users.
2.  **RepoManager (`gitnexus/src/storage/repo-manager.ts`):** To manage different users' "views" or "branches" of the knowledge.
3.  **AnalyzeJob (`gitnexus/src/server/analyze-job.ts`):** Queuing system for multi-user ingestion requests.
4.  **API Layer (`gitnexus/src/server/api.ts`):** Foundation for a multi-user web service.
5.  **Sigma.js Integration:** Collaborative visualization of the shared graph.
6.  **MarkdownProcessor:** To ingest user-contributed documentation into the graph.
7.  **Staleness Tracking:** To manage knowledge evolution as users commit code.
8.  **Vercel Config:** For global deployment of the shared system.
9.  **JWT/Auth Logic (Needs adding):** But the API structure is ready.
10. **Local Storage Persistence:** For per-user UI preferences.

## 20. Reuse for "Omnichannel Agent" (Hardware/Cloud/Messenger)
1.  **MCPServer:** Foundation for connecting to Telegram/WhatsApp bots (via MCP bridges).
2.  **Docker Evaluation:** For running agents safely on own hardware.
3.  **Vercel/Cloudflare Workers Support:** The `gitnexus-web` and `gitnexus-shared` packages are lightweight enough for edge.
4.  **CLI Core:** For the "cli" channel.
5.  **Sigma.js Visualizer:** For the "web/native app" channels.
6.  **TextGenerator (`gitnexus/src/core/embeddings/text-generator.ts`):** To prepare graph data for voice synthesizers (TTS).
7.  **HybridSearch:** For quick "voice search" across the codebase.
8.  **AnalyzeWorker:** As the "cloud-side" brain for lightweight messenger clients.
9.  **LBUG format:** For fast data transfer to mobile apps.
10. **Skill Definitions:** Portable across all channels (Messenger, CLI, Web).

## 21. Reuse for "Team Agents" (Cooperative Workflows)
1.  **CLAUDE.md / AGENTS.md Generator:** Provides the "Team Rules" and "Context" for both humans and agents.
2.  **Impact Analysis Skill:** Facilitates cooperative review of breaking changes.
3.  **HeritageMap:** Helps team members (human and agent) understand system architecture.
4.  **Community Processor:** Helps assign sub-tasks to specific sub-agents or team members based on module boundaries.
5.  **Wiki Generator:** Cooperative documentation building.
6.  **MCP Tools:** Standardized interface for humans to trigger agent actions.
7.  **Staleness Tracking:** Coordinates team efforts around the latest code state.
8.  **PR Review Skill:** The ultimate human-agent cooperative workflow.
9.  **SymbolTable:** Shared source of truth for the entire team.
10. **Fixpoint Loop Pattern:** Cooperative "refinement" of ideas until convergence.
