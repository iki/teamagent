# pentagi

Source: [pentagi](https://github.com/vxcontrol/pentagi) · Category: [ai-agents](../categories/ai-agents.md)

Original review depth: **inventory / README screening only**. The dated update review below has its own explicit scope. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `55a063ecb307e8786cb8b068655e1d80e96cad7b`; commit timestamp `2026-10-03T00:15:29+03:00`; 1,728 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/vxcontrol/pentagi/blob/55a063ecb307e8786cb8b068655e1d80e96cad7b/README.md)):

> Join the Community!** Connect with security researchers, AI enthusiasts, and fellow ethical hackers. Get support, share insights, and stay updated with the latest PentAGI developments. [](https://discord.gg/2xrMh7qX6m)⠀[](https://t.me/+Ka9i6CNwe71hMWQy)

Build/package evidence: [backend/go.mod](https://github.com/vxcontrol/pentagi/blob/55a063ecb307e8786cb8b068655e1d80e96cad7b/backend/go.mod); [frontend/package.json](https://github.com/vxcontrol/pentagi/blob/55a063ecb307e8786cb8b068655e1d80e96cad7b/frontend/package.json)

License evidence: [LICENSE](https://github.com/vxcontrol/pentagi/blob/55a063ecb307e8786cb8b068655e1d80e96cad7b/LICENSE) Classification hint: MIT. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents**. Its category places it in the candidate set for agents, models, channels; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [models](../models.md) · [channels](../channels.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.

## 2026-10-28 scoped update review

Reviewed commit `cffed9485aa1cca70762cd08a57ac62a80406258` (commit date `2026-10-23T06:20:46+07:00`). The original snapshot above remains historical evidence.

**Scope:** Complete 37-path inventory; selected installer/provider diffs and current prompt/template validation bodies. Frontend Markdown behavior, all installer helper changes and live providers were not audited.

The material inspected installer change makes [extracted-stack detection](https://github.com/vxcontrol/pentagi/blob/cffed9485aa1cca70762cd08a57ac62a80406258/backend/cmd/installer/checker/checker.go#L420-L431) resolve the custom/Ollama examples relative to the selected environment file. This avoids treating a valid installation as missing merely because the caller uses another working directory. The same condition intentionally excludes a newly introduced Bedrock example, because forced extraction could overwrite existing operator edits. Teamagent's passive discovery should likewise identify a configured resource separately from deciding to repair or replace it.

The selected prompter/template diffs only clarify comments; the underlying [prompt loading](https://github.com/vxcontrol/pentagi/blob/cffed9485aa1cca70762cd08a57ac62a80406258/backend/pkg/controller/prompter.go#L19-L61) still fails explicitly on database/default loading errors, revalidates persisted overrides against current variables, and warns before using a default for an invalid override. [Template field validation](https://github.com/vxcontrol/pentagi/blob/cffed9485aa1cca70762cd08a57ac62a80406258/backend/pkg/graph/context.go#L227-L250) trims titles while preserving document-body whitespace and bounds Unicode character counts. These are current-source observations, not newly added algorithms in this interval.

The provider fixture change now compares the shipped Bedrock example to the configuration returned through the public default loader; another expands the filename prefix used to include shipped Bedrock configs. Neither fixture proves account access or model behavior. **Disposition:** retain as an operational configuration/reference candidate; do not infer broad agent improvements or installation safety from this scoped maintenance review.

**Verification limit:** source inspection only; no upstream tests or provider calls were executed. This scoped review does not certify every file in the repository.

<!-- teamagent-analysis:start -->
Analysis metadata: source [pentagi](https://github.com/vxcontrol/pentagi); analyzed commit `cffed9485aa1cca70762cd08a57ac62a80406258`; commit date 2026-10-23T06:20:46+07:00; review date 2026-10-28T08:26:04.502Z; depth screened. [Maintenance record](../analyses/repos/ai-agents--pentagi.md).
<!-- teamagent-analysis:end -->
