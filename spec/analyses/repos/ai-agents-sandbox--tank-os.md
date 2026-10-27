# tank-os: change evidence

Source: [tank-os](https://github.com/LobsterTrap/tank-os) · [Analysis](../../projects/ai-agents-sandbox--tank-os.md) · [agents](../../agents.md), [channels](../../channels.md)

Generated: 2026-10-27T18:19:07.717Z. Status: **changed**. Reviewed SHA: `4fc6acd775c4d782a581633cd4bd65af050aa871`; commit date: 2026-08-08T11:56:05-04:00; review date: unknown; observed SHA: `adc6532d2f064e67fd6ff0a6f15d2ddc92fbc77b`.

This generated packet is a bounded change locator, not a source review or a quality measurement. [Source comparison](https://github.com/LobsterTrap/tank-os/compare/4fc6acd775c4d782a581633cd4bd65af050aa871...adc6532d2f064e67fd6ff0a6f15d2ddc92fbc77b). Working-tree changes: false; shallow history: false; report changed since recorded review: false.

- Git discovery: unchanged; source lifecycle: active; upstream availability: available.

## Recent commits

- [adc6532d2f06](https://github.com/LobsterTrap/tank-os/commit/adc6532d2f064e67fd6ff0a6f15d2ddc92fbc77b) 2026-10-23T14:30:58-04:00: Merge pull request #60 from ericcurtin/add-llmman
- [9137e6a96d3f](https://github.com/LobsterTrap/tank-os/commit/9137e6a96d3f2175c2dda120b2158be7c897c27a) 2026-09-30T14:17:58+01:00: fix: pin llmman release and SHA-256
- [df6bdeaa4065](https://github.com/LobsterTrap/tank-os/commit/df6bdeaa406564b141fb98388a3a57eb4886cf1c) 2026-09-30T00:34:41+01:00: docs: pull, not transfer, stages the local store
- [c674a9cd5267](https://github.com/LobsterTrap/tank-os/commit/c674a9cd526747f98a2a777735ea1958ca898ddf) 2026-09-29T12:53:02+01:00: docs: harden llmman auth, TLS and air-gap guidance
- [7588ee7a0c57](https://github.com/LobsterTrap/tank-os/commit/7588ee7a0c578cb7f3a5840ee915d6a6737028fd) 2026-09-19T20:19:10+01:00: feat: add llmman as a boot-time systemd service

## Changed paths

- M: `README.md`
- M: `bootc/Containerfile`
- A: `bootc/rootfs/usr/lib/systemd/user/llmman.service`
- M: `docs/architecture-overview.md`
- A: `docs/llmman.md`
