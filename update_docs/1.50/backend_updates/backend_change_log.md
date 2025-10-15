# Backend Change Log — Version 1.50 Update

## 19 Apr 2024
- Added a Prometheus metrics exporter (`src/observability/metricsRegistry.js`) and exposed `/health/metrics`, wiring startup
  priming in `src/server.js` and surfacing exporter status through `runtimeObservabilityService`. Admin dashboards and partner
  tooling now consume scrape counts, rate-limit/WAF lifetime totals, and database pool gauges from a common source.
- Hardened the compliance locker API by introducing Zod schemas for `/api/compliance/*` routes and updating
  `complianceLockerController` to rely on sanitised input. New Supertest coverage ensures invalid payloads return `422`
  responses while valid submissions propagate trimmed and coerced fields to the service layer.
- Authored `docs/runbooks/runtime-incident.md` so on-call staff have scripted recovery steps for stalled scrapes, rate-limit or
  WAF spikes, and shutdown orchestration anomalies. The runbook aligns with the new admin monitoring card and Flutter telemetry
  alerts shipped this sprint.

## 18 Apr 2024
- Enabled automated perimeter quarantining by extending `src/security/webApplicationFirewall.js` with threshold-based
  auto-blocking, dynamic blocklists, and offender tracking so repeated attackers are isolated without manual intervention.
- Upgraded the WAF middleware and `runtimeObservabilityService` to emit auto-block metadata, severity-adjusted audits,
  and enriched `/api/admin/runtime/health` payloads powering admin dashboards, mobile snapshots, and partner tooling.
- Added route-level integration tests (`tests/routes/securityPerimeter.test.js`) to verify the middleware order, admin
  health telemetry, and JWT-protected access patterns remain intact under automated quarantines.

## 17 Apr 2024
- Introduced an environment-driven web application firewall engine (`src/security/webApplicationFirewall.js`) that loads
  threat signatures, configurable blocklists, and maintains per-rule/IP metrics for runtime observability.
- Registered the WAF middleware in `src/app.js`, ensuring malicious payloads are blocked before hitting controllers while
  emitting structured audits through `recordRuntimeSecurityEvent` and updating perimeter metrics.
- Extended `runtimeObservabilityService` and the runtime OpenAPI specification to expose WAF metrics so admin dashboards,
  partner tooling, and mobile clients can reason about the latest blocked requests and offending rules.

## 16 Apr 2024
- Extracted the HTTP shutdown sequence into `src/lifecycle/httpShutdown.js`, centralising worker stop, HTTP close, database shutdown,
  and drain telemetry so graceful shutdowns emit consistent audits and error logs for operations tooling.
- Updated `src/server.js` to delegate to the new orchestrator, guaranteeing Sequelize drains execute even when previous shutdown
  steps fail and ensuring `recordRuntimeSecurityEvent` metadata includes drain verdicts.
- Authored Jest coverage (`tests/lifecycle/serverLifecycle.test.js`) for the orchestrator to confirm worker shutdown ordering,
  audit level selection, and drain error propagation without booting the full Express stack.

## 15 Apr 2024
- Expanded runtime security auditing so perimeter guardrails, rate limiting, and authentication flows emit structured
  `securityAuditService` events for downstream incident tooling.
- Extended `/api/admin/runtime/health` with perimeter summaries, maintenance announcements, and rate-limit analytics to
  prepare the admin dashboards and mobile bootstrapper for the upcoming WAF rollout.

## 12 Apr 2024
- Added `src/config/httpSecurity.js` to centralise helmet, trust-proxy, compression, and CORS enforcement, blocking untrusted
  origins with audited responses and feeding perimeter telemetry into runtime observability.
- Introduced `src/observability/perimeterMetrics.js` and wired it into `/api/admin/runtime/health` so operators can inspect
  blocked origin counts, last-seen timestamps, and affected routes in real time.
- Persisted perimeter incidents via `securityAuditService.recordRuntimeSecurityEvent` to extend the runtime security audit
  stream with origin abuse data.
- Installed the `compression` dependency and updated server bootstrap to apply the new HTTP security middleware ahead of
  correlation/logging so payload limits, trust proxies, and rate limiting execute against sanitised requests.

## 14 Apr 2024
- Published `/api/docs/runtime-security` with hashed ETag headers and five-minute caching so operators, client engineers, and partners can download the documented health/auth contract without hitting source control.
- Normalised `runtimeObservabilityService` output to include scheduled maintenance summaries, recent security audits, perimeter metrics, and live pool utilisation, keeping admin dashboards aligned with readiness telemetry.
- Extended `healthService` to persist Sequelize pool snapshots and vendor metadata on every probe, ensuring `/health/ready` mirrors the observability data powering admin dashboards.
- Added Jest module mapping for `compression` plus focused route coverage so the documentation endpoint remains testable in CI environments lacking optional native dependencies.

## 11 Apr 2024
- Added a dedicated database lifecycle manager that authenticates pools on startup, feeds `/health/ready` cache entries, drains
  connections during shutdown, and records runtime security audits for every start/stop sequence.
- Persisted runtime security audits in the new `runtime_security_audit_events` table with helper services so operators and
  dashboards surface the last ten incidents alongside dependency posture.
- Exposed `/auth/refresh` guarded by token validation so native clients can renew access tokens without re-authentication while
  maintaining login audit trails.
- Extended `/api/admin/runtime/health` to deliver maintenance schedules and recent security events for the admin runtime panel
  and mobile bootstrap logic.

## 13 Apr 2024
- Added `databaseLifecycleService` to warm Sequelize pools during startup, drain them during shutdown, and persist `database_audit_events` so runtime health and compliance teams receive auditable maintenance trails.
- Extended readiness and runtime observability services to expose pool utilisation metrics, enabling admin dashboards and health probes to visualise max/available/borrowed connection counts in real time.
- Updated database configuration to support eviction tuning and added Jest coverage to verify startup/shutdown auditing and telemetry exports.

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
## 10 Apr 2024
- Synced platform settings with a new dependency health module so Stripe/Escrow readiness and compliance toggles mark
  `paymentsCore`/`complianceProviders` status before the API accepts traffic, and re-evaluate immediately after admin updates.
- Added `utils/dependencyGate.js` and service guard clauses to short-circuit finance/compliance workflows with a 503 when
  database or custodial dependencies degrade, preventing cascading ledger corruption.
- Extended server bootstrap to hydrate dependency health snapshots during startup and updated Jest coverage to assert the guard
  behaviour around wallet ledger writes.

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
