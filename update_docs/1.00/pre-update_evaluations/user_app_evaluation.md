# User App Evaluation — Version 1.00

## Functionality
- App bootstrap chains multiple async providers (session, runtime health, feature flags, push notifications) inside the root widget build, so cold starts sit on a blank screen while each Future resolves serially.【F:gigvora-flutter-phoneapp/lib/main.dart†L30-L109】
- `SessionBootstrapResult` treats any refresh token failure as a generic expiry and clears tokens even if the backend is unreachable, forcing unnecessary logouts during transient outages.【F:gigvora-flutter-phoneapp/lib/features/auth/application/session_bootstrapper.dart†L42-L76】
- Membership headers are computed client-side from cached session data rather than server-issued claims, so feature access can drift from authoritative state until the next bootstrap.【F:gigvora-flutter-phoneapp/lib/core/providers.dart†L70-L90】
- `GigvoraApp` calls `ref.watch` on bootstrap providers purely for side effects, so every rebuild re-triggers heavy boot logic instead of letting it run once during app start.【F:gigvora-flutter-phoneapp/lib/main.dart†L54-L109】
- Analytics bootstrap unconditionally flushes the pending queue on every provider watch, erasing buffered events whenever hot reloads fires or a user reopens the app before telemetry syncs.【F:gigvora-flutter-phoneapp/lib/core/providers.dart†L29-L33】

## Usability
- The theme loader hardcodes the “blue” design system with no fallback or user preference, limiting branding flexibility and preventing accessibility-driven theme overrides.【F:gigvora-flutter-phoneapp/lib/main.dart†L18-L78】【F:gigvora-flutter-phoneapp/lib/core/providers.dart†L92-L105】
- Service locator providers throw by default (`sharedPreferencesProvider`), so any feature forgetting to supply overrides crashes with an opaque error instead of surfacing configuration guidance.【F:gigvora-flutter-phoneapp/lib/core/providers.dart†L21-L33】
- Session snackbars rely on queued `WidgetsBinding` callbacks, which stack up if multiple providers emit messages back-to-back and overwhelm the user with sequential toasts.【F:gigvora-flutter-phoneapp/lib/main.dart†L46-L109】
- Membership headers provider emits raw `X-Gigvora-*` strings with no localisation or role explanation, confusing end users who hit permission gates without understanding the required upgrade path.【F:gigvora-flutter-phoneapp/lib/core/providers.dart†L31-L75】
- Feature bootstrap providers are all `FutureProvider`s watched from the root widget, so any rebuild triggered by locale or theme changes restarts analytics, feature flag, and push notification onboarding without surfacing progress to the user.【F:gigvora-flutter-phoneapp/lib/main.dart†L58-L153】【F:gigvora-flutter-phoneapp/lib/core/providers.dart†L29-L50】

## Errors
- Theme bootstrap catches errors but simply logs them with `debugPrint`, delivering no in-app messaging or retry, so users see an empty scaffold on resource corruption.【F:gigvora-flutter-phoneapp/lib/main.dart†L30-L78】
- `AuthTokenStore` swallows cache read/write errors and returns `null`, hiding file-system issues and making authentication failures difficult to diagnose.【F:gigvora-flutter-phoneapp/lib/features/auth/domain/auth_token_store.dart†L19-L117】
- Offline cache access throws a `StateError` if `init()` was never called, but the application never awaits cache initialisation during startup, risking crashes when background isolates touch the cache early.【F:gigvora-flutter-phoneapp/packages/gigvora_foundation/lib/src/cache/offline_cache.dart†L21-L126】
- Session bootstrapper returns success even when runtime health calls fail and fall back to default snapshots, masking upstream outages until other features break noisily.【F:gigvora-flutter-phoneapp/lib/features/auth/application/session_bootstrapper.dart†L24-L61】
- `ServiceLocator.configure` is only called once during `main`, so hot restarts and widget tests that reinvoke the entrypoint crash with “instance already registered” errors unless engineers manually tear down singletons between runs.【F:gigvora-flutter-phoneapp/lib/main.dart†L17-L41】【F:gigvora-flutter-phoneapp/packages/gigvora_foundation/lib/src/di/service_locator.dart†L1-L160】

## Integration
- The session bootstrapper queries runtime health unauthenticated before reading cached tokens, doubling initial network calls and slowing down login experiences on slow connections.【F:gigvora-flutter-phoneapp/lib/features/auth/application/session_bootstrapper.dart†L25-L76】
- Push notification and analytics bootstraps fire in parallel but expose no readiness signal back to the UI, so features that depend on those services cannot present loading indicators or fallbacks.【F:gigvora-flutter-phoneapp/lib/main.dart†L46-L109】【F:gigvora-flutter-phoneapp/lib/core/providers.dart†L29-L55】
- Membership headers diverge from the web client’s `x-roles` format, increasing integration overhead for backend middleware expecting consistent header names.【F:gigvora-flutter-phoneapp/lib/core/providers.dart†L70-L90】【F:gigvora-frontend-reactjs/src/services/apiClient.js†L118-L145】
- Service locator wiring relies on globally registered singletons, so background isolates or feature modules cannot supply test doubles without mutating shared state, complicating integration with plugin ecosystems.【F:gigvora-flutter-phoneapp/lib/core/providers.dart†L8-L55】

## Security
- Tokens persist through the Hive-backed offline cache without encryption despite `flutter_secure_storage` being available, exposing credentials to rooted devices or malware with file-system access.【F:gigvora-flutter-phoneapp/lib/features/auth/domain/auth_token_store.dart†L19-L117】【F:gigvora-flutter-phoneapp/packages/gigvora_foundation/pubspec.yaml†L14-L29】
- Runtime health responses determine whether the UI warns users about maintenance, but the logic trusts unauthenticated snapshots and could be spoofed by network attackers to suppress outage messaging.【F:gigvora-flutter-phoneapp/lib/features/auth/application/session_bootstrapper.dart†L25-L76】
- Membership headers are derived from mutable client state with no signature, enabling tampering if backend endpoints infer access solely from those headers.【F:gigvora-flutter-phoneapp/lib/core/providers.dart†L70-L90】
- Analytics, feature flag, and push notification bootstraps all run without transport hardening or certificate pinning toggles, leaving high-value telemetry exposed to MITM during the most privileged initialisation path.【F:gigvora-flutter-phoneapp/lib/main.dart†L46-L109】
- Auth token storage relies on Hive TTL semantics without any device-level binding, so tokens copied from a rooted handset remain valid on another device until expiry and defeat revocation expectations.【F:gigvora-flutter-phoneapp/lib/features/auth/domain/auth_token_store.dart†L22-L117】

## Alignment
- The mobile app depends on analytics, feature flags, and push notifications at launch, but there is no configuration management or toggles to ship a pared-down MVP, misaligning with staged rollout strategies.【F:gigvora-flutter-phoneapp/lib/main.dart†L30-L109】【F:gigvora-flutter-phoneapp/lib/core/providers.dart†L29-L55】
- Offline cache usage conflicts with backend expectations for server-authoritative sessions, undercutting the security posture emphasised by the API evaluations.【F:gigvora-flutter-phoneapp/lib/features/auth/domain/auth_token_store.dart†L19-L117】【F:gigvora-backend-nodejs/src/middleware/errorHandler.js†L4-L28】
- The app surfaces maintenance warnings via snackbars but lacks integration with platform settings service events, suggesting product requirements for coordinated messaging have not been implemented.【F:gigvora-flutter-phoneapp/lib/main.dart†L46-L109】
- Provider scaffolding assumes every feature exists in the core bundle, contradicting roadmap hints at modular federation or optional experiences for different partners.【F:gigvora-flutter-phoneapp/lib/core/providers.dart†L8-L105】

## Full Scan Notes
- The shared design system path dependency drags the entire `gigvora_design_system` package into the binary even when white-label partners only need a subset, inflating install size and complicating license splits.【F:gigvora-flutter-phoneapp/pubspec.yaml†L6-L31】【F:gigvora-flutter-phoneapp/lib/main.dart†L1-L78】
- Riverpod providers default to production-ready singletons from the service locator, and there are no melos tasks to inject mocks, so automated smoke tests risk hitting live infrastructure by default.【F:gigvora-flutter-phoneapp/lib/core/providers.dart†L9-L105】【F:melos.yaml†L1-L22】
