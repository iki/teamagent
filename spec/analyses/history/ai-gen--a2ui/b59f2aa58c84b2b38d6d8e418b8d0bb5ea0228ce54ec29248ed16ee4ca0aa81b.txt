# A2UI: declarative cross-client artifact UI

Source: [a2ui](https://github.com/google/A2UI) · Category: `ai-gen`

Review depth: **source-reviewed**. Snapshot `1444719acd8833eeb5e70529c7ac47bc50b7390c`; assessed 2026-10-04. This is a focused static review of the listed files, not an audit of every code path or a reproduced benchmark. No repository code, model weights, paid endpoints, or installers were run.

## Observed architecture

A2UI represents user interfaces as declarative component/data updates mapped to client-owned renderers. The inspected TypeScript validator scopes each payload to one catalog, checks identifiers and component schemas, and validates nested functions. Exceptions are used by the surrounding processor to trigger rollback of a partially applied update, according to the file's contract.

One material implementation detail contradicts a simplistic assumption that declarative output is automatically safe: when validation configuration is absent, unknown components/functions are tolerated. With a configuration present, unknown elements default to disallowed. A harness must opt into a strict validation policy rather than relying solely on the README's security framing.

## Harness adoption

Use for structured task status, approval cards, forms, search result inspectors, and generated artifacts shared across web and native clients. Keep the everyday navigation and task controls deterministic application UI. Bind generated actions to server-issued capability tokens and authenticated task state; a visual button must never grant a new permission.

Pin protocol and catalog versions in the task event stream. Validate schema, reference integrity, component count, nesting, URL destinations, action identifiers, and update size before a client renders. Reject or quarantine invalid updates and preserve the last valid view.

## Limitations and decision

Shortlist where cross-client interoperability matters. The repository states that protocol versions are evolving; use the reviewed snapshot and negotiate versions explicitly. A trusted component may itself load URLs or invoke sensitive actions, so component safety and data validation are separate obligations. No client performance or accessibility claims were measured. Compare [json-render](ai-gen--json-render.md) for application-owned React-centric catalogs; avoid supporting two full protocols in the first release without a concrete interoperability requirement.

## Evidence read

- [Catalog-scoped validator and default strictness](https://github.com/google/A2UI/blob/1444719acd8833eeb5e70529c7ac47bc50b7390c/typescript/web_core/src/validation/payload-validator.ts#L31-L130)
- [Protocol positioning and component catalogs](https://github.com/google/A2UI/blob/1444719acd8833eeb5e70529c7ac47bc50b7390c/README.md#L1-L65)

## Related directions

[Generation](../generation.md) · [Channels](../channels.md) · [Security](../security.md)
