# HyperFrames: deterministic composition-to-video rendering

Source: [hyperframes](https://github.com/heygen-com/hyperframes) · Category: `ai-gen`

Review depth: **source-reviewed**. Snapshot `6149ec87e8e1e83e0df4862dfd8512331535eddb`; assessed 2026-10-04. This is a focused static review of the listed files, not an audit of every code path or a reproduced benchmark. No repository code, model weights, paid endpoints, or installers were run.

## Observed architecture

HyperFrames positions HTML/CSS/media plus seekable animation as a video composition. The inspected server route tracks render jobs, resolves a project, validates a composition path inside that project, accepts selected output formats, parses frame rates, and forwards work to a rendering adapter. It supports rational frame-rate representations rather than ambiguously treating decimal 29.97 as exactly 30000/1001.

The route defaults invalid or absent format/quality/frame-rate options but rejects malformed variable payloads whose loss would silently discard user intent. This is a useful contract distinction: forgiving presentation defaults can coexist with strict integrity checks on meaningful inputs.

## Harness adoption

Use for explainers, animated diagrams, product videos, and data-driven motion graphics where editable composition and reproducibility matter. Store HTML, assets, fonts, timeline, renderer version, rational FPS, output size, and render parameters as one immutable artifact bundle. Preview and validate before expensive final rendering; cache by content hash.

Run browser/render subprocesses in isolated workers with bounded CPU, memory, duration, and network access. The harness should own durable job status, progress, cancellation, and artifact promotion. A local in-memory job map is not a substitute for the distributed job ledger.

## Limitations and decision

Adopt as a generation tool, not as a general cinematic video model or the primary app UI renderer. Deterministic rendering depends on stable assets, fonts, timing, browser, and native media dependencies; the project description is not proof of bit-identical output on all hosts. Generated HTML and imported media remain untrusted inputs. The on-demand skill approach is relevant to [skills](../skills.md), but external skill updates must enter the harness's review and evaluation pipeline before activation.

## Evidence read

- [Render API state, options, and path confinement](https://github.com/heygen-com/hyperframes/blob/6149ec87e8e1e83e0df4862dfd8512331535eddb/packages/studio-server/src/routes/render.ts#L22-L149)
- [Agent production workflow and skills](https://github.com/heygen-com/hyperframes/blob/6149ec87e8e1e83e0df4862dfd8512331535eddb/README.md#L29-L63)

## Related directions

[Generation](../generation.md) · [Skills](../skills.md) · [Agents](../agents.md) · [Security](../security.md)
