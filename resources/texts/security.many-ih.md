---
publisher: "github.io"
lang: "en"
title: "ManyIH-Bench"
url: "https://jhu-clsp.github.io/ManyIH"
date: "2026-04-13T02:47:56.000Z"
description: "A benchmark for evaluating how LLMs resolve instruction conflicts across arbitrarily many privilege levels."
logo_url: "https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://github.io/ManyIH/&size=128"
logo_type: "png"
logo_size: 4279
logo_height: 96
logo_width: 96
logo_size_pretty: "4.28 kB"
word_count: 644
reading_time: "3 min read"
---

## Table of Contents

- [Defining Many-Tier Instruction Hierarchy](#defining-many-tier-instruction-hierarchy)
- [Main Results on ManyIH-Bench](#main-results-on-manyih-bench)
  - [Scaling Instruction Hierarchy Tiers](#scaling-instruction-hierarchy-tiers)
  - [Correctness vs. Style on Coding Subset](#correctness-vs-style-on-coding-subset)
- [Key Takeaways](#key-takeaways)
- [About ManyIH-Bench](#about-manyih-bench)
  - [Coding Subset (427 samples)](#coding-subset-427-samples)
  - [Instruction-Following Subset (426 samples)](#instruction-following-subset-426-samples)
  - [Design Principles](#design-principles)
  - [Evaluation Protocol](#evaluation-protocol)

---

A benchmark for evaluating how LLMs resolve instruction conflicts across arbitrarily many privilege levels.

## Defining Many-Tier Instruction Hierarchy

LLM agents receive instructions from many sources—system messages, user prompts, tool outputs, skill files, and other agents—each carrying different levels of trust and authority. The **Instruction Hierarchy** (IH) formalizes how models should resolve conflicts among instructions of different privilege levels.

Current IH implementations assume a **fixed, small** set of privilege levels (typically fewer than five) defined by rigid role labels (e.g., `system > user`). Because models learn to operate over these role labels fixed during training, they are limited to a small number of privilege tiers—creating a **fixed- and few-tier bottleneck**.

This is insufficient for real-world agentic settings. For instance, a coding agent may receive multi-level guidelines from system prompts, developer configs, skill files, user messages, and tool outputs with varying trust levels. In group chats, participants may hold heterogeneous privileges (admins, moderators, members), creating multiple tiers within what is traditionally a single "user" role.

![Comparison of existing IH (fixed tiers) vs Many-Tier IH (arbitrary privilege levels)](https://jhu-clsp.github.io/assets/teaser.png)

Existing IH assigns the same "Medium" privilege to three different sources, leaving the conflict unresolvable. ManyIH assigns each instruction a distinct privilege value via ordinal or scalar interfaces, enabling fine-grained resolution.

**Many-Tier Instruction Hierarchy (ManyIH)** resolves this bottleneck. Rather than deriving privilege from role labels, ManyIH dynamically assigns each instruction a privilege value via a dedicated **Privilege Prompt Interface** (PPI) and resolves conflicts by comparing these values. Two PPI variants are proposed:

- **Ordinal**: instructions are tagged with ordinal values (e.g., `[[Privilege 2]]`), where lower number = higher privilege.
- **Scalar**: instructions are tagged with scalar values (e.g., `[[z=82]]`), where larger value = higher privilege.

Conflicts are resolved based solely on the **relative ordering** of privilege values, not their absolute magnitudes. This decouples privilege semantics from message role labels, enabling models to reason over arbitrarily many privilege levels specified at inference time.

## Main Results on ManyIH-Bench

Ten frontier proprietary and open-source models were evaluated on ManyIH-Bench with temperature 0 and reasoning effort set to high. **Even the best model (Gemini 3.1 Pro) achieves only 42.7% accuracy**, revealing that many-tier instruction conflict resolution is a challenging, unsolved capability.

![Overall accuracy on ManyIH-Bench](https://jhu-clsp.github.io/assets/main_comparison_overall.png)

Overall accuracy (%). Error bars: bootstrap 95% CIs.

![Accuracy by subset (Coding and IF)](https://jhu-clsp.github.io/assets/main_comparison_by_subset.png)

Accuracy by subset (Coding in teal, IF in orange).

Notably, models that excel at standard two-tier IH do not necessarily generalize to the many-tier setting. For example, GPT 5.4 reports \>99% accuracy on two-tier IH evaluations such as system prompt extraction, yet achieves only 39.4% on ManyIH-Bench. Human validation confirms a ceiling of at least ~80% accuracy is attainable, indicating significant room for improvement.

### Scaling Instruction Hierarchy Tiers

To isolate the effect of IH complexity from instruction following difficulty, three Coding subset variants were created with 6, 8, and 12 privilege tiers while holding the number of style groups and winning instructions fixed.

![Accuracy vs. number of IH tiers](https://jhu-clsp.github.io/assets/difficulty_lines.png)

Accuracy consistently degrades as the number of IH tiers increases. 11 out of 12 model–transition pairs show strict decrease, with drops from 6.8% to 24.1%.

### Correctness vs. Style on Coding Subset

On the Coding subset, style compliance is the primary bottleneck for overall accuracy. All frontier models maintain high functional correctness (\>86% test accuracy), but style accuracy—which requires reasoning over ManyIH privilege levels—is much lower.

| Model          | Accuracy  | Test Acc  | Style Acc |
| -------------- | --------- | --------- | --------- |
| GPT 5.4        | **60.9%** | 89.7%     | **67.9%** |
| Gemini 3.1 Pro | 59.0%     | 91.3%     | 65.1%     |
| Grok 4.20      | 54.1%     | 86.2%     | 63.0%     |
| Opus 4.6       | 51.3%     | **92.5%** | 56.7%     |
| Kimi K2.5      | 42.4%     | 87.4%     | 49.4%     |
| Sonnet 4.6     | 39.1%     | 91.6%     | 42.4%     |
| Qwen3.5-397B   | 41.0%     | 87.4%     | 48.2%     |
| Qwen3.5-122B   | 19.7%     | 65.3%     | 31.6%     |
| Qwen3.5-9B     | 8.4%      | 71.7%     | 13.3%     |
| Qwen3.5-4B     | 3.5%      | 61.8%     | 7.7%      |

## Key Takeaways

- **Many-tier IH is an unsolved challenge.** Even the best frontier model achieves only 42.7% accuracy on ManyIH-Bench, despite reporting \>99% on standard two-tier IH evaluations. This gap suggests that many-tier instruction conflict resolution is a qualitatively distinct capability from the fixed-tier IH that current models are trained on.
- **Performance degrades as privilege tiers increase.** Across 12 model–transition pairs on the Coding subset, 11 show strict accuracy decrease as tiers scale from 6 to 12, with drops ranging from 6.8% to 24.1%. Current models do not generalize well to progressively many privilege tiers.
- **Models are sensitive to how privilege is represented.** Switching from ordinal to scalar privilege format—which encodes the same relative ordering—causes accuracy drops of up to 8.4% (GPT 5.4) and 8.0% (Opus 4.6). Small prompt changes on privilege representation can meaningfully affect reasoning over many-tier instruction hierarchy.
- **Models are sensitive to exact privilege values.** Under the scalar format, perturbing privilege values by a small random integer (±3) while preserving relative ordering flips 8–17% of per-sample outcomes. This shows models attend to absolute magnitudes despite only relative ordering being semantically meaningful.

## About ManyIH-Bench

ManyIH-Bench is the first benchmark designed to evaluate instruction conflict resolution under arbitrarily many privilege levels. It comprises **853 agentic tasks** with up to **12 distinct privilege levels** per sample, compared to 2–3 levels in prior work.

853

Total samples

12

Max privilege levels

46

Real-world agents

2

Subsets

### Coding Subset (427 samples)

Pairs MBPP coding problems with conflicting style instructions (e.g., naming conventions, indentation, operator spacing) inspired by PEP 8, simulating realistic system constraints from many sources. Each sample contains 12 style instructions across 4 style groups with up to 12 privilege levels, averaging 9.8 conflicts and 6 winning style instructions. The model must produce code that is both functionally correct and adheres to the highest-privilege style in each conflict group. Evaluation is fully programmatic via unit tests and code-based style checkers.

### Instruction-Following Subset (426 samples)

Draws from agentic instruction-following scenarios spanning 46 domains in the AgentIF dataset, augmented with privilege-annotated conflicting constraints via a multi-step LLM pipeline verified by humans. Each sample contains an average of 12.8 active and 6.6 suppressed (lower-privilege) constraints across 1–4 conflict groups with up to 7 privilege levels. Evaluation uses code checkers and LLM judges on individual constraints.

### Design Principles

- **Non-adversarial prompts:** Instruction conflicts are straightforward, isolating multi-tier resolution capability from robustness against attacks.
- **Granular, constraint-level evaluation:** Each constraint is verified independently by deterministic code checkers or LLM judges.
- **Controlled difficulty scaling:** The number of privilege tiers and conflicts can be varied independently from task difficulty.
- **Realistic agentic settings:** Tasks are grounded in real-world agentic scenarios across 46 agents.

### Evaluation Protocol

A model passes a sample if and only if **all active (winning) instructions** are satisfied, plus all unit tests for the Coding subset. This strict all-or-nothing criterion ensures that partial adherence to ManyIH—such as satisfying only non-conflicting instructions while ignoring privilege-based resolution—is not rewarded.