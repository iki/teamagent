---
lang: "en"
title: "The Multi-Agent Landscape in 2026"
date: "2026-03-27T04:00:00.000Z"
description: "Why do swarms work? The naive view is that multiple agents are just parallel workers—more hands, faster work. But swarms produce qualitatively different outputs than single agents. Structured debate beats voting for reasoning tasks. Cross-platform observation changes belief trajectories. The mechanisms are now understood well enough to engineer reliably."
url: "http://localhost:4000/analysis/2026/03/27/multi-agent-landscape.html"
publisher: "Canteen"
author: "Canteen"
image_url: "https://thecanteenapp.com/assets/images/canteen-logo.png"
image_type: "png"
image_size: 13521
image_height: 256
image_width: 256
image_size_pretty: "13.5 kB"
logo_url: "https://thecanteenapp.com/assets/images/canteen-logo.png"
logo_type: "png"
logo_size: 13521
logo_height: 256
logo_width: 256
logo_size_pretty: "13.5 kB"
word_count: 3643
reading_time: "14 min read"
---

## Table of Contents

- [Why Swarm Simulation Works](#why-swarm-simulation-works)
  - [Belief State as the Core Primitive](#belief-state-as-the-core-primitive)
  - [What “Simulating Reddit” Actually Means](#what-simulating-reddit-actually-means)
  - [Stance Estimation Without LLM Calls](#stance-estimation-without-llm-calls)
  - [Cross-Platform Observation](#cross-platform-observation)
  - [Social Science](#social-science)
- [Orchestration Patterns](#orchestration-patterns)
  - [Graph-Based State Machines: Explicit Control](#graph-based-state-machines-explicit-control)
  - [Event-Driven Flows: Structured Emergence](#event-driven-flows-structured-emergence)
  - [The Trade-off](#the-trade-off)
- [Consensus Mechanisms](#consensus-mechanisms)
  - [The Debate Algorithm](#the-debate-algorithm)
  - [Why Debate Beats Voting](#why-debate-beats-voting)
  - [Structured Debate in Production](#structured-debate-in-production)
- [Research Directions](#research-directions)
  - [Graph-Based Evaluation](#graph-based-evaluation)
  - [Async RL Training](#async-rl-training)
  - [Open Questions](#open-questions)
- [Conclusions](#conclusions)

---

Why do swarms work? The naive view is that multiple agents are just parallel workers—more hands, faster work. But swarms produce *qualitatively different* outputs than single agents. Structured debate beats voting for reasoning tasks. Cross-platform observation changes belief trajectories. The mechanisms are now understood well enough to engineer reliably.

[Why Swarms Work](https://thecanteenapp.com/analysis/2026/03/27/multi-agent-landscape.html#swarms) · [Orchestration Patterns](https://thecanteenapp.com/analysis/2026/03/27/multi-agent-landscape.html#orchestration) · [Consensus Mechanisms](https://thecanteenapp.com/analysis/2026/03/27/multi-agent-landscape.html#consensus) · [Research Directions](https://thecanteenapp.com/analysis/2026/03/27/multi-agent-landscape.html#research) · [Conclusions](https://thecanteenapp.com/analysis/2026/03/27/multi-agent-landscape.html#conclusions)

## Why Swarm Simulation Works

The MiroFish ecosystem— [MiroFish](https://github.com/666ghj/MiroFish) (swarm prediction engine), [BettaFish](https://github.com/666ghj/BettaFish) (public opinion analysis), [MiroShark](https://github.com/aaronjmars/MiroShark) (prediction markets), [MiroFish-Offline](https://github.com/nikmcfly/MiroFish-Offline) (local deployment), and [OASIS](https://github.com/camel-ai/oasis) (million-agent scale)—has converged on a model where agents maintain evolving belief states and observe multiple platforms simultaneously. The insight isn’t “run many agents”—it’s that **persistent internal state + cross-platform observation produces emergent dynamics** that match real social behavior.

### Belief State as the Core Primitive

Each agent tracks positions, confidence, and trust that evolve heuristically through rounds ([belief_state.py#L26](https://github.com/aaronjmars/MiroShark/blob/aa976fd0b61b1ed5eae96918479fc884a8cf5dba/backend/wonderwall/social_agent/belief_state.py#L26)):

``` python
@dataclass
class BeliefState:
    positions: Dict[str, float]     # topic → stance (-1.0 to +1.0)
    confidence: Dict[str, float]    # topic → certainty (0.0 to 1.0)
    trust: Dict[int, float]         # agent_id → trust level (0.0 to 1.0)
    exposure_history: Set[str]      # argument hashes (prevents re-processing)
```

The update rule is where the insight lies. Three effects empirically shown to matter in real social systems are encoded ([belief_state.py#L80](https://github.com/aaronjmars/MiroShark/blob/aa976fd0b61b1ed5eae96918479fc884a8cf5dba/backend/wonderwall/social_agent/belief_state.py#L80)):

``` python
def update_from_round(self, posts_seen, own_engagement, round_num):
    for post in posts_seen:
        content_hash = hashlib.md5(content.encode()).hexdigest()[:12]
        is_novel = content_hash not in self.exposure_history

        # Trust weight for author (default 0.5 for unknown)
        author_trust = self.trust.get(author_id, 0.5)

        # Social proof: posts with more likes carry more weight
        social_weight = min(1.0, 0.3 + likes * 0.07)

        # Novelty amplifier: first exposure has 2x impact
        novelty_mult = 1.5 if is_novel else 0.5

        # High-confidence agents resist change
        resistance = 0.3 + current_conf * 0.7  # 0.3 to 1.0

        nudge = (
            (post_stance - current_pos)
            * author_trust * social_weight * novelty_mult
            * 0.08 / resistance
        )
        self.positions[topic] = max(-1.0, min(1.0, current_pos + nudge))
```

Why these specific mechanisms?

**Trust-weighted influence** matches social identity theory: we’re more persuaded by in-group members. The default 0.5 trust decays or grows based on interaction history ([belief_state.py#L171](https://github.com/aaronjmars/MiroShark/blob/aa976fd0b61b1ed5eae96918479fc884a8cf5dba/backend/wonderwall/social_agent/belief_state.py#L171)):

``` python
def update_trust(self, other_agent_id: int, action: str):
    adjustments = {
        "like": 0.05,
        "dislike": -0.05,
        "follow": 0.10,
        "unfollow": -0.10,
        "mute": -0.20,
    }
    delta = adjustments.get(action, 0.0)
    self.trust[other_agent_id] = max(0.0, min(1.0, current + delta))
```

**Novelty detection** captures the “illusory truth effect”—repeated exposure to the same argument doesn’t increase persuasion linearly. The content hash prevents re-processing:

``` python
content_hash = hashlib.md5(content.encode()).hexdigest()[:12]
is_novel = content_hash not in self.exposure_history
self.exposure_history.add(content_hash)

# Capped to prevent unbounded memory
if len(self.exposure_history) > self.MAX_EXPOSURE_HISTORY:
    to_remove = list(self.exposure_history)[:500]
    self.exposure_history -= set(to_remove)
```

**Confidence-based resistance** models motivated reasoning: high-confidence believers are harder to move. The formula `resistance = 0.3 + current_conf * 0.7` means a maximally confident agent resists change 3× more than an uncertain one.

The confidence itself updates based on social reinforcement:

``` python
if likes_received > dislikes_received:
    # Social validation increases confidence
    boost = min(0.15, (likes_received - dislikes_received) * 0.03)
    self.confidence[topic] = min(1.0, current_conf + boost)
elif dislikes_received > likes_received:
    # Social pushback decreases confidence (not position!)
    drop = min(0.15, (dislikes_received - likes_received) * 0.03)
    self.confidence[topic] = max(0.1, current_conf - drop)
```

Note: social pushback affects *confidence*, not *position*. Getting ratio’d makes you less certain, not necessarily changed. This matches empirical findings on backfire effects.

### What “Simulating Reddit” Actually Means

[OASIS](https://github.com/camel-ai/oasis) implements social platforms as SQLite databases with recommendation systems. Each agent can execute actions that modify the database state ([typing.py#L17](https://github.com/camel-ai/oasis/blob/f9afaeb92f228c2cc04fc556c2ed3b86452fe74a/oasis/social_platform/typing.py#L17)):

``` python
class ActionType(Enum):
    CREATE_POST = "create_post"
    LIKE_POST = "like_post"
    DISLIKE_POST = "dislike_post"
    REPOST = "repost"
    CREATE_COMMENT = "create_comment"
    LIKE_COMMENT = "like_comment"
    FOLLOW = "follow"
    MUTE = "mute"
    # ... 13+ action types
```

The platform maintains tables for posts, comments, likes, follows. A recommendation system (`rec_sys_reddit`, `rec_sys_personalized_twh`) determines which posts each agent sees—mimicking algorithmic feeds. A simulated clock controls time progression.

Each round, agents:

1.  Receive posts from the recommendation system
2.  Observe engagement counts (likes, comments)
3.  Generate LLM-driven actions based on their belief state + observations
4.  Update their beliefs heuristically based on what they saw

The schema matches real platform mechanics. Posts have `num_likes`, `num_dislikes`, `num_shares`. Comments nest under posts. The recommendation system can be swapped between random, personalized, or trace-based (replaying real user behavior).

### Stance Estimation Without LLM Calls

A critical design choice: belief updates don’t call the LLM. Stance estimation is heuristic ([belief_state.py#L297](https://github.com/aaronjmars/MiroShark/blob/aa976fd0b61b1ed5eae96918479fc884a8cf5dba/backend/wonderwall/social_agent/belief_state.py#L297)):

``` python
def _estimate_stance(content: str) -> Optional[float]:
    """Returns -1.0 (negative) to 1.0 (positive), no LLM call"""
    content_lower = content.lower()

    positive_signals = [
        "support", "agree", "great", "excellent", "beneficial",
        "necessary", "progress", "opportunity", "innovative",
    ]
    negative_signals = [
        "oppose", "disagree", "terrible", "harmful", "dangerous",
        "unacceptable", "disastrous", "fail", "wrong",
    ]

    pos_count = sum(1 for w in positive_signals if w in content_lower)
    neg_count = sum(1 for w in negative_signals if w in content_lower)

    if pos_count + neg_count > 0:
        return (pos_count - neg_count) / (pos_count + neg_count)

    # Broader fallback, attenuated by 0.6 for less confident signal
    # Final fallback: neutral 0.0 so post still participates
    return 0.0
```

At million-agent scale, calling an LLM per belief update per post per round would be prohibitive. The heuristic is intentionally simple—the emergent dynamics come from agent interaction, not individual sophistication.

### Cross-Platform Observation

[MiroShark](https://github.com/aaronjmars/MiroShark) extends this to prediction markets. Agents observe posts from Twitter *and* Reddit *and* Polymarket simultaneously.

An agent observing bearish sentiment on Twitter adjusts their Polymarket positions. Then market price movements feed back into social media discussion. This captures real phenomena like social media driving meme stock movements.

The belief state is injected into the agent’s system prompt each round ([belief_state.py#L191](https://github.com/aaronjmars/MiroShark/blob/aa976fd0b61b1ed5eae96918479fc884a8cf5dba/backend/wonderwall/social_agent/belief_state.py#L191)):

``` python
def to_prompt_text(self) -> str:
    lines = ["# YOUR CURRENT BELIEFS AND STANCE"]
    lines.append(
        "These reflect your evolving understanding based on what you've "
        "observed and experienced. Let them guide (but not rigidly dictate) "
        "your actions."
    )

    for topic, position in self.positions.items():
        conf = self.confidence.get(topic, 0.5)
        stance_label = _stance_label(position)  # "strongly supportive", etc.
        conf_label = _confidence_label(conf)    # "very high — firmly held view"
        lines.append(
            f"- On **{topic}**: You are {stance_label} "
            f"(confidence: {conf_label})"
        )
```

The prompt injection is explicit—agents know their own beliefs. But the beliefs evolved heuristically, not through explicit reasoning. This separation (LLM for action generation, heuristics for belief update) is what makes scale possible.

### Social Science

The architecture (graph memory + belief state + cross-platform observation) isn’t arbitrary. It captures mechanisms validated in computational social science:

1.  **Belief trajectories differ from random walks**: Network structure determines whether agents converge or polarize. In echo chambers (high trust among ideologically similar agents), beliefs reinforce. In bridge networks, beliefs moderate.

2.  **Cross-platform effects are measurable**: Same agents, same topics—different outcomes when observing one vs. multiple platforms. Information arbitrage between platforms creates dynamics absent in single-platform simulations.

3.  **Misinformation dynamics match real platforms**: OASIS includes [counterfactual analysis](https://github.com/camel-ai/oasis/blob/f9afaeb92f228c2cc04fc556c2ed3b86452fe74a/visualization/reddit_simulation_counterfactual/code/analysis_couterfact.py#L29) that seeds false statements and measures agent agreement over time. The [results](https://github.com/camel-ai/oasis/blob/f9afaeb92f228c2cc04fc556c2ed3b86452fe74a/visualization/reddit_simulation_counterfactual/result/example.png) across 10,000 agents: when misinformation is seeded with initial upvotes, agents show lower disagreement (~5.0-5.3) compared to when it’s downvoted (~6.0-6.5). Social proof amplifies false statements—exactly as it does on real social media. The simulation captures the vulnerability, not just the mechanics.

## Orchestration Patterns

Three distinct patterns have emerged for coordinating multi-agent systems. They reflect different philosophies about control flow: should coordination emerge from agent interaction, or be explicitly specified?

[AutoGen](https://github.com/microsoft/autogen) implements group chats where agents observe messages and decide responses independently. Coordination emerges from the exchange ([\_base_group_chat.py#L40](https://github.com/microsoft/autogen/blob/8544314fa6cc9f906c3ec2395927f5404ffbb5eb/python/packages/autogen-agentchat/src/autogen_agentchat/teams/_group_chat/_base_group_chat.py#L40)):

``` python
class BaseGroupChat(Team, ABC, ComponentBase[BaseModel]):
    """In a group chat team, participants share context by publishing
    their messages to all other participants.

    If a ChatAgent is a participant, the BaseChatMessage from the agent
    response will be published to other participants in the group chat.
    """
```

Agents publish to message queues with topic-based routing. No explicit orchestrator decides who speaks next—agents observe and react. The advantage: natural multi-agent dialogue without rigid turn-taking. The trade-off: implicit control flow makes deterministic execution harder to guarantee.

### Graph-Based State Machines: Explicit Control

[LangGraph](https://github.com/langchain-ai/langgraph) takes the opposite approach: explicit state objects flow through directed graphs ([state.py#L115](https://github.com/langchain-ai/langgraph/blob/ae76f33c6d0aa125f25a194885e1041f5ea6cccf/libs/langgraph/langgraph/graph/state.py#L115)):

``` python
class StateGraph(Generic[StateT, ContextT, InputT, OutputT]):
    """A graph whose nodes communicate by reading and writing
    to a shared state."""

# Usage:
graph = StateGraph(AgentState)
graph.add_node("researcher", research_node)
graph.add_node("writer", write_node)
graph.add_edge("researcher", "writer")
graph.add_conditional_edges("writer", should_continue, {
    "continue": "researcher",
    "end": END
})
```

Every transition is defined. Debugging is straightforward because you can trace exactly which node executed when. The Pregel algorithm ensures deterministic, step-based execution. The trade-off: more verbose, requires upfront graph definition.

### Event-Driven Flows: Structured Emergence

[CrewAI](https://github.com/crewaiinc/crewai) has evolved from pure task execution to event-driven Flows. Decorators define control points without requiring full graph specification ([flow.py#L145](https://github.com/crewaiinc/crewai/blob/9fe0c15549c7605e83f0202bbc5b063a7665d71f/lib/crewai/src/crewai/flow/flow.py#L145)):

``` python
def start(
    condition: FlowCondition | None = None,
) -> Callable[[Callable[P, R]], FlowMethod[P, R]]:
    """Mark a method as a start method for the flow."""

def listen(
    *methods: FlowMethod | type | str,
) -> Callable[[Callable[P, R]], FlowMethod[P, R]]:
    """Mark a method as a listener for other methods."""

def router(
    *methods: FlowMethod | type | str,
) -> Callable[[Callable[P, R]], FlowMethod[P, R]]:
    """Mark a method as a router for conditional branching."""
```

Usage follows event-driven patterns:

``` python
class AnalysisFlow(Flow[State]):
    @start()
    async def gather_data(self) -> Data:
        return await self.data_crew.kickoff()

    @listen(gather_data)
    async def analyze(self, data: Data) -> Analysis:
        return await self.analysis_crew.kickoff(inputs=data)

    @router(analyze)
    def route_by_confidence(self, analysis: Analysis) -> str:
        return "high_confidence" if analysis.confidence > 0.9 else "review"
```

This sits between implicit message-passing and explicit graph definition—structured but not rigidly sequential. CrewAI’s evolution from pure Crews to Flows reflects production needs for predictable execution paths while retaining flexibility.

### The Trade-off

These aren’t just implementation choices. They answer: **how much should emerge vs. be specified?**

- **Message-passing**: Maximum emergence, minimum specification. Best for exploratory dialogue.
- **Graph-based**: Maximum specification, minimum emergence. Best for production pipelines.
- **Event-driven**: Structured emergence with explicit routing points. Best for workflows with known decision points but flexible paths between them.

Production deployments trend toward explicit control (graphs, flows) because debugging emergent behavior at scale is hard. Research benefits from emergence—million-agent simulations need flexibility that rigid graphs can’t provide.

## Consensus Mechanisms

How do multiple agents reach a decision? Two primary patterns have emerged, with [debate-or-vote](https://github.com/deeplearning-wisc/debate-or-vote) (NeurIPS 2025 Spotlight) providing empirical evidence on when each works.

### The Debate Algorithm

Debate implements multi-round argumentation where agents revise answers based on peer opinions ([main.py#L72](https://github.com/deeplearning-wisc/debate-or-vote/blob/82c929ea773d534cfb3fb0ddc4b7d14d245ab549/src/main.py#L72)):

``` python
def get_new_message(args, sample, responses, personas=None):
    if not args.centralized:  # DECENTRALIZED MAD
        for i, agent in enumerate(agents):
            msg = "These are the recent opinions from other agents: "

            if args.sparse:
                # Ring topology: see only 2 neighbors
                peers = [agents[(i-1) % len(agents)], agents[(i+1) % len(agents)]]
            else:
                # Dense: see all other agents
                peers = agents[:i] + agents[i+1:]

            for other_agent in peers:
                msg += f"\n\nOne agent's response: \n{responses[other_agent]}\n"

            msg += f"\n\nThis was your most recent opinion:\n{responses[agents[i]]}\n"
            msg += f'\n\nUse these opinions as advice to revise your answer'

    else:  # CENTRALIZED MAD
        for i, agent in enumerate(agents):
            if i == 0:
                # Agent 0 sees all peers
                peers = agents[1:]
            else:
                # Other agents see only Agent 0
                msg = f"This is the recent opinion from another agent: \n{responses[agents[0]]}\n"
```

The code supports four topology variants:

- **Sparse decentralized**: Ring graph, each agent sees 2 neighbors
- **Dense decentralized**: Complete graph, each agent sees all others
- **Centralized sparse**: Star graph, Agent 0 is hub
- **Centralized dense**: Agent 0 sees all, broadcasts to all

The main loop runs for N rounds:

``` python
for r in range(start, args.debate_rounds+1):
    new_agent_messages = get_new_message(args, x, agent_responses, suffix=SUFFIX)
    messages = list(new_agent_messages.values())
    responses = engine(messages, agent, args.num_agents)
    agent_responses = dict(zip(agent_names, responses))

    # Evaluate after each round
    final_resps, debate_resps, is_corr = evaluate(agent_responses, y)
    round_iscorr.append(is_corr)
```

### Why Debate Beats Voting

The empirical results across datasets:

**Reasoning tasks** (GSM8K, arithmetic): Debate significantly outperforms voting. The mechanism: errors get corrected through iterative refinement. When Agent A makes an arithmetic error, Agents B and C’s correct answers in subsequent rounds allow A to identify and fix the mistake.

**Classification** (HellaSwag, MCQ): Voting is sufficient. There’s no reasoning chain to refine—the answer is either right or wrong, and majority aggregation captures the signal.

**Topology matters less than mechanism**: Sparse vs. dense, centralized vs. decentralized—all debate variants outperform all voting variants for reasoning tasks. The key is iterative revision, not connectivity structure.

The paper also explores heterogeneous agents (`--multi_persona`):

``` python
if args.multi_persona:
    messages = []
    for name, sys in personas.items():
        messages.append([
            {"role": "system", "content": sys},
            {"role": "user", "content": x + SUFFIX}
        ])
else:
    messages = [{"role": "user", "content": x + SUFFIX}] * args.num_agents
```

Different personas don’t substantially change the debate \> voting result—the mechanism dominates the personality.

### Structured Debate in Production

[TradingAgents](https://github.com/TauricResearch/TradingAgents) implements debate as a production financial system. The graph structure encodes a specific debate hierarchy ([setup.py#L156](https://github.com/TauricResearch/TradingAgents/blob/589b351f2ab55a8a37d846848479cebc810a5a36/tradingagents/graph/setup.py#L156)):

``` python
# Investment debate: Bull vs Bear
workflow.add_conditional_edges(
    "Bull Researcher",
    self.conditional_logic.should_continue_debate,
    {
        "Bear Researcher": "Bear Researcher",
        "Research Manager": "Research Manager",
    },
)
workflow.add_conditional_edges(
    "Bear Researcher",
    self.conditional_logic.should_continue_debate,
    {
        "Bull Researcher": "Bull Researcher",
        "Research Manager": "Research Manager",
    },
)

# Risk debate: Aggressive vs Conservative vs Neutral
workflow.add_conditional_edges(
    "Aggressive Analyst",
    self.conditional_logic.should_continue_risk_analysis,
    {
        "Conservative Analyst": "Conservative Analyst",
        "Portfolio Manager": "Portfolio Manager",
    },
)
```

Two debate stages:

1.  **Investment debate**: Bull Researcher argues for positions, Bear argues against. Research Manager synthesizes after N rounds.
2.  **Risk debate**: Aggressive pushes for larger positions, Conservative for smaller, Neutral mediates. Portfolio Manager synthesizes.

The critical addition: **persistent memory with reflection** ([reflection.py#L15](https://github.com/TauricResearch/TradingAgents/blob/589b351f2ab55a8a37d846848479cebc810a5a36/tradingagents/graph/reflection.py#L15)):

``` python
class Reflector:
    def _get_reflection_prompt(self) -> str:
        return """
        You are an expert financial analyst reviewing trading decisions.

        1. Reasoning:
           - Determine whether each decision was correct (increased returns)
             or incorrect (decreased returns)
           - Analyze contributing factors: market intelligence, technical
             indicators, news, sentiment, fundamentals
           - Weight the importance of each factor

        2. Improvement:
           - For incorrect decisions, propose revisions
           - Specific recommendations (e.g., change HOLD to BUY on date X)

        3. Summary:
           - Lessons learned from successes and mistakes
           - How to apply to future similar situations

        4. Query:
           - Condense into <1000 tokens for memory retrieval
        """
```

After each trade executes and returns are known, each agent role runs a reflection pass: the LLM analyzes what the agent argued, compares it to actual outcomes, and generates a lesson ([reflection.py#L73](https://github.com/TauricResearch/TradingAgents/blob/589b351f2ab55a8a37d846848479cebc810a5a36/tradingagents/graph/reflection.py#L73)):

``` python
def reflect_bull_researcher(self, current_state, returns_losses, bull_memory):
    situation = self._extract_current_situation(current_state)
    bull_debate_history = current_state["investment_debate_state"]["bull_history"]

    result = self._reflect_on_component(
        "BULL", bull_debate_history, situation, returns_losses
    )
    # Vector store for similarity retrieval
    bull_memory.add_situations([(situation, result)])
```

The `situation` is a snapshot of market conditions; `result` is the generated lesson (e.g., “overweighted tech stocks during Fed uncertainty—should have been more conservative”). These pairs are stored in a vector database. On future trades, the system retrieves lessons from similar past situations and injects them into the agent’s context. If the Bull was wrong in a comparable market, that lesson surfaces before the next debate.

## Research Directions

### Graph-Based Evaluation

Most agent benchmarks report a single number: “65% on SWE-bench” or “42% on WebArena.” But tasks aren’t atomic—”book a flight” requires search → select → enter details → confirm → pay. An agent that completes 4/5 steps fails identically to one that completes 0/5. This obscures where capabilities actually break down.

[CRAB](https://github.com/camel-ai/crab) introduces DAG-based evaluation that tracks completion hierarchies ([graph_evaluator.py#L23](https://github.com/camel-ai/crab/blob/2568dd3dbe2117f9784e7daaf2df1f570e3e445d/crab/core/graph_evaluator.py#L23)):

``` python
class GraphEvaluator:
    def __init__(self, incoming_graph_data):
        self.G = nx.DiGraph(incoming_graph_data)
        assert nx.is_directed_acyclic_graph(self.G)

        self.total_nodes: int = self.G.number_of_nodes()
        self.complete_nodes: int = 0
        self.completeness: float = 0.0
        self.completeness_per_action: float = 0.0
        self.longest_unfinished_path_length: int = nx.dag_longest_path_length(self.G)
```

The evaluation tracks three metrics:

**Completeness**: Fraction of DAG nodes completed.

**Completeness per action**: Efficiency. An agent that completes 50% in 10 actions scores lower than one completing 50% in 5 actions.

**Longest unfinished path**: How much work remains. Computed by BFS from the sink ([graph_evaluator.py#L118](https://github.com/camel-ai/crab/blob/2568dd3dbe2117f9784e7daaf2df1f570e3e445d/crab/core/graph_evaluator.py#L118)):

``` python
def calculate_longest_unfinished_path_length(self) -> int:
    if self.G.nodes[self.sink_node]["passing_count"] is not None:
        return 0

    visited = set()
    queue = deque([[self.sink_node]])

    while queue:
        path = queue.popleft()
        node = path[0]
        visited.add(node)
        longest_path_length = max(len(path), longest_path_length) - 1

        for predecessor in self.G.predecessors(node):
            if self.G.nodes[predecessor]["passing_count"] is not None:
                continue  # Skip completed nodes
            elif predecessor not in visited:
                queue.append([predecessor] + path)

    return longest_path_length
```

The DAG nodes auto-unlock as predecessors complete ([graph_evaluator.py#L59](https://github.com/camel-ai/crab/blob/2568dd3dbe2117f9784e7daaf2df1f570e3e445d/crab/core/graph_evaluator.py#L59)):

``` python
def step(self, envs: dict[str, Environment]):
    evaluators = self.get_next_source_nodes()
    while evaluators:
        for evaluator in evaluators:
            environment = envs[evaluator.env_name]
            result = environment.take_action(evaluator)
            if result:
                self.G.nodes[evaluator]["passing_count"] = self.count
                self.complete_nodes += 1
                for _, out_node in self.G.out_edges(evaluator):
                    self.G.nodes[out_node]["remaining_predecessors"] -= 1
```

This evaluation structure reveals *where* agents fail. If agents consistently complete nodes A, B, C but fail at D, that’s actionable signal for improving D-related capabilities.

### Async RL Training

Synchronous RL training creates a bottleneck: all workers wait for the slowest. [AReaL](https://github.com/inclusionai/areal) demonstrates async training with careful off-policy control:

``` yaml
max_head_offpolicyness: 2  # Allow 2 steps of policy staleness
reward_normalization: group  # Normalize rewards within rollout groups
advantage_normalization: batch  # Normalize advantages across batch
```

The key architectural decision: `pause_generation` instead of `abort_all_req`. When the policy updates, don’t throw away in-progress generations—pause them, update, resume. This achieves 2.77× speedup over synchronous baselines.

### Open Questions

**Minimal interfaces**: [SWE-agent](https://github.com/princeton-nlp/swe-agent) achieves 65% on SWE-bench with ~100 lines. What’s the minimal tool interface for effective agents? Current frameworks may be over-engineered.

**Learning from execution**: [TradingAgents](https://github.com/TauricResearch/TradingAgents) ’ reflection system stores situation→lesson pairs. Can this approach generalize? The memory retrieval depends on situation similarity—but what makes situations “similar” for learning transfer?

**Topology effects**: Sparse vs. dense debate—when does connectivity structure matter? The [debate-or-vote](https://github.com/deeplearning-wisc/debate-or-vote) results suggest mechanism dominates topology for reasoning tasks, but this may not hold for other task types.

## Conclusions

The multi-agent landscape has moved past exploration into engineering. The patterns that work are clear: heuristic belief updates for scale, structured debate for reasoning quality, graph-based evaluation for diagnostic precision. The patterns that don’t—homogeneous voting for reasoning, single-platform observation for prediction, binary metrics for capability assessment—are equally clear.

The implication is that multi-agent systems should be the default for any task involving reasoning under uncertainty. A single agent voting with itself (sampling multiple times and taking majority) is strictly worse than debate for math, logic, and analysis. The cost is higher—more tokens, more latency—but the quality ceiling is higher too. For tasks where correctness matters more than speed, debate wins.

The MiroFish ecosystem demonstrates this clearly: it doesn’t use LLMs for belief updates—it uses keyword matching and simple arithmetic. The emergent behavior comes from agent interaction at scale, not from individual agent sophistication. Dumb components with smart interaction patterns outperform smart components with dumb interaction patterns. Multi-agent systems are fundamentally about the interaction, not the agents.