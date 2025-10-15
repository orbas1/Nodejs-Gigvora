# Backend Change Log — Version 1.50 Update

## 12 Apr 2024
- Added supertest coverage for payments and compliance dependency guards, ensuring `/api/users/:id` and `/api/compliance/documents` return `503` responses with dependency metadata whenever infrastructure is degraded.
- Patched `middleware/authorization` with a robust `normaliseMemberships` helper so membership and role middleware deduplicate values without relying on undefined globals.
- Extended Jest configuration with a `zod` stub so schema-heavy modules load during tests without pulling optional dependencies, keeping guard suites runnable in minimal CI images.

## 11 Apr 2024
- Introduced `runtimeDependencyGuard` service to continuously evaluate payments and compliance storage credentials, flag
  maintenance blocks, and update runtime health telemetry so sensitive workflows can be halted before cascading failures.
- Wrapped wallet provisioning and ledger mutation paths in the payments guard, returning typed `503` responses when the
  payments provider is unavailable or under maintenance to protect balances from inconsistent writes.
- Hardened compliance locker write paths with dependency checks that pause document creation, versioning, and reminder
  acknowledgements whenever secure storage or legal maintenance windows are active.
- Bootstrapped dependency health during server start and added targeted Jest coverage for guard behaviour across missing
  credentials, healthy states, and maintenance degradations.

## 10 Apr 2024
- Added runtime maintenance registry backed by the new `RuntimeAnnouncement` Sequelize model, CRUD controllers, and
  `runtimeMaintenanceService` so the platform can publish downtime/incident messaging for targeted audiences and channels.
- Registered `/api/runtime/maintenance` public endpoint that serves active/upcoming announcements with caching hints and
  filtering, plus admin-only `/api/admin/runtime/maintenance/*` routes for listing, creating, updating, scheduling, resolving,
  and patching maintenance windows with guardrails enforcing chronology and severity.
- Integrated runtime maintenance announcements into the runtime observability snapshot so `/api/admin/runtime/health` exposes the
  most recent active window, upcoming schedule, and relevant metadata alongside dependency telemetry.
- Expanded Jest infrastructure with module mappers for optional logging/rate-limit dependencies and added unit/route coverage to
  lock maintenance filtering, lifecycle transitions, and validation outcomes.

## 09 Apr 2024
- Added validation schemas for search discovery queries, saved-search subscription payloads, project management bodies, and
  finance overview parameters to enforce canonical categories, numeric coercion, viewport parsing, and nested configuration
  sanitisation before controllers execute.
- Applied the `validateRequest` middleware to `/api/search/*`, `/api/projects/*`, and `/api/finance/*` endpoints so discovery,
  project automation, and finance telemetry routes normalise payloads and emit structured validation errors for unsafe input.
- Introduced targeted Jest supertest suites covering search, project, and finance validation flows to guard against regression
  and document expected sanitisation behaviour for cross-functional teams.

## 08 Apr 2024
- Added a reusable Zod-powered `validateRequest` middleware and schema catalogue covering authentication and admin routes so requests are normalised, coerced, and rejected before hitting controllers.
- Hardened `/api/auth/*` registration, login, two-factor, and Google OAuth flows with strict body validation that trims names, lowercases emails, coerces booleans, and rejects malformed payloads prior to domain service execution.
- Secured `/api/admin/dashboard`, `/api/admin/platform-settings`, and `/api/admin/affiliate-settings` by sanitising query/body inputs, coercing booleans/numbers, and ensuring nested settings objects cannot introduce prototype pollution or invalid configuration shapes.

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
