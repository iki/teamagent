# Android and iOS rules

[Architecture rules](README.md) · [Applications](applications.md) · [Channels](../channels.md)

Tauri 2 is selected for Android and iOS, sharing the Rust library entry point and
React/TypeScript frontend with desktop. Android System WebView and iOS WKWebView
host the interface. The shell does not ship a remote web server, Bun runtime or
Chromium. Local/offline views and drafts remain usable where supported; remote
agent work depends on an authenticated available host under the channel contract.

This preserves DOM/SVG, Effect schemas, workers and asset contracts. It also
requires explicit tests for WebView differences, gestures, safe areas, keyboard,
permissions, app lifecycle, file sharing and accessibility. Browser preview is
not native-device acceptance.

## Alternatives and migration boundaries

| Alternative                      | Reconsideration trigger and cost                                                                                                                                             |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Capacitor                        | Closest fallback if a required plugin/WebView integration blocks Tauri; reuses web UI but adds a distinct shell. Hosted build services are optional.                         |
| Expo + React Native              | Choose only for a deliberate native-widget UI; existing DOM/SVG/worker code is not a drop-in RN interface. WebView/DOM components retain a hybrid boundary. EAS is optional. |
| Flutter                          | Deliberate Dart/custom-rendered UI rewrite, with a port or explicit bridge for TypeScript logic.                                                                             |
| Kotlin Multiplatform + Compose   | Kotlin-centric native integration with a substantial UI/TypeScript migration.                                                                                                |
| SwiftUI + Kotlin/Jetpack Compose | Direct platform integration at the cost of two UIs and additional duplicated work.                                                                                           |
| .NET MAUI                        | A C#-centric choice with limited reuse of this frontend without a web hybrid.                                                                                                |

Preserve platform-neutral contracts, scenes, assets and fixtures if migrating.
Changing the framework does not remove Apple build/signing requirements. Check
framework/plugin licenses and terms when adopting them; preserve bundled asset,
font and icon redistribution notices.

## Native configuration

`app/mobile` will own initialization/development/preview/release adapters. All
JS/TS commands and IDE callbacks run the pinned Bun executable; Aube owns JS
installation. Rust dependencies have `Cargo.lock`; native CI builds use `--locked`
and a pinned Rust toolchain. Keep Android/iOS overrides separate from desktop
window constraints and merge them into the shared Tauri configuration.

Adopt Android 9/API 28 and iOS 17 as initial support-floor targets, subject to
compatibility validation before claiming support. Choose owned application
identifiers during implementation; desktop and mobile identity/storage must be
deliberate. Do not reuse a sample identifier or register a store listing without
confirming ownership.

Pin compile/target SDK, Android Build Tools, NDK, Gradle, Android Gradle Plugin,
Kotlin, Rust, Tauri, macOS runner and Xcode as one tested native-toolchain set.
Verify the Gradle distribution checksum and reject unexpected versions. Recheck
available SDKs and store submission requirements at release time; a setup-specific
SDK fallback is not a permanent repository requirement.

Android packaging must meet 16 KiB page-size compatibility where required: inspect
packaged ELF LOAD alignment and RELRO boundaries and verify APK ZIP alignment.
Do not assume selecting an NDK version establishes packaged-binary compatibility.
Keep generated native projects in ignored `src-tauri/gen/`; a repository-owned
overlay reapplies intended changes, and repeated initialization must be tested.
Permanent changes cannot live only inside generated files.

Bundle frontend/assets needed for offline features. Workers keep computation off
the UI thread. Use `viewport-fit=cover`, safe-area padding, keyboard-aware layouts
and explicit Android Back/history behavior. Start with restrictive CSP and empty
native IPC capabilities, then add only the features authorized by the product
contract. Device backup controls are not a promise of encrypted storage; secrets
belong in an explicit OS credential adapter, not ordinary local storage.

Apply the shared [interface and authentication requirements](applications.md)
to the WebView surface. Verify focus, text scaling, screen-reader navigation and
gesture alternatives on devices. Native authentication must use a documented
platform flow with validated redirects and preserved state/CSRF protection;
cookie or origin differences are adapter work, not grounds for a global bypass.

Native GPS, notifications, background sync, deep links, image saving/sharing and
over-the-air updates are separate features with permission/lifecycle tests. Do
not expose a browser download button as a supported native save/export feature
until a working platform integration exists. Package frontend and assets together
until an authenticated, versioned update design is explicitly adopted.

## Preview and build tasks

When implemented, provide `mobile:ui`, `mobile:web`, `tauri`, `android:init`,
`android:dev`, `android:build`, `android:preview`, `android:smoke`, `ios:init`,
`ios:dev`, `ios:build` and `ios:preview`. Native IDE callbacks must use the same
pinned Bun/Tauri path as terminal tasks, with no unpinned runtime or package shims.

Use browser preview on Windows/macOS/Linux for responsive layout and workers;
use Android emulator/USB devices for Android behavior. iOS Simulator builds need
a compatible Mac/Xcode. Unsigned Simulator apps, development-signed apps and
store-distribution builds are different artifacts. Browser-streamed previews
such as Appetize are optional, require suitable uploaded APK/Simulator artifacts
and use synthetic data. They do not turn a non-Mac host into a local iOS builder.
Check current service/store/CI prices before spending; no pricing is baked into
architecture decisions.

## CI and delivery

Separate preview and release workflows. Preview runs on relevant pull requests
or manual dispatch, uses pinned action commits/read-only repository permissions
and no signing secrets, and retains bounded-lifetime artifacts. Build Android
ARM64/x86_64 debug APKs and an unsigned ARM64 iOS Simulator bundle on their
appropriate hosts. Preserve Simulator bundles in an archive. Preview must not
upload to stores or third-party streaming providers automatically.

Release is manual, uses a protected `mobile-release` environment and an explicit
commit/ref, platform and increasing build number. Its upload switch defaults to
false so signed artifacts can be reviewed first. A selected upload targets a
draft Android internal-test release or iOS TestFlight; public store submission
and production promotion are separate explicit actions.

| Purpose           | Environment secrets when the feature is implemented                                                 |
| ----------------- | --------------------------------------------------------------------------------------------------- |
| Android signing   | `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD` |
| Play upload       | `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` scoped to the owned listing                                      |
| iOS signing       | `APPLE_DEVELOPMENT_TEAM`, `IOS_CERTIFICATE`, `IOS_CERTIFICATE_PASSWORD`, `IOS_MOBILE_PROVISION`     |
| TestFlight upload | `APP_STORE_CONNECT_ISSUER_ID`, `APP_STORE_CONNECT_KEY_ID`, `APP_STORE_CONNECT_PRIVATE_KEY`          |

Fail on incomplete credentials. Decode signing material only into runner temporary
storage, remove it after the job, disable credential-bearing build caches, and
never include credentials in artifacts or logs. Match certificates/profiles to
the team, application ID and export method. Keep root package, Cargo and Tauri
marketing versions synchronized. A validated monotonically increasing build
number maps to Android `versionCode` and iOS `CFBundleVersion`; store-side
uniqueness is not established by a local numeric validation.

## Required platform evidence

Check native setup repeatability, invalid release inputs/credentials and Bun-only
callbacks. Test offline cold launch, worker/WASM loading, validated persistence,
reconnect/replay, Android Back, iOS safe areas/keyboard, rotation, suspend/resume,
permissions, export limitations and accessibility. Use both minimum supported
versions and a current physical device before declaring platform support.

Record OS/WebView/toolchain versions, artifact hashes and the precise scope of
acceptance. A Windows WebKit test is not iOS WKWebView acceptance; Android
emulator results do not prove physical-device behavior; a compiled installer
does not prove signing, upgrades or store uploads. No mobile implementation or
platform acceptance is claimed by adopting this specification.
