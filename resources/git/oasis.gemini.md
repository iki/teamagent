I will start by reading the instructions in `.prompt.md` and examining the contents of `oasis.xml` to understand the task requirements.

I have started analyzing the `oasis.xml` file and the project structure. I will now read the next section of the file to gather more details on the supported platforms, connectors, models, and architecture.

I have gathered substantial information about the project's features, simulation capabilities, and documentation. I will now read the next section of `oasis.xml` to analyze the source code implementation of the core modules and examine the development trends in the git logs.

I have a solid foundation for the project description, platforms, and features. I will now read the final section of `oasis.xml` to analyze the core agent and platform implementations, and review the git logs to identify the latest development trends.

Based on the comprehensive analysis of the OASIS repository and its documentation, here is the detailed report.

# OASIS: Open Agent Social Interaction Simulations

### 1. Project Name and Description
**OASIS (Open Agent Social Interaction Simulations)** is a scalable, open-source social media simulator designed to realistically mimic complex social behaviors at an unprecedented scale. By leveraging the CAMEL-AI framework, OASIS enables the simulation of up to **one million autonomous agents** interacting within digital environments that mirror the dynamics of platforms like Twitter and Reddit.

The project serves as a laboratory for social scientists and AI researchers to study emerging social phenomena such as information cascades, group polarization, and herd behavior. It bridges the gap between small-scale agent-based models and the vast complexity of real-world social networks, providing a controlled yet high-fidelity environment for experimentation.

Under the hood, OASIS integrates sophisticated recommendation systems (interest-based and hot-score-based) that drive how agents discover and interact with content. This architectural focus allows researchers to test how algorithmic interventions influence social dynamics, making it a powerful tool for developing and validating more ethical and effective social media technologies.

### 2. Supported Platforms and Deployments
*   **Local Python Environments:** Primary deployment method via `pip install camel-oasis` or local source setup using `poetry` or `uv`.
*   **Dockerized Deployments:** Supports containerization for consistent environment reproduction across different infrastructures.
*   **Simulated Social Platforms:**
    *   **Twitter Simulation:** Mirrors the short-form content and follow-based network of X (formerly Twitter).
    *   **Reddit Simulation:** Mirrors the subreddit-style communities and upvote/downvote dynamics.
*   **Electronic Mall:** A specialized deployment within the Reddit platform for simulating e-commerce interactions.
*   **Neo4j Graph Integration:** Deployment support for Neo4j backends to visualize and manage million-scale social graphs.

### 3. Supported Connectors
*   **Social Platform Connectors:** Simulated connectors for **Twitter** and **Reddit** APIs, allowing agents to perform platform-specific actions.
*   **Database Connectors:**
    *   **SQLite:** Default backend for storing simulation state, interaction traces, and post content (`oasis/social_platform/database.py`).
    *   **Neo4j:** High-performance graph database connector for managing complex agent relationships (`oasis/social_platform/config/neo4j.py`).
*   **Communication Channels:** Asynchronous safe dictionary-based channels (`oasis/social_platform/channel.py`) for inter-component messaging.
*   **Hugging Face:** Connector for downloading large-scale agent datasets and interaction profiles.
*   **Vector Database (Implicit):** Integration via `sentence-transformers` for embedding-based recommendation systems.

### 4. Supported Models and Agents
*   **Core Agent Class:** `SocialAgent` (derived from CAMEL's `ChatAgent`), found in `oasis/social_agent/agent.py`.
*   **Model Support:** Primarily optimized for **OpenAI models** (e.g., GPT-4o-mini), but supports any model integrated into the CAMEL-AI `ModelFactory`.
*   **Agent Types:**
    *   **LLM Agents:** Fully autonomous agents driven by Large Language Models.
    *   **Controllable Agents:** Agents that can be manually driven by human users via HCI (Human-Computer Interaction).
*   **Embedding Models:** Supports `sentence-transformers` (e.g., `paraphrase-MiniLM-L6-v2`) and OpenAI's embedding API for recommendation systems.

### 5. Most Valuable Use Cases
*   **Social Phenomena Simulation:** Studying group polarization, misinformation spread, and the "echo chamber" effect at a real-world scale.
*   **Recommendation System Evaluation:** Testing how different ranking algorithms (Random, Reddit-Hot, Personalized) affect user retention and content diversity.
*   **Financial Risk Analysis:** Simulating fraud risks and collaborative agent behaviors in decentralized social environments.
*   **AI Society Benchmarking:** Developing scaling laws for agent-based societies and observing emergent behaviors in multi-agent systems.

### 6. Top 20 Features
1.  **Million-Agent Scalability:** Architected to handle 1,000,000 agents efficiently.
2.  **23 Multi-Faceted Actions:** Includes following, quoting, reposting, liking, reporting, etc.
3.  **Dynamic RecSys:** Pluggable recommendation systems (Twitter-style vs Reddit-style).
4.  **Interview Action:** Direct probing of agents to extract internal states or opinions.
5.  **Group Chat System:** Support for private and public group-based agent interactions.
6.  **HCI Mode:** Real-time human participation in simulations.
7.  **Clock Magnification:** Accelerating simulation time relative to real-world time.
8.  **Trace Logging:** Granular recording of every agent action for retrospective analysis.
9.  **Controllable Agents:** Specific agent IDs reserved for human or scripted control.
10. **PettingZoo Integration:** Standardized environment interface for reinforcement learning.
11. **Neo4j Visualization:** Real-time rendering of social graph evolution.
12. **Customizable Prompts:** Agent-specific system messages and action space definitions.
13. **Electronic Mall:** Integrated marketplace for simulating social commerce.
14. **Automated Evaluation:** LLM-based rankers for analyzing simulation outcomes.
15. **Dataset Integration:** Easy loading of profiles from Hugging Face.
16. **Report Thresholding:** Automated content moderation based on community feedback.
17. **Trending Algorithm:** Time-decayed "hotness" scores for content discovery.
18. **Personalized Similarity:** Embedding-based content matching (Vector search).
19. **Graph Scalability:** Optimized `AgentGraph` for large-scale relationship management.
20. **Asynchronous Architecture:** Built entirely on `asyncio` for high concurrency.

### 7. Top 20 Smart Patterns
1.  **OpenAI Function Discovery:** Agents discover available actions by inspecting platform-provided docstrings (`oasis/social_agent/agent.py`).
2.  **Trace-Driven Personalization:** Recommendation systems use historical interaction traces to refine content delivery.
3.  **Clock Sandboxing:** Platform time is decoupled from system time to allow for "fast-forward" simulations.
4.  **AsyncSafeDict:** A specialized dictionary pattern to prevent race conditions during rapid channel communication.
5.  **Action Dispatching:** Using `getattr` on the Platform class to dynamically invoke actions based on strings.
6.  **Schema-on-Filesystem:** SQL schemas are stored as individual `.sql` files for modular database initialization.
7.  **Batch Embedding Generation:** Embedding calls are batched and cached to reduce API latency and cost.
8.  **HCI Interactive Loop:** A pattern for interrupting the simulation loop to wait for human input.
9.  **Role-Based System Prompts:** Dynamically constructing system messages from user profiles and task templates.
10. **Time-Decay Sorting:** Implementation of Reddit's ranking algorithm using epoch-based seconds.
11. **Structural Virality Metrics:** Automated calculation of the depth and breadth of post propagation.
12. **Controllable ID Reservation:** Reserving low-index IDs for human users to simplify interaction logic.
13. **Graph State Persistence:** Periodically dumping in-memory database states to persistent files.
14. **Interview Data Channeling:** Treating interviews as a platform action to ensure they are logged in the trace.
15. **Coarse Filtering:** Using random sampling before expensive embedding comparisons to handle million-scale data.
16. **Dynamic Edge Management:** Updating graph edges automatically when agents perform 'follow' or 'unfollow'.
17. **PettingZoo Wrapper:** Wrapping complex social logic in a standard AI Gym-like interface.
18. **Prompt-Driven Action Spaces:** Using LLM prompts to constrain what an agent *believes* it can do.
19. **SQL-Driven Moderation:** Implementing "reports" as a simple count-based filter in SQL queries.
20. **Vector Similarity Normalization:** Adjusting dot-product results based on norms to produce accurate cosine similarities.

### 8. Detailed Architecture Review
OASIS follows an **Agent-Platform-Environment (APE)** architectural pattern:
*   **SocialAgent (The Actor):** Encapsulates the LLM logic, memory, and personality. It perceives the world via text prompts and acts via tool calls.
*   **SocialPlatform (The World):** Manages the state of the social network. It handles database operations, recommendation ranking, and action validation. It acts as the "Server" in the social media model.
*   **Environment (The Orchestrator):** Manages the synchronization between agents and the platform. It handles the simulation steps and ensures actions are processed in the correct order.
*   **Channel (The Bridge):** An asynchronous message bus that decouples the Agents from the Platform, allowing them to potentially run on different processes or machines.

### 9. Top 20 Development Trends
1.  **Hyper-Frequent Community Updates:** Heavy focus on WeChat QR code updates for community engagement.
2.  **Scaling Law Exploration:** Moving from thousands to one million agents.
3.  **Refactoring for Interoperability:** Adopting standard RL interfaces like PettingZoo.
4.  **Enhancing Probing Capabilities:** Development of the "Interview" feature for deeper agent analysis.
5.  **Focus on Collaborative Research:** Explicitly documenting and linking follow-up research (e.g., MultiAgent4Fraud).
6.  **Documentation Maturity:** Transitioning from raw READMEs to structured MDX documentation.
7.  **Commerce Integration:** Adding e-commerce capabilities via the Electronic Mall.
8.  **Data Quality Focus:** Refactoring agent profile generation to support million-scale diversity.
9.  **Multimodal Expansion:** Preparation for images and other media types in simulations.
10. **Algorithm Fidelity:** Implementing exact Reddit/Twitter ranking clones.
11. **Dependency Modernization:** Moving towards `uv` and modern Python (3.10+).
12. **Visualization Sophistication:** Moving from static plots to dynamic Neo4j and structural virality analysis.
13. **Tool Integration:** Adding specialized simulation tools like Sympy for mathematical agents.
14. **LLM Evaluation:** Using LLMs to evaluate the quality of other agents' outputs.
15. **Action Space Expansion:** Continual addition of nuanced social actions (Quote, Report).
16. **Trace Granularity:** Increasing the detail of metadata captured in interaction traces.
17. **Stability Fixes:** Addressing "single iteration" bugs in examples and search tools.
18. **Open Science:** Strong push for arXiv publication and open-access datasets.
19. **Prompt Engineering:** Standardizing how agent personalities are injected via templates.
20. **PyPI Accessibility:** Focus on making the library easy to install for the general AI community.

### 10. Top 20 Technical Requirements
1.  Python >= 3.10, < 3.12
2.  `camel-ai`: Core agent framework.
3.  `pandas`: For profile and data management.
4.  `igraph`: For fast graph calculations.
5.  `sqlite3`: Local database storage.
6.  `sentence-transformers`: For local embedding generation.
7.  `torch`: Backend for RecSys models.
8.  `neo4j`: Optional for graph visualization.
9.  `poetry` or `uv`: For dependency management.
10. `pytest` & `pytest-asyncio`: For the testing suite.
11. `openai`: API access for GPT models.
12. `numpy` & `scipy`: Mathematical operations in RecSys.
13. `igraph`: Social network analysis.
14. `cairocffi`: Rendering graph visualizations.
15. `requests_oauthlib`: For potential real Twitter API integration.
16. `slack_sdk`: Integrated communication (optional).
17. `pillow`: Image processing.
18. `transformers`: Tokenization for Twhin-Bert.
19. `scikit-learn`: For TF-IDF and similarity metrics.
20. `docker`: For isolated environment deployment.

### 11. Top 10 Improvements/Fixes
1.  **PettingZoo Refactor:** Standardized the environment interface.
2.  **Interview Action Addition:** Enabled deep probing of agent states.
3.  **Million-Scale Optimization:** Improved `AgentGraph` and generator performance.
4.  **Electronic Mall:** Added a new dimension of simulation (commerce).
5.  **Report Post Action:** Introduced community-driven moderation simulation.
6.  **Quote Action Refactor:** Improved high-fidelity social networking (Twitter-style).
7.  **Documentation Link Fixes:** Corrected broken links to the core CAMEL library.
8.  **Example Bug Fixes:** Fixed single-iteration logic errors in simulation examples.
9.  **Dataset HuggingFace Link Update:** Synchronized with official data releases.
10. **RecSys Model Expansion:** Integrated Twhin-Bert and OpenAI embeddings.

### 12. Analysis of Input and Output Data
*   **Input Data:**
    *   **Agent Profiles (CSV/JSON):** Contains name, bio, interests, and initial social connections.
    *   **Task Templates:** Custom prompts that define agent goals (e.g., "be helpful," "spread controversy").
    *   **Configuration:** YAML/JSON files for platform rules (report thresholds, trend days).
*   **Output Data:**
    *   **Trace Database (SQLite):** A complete history of every like, post, follow, and refresh.
    *   **Simulation Logs:** Granular logs for debugging agent decision-making.
    *   **Visualization Plots:** PDF/PNG files showing network growth and information spread.
    *   **Interview Records:** Structured JSON/CSV data of agent responses to specific prompts.

### 13. Main Logic and Workflow
1.  **Initialization:** The `AgentGraph` is populated using user profiles.
2.  **Environment Setup:** The `Platform` (Twitter or Reddit) is initialized with an SQLite backend.
3.  **Reset:** The environment is reset, clearing old data and preparing the recsys.
4.  **Simulation Loop:**
    *   **Step:** Agents receive their latest "Refresh" feed from the Platform.
    *   **Action Selection:** Agents choose an action (e.g., `CREATE_POST`) based on their goals.
    *   **Execution:** Actions are sent via `Channel` to the Platform.
    *   **State Update:** Platform updates the SQL database and social graph.
    *   **RecSys Update:** Recommendation tables are refreshed based on new interactions.
5.  **Finalization:** Environment closes, and data is extracted for analysis.

### 14. Top 5 Used AI Skills
1.  **Content Creation:** Generating relevant posts and comments.
2.  **Social Filtering:** Determining which content to "like" or "dislike".
3.  **Discovery:** Using "Refresh" and "Trend" to find new information.
4.  **Social Networking:** Deciding who to follow based on bios and content.
5.  **Engagement Planning:** Timing posts and interactions for maximum impact.

### 15. Top 5 Provided AI Skills
1.  **Information Retrieval:** Advanced content ranking and search capabilities.
2.  **Simulation Orchestration:** Managing thousands of concurrent agent lifecycles.
3.  **Context Synthesis:** Summarizing complex social feeds into agent-readable prompts.
4.  **Behavioral Probing:** Facilitating structured interviews with autonomous agents.
5.  **Graph Analysis:** Real-time computation of network metrics and structural virality.

### 16. How to Run
```bash
pip install camel-oasis
export OPENAI_API_KEY=your_key
# Run the example simulation
python examples/reddit_simulation.py
```
*Manual Setup:* Clone the repo, run `poetry install`, and use `asyncio.run(main())` following the template in the README.

### 17. Top 20 Codebase Recommendations
1.  **Unified RecSys Interface:** Create a base class for all recsys algorithms to simplify additions.
2.  **Distributed Simulation:** Support Sharding for simulations exceeding 1M agents.
3.  **Personality Persistence:** Integrate long-term memory (RAG) for consistent agent personas.
4.  **Interactive Dashboards:** Replace static plots with a real-time web UI (e.g., Streamlit).
5.  **Standardized Moderation:** Add more complex automated moderation agents (Bots).
6.  **Economic Layer:** Expand the Electronic Mall into a full-scale social economy.
7.  **External API Integration:** Support real-world data injection (e.g., live Twitter feed).
8.  **PostgreSQL Support:** Optional support for Postgres for production-grade large-scale data.
9.  **Improved Error Handling:** More robust recovery for LLM API timeouts.
10. **Agent Collaboration Patterns:** Pre-defined templates for agent "teams" or "movements".
11. **Visual Content Support:** Integration with DALL-E/Stable Diffusion for image posts.
12. **CLI Tooling:** A dedicated `oasis-cli` for managing simulations.
13. **Rate-Limiting Simulation:** Adding realistic platform constraints (e.g., post limits).
14. **Cross-Platform Agents:** Agents that can interact across both Twitter and Reddit simulations.
15. **Advanced NLP Metrics:** Integrated sentiment and toxicity analysis for all posts.
16. **Dynamic Topology:** Support for "deleting" agents or entire sub-communities.
17. **Profiling Suite:** Integrated performance profiling to find RecSys bottlenecks.
18. **Template Library:** A gallery of pre-built simulation scenarios (e.g., "Election 2024").
19. **Auto-Visualization:** Automated PDF report generation at the end of every run.
20. **Human-Agent Collaboration Tools:** Specific tools for humans to "steer" agent groups.

### 18. Smart Patterns for Cooperative Workflows
*   **Probing Patterns:** Using `InterviewAction` to regularly check if agents are aligning with human-set goals.
*   **Controllable Injection:** Interleaving `LLMAction` with `ManualAction` to allow humans to intervene in critical moments.
*   **Group Synthesis:** Using `group_chat` as a shared blackboard for human and agent coordinators.
*   **Feedback Loops:** Humans use the `report_post` mechanism to "train" agents on what content is unacceptable.
*   **Trace-Based Auditing:** Using the SQL interaction trace as an audit log for cooperative tasks.

### 19. Strategic Reuse for Cooperative Workflows
*   **The Channel Pattern:** Reusable for any human-agent communication bus.
*   **The HCI Loop:** A blueprint for adding "Pause and Wait for Human" logic to autonomous agents.
*   **Database Trace Logic:** Found in `oasis/social_platform/database.py` for logging multi-agent collaborative steps.
*   **Controllable Agent Interfaces:** Implementation details in `oasis/social_agent/agent.py` for switching between autonomous and manual modes.

### 20. Cooperative Workflow Features
*   **`perform_action_by_hci`:** Direct human control of an agent within the loop.
*   **`interview`:** Structured probing of agent reasoning.
*   **`send_to_group`:** Shared context communication.
*   **`ManualAction`:** Pre-scripted human interventions.
*   **`ControllableAgent`:** Specialized agent class for human participation.

### 21. AI Skills for Cooperative Workflows
*   **Coordinated Response:** Agents synthesizing information from a group chat to provide a unified update.
*   **Adaptive Persona:** Agents modifying their social behavior based on "Report" feedback from human moderators.
*   **Goal Alignment Probing:** Proactively answering "interviews" to verify current task focus.
*   **Human Steering:** Responding to `ManualAction` directives that override default LLM behaviors.
*   **Contextual Information Retrieval:** Efficiently "refreshing" and summarizing shared group state for human review.
