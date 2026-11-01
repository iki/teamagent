# security.260727.hf-openai-agent-intrusion-technical-timeline.md

Generated structural extraction report. Text length and file hashes do not establish factual accuracy or complete extraction. Image fidelity, image text and document layout have not been visually reviewed. A multi-URL entry records only the explicitly listed posts/pages; it does not discover a complete thread.

## Source 1

[Original source](<https://huggingface.co/blog/agent-intrusion-technical-timeline>) (query parameters withheld from public reports).

Mode: **static**. Last remote attempt: 2026-10-27T17:26:12.068Z. Local validation: 2026-11-01T08:51:16.093Z. Import: **pinned**. Content validation: **usable-text**.

First captured: 2026-10-24T05:51:27.861Z. Source creation/publication date: 2026-07-27T00:00:00.728Z. Date evidence: publisher-jsonld (Article.datePublished). Filename dates and Last-Modified are not treated as creation dates.

Source revision: not supplied.

Original bytes: 733675. Extracted Markdown characters: 81911. Captured images: 62.

Memory source: `2d98cffd-9e13-4d63-9a73-a1ba8a4438bc`. Version: `2c0c67c0-7e2e-4b61-b3db-03bf4491d4ca`. Content SHA-256: `2c0158c45fdc1e6d012cc395e95aca180f27576c59a699d607dac5429fa7ef26`.

[Version evidence and assets](../../../.cache/text/exports/2d98cffd-9e13-4d63-9a73-a1ba8a4438bc/2c0c67c0-7e2e-4b61-b3db-03bf4491d4ca/manifest.json). Export manifests retain exact locators; treat the cache as private.

- Image count is measured&#59; visual fidelity and completeness are unverified&#46;
- Static snapshot checked locally&#59; no remote freshness check&#44; conversion or export rewrite was performed&#46;

Extracted heading sample (up to 20; source text, not an endorsed analysis):

- Anatomy of a Frontier Lab Agent Intrusion&#58; A Technical Timeline of the July 2026 Incident
- TL&#59;DR
- Initial access
- Stage 1&#58; from an OpenAI evaluation sandbox to a rooted launchpad
- Stage 2&#58; Penetrating Hugging Face infrastructure using two injection vectors into our dataset processor
- Vector 1&#58; HDF5 external raw storage file read
- the malicious dataset config &#40;README&#46;md&#41;&#58; each split is one &#46;h5 file&#44;
- and each &#46;h5 declares its raw data as living at a local path on the worker
- Vector 2&#58; Jinja2 template injection
- The kill chain
- Day&#45;by&#45;day
- Day 1 &#40;07&#45;09&#41;&#58; foothold and C2
- Day 2 &#40;07&#45;10&#41;&#58; self&#45;referential search
- Day 3 &#40;07&#45;11&#41;&#58; lateral movement begins
- probe in&#45;cluster API and the public EKS endpoint
- then commit gzipped blobs to a side branch as a dead&#45;drop
- &#45;&#62; internal RFC1918 addresses &#40;10&#46;x&#46;x&#46;x&#41;
- Day 4 &#40;07&#45;12&#41;&#58; using the stolen credentials
- Day 5 &#40;07&#45;13&#41;&#58; exfil&#44; persistence&#44; cleanup
- Three lateral&#45;movement techniques

