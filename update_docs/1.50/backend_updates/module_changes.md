# Module Changes — Version 1.50 Update

- Created a new `lifecycle/` module that centralises runtime health tracking (`runtimeHealth.js`) and worker supervision (`workerManager.js`). This module exposes start/stop primitives for the HTTP server to call during boot/shutdown.
- Extended the lifecycle module with `databaseLifecycle.js` to manage Sequelize bootstrap/shutdown, update readiness caches, and
  emit runtime security audits.
- Updated `src/server.js` to consume the lifecycle module, export `start`/`stop` helpers for testing, and register signal handlers for graceful termination.
- Refactored background workers (profile engagement, news aggregation, search bootstrap) to register with the lifecycle supervisor and report health status.
- Added `src/domains/` with a reusable `DomainRegistry` plus domain services for auth, marketplace, and platform feature-flag governance, enabling bounded-context ownership and transactional helpers.
- Introduced `src/domains/schemas/` alongside `scripts/syncDomainSchemas.js` to emit Zod-driven JSON schemas shared across web and mobile clients.
- Published new models (`UserLoginAudit`, `FeatureFlag`, `FeatureFlagAssignment`) and updated `src/models/index.js` exports to register them inside the domain registry.
- Added `models/runtimeSecurityAuditEvent.js` with accompanying migration so runtime perimeter events persist to the platform
  context and can be consumed by security tooling.
- Extended the domain module with capability descriptors (`describeCapabilities`) and surfaced introspection via `src/services/domainIntrospectionService.js` plus `/api/domains` routing for cross-team visibility.
- Introduced `src/observability/dependencyHealth.js` and `src/utils/dependencyGate.js` to register critical dependency health
  and enforce runtime guards across finance/compliance workflows when custodial providers or databases degrade.
