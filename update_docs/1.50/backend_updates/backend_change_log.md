# Backend Change Log — Version 1.50 Update

## 05 Apr 2024
- Refactored the legacy model monolith into domain-registered contexts with dedicated auth, marketplace, and platform services powering login audits, feature flag evaluation, and workspace synchronisation.
- Created `UserLoginAudit`, `FeatureFlag`, and `FeatureFlagAssignment` models with cascade-aware associations so authentication flows capture audit trails and granular rollout targeting.
- Added a schema generation script (`npm run schemas:sync`) that converts Zod definitions into JSON artifacts for downstream SDKs and published them under `shared-contracts/domain`.

## 04 Apr 2024
- Introduced a lifecycle orchestrator that separates the Express HTTP server from long-running workers, adds graceful shutdown hooks, and publishes readiness/liveness telemetry for platform monitoring.
- Hardened request processing with correlation-aware structured logging, configurable body-size limits, and global rate limiting to contain abuse and simplify incident response.
- Added health reporting services that verify Sequelize connectivity, aggregate worker state, and expose `/health/live` plus `/health/ready` endpoints for load balancers and mobile clients.
- Refreshed background worker management so the profile engagement and news aggregation jobs can be started, stopped, and observed independently of the HTTP runtime.
