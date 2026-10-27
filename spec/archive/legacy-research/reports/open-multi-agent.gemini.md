I will read the instructions in `.prompt.md` and the content of `open-multi-agent.xml` to proceed.
I will continue reading the content of `open-multi-agent.xml` from line 2001 to 4000 to gather more information about the codebase.
I will continue reading `open-multi-agent.xml` from line 4001 to 6000 to gather more details on the orchestrator, task queue, and built-in tools.
I will read `open-multi-agent.xml` from line 6001 to 8000 to cover the tool framework, text tool extractor, and utility functions.
I will search for the term "skill" in the XML to clarify if there is a specific "skills" framework or directory I missed.
# Project Review: Open Multi-Agent

## 1. Project Name and Description
**Open Multi-Agent** is a high-performance, model-agnostic TypeScript framework designed for building and orchestrating autonomous multi-agent teams. It follows a "Goal In, Result Out" philosophy, where complex natural language objectives are automatically decomposed into structured task graphs, executed by specialized agents, and synthesized into a final deliverable. The framework is designed to be lightweight with minimal runtime dependencies (Anthropic, OpenAI, and Zod), making it suitable for deployment in environments ranging from edge functions and serverless environments to enterprise-grade backend systems.

The core architecture revolves around a **Coordinator-Worker** pattern. When a team is tasked with a goal, a temporary coordinator agent analyzes the available agent roster and generates a dependency-aware task plan. These tasks are then managed by a robust, event-driven queue and executed in parallel across a concurrency-controlled agent pool. This approach ensures that independent sub-tasks are processed simultaneously, significantly reducing the total time-to-completion compared to linear execution models.

Beyond simple orchestration, Open Multi-Agent includes enterprise-ready features such as namespaced shared memory, inter-agent messaging (pub/sub), exponential backoff retries, and comprehensive loop detection. It also provides a suite of "standard library" tools for filesystem operations and shell execution, allowing agents to interact directly with their environment while maintaining safety through granular access controls and token budgeting.

## 2. Supported Platforms and Requirements
*   **Node.js:** Requires Node.js version 18.0.0 or higher. (`package.json`)
*   **Runtime Environments:** Compatible with any environment that runs Node.js, including:
    *   Server-side applications (Express, Fastify, NestJS).
    *   Serverless functions (AWS Lambda, Vercel Functions, Netlify).
    *   CI/CD pipelines (GitHub Actions, GitLab CI).
    *   Local development environments.
*   **Dependencies:**
    *   `@anthropic-ai/sdk`
    *   `openai`
    *   `zod`
    *   Optional: `@google/genai` (for Gemini support).

## 3. Supported Connectors
*   **Anthropic:** Full support for Claude 3/3.5 models. (`src/llm/anthropic.ts`)
*   **OpenAI:** Supports GPT-4o, GPT-3.5, and O1 models. (`src/llm/openai.ts`)
*   **Grok (xAI):** Support for Grok-series models via OpenAI-compatible API. (`src/llm/grok.ts`)
*   **Google Gemini:** Support for Gemini 1.5 Pro/Flash. (`src/llm/gemini.ts`)
*   **GitHub Copilot:** Support for Copilot Chat models with built-in OAuth2 device flow for token management. (`src/llm/copilot.ts`)
*   **Local Models:** Compatible with Ollama, vLLM, LM Studio, and llama.cpp via the OpenAI adapter. (`src/llm/openai-common.ts`, `examples/10-local-models.ts`)

## 4. Supported Models and Agents
*   **Remote Models:** Claude 3.5 Sonnet, GPT-4o, Grok-1, Gemini 1.5 Pro.
*   **Local Models:** Any model served via OpenAI-compatible protocol (e.g., Llama 3, Mistral, Qwen via Ollama).
*   **Authentication:**
    *   **API Keys:** Configurable via environment variables (e.g., `ANTHROPIC_API_KEY`) or constructor overrides. (`src/types.ts`)
    *   **OAuth2:** Specialized support for GitHub Copilot's device flow and session token refreshing. (`src/llm/copilot.ts`)

## 5. Top 5 Use Cases
1.  **Autonomous Software Development:** Decomposing feature requests into Architecture, Implementation, and Review tasks. (`examples/02-team-collaboration.ts`)
2.  **Multi-Perspective Code Review:** Running parallel agents specialized in Security, Performance, and Style to audit a codebase. (`examples/14-multi-perspective-code-review.ts`)
3.  **Research & Synthesis:** Aggregating data from multiple sources (MapReduce style) to produce a comprehensive report. (`examples/07-fan-out-aggregate.ts`, `examples/15-research-aggregation.ts`)
4.  **Automated Task Pipelines:** Executing sequential workflows like "Design -> Implement -> Test -> Deploy" with failure retries. (`examples/03-task-pipeline.ts`)
5.  **Structured Data Extraction:** Converting unstructured logs or documents into validated JSON objects using Zod schemas. (`examples/09-structured-output.ts`)

## 6. Top 20 Features
1.  **Auto Task Decomposition:** The "Killer Feature" that turns goals into task DAGs. (`src/orchestrator/orchestrator.ts`)
2.  **Dependency-Aware Task Queue:** Handles complex task relationships and topological sorting. (`src/task/queue.ts`)
3.  **Parallel execution:** Runs independent tasks concurrently up to a configurable limit. (`src/agent/pool.ts`)
4.  **Namespaced Shared Memory:** Agents share context while maintaining data organization. (`src/memory/shared.ts`)
5.  **Inter-Agent Messaging:** A message bus for explicit point-to-point or broadcast communication. (`src/team/messaging.ts`)
6.  **Model Agnostic Adapters:** Single interface for all major LLM providers. (`src/llm/adapter.ts`)
7.  **Structured Output Validation:** Native Zod integration for guaranteed output formats. (`src/agent/structured-output.ts`)
8.  **Exponential Backoff Retries:** Robust handling of transient task failures. (`src/orchestrator/orchestrator.ts`)
9.  **Loop Detection:** Identifies and breaks repetitive agent "stuck" states. (`src/agent/loop-detector.ts`)
10. **Token Budgeting:** Caps cumulative token usage to prevent runaway costs. (`src/orchestrator/orchestrator.ts`)
11. **Human-in-the-loop Approval:** Pause execution between rounds for human review. (`src/orchestrator/orchestrator.ts`)
12. **Built-in Toolbelt:** Standard tools for `bash`, `grep`, and file I/O. (`src/tool/built-in/`)
13. **Tool Access Control:** Presets and white/blacklists for agent security. (`src/agent/runner.ts`)
14. **Local Model Fallback:** Text-based tool extraction for models without native tool calling. (`src/tool/text-tool-extractor.ts`)
15. **Streaming Support:** Real-time event emission for UI/UX responsiveness. (`src/agent/agent.ts`)
16. **Keyword Affinity Scheduling:** Automatically assigns tasks to the most capable agents. (`src/orchestrator/scheduler.ts`)
17. **Observability Tracing:** Emits structured events for LLM calls, tools, and tasks. (`src/utils/trace.ts`)
18. **OAuth2 Device Flow:** Native support for modern authentication schemes. (`src/llm/copilot.ts`)
19. **Custom Tooling API:** Simple `defineTool` wrapper for extending agent capabilities. (`src/tool/framework.ts`)
20. **Automatic Workspace Setup:** Ensures parent directories exist for file operations. (`src/tool/built-in/file-write.ts`)

## 7. Architecture Description and Workflow
The framework follows a modular, event-driven architecture. The **Orchestrator** acts as the brain, managing the high-level lifecycle. When `runTeam` is called, it initializes a **Team** (roster + memory) and uses a **Coordinator Agent** to perform the initial decomposition. This result is a list of **Tasks** with defined dependencies.

The tasks are fed into a **TaskQueue** which uses Kahn's algorithm for topological sorting. The **Scheduler** then assigns tasks to available **Agents**. The **AgentPool** manages the concurrency of these agents, ensuring the system doesn't exceed the `maxConcurrency` limit (using a `Semaphore`). Each agent run is managed by an **AgentRunner**, which handles the LLM interaction loop, tool execution via **ToolExecutor**, and loop detection. As tasks complete, the queue unblocks dependents, triggering the next round of execution until the goal is synthesized by the coordinator.

## 8. AI/LLM-Specific Features and Implementation Details
*   **Tool Extraction Safety Net:** For models like Ollama or older local models that might not support the `tool_calls` wire format, `src/tool/text-tool-extractor.ts` provides a robust regex and brace-depth-tracking parser to extract JSON tool calls from raw text.
*   **Loop Detection:** `src/agent/loop-detector.ts` tracks a sliding window of recent messages and tool calls. If it detects repetition beyond `maxRepetitions`, it can warn the model with an "injection" message or terminate the run to prevent wasted tokens.
*   **Zod-to-JSON Schema:** The `src/tool/framework.ts` contains a custom converter that recursively translates Zod schemas into the JSON Schema format required by Anthropic/OpenAI, including support for unions, intersections, and defaults.
*   **Token Budgeting:** Every orchestrator run tracks `cumulativeUsage`. If the budget is exceeded, it gracefully shuts down the run, marking remaining tasks as skipped. (`src/orchestrator/orchestrator.ts`)

## 9. Top 20 Code Symbols
1.  `OpenMultiAgent`: Primary class for team orchestration. (`src/orchestrator/orchestrator.ts`)
2.  `Team`: Manages agent roster, messaging, and shared memory. (`src/team/team.ts`)
3.  `Agent`: The conversational core for a single entity. (`src/agent/agent.ts`)
4.  `TaskQueue`: State machine for dependency tracking. (`src/task/queue.ts`)
5.  `Scheduler`: Strategy engine for task assignment. (`src/orchestrator/scheduler.ts`)
6.  `AgentPool`: Concurrency controller for multiple agents. (`src/agent/pool.ts`)
7.  `SharedMemory`: Key-value store with namespacing. (`src/memory/shared.ts`)
8.  `MessageBus`: Pub/Sub system for agent communication. (`src/team/messaging.ts`)
9.  `ToolRegistry`: Container for available agent tools. (`src/tool/framework.ts`)
10. `ToolExecutor`: Handles the execution and validation of tool calls. (`src/tool/executor.ts`)
11. `LLMAdapter`: Abstract interface for all model providers. (`src/types.ts`)
12. `runTeam()`: Flagship method for auto-orchestration. (`src/orchestrator/orchestrator.ts`)
13. `defineTool()`: Factory for creating typed tools. (`src/tool/framework.ts`)
14. `createTask()`: Factory for task objects. (`src/task/task.ts`)
15. `isSimpleGoal()`: Heuristic check to skip decomposition. (`src/orchestrator/orchestrator.ts`)
16. `selectBestAgent()`: Keyword-based agent selection helper. (`src/orchestrator/orchestrator.ts`)
17. `extractToolCallsFromText()`: Fallback parser for local models. (`src/tool/text-tool-extractor.ts`)
18. `zodToJsonSchema()`: Zod to LLM-schema converter. (`src/tool/framework.ts`)
19. `Semaphore`: Lightweight async concurrency guard. (`src/utils/semaphore.ts`)
20. `AgentRunner`: Low-level executor for the agent loop. (`src/agent/runner.ts`)

## 10. Top 20 File Paths
1.  `src/orchestrator/orchestrator.ts` - Central logic.
2.  `src/orchestrator/scheduler.ts` - Task distribution logic.
3.  `src/agent/agent.ts` - Agent conversation loop.
4.  `src/agent/runner.ts` - LLM interaction management.
5.  `src/agent/pool.ts` - Concurrency management.
6.  `src/task/queue.ts` - Dependency resolution.
7.  `src/task/task.ts` - Task utilities.
8.  `src/team/team.ts` - Team state management.
9.  `src/team/messaging.ts` - Inter-agent communication.
10. `src/memory/shared.ts` - Shared context store.
11. `src/tool/framework.ts` - Tool definition system.
12. `src/tool/executor.ts` - Tool execution engine.
13. `src/tool/text-tool-extractor.ts` - Local model fallback logic.
14. `src/llm/adapter.ts` - Provider factory.
15. `src/llm/anthropic.ts` - Claude implementation.
16. `src/llm/openai.ts` - GPT implementation.
17. `src/llm/copilot.ts` - GitHub Copilot implementation.
18. `src/utils/semaphore.ts` - Concurrency primitive.
19. `src/types.ts` - Central type definitions.
20. `src/index.ts` - Public entry point.

## 11. Top 5 Used and Top 5 Provided AI Skills
### Provided AI Skills (Tools)
1.  **`bash`**: Direct shell command execution with timeout and CWD control. (`src/tool/built-in/bash.ts`)
2.  **`file-edit`**: Precise string replacement in files with uniqueness validation. (`src/tool/built-in/file-edit.ts`)
3.  **`file-read`**: Line-numbered file reading with offset/limit support. (`src/tool/built-in/file-read.ts`)
4.  **`file-write`**: Atomic file creation with automatic directory hierarchy setup. (`src/tool/built-in/file-write.ts`)
5.  **`grep`**: High-performance regex search using `ripgrep` with Node.js fallback. (`src/tool/built-in/grep.ts`)

### Used AI Skills (Framework Capabilities)
1.  **Decomposition**: Breaking natural language goals into task DAGs. (`src/orchestrator/orchestrator.ts`)
2.  **Parallel Coordination**: Managing multiple concurrent agent sessions. (`src/agent/pool.ts`)
3.  **Context Namespacing**: Efficiently sharing memory across agents. (`src/memory/shared.ts`)
4.  **Affinity Scheduling**: Matching task requirements to agent capabilities. (`src/orchestrator/scheduler.ts`)
5.  **Loop Correction**: Autonomously identifying and escaping repetitive cycles. (`src/agent/loop-detector.ts`)

## 12. List of All Supported Connectors (Source References)
*   **Anthropic:** `src/llm/anthropic.ts`
*   **OpenAI:** `src/llm/openai.ts`
*   **Grok (xAI):** `src/llm/grok.ts` (uses OpenAI adapter)
*   **Gemini (Google):** `src/llm/gemini.ts`
*   **GitHub Copilot:** `src/llm/copilot.ts`
*   **Local OpenAI-Compatible:** `src/llm/openai-common.ts`

## 13. Top 5 Patterns and Top 5 Anti-patterns
### Top 5 Patterns
1.  **Coordinator-Worker**: Centralizes planning while decentralizing execution.
2.  **Adapter Pattern**: Decouples the orchestrator from specific LLM provider quirks.
3.  **Semaphore-based Concurrency**: Prevents overwhelming APIs or local resources.
4.  **Topological Queue**: Ensures strict execution order for dependent tasks.
5.  **Graceful Cascade Failure**: Automatically skips downstream tasks if a dependency fails.

### Top 5 Anti-patterns
1.  **Brittle JSON Parsing**: Relying on LLMs to output perfect JSON (mitigated by text extraction fallback).
2.  **Coordinator Hallucination**: If the coordinator generates invalid task IDs, the run can stall.
3.  **Shared Memory Pollution**: No strict validation on what agents write to shared memory.
4.  **Greedy Scheduling**: `capability-match` is simple and may miss subtle role nuances.
5.  **Sequential Hook Execution**: `beforeRun` hooks run in sequence, potentially adding latency.

## 14. Top 5 Used and Top 5 Provided AI Tools
### Provided
*   `bash` (`src/tool/built-in/bash.ts`)
*   `grep` (`src/tool/built-in/grep.ts`)
*   `file_read` (`src/tool/built-in/file-read.ts`)
*   `file_write` (`src/tool/built-in/file-write.ts`)
*   `file_edit` (`src/tool/built-in/file-edit.ts`)

### Used (External Dependencies)
*   **Anthropic SDK**: Core LLM interface.
*   **OpenAI SDK**: Interface for GPT and local models.
*   **Zod**: Runtime type validation and schema generation.
*   **Vitest**: Testing framework.
*   **ripgrep (rg)**: Native binary for fast searching.

## 15. Technical Maturity (8/10)
**Score: 8/10**
The project is highly mature for a developer framework. It features strong type safety (TypeScript), comprehensive test coverage (unit, integration, and E2E), and handles advanced production concerns like token budgets, exponential backoff, and loop detection. The architecture is modular and decoupled, allowing for easy extension. The inclusion of Copilot OAuth support and local model fallbacks shows significant real-world hardening. It lacks only built-in MCP (Model Context Protocol) support and more advanced multi-modal orchestration to reach 10/10.

## 16. Review of Tests, CI, Docs, Skills
*   **Tests:** 50+ test files using `vitest`. Includes contract tests for LLM adapters and E2E tests against real APIs. (`tests/`)
*   **CI:** Robust GitHub Actions pipeline for linting, type checking, and testing. (`.github/workflows/ci.yml`)
*   **Docs:** Highly detailed documentation in `README.md`, `DECISIONS.md`, and `CLAUDE.md`. JSDoc coverage is excellent.
*   **Skills:** Provided as "Built-in Tools" with a clear framework for extension. (`src/tool/built-in/`)

## 17. Critical Review & Recommendation
**Review:** The framework is exceptionally well-structured for building reliable agentic workflows. The decision to separate the `AgentRunner` from the `Agent` class allows for high observability and testing of the interaction loop without triggering expensive LLM calls. The "Coordinator" pattern is the project's strongest asset, enabling true "Zero-Shot" multi-agent coordination.

**Recommendation:**
1.  **MCP Integration:** Adding support for the Model Context Protocol would allow the framework to tap into a massive ecosystem of existing tools.
2.  **Dynamic Roster Adjustment:** Allow the coordinator to "hire" new agents mid-run if the task requires a capability not present in the initial team.
3.  **State Persistence:** Add a way to serialize and resume full Orchestrator runs to disk/database for long-running workflows.

## 18. Workflow and Agent Descriptions
1.  **Coordinator Agent:** (Dynamic/Temporary) Receives the goal, analyzes the agent roster, generates the JSON task plan, and synthesizes the final answer.
2.  **Worker Agent:** (User-defined) Specialized agents configured with specific models, system prompts, and tool access to perform discrete tasks.
3.  **Workflow:**
    *   **Goal Analysis -> Decomposition -> Task Queuing -> Scheduling -> Parallel Execution -> synthesis.**

## 19. All Core Functions and Class Methods
*   `OpenMultiAgent.runTeam()`: High-level entry point.
*   `OpenMultiAgent.runTasks()`: Explicit task list execution.
*   `TaskQueue.complete()` / `fail()`: State transitions.
*   `Agent.run()` / `stream()`: Individual agent execution.
*   `SharedMemory.get()` / `set()`: Context management.
*   `Scheduler.autoAssign()`: Assignment logic.

## 20. Top 5 Used and Top 5 Provided AI Skills (Cooperative)
1.  **Provided: Approval Gate (`onApproval`)**: Allows humans to review and approve the next "round" of tasks. (`src/orchestrator/orchestrator.ts`)
2.  **Provided: Structured Results (`outputSchema`)**: Ensures agents provide data in a format humans/systems expect. (`src/agent/runner.ts`)
3.  **Used: Inter-agent Hand-off**: Automated task dependency resolution ensures work moves from one agent to the next without human intervention. (`src/task/queue.ts`)
4.  **Used: Shared Context Synthesis**: The coordinator's ability to pull from all agents' shared memory to produce a unified human-readable summary. (`src/orchestrator/orchestrator.ts`)
5.  **Provided: Tracing Observability (`onTrace`)**: Gives humans deep visibility into what the agents did and why. (`src/utils/trace.ts`)

## 21. AI Skills for Cooperative Workflows
1.  **Protocol-Driven Communication:** Using Zod schemas to define strict "contracts" for inter-agent messages. (`src/agent/structured-output.ts`)
2.  **Context Namespacing:** Preventing agents from overriding each other's data by using isolated memory buckets. (`src/memory/shared.ts`)
3.  **Reactive Re-planning:** Using the `onApproval` gate to allow humans to inject new tasks mid-run. (`src/orchestrator/orchestrator.ts`)
4.  **Trace-Based Audit:** Using the `TraceEvent` stream to build real-time dashboards for human supervisors. (`src/utils/trace.ts`)
5.  **Keyword capability Matching:** Allowing the system to automatically pick the right human or agent specialist for a task based on description. (`src/orchestrator/scheduler.ts`)
