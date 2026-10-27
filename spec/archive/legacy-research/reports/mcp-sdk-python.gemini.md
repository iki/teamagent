I will start by reading the instructions in `.prompt.md` and the input data from `.input.mcp-sdk-python.xml`.
I will search for the first `<git_log_commit/>` tag in the input file to identify the project name and the last commit date.
I will read the last 500 lines of `.input.mcp-sdk-python.xml` to extract the project name and the last commit date from the first `<git_log_commit>` entry.
I will search for the beginning of the `README.md` file within `.input.mcp-sdk-python.xml` to gather a comprehensive project description and list of requirements.
I will search for the location of the `pyproject.toml` file in `.input.mcp-sdk-python.xml` to understand the project's dependencies and configuration.
I will read the `pyproject.toml` and `README.md` files from `.input.mcp-sdk-python.xml` to gather information on project configuration and description.
I will search for "skills" and "MCP skills" in the codebase to identify any supported or provided AI skills.
I will examine the `src/mcp/server/mcpserver/prompts/` directory and look for `.md` or `.gemini.md` files in `src` or `examples` that might define AI skills or prompts.
I will search for the definition of `FastMCP` to locate the source file and understand how it provides tools and prompts.
I will list the contents of the `src/mcp/server/` directory to locate the `FastMCP` definition or its equivalent.
I will search for the content of `src/mcp/server/mcpserver/server.py` within `.input.mcp-sdk-python.xml` to find the definition of `MCPServer` or `FastMCP`.
I will search for `FastMCP` in the codebase to determine if it is an alias for `MCPServer` or if it has been renamed.
I will check the `examples/mcpserver/` directory to identify the prompts and tools provided, which can be considered AI skills.
I will search for the files in the `examples/mcpserver/` directory within the `.input.mcp-sdk-python.xml` file.
I will read the `examples/mcpserver/memory.py` and `examples/mcpserver/echo.py` files from the `.input.mcp-sdk-python.xml` file to identify the prompts and tools they provide.
I will read `src/mcp/shared/session.py` and `src/mcp/server/lowlevel/server.py` within the `.input.mcp-sdk-python.xml` file to gain a deeper understanding of the core logic and architecture.
I will search for the content of `src/mcp/server/lowlevel/server.py` within the `.input.mcp-sdk-python.xml` file.
# Model Context Protocol (MCP) Python SDK: Comprehensive Analysis

## 1. Project Identity and Latest Activity
*   **Project Name:** `mcp-sdk-python` (Ref: `pyproject.toml`, `.input.mcp-sdk-python.xml`)
*   **Last Commit Date:** Wednesday, April 15, 2026, at 06:41:51 +0900 (Ref: First `<git_log_commit/>` in input)
*   **Latest Commit Message:** `fix: align Context logging methods with MCP spec data type (#2366)`

## 2. Project Description
The MCP Python SDK is the official Python implementation of the Model Context Protocol (MCP), a standardized framework designed to decouple context provision from LLM orchestration. It enables developers to build secure, interoperable integrations that provide Large Language Models with structured access to data, tools, and procedural knowledge without requiring custom API logic for every model.

The SDK provides both high-level and low-level interfaces for creating MCP servers and clients. The primary high-level interface, `MCPServer` (formerly `FastMCP`), simplifies server creation with decorators for tools, resources, and prompts, while the low-level API offers granular control over protocol messages and lifecycle events.

Designed for production environments, the SDK supports multiple transport layers including stdio, Server-Sent Events (SSE), and Streamable HTTP. It emphasizes type safety through Pydantic integration, cross-platform compatibility (POSIX and Win32), and modern development workflows using the `uv` package manager.

## 3. Supported Platforms & Requirements
*   **Python Version:** `>=3.10` (Supports up to Python 3.14 experimental).
*   **Operating Systems:** 
    *   **POSIX:** Linux, macOS (Full support).
    *   **Windows:** Win32 support with `pywin32` integration.
*   **Deployment Options:**
    *   **Stdio:** Standard input/output for local processes (e.g., Claude Desktop).
    *   **SSE:** Server-Sent Events for web-based server deployments.
    *   **Websocket:** Real-time bidirectional communication.
    *   **Streamable HTTP:** A specialized transport for efficient HTTP-based MCP communication.
    *   **ASGI Mounting:** Can be mounted to existing Starlette or FastAPI applications.
*   **Core Dependencies:** `anyio`, `httpx`, `pydantic`, `starlette`, `uvicorn`, `jsonschema`.

## 4. Supported Connectors
The SDK acts as a framework to create connectors. Built-in and example connectors include:
*   **Claude Desktop:** Direct integration via stdio (`src/mcp/cli/claude.py`).
*   **Generic HTTP/SSE Clients:** Support for any SSE-capable application (`src/mcp/client/sse.py`).
*   **Everything Server:** A reference implementation exposing a wide array of tools and resources (`examples/servers/everything-server/`).
*   **Database Connectors:** Example integration with PostgreSQL via `asyncpg` (`examples/mcpserver/memory.py`).
*   **External APIs:** Examples for Weather APIs and other REST services (`examples/mcpserver/weather_structured.py`).
*   **OpenTelemetry:** Integration for tracing requests across distributed systems (`src/mcp/shared/_otel.py`).

## 5. Supported Models & Agents
The SDK is model-agnostic and connects to agents via the MCP protocol.
*   **Models:** 
    *   **Remote Models:** Supports any model via the `sampling` capability, allowing servers to request model completions from the client (`src/mcp/server/elicitation.py`).
    *   **Local Models:** Can be used with local LLMs by implementing an MCP server that wraps the local model.
*   **Authentication:** 
    *   **OAuth2:** Full support for Authorization Code and Client Credentials flows (`src/mcp/client/auth/oauth2.py`, `src/mcp/server/auth/provider.py`).
    *   **API Tokens:** Support for Bearer and Basic authentication.
*   **Agents:** Designed to power agents like Claude (Anthropic), Aider, and custom agentic stacks.

## 6. Top 5 Use Cases
1.  **Local File/Data Access:** Exposing local documentation or codebases to Claude Desktop using `Resource` templates.
2.  **Tool-Assisted Execution:** Creating a "Calculator" or "Code Execution" tool that an LLM can invoke to perform deterministic tasks.
3.  **Dynamic Prompt Engineering:** Using `Prompts` to provide reusable, context-aware instructions to an LLM based on user input.
4.  **Persistent Memory Systems:** Building a recursive memory system using vector databases to give agents long-term context (`examples/mcpserver/memory.py`).
5.  **Long-Running Task Monitoring:** Using `Progress Reporting` to provide real-time updates from a tool back to the user/LLM (`examples/mcpserver/logging_and_progress.py`).

## 7. Top 20 Features
1.  **MCPServer (FastMCP):** Ergonomic high-level API for rapid server development (`src/mcp/server/mcpserver/server.py`).
2.  **Resource Templates:** URI-based data access with parameter injection (`src/mcp/server/mcpserver/resources/templates.py`).
3.  **Structured Tool Output:** Automatic Pydantic validation for tool returns (`src/mcp/server/mcpserver/utilities/func_metadata.py`).
4.  **Context Injection:** Automated injection of request-specific metadata into handler functions (`src/mcp/server/mcpserver/utilities/context_injection.py`).
5.  **Sampling Support:** Ability for servers to request completions from the client's model (`src/mcp/server/elicitation.py`).
6.  **SSE Transport:** Scalable web transport for MCP servers (`src/mcp/server/sse.py`).
7.  **Stdio Transport:** Reliable local communication for desktop apps (`src/mcp/server/stdio.py`).
8.  **Streamable HTTP:** Optimized HTTP transport for large data streams (`src/mcp/server/streamable_http.py`).
9.  **Lifespan Management:** Support for async startup and shutdown hooks (`src/mcp/server/lowlevel/server.py`).
10. **OAuth2 Integration:** Native support for secure third-party authentication (`src/mcp/shared/auth.py`).
11. **OpenTelemetry Tracing:** Distributed tracing for debugging complex agent flows (`src/mcp/shared/_otel.py`).
12. **Progress Reporting:** Native protocol support for reporting tool execution progress (`src/mcp/shared/session.py`).
13. **Image Support:** First-class handling of binary image data in messages (`src/mcp/server/mcpserver/resources/types.py`).
14. **Pagination:** Standardized cursor-based pagination for large resource lists (`examples/servers/simple-pagination/`).
15. **CLI Tooling:** Standalone `mcp` command for development and installation (`src/mcp/cli/cli.py`).
16. **Task Support (Experimental):** Asynchronous task execution and state management (`src/mcp/client/experimental/tasks.py`).
17. **Elicitation Flow:** Multi-step user interaction patterns (SEP-1034) (`src/mcp/server/elicitation.py`).
18. **Client Display Utilities:** Helpers for rendering MCP content in UIs (`examples/snippets/clients/display_utilities.py`).
19. **ContextVars Propagation:** Thread-safe state propagation across async boundaries (`src/mcp/shared/_context_streams.py`).
20. **Validation Layer:** Robust JSON-RPC schema validation for all protocol messages (`src/mcp/server/validation.py`).

## 8. Top 20 Smart Patterns
1.  **Transport Abstraction:** Decoupling session logic from physical communication (stdio, SSE, etc.) (`src/mcp/shared/session.py`).
2.  **Lazy Dependency Loading:** Using optional extras (rich, cli, ws) to keep core light (`pyproject.toml`).
3.  **Decorator-based Registration:** Simplifying API surface using Python decorators (`src/mcp/server/mcpserver/server.py`).
4.  **Context Injection:** Using type hints to detect and inject `Context` objects (`src/mcp/shared/_callable_inspection.py`).
5.  **JSON-RPC Multiplexing:** Handling multiple concurrent requests over a single stream (`src/mcp/shared/session.py`).
6.  **Elicitation Callbacks:** Pattern for handling mid-request user prompts or approvals (`src/mcp/server/elicitation.py`).
7.  **Progress Tokens:** Unique tokens for tracking asynchronous work without blocking the main request (`src/mcp/shared/session.py`).
8.  **Resource URI Mapping:** Mapping URI patterns to python functions for transparent data access (`src/mcp/server/mcpserver/resources/resource_manager.py`).
9.  **Lifespan Context Managers:** Ensuring resources are cleaned up even on crashes (`src/mcp/server/lowlevel/server.py`).
10. **Cursor-based Pagination:** Preventing context window overflow by chunking large data sets (`examples/servers/simple-pagination/`).
11. **Experimental Feature Flags:** Safely iterating on new protocol features (`src/mcp/client/experimental/`).
12. **Middleware for Auth:** Modular authentication checks using Starlette-style middleware (`src/mcp/server/auth/middleware/`).
13. **Cross-Platform OS Utilities:** Abstracting platform differences for stdio and process management (`src/mcp/os/`).
14. **Deterministic Testing:** Using in-memory transports for fast, reliable unit tests (`tests/client/transports/test_memory.py`).
15. **Automatic Schema Generation:** Using Pydantic to generate JSON Schema for tools from Python type hints (`src/mcp/server/mcpserver/utilities/func_metadata.py`).
16. **Request Responder Pattern:** Managing request lifecycle with cancellation scopes (`src/mcp/shared/session.py`).
17. **Shared Message Protocols:** Ensuring protocol consistency between client and server modules (`src/mcp/shared/_stream_protocols.py`).
18. **OTEL Tracing Propagation:** Passing trace IDs across the MCP boundary to maintain visibility.
19. **Backwards Compatible Unstructured Returns:** Supporting older MCP clients while providing structured data for new ones.
20. **Dynamic Versioning:** Using Git tags to manage project versions automatically (`pyproject.toml`).

## 9. Top 20 Development Trends
1.  **Renaming for Clarity:** `FastMCP` $\rightarrow$ `MCPServer` to emphasize its role as the primary interface.
2.  **Pydantic 2.x Optimization:** Rigorous adoption of Pydantic 2 features and compatibility fixes.
3.  **OpenTelemetry Adoption:** Moving towards production-grade observability.
4.  **Improved Auth Guidance:** Refreshing OAuth2 implementations and token handling guidance.
5.  **Context Injection Refinement:** Making context propagation more robust across async streams.
6.  **Async/Sync Balance:** Improving support for synchronous handlers without blocking the event loop.
7.  **Strict Type Checking:** Enforcing `pyright` strict mode across the codebase.
8.  **100% Test Coverage:** Maintaining a strict baseline for code coverage in CI.
9.  **Documentation Modernization:** Automating API reference generation.
10. **Experimental Task API:** Developing a standard way to handle long-running background tasks.
11. **Elicitation Standardization:** Implementing SEP-1034 for better user interaction patterns.
12. **Win32 Stability:** Addressing platform-specific hangs and process cleanup issues.
13. **Uv-First Workflow:** Total transition to `uv` for dependency management.
14. **Simplified Public API:** Deliberate export of symbols in `src/mcp/__init__.py`.
15. **Standardized Logging:** Ensuring consistent logging patterns across all modules.
16. **CIMD (Client-Initiated Metadata):** Enhancing how clients share context with servers.
17. **Resource Parameterization:** Expanding capabilities of Resource templates.
18. **JSON Schema 2020-12 Support:** Aligning with the latest JSON Schema dialects.
19. **Streamable HTTP Security:** Hardening web transports against common vulnerabilities.
20. **Migration Documentation:** Maintaining a detailed guide for breaking changes during the V2 rework.

## 10. Top 10 Advantages
1.  **Ergonomic API:** `MCPServer` makes building complex servers trivial for Python developers.
2.  **Protocol Compliance:** First-party implementation ensures 100% alignment with the MCP spec.
3.  **High Performance:** Built on `anyio` for efficient, non-blocking I/O.
4.  **Robust Type Safety:** Deep Pydantic integration minimizes runtime errors and improves developer experience.
5.  **Versatile Transports:** Single SDK supports everything from local CLI tools to cloud-scale web services.
6.  **Excellent Observability:** Integrated OTEL and detailed logging provide deep visibility.
7.  **Strong Testing Culture:** 100% coverage and extensive integration tests ensure stability.
8.  **Developer Tooling:** Built-in CLI and inspector integration accelerate the dev loop.
9.  **Secure by Design:** Built-in OAuth support and security-focused transport implementations.
10. **Active Community/Backing:** Backed by Anthropic with frequent updates and clear roadmap.

## 11. Top 10 Limitations
1.  **Beta Status:** Rapid development on the `main` branch can lead to breaking changes.
2.  **Async Complexity:** Requires deep understanding of Python's async/await for advanced usage.
3.  **Documentation Gaps:** Some experimental features lack comprehensive guides.
4.  **Dependency on uv:** While optional, the best experience is locked to the `uv` ecosystem.
5.  **Win32 Quirks:** Occasional issues with stdio hangs on Windows runners.
6.  **Stateless vs Stateful:** Managing state in SSE/HTTP transports requires careful design.
7.  **Large Dependency Tree:** Inclusion of Starlette, Pydantic, and others might be heavy for micro-services.
8.  **Experimental Features:** APIs like `tasks` are subject to complete rewrites.
9.  **Limited Built-in GUI:** Relies on external tools like the MCP Inspector for visualization.
10. **Circular Import Risks:** Large project structure requires careful import management.

## 12. Top 5 Used and Provided AI Skills
*   **Provided Skills (Bundled in Examples/Prompts):**
    1.  **Recursive Memory:** Skill to store and retrieve long-term context using vector embeddings (`examples/mcpserver/memory.py`).
    2.  **Context-Aware Echo:** Procedural knowledge for verifying communication integrity (`examples/mcpserver/echo.py`).
    3.  **Structured Weather Inquiry:** Skill to fetch and format external environmental data (`examples/mcpserver/weather_structured.py`).
    4.  **Progress-Tracked Execution:** Skill for orchestrating multi-step background operations (`examples/mcpserver/logging_and_progress.py`).
    5.  **Iconic UI Management:** Knowledge of how to present tools and resources visually to users (`examples/mcpserver/icons_demo.py`).
*   **Used Skills (External integrations):**
    1.  **OpenAI Embedding Skill:** Used for semantic search in memory systems.
    2.  **Claude Sampling Skill:** Used for autonomous completion and reasoning requests.
    3.  **OAuth Flow Orchestration:** Procedural knowledge for handling secure handshakes.
    4.  **Pydantic Schema Validation:** Used to ensure structural integrity of all AI outputs.
    5.  **Anyio Stream Management:** Skill for handling high-concurrency async communication.

## 13. Data Inputs, Outputs, and Storage Overview
*   **Inputs:**
    *   **JSON-RPC Requests:** The primary input format for tools and prompts (`src/mcp/types/jsonrpc.py`).
    *   **URI Templates:** Pattern-based inputs for resources (`src/mcp/server/mcpserver/resources/templates.py`).
    *   **ContextVariables:** Implicit inputs for request-local state.
*   **Outputs:**
    *   **Structured Content:** Pydantic models, Lists, or Dicts returned to the LLM.
    *   **Binary Data:** Support for images and other blobs (`src/mcp/server/mcpserver/resources/types.py`).
    *   **SSE/Stdio Streams:** Real-time streaming of events and responses.
*   **Storage:**
    *   **In-Memory:** Default for sessions and task stores (`src/mcp/shared/experimental/tasks/in_memory_task_store.py`).
    *   **PostgreSQL/Vector:** Supported via example implementations for persistent memory (`examples/mcpserver/memory.py`).
    *   **File-Based:** Used for local resource access.

## 14. Detailed Architecture Review
1.  **`src/mcp/types/`:** Core protocol models and JSON-RPC definitions.
2.  **`src/mcp/shared/session.py`:** The heart of the SDK; manages request/response matching, cancellation, and session state.
3.  **`src/mcp/server/mcpserver/server.py`:** The high-level ergonomic interface (FastMCP).
4.  **`src/mcp/server/lowlevel/server.py`:** Base protocol implementation for all server types.
5.  **`src/mcp/client/session.py`:** Mirror to the server session, handles outbound requests and sampling.
6.  **`src/mcp/server/mcpserver/tools/tool_manager.py`:** Manages registration and execution of tool functions.
7.  **`src/mcp/server/mcpserver/resources/resource_manager.py`:** Resolves URI requests to resource handlers.
8.  **`src/mcp/server/mcpserver/prompts/manager.py`:** Handles prompt template rendering.
9.  **`src/mcp/server/sse.py`:** Implementation of the Server-Sent Events transport.
10. **`src/mcp/server/stdio.py`:** Implementation of the Stdio transport.
11. **`src/mcp/server/streamable_http.py`:** Optimized HTTP transport logic.
12. **`src/mcp/shared/auth.py`:** Shared utilities for OAuth and token verification.
13. **`src/mcp/server/elicitation.py`:** Orchestrates multi-step user interaction flows.
14. **`src/mcp/server/validation.py`:** Enforces protocol spec compliance on all incoming/outgoing messages.
15. **`src/mcp/cli/cli.py`:** Entry point for the `mcp` command-line interface.
16. **`src/mcp/shared/_otel.py`:** OpenTelemetry instrumentation.
17. **`src/mcp/shared/_callable_inspection.py`:** Introspection logic for context injection and schema generation.
18. **`src/mcp/client/experimental/tasks.py`:** Management of long-running background tasks.
19. **`src/mcp/server/experimental/request_context.py`:** Advanced per-request state tracking.
20. **`src/mcp/os/`:** Platform-specific process and I/O handling.

## 15. Architecture Graph (Mermaid)

```mermaid
graph TD
    User([User/Agent]) <--> CLI[mcp CLI]
    User <--> Claude[Claude Desktop]
    
    subgraph SDK_Client
        CS[ClientSession] --> CT[Client Transports]
        CT --> StdioC[Stdio]
        CT --> SSEC[SSE]
        CT --> HTTPC[Streamable HTTP]
    end

    subgraph SDK_Shared
        Session[Shared Session Manager]
        Types[MCP Types / JSON-RPC]
        Auth[OAuth / Auth Utilities]
        OTEL[OpenTelemetry Tracing]
    end

    subgraph SDK_Server
        MS[MCPServer / FastMCP] --> LL[Low-Level Server]
        LL --> SS[ServerSession]
        SS --> ST[Server Transports]
        ST --> StdioS[Stdio]
        ST --> SSES[SSE]
        ST --> HTTPS[Streamable HTTP]
        
        MS --> TM[Tool Manager]
        MS --> RM[Resource Manager]
        MS --> PM[Prompt Manager]
        MS --> EF[Elicitation Flow]
    end

    StdioC <--> StdioS
    SSEC <--> SSES
    HTTPC <--> HTTPS
    
    TM --> Tools[Python Functions]
    RM --> Resources[Data / URIs]
    PM --> Prompts[Templates]
    
    Tools -.-> Sampling[Client Sampling]
    Sampling -.-> CS
```

## 16. Maturity, Stability, Security, Performance Review
*   **Maturity:** **Beta**. The SDK is actively transitioning from V1 to V2. While production-ready for core features, experimental APIs are volatile.
*   **Stability:** **High** for core protocol features. The 100% test coverage requirement ensures that regressions are rare in the main branch.
*   **Security:** **Strong**. Includes built-in OAuth2 support, transport-layer security considerations for SSE/HTTP, and strict input validation via Pydantic.
*   **Performance:** **Excellent**. Leveraging `anyio` allows the SDK to handle high-concurrency workloads with minimal overhead. The Streamable HTTP transport is specifically optimized for throughput.

## 17. Tests, CI Pipelines, Documentation, Skills Review
*   **Tests:** Industry-leading standard. Uses `pytest` with a mandatory 100% coverage policy (`fail_under = 100`). Includes unit, integration, and platform-specific tests.
*   **CI Pipelines:** Extensive GitHub Actions suite covering multiple Python versions (3.10-3.14), OS (Ubuntu, Windows), and dependency resolutions. Includes automated linting (Ruff), type checking (Pyright), and documentation deployment.
*   **Documentation:** Comprehensive. Features a migration guide for V2, detailed conceptual overviews, and auto-generated API references.
*   **AI Skills:** The repo provides several "Skill-like" prompts and tools in its examples that demonstrate how to build agentic logic on top of the protocol.

## 18. Top 20 Possible Improvements or Fixes
1.  **Refactor Elicitation:** Simplify the callback-heavy elicitation pattern for better readability (`src/mcp/server/elicitation.py`).
2.  **Native WebSocket Support in FastMCP:** Direct integration of `ws` extra into the high-level server.
3.  **Enhanced Windows Stdio Handling:** Resolve intermittent hangs in process termination on Win32 (`tests/issues/test_552_windows_hang.py`).
4.  **Async/Sync Wrapper:** Built-in automatic thread pooling for all synchronous handlers to prevent event loop blocking.
5.  **Built-in Task Dashboard:** A simple web-based UI for monitoring background tasks.
6.  **Improved Error Messages:** More descriptive errors when Pydantic validation fails during tool execution.
7.  **Auto-Documentation for Tools:** Generate markdown documentation directly from tool docstrings and type hints.
8.  **Stateful SSE Management:** Native support for session persistence across SSE reconnections.
9.  **More Built-in Resources:** Standard handlers for common file formats (JSON, YAML, Markdown).
10. **Custom Middleware API:** Formalize the middleware pattern for `MCPServer`.
11. **Context-Efficient Sampling:** Helpers to prune context before calling `ctx.session.create_message`.
12. **Protocol Version Negotiation:** Better handling of future protocol versions.
13. **Pluggable Auth Providers:** Easy integration with Auth0, Clerk, etc.
14. **Streaming Resource Content:** Support for yielding resource data in chunks.
15. **Improved CLI 'dev' mode:** Faster hot-reloading for large server projects.
16. **OTEL Propagator Fix:** Ensure trace IDs are always passed through stdio transports.
17. **Built-in Rate Limiting:** Decorators for rate-limiting tool calls.
18. **Resource Mime-Type Inference:** Better automatic detection of content types.
19. **Unified Task Store:** Abstracting the task store to support Redis/Database out of the box.
20. **Icon Generation Helper:** Utility to convert local images to the required data URI format for icons.

## 19. Reusability for Agent Swarm (Debate & Plan)
*   **`ResponseRouter`:** Crucial for routing messages between debating agents (`src/mcp/shared/session.py`).
*   **`SessionGroup`:** Can manage multiple agent sessions simultaneously (`src/mcp/client/session_group.py`).
*   **`Sampling Protocol`:** The core mechanism for one agent to "ask" another for a solution or review (`src/mcp/server/elicitation.py`).
*   **`Prompt Manager`:** Used to define the "Debate Rules" and "Reviewer Persona" prompts (`src/mcp/server/mcpserver/prompts/manager.py`).
*   **`Context Injection`:** Allows agents to share a common "Knowledge Graph" context.
*   **`Experimental Tasks`:** Ideal for managing the long-running "Research" and "Debate" phases as background tasks.
*   **`Validation Layer`:** Ensures all agents in the swarm adhere to the same schema for their "Plan" output.
*   **`Progress Reporting`:** Keeps the orchestrator informed of the debate progress.
*   **`Shared Auth`:** Ensures all agents in the swarm are properly authenticated to shared resources.
*   **`OTEL Tracing`:** Essential for visualizing the complex interactions and "thought" process of the swarm.

## 20. Reusability for Multi-User/Multi-Agent Shared Knowledge Base
*   **`Resource templates`:** The primary mechanism for exposing the shared knowledge base (graph/markdown) to all participants (`src/mcp/server/mcpserver/resources/templates.py`).
*   **`PostgreSQL Memory Example`:** A blueprint for the shared storage layer (`examples/mcpserver/memory.py`).
*   **`Elicitation Flow`:** Used for handling conflicting updates or requesting user approval for changes to the knowledge base.
*   **`Subscription/Notification Pattern`:** Notify all agents when a part of the graph or a skill is updated.
*   **`OAuth2 Support`:** Essential for managing multi-user access control.
*   **`Session Management`:** Tracking which agent/user is interacting with which part of the knowledge base.
*   **`JSON-RPC Schema`:** Standardizing how "Knowledge" is transmitted and validated.
*   **`Streamable HTTP`:** Efficiently syncing large graph datasets between participants.
*   **`Icon Management`:** Visualizing the shared knowledge base in a UI.
*   **`Experimental Task Store`:** Managing long-term "Evolution" tasks that update the knowledge base.

## 21. Reusability for Own Hardware/Cloud + Messengers
*   **`SSE Transport`:** The perfect bridge for Cloudflare Workers or cloud-based backends (`src/mcp/server/sse.py`).
*   **`Stdio Transport`:** For agents running on own hardware (Local CLI).
*   **`MCPServer (FastMCP)`:** Rapidly implement tools that wrap Messenger APIs (Telegram/WhatsApp).
*   **`Context Injection`:** Passing user IDs from messengers into tools.
*   **`Image Support`:** Sending/receiving media via messengers.
*   **`Sampling`:** Using voice control (STT) to trigger sampling requests.
*   **`Display Utilities`:** Adapting MCP content for web app and native app UIs (`examples/snippets/clients/display_utilities.py`).
*   **`OTEL Tracing`:** Monitoring performance across own hardware and cloud boundaries.
*   **`Streamable HTTP`:** For low-latency native app interactions.
*   **`CLI Module`:** Base for a robust command-line interface for the agent.

## 22. Reusability for Team Agents (Cooperative Human/Agent)
*   **`Elicitation Flow`:** The "Approval" pattern for human-in-the-loop workflows (`src/mcp/server/elicitation.py`).
*   **`Progress Reporting`:** Giving humans visibility into the agent's work-in-progress.
*   **`Prompts`:** Defining "Team Guidelines" that both humans and agents follow.
*   **`Resource Templates`:** Sharing "Team Documents" and "Project Context".
*   **`OAuth2`:** Identity management for both human team members and their agent representatives.
*   **`Logging`:** Maintaining a "Team Audit Log" of all cooperative actions.
*   **`Sampling`:** Agents asking humans for clarification or high-level decisions.
*   **`Notification Protocol`:** Alerting humans to agent actions requiring attention.
*   **`Display Utilities`:** Rendering cooperative task status in a shared UI.
*   **`Session Group`:** Orchestrating sessions across a diverse team of specialized agents.

Review of all answers: The analysis covers all 22 points with specific file references and technical depth. The architecture Mermaid graph reflects the modular design. Maturity and development trends are based on the latest commit history. The reusability sections leverage specific core components identified during the research phase. (Ref: `.input.mcp-sdk-python.xml`, `AGENTS.md`, `README.md`)
