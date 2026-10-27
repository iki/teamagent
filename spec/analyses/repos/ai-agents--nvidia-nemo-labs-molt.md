# nvidia-nemo-labs-molt: change evidence

Source: [nvidia-nemo-labs-molt](https://github.com/NVIDIA-NeMo/labs-molt) · [Analysis](../../projects/ai-agents--nvidia-nemo-labs-molt.md) · [agents](../../agents.md), [models](../../models.md), [channels](../../channels.md)

Generated: 2026-10-27T18:19:07.717Z. Status: **changed**. Reviewed SHA: `e77c84672ccb295d1a2ef7d56dd7a54c48533581`; commit date: 2026-10-03T05:36:56+08:00; review date: unknown; observed SHA: `726f16fcc5080540430574377090a80d7df5eda0`.

This generated packet is a bounded change locator, not a source review or a quality measurement. [Source comparison](https://github.com/NVIDIA-NeMo/labs-molt/compare/e77c84672ccb295d1a2ef7d56dd7a54c48533581...726f16fcc5080540430574377090a80d7df5eda0). Working-tree changes: false; shallow history: false; report changed since recorded review: false.

- Git discovery: unchanged; source lifecycle: active; upstream availability: available.

## Recent commits (truncated)

- [726f16fcc508](https://github.com/NVIDIA-NeMo/labs-molt/commit/726f16fcc5080540430574377090a80d7df5eda0) 2026-10-24T10:23:37+08:00: chore(agents): one skill tree under .agents/, mirrored into .claude/ and .codex/; CLAUDE.md -> AGENTS.md (#241)
- [9be43f86e5ac](https://github.com/NVIDIA-NeMo/labs-molt/commit/9be43f86e5ac73e7f54d43b60a1bd34060667164) 2026-10-23T10:45:36+08:00: fix(kl): the rollout KL reference only acts when a KL coefficient is set (#239)
- [c5581591457e](https://github.com/NVIDIA-NeMo/labs-molt/commit/c5581591457ef498c4726d6cc7aaacfc39bc09b2) 2026-10-23T10:34:40+08:00: feat(kl): --algo.kl.ref rollout — KL to the rollout policy from vLLM's log-probs, no reference model (#238)
- [841300a74805](https://github.com/NVIDIA-NeMo/labs-molt/commit/841300a748056209663b0489a08d5e72705cd316) 2026-10-23T07:06:45+08:00: fix(tools): tolerate invalid bytes in Python output (#236)
- [76b3bc97ba2b](https://github.com/NVIDIA-NeMo/labs-molt/commit/76b3bc97ba2b7dca21b20cafd109cc2bc46955ee) 2026-10-23T07:06:42+08:00: fix(chat): keep every message a turn appends after the reply (#237)
- [9c009636b561](https://github.com/NVIDIA-NeMo/labs-molt/commit/9c009636b56141e491a203488be433fa62be0f2a) 2026-10-22T11:54:55+08:00: docs(skill): train-inference-consistency: GPU architecture in the closure, the sm_103 router kernel fact, multi-turn lag and IS-overflow symptoms, the multimodal compared path (#235)
- [725598ee595b](https://github.com/NVIDIA-NeMo/labs-molt/commit/725598ee595b1eb9fe09ec14e6956dd164dbf08c) 2026-10-19T21:25:09+08:00: docs(skill): train-inference-consistency follows main on rollout logprobs, the refit bracket and R3 prefix caching (#234)
- [4ea31de6e5e0](https://github.com/NVIDIA-NeMo/labs-molt/commit/4ea31de6e5e01cdfb20e42d879964e21d3bdd6f5) 2026-10-19T21:24:51+08:00: docs(skill): train-inference-consistency: a 20 % rollout performance budget, and facts that follow main (#233)
- [d750f2acc95a](https://github.com/NVIDIA-NeMo/labs-molt/commit/d750f2acc95aa37aa743e446b6e1482a9406fd70) 2026-10-19T07:31:02+08:00: dockerfile: cutlass-dsl 4.8.0, quack-kernels 0.6.5 and tilelang 0.1.12, the versions vLLM 0.32 pins (#232)
- [fde09d40b9e3](https://github.com/NVIDIA-NeMo/labs-molt/commit/fde09d40b9e3dfffa667d848fc1d5380bf672c7c) 2026-10-19T03:09:42+08:00: deps: vLLM 0.32.0, AutoModel main ea233c99 (#230)
- [a8728d097492](https://github.com/NVIDIA-NeMo/labs-molt/commit/a8728d0974926c32c05f4788d1aceeec57759db6) 2026-10-19T02:57:05+08:00: Update version.txt
- [9ba953a12f38](https://github.com/NVIDIA-NeMo/labs-molt/commit/9ba953a12f383ecb64de98ab80e405b988e3ba0e) 2026-10-18T14:06:20+08:00: test(lineage): read object-store usage from Ray's public resource accounting (#227)
- [baf42de446ae](https://github.com/NVIDIA-NeMo/labs-molt/commit/baf42de446ae07a7e5b215387448257a0dd279de) 2026-10-18T11:27:14+08:00: Chore/simplicity cleanup (#226)
- [eeae66080f96](https://github.com/NVIDIA-NeMo/labs-molt/commit/eeae66080f96772786ecffd328eab7f3d847d9f9) 2026-10-18T11:19:59+08:00: fix(chat): a chat request cannot change the rollout's temperature or top_p (#224)
- [064d07760857](https://github.com/NVIDIA-NeMo/labs-molt/commit/064d0776085724adcc6dddc854579f81c08ccf42) 2026-10-18T11:18:57+08:00: Test/refit layout check teacher forced (#223)
- [47b99125f0b4](https://github.com/NVIDIA-NeMo/labs-molt/commit/47b99125f0b4818cc4c12a5d5fd77ce26d4bdd0d) 2026-10-18T10:30:06+08:00: test(refit): keep the engine RPC on the main thread in the layout check (#222)
- [14563cf62cc4](https://github.com/NVIDIA-NeMo/labs-molt/commit/14563cf62cc45dc154b33ce04aa10748dab0cdcb) 2026-10-18T10:29:20+08:00: dockerfile: DeepEP at AutoModel's commit 10d4dd73 with AutoModel's patch (#221)
- [4f5f03b736f7](https://github.com/NVIDIA-NeMo/labs-molt/commit/4f5f03b736f712e442ceac982bb237564fbd6cfd) 2026-10-18T10:11:55+08:00: fix(r3): routing replay turns on vLLM prefix caching (#220)
- [202e4941bf89](https://github.com/NVIDIA-NeMo/labs-molt/commit/202e4941bf89a44485f4cd2c747c3762a70ae68c) 2026-10-18T10:02:24+08:00: fix(refit): run vLLM's post-load weight processing after every broadcast (#217)
- [8d6494c75393](https://github.com/NVIDIA-NeMo/labs-molt/commit/8d6494c75393415e103ebdbf3f2d5383c433b23e) 2026-10-18T09:39:02+08:00: dockerfile: install nvidia-cudnn-frontend before building TE 2.19 (#219)
- [ca4ff0b93de0](https://github.com/NVIDIA-NeMo/labs-molt/commit/ca4ff0b93de09d111f9db243c35eebda9802ac8c) 2026-10-18T09:29:59+08:00: dockerfile: keep torch's cu13 runtime headers out of the TE build's CPATH (#218)
- [12ed898152e3](https://github.com/NVIDIA-NeMo/labs-molt/commit/12ed898152e35fb4e49518f7727a61ba1ac7705c) 2026-10-18T08:47:54+08:00: deps: AutoModel main b9377eee, TransformerEngine v2.19.0 with AutoModel's build flags, ray 2.59.0 (#216)
- [259163f2e91a](https://github.com/NVIDIA-NeMo/labs-molt/commit/259163f2e91a198249f9686df374a309a2a47e91) 2026-10-16T16:14:40+08:00: fix(rollout): do not retry the group join, so consumed heavy tensors are freed (#215)
- [bce2946e333c](https://github.com/NVIDIA-NeMo/labs-molt/commit/bce2946e333ccad9051e8f25c2b8624b8bb692a0) 2026-10-16T10:35:40+08:00: docs(skill): editorial pass — routes by task, one meaning per term, fillable report template, acceptance recipe as deltas (#214)
- [2a163739c047](https://github.com/NVIDIA-NeMo/labs-molt/commit/2a163739c047f307ff7d88c38cbabb9b5607a02a) 2026-10-16T07:55:01+08:00: docs(skill): train-inference-consistency at parity with the vLLM skill (C0-C10), molt-adapted (#213)
- [9b42d977f249](https://github.com/NVIDIA-NeMo/labs-molt/commit/9b42d977f24908afb609695d69d9422404c5afc3) 2026-10-16T07:25:44+08:00: fix(rl): materialize rollout dumps so --train.rollout_replay_dir works across jobs (#212)
- [430342845765](https://github.com/NVIDIA-NeMo/labs-molt/commit/43034284576522fc943d92ba96d6d560ebf653fd) 2026-10-15T20:50:14+08:00: docs: present the consistency skill as Molt's own, inspired by the vLLM post (#211)
- [6a8ad87f2726](https://github.com/NVIDIA-NeMo/labs-molt/commit/6a8ad87f27261603954a8f6190a604a168c45171) 2026-10-15T20:35:04+08:00: docs: add the train-inference-consistency skill (bitwise rollout vs. … (#209)
- [28ac05b63425](https://github.com/NVIDIA-NeMo/labs-molt/commit/28ac05b63425acc9c8bfe196fa1c4c5d64ffd278) 2026-10-15T18:43:26+08:00: chore: bump version to 0.2.0 (#210)
- [f2e549ff7aa0](https://github.com/NVIDIA-NeMo/labs-molt/commit/f2e549ff7aa01abc99dce580878739df8bc22d38) 2026-10-15T16:45:06+08:00: docs: shorter score-centering note; FlashREINFORCE is drift-free by construction (#208)
- [fe7fc5497447](https://github.com/NVIDIA-NeMo/labs-molt/commit/fe7fc5497447f38c83d231163bf90d2bab6d0063) 2026-10-15T16:36:16+08:00: feat(rl): score centering — off-policy REINFORCE without an importance ratio (#182)
- [11f538f397d2](https://github.com/NVIDIA-NeMo/labs-molt/commit/11f538f397d22aba15e26fad98cfad9088a9f4db) 2026-10-15T10:08:54+08:00: fix(ci): name the release build's runners instead of following the test path's (#207)

## Changed paths

- A: `.agents/skills/pr-review/SKILL.md`
- R100: `.agents/skills/simplicity-first/SKILL.md` (from `.claude/skills/simplicity-first/SKILL.md`)
- A: `.agents/skills/train-inference-consistency/SKILL.md`
- A: `.agents/skills/train-inference-consistency/acceptance.md`
- A: `.agents/skills/train-inference-consistency/contracts.md`
- A: `.agents/skills/train-inference-consistency/debugging.md`
- A: `.agents/skills/train-inference-consistency/evidence.md`
- A: `.agents/skills/train-inference-consistency/molt-integration.md`
- A: `.agents/skills/train-inference-consistency/training-side.md`
- A: `.agents/skills/train-inference-consistency/workflow.md`
- A: `.claude/skills`
- A: `.codex/skills`
- M: `.github/workflows/claude-review.yml`
- M: `.github/workflows/release-image.yml`
- M: `.gitignore`
- M: `AGENTS.md`
- T: `CLAUDE.md`
- M: `README.md`
- M: `dockerfile/Dockerfile`
- M: `dockerfile/deepep.patch`
- M: `examples/python/agents/geo3k.py`
- M: `examples/python/tools/python_executor.py`
- M: `molt/agents/_chat_server.py`
- M: `molt/agents/base.py`
- M: `molt/cli/train_rl_ray.py`
- M: `molt/models/actor.py`
- M: `molt/models/loss.py`
- A: `molt/models/score_centering.py`
- M: `molt/models/utils.py`
- M: `molt/trainer/algorithm/experience.py`
- M: `molt/trainer/rl_trainer.py`
- M: `molt/trainer/rollout/experience_maker.py`
- M: `molt/trainer/rollout/router.py`
- M: `molt/trainer/rollout/samples_generator.py`
- M: `molt/trainer/vllm/vllm_engine.py`
- M: `molt/trainer/vllm/vllm_worker_wrap.py`
- M: `molt/trainer/workers/policy_actor.py`
- M: `requirements.txt`
- M: `setup.py`
- A: `tests/e2e/check_vllm_refit_layout.py`
- M: `tests/unit/test_chat_server.py`
- M: `tests/unit/test_cp_thd_packing.py`
- M: `tests/unit/test_experience.py`
- A: `tests/unit/test_gather_group_lineage.py`
- M: `tests/unit/test_geo3k_agent.py`
- A: `tests/unit/test_length_penalty.py`
- M: `tests/unit/test_log_probs_from_logits.py`
- A: `tests/unit/test_mismatch_metrics.py`
- M: `tests/unit/test_policy_loss.py`
- M: `tests/unit/test_python_executor.py`
- A: `tests/unit/test_refit_layerwise_reload.py`
- M: `tests/unit/test_router.py`
- M: `tests/unit/test_samples_generator.py`
- A: `tests/unit/test_score_centering.py`
- M: `version.txt`
