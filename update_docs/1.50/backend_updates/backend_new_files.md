# New Backend Files — Version 1.50 Update

| File | Description |
|------|-------------|
| `database/migrations/20241015121500-runtime-maintenance-announcements.cjs` | Migration creating `runtime_announcements` table with indexed status/start/end columns plus JSONB audiences/channels metadata. |
| `database/migrations/20241015123000-database-connection-audit.cjs` | Migration provisioning `database_audit_events` with typed event metadata, audit timestamps, and JSON payloads capturing pool snapshots for shutdown reviews. |
| `src/models/runtimeAnnouncement.js` | Sequelize model defining runtime maintenance announcements with severity/status enums, JSON audience/channel lists, metadata, and helper methods for filtering/scheduling. |
| `src/models/databaseAuditEvent.js` | Sequelize model persisting auditable database lifecycle events with event type, reason, initiator, and JSON metadata storing pool telemetry. |
| `src/controllers/runtimeController.js` | Public controller serving filtered maintenance announcements to unauthenticated clients with caching hints and validation. |
| `src/controllers/adminRuntimeController.js` | Admin controller providing paginated list, create/update, and lifecycle actions for maintenance announcements with audit metadata. |
| `src/routes/runtimeRoutes.js` | Express router registering `/api/runtime/maintenance` with validation and caching headers. |
| `src/routes/adminRuntimeRoutes.js` | Express router wiring admin maintenance CRUD + status endpoints behind authentication and validation middleware. |
| `src/services/runtimeMaintenanceService.js` | Service encapsulating announcement creation, updates, lifecycle transitions, filtering, and serialization for controllers. |
| `src/routes/docsRoutes.js` | Express router that serves cached OpenAPI documents with hashed ETags for partner tooling and automation. |
| `src/validation/schemas/runtimeSchemas.js` | Zod schema catalogue covering public/admin query params, create/update payloads, status transitions, and identifier params. |
| `tests/services/runtimeMaintenanceService.test.js` | Unit coverage exercising sanitisation, chronology enforcement, lifecycle transitions, and filtering branches for the service. |
| `tests/routes/runtimeRoutes.test.js` | Supertest coverage validating public maintenance endpoint filtering, caching headers, and validation behaviour using stubs. |
| `tests/routes/docsRoutes.test.js` | Supertest coverage asserting the documentation endpoint returns hashed OpenAPI payloads and honours conditional requests. |
| `tests/routes/dependencyGuardRoutes.test.js` | Supertest coverage exercising payments/compliance guard propagation so API endpoints emit `503` with dependency metadata when infrastructure degrades. |
| `tests/stubs/pinoStub.js` | Jest stub for `pino` to unblock maintenance route/service tests without requiring the binary dependency. |
| `tests/stubs/pinoHttpStub.js` | Jest stub for `pino-http` supporting middleware instrumentation within route tests. |
| `tests/stubs/expressRateLimitStub.js` | Jest stub that mimics `express-rate-limit` handler signatures for isolated route coverage. |
| `src/security/threatSignatures.js` | Curated catalogue of WAF threat signatures used to score requests for SQLi, XSS, SSRF, and command injection patterns. |
| `src/middleware/webApplicationFirewall.js` | Express middleware enforcing the new WAF, blocking high-risk payloads and recording audits/metrics. |
| `src/services/webApplicationFirewallService.js` | Service helper that normalises requests, evaluates threat signatures, and returns scored matches for the WAF. |
| `src/observability/wafMetrics.js` | In-memory metrics store tracking WAF rule hits, top sources, and recent samples for runtime telemetry. |
| `tests/middleware/webApplicationFirewall.test.js` | Jest coverage verifying benign requests pass, malicious payloads are blocked, and metrics/audits are recorded. |
| `src/lifecycle/httpShutdown.js` | Lifecycle orchestrator coordinating worker stop, HTTP close, runtime security auditing, and database drain telemetry during shutdown. |
| `tests/lifecycle/serverLifecycle.test.js` | Unit coverage exercising the shutdown orchestrator, validating worker stop ordering, audit emission, and drain failure propagation. |

| File | Description |
|------|-------------|
| `src/lifecycle/runtimeHealth.js` | Centralised runtime health state tracker capturing HTTP status, worker readiness, and dependency availability for consumption by health endpoints and operators. |
| `src/lifecycle/workerManager.js` | Supervisor responsible for starting/stopping search bootstrap, profile engagement, and news aggregation workers with health reporting hooks. |
| `src/config/httpSecurity.js` | Consolidated HTTP security middleware applying helmet, trust proxy, compression, and audited CORS enforcement while emitting perimeter telemetry. |
| `src/middleware/correlationId.js` | Express middleware that enforces correlation IDs for every request, echoing them back to clients and structured logs. |
| `src/routes/health.js` | Express router serving `/health/live` and `/health/ready` endpoints backed by runtime health telemetry. |
| `src/services/healthService.js` | Service layer that authenticates database connectivity, synthesises readiness reports, and determines HTTP status codes. |
| `src/utils/logger.js` | Shared Pino logger configuration with security-focused redaction for HTTP and worker logs. |
| `src/domains/domainRegistry.js` | Bounded-context registry responsible for mapping Sequelize models to domain-specific service layers and transactions. |
| `src/domains/serviceCatalog.js` | Singleton factory that exposes auth, marketplace, and platform domain services to the wider application. |
| `src/domains/auth/authDomainService.js` | Domain service handling credential normalisation, login audits, and two-factor preferences through the auth context. |
| `src/domains/marketplace/marketplaceDomainService.js` | Domain service encapsulating project workspace synchronisation and marketplace health metrics. |
| `src/domains/platform/featureFlagService.js` | Domain service orchestrating feature flag upserts, assignment evaluation, and percentage rollouts. |
| `src/domains/schemas/auth.js` | Zod definition describing the canonical auth user payload exported to shared contracts. |
| `src/domains/schemas/marketplace.js` | Zod definition for project workspace contracts consumed by marketplace clients. |
| `src/domains/schemas/platform.js` | Zod definition for feature flag metadata shared with front-end management consoles. |
| `scripts/syncDomainSchemas.js` | CLI utility that renders domain Zod schemas into JSON artifacts within `shared-contracts/domain`. |
| `scripts/generateDomainClients.js` | CLI companion that compiles generated JSON schemas into TypeScript definitions under `shared-contracts/clients/typescript`. |
| `src/services/domainIntrospectionService.js` | Service that serialises bounded-context metadata, model definitions, and service bindings for the `/api/domains` endpoints. |
| `src/routes/domainRoutes.js` | Express router exposing `/api/domains/registry`, context drill-down, and model definition endpoints. |
| `shared-contracts/clients/typescript/*` | Generated TypeScript declarations mirroring domain schemas for Node and React consumers. |
| `src/observability/rateLimitMetrics.js` | Instrumented metrics store that tracks per-key request attempts, blocked responses, and history snapshots. |
| `src/middleware/rateLimiter.js` | Wrapper around `express-rate-limit` that records telemetry, applies admin-aware keys, and exposes metrics to the observability service. |
| `src/middleware/validateRequest.js` | Zod-backed middleware that validates and normalises Express request bodies, queries, params, headers, and cookies before controller execution. |
| `src/services/runtimeObservabilityService.js` | Aggregates readiness, liveness, dependency, environment, and rate-limit data for `/api/admin/runtime/health`. |
| `src/services/databaseLifecycleService.js` | Manages Sequelize pool warm-up/shutdown, records audit events, and exposes pool telemetry for health/observability consumers. |
| `src/services/runtimeDependencyGuard.js` | Evaluates payment and compliance infrastructure health, caches dependency snapshots, and throws typed errors to halt workflows during outages. |
| `src/validation/primitives.js` | Shared Zod helper utilities for trimming strings, coercing numbers/booleans, and normalising geo-location payloads. |
| `src/validation/schemas/authSchemas.js` | Auth route schema catalogue enforcing login/registration payload contracts. |
| `src/lifecycle/databaseLifecycle.js` | Coordinates database bootstrap/shutdown, feeds runtime health cache updates, and records security audits. |
| `src/services/securityAuditService.js` | Persists runtime perimeter events to `runtime_security_audit_events` and exposes query helpers for observability. |
| `src/models/runtimeSecurityAuditEvent.js` | Sequelize model backing runtime security audit logs, including event type, level, requestId, and metadata. |
| `database/migrations/20241015103000-runtime-security-audit.cjs` | Migration creating the `runtime_security_audit_events` table with indexed event type/level/timestamps. |
| `src/validation/schemas/adminSchemas.js` | Admin dashboard/settings schema catalogue guarding query parameters and nested configuration payloads. |
| `src/validation/schemas/searchSchemas.js` | Validation catalogue covering discovery queries, saved-search subscriptions, and category/viewport sanitisation. |
| `src/validation/schemas/projectSchemas.js` | Project payload schema enforcing titles, geo/budget coercion, and auto-assign configuration sanitisation. |
| `src/validation/schemas/financeSchemas.js` | Finance schema enforcing numeric identifiers, ISO date filters, and refresh toggles for control tower endpoints. |
| `tests/observability/rateLimitMetrics.test.js` | Unit coverage for the metrics store ensuring window rollovers, blocked ratios, and history snapshots remain accurate. |
| `tests/config/httpSecurity.test.js` | Jest coverage validating allowed origin parsing, wildcard handling, perimeter telemetry, and audit hooks for the HTTP security middleware. |
| `tests/services/runtimeObservabilityService.test.js` | Integration test validating runtime snapshots include readiness, liveness, and rate-limit data. |
| `tests/services/runtimeDependencyGuard.test.js` | Jest suite covering credential gaps, maintenance degradations, and healthy states for payments and compliance dependency guards. |
| `tests/services/databaseLifecycleService.test.js` | Jest coverage verifying startup/shutdown auditing, pool telemetry snapshots, and graceful drain behaviour for the database lifecycle service. |
| `tests/adminRuntimeRoutes.test.js` | Route test covering admin authentication requirements and response shape for `/api/admin/runtime/health`. |
| `tests/routes/authRoutes.validation.test.js` | Supertest coverage ensuring authentication endpoints emit `422` with structured issues for invalid payloads and sanitise valid requests. |
| `tests/routes/adminRoutes.validation.test.js` | Supertest coverage asserting admin dashboard and settings endpoints coerce and validate inputs before hitting services. |
| `tests/routes/searchRoutes.validation.test.js` | Supertest coverage confirming discovery queries, saved-search subscriptions, and category filters are validated and sanitised. |
| `tests/routes/projectRoutes.validation.test.js` | Supertest coverage verifying project create/update/auto-assign endpoints enforce canonical payloads and numeric identifiers. |
| `tests/routes/financeRoutes.validation.test.js` | Supertest coverage validating finance overview and freelancer insight endpoints coerce IDs and ISO date ranges. |
| `tests/stubs/zodStub.js` | Lightweight Jest stub implementing the `z` factory and `ZodError` contract so schema-heavy modules load without shipping the real dependency in CI. |
| `tests/stubs/compressionStub.js` | Jest stub mimicking the `compression` middleware signature so HTTP security and documentation routes execute during tests without the native dependency. |
| `docs/openapi/runtime-security.json` | Versioned OpenAPI contract describing health, runtime observability, and authentication endpoints for partner tooling. |
