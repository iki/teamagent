I will start by reading the instructions in `.prompt.md` to understand the required processing for `commonplace.xml`.
I'll begin by reading the first part of `commonplace.xml` to understand its structure and content.
I've identified that the project is an agentic knowledge base called "commonplace," focused on context engineering and autonomous knowledge management. To provide the detailed analysis requested, I'll now search for the content of `README.md`, `AGENTS.md`, and other key documentation within `commonplace.xml`.
I'll start by reading `README.md` to get a comprehensive overview of the project.
I've gathered significant information on Commonplace, its purpose as an agent-operated knowledge base, its core features like the skill and type systems, and its "title as claim" philosophy. To complete the analysis, I'll now examine the git logs for development trends and explore the `src/` directory and `AGENTS.md` to detail the architecture and identify components for reuse in various agentic scenarios.
I've gained a comprehensive understanding of Commonplace as an agent-operated knowledge base framework that emphasizes inspectable artifacts, "files, not database," and "Title as claim" philosophies. I've also identified its core platforms, requirements, and connectors like `commonplace-snapshot-web`. To round out the analysis, I'll now examine the `src/` directory for architectural details and search for the 20 git commits included in the XML to identify recent development trends.
I'll re-read the `<file_summary>` and search for "commit" to locate the 20 git logs mentioned, as they aren't in a `<git_log>` tag despite being included for development patterns.
I'll check the last 1000 lines of `commonplace.xml` to see if the git logs are located there.
I've analyzed the recent git logs and identified key development trends, including frontmatter parsing simplification, stricter note title enforcement, and a significant refactoring of the review system towards centralization and stability. I've also noted the promotion of local procedures to skills and a general move towards cleaner, shared logic in CLI commands. I'll now examine `src/commonplace/` and the `skills/` directory to finalize the details on supported connectors and AI skills for my report.
The `src/commonplace/` directory in the `commonplace.xml` repo export contains the packaged operational engine, including CLI commands, review system modules, shared helpers, and documentation assets. I'll now use `grep_search` to list the specific files within this structure.
I've located several key files in `src/commonplace/`, including `github_snapshot.py` and `x_snapshot.py`, and will now search the `skills/` directory to complete my understanding of the system's capabilities.
I've identified the core skills and will now search `kb/instructions/` to uncover any additional repo-local AI skills.
I've gathered all the necessary information to address the 21 points, from project overview and requirements to architectural details and future improvements. I've also identified the core development trends and smart patterns that define Commonplace. I'll now double-check for any Cloudflare Workers references before I finalize the comprehensive response, including the Mermaid architecture graph.
I've confirmed that "Cloudflare" is mentioned in the context of `tracecraft`, a related system reviewed within the KB, rather than being natively supported by Commonplace. I'm now fully prepared to compile the detailed report, highlighting Commonplace's strengths and its potential for reuse in various agentic and cloud-based scenarios.# Commonplace: Agent-Operated Knowledge Base Framework

## 1. Project Name and Description

**Commonplace** is a framework and methodology for building agent-operated knowledge bases (KBs), specifically designed for the era of AI agents (like Claude Code and Codex). It serves as a living laboratory for "context engineering"—the art and science of getting the right knowledge into an agent's context window at the right time. Unlike traditional wikis meant for human eyes, Commonplace is built for agents to read, write, and maintain.

The system is founded on a "files, not database" philosophy, using standard Markdown files with YAML frontmatter. This ensures universal accessibility, versioning through Git, and zero infrastructure overhead. The project uses its own methodology to document itself, meaning the KB contains the very theory and design patterns (type systems, linking conventions, and review gates) used to operate it.

The workflow is driven by "framework skills"—specialized instructions installed directly into agent runtimes. These skills externalize the methodology, allowing agents to perform complex tasks like connection discovery, iterative refinement, and multi-lens quality reviews without cluttering their internal reasoning space. The ultimate goal is to create a dense, high-quality knowledge graph where every link is an articulated relationship and every title is a verifiable claim.

---

## 2. Supported Platforms, Deployments & Requirements

### Platforms/Deployments
- **Local Development:** Direct clone and use via CLI (recommended).
- **Python Package:** `llm-commonplace` (installable via `uv` or `pip`).
- **Agent Runtimes:** Deeply integrated with **Claude Code** and **Codex** through the `.claude/skills/` and `.agents/skills/` directories.
- **Static Documentation:** Supports **MkDocs** for rendering the KB as a searchable website.

### Requirements
- **OS:** Windows (win32), macOS, Linux.
- **Runtime:** **Python 3.10+** (managed via `uv` is preferred).
- **Version Control:** **Git** (required for history-preserving operations and versioning).
- **Search Engine:** **ripgrep (`rg`)** for fast structured search.
- **Utilities:** `curl` (for PDF downloads), `gh` CLI (optional, for GitHub snapshots).
- **Semantic Search:** **`qmd`** (optional but highly recommended for hybrid BM25 + vector search).

---

## 3. Supported Connectors (Apps/APIs/Messengers)

| Connector | Description | Source Reference |
|---|---|---|
| **Web Snapshots** | Captures any URL to clean Markdown using `curl` and custom parsers. | `src/commonplace/cli/snapshot_web.py`, `skills/snapshot-web/SKILL.md` |
| **GitHub** | Specialized ingestion of GitHub issues, PRs, and repository metadata. | `src/commonplace/cli/github_snapshot.py` |
| **X (Twitter)** | Captures and cleans threads and individual posts from X. | `src/commonplace/cli/x_snapshot.py` |
| **PDF Ingest** | Downloads and processes PDF files via `curl` for inclusion in the KB. | `skills/snapshot-web/SKILL.md` |
| **S3/R2 (via Tracecraft)** | While not native to the core, the reviewed `tracecraft` pattern shows S3/R2 integration. | `kb/notes/related-systems/tracecraft.md` |

---

## 4. Supported Models and Agents

| Model/Agent | Integration Type | Source Reference |
|---|---|---|
| **Claude (Sonnet/Opus)** | Native runtime via Claude Code; primary target for skills. | `skills/connect/SKILL.md`, `AGENTS.md` |
| **Codex** | Native runtime for various agent implementations. | `AGENTS.md`, `.agents/skills/` |
| **ChatGPT (GPT-4o)** | Mentioned as a collaborator for drafting and analysis. | `README.md` |
| **Local LLMs** | Supported via any CLI-based runner that can invoke the `commonplace` package. | `src/commonplace/review/review_model.py` |

---

## 5. Top 5 Use Cases and Workflows

1.  **Autonomous Knowledge Ingestion:**
    *   *Workflow:* Agent snapshots a URL → `commonplace-ingest` triggers → analysis report generated → note drafted in `kb/notes/` → `commonplace-connect` finds links to existing theory.
2.  **Continuous Architecture Review (ADRs):**
    *   *Workflow:* Human/Agent identifies a design gap → ADR drafted in `kb/notes/adr/` → `commonplace-validate` checks for structural integrity → ADR is linked from the `architecture-index`.
3.  **Iterative Theory Refinement:**
    *   *Workflow:* Low-quality `text` capture → `commonplace-convert` promotes to `note` with description → `commonplace-revise-iterative` improves prose without altering core claims.
4.  **Multi-Lens Quality Gating:**
    *   *Workflow:* `commonplace-review` runs a bundle of "gates" (Semantic, Prose, Structural) → results stored in SQLite → Agent triages warnings and applies fixes to Markdown files.
5.  **Project-Specific Methodology Sync:**
    *   *Workflow:* `commonplace-init` installs framework skills into a new project → Project creates its own `AGENTS.md` → Project inherits global writing standards while defining local types.

---

## 6. Top 20 Features

| Feature | Description | Source Reference |
|---|---|---|
| **Skill System** | Framework-level instructions for agent runtimes. | `skills/` |
| **Type System** | Verifiable structural expectations (`note`, `structured-claim`). | `kb/notes/types/`, `kb/notes/why-notes-have-types.md` |
| **Title-as-Claim** | Titles are propositions, enabling traversal as reasoning. | `kb/notes/title-as-claim-enables-traversal-as-reasoning.md` |
| **Progressive Refinement** | Start as `text`, earn structure over time. | `kb/notes/wikiwiki-principle-lowest-friction-capture-then-progressive-refinement.md` |
| **Connect Skill** | Multi-phase discovery (Grep + Semantic + Topic Index). | `skills/connect/SKILL.md` |
| **Review Gates** | Decoupled, checkable properties of documents. | `kb/instructions/review-gates/` |
| **SQLite Review DB** | Tracks operational metadata for reviews at scale. | `src/commonplace/review/review_db.py` |
| **Workshop Layer** | Ephemeral space for work-in-flight. | `kb/notes/a-functioning-kb-needs-a-workshop-layer-not-just-a-library.md` |
| **Semantic Search** | Hybrid search via `qmd` integration. | `README.md`, `skills/connect/SKILL.md` |
| **Validation CLI** | Frontmatter and link checking. | `src/commonplace/cli/validate_notes.py` |
| **Iterative Revision** | Skill for prose cleanup without claim drift. | `skills/revise-iterative/SKILL.md` |
| **Automated Indexing** | Scripted generation of directory-level indexes. | `src/commonplace/cli/generate_notes_index.py` |
| **Slug/Naming Helpers** | Standardized file naming across CLI commands. | `src/commonplace/lib/naming.py` |
| **Trait System** | Checkable properties like `has-comparison`. | `kb/notes/document-types-should-be-verifiable.md` |
| **Seedling Status** | Provisional commitment tracking. | `kb/notes/document-classification.md` |
| **Source Tracking** | Snapshotted external sources with analysis. | `kb/sources/` |
| **ADR Sub-type** | Built-in support for Architectural Decision Records. | `kb/notes/adr/` |
| **Code Review Gates** | Instructions for simplifying frontmatter/logic. | `kb/instructions/code-simplification-review.md` |
| **Link Semantics** | Explicit link types (grounds, extends, contradicts). | `kb/notes/adr/009-link-relationship-semantics.md` |
| **Trace-Driven Discovery**| Recording query strings/scores for transparency. | `skills/connect/SKILL.md` |

---

## 7. Top 20 Smart Patterns

1.  **Title as Claim:** Makes the knowledge graph browsable as a logic tree. (`kb/notes/title-as-claim-enables-traversal-as-reasoning.md`)
2.  **Files, Not Database:** Git-native versioning and zero infra. (`kb/notes/files-not-database.md`)
3.  **Externalized Methodology:** Keep procedures in skills, not the agent's head. (`README.md`)
4.  **Earned Structure:** Only pay for complexity when the note maturity demands it. (`kb/notes/why-notes-have-types.md`)
5.  **Workshop vs. Library:** Separates transient work from accumulating value. (`kb/notes/a-functioning-kb-needs-a-workshop-layer-not-just-a-library.md`)
6.  **Discriminative Descriptions:** Descriptions focus on "Why this document?" for retrieval. (`kb/notes/kb-goals-in-always-loaded-context-guide-inclusion-decisions.md`)
7.  **Soft Degradation:** Systems (like `qmd`) fail gracefully to `grep`. (`README.md`)
8.  **Bounded Context Loading:** Only load the index before choosing what to read. (`kb/notes/agents-navigate-by-deciding-what-to-read-next.md`)
9.  **Distillation vs. Constraining:** Two axes of context engineering. (`kb/notes/constraining-and-distillation-both-trade-generality-for-reliability-speed-and-cost.md`)
10. **Agent-is-a-Tool-Loop:** Architecture treats agentic loops as primitive components. (`kb/notes/agent-is-a-tool-loop.md`)
11. **Codification:** Moving from natural language to code as the final step of maturity. (`kb/notes/definitions/codification.md`)
12. **Popperian Maintenance:** Claims remain until falsified or outdated. (`kb/notes/title-as-claim-exposes-commitments-enabling-popperian-maintenance.md`)
13. **Homiconic Context:** LLM context is a medium that contains its own instructions. (`kb/notes/llm-context-is-a-homoiconic-medium.md`)
14. **Silent Disambiguation:** Semantic analogue of a technical tool fallback. (`kb/notes/silent-disambiguation-is-the-semantic-analogue-of-tool-fallback.md`)
15. **YAGNI for Features:** Prioritize notes/theory over implementation. (`AGENTS.md`)
16. **Trait-Based Routing:** Review gates route based on traits like `has-comparison`. (`kb/notes/document-types-should-be-verifiable.md`)
17. **Link Contracts:** Explicitly defining what a link promises. (`kb/notes/adr/009-link-relationship-semantics.md`)
18. **Directory-Scoped Types:** Lower cost than global types for specialized areas. (`kb/notes/directory-scoped-types-are-cheaper-than-global-types.md`)
19. **Unit Testing Instructions:** Mocking the tool boundary for agents. (`kb/notes/unit-testing-llm-instructions-requires-mocking-the-tool-boundary.md`)
20. **Inspectable Substrate:** Defeats the "blackbox problem" via artifacts. (`kb/notes/inspectable-substrate-not-supervision-defeats-the-blackbox-problem.md`)

---

## 8. Top 20 Development Trends (Latest Commits)

1.  **Refactoring Review Lifecycle:** Centralizing review run creation and finalization.
2.  **Frontmatter Parsing Simplification:** Consolidating wrappers in `lib/frontmatter.py`.
3.  **Strict Writing Conventions:** Enforcing title length limits to prevent "prose bloat."
4.  **Decoupling Review Decisions:** Separating parsing logic from database operations.
5.  **Removing Legacy Archives:** Pruning CSV-based review reports in favor of SQLite.
6.  **Worktree Review Support:** Allowing reviews on uncommitted changes.
7.  **Promotion of Procedures to Skills:** Moving `review-related-system` from instruction to skill.
8.  **Shared Slug Helpers:** Standardizing how note paths are generated across CLI tools.
9.  **Simplifying DB Schema:** Removing runtime schema mutations for stability.
10. **Workshop-Driven Design:** Explicitly using `kb/work/` for major refactorings.
11. **Expansion of Related-System Reviews:** Deep dives into systems like EQUIPA and Virtual-Context.
12. **Code Simplification Focus:** Adding specific review gates for Python code quality.
13. **Removal of One-off Migrations:** Cleaning up the `src/commonplace/migrations/` folder.
14. **Instruction Unit Testing:** Refining how agents test their own procedures.
15. **Link Relationship Refinement:** Hardening the semantics of grounds/extends links.
16. **Improved Triage Workflows:** Streamlining how agents acknowledge minor changes.
17. **Semantic search parity:** Ensuring `grep` fallback matches `qmd` behavior where possible.
18. **MkDocs Integration:** Improving how KB internal structure renders for humans.
19. **Trait-driven review routing:** Making review gate selection more deterministic.
20. **YAGNI enforcement:** Actively pruning features that aren't proving their value.

---

## 9. Top 10 Advantages / Strong Points

1.  **Agent-First Design:** Optimized for LLM consumption/production, not human browsing.
2.  **Zero-Infrastructure Core:** Markdown files work everywhere; no DB server needed for library.
3.  **Low Friction Capture:** The `text` type allows for "vibe noting" without schema overhead.
4.  **Dense Knowledge Graph:** The `connect` skill ensures new knowledge is never orphaned.
5.  **Self-Documenting Methodology:** The repo's own KB is the manual for its use.
6.  **Modular Skill System:** Easily portable to other projects (via `commonplace-init`).
7.  **High Signal Search:** Discriminative descriptions prevent agents from reading irrelevant files.
8.  **Scalable Review System:** SQLite-backed review tracking handles thousands of quality checks.
9.  **Git-Native:** Versioning, branching, and history-preserving renames (via `relocate-note`).
10. **Hybrid Discovery:** Combines the strengths of `grep`, Semantic Search, and Topic Indexes.

---

## 10. Top 10 Limitations / Weak Points

1.  **Tool Dependency:** Hard requirement on `ripgrep` and `uv` for CLI functionality.
2.  **Manual Search Sync:** `qmd` index must be updated manually after edits.
3.  **High-End Model Reliance:** Discovery and Review skills perform best on expensive models (Opus).
4.  **Python 3.10+ Only:** Older Python environments are not supported.
5.  **No GUI:** Interaction is strictly CLI/Agent-based (human browsing requires MkDocs).
6.  **Experimental Review DB:** The SQLite dependency for reviews breaks the "pure files" rule.
7.  **Search Locality:** No built-in support for remote vector DBs or cloud-only KBs.
8.  **Complexity of Review System:** Triage and fixing of "gates" can be high-effort for humans.
9.  **No Native Real-Time Sync:** Lacks built-in multi-user real-time collaboration.
10. **Dependency on External Snapshotters:** Web snapshots rely on third-party parsers and services.

---

## 11. Top 5 Used and Top 5 Provided AI Skills

### Top 5 Framework (Used) Skills
1.  **`commonplace-write`**: Drafting notes with correct templates. (`skills/write/SKILL.md`)
2.  **`commonplace-connect`**: Finding relationships in the KB. (`skills/connect/SKILL.md`)
3.  **`commonplace-validate`**: Checking structural integrity. (`skills/validate/SKILL.md`)
4.  **`commonplace-ingest`**: Analyzing external sources. (`skills/ingest/SKILL.md`)
5.  **`commonplace-revise-iterative`**: Improving prose quality. (`skills/revise-iterative/SKILL.md`)

### Top 5 Repo-Local (Provided) Skills/Instructions
1.  **`review-related-system`**: Comparing external projects. (`kb/instructions/review-related-system/SKILL.md`)
2.  **`evaluate-scenarios`**: Measuring agentic methodology costs. (`kb/instructions/evaluate-scenarios/SKILL.md`)
3.  **`code-simplification-review`**: Logic cleanup guidance. (`kb/instructions/code-simplification-review.md`)
4.  **`maintain-curated-indexes`**: Managing topic hubs. (`kb/instructions/maintain-curated-indexes.md`)
5.  **`re-ingest`**: Updating stale source analysis. (`kb/instructions/re-ingest.md`)

---

## 12. Data Inputs, Outputs, and Storage Overview

-   **Inputs:**
    -   Web URLs (via `snapshot-web`)
    -   GitHub Issues/PRs
    -   X/Twitter threads
    -   Local Markdown files
    -   PDFs
-   **Outputs:**
    -   Markdown Notes (`kb/notes/*.md`)
    -   Connection Reports (`kb/work/connect/*.md`)
    -   Review Findings (warnings, triage status)
    -   MkDocs Site (HTML)
-   **Storage:**
    -   **Primary Library:** Flat Markdown files (Git-versioned).
    -   **Operational Metadata:** SQLite database (`commonplace-review.db`). (`src/commonplace/review/review_db.py`)
    -   **Semantic Index:** Local FAISS/Vector storage (via `qmd`).

---

## 13. Detailed Architecture Review

1.  **`src/commonplace/cli/`**: Entry points for all user/agent commands (init, validate, snapshot).
2.  **`src/commonplace/lib/note_parser.py`**: Robust parser for Markdown + YAML frontmatter.
3.  **`src/commonplace/lib/frontmatter.py`**: Low-level YAML extraction and injection logic.
4.  **`src/commonplace/lib/naming.py`**: Slugification and file naming conventions.
5.  **`src/commonplace/review/review_db.py`**: SQLite manager for review runs, gates, and warnings.
6.  **`src/commonplace/review/review_runners.py`**: Logic for executing review bundles on files.
7.  **`src/commonplace/review/warn_selector.py`**: Filters warnings for agent triage.
8.  **`src/commonplace/review/review_target_selector.py`**: Decides which files need review.
9.  **`src/commonplace/docs/`**: MkDocs documentation and library reference.
10. **`skills/`**: The "Agent Logic" layer, containing the prompts and workflows for core tasks.
11. **`kb/notes/types/`**: Schema definitions (`note.schema.yaml`) for structure enforcement.
12. **`kb/instructions/review-gates/`**: Atomic, checkable rules for quality (prose, semantic, structural).
13. **`test/`**: Pytest suite for core library and CLI commands.

---

## 14. Architecture Mermaid Graph

```mermaid
graph TD
    User([Agent / Human]) --> CLI[commonplace CLI]
    CLI --> Lib[src/commonplace/lib]
    CLI --> Review[src/commonplace/review]
    CLI --> Skills[skills/]

    subgraph "Storage Layer"
        KB[(kb/notes - Markdown Files)]
        Sources[(kb/sources - External Snapshots)]
        ReviewDB[(SQLite - Review Metadata)]
        Index[(qmd - Semantic Index)]
    end

    Lib --> KB
    Review --> ReviewDB
    Review --> KB
    Skills --> KB
    Skills --> Sources
    Skills --> Index

    subgraph "Skill Workflows"
        write[commonplace-write]
        connect[commonplace-connect]
        validate[commonplace-validate]
        ingest[commonplace-ingest]
    end

    Skills --- write
    Skills --- connect
    Skills --- validate
    Skills --- ingest
```

---

## 15. Maturity, Stability, Security, and Performance

-   **Maturity:** Research/Developer Preview. The core logic is stable, but the review system is undergoing rapid refactoring.
-   **Stability:** High for the data format (Markdown). High for core CLI tools. The SQLite schema is still evolving.
-   **Security:** High (strictly local operations). No remote APIs are called by default except for snapshots. No credentials stored in KB.
-   **Performance:** Excellent for ripgrep-based operations. Semantic search performance depends on local machine resources for `qmd`. Handles thousands of notes with sub-second search times.

---

## 16. Reviews (Tests, CI, Docs, Skills)

-   **Tests:** Good coverage of core library modules via `pytest`. Scenarios in `test/scenarios/` measure costs.
-   **CI/CD:** GitHub Actions (`pages.yml`) for documentation deployment.
-   **Documentation:** Comprehensive internal documentation in `README.md`, `AGENTS.md`, and `src/commonplace/docs/`.
-   **Used Skills:** Extensive use of "Framework Skills" for all core operations.
-   **Provided Skills:** Robust library of "Review Gates" and repo-local procedures.

---

## 17. Top 20 Possible Improvements / Fixes

1.  **GUI / Visualization Layer:** Obsidian-like graph view for humans.
2.  **Native Cloudflare R2 Support:** Move Review DB to a distributed storage layer.
3.  **Real-time Collaboration:** Conflict resolution for multi-agent/multi-human KBs.
4.  **Automatic Index Updates:** File-watcher to keep `qmd` index current.
5.  **Multi-Model Review Bundles:** Use different models for different review gates.
6.  **Improved Voice Control:** Native STT/TTS for note ingestion.
7.  **S3-Compatible Library Backend:** Allow `kb/` to live on R2/S3.
8.  **Automated Tagging:** LLM-based suggestion of tags based on note content.
9.  **Link Auto-Repair:** Automatically fix relative paths during note relocation.
10. **Enhanced PR Snapshotting:** Native integration with GitHub Actions for KB updates.
11. **Slack/Discord Connectors:** Ingest conversations directly.
12. **Performance Optimization for Review Sweeps:** Parallelize gate execution.
13. **Local Vector Search Parity:** Improve `grep` fallback accuracy.
14. **Type-Inferred Templates:** Automatically choose sub-type based on title content.
15. **Note Synthesis Skill:** Merge multiple "seedling" notes into a single claim.
16. **Constraint Solver for Links:** Prevent circular dependencies in logic chains.
17. **Improved PDF OCR:** Better processing for image-only PDFs.
18. **Mobile Companion App:** Quick capture for human "seedlings."
19. **Export to External Formats:** One-click publish to Wiki/Substack.
20. **Self-Healing Index:** Detect and remove broken links automatically.

---

## 18. Reuse for Agent Swarm (Graph Knowledge & Debates)

1.  **`commonplace-connect` methodology:** Used to find relevant "debate" context.
2.  **`structured-claim` type:** Ideal format for a "proposed solution" with Evidence/Reasoning.
3.  **Review Gates (Semantic Lens):** Use these as the "debate judge" oracles.
4.  **Title-as-Claim:** Allows the swarm to browse the graph of past decisions as a logic tree.
5.  **Workshop Layer:** Isolation space for agents to "argue" before committing to the Library.
6.  **`review_db.py`**: Track which agent proposed which fix and who reviewed it.
7.  **Link Semantics (Contradicts):** Explicitly modeling opposing viewpoints.
8.  **`note_parser.py`**: Universal interface for agents to read/write their arguments.
9.  **Status (Speculative):** Mark contested solutions until the swarm reaches consensus.
10. **Distillation patterns:** Compressing huge debate logs into a single ADR.

---

## 19. Reuse for Multi-User/Multi-Agent Shared KB

1.  **Files-not-database + Git:** Native multi-user version control and conflict handling.
2.  **Review Triage Workflow:** Assigning warnings to different agents/users for fixing.
3.  **Tag-based Indexes:** Dynamic navigation for different user interests.
4.  **`commonplace-init`:** Rapidly deploy the methodology into shared team repositories.
5.  **Trait-based routing:** Different teams can have different quality expectations (traits).
6.  **Seedling Status:** Clear signaling of what is "trusted" knowledge vs. "work in progress."
7.  **`commonplace-validate`**: Enforce shared standards across all contributors.
8.  **Slug/Naming Helpers:** Prevent file name collisions in a shared KB.
9.  **Frontmatter schemas:** Ensure metadata consistency across different agent implementations.
10. **Workshop/Library separation:** Prevents "messy" agentic experimentation from cluttering the shared core.

---

## 20. Reuse for Own Hardware / Cloud / Cloudflare Workers

1.  **Zero-Infrastructure Core:** Highly portable to Cloudflare Workers (via R2 storage).
2.  **Tracecraft pattern:** Using S3/R2 as the coordination and storage substrate.
3.  **Python CLI (Packaged):** Can be run on any local hardware (Raspberry Pi/Local Server).
4.  **`qmd` Search:** Can be self-hosted on a local hardware node for private semantic search.
5.  **SQLite Review DB:** Compatible with Cloudflare D1 for cloud-native review tracking.
6.  **Markdown Source:** Small footprint, ideal for limited hardware or edge workers.
7.  **`snapshot-web` (curl-based):** Low dependency, easy to run in containerized environments.
8.  **Link-based navigation:** Enables building lightweight graph visualizations on the edge.
9.  **Voice control reuse:** The `vibe-noting` pattern is a perfect target for voice-to-markdown.
10. **Messenger integration:** The CLI output (markdown) is easily formatted for Telegram/Teams bots.

---

## 21. Reuse for Team Agents (Cooperative Workflows)

1.  **Instruction-as-Skill:** Hand off complex procedures between agents via `skills/`.
2.  **ADRs for team alignment:** Structured reasoning for cross-agent decisions.
3.  **Review Triage (`warn_selector.py`):** Distribute quality cleanup tasks across a team.
4.  **`kb/log.md`**: Shared "one-line observation" feed for team-wide awareness.
5.  **`commonplace-init`**: Unified "installation" of team methodology into all agent tools.
6.  **Status tracking:** Unified view of commitment across human and agent work.
7.  **`kb/work/` workshops:** Dedicated rooms for cooperative task execution.
8.  **`commonplace-revise-iterative`**: Human-agent "pair writing" where agents refine human drafts.
9.  **Verifiable Types:** Acts as a contract between agents (e.g., "I promise to deliver a `structured-claim`").
10. **Link semantics (Grounds):** Clearly trace which human source "grounds" an agent's claim.
