I will check for the existence of `..\.prompt.md` and read its content to follow the instructions.
I'll search for any file named `.prompt.md` within the current workspace to find the correct instructions.
I'll read `.input.llm-wiki.karpathy.xml` to see if it contains any instructions or clues about the requested task.
I'll examine `llm-wiki.karpathy.gemini.md` to see if it contains the instructions I need to follow, as `..\.prompt.md` is inaccessible.
I'll read `.log\llm-wiki.karpathy.gemini.log` to see if it provides any insight into previous attempts or instructions for this task.
I'll list all files with details to check their sizes and timestamps, which might help clarify the purpose of `llm-wiki.karpathy.gemini.md`.
I'll list the files in the current directory to see their details, as I'm unable to use `run_shell_command` and need to find a way to access the prompt.
I'll examine `gemini-cli.gemini.md` to see if it contains the instructions I need to follow, as it might be a potential source for the prompt.
I'll read `agentmemory.gemini.md` to confirm if it follows the same 21-point structure, which will help me create a consistent report for the "LLM Wiki" project.
I will now perform a 21-point technical analysis of the "LLM Wiki" pattern described in `.input.llm-wiki.karpathy.xml`. Although the input consists of a single idea file, I will extrapolate the features, patterns, and architectural details based on the concept and the provided git logs.

# LLM Wiki Project Analysis (Pattern Review)

## 1. Project Name and Description
**Project Name:** **LLM Wiki**

**Description:**
LLM Wiki is a conceptual pattern and architectural framework for building persistent, self-evolving personal knowledge bases using Large Language Models. Unlike traditional RAG (Retrieval-Augmented Generation) systems that synthesize information from scratch for every query, the LLM Wiki pattern focuses on the **incremental accumulation of knowledge**. An LLM agent acts as a "disciplined wiki maintainer," reading raw source documents and distilling them into a structured, interlinked collection of markdown files.

The core philosophy is to move from ephemeral chat history to a **compounding artifact**. The wiki sits between the user and the raw sources, providing a pre-synthesized layer where entities are already mapped, contradictions are flagged, and cross-references are maintained. By utilizing Obsidian as a visual IDE and the LLM as the primary "programmer" of the wiki codebase, the system transforms raw information into an organized, navigable, and growing intelligence asset.

## 2. Supported Platforms, Deployments & Requirements
- **Platforms:** 
    - **Operating Systems:** Any OS supporting Node.js/Python and Markdown (Windows, macOS, Linux).
    - **Knowledge IDE:** Primarily optimized for **Obsidian**, but compatible with Logseq, Foam, or any Markdown-based PKM.
- **Deployments:** 
    - **Local-First:** Designed to run on a user's local machine with files stored in a Git-tracked directory.
    - **Agent-Driven:** Deployed via LLM agents like Claude Code, OpenAI Codex, or custom CLI tools.
- **Requirements:**
    - **Markdown Environment:** A folder of `.md` files.
    - **LLM Access:** An agent with file system access and reasoning capabilities.
    - **Version Control:** Git (highly recommended for history and branching).
    - **Optional Tools:** Obsidian Web Clipper, `qmd` for local search.

## 3. Supported Connectors
- **File System:** Native interaction with a directory of Markdown files.
- **Obsidian Web Clipper:** Connector for ingesting web articles directly into the raw source collection.
- **Git:** Connector for versioning, branching, and collaborative knowledge building.
- **qmd (Query Markdown):** A CLI/MCP connector for hybrid BM25/vector search over the wiki.
- **Marp:** Connector for generating slide decks from wiki content.
- **Dataview:** Plugin connector for running metadata queries over YAML frontmatter.
- **Local Assets:** Connector for managing and referencing local images and data files.

## 4. Supported Models & Agents
- **Models:**
    - **High-Reasoning Models:** Gemini 3 Pro, Claude 3.5 Sonnet, GPT-4o (required for synthesis and cross-referencing).
    - **Fast Models:** Gemini 3 Flash, Claude 3 Haiku (suitable for basic indexing and logging).
- **Agents:**
    - **Claude Code:** Mentioned as a primary agent for maintaining the wiki.
    - **OpenAI Codex:** Capable of executing wiki maintenance tasks.
    - **Gemini CLI:** Ideal for terminal-first wiki operations.
    - **Aider:** Suitable for collaborative editing of the wiki "codebase."

## 5. Top 5 Use Cases & Workflows
1. **Incremental Research:** Weeks-long deep dives where papers are ingested one by one, building a comprehensive synthesis.
2. **Personal Knowledge Management (PKM):** Tracking self-improvement, health, and goals by filing journal entries and articles into a structured "self-wiki."
3. **Active Reading Companion:** Building character maps, theme trackers, and plot summaries while reading a complex book.
4. **Internal Business Wiki:** Capturing meeting transcripts, Slack threads, and project docs into a living team resource.
5. **Competitive Analysis:** Accumulating data on markets and competitors into an interlinked synthesis that highlights contradictions.

## 6. Top 20 Features
1. **Incremental Ingestion:** LLM reads one source and updates multiple wiki pages.
2. **Persistent Interlinking:** Automatic creation and maintenance of `[[wikilinks]]`.
3. **Entity Extraction:** Dedicated pages for people, places, and organizations.
4. **Concept Synthesis:** Thematic pages that combine insights from multiple sources.
5. **Log-Based Tracking (`log.md`):** Append-only chronological record of all operations.
6. **Centralized Indexing (`index.md`):** Content-oriented catalog of all wiki pages.
7. **Schema Configuration (`AGENTS.md`):** Instructions that define the wiki's style and workflow.
8. **Contradiction Flagging:** Identifying when new data challenges old claims in the wiki.
9. **Automated Cross-Referencing:** Linking related concepts without user intervention.
10. **Obsidian Graph Integration:** Visualizing the knowledge web through Obsidian's native graph.
11. **Frontmatter Metadata:** YAML-based tagging for Dataview queries.
12. **Local Asset Handling:** Managing local images and referencing them in Markdown.
13. **Health Checks (Linting):** Periodic LLM passes to find orphan pages or data gaps.
14. **Comparison Tables:** LLM-generated Markdown tables for feature or entity comparisons.
15. **Slide Generation (Marp):** Turning wiki synthesis into presentations.
16. **Hybrid Search:** Using `qmd` for vector and keyword search over pages.
17. **Dynamic Querying:** Using Dataview for real-time lists and tables.
18. **Web Clipping Integration:** Seamless transition from browser to raw source.
19. **Version Control (Git):** Branching knowledge for experimental syntheses.
20. **Self-Documenting Schema:** The wiki's structure is defined and updated within the wiki itself.

## 7. Top 20 Smart Patterns
1. **Wiki-as-Codebase:** Treating the knowledge base like a software project.
2. **LLM-as-Maintainer:** The human curates sources, the LLM handles the bookkeeping.
3. **Synthesis-Once, Read-Many:** Compiling knowledge into pages to avoid re-deriving on query.
4. **The "Memex" Trail:** Creating associative trails between documents (Vannevar Bush style).
5. **XML/Structured Ingestion:** Using clear delimiters for source material to help LLM parsing.
6. **Periodic Linting:** Scheduled "garbage collection" for stale or contradictory claims.
7. **Index-First Retrieval:** Reading the `index.md` before drilling into specific pages.
8. **Frontmatter-Driven Organization:** Using metadata to drive dynamic views.
9. **Source-to-Synthesis Citations:** Every wiki claim links back to an immutable raw source.
10. **Interactive Co-Evolution:** The user and LLM co-design the schema over time.
11. **Placeholder Strategy:** LLM creates empty hub pages to be filled by future sources.
12. **Topic Management:** Splitting the wiki into logical namespaces (Entities, Concepts, Logs).
13. **Summarization Cascades:** Raw source $\rightarrow$ Summary $\rightarrow$ Index Entry $\rightarrow$ Entity Update.
14. **Constraint-Based Maintenance:** Using `GEMINI.md` to enforce strict formatting rules.
15. **Hybrid Search Reranking:** Using LLMs to rank search results before reading.
16. **Marp-First Documentation:** Writing synthesis in a format ready for presentation.
17. **Git-Flow Knowledge:** Using branches to draft new wiki structures before "merging" into main.
18. **Atomic Page Principle:** Keeping pages focused on a single entity or concept.
19. **Human-in-the-Loop Verification:** User reads and guides the LLM after every ingest.
20. **Compound Knowledge Loop:** Queries generate new pages that are filed back into the wiki.

## 8. Top 20 Development Trends (Latest Commits)
*Note: Based on the provided single-commit git log and the "idea file" nature of the project.*
1. **Pattern Formalization:** Transitioning from a loose idea to a structured "pattern" document.
2. **Architecture Decoupling:** Separating "Raw Sources" from "The Wiki" layer.
3. **Obsidian Integration Focus:** Heavy emphasis on using Obsidian features (Graph, Dataview, Marp).
4. **Schema-Driven Maintenance:** Introducing `AGENTS.md` as the "brain" of the maintenance workflow.
5. **Tooling Recommendations:** Incorporating `qmd` for efficient local search.
6. **Chronological Logging:** Standardizing `log.md` for session history.
7. **Index Optimization:** Using `index.md` as a primary navigation tool for the LLM.
8. **Asset Localization:** Guidelines for downloading web images to local disk.
9. **Multimodal Anticipation:** Designing workflows for agents to "see" local images.
10. **Community Inspiration:** Referencing Tolkien Gateway and Memex as North Stars.
11. **Bookkeeping Automation:** Offloading the "tedious part" (cross-linking) to LLMs.
12. **Modular Schema Design:** Allowing users to pick and choose parts of the pattern.
13. **Markdown-First Philosophy:** Ensuring knowledge is stored in an open, portable format.
14. **Synthesis Over Retrieval:** Shifting focus from RAG to compiled knowledge.
15. **Collaborative Curation:** Defining the human role as "curator" rather than "editor."
16. **Versioned Knowledge:** Leveraging Git for the entire wiki lifecycle.
17. **Linting as a Core Op:** Elevating maintenance to a first-class operation.
18. **Structured XML Prompts:** Using clear tags for LLM communication.
19. **Context Efficiency:** Using the index to minimize token usage in large wikis.
20. **Open Collaboration:** Designing the idea to be shared and adapted by the community.

## 9. Top 10 Advantages
1. **Persistent Synthesis:** Knowledge is compiled once and stays current.
2. **Context Efficiency:** LLM doesn't have to re-read everything for every question.
3. **Human Readability:** The wiki is a beautiful, navigable artifact in Obsidian.
4. **No Vendor Lock-in:** It's just a folder of Markdown files and Git.
5. **Zero Bookkeeping Effort:** LLM handles the most boring parts of wiki maintenance.
6. **Compounding Value:** The more you add, the richer the cross-references become.
7. **Conflict Detection:** Contradictions are surfaced during ingestion, not query.
8. **Local-First Privacy:** Data stays on your machine, using local tools where possible.
9. **Scalable Navigation:** `index.md` and `qmd` handle hundreds of sources easily.
10. **Visual Insight:** Graph view provides immediate feedback on knowledge density.

## 10. Top 10 Limitations
1. **Manual Ingestion:** Still requires a human to "curate" and "drop" new sources.
2. **LLM Cost:** Touching 10-15 files per ingest can consume significant tokens.
3. **Consistency Risk:** Requires a strong schema to prevent the LLM from drifting.
4. **Setup Overhead:** Requires initial effort to co-evolve the schema and setup tools.
5. **Context Window Limits:** Very large wikis still need search tools like `qmd`.
6. **Tooling Dependency:** Relies on external tools like Obsidian or Git for full power.
7. **Sychronization Lag:** The wiki is only as current as the last ingestion session.
8. **Image Handling Clunkiness:** LLMs still struggle with inline images in one pass.
9. **Schema Fragility:** Small changes in `AGENTS.md` can have big effects on the wiki.
10. **Maintenance Fatigue:** While LLM does the work, the human must still "verify."

## 11. Top AI Skills
- **Provided AI Skills:**
  1. **Wiki Maintenance:** Automated bookkeeping, cross-linking, and filing.
  2. **Knowledge Synthesis:** Compiling raw data into entity and concept pages.
  3. **Linting & Health Checks:** Identifying gaps and contradictions in knowledge.
  4. **Indexing:** Maintaining a current catalog of all synthesis pages.
  5. **Output Generation:** Creating tables, slides, and charts from wiki data.
- **Used AI Skills:**
  1. **Document Analysis:** Deep reading and extraction from articles/papers.
  2. **Relational Reasoning:** Connecting disparate facts across files.
  3. **Schema Adherence:** Following strict organizational conventions.
  4. **Context Management:** Using indexes to navigate large folder structures.
  5. **Code/Markdown Generation:** Writing clean, formatted Markdown and YAML.

## 12. Data Inputs, Outputs & Storage
- **Inputs:** Raw source documents (PDFs, Markdown, images, data), User instructions, Schema configuration.
- **Outputs:** Interlinked Markdown pages, chronological logs, indices, slides (Marp), Tables.
- **Storage:** Local file system (Markdown files and assets), Git repository for history.

## 13. Detailed Architecture Review
- **Layer 1: Raw Sources:** Immutable collection of original documents.
- **Layer 2: The Wiki:** A structured directory of LLM-generated Markdown files.
    - `/entities/`: Pages for people, companies, places.
    - `/concepts/`: Pages for theories, themes, comparisons.
    - `/logs/`: Chronological records of sessions.
    - `index.md`: The central navigation hub.
- **Layer 3: The Schema:** The configuration file (`AGENTS.md`) that drives the maintenance logic.
- **Tooling Interface:** CLI tools (like `qmd`) and Obsidian plugins (Dataview, Marp) that operate on the files.

## 14. Architecture Diagram
```mermaid
graph TD
    Sources[(Raw Sources)] -->|Ingest| Agent[LLM Agent]
    User([User]) -->|Directs| Agent
    Schema[AGENTS.md / Schema] -->|Configures| Agent
    
    subgraph "The Wiki (Git Repo)"
        Agent -->|Writes| Wiki[Markdown Pages]
        Wiki -->|Updates| Index[index.md]
        Wiki -->|Appends| Log[log.md]
        Agent -->|Lints| Wiki
    end
    
    Obsidian[Obsidian IDE] <-->|Reads/Visualizes| Wiki
    Obsidian -->|Plugins| Dataview[Dataview / Marp]
    Search[qmd / Search Tool] <-->|Indexes| Wiki
```

## 15. Project Review: Maturity, Security & Performance
- **Maturity:** **Conceptual/Beta.** The pattern is well-defined, but implementation depends on the specific agent and user setup.
- **Security:** **High (Local-First).** Data is stored locally. Security depends on the LLM provider's privacy policy.
- **Performance:** **Efficient.** Compiled knowledge reduces the need for expensive "full-history" RAG queries.

## 16. Review: Infrastructure & AI readiness
- **AI Readiness:** **Excellent.** Designed specifically to leverage LLM strengths in summarization and cross-referencing.
- **Infrastructure:** **Minimalist.** Requires no complex vector database if the wiki is moderate in size.

## 17. Top 20 Possible Improvements
1. **Auto-Clipper:** Automated background ingestion of browser history/bookmarks.
2. **Semantic Diffing:** LLM-generated summaries of what changed in the wiki after an ingest.
3. **Graph-Based Navigation:** Agent using the Obsidian graph to find clusters of knowledge.
4. **Voice-to-Wiki:** Direct ingestion of voice memos with auto-filing.
5. **Multimodal Synthesis:** Native handling of diagrams and handwritten notes.
6. **Shared Wiki Protocol:** Standardized format for merging wikis from different users.
7. **Local LLM Integration:** Full maintenance using local models (Llama 3, etc.).
8. **Automated Cite-Checking:** Verifying wiki claims against the web periodically.
9. **Visual Wiki Map:** Agent-generated Mermaid diagrams of specific knowledge trails.
10. **Interactive Q&A Pages:** Pages that self-update as you ask more questions.
11. **Conflict Resolution UI:** A better way for humans to adjudicate LLM-flagged contradictions.
12. **Token Budgeting:** Predicting ingest costs before execution.
13. **Skill extraction:** Learning new wiki-maintenance patterns from user edits.
14. **Cross-Project Linking:** Connecting separate wikis (e.g., Work vs. Personal).
15. **API Gateway:** A local server to allow other apps to query the wiki.
16. **Obsidian Canvas Support:** Agent building visual boards for complex topics.
17. **Timed Reviews:** Agent prompting the user to review "stale" pages.
18. **Personalized Tone:** Adjusting the synthesis style to match the user's voice.
19. **Automated Backups:** Encrypted cloud sync for the git repository.
20. **Community Templates:** Pre-built schemas for common domains (Research, Coding, Health).

## 18. Reuse for Agent Swarm
- **Shared Memory:** The wiki acts as a persistent, high-level shared memory for multiple agents.
- **Role Isolation:** One agent ingests, another lints, a third generates presentations.
- **Consensus Logging:** Swarm debates are summarized and filed as new wiki pages.

## 19. Reuse for Multi-User/Multi-Agent Shared Knowledge
- **Team Wiki:** A centralized repo where multiple users/agents contribute to a shared synthesis.
- **Attribution:** Git logs and frontmatter track which user/agent contributed which fact.
- **Conflict Management:** LLM flags when team members' sources contradict each other.

## 20. Reuse for Own Hardware / Cloud / Multi-Channel Messaging
- **Local Hub:** Running on a NAS or personal server as a private knowledge hub.
- **Bot Interface:** Interacting with the wiki via Telegram or Slack (Bot reads/writes the repo).
- **Static Site Gen:** Publishing parts of the wiki as a public or private website (Quartz/Hugo).

## 21. Reuse for Cooperative Team Agents
- **Institutional Memory:** Capturing team experience into a persistent, searchable format.
- **Onboarding:** New team agents read the wiki to quickly understand project context and conventions.
- **Decision Tracking:** Architectural decisions (ADRs) are filed and interlinked with relevant code and docs.
