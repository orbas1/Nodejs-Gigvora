# Module Changes — Version 1.50 Update

- Introduced `src/models/runtimeAnnouncement.js`, `src/controllers/runtimeController.js`, and `src/controllers/adminRuntimeController.js` with companion routes/services to manage maintenance announcements across public and admin surfaces. Added
  `src/routes/runtimeRoutes.js`, `src/routes/adminRuntimeRoutes.js`, and validation schemas under `src/validation/schemas/runtimeSchemas.js` wired into the shared `validateRequest` middleware.
- Added `src/models/databaseAuditEvent.js` alongside `src/services/databaseLifecycleService.js` so lifecycle hooks capture auditable startup/shutdown metadata, drain Sequelize pools gracefully, and expose pool telemetry to health/observability modules.
- Added Jest module mappers and stubs (`tests/stubs/pino*.js`, `tests/stubs/expressRateLimitStub.js`) so optional dependencies no longer block maintenance route coverage.
- Created a new `lifecycle/` module that centralises runtime health tracking (`runtimeHealth.js`) and worker supervision (`workerManager.js`). This module exposes start/stop primitives for the HTTP server to call during boot/shutdown.
- Added `src/config/httpSecurity.js` to encapsulate helmet policies, trust proxy detection, compression, and CORS enforcement so perimeter controls stay consistent across environments and are easily testable.
- Created `src/security/threatSignatures.js` plus the accompanying `src/middleware/webApplicationFirewall.js` and `src/services/webApplicationFirewallService.js` modules to deliver curated WAF rule evaluation and blocking inside the Express runtime.
- Extended the lifecycle module with `databaseLifecycle.js` to manage Sequelize bootstrap/shutdown, update readiness caches, and
  emit runtime security audits.
- Updated `src/server.js` to consume the lifecycle module, export `start`/`stop` helpers for testing, and register signal handlers for graceful termination.
- Updated `src/server.js` to consume the lifecycle module, warm database connections before listening, drain pools after HTTP shutdown, export `start`/`stop` helpers for testing, and register signal handlers for graceful termination.
- Added `src/routes/docsRoutes.js` to serve OpenAPI documents with hashed ETags so tooling can retrieve contracts without invoking controller code.
- Added `src/lifecycle/httpShutdown.js` as a dedicated orchestrator coordinating worker stop, HTTP close, database shutdown, audit logging,
  and drain telemetry so the server module can execute graceful shutdowns with consistent logging across environments.
- Recorded the runtime OpenAPI schema under `docs/openapi/runtime-security.json`, versioning the documented contract alongside source for audit trails.
- Refactored background workers (profile engagement, news aggregation, search bootstrap) to register with the lifecycle supervisor and report health status.
- Added `src/domains/` with a reusable `DomainRegistry` plus domain services for auth, marketplace, and platform feature-flag governance, enabling bounded-context ownership and transactional helpers.
- Introduced `src/domains/schemas/` alongside `scripts/syncDomainSchemas.js` to emit Zod-driven JSON schemas shared across web and mobile clients.
- Published new models (`UserLoginAudit`, `FeatureFlag`, `FeatureFlagAssignment`) and updated `src/models/index.js` exports to register them inside the domain registry.
- Added `models/runtimeSecurityAuditEvent.js` with accompanying migration so runtime perimeter events persist to the platform
  context and can be consumed by security tooling.
- Extended the domain module with capability descriptors (`describeCapabilities`) and surfaced introspection via `src/services/domainIntrospectionService.js` plus `/api/domains` routing for cross-team visibility.
- Introduced `src/observability/dependencyHealth.js` and `src/utils/dependencyGate.js` to register critical dependency health
  and enforce runtime guards across finance/compliance workflows when custodial providers or databases degrade.
- Created `src/observability/perimeterMetrics.js` to track blocked origin telemetry alongside dependency and worker state, feeding admin dashboards and audit streams.
- Added `src/observability/wafMetrics.js` to record WAF rule counts, source attempts, and recent samples for runtime observability payloads and security investigations.
- Added `tests/stubs/compressionStub.js` and mapped it via Jest configuration so documentation routes remain testable in CI environments missing native compression binaries.
