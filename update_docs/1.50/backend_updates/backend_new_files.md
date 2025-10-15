# New Backend Files — Version 1.50 Update

| File | Description |
|------|-------------|
| `src/lifecycle/runtimeHealth.js` | Centralised runtime health state tracker capturing HTTP status, worker readiness, and dependency availability for consumption by health endpoints and operators. |
| `src/lifecycle/workerManager.js` | Supervisor responsible for starting/stopping search bootstrap, profile engagement, and news aggregation workers with health reporting hooks. |
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
| `src/observability/rateLimitMetrics.js` | Instrumented metrics store that tracks per-key request attempts, blocks, utilisation history, and top consumers for the API rate limiter. |
| `src/middleware/rateLimiter.js` | Wrapper around `express-rate-limit` that records telemetry, applies admin-aware keys, and exposes metrics to the observability service. |
| `src/middleware/validateRequest.js` | Zod-backed middleware that validates and normalises Express request bodies, queries, params, headers, and cookies before controller execution. |
| `src/services/runtimeObservabilityService.js` | Aggregates readiness, dependency, environment, and rate-limit data for `/api/admin/runtime/health`. |
| `src/validation/primitives.js` | Shared Zod helper utilities for trimming strings, coercing numbers/booleans, and normalising geo-location payloads. |
| `src/validation/schemas/authSchemas.js` | Auth route schema catalogue enforcing login/registration payload contracts. |
| `src/validation/schemas/adminSchemas.js` | Admin dashboard/settings schema catalogue guarding query parameters and nested configuration payloads. |
| `src/validation/schemas/searchSchemas.js` | Validation catalogue covering discovery queries, saved-search subscriptions, and category/viewport sanitisation. |
| `src/validation/schemas/projectSchemas.js` | Project payload schema enforcing titles, geo/budget coercion, and auto-assign configuration sanitisation. |
| `src/validation/schemas/financeSchemas.js` | Finance schema enforcing numeric identifiers, ISO date filters, and refresh toggles for control tower endpoints. |
| `tests/observability/rateLimitMetrics.test.js` | Unit coverage for the metrics store ensuring window rollovers, blocked ratios, and history snapshots remain accurate. |
| `tests/services/runtimeObservabilityService.test.js` | Integration test validating runtime snapshots include readiness, liveness, and rate-limit data. |
| `tests/adminRuntimeRoutes.test.js` | Route test covering admin authentication requirements and response shape for `/api/admin/runtime/health`. |
| `tests/routes/authRoutes.validation.test.js` | Supertest coverage ensuring authentication endpoints emit `422` with structured issues for invalid payloads and sanitise valid requests. |
| `tests/routes/adminRoutes.validation.test.js` | Supertest coverage asserting admin dashboard and settings endpoints coerce and validate inputs before hitting services. |
| `tests/routes/searchRoutes.validation.test.js` | Supertest coverage confirming discovery queries, saved-search subscriptions, and category filters are validated and sanitised. |
| `tests/routes/projectRoutes.validation.test.js` | Supertest coverage verifying project create/update/auto-assign endpoints enforce canonical payloads and numeric identifiers. |
| `tests/routes/financeRoutes.validation.test.js` | Supertest coverage validating finance overview and freelancer insight endpoints coerce IDs and ISO date ranges. |
