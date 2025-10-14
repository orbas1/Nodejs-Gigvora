# Backend Change Log — Version 1.50 Update

## 07 Apr 2024
- Introduced an observability-focused rate limiter wrapper and metrics store that track per-window utilisation, top offenders, and blocked ratios without external persistence.
- Added `runtimeObservabilityService` and `/api/admin/runtime/health` so operators can inspect readiness, dependency health, environment metadata, and rate-limit pressure programmatically.
- Expanded admin controller/routes to expose runtime telemetry while honouring admin authentication.

## 06 Apr 2024
- Delivered `/api/domains/*` routes backed by a new DomainIntrospectionService that serialises bounded contexts, Sequelize metadata, and service bindings for operational tooling.
- Added capability descriptors to auth, marketplace, and platform domain services so diagnostics expose available workflows alongside context membership.
- Introduced `npm run schemas:clients` to compile shared JSON schemas into TypeScript definition files under `shared-contracts/clients/typescript`.

## 05 Apr 2024
- Refactored the legacy model monolith into domain-registered contexts with dedicated auth, marketplace, and platform services powering login audits, feature flag evaluation, and workspace synchronisation.
- Created `UserLoginAudit`, `FeatureFlag`, and `FeatureFlagAssignment` models with cascade-aware associations so authentication flows capture audit trails and granular rollout targeting.
- Added a schema generation script (`npm run schemas:sync`) that converts Zod definitions into JSON artifacts for downstream SDKs and published them under `shared-contracts/domain`.

## 04 Apr 2024
- Introduced a lifecycle orchestrator that separates the Express HTTP server from long-running workers, adds graceful shutdown hooks, and publishes readiness/liveness telemetry for platform monitoring.
- Hardened request processing with correlation-aware structured logging, configurable body-size limits, and global rate limiting to contain abuse and simplify incident response.
- Added health reporting services that verify Sequelize connectivity, aggregate worker state, and expose `/health/live` plus `/health/ready` endpoints for load balancers and mobile clients.
- Refreshed background worker management so the profile engagement and news aggregation jobs can be started, stopped, and observed independently of the HTTP runtime.
