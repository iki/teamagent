# OpenDesign: heterogeneous agent workspace and media readiness

Source: [open-design](https://github.com/nexu-io/open-design) · Category: `ai-gen`

Review depth: **source-reviewed**. Snapshot `53231d40b778d88eba23f35547bf99485d3ae9fc`; assessed 2026-10-04. This is a focused static review of the listed files, not an audit of every code path or a reproduced benchmark. No repository code, model weights, paid endpoints, or installers were run.

## Observed architecture

The daemon registry assembles explicit adapters for many named agents and then appends local user profiles. Its code distinguishes the adapters shipped by a build from the set a particular machine can run, and rejects duplicate identifiers. This distinction directly addresses the user's requirement to detect and use installed agents: discovery is a machine-local capability result, while adapter support is a versioned product contract.

The media readiness helper checks provider integration, credential requirements, and stored configuration. It specifically rejects an OpenAI entry containing only certain agent OAuth source markers when no usable media API fields are present. That is evidence against assuming successful agent authentication unlocks every image/audio/video endpoint.

## Harness adoption

Borrow the registry pattern: ship known adapters, allow declarative local profiles, identify executable versions safely, and probe session/cancellation/tool capabilities before enabling a route. Keep executable presence, authenticated status, entitlement, and health as separate states. Unknown agents may be registered as opaque subprocess tools but should not be advertised as fully resumable native adapters.

For media, show ready/configuration-needed/unavailable states based on actual integration capabilities. Separate text-agent provider settings from image, audio, and video credentials even where the brand is shared. Retain native generated files and previews in a common artifact store.

## Limitations and decision

Use as a design reference rather than importing an entire application into the harness. This review did not exercise all runtime adapters, cloud services, billing, or collaboration behavior. Readiness checks show local product behavior and are not a definitive statement of current provider entitlements. The source's rapidly changing catalog requires versioned adapters and feature probes; do not hard-code a marketing list as permanent installed-agent detection.

## Evidence read

- [Shipped and local runtime registry](https://github.com/nexu-io/open-design/blob/53231d40b778d88eba23f35547bf99485d3ae9fc/apps/daemon/src/runtimes/registry.ts#L1-L91)
- [Media provider readiness checks](https://github.com/nexu-io/open-design/blob/53231d40b778d88eba23f35547bf99485d3ae9fc/apps/web/src/media/provider-readiness.ts#L1-L38)

## Related directions

[Agents](../agents.md) · [Models](../models.md) · [Skills](../skills.md) · [Generation](../generation.md) · [Channels](../channels.md)
