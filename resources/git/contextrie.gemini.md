I will start by reading the instructions in `.prompt.md` and the input content in `.input.contextrie.xml` to understand the task.
I will now analyze the codebase to extract the information required for the 22 points listed in the prompt. I have a good overview of the project structure and some key files from the initial `read_file` output, but I need to read the rest of the merged input file to get a complete picture, especially for the later sections of the repository which were truncated.

I will start by reading the remaining part of `.input.contextrie.xml`. Since it was 4045 lines and I saw the first 2000, I will read from 2001 to 4045.

Wait, the prompt says "Analyze repo export from input file referenced in <InputFileName/> tag". I've read the first 2000 lines. Let's read the rest.

Actually, I should also look at the `git log` if it's in the input file to get the project name and last commit date. It was mentioned in the notes that 20 commits are included.

Let's read the rest of the input file.
I have read most of the input file and the git logs. I have enough information to start answering the 22 points. I will structure the response in Markdown as requested.

Here is my plan for each point:
1. **Project name and last commit date**: Contextrie, 2026-04-03 17:25:28 +0200.
2. **3 paragraphs of description**: Focus on context curation for AI agents, multi-package structure (core, cli, parsers, python, coding-agent), and the goal of keeping agents sharp by managing context.
3. **Supported platforms/deployments + requirements**: Node.js (Bun), Python 3.10+, CLI (npm), SvelteKit for docs.
4. **Supported connectors**: File system (local files), OpenAI API (compatible providers). References: `cli/index.ts`, `parsers/sources/files/*`.
5. **Supported models/agents**: OpenAI, compatible APIs. Agents: `IndexingAgent`, `JudgeAgent`, `ComposerAgent`. References: `core/agents/*`.
6. **Top 5 use cases**: Context curation for long-running agents, repo indexing, task-specific context generation, coding agent harness, multi-language agent support (TS/Python).
7. **Top 20 features**: Indexing, shallow/deep judging, context composition, file parsing (CSV, MD, TXT), CLI interface, lazy source resolution, etc.
8. **Top 20 smart patterns**: Shallow/deep judgment split, "thin core" philosophy, fluent agent APIs, source kind discriminators, lazy content resolution, etc.
9. **Top 20 development trends**: Focus on `coding-agent` recently, task scaffolding, filesystem utilities, progress tracking, explicit naming, etc.
10. **Top 10 advantages**: Small core, composable, multi-language, handles large context efficiently, extensible parsers, etc.
11. **Top 10 limitations**: Early development, limited parsers, focus on text/code, no built-in storage, breaking changes expected, etc.
12. **Top 5 used and provided AI skills**: Not explicitly mentioned as "skills" in the common sense, but `Indexing`, `Judging`, `Composing` are the core "skills".
13. **Data inputs, outputs, storage**: Inputs: files (.ts, .js, .csv, .md, .txt), Outputs: `.contextrie/sources.json`, `.contextrie/context.md`. Storage: JSON manifest.
14. **Detailed architecture review**: Core, Parsers, CLI, Coding Agent, Python. Relations between them.
15. **Mermaid graph**: Create one based on the structure.
16. **Review project maturity, stability, security, performance**: Early dev, alpha, focus on efficiency, no explicit security audit yet but minimal IO surface.
17. **Review tests, CI, docs, skills**: Bun tests, pytest, SvelteKit docs, core agents as skills.
18. **Top 20 improvements**: More parsers, better CLI error handling, persistent storage/cache, hosted docs, etc.
19. **Reusable for agent swarm**: `JudgeAgent` for best solution, `ComposerAgent` for synthesis.
20. **Reusable for shared KB**: `IndexingAgent` for evolving metadata, `ManifestSource` for shared views.
21. **Reusable for own hardware/cloud**: Python/TS core portability, `ReferenceSource` for remote data.
22. **Reusable for team agents**: `coding-agent` task lifecycle, `progress.md` for shared state.

I'll start writing the final response. I have enough information from the file contents.

One detail: the git log shows the last commit date as `2026-04-03`. The user prompt says today's date is `Wednesday, 15 April 2026`. I will use the date from the first `<git_log_commit/>` which is `2026-04-03 17:25:28 +0200`.

Wait, the prompt says "project name and last commit date (first <git_log_commit/> in input)".
The first `<git_log_commit/>` in the `git_logs` section of the input file is:
`<git_log_commit>
<date>2026-04-03 17:25:28 +0200</date>
<message>Add coding-agent lib id exports</message>
...
</git_log_commit>`

So project name is Contextrie, date is 2026-04-03.

I'll proceed to generate the report.# Contextrie Project Analysis

## 1. Project Name and Last Commit Date
*   **Project Name:** Contextrie
*   **Last Commit Date:** 2026-04-03 17:25:28 +0200

## 2. Project Description
Contextrie is a specialized context-engineering toolkit designed to keep long-running AI agents sharp by curating the specific information they carry forward. As agent systems scale and accumulate history, they often suffer from "context bloat," leading to loss of precision and increased token costs. Contextrie solves this by providing a structured pipeline to select, index, judge, and compose context for each specific task.

The project is architected as a modular ecosystem of small, composable packages. The `core` provides the fundamental contracts for sources and agents, while specialized packages like `parsers` handle file ingestion. It is designed to be used either as a library within custom agent systems or as a standalone CLI for local project indexing.

Contextrie supports multiple languages (TypeScript/Node and Python) and emphasizes a "thin core" philosophy. It delegates heavy lifting like parsing and IO to specialized adapters, ensuring that the core logic remains focused on the intelligence of context selection and synthesis.

## 3. Supported Platforms & Requirements
*   **TypeScript/Node.js:**
    *   Runtime: Bun (preferred) or Node.js (with ESM support).
    *   Requirements: `@ai-sdk/openai`, `zod`, `ai`.
    *   Source: `core/package.json`, `cli/package.json`.
*   **Python:**
    *   Runtime: Python 3.10 or higher.
    *   Requirements: `hatchling` (build), `pytest` (dev).
    *   Source: `python/pyproject.toml`.
*   **CLI:**
    *   Platform: Cross-platform (Windows, macOS, Linux) via Node/npm.
    *   Specific binary: Standalone macOS arm64 binary mentioned.
    *   Source: `cli/README.md`.
*   **Web/Docs:**
    *   Framework: SvelteKit / Vite.
    *   Source: `docs/package.json`.

## 4. Supported Connectors
*   **Local Filesystem:**
    *   **Text/Code:** `.ts`, `.js`, `.json`, `.yaml`, `.xml`, `.html`, `.css`, `.sh`, `.txt`. (Ref: `parsers/sources/files/text.ts`)
    *   **Markdown:** Parses `.md` into documents or list items. (Ref: `parsers/sources/files/markdown.ts`)
    *   **CSV:** Parses rows as list items. (Ref: `parsers/sources/files/csv.ts`)
*   **Language Models:**
    *   **OpenAI:** Default provider via Vercel AI SDK. (Ref: `cli/index.ts`)
    *   **OpenAI-Compatible:** Supports custom base URLs. (Ref: `cli/README.md`)
*   **Git:** Discovers files using `git ls-files`. (Ref: `cli/index.ts`)

## 5. Supported Models & Agents
*   **Models:** Supports any model compatible with Vercel AI SDK (TS) or a structured model protocol (Python). Primarily tested with OpenAI (e.g., `gpt-5.4`, `gpt-4.1-mini`).
*   **Agents:**
    *   **IndexingAgent:** Generates `title`, `description`, and `keypoints` for sources. (Ref: `core/agents/indexing/index.ts`)
    *   **JudgeAgent:** Scores source relevance (shallow or deep) against a task. (Ref: `core/agents/judge/index.ts`)
    *   **ComposerAgent:** Condenses judged sources into a tight context paragraph. (Ref: `core/agents/composer/index.ts`)

## 6. Top 5 Use Cases
1.  **Context Curation for Long-Running Agents:** Preventing performance degradation in agents by filtering out irrelevant historical or project data.
2.  **Repository Indexing:** Generating a lightweight searchable manifest of project files for AI assistance.
3.  **Task-Specific Context Generation:** Automatically assembling a `.contextrie/context.md` file tailored to a specific coding or analysis task.
4.  **Coding Agent Harness:** Scaffolding and managing the lifecycle of coding tasks (planned/draft status).
5.  **Multi-Language Agent Systems:** Providing a consistent context layer for agents written in either Python or TypeScript.

## 7. Top 20 Features
1.  **Dynamic Metadata Generation:** Automatic title/description/keypoint extraction. (`core/agents/indexing/index.ts`)
2.  **Shallow Judging:** Fast relevance scoring based on metadata. (`core/agents/judge/index.ts`)
3.  **Deep Judging:** Thorough relevance check using full content. (`core/agents/judge/index.ts`)
4.  **Context Composition:** Synthesis of multiple sources into one paragraph. (`core/agents/composer/index.ts`)
5.  **Multi-format Parsing:** Native support for CSV, MD, and code files. (`parsers/index.ts`)
6.  **Lazy Source Resolution:** `ReferenceDocumentSource` for on-demand loading. (`core/sources/reference-document.ts`)
7.  **Complex Document Support:** Section-based scoring for large docs. (`core/sources/complex-document.ts`)
8.  **CLI Indexing:** `--index --all` to scan entire repos. (`cli/index.ts`)
9.  **Task Management:** CLI commands for describing and bundling tasks. (`cli/README.md`)
10. **Configuration Persistence:** Local `.contextrie/config.json` for models/keys. (`cli/index.ts`)
11. **Git Integration:** Auto-discovery of tracked files. (`cli/index.ts`)
12. **Source ID Provenance:** Maintaining links back to original files. (`core/agents/composer/index.ts`)
13. **Adjustable Tightness:** Controlling the density of composed context. (`core/agents/composer/index.ts`)
14. **Markdown Export:** Final context output as standard Markdown. (`cli/index.ts`)
15. **Cross-Language Parity:** Mirrored Python and TS core logic. (`python/README.md`)
16. **Task Scaffolding:** Initializing `TASKS/` and `progress.md`. (`coding-agent/README.md`)
17. **Validation Logic:** Checking task file completeness and IDs. (`coding-agent/README.md`)
18. **Agent Delegation:** Prompt wrapping for external coding agents. (`coding-agent/README.md`)
19. **Progress Tracking:** Lightweight repo-native working memory. (`coding-agent/templates/progress.ts`)
20. **Standalone Binaries:** Distribution for macOS arm64. (`cli/package.json`)

## 8. Top 20 Smart Patterns
1.  **Shallow/Deep Judgment Split:** Optimizing speed vs. accuracy. (`core/agents/judge/README.md`)
2.  **Thin Core Philosophy:** Core package is IO-free and minimal. (`core/README.md`)
3.  **Fluent Agent APIs:** `agent.from(sources).run(task)` pattern. (`core/README.md`)
4.  **Source Kind Discriminators:** Standardized `kind` field for extensibility. (`core/types/source.ts`)
5.  **Draft State:** Sources without metadata are handled as "drafts". (`core/types/source.ts`)
6.  **Tightness Tuning:** Objective-based context density (e.g., "proof" vs "response"). (`core/agents/composer/index.ts`)
7.  **Lazy Content Resolution:** Delaying expensive IO until needed for deep judgment. (`core/sources/README.md`)
8.  **Sectional Contextrie:** Breaking large files into independently scoreable sections. (`core/sources/complex-document.ts`)
9.  **Prompt Wrapping:** Consistently wrapping task data for LLM consumption. (`coding-agent/README.md`)
10. **Repo-Native Memory:** Using `progress.md` instead of external databases. (`coding-agent/README.md`)
11. **Idempotent Scaffolding:** Safe initialization of harness structures. (`coding-agent/services/init.ts`)
12. **Structured Metadata Schema:** Using Zod for strict LLM output contracts. (`core/agents/indexing/index.ts`)
13. **Concurrent Processing:** Using `Promise.all` for parallel indexing/judging. (`core/agents/indexing/README.md`)
14. **Source ID Preserving:** Composer tracks exactly which sources contributed. (`core/agents/composer/index.ts`)
15. **Human-Readable IDs:** Using `human-id` for source identifiers. (`parsers/utils/index.ts`)
16. **Task Lifecycle States:** `draft -> todo -> doing -> done`. (`coding-agent/README.md`)
17. **Frontmatter as Database:** Storing task state in Markdown files. (`coding-agent/example-task.md`)
18. **Provider Agnostic Model Contract:** Simple `generate_object` interface. (`python/README.md`)
19. **Normalized Line Endings:** Handling platform differences in parsers. (`parsers/sources/files/csv.ts`)
20. **Recursive Sectioning:** Nested subsections for complex documents. (`core/sources/complex-document.ts`)

## 9. Top 20 Development Trends (Latest Commits)
1.  **Focus on Coding Agent:** Heavy activity in `coding-agent` package.
2.  **Task Infrastructure:** Implementation of task types and history.
3.  **Harness Initialization:** Adding `init` commands to the harness CLI.
4.  **Progress Tracking Templates:** Standardizing `progress.md` layout.
5.  **Explicit Naming:** Movement towards verbose, clear variable names.
6.  **Filesystem Utilities:** Consolidating IO operations in `lib/io.ts`.
7.  **Service Orchestration:** Focusing `services/` on high-level CLI logic.
8.  **Zod/Language Model Updates:** Keeping dependencies like `ai` and `zod` fresh.
9.  **Multi-Language Parity:** Ensuring Python core matches TypeScript updates.
10. **Documentation Scaffolding:** Building out the SvelteKit docs site.
11. **Benchmark Planning:** Defining evaluation protocols for agent workflows.
12. **Source ID Exporting:** Refining how composer outputs reference sources.
13. **Validation Refinement:** Improving task file validation logic.
14. **Barrel Export Stubs:** Preparing modular directory structures.
15. **Contributing Guidelines:** Updating per-package documentation rules.
16. **Prettier/Linting Setup:** Standardizing code style across the mono-repo.
17. **Bun Integration:** Strong bias towards Bun for development and testing.
18. **Alpha Release Hygiene:** Preparing for initial npm publishing.
19. **Source Path Propagation:** Ensuring file paths are carried through agents.
20. **Manifest versioning:** Implementing versioned source manifests (v1).

## 10. Top 10 Advantages
1.  **Lightweight:** Minimal overhead compared to full RAG systems.
2.  **Modular:** Use only what you need (core, parsers, cli).
3.  **Local-First:** Designed for repository-native workflows.
4.  **Multi-Language:** First-class support for both TS and Python.
5.  **Cost Efficient:** Reduces token usage by condensing context.
6.  **Extensible:** Easy to add new parsers or source types.
7.  **Transparent:** Sources always provide reasons for their scores.
8.  **Developer Friendly:** Standard CLI tools and NPM/PyPI packages.
9.  **Structured:** Uses strict JSON schemas for LLM interactions.
10. **Versatile:** Works for both simple Q&A and complex coding agents.

## 11. Top 10 Limitations
1.  **Early Development:** APIs are unstable and breaking changes are expected.
2.  **Limited Parsers:** Currently only supports TXT, MD, and CSV natively.
3.  **No Vector DB:** Relies on LLM judging rather than vector similarity (can be slower for massive sets).
4.  **Node/Python Bias:** Lacks native support for Go, Rust, etc.
5.  **Manual Syncing:** Requires re-indexing when files change (no auto-watch yet).
6.  **Dependency Heavy:** Requires OpenAI-compatible LLM for core agents.
7.  **Context Size Limits:** Still bounded by the model's total context window.
8.  **Minimal UI:** Primarily CLI and library-based; no official GUI.
9.  **IO Handling:** Library users must handle their own file reading/writing.
10. **Benchmark Maturity:** Evaluation harness is still in the "planned" phase.

## 12. Top 5 AI Skills
*   **Indexing:** Generating retrieval-oriented metadata. (`core/agents/indexing/index.ts`)
*   **Judging (Shallow):** Rapid relevance assessment. (`core/agents/judge/index.ts`)
*   **Judging (Deep):** High-precision content analysis. (`core/agents/judge/index.ts`)
*   **Composing:** Synthesis of disparate data into a coherent context. (`core/agents/composer/index.ts`)
*   **Task Scaffolding:** (Provided by Coding Agent) Planning and structuring work. (`coding-agent/README.md`)

## 13. Data Overview
*   **Inputs:** Local files, string arrays, raw text, async iterables. (Ref: `core/sources/index.ts`)
*   **Outputs:** `.contextrie/sources.json` (Manifest), `.contextrie/context.md` (Bundled Context). (Ref: `cli/README.md`)
*   **Storage:** Local JSON files for persistence; no external database required. (Ref: `cli/index.ts`)

## 14. Detailed Architecture Review
1.  **@contextrie/core:** The foundation. Defines `IndexedSourceBase` and the three core agents (`Indexing`, `Judge`, `Composer`). (Ref: `core/index.ts`)
2.  **@contextrie/parsers:** The ingestion layer. Converts files into `core` sources. (Ref: `parsers/index.ts`)
3.  **@contextrie/cli:** The user interface. Orchestrates parsers and agents to manage local context. (Ref: `cli/index.ts`)
4.  **coding-agent:** The workflow layer. Adds task management and agent delegation on top of context curation. (Ref: `coding-agent/README.md`)
5.  **Python Core:** Mirror of `@contextrie/core` for the Python ecosystem. (Ref: `python/src/contextrie/`)
6.  **Sources:** Concrete implementations like `DocumentSource`, `ListSource`, `ReferenceDocumentSource`. (Ref: `core/sources/`)
7.  **Metadata:** Standardized schema (`title`, `description`, `keypoints`) used for shallow retrieval. (Ref: `core/types/source.ts`)
8.  **Manifest:** A JSON record of indexed sources to avoid re-processing. (Ref: `cli/index.ts`)

## 15. Architecture Graph
```mermaid
graph TD
    User([User/Agent]) --> CLI[@contextrie/cli]
    CLI --> Parsers[@contextrie/parsers]
    CLI --> Core[@contextrie/core]
    
    subgraph Core Packages
        Core --> IndexingAgent
        Core --> JudgeAgent
        Core --> ComposerAgent
        Core --> Sources[Sources: Doc, List, Ref]
    end
    
    subgraph Workflow Layer
        Harness[coding-agent] --> Core
        Harness --> TaskFiles[TASKS/*.md]
        Harness --> Progress[progress.md]
    end
    
    subgraph Data
        Parsers --> FileSystem[(File System)]
        CLI --> SourcesJSON[.contextrie/sources.json]
        CLI --> ContextMD[.contextrie/context.md]
    end
    
    subgraph External
        IndexingAgent --> LLM((LLM API))
        JudgeAgent --> LLM
        ComposerAgent --> LLM
    end
    
    PythonCore[python core] --mirrors-- Core
```

## 16. Project Maturity Review
*   **Stability:** Low (Early development/Alpha).
*   **Security:** High (Minimal surface, local-first, no persistent server).
*   **Performance:** Optimized for token efficiency and "thin" processing; utilizes shallow judging to avoid redundant full-file reads.
*   **Maturity:** Prototype/Early Stage.

## 17. Project Components Review
*   **Tests:** Good coverage for core logic (Bun test for TS, Pytest for Python). (Ref: `core/package.json`, `python/tests/`)
*   **CI Pipelines:** Mentioned in `README` but implementation details are minimal in the provided export.
*   **Documentation:** Active work on SvelteKit docs; READMEs for each package are high-quality. (Ref: `docs/`)
*   **AI Skills:** Well-defined core agents serving as functional "skills".

## 18. Top 20 Possible Improvements
1.  **Watcher Mode:** Auto-reindex on file changes. (`cli/index.ts`)
2.  **More Parsers:** PDF, HTML, JSON, etc. (`parsers/index.ts`)
3.  **Vector Search Integration:** Optional hybrid retrieval. (`core/agents/judge/index.ts`)
4.  **Enhanced Task UI:** A TUI or Web UI for task management. (`coding-agent/README.md`)
5.  **Multi-Model Support:** Support for local models (Ollama, etc.). (`cli/index.ts`)
6.  **Incremental Indexing:** Only re-index modified lines/sections. (`core/agents/indexing/index.ts`)
7.  **Semantic Chunking:** Smarter sectioning for `ComplexDocumentSource`. (`core/sources/complex-document.ts`)
8.  **Persistent Cache:** Shared cache across projects. (`cli/index.ts`)
9.  **Agent Feedback Loop:** Scoring composer quality to refine prompts. (`core/agents/composer/index.ts`)
10. **Telemetry:** Optional token tracking and cost estimation. (`cli/README.md`)
11. **Browser Extension:** Curate context from web pages. (`core/sources/README.md`)
12. **Native Binaries:** Fully compiled binaries for all major platforms. (`cli/package.json`)
13. **Plugin System:** Third-party parsers and agents. (`parsers/index.ts`)
14. **Graph Visualization:** Visualize source relationships. (`docs/src/routes/`)
15. **Collaborative Mode:** Shared `.contextrie/` for teams. (`cli/README.md`)
16. **Voice Interface:** Voice-to-task commands. (`cli/README.md`)
17. **Refined Scoring:** More granular scores (e.g., 1-10 instead of 0-1). (`core/agents/judge/types.ts`)
18. **Conflict Resolution:** Managing multiple versions of task files. (`coding-agent/types/task.ts`)
19. **Commit Hook:** Auto-update `progress.md` on git commit. (`coding-agent/README.md`)
20. **Hosted Documentation:** Finalizing and deploying the docs site. (`docs/README.md`)

## 19. Reuse for Agent Swarm Debating
1.  **JudgeAgent:** Evaluating competing solution specifications. (`core/agents/judge/index.ts`)
2.  **ComposerAgent:** Synthesizing the "best of" from multiple agent proposals. (`core/agents/composer/index.ts`)
3.  **JudgeTask objective="proof":** Validating evidence for a specific implementation plan. (`core/agents/judge/types.ts`)
4.  **ComplexDocumentSource:** Breaking down complex specs into debateable sections. (`core/sources/complex-document.ts`)
5.  **Metadata Schema:** Standardizing how agents "summarize" their arguments. (`core/types/source.ts`)
6.  **ReferenceDocumentSource:** Dynamically fetching live status or logs for debate context. (`core/sources/reference-document.ts`)
7.  **Task LifeCycle (Draft -> Todo):** Managing the state of the debate. (`coding-agent/README.md`)
8.  **Zod-based output:** Ensuring debate results are machine-readable. (`core/agents/judge/index.ts`)
9.  **Source ID Provenance:** Tracking which agent said what. (`core/agents/composer/index.ts`)
10. **Fluent API:** Easily chaining agent turns. (`core/README.md`)

## 20. Reuse for Multi-User/Multi-Agent Shared KB
1.  **ManifestSource:** Sharing a common view of indexed assets. (`core/sources/manifest.ts`)
2.  **IndexingAgent:** Continuously updating metadata as knowledge evolves. (`core/agents/indexing/index.ts`)
3.  **progress.md template:** Shared working memory for concurrent work. (`coding-agent/templates/progress.ts`)
4.  **Source IDs:** Stable references for cross-agent discussion. (`core/types/source.ts`)
5.  **Metadata `keypoints`:** Building a tag-based knowledge map. (`core/types/source.ts`)
6.  **ReferenceListSource:** Dynamic feeds of shared interactions. (`core/sources/reference-list.ts`)
7.  **Task frontmatter:** Storing ownership and status in a multi-user environment. (`coding-agent/example-task.md`)
8.  **Parsers:** Consistent ingestion of user-contributed markdown/CSV. (`parsers/index.ts`)
9.  **Shallow Judging:** Quickly filtering a massive shared KB. (`core/agents/judge/index.ts`)
10. **Thin Core:** Portability across different users' local environments. (`core/README.md`)

## 21. Reuse for Agent Hardware/Cloud/Messenger
1.  **Python Core:** Running on constrained edge hardware (RPi, etc.). (`python/`)
2.  **ReferenceDocumentSource:** Fetching data from remote APIs (Cloudflare Workers, etc.). (`core/sources/reference-document.ts`)
3.  **ComposerAgent:** Generating short, messenger-friendly summaries. (`core/agents/composer/index.ts`)
4.  **CLI Interface:** Serving as a base for bot command handling. (`cli/index.ts`)
5.  **Lazy Resolution:** Avoiding high memory usage on small devices. (`core/sources/README.md`)
6.  **Human-Readable IDs:** Easier for users to type in messengers/CLI. (`parsers/utils/index.ts`)
7.  **Structured Model Protocol:** Adapting to various cloud LLM endpoints. (`python/src/contextrie/types/model.py`)
8.  **Zod schemas:** Validating input from unpredictable web/messenger sources. (`core/agents/judge/index.ts`)
9.  **Markdown output:** Native rendering in Telegram/WhatsApp/Teams. (`cli/README.md`)
10. **Progress Template:** Maintaining session state across stateless messenger calls. (`coding-agent/templates/progress.ts`)

## 22. Reuse for Team Agents Cooperative Workflows
1.  **coding-agent task lifecycle:** Managing handoffs between humans and agents. (`coding-agent/README.md`)
2.  **Task history entries:** Auditing who did what (human or agent). (`coding-agent/types/task.ts`)
3.  **Acceptance Criteria:** Standardizing how work is validated by QA agents. (`coding-agent/types/task.ts`)
4.  **progress.md:** Centralized status dashboard for the whole team. (`coding-agent/templates/progress.ts`)
5.  **Agent delegation prompt:** Ensuring agents understand their role in the team. (`coding-agent/README.md`)
6.  **JudgeAgent relevance reasons:** Explaining to humans why certain context was selected. (`core/agents/judge/index.ts`)
7.  **Metadata `title` and `description`:** Making it easier for humans to find shared resources. (`core/types/source.ts`)
8.  **Contributing Guidelines:** Codifying team conventions for both human and AI. (`CONTRIBUTING.md`)
9.  **Scaffolding logic:** Reducing friction for teams starting new tasks. (`coding-agent/services/init.ts`)
10. **Source Path Handling:** Keeping everyone (humans/agents) on the same page regarding file locations. (`parsers/README.md`)
