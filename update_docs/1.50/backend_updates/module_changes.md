# Module Changes — Version 1.50 Update

- Introduced `src/models/runtimeAnnouncement.js`, `src/controllers/runtimeController.js`, and `src/controllers/adminRuntimeController.js` with companion routes/services to manage maintenance announcements across public and admin surfaces. Added
  `src/routes/runtimeRoutes.js`, `src/routes/adminRuntimeRoutes.js`, and validation schemas under `src/validation/schemas/runtimeSchemas.js` wired into the shared `validateRequest` middleware.
- Added `src/models/databaseAuditEvent.js` alongside `src/services/databaseLifecycleService.js` so lifecycle hooks capture auditable startup/shutdown metadata, drain Sequelize pools gracefully, and expose pool telemetry to health/observability modules.
- Added Jest module mappers and stubs (`tests/stubs/pino*.js`, `tests/stubs/expressRateLimitStub.js`) so optional dependencies no longer block maintenance route coverage.
- Created a new `lifecycle/` module that centralises runtime health tracking (`runtimeHealth.js`) and worker supervision (`workerManager.js`). This module exposes start/stop primitives for the HTTP server to call during boot/shutdown.
- Updated `src/server.js` to consume the lifecycle module, warm database connections before listening, drain pools after HTTP shutdown, export `start`/`stop` helpers for testing, and register signal handlers for graceful termination.
- Refactored background workers (profile engagement, news aggregation, search bootstrap) to register with the lifecycle supervisor and report health status.
- Added `src/domains/` with a reusable `DomainRegistry` plus domain services for auth, marketplace, and platform feature-flag governance, enabling bounded-context ownership and transactional helpers.
- Introduced `src/domains/schemas/` alongside `scripts/syncDomainSchemas.js` to emit Zod-driven JSON schemas shared across web and mobile clients.
- Published new models (`UserLoginAudit`, `FeatureFlag`, `FeatureFlagAssignment`) and updated `src/models/index.js` exports to register them inside the domain registry.
- Extended the domain module with capability descriptors (`describeCapabilities`) and surfaced introspection via `src/services/domainIntrospectionService.js` plus `/api/domains` routing for cross-team visibility.
