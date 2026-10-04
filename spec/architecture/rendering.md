# Portable rendering, themes and assets

[Architecture rules](README.md) · [Applications](applications.md)

When interactive diagrams, timelines or exportable visual artifacts are needed,
use a small framework-independent TypeScript scene model with SVG rendering.
Select D3 modules for scales, selection and gestures, and native/WASM resvg for
matching headless SVG/PNG output. Keep drawing geometry and asset contracts
independent of React, DOM nodes, native runtimes and renderer internals.

## Rendering and export choices

| Capability                     | Choice                                                                                                                    |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| Scales and browser interaction | `d3-scale`, `d3-selection`, `d3-zoom`; DOM/zoom behavior stays in the web adapter.                                        |
| Portable vector output         | Typed scene plus a DOM-free SVG serializer using the same paths/fonts/layout as interactive rendering.                    |
| Local SVG/PNG                  | `@resvg/resvg-js`, with a narrow host-only adapter.                                                                       |
| Browser/worker SVG/PNG         | `@resvg/resvg-wasm`, lazy initialization and explicit bounded WASM assets.                                                |
| Local JPEG/WebP/AVIF           | Sharp behind the local export adapter.                                                                                    |
| Browser JPEG/WebP              | OffscreenCanvas where supported, with an explicit unsupported-format failure.                                             |
| Browser AVIF                   | Single-thread `@jsquash/avif` WASM behind a documented adapter.                                                           |
| Density optimization           | Canvas2D first; PixiJS as an optional GPU renderer after profiling.                                                       |
| Future native Rust renderer    | Portable scene/schema/assets; Vello for dynamic vectors or resvg for static output are candidates requiring new adapters. |

Pin dependencies when the feature is implemented. Native resvg and WASM resvg
must use compatible paths/fonts/output contracts. Outline SVG export text where
self-contained fidelity is required and preserve accessible titles/descriptions.
True SVG export contains vectors; screenshots are not a vector export strategy.
Imports do not trigger hidden downloads; host applications provide explicit
WASM/font asset locations and codecs load on demand.

Do not require WebGPU for the first release. Profile culling, aggregation,
indexing, curve construction and text layout before changing renderers. Preserve
the complete underlying result/list even if visible geometry overlaps or is
culled; report deliberate aggregation clearly.

| Alternative                   | Appropriate reason to reconsider                                                                           |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Apache ECharts                | Built-in chart machinery reduces delivery work for standard analyses.                                      |
| AntV G                        | Several rendering backends are truly needed from the first release.                                        |
| PixiJS                        | Profiled GPU requirement; retain separate complete scene/vector export semantics.                          |
| React Native Skia / CanvasKit | A deliberate native-mobile graphics architecture; new runtime/export/accessibility contracts are required. |
| Fabric.js                     | Interactive object editing/selection/transformation becomes a core feature.                                |
| Konva                         | Canvas interactions justify maintaining a separate vector serializer.                                      |
| Vega                          | Declarative analytical reports fit better than bespoke product interactions.                               |
| visx                          | React-specific view helpers add value without becoming the portable scene contract.                        |

Do not infer complete-scene SVG support from a graphics-path conversion API.
Select and exercise released versions before relying on fallback renderers.

## Scene and theme boundary

Use typed groups/transforms, paths, lines, circles, text, clips and a restricted
gradient set. Carry semantic IDs and accessible descriptions that map visuals to
domain records. Numeric path commands/styles are serializable; interactive
callbacks belong outside the scene. Portable layout cannot read the DOM,
filesystem, native addons or framework state.

Separate visual data acquisition/indexing, pure layout/serialization, browser
interaction, portable raster output and local/native export adapters. Decode
themes, export requests and worker messages at their boundaries. Bound derived
caches and export dimensions/memory; logging records counts/timings rather than
private input content.

Use versioned theme manifests with bounded colors/fonts and authored/licensed
path-only SVG icons. A theme name is a slug, never a filesystem path. Local
readers enforce containment; remote readers reject URL credentials, unexpected
redirects and oversized responses. Browser hosts receive an explicit HTTP asset
base and never execute trusted TypeScript configuration.

Treat the accepted icon subset as a strict grammar, not a general SVG sanitizer.
Reject scripts, event handlers, external images/fonts/links, arbitrary attributes
and remote references. Validate finite coordinates, path/file counts, text and
byte-size limits. Missing required icons or incompatible manifest versions fail
explicitly. Preserve redistribution licenses with bundled fonts/icons; use text,
shape and labels in addition to color.

Reserve media dimensions to avoid layout shifts and lazy-load offscreen assets;
preload only resources shown to be critical to usable state. Keep accessible
descriptions and an equivalent navigable text/table view when a canvas or scene
cannot expose its records directly. Gestures need keyboard and simple pointer
alternatives. Honor reduced-motion preferences in the interactive renderer;
animation must not alter the portable scene's complete result or export semantics.

## Data codecs and verified transport

For compressed offline asset sets, use a shared pinned `zstddec` WASM adapter
across local and browser workers. Keep frame limits, declared decoded size and
hash verification around the decoder; do not rely solely on whether it throws.
If upstream package types are broken, document a narrow declaration matching the
pinned public API. A custom boundary guard prevents bypassing the shared codec.

Host generation may use Bun's `node:zlib` Zstd implementation behind its adapter;
record its actual runtime and compression parameters in provenance. Compression
level/window settings belong to a versioned data-format decision and resource
budget, not an unmeasured assumption for every artifact. XZ/fzstd/native benchmark
decoders remain development-only unless a specific production requirement is
approved and verified. For Workers, import compiled WASM through the platform
adapter while preserving decoded-size/hash checks.

Use bounded local/HTTP asset readers with path, byte-size, hash, version and
coverage validation before domain consumption. Explicitly allow only the Tauri
local origin/protocol actually required on each platform; do not generalize a
desktop exception into arbitrary custom-protocol or remote-host access.

## Verification

Test pure scene/serialization invariants, malformed theme/codec inputs and export
resource bounds. Browser integration verifies interaction, focus/keyboard,
worker cancellation and every advertised image format. Compare native/WASM
rendering and self-contained exports using shared fonts/fixtures. Chromium checks
do not establish system-WebView or mobile file-save behavior. Native/Rust/React
Native adaptations can reuse contracts and assets, but DOM interactions and
TypeScript algorithms are not automatically ported by selecting another renderer.
