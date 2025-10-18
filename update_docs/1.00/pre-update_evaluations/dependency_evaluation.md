# Dependency Evaluation — Version 1.00

## Functionality
- The web client lists `date-fns` twice with incompatible major versions (`^2.30.0` and `^4.1.0`), letting npm arbitrarily resolve the latter and breaking utilities that still rely on the v2 API surface.【F:gigvora-frontend-reactjs/package.json†L17-L33】
- Backend services lean on `node-fetch` shims despite running under Node 18+, duplicating native `fetch` functionality and increasing bundle size for every service touching remote APIs.【F:gigvora-backend-nodejs/package.json†L16-L44】【F:gigvora-backend-nodejs/src/services/weatherService.js†L1-L351】
- Flutter packages mix GraphQL, REST, and Hive caches without feature-flagged modularisation, producing bloated install sizes for users who only need a subset of capabilities.【F:gigvora-flutter-phoneapp/pubspec.yaml†L6-L31】【F:gigvora-flutter-phoneapp/packages/gigvora_foundation/pubspec.yaml†L6-L29】
- Mobile builds depend on in-repo design system packages via relative paths, so distributing the app or open-sourcing submodules requires cloning the entire monorepo rather than consuming published versions.【F:gigvora-flutter-phoneapp/pubspec.yaml†L6-L31】
- The runtime dependency guard watches both `DISABLE_RUNTIME_DEPENDENCY_GUARD` and `DISABLE_DEPENDENCY_GUARD`, creating two overlapping feature flags that disable different branches of the same evaluator and leaving operators unsure which toggle governs production behaviour.【F:gigvora-backend-nodejs/src/services/runtimeDependencyGuard.js†L160-L205】

## Usability
- The backend and frontend both pin dependencies with the `^` modifier but check in `package-lock.json`, creating confusing upgrade semantics where developers update versions in lockfiles without touching manifests.【F:gigvora-backend-nodejs/package.json†L7-L44】【F:gigvora-frontend-reactjs/package.json†L6-L33】
- Mobile foundation packages require Hive initialisation before use, yet no dependency injection guard enforces `OfflineCache.init()` at app start, causing runtime `StateError` if packages are consumed by third-party modules.【F:gigvora-flutter-phoneapp/packages/gigvora_foundation/lib/src/cache/offline_cache.dart†L21-L126】
- The React app pulls in heavy SDKs like `mapbox-gl` and `agora-rtc-sdk-ng` globally rather than dynamically, ballooning initial download size and developer install times.【F:gigvora-frontend-reactjs/package.json†L17-L33】
- Backend dependencies still include `morgan` even though Express logging has been migrated to `pino-http`, creating duplicate logging stacks that confuse onboarding engineers about the canonical instrumentation layer.【F:gigvora-backend-nodejs/package.json†L16-L44】【F:gigvora-backend-nodejs/src/app.js†L18-L83】

## Errors
- Duplicate `date-fns` declarations confuse bundlers and can surface as build-time aliasing errors when tree shaking resolves modules to conflicting paths.【F:gigvora-frontend-reactjs/package.json†L17-L33】
- Backend optional dependencies (e.g., `node-fetch` imported lazily in `aiAutoReplyService`) lack `try/catch` safeguards, so missing modules explode at runtime instead of guiding operators to install peer packages.【F:gigvora-backend-nodejs/src/services/aiAutoReplyService.js†L163-L188】
- Flutter packages expose broad version ranges (`^`) without locked `pubspec.lock` files in the repo, so reproducible builds cannot be guaranteed across CI and developer machines.【F:gigvora-flutter-phoneapp/pubspec.yaml†L6-L31】
- The design system path dependency means `pub get` fails with opaque path-resolution errors whenever the monorepo is checked out without the private UI package, generating noisy build failures instead of graceful fallbacks.【F:gigvora-flutter-phoneapp/pubspec.yaml†L6-L29】
- Backend dependency scripts still import `fs-extra` even though the runtime is pure ESM, forcing jest and toolchains to shim CommonJS modules and increasing the chance of `ERR_REQUIRE_ESM` failures when the dependency drops CJS support.【F:gigvora-backend-nodejs/package.json†L16-L44】【F:gigvora-backend-nodejs/scripts/syncDomainSchemas.js†L1-L40】

## Integration
- Version skew between backend `mysql2` drivers and the mobile app’s offline caching stack complicates shared schema evolution—migrations expect MySQL enums while mobile caches operate on Hive key/value stores without schema syncing.【F:gigvora-backend-nodejs/package.json†L16-L44】【F:gigvora-flutter-phoneapp/packages/gigvora_foundation/lib/src/cache/offline_cache.dart†L21-L126】
- The React client bundles `axios` but the central API client still uses `fetch`, leading to inconsistent HTTP stacks across services and higher maintenance overhead when integrating interceptors.【F:gigvora-frontend-reactjs/package.json†L17-L33】【F:gigvora-frontend-reactjs/src/services/apiClient.js†L1-L330】
- Backend scripts for schema sync rely on `zod-to-json-schema` clients that are not mirrored in the frontend, so generated contracts risk drifting from the React app’s expectations.【F:gigvora-backend-nodejs/package.json†L16-L44】
- Membership headers diverge across clients: the web app emits `x-roles`/`x-user-id` while the mobile foundation pushes `X-Gigvora-Memberships`, complicating middleware that tries to infer identity from shared dependency contracts.【F:gigvora-frontend-reactjs/src/services/apiClient.js†L85-L145】【F:gigvora-flutter-phoneapp/lib/core/providers.dart†L31-L72】

## Security
- Storing web auth tokens in `localStorage` introduces XSS theft risk; yet no dependency such as `@tanstack/react-query` or `@reduxjs/toolkit` enforces memory-only sessions, signalling a dependency gap for secure session handling.【F:gigvora-frontend-reactjs/src/services/apiClient.js†L18-L288】
- Hive-backed caches in the mobile foundation library lack built-in encryption despite the availability of `flutter_secure_storage` in the same dependency graph, leaving secrets readable on rooted devices.【F:gigvora-flutter-phoneapp/packages/gigvora_foundation/lib/src/cache/offline_cache.dart†L21-L126】【F:gigvora-flutter-phoneapp/packages/gigvora_foundation/pubspec.yaml†L14-L29】
- Backend dependencies include high-risk integrations (e.g., AWS SDK, Meilisearch) without vendor-specific security adapters or signed bundle verification, expanding the attack surface through supply-chain updates.【F:gigvora-backend-nodejs/package.json†L16-L44】
- DOMPurify is wired directly within the blog article page rather than through a hardened helper, so any upgrade that changes sanitiser defaults can silently weaken XSS protections around `dangerouslySetInnerHTML`.【F:gigvora-frontend-reactjs/src/pages/BlogArticlePage.jsx†L1-L103】

## Alignment
- Dependency manifests still reference Agora RTC SDKs and Mapbox despite no corresponding feature toggles in the roadmap documents, suggesting procurement and licensing discussions lag behind code reality.【F:gigvora-frontend-reactjs/package.json†L17-L33】
- The backend’s `sequelize.config.cjs` defines only development and test environments, conflicting with the dependency scripts that assume production-level credentials and thus misaligning infrastructure provisioning.【F:gigvora-backend-nodejs/sequelize.config.cjs†L5-L19】
- Flutter dependencies depend on `permission_handler` and `google_sign_in`, yet platform-specific configuration (entitlements, SHA keys) is absent, highlighting a mismatch between dependency footprint and deployment readiness.【F:gigvora-flutter-phoneapp/pubspec.yaml†L6-L31】
- Node packages remain standalone without a workspace or shared tooling definition, so dependency upgrades cannot be orchestrated across services via a single script, undercutting the monorepo efficiencies implied by `melos` for Flutter.【F:gigvora-backend-nodejs/package.json†L1-L44】【F:melos.yaml†L1-L22】

## Full Scan Notes
- The React client’s Vite server default collides with the npm start override (5173 vs 4173), indicating environment assumptions are splintering across toolchains and increasing the odds of developer machines booting multiple dev servers accidentally.【F:gigvora-frontend-reactjs/vite.config.js†L5-L15】【F:gigvora-frontend-reactjs/package.json†L6-L24】
- Backend scripts pin `sequelize` globally but the `shared-contracts` workspace only exposes a static registry snapshot, so there is no generated TypeScript surface for consumers to align on despite the monorepo’s goal of shared contracts.【F:gigvora-backend-nodejs/package.json†L16-L44】【F:shared-contracts/domain/registry-snapshot.json†L1-L200】
