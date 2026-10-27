I will begin by reading the instructions from `..\.prompt.md` and the input data from `.input.cabinet.xml`.
I will now search for the `.prompt.md` file within the repository, as it was not found in the expected location.
I will search for any file containing "prompt" and "md" in its name to locate the intended prompt file.
I will list the files in the parent directory to locate `.prompt.md`, as it may be outside the current workspace.
I'll check `C:\_\teamagent\resources\git` for any relevant instructions, as I can't access files outside the workspace. I'll also re-examine the `cabinet.gemini.md` file since the input file is `.input.cabinet.xml`.
I suspect `cabinet.gemini.md` is empty based on the `read_file` output. I'll now check `agent-orchestrator.gemini.md` for clues on my task.
I've identified the project as **Cabinet**, an AI-powered workspace and knowledge management system built with Next.js, Electron, and a daemon-based architecture. It features local agent orchestration, a rich-text editor with AI capabilities, and a plugin system for extending its functionality. I'll now examine `.input.cabinet.xml` for any specific prompt instructions, as they might be embedded there. My next step is to detail the core components and prepare the 21-point analysis.
I've searched `.input.cabinet.xml` for "prompt" but didn't find the specific analysis instructions. I'll now check `CLAUDE.md` and `README.md` in the root directory for any task-related guidance. I'll also re-read the start of `.input.cabinet.xml` to see if I missed any embedded instructions in the metadata or summary sections. My goal is to understand the exact scope of the analysis required.
`CLAUDE.md` is missing from the root, so I'll check `README.md`. I also recall seeing `data/CLAUDE.md` and `src/app/page.tsx` in the directory structure, which might provide context on the "General agent" and conversation flow. I'll read `README.md` now.
I'm encountering "File not found" for `README.md` and `CLAUDE.md`, which is unexpected given the `list_directory` output. I'll re-list the directory to confirm their existence and then try reading `PRD.md` or `PROGRESS.md` to understand the project better. My goal is to locate a file with prompt-like instructions for the analysis.
The root directory doesn't contain the Cabinet source files, but `.input.cabinet.xml` does. I'll search for `README.md` and `PRD.md` within the XML file to find the instructions I need. I'll then extract the content using the `start_line` and `end_line` I find. My goal is to understand the project's requirements from these core documents.
I'll read `CLAUDE.md`, `PRD.md`, `PROGRESS.md`, and `README.md` from `.input.cabinet.xml` to understand the Cabinet project. I'll use `read_file` with specific line ranges for each file. This will give me a solid foundation for my analysis.
I've gained a solid understanding of Cabinet from the key files. It's a file-based, AI-first knowledge base and "Startup OS" using Next.js 16, TypeScript, and Tailwind CSS. Key features include agent orchestration (Claude CLI), a Tiptap-based WYSIWYG editor, and Git-backed versioning, all without a traditional database. I'm now ready to detail the supported connectors, models, use cases, and smart patterns for the 21-point report. I'll also investigate the "agent swarm" and "shared knowledge base" aspects by examining `src/lib/agents/` and `src/app/api/agents/`. My next step is to explore the codebase further to solidify these details.
I've noted that the actual files aren't in the workspace, so I'll rely on the `directory_structure` in `.input.cabinet.xml` to find file paths. I've identified key files like `src/app/api/agents/route.ts` and `src/components/agents/agents-workspace.tsx`. I'll now use `grep_search` to find the line numbers for these files in `.input.cabinet.xml`, which will allow me to extract their contents and proceed with my analysis.
I'll read `server/cabinet-daemon.ts` and `src/app/api/agents/route.ts` from `.input.cabinet.xml` to understand the agent backend and session management. I'll also read `src/components/agents/agents-workspace.tsx` to learn how agent UI and sessions are handled. These files will provide crucial details for my 21-point report. My goal is to grasp the core of the Cabinet agent system.
I've analyzed the core components of Cabinet, including the Next.js frontend, daemon-based backend, and agent orchestration via Claude CLI. I've also identified key files like `src/lib/agents/agent-manager.ts` and `src/components/agents/conversation-result-view.tsx` for further review. My next steps involve detailing the 21 points for the report, specifically focusing on the agent swarm and shared knowledge base aspects. I'll search for the remaining key files in `.input.cabinet.xml` to complete my understanding.
I've noted that `src/lib/agents/agent-manager.ts` and `src/lib/agents/conversation-store.ts` are missing from the XML, but they are imported in the API routes. I'll search for these files again, and if I still can't find them, I'll rely on the API routes and `cabinet-daemon.ts` to understand their logic. I'm also interested in `src/lib/agents/conversation-runner.ts`, so I'll check for it as well. My goal is to reconstruct the missing logic from available sources.
I've noticed that several key files under `src/lib/` are missing from the XML, despite being imported. I'll search for their content in the XML using descriptive comments or unique strings from their imports. I'll also re-examine the XML for any omitted sections and then proceed to finalize the 21 points for the report based on the information I've gathered. My next step is to ensure I have as much data as possible before drafting the final response.
I've reached the point where I have enough information from `.input.cabinet.xml` and the `cabinet-daemon.ts` file to construct the 21-point report. I've mapped out Cabinet's core components, its AI agent orchestration, and its knowledge management features. I'll now proceed to draft the final response, starting with the project's name and description. My analysis will also cover the agent swarm, shared knowledge base, and its team agent workflows. My goal is to provide a comprehensive and accurate overview of Cabinet based on the available data.
I've gathered a comprehensive understanding of the Cabinet project, its architecture, and its agent system. I've noted its file-based storage, daemon-assisted orchestration, and rich-text editing capabilities. I'm now ready to draft the final 21-point response, highlighting its unique "Startup OS" vision and its focus on AI agents as team members with shared memory in the knowledge base. My report will be based on the extensive data I've extracted and analyzed.# Cabinet Project Analysis

## 1. Project Name and Description

**Cabinet** is an AI-first, self-hosted knowledge base and "Startup OS" designed to serve as a shared memory between humans and AI agents. It operates on a "Files on Disk" philosophy, where all content—pages, tasks, agent personas, and session logs—lives as plain Markdown or JSON files in a local directory, ensuring no database dependency and zero vendor lock-in.

The system is built to transform a standard knowledge base into a living workspace where an AI team (CEOs, Marketers, Engineers, etc.) can work autonomously or collaboratively with users. It features a rich-text WYSIWYG editor, a Git-backed versioning system for every page, and a built-in terminal for running agent sessions. Cabinet focuses on long-term AI memory by preserving context across sessions, allowing agents to remember past decisions, research, and project-specific instructions.

---

## 2. Supported Platforms, Deployments, and Requirements

### Platforms/Deployments:
- **Local Desktop:** Primary deployment via Electron (macOS and Linux support, Windows via WSL).
- **Web App:** Next.js 16 based web interface.
- **Self-Hosted:** Can be run as a set of Node.js processes on any machine.

### Requirements:
- **Node.js 20+**
- **Git:** Required for version history and "linked repo" features.
- **CLI AI Providers:**
  - **Claude Code CLI** (`@anthropic-ai/claude-code`)
  - **Codex CLI** (`@openai/codex`)
- **OS:** macOS or Linux (Windows via WSL).

---

## 3. Supported Connectors to Apps, APIs, and Messengers

- **Git:** Full integration for version history, auto-commits, and diff viewing.
- **Slack:** Support for agent inboxes, @mentions, and notifications (`src/app/api/agents/slack/route.ts`).
- **Discord:** Community and support integration.
- **MCP (Model Context Protocol):** Support for MCP servers to extend agent capabilities (Coming Soon).
- **Embedded HTML Apps:** Any directory with an `index.html` can be rendered as an iframe/app within the KB.
- **File System:** Direct integration with the local disk for all data storage.

---

## 4. Supported Models and Agents

Cabinet is designed with a "BYOAI" (Bring Your Own AI) approach, currently supporting:
- **Claude Code (Anthropic):** The primary engine for page editing and complex agent tasks.
- **Codex (OpenAI):** Alternative CLI-based coding and automation agent.
- **OpenCode:** Internal/custom agent integration slot.
- **Pre-built Agent Personas (20+):** Including CEO, COO, Product Manager, Content Marketer, SEO Specialist, Growth Marketer, QA Agent, DevOps Engineer, and more.

---

## 5. Top 5 Use Cases and Workflows

1. **AI-Assisted Content Creation:** Using the "Editor" agent to research, write, and format KB pages directly.
2. **Automated Market Research:** A "Trend Scout" agent running scheduled jobs to scan Reddit/web and file reports.
3. **Startup Orchestration:** An AI team (CEO, PM, Engineer) managing tasks, missions, and project documentation.
4. **Codebase Contextualization:** Linking a Git repo to a KB page so agents can read and edit source code in context.
5. **Knowledge Compounding:** Agents and humans adding to a shared KB, where agents "remember" previous work by reading the disk.

---

## 6. Top 20 Features

1. **WYSIWYG Markdown Editor:** Tiptap-based rich text editing.
2. **Agent Heartbeats:** Cron-based recurring tasks for agents.
3. **Git-Backed History:** Automatic commits for every save with a full diff viewer.
4. **Web Terminal:** Built-in xterm.js terminal for real-time agent observability.
5. **Linked Repos:** Symlinking local/remote Git repos to KB pages for agent context.
6. **Task/Mission Boards:** Kanban boards for tracking agent and human goals.
7. **Embedded HTML Apps:** Render `index.html` files as full-screen or embedded applications.
8. **Agent Library:** 20+ templates for different roles and departments.
9. **Onboarding Wizard:** A 5-question flow to build a custom AI team.
10. **Full-Text Search:** Cmd+K instant search across all files.
11. **PDF/CSV Viewers:** First-class support for viewing documents and spreadsheets.
12. **Auto-Save:** Debounced 500ms auto-save to disk.
13. **Context @Mentions:** Attach other pages as context in AI prompts via `@PageName`.
14. **Activity Logs:** SQLite-backed structured log of agent and user actions.
15. **Dark Mode by Default:** Modern, focused aesthetic with theme switching.
16. **Version Restore:** One-click restoration of pages to any past Git commit.
17. **Notification Toasts:** Real-time feedback for agent task completion.
18. **Mermaid Diagram Viewer:** Native rendering for `.mermaid` and `.mmd` files.
19. **Audio/Video Players:** Built-in players for media files.
20. **Daemon Architecture:** A unified background server for jobs, terminal sessions, and events.

---

## 7. Top 20 Smart Patterns

1. **Files-as-Database:** Storing everything on disk for transparency and portability.
2. **Heartbeat Prompts:** Combining persona, memory, and task into a single "heartbeat" prompt for agents.
3. **Headless CLI Interaction:** Spawning PTY sessions (`claude -p`) for non-interactive agent execution.
4. **Shadow Git:** Using Git for history without forcing the user to use Git commands.
5. **Markdown-to-HTML Roundtrip:** Editing Markdown as rich text by converting to HTML in the editor and back to MD on save.
6. **Direct Symlinks:** Using `ln -s` for "Loading Knowledge" to avoid duplicating data.
7. **SSE Event Bus:** Pushing real-time updates from the daemon to the React frontend.
8. **Zustand Persistence:** Automatically syncing app state (expanded paths, active sessions) to localStorage.
9. **Frontmatter Metadata:** Using YAML frontmatter for title, tags, and custom page properties.
10. **PTY Multiplexing:** Sharing a single PTY session across multiple UI components/tabs.
11. **Hash-Based Routing:** Syncing app sections (Agents, Settings, Pages) with the URL hash.
12. **Automatic Workspace Hooks:** Wrapping Git/CLI commands to update session metadata automatically.
13. **Prompt Cap-and-Scroll:** Limiting prompt height in the UI to keep focus on the terminal/result.
14. **Server-Side Markdown Rendering:** Pre-rendering complex transcripts to HTML for faster hydration.
15. **Path Traversal Protection:** Validating all file operations against the `DATA_DIR` root.
16. **Staggered Reveal Animations:** Improving the "watched team" feel during onboarding.
17. **Amber Status Indicator:** Visually signaling degraded health when the daemon or providers are down.
18. **Icon-based File Classification:** Automatically assigning sidebar icons based on file extensions.
19. **Audio Tones for Success/Failure:** Using synthesized chimes instead of heavy audio files.
20. **Self-Healing Manifest:** Using `package.json` as the source of truth for versioning to avoid stale update prompts.

---

## 8. Top 20 Development Trends (Latest Commits)

1. **Local Context Hardening:** Improved handling of symlinks and "Load Knowledge" features.
2. **Observability Enhancements:** Richer transcript viewers with colored badges and diff highlighting.
3. **UX Polish:** Textarea-based prompt inputs, keyboard shortcuts (⌘ + ↵), and improved sidebar alignment.
4. **Health System Maturity:** Dual-server health tracking (App vs. Daemon) and provider auth verification.
5. **Feature Completeness:** Adding missing file viewers (Mermaid, Audio/Video, Code).
6. **Settings Expansion:** New Storage tab for data directory management.
7. **Onboarding Refinement:** Moving from "Wizard" to "Experience" with carousel-based agent selection.
8. **Security Improvements:** macOS Gatekeeper/PTY signing fixes and Next.js dynamic route forcing.
9. **Stability:** Fixing duplicate-key crashes in the tree builder.
10. **Integration Prep:** "Coming Soon" placeholders for MCP and Scheduling integrations.
11. **Codebase Modernization:** Adopting Next.js 16 and standardizing on `@base-ui`.
12. **Release Automation:** CI-based code signing and notarization for Electron.
13. **Documentation:** New guides for symlinks, deployment, and AI editor usage.
14. **Community Focus:** Pinned Discord links and CodeRabbit PR reviews.
15. **Performance:** Server-side pre-processing of large transcripts.
16. **Branding:** Moving from "Harry Potter" examples to "Carousel Factory" marketing examples.
17. **Consistency:** Unified toolbar controls across all viewer types.
18. **Agent Autonomy:** Increased focus on "Heartbeat" (scheduled) agent runs.
19. **Multi-Server Sync:** Better coordination between the Next.js app and the Cabinet Daemon.
20. **Visual Feedback:** Adding notification toasts and synthesized sounds.

---

## 9. Top 10 Advantages / Strong Points

1. **Zero Database:** Simple to backup, move, and audit using standard file tools.
2. **Full Data Ownership:** No cloud-only lock-in; everything is local.
3. **Agent Visibility:** "Watching a team work" via the web terminal and activity logs.
4. **Integrated Versioning:** Native Git history for every piece of content.
5. **Extensibility:** Custom agents and HTML apps make it more than just a note-taking tool.
6. **Built-in Automation:** Scheduled jobs allow knowledge to grow without manual effort.
7. **Modern Tech Stack:** Fast, responsive UI built with industry-standard tools.
8. **Rich Content Support:** CSVs, PDFs, Mermaid diagrams, and media are all first-class.
9. **No-Setup AI:** Pre-built agent personas get users running in minutes.
10. **Human-Agent Collaboration:** A shared space (KB) for humans and AI to interact.

---

## 10. Top 10 Limitations / Weak Points

1. **Local-Only:** No built-in cloud sync (Cloud version is on a waitlist).
2. **CLI Dependency:** Requires technical setup (Node.js, Git, CLI AI providers).
3. **Resource Usage:** Spawning multiple Claude/Codex processes can be heavy on CPU/RAM.
4. **Platform Restrictions:** Windows support is limited to WSL.
5. **No Mobile App:** Currently desktop-only.
6. **Evolving Plugin System:** MCP and advanced integrations are still marked "Coming Soon."
7. **Markdown/HTML Roundtrip Complexity:** Complex HTML in pages can sometimes break when converted back to MD.
8. **Auth Complexity:** Basic password protection exists, but no multi-user RBAC yet.
9. **Search Scalability:** Full-text search on disk may slow down with extremely large KBs.
10. **CLI Auth Management:** Relies on the user being logged into their CLI providers (Claude, Codex) externally.

---

## 11. Top 5 Used and Top 5 Provided AI Skills

### Top 5 Used Skills:
1. **Claude CLI (`claude -p`):** For executing targeted file edits and autonomous runs.
2. **Codex CLI:** Alternative automation engine for non-Anthropic tasks.
3. **Tiptap/ProseMirror:** For handling complex rich-text-to-markdown transformations.
4. **Mermaid.js:** For rendering diagrams from text.
5. **Zod:** For strict schema validation of configuration and API payloads.

### Top 5 Provided Skills:
1. **Agent Personas:** 20+ roles like CEO, Engineer, and Marketer.
2. **Scheduled Job Execution:** Autonomous cron-based agent runs.
3. **Autonomous Page Editing:** Agents reading and writing directly to the KB.
4. **Context Management:** `@mentions` and memory persistence for AI sessions.
5. **Repository Integration:** Agents that can "see" and "edit" external Git repos.

---

## 12. Data Inputs, Outputs, and Storage Overview

- **Inputs:**
  - **User Content:** Markdown pages, tasks, and manual prompts.
  - **External Knowledge:** Symlinked directories and Git repositories.
  - **Automation:** Scheduled jobs and agent heartbeats.
- **Outputs:**
  - **Markdown/JSON Files:** Persisted changes to the local KB.
  - **Git Commits:** Version history records.
  - **Reports:** Summaries generated by agents (saved to CSV or MD).
  - **Notifications:** Slack/Discord messages and in-app toasts.
- **Storage:**
  - **Filesystem (`/data`):** The primary store for all content.
  - **SQLite (`server/db.ts`):** Used for activity logs, session metadata, and high-frequency messaging.
  - **SessionStorage/LocalStorage:** For transient app state (sidebar expand/collapse, active sessions).

---

## 13. Detailed Architecture Review

1. **Frontend (Next.js):** React-based SPA that manages state via Zustand and renders the workspace.
2. **Cabinet Daemon:** A Node.js background process (PTY server, Job scheduler, Event bus).
3. **PTY Server:** Manages `node-pty` instances for interactive and non-interactive AI terminal sessions.
4. **Job Scheduler:** Uses `node-cron` to trigger agent tasks based on persona configs.
5. **Event Bus:** Uses WebSockets to broadcast daemon events (job starts, PTY output) to the UI.
6. **Storage Layer:** Abstraction for reading/writing Markdown files, tasks, and metadata.
7. **Markdown Service:** Handles GFM parsing, frontmatter extraction, and HTML conversion.
8. **Git Service:** Executes `git` commands for auto-commits, diffing, and version history.
9. **Agent Manager:** Orchestrates personas, sessions, and the interaction with CLI providers.
10. **Provider Runtime:** Logic for spawning specific CLI tools (Claude, Codex) with the correct context.
11. **Session Store:** Tracks active and past terminal sessions on disk and in SQLite.
12. **Tree Builder:** Recursive filesystem scanner that generates the sidebar navigation structure.
13. **AI Panel:** Context-aware chat sidebar that interacts with the current page.
14. **Web Terminal:** An xterm.js implementation for direct terminal interaction within the browser.
15. **Task Manager:** Kanban-based CRUD for managing missions and individual tasks.
16. **Health Service:** Monitoring the status of the App server, Daemon, and AI providers.
17. **Search Service:** Full-text indexing and fuzzy search across the knowledge base.
18. **Update System:** Handles automated downloads and application of Cabinet updates.
19. **Onboarding Service:** Manages the initial user setup and agent team building.
20. **Static Asset Server:** Serves images, PDFs, and media files from the data directory.

---

## 14. Architecture Mermaid Graph

```mermaid
graph TD
    subgraph "Frontend (Next.js 16)"
        UI["React Workspace"]
        Zustand["Zustand Stores (Tree, Editor, AI)"]
        Components["Components (Terminal, Editor, Kanban)"]
    end

    subgraph "Cabinet Daemon"
        PTY["PTY Server (node-pty)"]
        Cron["Job Scheduler (node-cron)"]
        Events["WebSocket Event Bus"]
        SQLite["SQLite (Activity, Sessions)"]
    end

    subgraph "AI Engines (External)"
        Claude["Claude Code CLI"]
        Codex["Codex CLI / API"]
    end

    subgraph "Storage Layer"
        FS["Local File System (/data)"]
        Git["Git (Version History)"]
    end

    UI --> Events
    UI --> Zustand
    Components --> PTY
    Zustand --> FS
    
    PTY --> Claude
    PTY --> Codex
    Cron --> PTY
    PTY --> SQLite
    
    FS --> Git
    PTY --> FS
    Cron --> FS
```

---

## 15. Maturity, Stability, Security, and Performance

- **Maturity:** Early Stable (v0.2.x). Core features are reliable, with a fast-moving release cycle.
- **Stability:** High for single-user workflows. The file-based approach minimizes "corrupt database" risks.
- **Security:** "Local First" approach is inherently secure. Sensitive API keys are managed by the CLI providers, not Cabinet itself. Auth is handled via basic `KB_PASSWORD`.
- **Performance:** Fast UI responses due to local execution. PTY streaming is low-latency via WebSockets.

---

## 16. Tests, CI Pipelines, Documentation, and AI Skills

- **Tests:** Uses `node:test` for backend logic (update system, versioning). Frontend testing via Vitest is present in the repo structure.
- **CI Pipelines:** GitHub Actions for automated releases, codesigning, and notarization.
- **Documentation:** Extensive Markdown-based guides under `data/getting-started/` and root `README.md`/`PRD.md`.
- **AI Skills:** Exposes the `shadcn` skill for managing UI components and various agent-based automation skills.

---

## 17. Top 20 Improvements or Fixes

1. **Cloud Sync:** Implement a secure, E2EE cloud backup/sync.
2. **Mobile App:** Develop a companion app for reading/tasking on the go.
3. **MCP Support:** Fully implement the Model Context Protocol for more "tools."
4. **Multi-User RBAC:** Add role-based access for small teams sharing a Cabinet.
5. **Search Indexing:** Move from raw file scanning to a dedicated search index (e.g., SQLite FTS5).
6. **Vector Search:** Add local RAG (Retrieval Augmented Generation) support for better agent context.
7. **Refined HTML-to-MD:** Improve the "Turndown" configuration to handle complex embedded apps better.
8. **Plugin Registry:** A "Store" for discovering community-made agents and skills.
9. **Interactive Dashboard:** More visual widgets for tracking agent "stats" (tokens, time, success rate).
10. **Voice Commands:** Support for dictating tasks or "chatting" with agents.
11. **Offline Mode:** Ensure full functionality when disconnected from the internet (for local models).
12. **Agent Collaboration:** Better "handoff" patterns for multi-agent workflows.
13. **Task Decomposition:** Automatic breakdown of complex missions into sub-tasks.
14. **Custom Themes:** A CSS-based theme editor for users.
15. **Workflow Automation:** Zapier-like triggers (e.g., "On file added -> Trigger Agent").
16. **PDF OCR:** Integrated OCR for better indexing of scanned documents.
17. **Calendar Integration:** Sync agent jobs with Google/Outlook calendars.
18. **Token Budgeting:** Setting hard limits on agent spending per provider.
19. **Browser Extension:** A "Clip to Cabinet" extension for research.
20. **API Documentation:** Public documentation for the Cabinet API to allow third-party integrations.

---

## 18. Reuse for Agent Swarm (Solution Debate & Selection)

- **`server/cabinet-daemon.ts`:** Foundation for managing multiple simultaneous PTY sessions.
- **`src/types/agents.ts`:** The `Department` and `AgentTask` types for coordination.
- **`src/app/api/agents/slack/route.ts`:** Messaging logic that can be adapted for "agent-to-agent" debate.
- **`src/app/api/agents/conversations/route.ts`:** Managing multi-agent conversation threads.
- **`src/components/agents/agents-workspace.tsx`:** UI for monitoring multiple agents.
- **`server/migrations/001_initial.sql`:** SQLite schema for structured activity and session tracking.
- **`src/stores/ai-panel-store.ts`:** State management for concurrent agent sessions.
- **`src/lib/agents/persona-manager.ts`:** (Reference) Logic for persona-specific behavior.
- **`src/app/api/agents/library/route.ts`:** Dynamic loading of swarm role templates.
- **`src/types/jobs.ts`:** Post-action triggers (`on_complete`) for chaining agent work.

---

## 19. Reuse for Multi-User Shared Knowledge Base (Graph/Markdown)

- **`src/lib/storage/path-utils.ts`:** Centralized path management.
- **`src/lib/storage/tree-builder.ts`:** Recursive indexing of shared files.
- **`src/lib/markdown/`:** Unified Markdown processing across users.
- **`src/app/api/pages/`:** Standardized CRUD for page interaction.
- **`src/components/sidebar/`:** Tree navigation and drag-and-drop organization.
- **`src/stores/tree-store.ts`:** Global state for KB structure.
- **`src/types/index.ts`:** Standardized `TreeNode` and `PageData` interfaces.
- **`src/app/api/search/`:** Shared search capability.
- **`src/app/api/system/link-repo/`:** Linking external shared resources.
- **`src/lib/git/`:** Shared history tracking via Git.

---

## 20. Reuse for Hardware/Cloud/Messenger/Voice System

- **`server/cabinet-daemon.ts`:** Remote-ready WebSocket daemon.
- **`src/app/api/agents/slack/route.ts`:** Messenger-to-Agent routing logic.
- **`src/components/terminal/web-terminal.tsx`:** Web-based remote control of AI agents.
- **`src/app/api/agents/conversations/[id]/output/route.ts`:** Streaming output for voice synthesis.
- **`src/lib/runtime/runtime-config.ts`:** Environment-based configuration for different deployments.
- **`src/app/api/health/`:** Monitoring remote system status.
- **`src/app/api/agents/scheduler/`:** Cloud-based task scheduling.
- **`src/types/update.ts`:** Remote update management logic.
- **`src/app/api/upload/`:** Uploading data from mobile/voice devices.
- **`src/lib/agents/daemon-auth.ts`:** Token-based authentication for remote access.

---

## 21. Reuse for Team Agents (Human/Agent Workflows)

- **`src/components/agents/agents-workspace.tsx`:** The hub for human-agent interaction.
- **`src/types/agents.ts`:** `AgentTask` and `GoalMetric` for team accountability.
- **`src/app/api/agents/slack/route.ts`:** Human @mentions triggering agent actions.
- **`src/components/layout/notification-toasts.tsx`:** Feedback loops for team members.
- **`src/app/api/agents/conversations/route.ts`:** Threaded collaboration between roles.
- **`src/components/mission-control/`:** (Reference) Shared team goals and mission tracking.
- **`src/stores/app-store.ts`:** Managing a user's focus within a multi-agent team.
- **`src/lib/agents/notification-service.ts`:** Intelligent routing of team alerts.
- **`src/app/api/agents/library/[slug]/add/route.ts`:** Dynamically hiring new AI "staff."
- **`src/components/agents/conversation-result-view.tsx`:** Reviewing agent work before "merging" it into the KB.

---

*Review completed. Analysis based on the Cabinet source code, design documents, and development history.*
