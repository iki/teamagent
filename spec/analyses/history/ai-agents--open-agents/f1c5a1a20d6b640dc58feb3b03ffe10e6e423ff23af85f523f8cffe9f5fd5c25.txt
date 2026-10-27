# open-agents

Source: [open-agents](https://github.com/vercel-labs/open-agents) · Category: [ai-agents](../categories/ai-agents.md)

Review depth: **inventory / README screening only**. This is an individual coverage record, not a source-code correctness audit or adoption recommendation.

Snapshot: `cf865e94de7729751c747171785b6ce57e7b178c`; commit timestamp `2026-06-04T10:48:13+02:00`; 777 tracked paths.

## Scope and evidence

Upstream description excerpt (a project claim, automatically extracted from [README](https://github.com/vercel-labs/open-agents/blob/cf865e94de7729751c747171785b6ce57e7b178c/README.md)):

> [](https://vercel.com/new/clone?project-name=open-agents&repository-name=open-agents&repository-url=https%3A%2F%2Fgithub.com%2Fvercel-labs%2Fopen-agents&demo-title=Open+Agents&demo-description=Open-source+reference+app+for+building+and+running+background+coding+agents+on+Vercel.&demo-url=https%3A%2F%2Fopen-agents.dev%2F&env=POSTGRES_URL%2CBETTER_AUTH_SECRET%2CNEXT_PUBLIC_VERCEL_APP_CLIENT_ID%2CVERCEL_APP_CLIENT_SECRET%2CNEXT_PUBLIC_GITHUB_CLIENT_ID%2CGITHUB_CLIENT_SECRET%2CGITHUB_APP_ID%2CGITHUB_APP_PRIVATE_KEY%2CNEXT_PUBLIC_GITHUB_APP_SLUG%2CG

Build/package evidence: [apps/web/package.json](https://github.com/vercel-labs/open-agents/blob/cf865e94de7729751c747171785b6ce57e7b178c/apps/web/package.json); [package.json](https://github.com/vercel-labs/open-agents/blob/cf865e94de7729751c747171785b6ce57e7b178c/package.json); [packages/agent/package.json](https://github.com/vercel-labs/open-agents/blob/cf865e94de7729751c747171785b6ce57e7b178c/packages/agent/package.json); [packages/sandbox/package.json](https://github.com/vercel-labs/open-agents/blob/cf865e94de7729751c747171785b6ce57e7b178c/packages/sandbox/package.json); [packages/shared/package.json](https://github.com/vercel-labs/open-agents/blob/cf865e94de7729751c747171785b6ce57e7b178c/packages/shared/package.json)

License evidence: [LICENSE.md](https://github.com/vercel-labs/open-agents/blob/cf865e94de7729751c747171785b6ce57e7b178c/LICENSE.md) Classification hint: MIT. A root license does not establish rights for every bundled asset, model, or dependency.

## Harness assessment

This entry was catalogued under **ai-agents**. Its category places it in the candidate set for agents, models, channels; those associations are navigational and have not been individually validated as implemented capabilities. See [agents](../agents.md) · [models](../models.md) · [channels](../channels.md) for the source-reviewed alternatives and proposed integration boundaries.

**Disposition:** retain as a comparison candidate. Before adopting it, inspect the implementation entry point and its tests, verify the required protocol and deployment platform, and reproduce a task from the harness evaluation suite. Popularity, a README feature list, and the presence of a package manifest are insufficient evidence of quality or compatibility.

**Unresolved:** runtime behavior, security boundaries, performance, API/subscription eligibility, dependency health, maintenance status, and fit to the proposed harness were not independently established for this entry. No repository code was executed as part of this screening.
