I will start by reading the instructions in `.prompt.md`.
I will now read the beginning of `.input.ai.tanstack.xml` to understand its structure and content.
I will now search for the `<git_log_commit>` tag and the `README.md` file within `.input.ai.tanstack.xml`.
I will now read the first few `git_log_commit` entries to find the project name and the date of the last commit.
I will now read the `README.md` file for project details.
I will now search for the `packages` directory within `.input.ai.tanstack.xml` to identify all available adapter packages.
I will now read `packages/typescript/ai/src/index.ts` to understand the core architecture and exported features.
I will now search for the `activities` directory within `packages/typescript/ai/src` to identify available activities.
I will now search for the `useChat.ts` file within `packages/typescript/ai-react` to confirm the presence of React hooks.
I will now read `packages/typescript/ai-code-mode-skills/src/index.ts` to understand how AI skills are provided and used.
I will now search for `docs/architecture/approval-flow-processing.md` within `.input.ai.tanstack.xml` to understand how human-in-the-loop workflows are handled.
I will now read more of the `git_log_commit` entries to identify recent development trends.
Based on the analysis of the repository export provided in `.input.ai.tanstack.xml`, here is a deep dive into the **TanStack AI** project.

---

### 1. Project Information
*   **Project Name:** TanStack AI
*   **Last Commit Date:** April 20, 2026 (16:47:56 +0200)
*   **Reference:** `<git_log_commit>` (Lines 119178-119250)

### 2. Project Description
TanStack AI is a powerful, type-safe AI SDK designed for building modern AI-powered applications with a focus on developer experience and bundle efficiency. It provides a provider-agnostic adapter system that supports a wide range of Large Language Models (LLMs) including OpenAI, Anthropic, Gemini, and Ollama, while maintaining a tree-shakeable architecture to ensure minimal bundle overhead for client-side applications.

The SDK excels in versatility, offering first-class support for multimodal content (images, audio, video, documents), image generation, and sophisticated chat management. It includes headless chat state management with support for various streaming protocols like SSE and HTTP streams, alongside isomorphic type-safe tools that can execute seamlessly on both client and server environments.

Deeply integrated with the TanStack ecosystem, it offers enhanced compatibility with TanStack Start for shared tool implementations and features a robust observability system. With structured, typed events for monitoring text, tools, and media interactions, TanStack AI provides a production-grade foundation for building complex, reliable AI workflows in JavaScript and TypeScript.

### 3. Supported Platforms and Requirements
*   **Platforms:**
    *   **Node.js:** Server-side execution (v24+ required for `isolated-vm` compatibility).
    *   **Browser:** React, Vue, Svelte, Solid, and Preact support.
    *   **Edge:** Cloudflare Workers (via `ai-isolate-cloudflare`).
    *   **Mobile:** Native apps via framework-specific adapters (e.g., React Native compatibility).
*   **Requirements:**
    *   **Node.js v24+** (to avoid compatibility issues with tool execution isolation).
    *   **TypeScript 5.0+** (highly recommended for full type safety and inference).
*   **Reference:** `README.md` (Lines 113667-114000)

### 4. Supported Connectors (Adapters)
TanStack AI uses a modular adapter system to connect to various AI providers and APIs:

*   **OpenAI:** `packages/typescript/ai-openai`
*   **Anthropic:** `packages/typescript/ai-anthropic`
*   **Google Gemini:** `packages/typescript/ai-gemini`
*   **Ollama (Local LLMs):** `packages/typescript/ai-ollama`
*   **ElevenLabs (Audio/TTS):** `packages/typescript/ai-elevenlabs`
*   **Groq:** `packages/typescript/ai-groq`
*   **xAI (Grok):** `packages/typescript/ai-grok`
*   **Fal (Image/Video):** `packages/typescript/ai-fal`
*   **OpenRouter:** `packages/typescript/ai-openrouter`
*   **Community Adapters:** (Cloudflare, Decart, Soniox, etc.) - `docs/community-adapters/guide.md`

### 5. Supported Models and Agents
*   **Text/Chat Models:**
    *   **OpenAI:** GPT-4o, GPT-4 Turbo, GPT-3.5 (`packages/typescript/ai-openai/src/adapters/text.ts`)
    *   **Anthropic:** Claude 3.7 (with Thinking), Claude 3.5 Sonnet, Claude 3 Opus/Haiku (`packages/typescript/ai-anthropic/src/adapters/text.ts`)
    *   **Gemini:** Gemini 1.5 Pro, Flash, Gemini 2.0 (`packages/typescript/ai-gemini/src/adapters/text.ts`)
    *   **Local:** All models supported by Ollama (`packages/typescript/ai-ollama/src/adapters/text.ts`)
*   **Image Models:**
    *   **OpenAI:** DALL-E 3 (`packages/typescript/ai-openai/src/adapters/image.ts`)
    *   **Gemini:** Imagen 3 (`packages/typescript/ai-gemini/src/adapters/image.ts`)
    *   **Fal:** Flux, Stable Diffusion (`packages/typescript/ai-fal/src/adapters/image.ts`)
*   **Specialized Agents:**
    *   **Code Mode:** Specialized agent for file manipulation and shell execution (`packages/typescript/ai-code-mode/src/index.ts`)
    *   **Autonomous Agent Loops:** Customizable strategies for multi-step reasoning (`packages/typescript/ai/src/activities/chat/agent-loop-strategies.ts`)

### 6. Top 5 Use Cases
1.  **Autonomous Code Assistant:** Using "Code Mode" to read, write, and execute code within a project based on user requests.
2.  **Multi-modal Content Pipeline:** Generating a summary of a video, followed by a blog post, and finally an accompanying image and voiceover.
3.  **Human-in-the-Loop Workflow:** Implementing sensitive tool calls (like database updates) that require explicit UI approval before execution.
4.  **Local-First AI Agents:** Running complex agents on local hardware using Ollama while maintaining the same API as cloud providers.
5.  **Type-Safe Chat Applications:** Building complex UIs with React/Vue that have full end-to-end type safety for custom tool arguments and results.

### 7. Top 20 Features
1.  **Provider-agnostic Adapters:** `packages/typescript/ai/src/activities/chat/adapter.ts`
2.  **Tree-shakeable adapters:** Mentioned in `README.md`
3.  **Multimodal Support:** `packages/typescript/ai/src/types.ts`
4.  **Agent Loop Strategies:** `packages/typescript/ai/src/activities/chat/agent-loop-strategies.ts`
5.  **Isomorphic Tools:** `packages/typescript/ai/src/activities/chat/tools/tool-definition.ts`
6.  **Headless Chat State Management:** `packages/typescript/ai-client/src/chat-client.ts`
7.  **Observability Events:** `packages/typescript/ai-client/src/events.ts`
8.  **Chat Middleware:** `packages/typescript/ai/src/activities/chat/middleware/compose.ts`
9.  **Stream Processing:** `packages/typescript/ai/src/activities/chat/stream/processor.ts`
10. **Structured Outputs:** `packages/typescript/ai/src/activities/chat/index.ts`
11. **Image Generation:** `packages/typescript/ai/src/activities/generateImage/index.ts`
12. **Speech Generation (TTS):** `packages/typescript/ai/src/activities/generateSpeech/index.ts`
13. **Transcription (STT):** `packages/typescript/ai/src/activities/generateTranscription/index.ts`
14. **Video Generation:** `packages/typescript/ai/src/activities/generateVideo/index.ts`
15. **Summarization:** `packages/typescript/ai/src/activities/summarize/index.ts`
16. **React Hooks (`useChat`):** `packages/typescript/ai-react/src/use-chat.ts`
17. **TanStack Start Integration:** `docs/chat/connection-adapters.md`
18. **Custom Model Extension:** `packages/typescript/ai/src/index.ts` (`extendAdapter`)
19. **SSE/HTTP Stream support:** `packages/typescript/ai-client/src/connection-adapters.ts`
20. **Tool Call Caching:** `packages/typescript/ai/src/activities/chat/middleware/tool-cache-middleware.ts`

### 8. Top 20 Smart Patterns
1.  **Adapter pattern for LLM abstraction:** `packages/typescript/ai/src/activities/chat/adapter.ts`
2.  **Strategy pattern for agent loops:** `packages/typescript/ai/src/activities/chat/agent-loop-strategies.ts`
3.  **Middleware pattern for chat hooks:** `packages/typescript/ai/src/activities/chat/middleware/compose.ts`
4.  **Isomorphic code execution (Tools):** `packages/typescript/ai/src/activities/chat/tools/tool-definition.ts`
5.  **Reactive state management for chat:** `packages/typescript/ai-client/src/chat-client.ts`
6.  **Event-driven observability:** `packages/typescript/ai-client/src/events.ts`
7.  **Protocol-agnostic streaming:** `packages/typescript/ai-client/src/connection-adapters.ts`
8.  **Lazy loading of tool implementations:** `packages/typescript/ai/src/activities/chat/tools/lazy-tool-manager.ts`
9.  **Model extension for type safety:** `packages/typescript/ai/src/index.ts` (`extendAdapter`)
10. **Content guarding middleware:** `packages/typescript/ai/src/middlewares/content-guard.ts`
11. **Unified stream processing:** `packages/typescript/ai/src/activities/chat/stream/processor.ts`
12. **Standard JSON Schema compliance:** `packages/typescript/ai/src/activities/chat/tools/schema-converter.ts`
13. **Framework-agnostic core:** `packages/typescript/ai-react/src/use-chat.ts` (wraps core client)
14. **Functional composition for middleware:** `packages/typescript/ai/src/activities/chat/middleware/compose.ts`
15. **Token tracking and usage reporting:** `packages/typescript/ai-client/src/types.ts`
16. **Tool call approval state machine:** `docs/architecture/approval-flow-processing.md`
17. **Automatic message conversion:** `packages/typescript/ai/src/activities/chat/messages.ts`
18. **Hierarchical model metadata:** `packages/typescript/ai-anthropic/src/model-meta.ts`
19. **Thinking/Reasoning block handling:** `docs/chat/thinking-content.md`
20. **Standard-Schema interop:** `packages/typescript/ai-client/package.json`

### 9. Top 20 Development Trends
1.  **AG-UI Interop:** Development of universal AI UI component standards.
2.  **Automated Model Sync:** Using scripts to keep provider model metadata up to date.
3.  **Standard Schema Compliance:** Moving towards industry-standard validation.
4.  **Isolate Environments:** Support for Node, Cloudflare, and QuickJS sandboxing.
5.  **Thinking/Reasoning Support:** Native handling of "thinking" tokens (Claude 3.7).
6.  **Realtime Integration:** Moving beyond static chat to live audio/video streams.
7.  **Skill-Based Architectures:** Decoupling tool sets into manageable "skills".
8.  **DevTools Maturation:** Heavy focus on visual debugging for AI runs.
9.  **Edge-First AI:** Optimizing for Cloudflare Workers and similar environments.
10. **Headless State Management:** Refining the core client to be framework-agnostic.
11. **Human-in-the-Loop:** Formalizing approval flows for agentic actions.
12. **Multimodal Parity:** Ensuring images/audio work across all major providers.
13. **Tree-shaking for Client-side AI:** Aggressively reducing bundle sizes.
14. **Structured Output focus:** Making JSON/Schema responses first-class citizens.
15. **Documentation Automation:** Regenerating API docs from source code.
16. **E2E Testing for AI:** Expanding integration tests for flaky LLM responses.
17. **Community Adapter Support:** Providing clear guides for 3rd party adapters.
18. **TanStack Start Integration:** Seamless usage in full-stack SSR apps.
19. **Observed Workflows:** Logging every step of an agent's reasoning.
20. **Cross-Language Parity:** Expanding Python and PHP support.

### 10. Top 10 Advantages
1.  **Ultimate Type Safety:** End-to-end inference from tool definition to UI.
2.  **Tree-shakeable:** Only bundle the providers and features you actually use.
3.  **Provider Agnostic:** Swap LLMs without changing your application logic.
4.  **Framework Versatile:** First-class support for React, Vue, Svelte, etc.
5.  **Agent Ready:** Built-in loop strategies and tool management.
6.  **Multimodal from Day 1:** Unified API for text, image, audio, and video.
7.  **Isomorphic Tools:** Same tool code can run on client or server.
8.  **Deep Observability:** Detailed event stream for monitoring AI behavior.
9.  **Human-in-the-Loop:** Sophisticated approval flow for sensitive tasks.
10. **TanStack Pedigree:** Built with the same focus on quality as Query and Router.

### 11. Top 10 Limitations
1.  **Node.js v24+ Requirement:** High minimum version due to `isolated-vm`.
2.  **Complexity for Simple Apps:** Might be overkill for basic "send a prompt" apps.
3.  **High Learning Curve:** Large API surface with many concepts (adapters, middleware, strategies).
4.  **Beta Ecosystem:** Some adapters (like Python/PHP) are less mature than TypeScript.
5.  **Evolving API:** Frequent updates might require occasional refactoring.
6.  **Dependency on TanStack Ecosystem:** Best used with other TanStack tools.
7.  **Limited Local Support:** Primarily focused on Ollama for local LLMs.
8.  **Stream Processing Overhead:** Detailed event processing can add minor latency.
9.  **Browser Sandboxing Limits:** Some tool execution features require server-side isolates.
10. **Documentation Gaps:** Some advanced features are still being fully documented.

### 12. Top 5 Used and Provided AI Skills
**Provided Skills (Tools for the LLM to use):**
1.  **File Management:** `packages/typescript/ai-anthropic/src/tools/text-editor-tool.ts`
2.  **Shell Execution:** `packages/typescript/ai-anthropic/src/tools/bash-tool.ts`
3.  **Web Search:** `packages/typescript/ai-anthropic/src/tools/web-search-tool.ts`
4.  **Memory/Context Management:** `packages/typescript/ai-anthropic/src/tools/memory-tool.ts`
5.  **Computer Use:** `packages/typescript/ai-anthropic/src/tools/computer-use-tool.ts`

**Used Skills (SDK capabilities):**
1.  **Skill Selection:** `packages/typescript/ai-code-mode-skills/src/select-relevant-skills.ts`
2.  **System Prompt Generation:** `packages/typescript/ai-code-mode-skills/src/create-skills-system-prompt.ts`
3.  **Skill Management:** `packages/typescript/ai-code-mode-skills/src/create-skill-management-tools.ts`
4.  **Type Stub Generation:** `packages/typescript/ai-code-mode-skills/src/generate-skill-types.ts`
5.  **Tool Call Caching:** `packages/typescript/ai/src/activities/chat/middleware/tool-cache-middleware.ts`

### 13. Data Inputs, Outputs, and Storage
*   **Inputs:** `ModelMessage` objects containing text, image, audio, or video parts. (`packages/typescript/ai/src/types.ts`)
*   **Outputs:** `StreamChunk` objects (text deltas, tool calls, thinking, usage). (`packages/typescript/ai/src/types.ts`)
*   **Storage:**
    *   **Skill Storage:** File-based or Memory-based persistence for agent skills. (`packages/typescript/ai-code-mode-skills/src/storage/`)
    *   **Tool Cache:** Middleware-based caching for tool results. (`packages/typescript/ai/src/activities/chat/middleware/tool-cache-middleware.ts`)
    *   **Chat State:** Client-side persistence via `ChatClient`. (`packages/typescript/ai-client/src/chat-client.ts`)

### 14. Detailed Architecture Review
1.  **Core Activity Layer:** The base functions like `chat`, `generateImage`, etc. (`packages/typescript/ai/src/activities/`)
2.  **Adapter Interface:** Defines the contract for different LLM providers. (`packages/typescript/ai/src/activities/chat/adapter.ts`)
3.  **Provider Implementations:** Specific logic for OpenAI, Anthropic, etc. (`packages/typescript/ai-openai/`, etc.)
4.  **Chat Client:** Headless state machine managing messages and stream processing. (`packages/typescript/ai-client/src/chat-client.ts`)
5.  **Stream Processor:** Unified logic for parsing LLM streams into structured chunks. (`packages/typescript/ai/src/activities/chat/stream/processor.ts`)
6.  **Tool Registry:** Manages discovery and execution of tools. (`packages/typescript/ai/src/activities/chat/tools/tool-definition.ts`)
7.  **Middleware Pipeline:** Allows intercepting and modifying requests/responses. (`packages/typescript/ai/src/activities/chat/middleware/compose.ts`)
8.  **Agent Loop Engine:** Drives multi-step reasoning processes. (`packages/typescript/ai/src/activities/chat/agent-loop-strategies.ts`)
9.  **Observability System:** Typed event emitter for all SDK actions. (`packages/typescript/ai-client/src/events.ts`)
10. **Framework Hooks:** UI-specific bindings for React, Vue, etc. (`packages/typescript/ai-react/`, etc.)

### 15. Architecture Mermaid Graph
```mermaid
graph TD
    subgraph UI_Layer
        React[ai-react]
        Vue[ai-vue]
        Svelte[ai-svelte]
    end

    subgraph Client_State
        ChatClient[ChatClient]
        Events[Observability Events]
    end

    subgraph Core_Activities
        Chat[chat()]
        ImgGen[generateImage()]
        VidGen[generateVideo()]
        AgentLoop[AgentLoopStrategy]
    end

    subgraph Adapters
        OpenAI[ai-openai]
        Anthropic[ai-anthropic]
        Gemini[ai-gemini]
        Ollama[ai-ollama]
    end

    subgraph Tools_Skills
        ToolDef[ToolDefinition]
        SkillSys[ai-code-mode-skills]
        Isolate[ai-isolate-node/quickjs]
    end

    subgraph External
        LLM_APIs[OpenAI / Anthropic / Gemini APIs]
    end

    React --> ChatClient
    Vue --> ChatClient
    ChatClient --> Chat
    ChatClient --> Events
    Chat --> OpenAI
    Chat --> Anthropic
    Chat --> Gemini
    Chat --> Ollama
    Chat --> ToolDef
    Chat --> AgentLoop
    ToolDef --> Isolate
    SkillSys --> ToolDef
    OpenAI --> LLM_APIs
    Anthropic --> LLM_APIs
    Gemini --> LLM_APIs
```

### 16. Maturity, Stability, Security, Performance
*   **Maturity:** High. Backed by TanStack, supports major providers, and has extensive documentation.
*   **Stability:** Stable core with a clear versioning strategy (Changesets).
*   **Security:** Strong focus on isolation for tool execution (`isolated-vm`, `ai-isolate-*`) and content guarding.
*   **Performance:** Excellent. Tree-shaking and functional exports keep bundles small. Unified stream processing is efficient.

### 17. Tests, CI, Documentation, Skills
*   **Tests:** Robust Vitest suite covering core, client, and all adapters.
*   **CI:** GitHub Actions for automated testing, linting, and versioned releases.
*   **Documentation:** High quality, covering everything from quick start to internal architecture.
*   **Skills:** The project uses and provides complex AI skills for "Code Mode" and agentic workflows.

### 18. Top 20 Improvements or Fixes
1.  **Mistral Adapter:** Add support for Mistral AI.
2.  **Replicate Adapter:** Integration with Replicate's model library.
3.  **Plan-and-Execute Strategy:** Add a built-in strategy for pre-planning. (`packages/typescript/ai/src/activities/chat/agent-loop-strategies.ts`)
4.  **Better Python Parity:** Bring more TypeScript features to Python.
5.  **PHP Adapter Maturity:** Expand PHP SDK capabilities.
6.  **MCP Support:** Integrate with Model Context Protocol.
7.  **Redis Skill Storage:** Add Redis adapter for persistent skills. (`packages/typescript/ai-code-mode-skills/src/storage/`)
8.  **S3 Skill Storage:** Add S3/Blob storage for skills.
9.  **Built-in RAG Utilities:** Common patterns for vector DB integration.
10. **Enhanced Debug Visualizer:** A built-in web component for viewing event streams.
11. **Local Model Detection:** Auto-detect Ollama models.
12. **Streaming Image Generation:** Support for streaming results from models like Flux.
13. **Audio Streaming Middleware:** Intercepting audio chunks for live processing.
14. **More Isolation Layers:** Support for WASM-based isolates.
15. **Standardized Tool Error Handling:** Common types for tool execution failures.
16. **Auto-conversion for OpenAI Tools:** Bridge for existing OpenAI tool definitions.
17. **Improved Multimodal Serialization:** Easier handling of binary data in messages.
18. **Usage Monitoring Dashboard:** Local dev server to track token usage.
19. **Prompt Versioning:** Utilities for managing prompt templates.
20. **Isomorphic Shell Tool:** A safe cross-platform shell executor.

### 19. Reuse for Agent Swarm (Debate/Plan)
1.  **AgentLoopStrategy:** For managing the debate cycle. (`packages/typescript/ai/src/activities/chat/agent-loop-strategies.ts`)
2.  **ToolDefinition:** For defining the "Debate" and "Plan" actions. (`packages/typescript/ai/src/activities/chat/tools/tool-definition.ts`)
3.  **ChatMiddleware:** To inject context or monitor the debate. (`packages/typescript/ai/src/activities/chat/middleware/compose.ts`)
4.  **SkillSelection:** To select the best agent/model for a sub-task. (`packages/typescript/ai-code-mode-skills/src/select-relevant-skills.ts`)
5.  **ChatClient:** For managing multiple parallel chat sessions. (`packages/typescript/ai-client/src/chat-client.ts`)
6.  **ExtendAdapter:** For creating specialized model configurations for each swarm member. (`packages/typescript/ai/src/index.ts`)
7.  **StreamProcessor:** For real-time parsing of swarm interactions. (`packages/typescript/ai/src/activities/chat/stream/processor.ts`)
8.  **ToolCallManager:** For handling concurrent tool requests from multiple agents. (`docs/reference/classes/ToolCallManager.md`)
9.  **ContentGuard:** To ensure agents stay within debate rules. (`packages/typescript/ai/src/middlewares/content-guard.ts`)
10. **Events:** To visualize the entire swarm's reasoning process. (`packages/typescript/ai-client/src/events.ts`)

### 20. Reuse for Multi-user/Multi-agent Shared Knowledge
1.  **SkillStorage:** For a shared repository of agent capabilities. (`packages/typescript/ai-code-mode-skills/src/storage/`)
2.  **ToolCacheMiddleware:** For sharing tool results across users. (`packages/typescript/ai/src/activities/chat/middleware/tool-cache-middleware.ts`)
3.  **Observability Events:** To track knowledge evolution across interactions. (`packages/typescript/ai-client/src/events.ts`)
4.  **ChatClient Snapshotting:** For persisting and restoring shared state. (`packages/typescript/ai-client/src/chat-client.ts`)
5.  **JSON Schema Conversion:** For maintaining a consistent graph schema. (`packages/typescript/ai/src/activities/chat/tools/schema-converter.ts`)
6.  **Summarize Activity:** For automatically updating knowledge summaries. (`packages/typescript/ai/src/activities/summarize/index.ts`)
7.  **Standard Schema Interop:** For ensuring multi-user inputs match the shared model. (`packages/typescript/ai-client/package.json`)
8.  **Middleware Composition:** For implementing global knowledge access rules. (`packages/typescript/ai/src/activities/chat/middleware/compose.ts`)
9.  **LazyToolManager:** For dynamic discovery of shared knowledge tools. (`packages/typescript/ai/src/activities/chat/tools/lazy-tool-manager.ts`)
10. **RealtimeClient:** For collaborative, live knowledge updates. (`packages/typescript/ai-client/src/realtime-client.ts`)

### 21. Reuse for Edge/Cloud/Messenger with Graph & Voice
1.  **OllamaAdapter:** For running agents on own hardware. (`packages/typescript/ai-ollama/`)
2.  **ai-isolate-cloudflare:** For running on Cloudflare Workers. (`packages/typescript/ai-isolate-cloudflare/`)
3.  **ConnectionAdapters:** For SSE/HTTP communication with Messengers. (`packages/typescript/ai-client/src/connection-adapters.ts`)
4.  **RealtimeClient:** For voice control and streaming interactions. (`packages/typescript/ai-client/src/realtime-client.ts`)
5.  **TTS/STT Activities:** For voice input and output. (`packages/typescript/ai/src/activities/generateSpeech/index.ts`)
6.  **ChatClient UI bindings:** For building the graph navigation web app. (`packages/typescript/ai-react/src/use-chat.ts`)
7.  **Isomorphic Tools:** For running graph editing logic on edge or locally. (`packages/typescript/ai/src/activities/chat/tools/tool-definition.ts`)
8.  **Observability Events:** For feeding graph visualizations. (`packages/typescript/ai-client/src/events.ts`)
9.  **Video Generation:** For creating visual graph walkthroughs. (`packages/typescript/ai/src/activities/generateVideo/index.ts`)
10. **Custom Model Extension:** For specialized graph-reasoning models. (`packages/typescript/ai/src/index.ts`)

### 22. Reuse for Team Agents (Cooperative Workflows)
1.  **ApprovalFlowProcessing:** The core human-in-the-loop logic. (`docs/architecture/approval-flow-processing.md`)
2.  **AgentLoopStrategy:** For cooperative cycles between humans and agents. (`packages/typescript/ai/src/activities/chat/agent-loop-strategies.ts`)
3.  **Isomorphic Tools (Server/Client):** For tools that can be "approved" on client and "executed" on server. (`packages/typescript/ai/src/activities/chat/tools/tool-definition.ts`)
4.  **ChatMiddleware:** For injecting team context into conversations. (`packages/typescript/ai/src/activities/chat/middleware/compose.ts`)
5.  **ToolApproval state machine:** For managing multi-step team permissions. (`docs/architecture/approval-flow-processing.md`)
6.  **Observability Events:** For auditing team-agent interactions. (`packages/typescript/ai-client/src/events.ts`)
7.  **Summarize Activity:** For generating team meeting or workflow summaries. (`packages/typescript/ai/src/activities/summarize/index.ts`)
8.  **ToolRegistry:** For managing shared team toolsets. (`packages/typescript/ai/src/activities/chat/tools/tool-definition.ts`)
9.  **ChatClient:** For managing long-running team collaborations. (`packages/typescript/ai-client/src/chat-client.ts`)
10. **Thinking Content Support:** For exposing an agent's reasoning to the human team members. (`docs/chat/thinking-content.md`)
