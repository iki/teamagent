# json-render: application-owned generated component trees

Source: [json-render](https://github.com/vercel-labs/json-render) · Category: `ai-gen`

Review depth: **source-reviewed**. Snapshot `fc2a696a50a30cb30c878ab1eb65e102487eea0f`; assessed 2026-10-04. This is a focused static review of the listed files, not an audit of every code path or a reproduced benchmark. No repository code, model weights, paid endpoints, or installers were run.

## Observed architecture

The core structural validator checks for a root, missing root elements, empty specs, invalid child references, and misplaced or out-of-scope dynamic properties. Errors and warnings are distinguished, and orphan detection is optional because unreachable elements need not affect rendering. This makes malformed model output a recoverable data-validation problem rather than a reason to execute generated code blindly.

The README describes predefined component/action catalogs and renderers for web, native, video, document, and other output targets. This review checked the common validation path, not every renderer's feature completeness or security properties. Catalog constraints should be tested for each chosen renderer.

## Harness adoption

Use as a first-party generated-artifact layer when the product controls both schema and client implementation. A task might return a project comparison, memory inspector, or media storyboard as a validated spec. Retain an accessible text representation for Telegram, Slack, Discord, and clients without that renderer.

Store the spec, catalog version, source task, and action binding references as artifacts. Compile only necessary catalog documentation into model context; retrieve task-relevant components just as the skill system retrieves relevant skills. Allow a bounded repair attempt on validation failure and then fall back to a plain artifact view.

## Limitations and decision

Shortlist for a TypeScript/React product. Structural validity does not prove semantic correctness, safe URLs, appropriate actions, or readable layout. Server authorization must recheck every action independently of what the generated interface says. Renderer-specific testing is required before assuming the same spec behaves identically on all platforms. Adopt one protocol initially and revisit [A2UI](ai-gen--a2ui.md) when interoperability with external agent/client ecosystems becomes a requirement.

## Evidence read

- [Structural validation contract and error cases](https://github.com/vercel-labs/json-render/blob/fc2a696a50a30cb30c878ab1eb65e102487eea0f/packages/core/src/spec-validator.ts#L1-L125)
- [Component and renderer ecosystem](https://github.com/vercel-labs/json-render/blob/fc2a696a50a30cb30c878ab1eb65e102487eea0f/README.md#L1-L65)

## Related directions

[Generation](../generation.md) · [Channels](../channels.md) · [Skills](../skills.md) · [Security](../security.md)
