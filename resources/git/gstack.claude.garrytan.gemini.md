I will start by reading the instructions in `.prompt.md` to understand the specific task requirements.
I will read the beginning of `gstack.claude.garrytan.xml` to understand its structure and content.
I will read more of the directory structure to gain a better understanding of the project's layout.
I will search for "gstack" in the repository and examine `README.md`, `ARCHITECTURE.md`, `DESIGN.md`, and `ETHOS.md` to gather more details for point 1.
I will read the `README.md` file.
I will search for the content of `README.md` within `gstack.claude.garrytan.xml` by looking for `<file path="README.md">`.
I will search for the contents of `ARCHITECTURE.md` and `DESIGN.md` within `gstack.claude.garrytan.xml` to gain a better understanding of the project's structure and goals.
I will read the `ARCHITECTURE.md` file to gather more detailed information about the project's structure.
I will read the content of `ARCHITECTURE.md` starting from line 1073.
I will read more of the `ARCHITECTURE.md` file to see if there's any additional information.
I will check `ETHOS.md` for the project's philosophy, examine the `scripts/` directory for implementation details, and review `package.json` and `supabase/` for dependencies and backend information. I will also search for any references to "Cloudflare Workers" within the codebase.
I will search for the term "Cloudflare" within the project's files to see if it's mentioned.
I will search for the term "Cloudflare" within the `gstack.claude.garrytan.xml` file to see if it's referenced in the codebase.
I will search for the term "Cloudflare" while excluding all `.gemini.md` files from the search results.
I will search for the term "Cloudflare" specifically within the `gstack.claude.garrytan.xml` file.
I will use `grep_search` to find "Cloudflare" in the `gstack.claude.garrytan.xml` file.
I will check the `ETHOS.md` file within `gstack.claude.garrytan.xml`.
I will read the `ETHOS.md` file within `gstack.claude.garrytan.xml`.
I will examine the `scripts/resolvers/` directory to understand the project's logic and the roles of the various components.
I will search for files within the `scripts/resolvers` directory in `gstack.claude.garrytan.xml`.
I will read the `scripts/resolvers/preamble.ts` and `scripts/resolvers/learnings.ts` files within `gstack.claude.garrytan.xml` to understand the session and learning management.
I will read the `browse/src/browser-manager.ts` and `browse/src/snapshot.ts` files to understand how browser management and snapshots are handled.
I will search for "Mermaid" in the codebase to find any existing graphs and examine the `design/src/generate.ts`, `design/src/gallery.ts`, `browse/src/snapshot.ts`, `scripts/resolvers/review.ts`, and `scripts/resolvers/ship.ts` files for more details on design, element referencing, PR review, and shipment logic.
I will read the `design/src/generate.ts` and `design/src/gallery.ts` files within `gstack.claude.garrytan.xml` to gain more insight into the design-to-code generation and the comparison gallery.
The following is a comprehensive analysis of the **gstack** repository, an AI engineering workflow framework designed to provide structured roles and high-performance tools for software development.

### 1. Project Name and Description
**Project Name:** gstack

**Description:**
gstack is an advanced AI engineering workflow framework that transforms standard AI agents into highly specialized roles such as CEO Reviewers, Engineering Managers, Designers, and QA Leads. By providing a collection of opinionated `SKILL.md` files and a custom toolchain, it enables a comprehensive development lifecycle—from initial strategy and architectural planning to automated browser-based testing and deployment. It is designed to operate as a "full PM/dev/eng/CEO/QA in a box" for modern AI-driven software engineering.

The core of gstack is a high-performance, long-lived headless browser daemon (based on Playwright/Chromium) that provides sub-second tool latency and persistent session state (cookies, tabs, logins). Unlike traditional browser automation that cold-starts for every command, gstack maintains a persistent connection over a localhost HTTP API, allowing AI agents to interact with web applications with the speed and context of a human developer. This persistence is critical for testing authenticated flows and complex single-page applications (SPAs).

Architecture and safety are foundational to the project. gstack implements a "Boil the Lake" philosophy, encouraging complete implementations and rigorous testing while maintaining user sovereignty. It includes specialized safety guards like `/careful` (for destructive command warnings) and `/freeze` (for directory locking), ensuring that AI agents operate within a secure and predictable environment. The framework also features an institutional memory system (learnings logs) that allows agents to evolve their operational knowledge across sessions.

### 2. Supported Platforms and Deployments
*   **Operating Systems:** macOS (primary, includes Keychain integration), Windows (supported via Bun/Windows adaptations), and Linux (supported via Docker and general Node/Bun compatibility).
*   **Deployments:** 
    *   **Local CLI:** Primary interface for developers.
    *   **Headless Daemon:** Background Bun-based server managing Chromium.
    *   **CI/CD:** GitHub Actions integration for automated evaluations and skill validation.
*   **Requirements:** Bun (1.3.10+), Node.js (22 LTS), Playwright (Chromium), Git, GitHub CLI (`gh`) or GitLab CLI (`glab`).
*   **Source Reference:** `ARCHITECTURE.md`, `.github/docker/Dockerfile.ci`, `AGENTS.md`, `bin/gstack-platform-detect`.

### 3. Supported Connectors
*   **AI Hosts:** 
    *   **Claude Code:** Primary host adapter (`hosts/claude.ts`, `openclaw/gstack-full-CLAUDE.md`).
    *   **OpenClaw:** Specialized adapter for the OpenClaw agent ecosystem (`hosts/openclaw.ts`, `scripts/host-adapters/openclaw-adapter.ts`).
    *   **Codex:** Integration for the Codex environment (`hosts/codex.ts`).
    *   **OpenAI:** Support for GPT models (`agents/openai.yaml`, `hosts/index.ts`).
    *   **Others:** Cursor, Kiro, OpenCode, Slate, Gemini (`hosts/`, `test/helpers/gemini-session-runner.ts`).
*   **Version Control:** 
    *   **GitHub:** Deep integration via `gh` CLI for PR reviews and shipping (`scripts/resolvers/review.ts`, `scripts/resolvers/ship.ts`).
    *   **GitLab:** Support via `glab` CLI (`scripts/resolvers/ship.ts`).
*   **Infrastructure:** 
    *   **Supabase:** Used for telemetry ingest and update checks (`supabase/functions/`).
    *   **Chromium/Playwright:** Core connector for browser automation (`browse/src/browser-manager.ts`).

### 4. Supported Models and Agents
*   **Anthropic:** Claude 3.5 Sonnet (primary for judgment), Claude 3 Haiku (primary for speed/routing) via `hosts/claude.ts`.
*   **OpenAI:** GPT-4o and related models via `agents/openai.yaml`.
*   **Google:** Gemini models used in E2E testing (`test/helpers/gemini-session-runner.ts`).
*   **Agent Types:** Local CLI agents (Claude Code), remote API agents (OpenAI/Gemini), and cross-model swarms (Codex + Claude subagents).
*   **Source Reference:** `hosts/factory.ts`, `scripts/resolvers/confidence.ts` (Consensus logic).

### 5. Top 5 Use Cases and Workflows
1.  **Product Strategy & Reframing (`/office-hours`):**
    *   *Workflow:* User inputs a raw idea -> Agent challenges premises -> Reframes problem -> Explores 10x impact alternatives -> Produces a structured design doc.
2.  **Automated Browser QA (`/qa`):**
    *   *Workflow:* Agent launches headless Chromium -> Import cookies -> Snapshot page -> Interact via accessibility refs (@e1) -> Find bugs -> Fix code -> Re-verify.
3.  **Design-to-Code Audit (`/design-review`):**
    *   *Workflow:* Read plan -> Audit UI against `DESIGN.md` -> Identify missing states/hierarchy -> Suggest fixes -> Apply atomic commits -> Generate comparison boards.
4.  **Architectural Locking (`/plan-eng-review`):**
    *   *Workflow:* Review dev plan -> Map sub-problems to existing code -> Generate ASCII dependency graphs -> Build test plan -> Lock data flows and edge cases.
5.  **One-Command Shipment (`/ship`):**
    *   *Workflow:* Run tests -> Automated PR review -> Check health scores -> Open PR/MR -> Update documentation (`/document-release`).

### 6. Top 20 Features
1.  **Headless Browser Daemon:** Sub-second tool latency via persistent server (`browse/src/server.ts`).
2.  **Persistent Browser State:** Retains cookies, tabs, and sessions across commands (`browse/src/browser-manager.ts`).
3.  **Accessibility Refs (@e1, @e2):** Stable element addressing via ARIA tree (`browse/src/snapshot.ts`).
4.  **Cursor-Interactive Refs (@c1):** Finds clickable elements missing from ARIA tree (`browse/src/snapshot.ts`).
5.  **Skill Template System:** Generates `SKILL.md` from `.tmpl` to prevent doc drift (`scripts/gen-skill-docs.ts`).
6.  **Directory Locking (`/freeze`):** Hard block on edits to sensitive directories (`freeze/SKILL.md`).
7.  **Destructive Command Warning (`/careful`):** Hook-based warnings for `rm -rf`, `DROP TABLE`, etc. (`careful/SKILL.md`).
8.  **Native SQLite Cookie Decryption:** Direct reading of browser cookie DBs (`browse/src/cookie-import-browser.ts`).
9.  **Localhost Bearer Auth:** Secure HTTP API for local tools (`browse/src/server.ts`).
10. **Automatic Server Lifecycle:** 30-minute idle timeout for the browser daemon (`browse/src/server.ts`).
11. **Version-Bound Restarts:** Auto-restarts server if binary version changes (`browse/src/cli.ts`).
12. **Three-Ring Buffer Logging:** High-performance, O(1) in-memory event logging (`browse/src/buffers.ts`).
13. **ELI16 Mode:** Simplified context recovery for high-load sessions (`scripts/resolvers/preamble.ts`).
14. **Institutional Memory:** JSONL-based operational learnings for agents (`scripts/resolvers/learnings.ts`).
15. **Universal `AskUserQuestion` Format:** Standardized interaction patterns (`scripts/resolvers/preamble.ts`).
16. **Multi-Workspace Port Isolation:** Random port selection to avoid conflicts (`browse/src/config.ts`).
17. **AI-Targeted Error Rewriting:** Actionable errors for agent recovery (`browse/src/commands.ts`).
18. **E2E Session Runner:** Framework for testing complex multi-turn skill flows (`test/helpers/session-runner.ts`).
19. **LLM-as-Judge Evals:** Automated scoring of skill outputs (`test/helpers/llm-judge.ts`).
20. **Design Comparison Gallery:** Visual feedback loops for UI iterations (`design/src/gallery.ts`).

### 7. Top 20 Smart Patterns
1.  **Ref-based Addressing:** Using accessibility IDs instead of brittle CSS selectors (`ARCHITECTURE.md`).
2.  **Stateful Daemon:** Maintaining a long-lived process for sub-second latency (`ARCHITECTURE.md`).
3.  **Template-Driven Skills:** Single source of truth for both code and documentation (`scripts/gen-skill-docs.ts`).
4.  **Search Before Building:** Three-layer knowledge hierarchy (Tried-and-true, New-and-popular, First-principles) (`ETHOS.md`).
5.  **Boil the Lake:** Completeness over shortcuts when AI cost is low (`ETHOS.md`).
6.  **User Sovereignty:** AI recommends, user decides; agreement is a signal, not a mandate (`ETHOS.md`).
7.  **ELI16 Context Grounding:** Explaining complex problems in plain English for context recovery (`scripts/resolvers/preamble.ts`).
8.  **Operational Learnings Log:** Capturing project quirks and tool failures for future sessions (`scripts/resolvers/learnings.ts`).
9.  **Consensus Voting:** Requiring agreement between different models (e.g., Codex + Claude) (`scripts/resolvers/confidence.ts`).
10. **Atomic Design Commits:** Single-file, focused commits during UI iteration loops (`design/src/iterate.ts`).
11. **Eureka Moment Naming:** Celebrating first-principles breakthroughs in logs (`ETHOS.md`).
12. **Port Randomization:** Collision-free multi-workspace support (`browse/src/config.ts`).
13. **Read-Only Cookie Copying:** Avoiding SQLite locks on live browser databases (`browse/src/cookie-import-browser.ts`).
14. **Fast Staleness Detection:** 5ms async check for ref validity before action (`browse/src/browser-manager.ts`).
15. **Error Rewriting:** Stripping stack traces for AI-readable guidance (`browse/src/commands.ts`).
16. **Preamble Tiers:** Dynamically scaling skill complexity based on task depth (`scripts/resolvers/preamble.ts`).
17. **Binary Self-Healing:** Auto-restarts on crash or version mismatch (`browse/src/cli.ts`).
18. **In-Process Decryption:** Handling sensitive keys in memory only (`browse/src/cookie-import-browser.ts`).
19. **Circular Buffer Logging:** Non-blocking I/O for high-volume browser events (`browse/src/buffers.ts`).
20. **Shared Methodology Resolvers:** Reusing logic blocks across different specialist roles (`scripts/resolvers/composition.ts`).

### 8. Top 20 Development Trends
1.  **Shift to Role-Playing Specialists:** Moving from generic assistants to CEO/Eng/QA roles.
2.  **Browser-Native Development:** Deep integration of headless browsers for "real world" testing.
3.  **Safety-First Guardrails:** Increasing reliance on hooks to prevent destructive AI actions.
4.  **Self-Generating Documentation:** Automating the sync between CLI capabilities and AI prompts.
5.  **Multi-Model Orchestration:** Combining strengths of different LLMs (Claude for logic, Codex for adversarial review).
6.  **Telemetry-Driven Improvement:** Using anonymized usage data to refine skill prompts.
7.  **Context Compaction Recovery:** Specialized patterns (ELI16) to handle long-running agent sessions.
8.  **Design-to-Code Automation:** Formalizing the iteration loop between UI mockups and implementation.
9.  **Binary Distribution via Bun:** Moving away from `node_modules` at runtime for faster startup.
10. **Institutional Memory:** Storing local JSONL "learnings" to avoid repeating mistakes.
11. **Adversarial Evaluation:** Using LLMs to "red-team" development plans before execution.
12. **Platform Abstraction:** Standardizing host adapters (Claude, OpenClaw, Cursor).
13. **Sub-Second Tool Latency:** Aggressively optimizing toolchain performance for agent loops.
14. **Formalized QA Taxonomy:** Structured reporting of bugs found by AI agents.
15. **GitLab Support:** Expansion beyond GitHub for enterprise workflows.
16. **Interactive "Fix" Loops:** Agents re-verifying their own fixes via browser snapshots.
17. **Local-First Security:** Keeping sensitive data (cookies, API keys) on-device or in-memory.
18. **Update Automation:** Inline CLI upgrade flows with snooze options.
19. **First-Principles Thinking:** Encouraging agents to question "tried-and-true" patterns.
20. **Visual Regression Baselines:** Capturing "golden" screenshots for post-deploy monitoring.

### 9. Top 10 Advantages
1.  **Extreme Performance:** Sub-second tool latency is best-in-class for AI browser interaction.
2.  **Persistent Session State:** Only framework that reliably maintains cookies/sessions across AI turns.
3.  **Specialized Roles:** Role-based focus (CEO, Eng, QA) produces higher-quality architectural results.
4.  **Deep Safety Integration:** Guards and locks prevent common AI "hallucination" damage.
5.  **Zero-Dependency Deployment:** Compiled Bun binaries ensure a consistent developer experience.
6.  **Accessibility-First UX:** Stable element interaction via ARIA tree reduces agent frustration.
7.  **Automated Doc Sync:** Documentation never drifts from the actual CLI capabilities.
8.  **Institutional Memory:** Agents learn from their own mistakes over time in a specific project.
9.  **Cross-Platform Support:** Robust behavior across macOS, Windows, and Linux.
10. **Flexible Host Adapters:** Works with Claude Code, Codex, OpenClaw, and more.

### 10. Top 10 Limitations
1.  **Heavy Browser Dependency:** Requires Chromium/Playwright (significant download/resource usage).
2.  **Bun Lock-in:** Highly optimized for Bun; porting to standard Node.js would require effort.
3.  **Localhost Only:** The browser daemon is local; remote/cloud execution requires complex tunneling.
4.  **Ref Staleness:** Complex SPAs with fast-changing DOMs can still break ref addressing.
5.  **Setup Complexity:** Initial build and Playwright install can be daunting for non-technical users.
6.  **Single-User Focus:** Security model (Bearer tokens) is designed for a single local developer.
7.  **Idle Timeout:** 30-minute timeout may close browser sessions during long manual planning phases.
8.  **macOS Keychain Reliance:** Cookie decryption is most robust on macOS; Windows/Linux support is secondary.
9.  **Highly Opinionated:** The "Boil the Lake" and specialist roles may not suit all team cultures.
10. **Documentation Overwrite:** Manual edits to `SKILL.md` are wiped by the generator.

### 11. Top AI Skills (Used/Provided)
*   **Top 5 Used (Agent Lifecycle):**
    1.  `/office-hours` (Problem reframing/strategy) - `office-hours/SKILL.md`
    2.  `/plan-eng-review` (Architecture/Implementation plan) - `plan-eng-review/SKILL.md`
    3.  `/review` (Pre-ship PR review) - `review/SKILL.md`
    4.  `/qa` (Browser-based verification) - `qa/SKILL.md`
    5.  `/ship` (Deployment/PR opening) - `ship/SKILL.md`
*   **Top 5 Provided (Infrastructure):**
    1.  `/browse` (Raw browser access) - `browse/SKILL.md`
    2.  `/design-review` (Visual audit and fix) - `design-review/SKILL.md`
    3.  `/debug` (Systematic investigation) - `investigate/SKILL.md`
    4.  `/retro` (Session/Performance analytics) - `retro/SKILL.md`
    5.  `/guard` (Activating careful + freeze) - `guard/SKILL.md`

### 12. Data Inputs, Outputs, and Storage
*   **Inputs:** CLI Arguments, User Prompts, Accessibility Tree (JSON), Page Text, Screenshots (PNG), Browser Cookies (SQLite/Encrypted).
*   **Outputs:** Annotated Accessibility Tree (Text), JSONL Analytics/Logs, `SKILL.md` files, Git Commits, GitHub/GitLab PRs.
*   **Storage:** 
    *   **Local:** `.gstack/` (Project-specific state/logs), `~/.gstack/` (Global config/analytics/learnings).
    *   **Databases:** SQLite (Chromium cookies), JSONL (Learnings/Analytics).
    *   **Cloud:** Supabase (Remote telemetry/Update manifests).
*   **Source Reference:** `browse/src/tab-session.ts`, `scripts/resolvers/learnings.ts`, `supabase/migrations/`.

### 13. Detailed Architecture Review (Top 20 Modules)
1.  **CLI Entry (`browse/src/cli.ts`):** Handles command-line arguments and server health checks.
2.  **HTTP Server (`browse/src/server.ts`):** Bun-based server managing command dispatch and browser lifecycle.
3.  **Browser Manager (`browse/src/browser-manager.ts`):** Manages Playwright contexts, tabs, and ref persistence.
4.  **Snapshot Engine (`browse/src/snapshot.ts`):** Generates annotated accessibility trees and element refs.
5.  **Cookie Registry (`browse/src/cookie-import-browser.ts`):** Decrypts and imports browser cookies into Playwright.
6.  **Logging Engine (`browse/src/buffers.ts`):** High-speed circular buffers for browser events.
7.  **Command Dispatcher (`browse/src/commands.ts`):** Maps agent requests to Playwright actions (Read/Write/Meta).
8.  **Skill Generator (`scripts/gen-skill-docs.ts`):** Compiles `SKILL.md` files from code metadata and templates.
9.  **Host Adapter Factory (`hosts/factory.ts`):** Provides a unified interface for different AI hosts (Claude, Codex).
10. **Preamble Resolver (`scripts/resolvers/preamble.ts`):** Injects session tracking, telemetry, and voice rules into skills.
11. **Learnings Resolver (`scripts/resolvers/learnings.ts`):** Manages institutional memory across skill sessions.
12. **Design Engine (`design/src/generate.ts`):** Logic for iterating on UI components and generating variants.
13. **Gallery Manager (`design/src/gallery.ts`):** Generates HTML comparison boards for design feedback.
14. **QA Methodology Resolver (`scripts/resolvers/testing.ts`):** Defines the standard steps for AI bug hunting.
15. **Ship/Review Resolver (`scripts/resolvers/review.ts`):** Integrates with GitHub/GitLab for PR management.
16. **Update Checker (`bin/gstack-update-check`):** Queries Supabase for the latest gstack versions.
17. **Telemetry Ingest (`supabase/functions/telemetry-ingest/`):** Edge functions for collecting anonymized usage.
18. **Platform Detector (`bin/gstack-platform-detect`):** Normalizes behavior across OSs (macOS, Win, Linux).
19. **Configuration Manager (`browse/src/config.ts`):** Handles random port selection and local state persistence.
20. **CDP Inspector (`browse/src/cdp-inspector.ts`):** Deep integration with Chrome DevTools Protocol for advanced inspection.

### 14. Architecture Mermaid Graph
```mermaid
graph TD
    User([User CLI]) --> CLI[gstack CLI Binary]
    CLI -->|Health Check| Server[Bun HTTP Server]
    CLI -->|Command| Server
    Server -->|Bearer Auth| Security[Security Layer]
    Server -->|Playwright| PM[Browser Manager]
    PM -->|CDP| CD[Chromium Daemon]
    CD -->|State| ST[Tabs/Cookies/LocalStorage]
    
    Skill[Skill Template] -->|gen-skill-docs| SM[SKILL.md]
    SM -->|Load| Agent[Claude / Codex Agent]
    Agent -->|Execute| CLI
    
    Server -->|Logs| LB[Circular Buffers]
    LB -->|Async Flush| LF[.gstack/*.log]
    
    CLI -->|Telemetry| SB[Supabase Functions]
    CLI -->|Update Check| SB
    
    Agent -->|PR/MR| GH[GitHub / GitLab]
    
    subgraph Browser Automation
        PM
        CD
        ST
    end
    
    subgraph Knowledge Base
        LN[Learnings JSONL]
        CF[gstack-config]
    end
    
    CLI <--> Knowledge Base
```

### 15. Maturity, Stability, Security, Performance
*   **Maturity:** Beta (v0.x). Highly active development with a rapidly evolving role-based specialist architecture.
*   **Stability:** High for local workflows. The use of long-lived daemons and version-bound restarts makes it resilient to common CLI "stale state" issues.
*   **Security:** Strong. Localhost-only API, Bearer token authentication, and read-only database copies for cookie decryption provide excellent local security. macOS Keychain integration ensures sensitive keys are never stored in plaintext.
*   **Performance:** Best-in-class for AI browser interaction. Sub-second tool latency (100-200ms) enables conversational speed when agents use the browser.

### 16. Tests, CI/CD, Documentation
*   **Tests:** Extensive Bun-based test suite, Playwright E2E tests for skills, and LLM-as-judge evaluations for output quality (`test/`).
*   **CI Pipelines:** GitHub Actions handle image building (`ci-image.yml`), periodic evals (`evals-periodic.yml`), and documentation health (`skill-docs.yml`).
*   **Documentation:** Exceptional. `ARCHITECTURE.md` and `ETHOS.md` explain the "why," while self-generating `SKILL.md` files provide accurate agent prompts.
*   **AI Skills:** Core part of the framework; 20+ specialized skills provided with multi-tier preambles.

### 17. Top 20 Improvements/Fixes
1.  **Remote Browser Support:** Enable agent interaction with browsers running in cloud dev environments (e.g., Codespaces).
2.  **Multi-User Persistence:** Extend the Bearer auth to support shared team daemons securely.
3.  **SPA Auto-Snapshots:** Automatically refresh refs when SPAs change the URL without a full page reload (`browse/src/browser-manager.ts`).
4.  **Firefox/Safari Support:** Expand beyond Chromium for cross-browser QA.
5.  **Granular Freeze:** Allow directory-level or glob-level write permissions in `/freeze`.
6.  **Voice Control Native Integration:** Support for speech-to-text triggers in the preamble.
7.  **Shared Knowledge Graph:** Migrate from flat JSONL to a structured graph for team-wide institutional memory.
8.  **Native Windows Keychain Support:** Implement DPAPI support for cookie decryption on Windows (`browse/src/cookie-import-browser.ts`).
9.  **Jira/Linear Integration:** Expand connectors beyond GitHub/GitLab.
10. **Visual Regression Suite:** Add native "diffing" of screenshots in `/qa`.
11. **Interactive "Self-Correction":** Allow agents to automatically retry `fill`/`click` on ref staleness without agent-level logic.
12. **Telemetry Dashboard:** User-facing UI for visualizing their own session analytics.
13. **Plugin System:** Formalize the creation of custom skills by external developers.
14. **Offline Learnings:** Support for local embedding-based search for learnings.
15. **Encrypted Logs:** Optional encryption for session logs to satisfy enterprise requirements.
16. **CAPTCHA Assistance:** Hooks for human-in-the-loop CAPTCHA solving during AI-driven QA.
17. **Native Dashboard App:** A tray-based UI for monitoring the browser daemon and active sessions.
18. **Dependency Graph Visualizer:** Export Mermaid graphs directly from `/plan-eng-review`.
19. **Automatic Bug Reproduction:** Logic to generate standalone Playwright scripts from a failed `/qa` session.
20. **Upgrade Migration Rollbacks:** Support for reverting `gstack-upgrade` if a new version breaks project-specific skills.

### 18. Swarm/Graph Knowledge Reuse
1.  **`scripts/resolvers/composition.ts`:** Essential for combining multiple agent specialist inputs into a unified plan.
2.  **`test/helpers/llm-judge.ts`:** Standardizes the evaluation of different agent proposals.
3.  **`scripts/resolvers/confidence.ts`:** Implements the consensus logic required for multi-agent debates.
4.  **`scripts/resolvers/learnings.ts`:** Provides the shared memory/knowledge base interface.
5.  **`hosts/factory.ts`:** Enables the selection of the best model (Sonnet for logic, Haiku for speed) for specific swarm tasks.
6.  **`design/src/compare.ts`:** Reusable pattern for agents to compare and select the best implementation variant.
7.  **`scripts/resolvers/preamble.ts`:** Context grounding logic ensures all swarm members are aligned on the current state.
8.  **`test/helpers/session-runner.ts`:** Framework for running multi-agent tasks through to completion.
9.  **`scripts/resolvers/review.ts`:** Verification patterns to check the implementation plan against the spec.
10. **`browse/src/cdp-inspector.ts`:** State inspection allows the swarm to "look" at the graph or UI state to inform decisions.

### 19. Multi-User/Shared Knowledge Reuse
1.  **`scripts/resolvers/learnings.ts`:** Core JSONL pattern for append-only, searchable shared memory.
2.  **`supabase/functions/telemetry-ingest/`:** Patterns for aggregating knowledge/usage from multiple users.
3.  **`scripts/resolvers/preamble.ts`:** Session tracking logic to manage interactions across multiple active users.
4.  **`browse/src/token-registry.ts`:** Managing persistent tokens and identity in a shared environment.
5.  **`scripts/gen-skill-docs.ts`:** Synchronizing shared "skills" and documentation across a team.
6.  **`design/src/memory.ts`:** Visual memory system to share UI state across different user sessions.
7.  **`test/helpers/eval-store.ts`:** Persistence of success/failure metrics for shared learning.
8.  **`bin/gstack-community-dashboard`:** Visualization of shared usage and knowledge trends.
9.  **`scripts/resolvers/index.ts`:** Registry pattern for discovering shared resolvers and capabilities.
10. **`scripts/resolvers/utility.ts`:** Common utility functions that ensure consistent data formatting for the shared knowledge base.

### 20. Cloud/Edge/Messenger/Native Reuse
1.  **`browse/src/server.ts`:** The HTTP API architecture is highly portable to Cloudflare Workers or self-hosted edge servers.
2.  **`browse/src/platform.ts`:** Normalizes platform-specific logic, essential for running on varied hardware (Edge, Mobile, CLI).
3.  **`bin/gstack-platform-detect`:** Enables automatic configuration based on the execution environment.
4.  **`scripts/resolvers/constants.ts`:** Centralized endpoint configuration for remote/cloud communication.
5.  **`design/src/gallery.ts`:** Web-based visualization pattern suitable for messenger/mobile previews.
6.  **`browse/src/cookie-picker-ui.ts`:** Pattern for remote authenticated UIs (accessible via messenger/web).
7.  **`supabase/config.sh`:** Deployment scripts that can be adapted for Cloudflare/Edge provisioning.
8.  **`bin/gstack-open-url`:** Deep linking patterns for mobile/native app integration.
9.  **`browse/src/cdp-inspector.ts`:** Protocol for remote browser navigation and voice control integration.
10. **`scripts/resolvers/composition.ts`:** Modular logic blocks that can be deployed independently as edge functions.

### 21. Team Cooperative Workflows Reuse
1.  **`scripts/resolvers/preamble.ts`:** "User Sovereignty" check is the foundational pattern for human-agent cooperation.
2.  **`scripts/resolvers/learnings.ts`:** Institutional memory ensures agents don't repeat mistakes made by other team members.
3.  **`scripts/resolvers/confidence.ts`:** Consensus building is critical for resolving disagreements in cooperative workflows.
4.  **`scripts/resolvers/review-army.ts`:** Multi-agent review pattern mimics a human PR review cycle.
5.  **`test/team-mode.test.ts`:** Specific test cases for validating cooperative (multi-agent) behavior.
6.  **`scripts/resolvers/testing.ts`:** Shared methodology ensures all team members (human and agent) follow the same QA standards.
7.  **`bin/gstack-team-init`:** Automation for onboarding new human members to the agent-enhanced workflow.
8.  **`scripts/resolvers/composition.ts`:** Coordination of different "specialist" roles within a single team project.
9.  **`test/helpers/llm-judge.ts`:** Objective arbitration for when human team members have conflicting AI recommendations.
10. **`scripts/resolvers/review.ts`:** Standardized handoff patterns for when an agent finishes a task and a human needs to verify.
