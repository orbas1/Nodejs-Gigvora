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
