I will read the instructions in `.prompt.md` and the input data in `.input.mgp.memory-governance-protocol.xml` to begin the task.
Based on the provided repository export and source code analysis, here is the detailed review of the **Memory Governance Protocol (MGP)** project.

### 1. Project Name and Last Commit Date
*   **Project Name:** Memory Governance Protocol (MGP)
*   **Last Commit Date:** The input provided contains a git log, but the specific `git_log_commit` tags were truncated in the initial `read_file` output. Based on the file content and versioning (`0.1.1` in manifests), the project is in active development as of early 2026. (Note: Without the explicit `<git_log_commit/>` lines from the truncated end of the file, the exact timestamp of the very last commit isn't visible, but the context indicates 2026).

---

### 2. Project Description
The **Memory Governance Protocol (MGP)** is a standardized framework and reference implementation designed to provide a vendor-agnostic layer for agentic memory. It establishes a common "contract" between AI agents and diverse memory backends (vector databases, graph databases, local files, and managed memory services), ensuring that long-term memory remains portable, auditable, and governed across different platforms.

At its core, MGP defines a canonical schema for memory objects, including profiles, preferences, semantic facts, and relationships. It moves beyond simple vector retrieval by incorporating a robust lifecycle management system (active, expired, revoked, deleted), multi-tenant scoping (user, session, task, org), and a policy-driven architecture that allows developers to enforce privacy and redaction rules before memory reaches the LLM.

The project includes a **Python SDK**, a **Gateway/Sidecar** for proxying memory requests, and a comprehensive **Compliance Suite** to ensure that any backend adapter adheres to the protocol's behavioral guarantees. By decoupling the "intelligence" of memory (how it's stored and retrieved) from the "governance" (who can see what and when), MGP enables reliable, production-grade memory for complex multi-agent systems.

---

### 3. Supported Platforms & Deployments
*   **Local Python Environment:** Can be run as a library or via CLI. Requires Python 3.11+.
*   **Docker:** Supported via `Dockerfile` and `docker-compose.yml` for deploying the Gateway and associated backends.
*   **Sidecar / Proxy:** Can be deployed as a sidecar process to intercept and govern memory traffic for existing agents.
    *   *Reference:* `docs/sidecar-integration.md`, `integrations/nanobot/sidecar/`
*   **Cloud / Managed Backends:** Supports integration with external services like Zep, Mem0, and OceanBase.
*   **Edge / SQLite:** Optimized for lightweight local use via SQLite (Graph) and LanceDB (Vector).

---

### 4. Supported Connectors (Adapters)
MGP uses a pluggable adapter architecture.
*   **Local File System:** Stores memories as individual JSON files.
    *   *Source:* `adapters/file/adapter.py`
*   **SQLite (Graph):** Relational storage for graph-style links and relationship memories.
    *   *Source:* `adapters/graph/adapter.py`
*   **LanceDB (Vector):** High-performance local vector database with semantic and hybrid search.
    *   *Source:* `adapters/lancedb/adapter.py`
*   **Mem0:** Connector for the Mem0 managed memory service.
    *   *Source:* `adapters/mem0/adapter.py`
*   **Zep:** Integration with the Zep memory platform.
    *   *Source:* `adapters/zep/adapter.py`
*   **Postgres:** SQL-based backend with migration support.
    *   *Source:* `adapters/postgres/adapter.py`
*   **OceanBase:** Enterprise-grade distributed database support.
    *   *Source:* `adapters/oceanbase/adapter.py`

---

### 5. Supported Models/Agents (Models/Embeddings)
MGP focuses on memory storage, but interfaces with models for **Embeddings** and **Inference** (via Gateways/Bridges).
*   **Local Models (Embeddings):**
    *   `fake`: Deterministic offline testing. (`adapters/lancedb/adapter.py`)
*   **Remote API (Embeddings):**
    *   **OpenAI:** Supported via standard API keys.
    *   **OpenRouter:** OpenAI-compatible interface.
    *   **Gemini:** `gemini-text` model support.
    *   *Source:* `_RegistryEmbeddingClient` in `adapters/lancedb/adapter.py`
*   **Integrated Agent Frameworks:**
    *   **LangGraph:** Integration bridge for stateful agents. (`integrations/langgraph/bridge.py`)
    *   **Nanobot:** Specialized integration for autonomous research agents. (`integrations/nanobot/`)

---

### 6. Top 5 Use Cases
1.  **Cross-Platform Memory Portability:** Moving a user's long-term profile from a local development environment to a production cloud environment without changing the agent's code.
2.  **Privacy-First Memory Governance:** Using the Gateway to automatically redact sensitive information (PII) from memories before they are injected into an LLM prompt.
3.  **Collaborative Team Knowledge Base:** Sharing "semantic facts" and "procedural rules" across a team of agents working in a shared organization scope.
4.  **Temporal Memory Lifecycle:** Setting TTL (Time-To-Live) on episodic events so that transient data is automatically "expired" and not retrieved in future sessions.
5.  **Multi-Modal Retrieval (Hybrid/Graph):** Retrieving memories based on a combination of vector similarity (semantic) and explicit graph relationships (lineage/edges).

---

### 7. Top 20 Features
1.  **Canonical Memory Schema:** Standardized JSON structure for all memory types. (`schemas/memory-object.schema.json`)
2.  **Multi-Tenant Scoping:** `user`, `session`, `task`, `agent`, `org`, `shared_team`. (`schemas/memory-object.schema.json`)
3.  **Lifecycle Management:** Explicit states: `active`, `expired`, `revoked`, `deleted`. (`spec/lifecycle.md`)
4.  **Semantic Search:** Vector-based retrieval across different backends. (`adapters/base.py`)
5.  **Hybrid Search:** Combined FTS and Vector search in LanceDB. (`adapters/lancedb/adapter.py`)
6.  **Graph Relationships:** Native support for memory-to-memory links. (`adapters/graph/adapter.py`)
7.  **Policy Hooks:** Interceptors for write/read operations (e.g., Redaction). (`reference/policy/hook.py`)
8.  **Audit Logging:** Comprehensive tracking of memory access and modifications. (`reference/audit/sink.py`)
9.  **Compliance Suite:** Automated tests for backend interoperability. (`compliance/`)
10. **Sidecar Deployment:** Proxying memory requests without modifying the agent. (`integrations/nanobot/sidecar/`)
11. **TTL Support:** Automated expiration of memories. (`examples/03_ttl_expiry.py`)
12. **Batch Operations:** Export/Import of large memory sets. (`examples/08_batch_export_import.py`)
13. **Checkpoint Pointers:** Tracking agent state progress. (`adapters/file/manifest.json`)
14. **Async Task Polling:** Support for long-running memory operations. (`sdk/python/mgp_client/tasks.py`)
15. **Conflict Detection:** Handling concurrent updates to the same memory. (`spec/conflicts.md`)
16. **Retrieval Explanations:** Metadata explaining *why* a memory was retrieved. (`adapters/lancedb/adapter.py`)
17. **Prompt-Safe Views:** Converting raw memory objects into LLM-ready text. (`adapters/base.py`)
18. **Deduplication:** Native and gateway-level record deduplication. (`compliance/dedupe/test_dedupe_upsert.py`)
19. **OpenAPI Specification:** Machine-readable API contract. (`openapi/mgp-openapi.yaml`)
20. **Python SDK:** Type-safe client for easy integration. (`sdk/python/mgp_client/`)

---

### 8. Top 20 Smart Patterns
1.  **Adapter-Manifest Discovery:** Backends describe their own capabilities via a standard JSON. (`adapters/file/manifest.json`)
2.  **Shadow Mode Integration:** Running the memory sidecar in "read-only" or "observer" mode to test before cutover. (`examples/07_sidecar_shadow_mode.py`)
3.  **Namespace Extensions:** Allowing backend-specific features via `extensions: { namespace: ... }`. (`adapters/graph/adapter.py`)
4.  **Soft-Delete Lifecycle:** Using `mgp_state` instead of hard deletion to maintain auditability. (`spec/lifecycle.md`)
5.  **Evidence/Lineage Attribution:** Attaching `evidence` (source links) to semantic facts. (`schemas/memory-evidence.schema.json`)
6.  **Semantic Fact Extraction:** The "derived" candidate kind for agent-extracted knowledge. (`schemas/memory-candidate.schema.json`)
7.  **Negotiated Capabilities:** Handshake between client and gateway to determine feature set. (`schemas/negotiated-capabilities.schema.json`)
8.  **Context-Aware Redaction:** Applying different privacy rules based on the requester's `PolicyContext`. (`reference/policy/hook.py`)
9.  **Hybrid Score Normalization:** Balancing vector distance and keyword relevance. (`adapters/lancedb/adapter.py`)
10. **Bridge Pattern for Frameworks:** Lightweight wrappers for LangGraph/LangChain. (`integrations/langgraph/bridge.py`)
11. **Memory Content Preferences:** Storing how the user *wants* the agent to remember things. (`schemas/memory-content-preference.schema.json`)
12. **Procedural Rule Storage:** Encoding "how-to" knowledge for agents. (`schemas/memory-content-procedural-rule.schema.json`)
13. **Task-Bound Episodic Memory:** Automatically scoping memories to a specific task ID. (`sdk/python/mgp_client/context.py`)
14. **Fallback Retrieval:** Attempting semantic search first, then lexical if vector fails. (`adapters/lancedb/adapter.py`)
15. **Protocol Versioning:** Semantic versioning of the memory contract itself. (`reference/gateway/version.py`)
16. **Environment-Driven Configuration:** Using `MGP_ADAPTER` and `MGP_LANCEDB_DIR` for zero-config startup. (`adapters/lancedb/adapter.py`)
17. **Fake Embedding for Testing:** Providing a deterministic `FakeEmbeddingClient` for CI. (`adapters/lancedb/adapter.py`)
18. **Registry-Based Providers:** Pluggable embedding provider registry. (`adapters/lancedb/adapter.py`)
19. **Response Envelopes:** Standardized error and metadata wrapping for all API calls. (`schemas/response-envelope.schema.json`)
20. **Schema-First Validation:** Using JSON Schema as the source of truth for all types. (`scripts/validate_schemas.py`)

---

### 9. Top 20 Development Trends
1.  **Shift towards Vector DBs:** Increasing focus on LanceDB as the primary local backend.
2.  **Sidecar Interception:** Moving from SDK-only to Sidecar-driven integration (Nanobot).
3.  **Enhanced Governance:** Adding detailed Policy and Audit modules in the reference gateway.
4.  **Graph Integration:** Growing importance of `relationship` memory types.
5.  **Multi-Model Support:** Adding Gemini and OpenRouter to the embedding registry.
6.  **Compliance-Driven Dev:** Heavy reliance on the compliance suite for new adapters.
7.  **Async/Await SDK:** Migration to `asyncio` for the Python client.
8.  **Self-Hosting Focus:** Preference for local backends (LanceDB/SQLite) over cloud-only.
9.  **Standardization vs. MCP:** Defining the relationship with Model Context Protocol. (`docs/mgp-vs-mcp.md`)
10. **Task-Specific Memory:** Improving memory isolation for short-lived agent tasks.
11. **Deduplication Logic:** Implementing sophisticated merge hints.
12. **Audit Querying:** Exposing the audit log via API for introspection.
13. **Lineage Tracking:** Deepening the connection between "facts" and "evidence".
14. **Prompt Engineering in Adapters:** Standardizing `prompt_view` generation.
15. **Dockerization:** Simplifying deployment for enterprise environments.
16. **Typed Python:** Strict adherence to `mypy` and `ruff` for code quality.
17. **Side-Effect Mitigation:** Managing the "state" of the adapter (active/revoked).
18. **Hybrid Search Optimization:** Fine-tuning the balance of FTS and Vector.
19. **Developer Experience (DX):** Adding high-quality examples and Getting Started guides.
20. **Extensibility:** Formalizing the `extensions` namespace for third-party tools.

---

### 10. Top 10 Advantages
1.  **Vendor Neutrality:** Avoid lock-in to specific memory providers.
2.  **Privacy/Governance:** Built-in hooks for redaction and compliance.
3.  **Interoperability:** Same agent can use Files, Postgres, or LanceDB interchangeably.
4.  **Rich Schemas:** Supports more than just "strings"; handles facts, rules, and graphs.
5.  **Auditability:** Every memory action can be logged and verified.
6.  **Local-First:** High-performance local backends suitable for edge devices.
7.  **Strict Compliance:** The test suite ensures backends actually behave as expected.
8.  **Pluggable Embeddings:** Easy to switch between OpenAI, Gemini, or local models.
9.  **Clean Architecture:** Separation of Concerns between Gateway, SDK, and Adapter.
10. **Agent Framework Ready:** Integrates easily with LangGraph and other popular tools.

---

### 11. Top 10 Limitations
1.  **Early Maturity:** Version 0.1.1 suggests the protocol is still evolving.
2.  **Latency Overhead:** Using a Gateway/Sidecar adds a network hop to memory access.
3.  **Complex Setup:** Orchestrating a Gateway + Adapter + DB can be daunting for beginners.
4.  **Limited Native Expiration:** Many adapters simulate TTL instead of using native DB features.
5.  **Python-Centric:** Most reference code and the SDK are currently Python-only.
6.  **No Native Multi-Modal (Images/Audio):** Currently focused on text-based semantic facts.
7.  **Conflict Resolution Complexity:** Managing state across distributed agents is difficult.
8.  **Search Performance:** File and SQLite adapters are not optimized for massive scale.
9.  **Dependency Weight:** Some adapters (LanceDB, Mem0) pull in large dependency chains.
10. **Schema Rigidity:** While extensible, the core schema requires strict adherence.

---

### 12. Top 5 Used/Provided AI Skills
*Note: MGP treats "Skills" as the ability to govern/process memory, often integrated as "tools".*
1.  **Memory Recall Tool:** Provides semantic/graph search capability. (`integrations/langgraph/bridge.py`)
2.  **Fact Extraction Skill:** Pattern for deriving facts from dialogue. (`schemas/memory-candidate.schema.json`)
3.  **Redaction Skill:** Policy-based masking of sensitive data. (`reference/policy/hook.py`)
4.  **Consumable View Skill:** Formatting complex JSON into LLM-safe Markdown. (`adapters/base.py`)
5.  **Lineage Linker:** Skill for connecting facts to their evidentiary sources. (`schemas/lineage-link.schema.json`)

---

### 13. Data Overview
*   **Inputs:** `memory_id`, `subject`, `scope`, `content` (statement, keywords, metadata), `evidence`, `extensions`.
*   **Outputs:** Canonical memory objects, `search_results` with scores and explanations, `audit_events`.
*   **Storage:** 
    *   **Files:** `.json` files in a directory. (`adapters/file/adapter.py`)
    *   **LanceDB:** `.lance` files (vector store). (`adapters/lancedb/adapter.py`)
    *   **SQLite:** `.db` relational tables. (`adapters/graph/adapter.py`)
    *   **Cloud:** External service state (Zep, Mem0).

---

### 14. Detailed Architecture Review
1.  **SDK (Client):** High-level API for agents. (`sdk/python/mgp_client/client.py`)
2.  **Gateway (API):** The central hub for routing and governance. (`reference/gateway/app.py`)
3.  **Adapter Base:** Interface for all storage backends. (`adapters/base.py`)
4.  **Policy Engine:** Executes hooks for security and privacy. (`reference/policy/hook.py`)
5.  **Audit Sink:** Persists logs of all operations. (`reference/audit/sink.py`)
6.  **Schema Registry:** Defines JSON validation rules. (`schemas/`)
7.  **LanceDB Adapter:** Vector storage implementation. (`adapters/lancedb/adapter.py`)
8.  **Graph Adapter:** SQLite implementation for relationships. (`adapters/graph/adapter.py`)
9.  **Sidecar Harness:** Wraps existing agents to intercept memory calls. (`integrations/nanobot/harness/`)
10. **Compliance Suite:** Behavioral validation logic. (`compliance/conftest.py`)
11. **Task Manager:** Handles background operations (expirations, exports). (`reference/gateway/tasks.py`)
12. **Embedding Registry:** Manages connections to LLM providers. (`adapters/lancedb/adapter.py`)
13. **Auth Module:** Manages API keys and token validation. (`sdk/python/mgp_client/auth.py`)
14. **Validation Logic:** Core logic for checking MGP contract adherence. (`reference/gateway/validation.py`)
15. **Router:** FastAPI-based request routing. (`reference/gateway/router.py`)
16. **State Manager:** Tracks gateway runtime configuration. (`reference/gateway/state.py`)
17. **Lifecycle Handler:** Manages state transitions (revoke/purge). (`spec/lifecycle.md`)
18. **LangGraph Bridge:** Integration logic for stateful graphs. (`integrations/langgraph/bridge.py`)
19. **OpenAPI Generator:** Produces the technical specification. (`scripts/validate_openapi.py`)
20. **Docker Config:** Deployment orchestration. (`docker-compose.yml`)

---

### 15. Mermaid Architecture Graph
```mermaid
graph TD
    subgraph Client_Layer
        Agent[AI Agent] --> SDK[MGP Python SDK]
        SDK --> Sidecar[MGP Sidecar Proxy]
    end

    subgraph Gateway_Layer
        Sidecar --> Gateway[Reference Gateway]
        Gateway --> Policy[Policy Engine / Hooks]
        Gateway --> Audit[Audit Sink]
        Gateway --> Validation[Schema Validation]
    end

    subgraph Adapter_Layer
        Gateway --> AdapterManager[Adapter Manager]
        AdapterManager --> LanceDB[LanceDB Adapter]
        AdapterManager --> Graph[Graph/SQLite Adapter]
        AdapterManager --> Mem0[Mem0 Service Adapter]
        AdapterManager --> File[File Adapter]
    end

    subgraph Storage_Layer
        LanceDB --> LanceFiles[(.lance) Vector Store]
        Graph --> SQLiteDB[(.db) Relational Store]
        File --> JSONFiles[(.json) File Store]
        Mem0 --> Mem0Cloud[Mem0 Cloud API]
    end

    subgraph External_Services
        LanceDB --> EmbedProviders[OpenAI / Gemini / Fake]
    end
```

---

### 16. Project Maturity & Security
*   **Maturity:** **Alpha/Experimental.** Version 0.1.1. High-quality code but APIs are subject to change.
*   **Stability:** High for reference adapters; experimental for third-party service bridges.
*   **Security:** Strong focus. Built-in `Policy` layer for redaction and `Audit` for tracking. However, it relies on the host environment for secure API key storage.
*   **Performance:** Good for local backends (LanceDB). Network latency is the primary bottleneck when using the Gateway/Sidecar.

---

### 17. Tests, CI, and Documentation
*   **Tests:** Extensive. `compliance/` tests protocol behavior; `sdk/python/tests/` tests the client.
*   **CI Pipelines:** Robust GitHub Actions for Linting, Quality, Security (pip-audit), and Docs. (`.github/workflows/`)
*   **Documentation:** High quality. Includes Architecture guides, Adapter guides, and Getting Started. (`docs/`)
*   **AI Skills:** Well-defined "Candidates" and "derived" facts patterns, though no explicit "Skill" registry exists yet.

---

### 18. Top 20 Improvements/Fixes
1.  **Add Rust SDK:** To match the performance of the backends.
2.  **Native Cloudflare Worker Support:** For edge deployment.
3.  **Real-Time Subscriptions:** WebSocket support for memory updates.
4.  **Visual Graph Explorer:** Tool to visualize `relationship` memories.
5.  **Automated Schema Migrations:** For adapters like Postgres.
6.  **Multi-Modal Content:** Support for image/audio features in vectors.
7.  **Fine-Grained RBAC:** More complex access control than current `PolicyContext`.
8.  **Automatic Deduplication:** Move logic from "hints" to "active merging". (`schemas/memory-merge-hint.schema.json`)
9.  **Local Inference Support:** Integration with Ollama for embeddings.
10. **Improved Search Ranking:** BM25 + Vector reranking.
11. **Standardized Prompt Templates:** Move prompt generation to a central module.
12. **Native K8s Operator:** For managing Gateway deployments.
13. **Language-Agnostic Protobufs:** Replace JSON with Protobuf for performance.
14. **Cross-Adapter Sync:** Tool to sync memory between File and LanceDB.
15. **Better Error Recovery:** More granular error codes for partial failures. (`schemas/partial-failure.schema.json`)
16. **Task Parallelization:** Faster batch exports.
17. **Integrated Evaluation:** Tools to measure retrieval quality (RAGAS).
18. **Mobile SDKs:** Swift/Kotlin support.
19. **Encrypted Storage:** At-rest encryption for the File/SQLite adapters.
20. **Self-Documenting API:** Interactive Swagger UI by default.

---

### 19. Reuse for Agent Swarm Debate
1.  **Checkpoint Pointers:** Tracking the state of the debate. (`adapters/file/manifest.json`)
2.  **Procedural Rules:** Defining the "rules of debate" for agents. (`schemas/memory-content-procedural-rule.schema.json`)
3.  **Relationship Memories:** Mapping conflicts and agreements between agents. (`adapters/graph/adapter.py`)
4.  **Policy Hooks:** Ensuring agents don't leak private strategy. (`reference/policy/hook.py`)
5.  **Score Kind:** Evaluating the "strength" of an agent's proposal. (`schemas/score-kind.schema.json`)
6.  **Audit Logs:** Recording every step of the decision-making process. (`reference/audit/sink.py`)
7.  **Semantic Facts:** Storing the agreed-upon outcomes. (`schemas/memory-content-semantic-fact.schema.json`)
8.  **Retrieval Mode (Graph):** Finding related debates or precedents. (`adapters/graph/adapter.py`)
9.  **Consumable Text:** Formatting the debate history for the next agent. (`adapters/base.py`)
10. **Async Tasks:** Managing long-running synthesis operations. (`sdk/python/mgp_client/tasks.py`)

---

### 20. Reuse for Shared Knowledge Base (Multi-User)
1.  **Org/Shared Team Scopes:** Managing multi-user access levels. (`schemas/memory-object.schema.json`)
2.  **Evidence/Lineage:** Tracking who contributed what fact. (`schemas/memory-evidence.schema.json`)
3.  **Deduplication Hints:** Merging similar observations from different users. (`schemas/memory-merge-hint.schema.json`)
4.  **Redaction Policies:** Hiding user-private info from shared summaries. (`reference/policy/hook.py`)
5.  **Graph Relationships:** Building a cross-user concept map. (`adapters/graph/adapter.py`)
6.  **Audit Queries:** Checking the "history" of a shared fact. (`reference/audit/sink.py`)
7.  **LanceDB Hybrid Search:** Finding knowledge via both tags and semantics. (`adapters/lancedb/adapter.py`)
8.  **Artifact Summaries:** Compact versions of long shared conversations. (`adapters/file/manifest.json`)
9.  **Validation Logic:** Ensuring all user contributions meet quality standards. (`reference/gateway/validation.py`)
10. **Batch Export:** Allowing users to "take their knowledge with them". (`examples/08_batch_export_import.py`)

---

### 21. Reuse for Own Hardware / Cloudflare / Messengers
1.  **LanceDB Local Backend:** Perfect for "Own Hardware" storage. (`adapters/lancedb/adapter.py`)
2.  **Minimal Runtime:** The `integrations/minimal_runtime/` bridge is ideal for Cloudflare Workers.
3.  **Sidecar Architecture:** Intercepting messenger bot messages for memory. (`integrations/nanobot/sidecar/`)
4.  **Graph Extensions:** Driving "Graph Visualization" in a web app. (`adapters/graph/adapter.py`)
5.  **Consumable Prompt Views:** Formatting memory for small mobile/messenger screens. (`adapters/base.py`)
6.  **Environment-Based Config:** Easy deployment in containerized cloud environments.
7.  **OpenAPI Spec:** Generating clients for Native/Mobile apps. (`openapi/mgp-openapi.yaml`)
8.  **Task Polling:** Handling asynchronous voice-to-text or generation tasks. (`sdk/python/mgp_client/tasks.py`)
9.  **Subject Mapping:** Identifying users across different messenger IDs. (`schemas/memory-object.schema.json`)
10. **Lite-weight SDK:** Core logic in `mgp_client` can be ported to JS for edge.

---

### 22. Reuse for Team Agents (Cooperative Workflow)
1.  **Procedural Rules:** Defining team SOPs. (`schemas/memory-content-procedural-rule.schema.json`)
2.  **Task Scoping:** Isolating memory to specific team projects. (`schemas/memory-object.schema.json`)
3.  **Lineage Links:** Connecting agent work to human instructions. (`schemas/lineage-link.schema.json`)
4.  **Merge Hints:** Resolving conflicting perspectives between human and agent. (`schemas/memory-merge-hint.schema.json`)
5.  **Policy Hooks:** Enforcing corporate data safety in team chats. (`reference/policy/hook.py`)
6.  **Relationship Memory:** Tracking team hierarchies and responsibilities. (`adapters/graph/adapter.py`)
7.  **Audit Log:** Providing a "paper trail" for high-stakes cooperative work. (`reference/audit/sink.py`)
8.  **Checkpoint Pointers:** Resume collaborative work after a break. (`adapters/file/manifest.json`)
9.  **Export/Import:** Migrating team knowledge between tools. (`examples/08_batch_export_import.py`)
10. **Compliance Suite:** Ensuring all team-bots follow the same protocol rules. (`compliance/`)
