# Services Changes — Version 1.50 Update

## `src/services/runtimeMaintenanceService.js`
- New service providing CRUD operations for runtime maintenance announcements with sanitisation of copy, slug deduplication,
  channel/audience targeting, and strict scheduling/chronology enforcement.
- Supplies filtering helpers for public and admin listings (audience, channel, status, time window) plus lifecycle transitions
  that automatically stamp `startsAt`/`endsAt` when statuses change to `active` or `resolved`.
- Normalises actor metadata for auditability and emits plain objects for controllers, enabling consistent serialization across
  admin dashboards, public banners, and mobile clients.

## `src/services/runtimeObservabilityService.js`
- Aggregates readiness, liveness, dependency health, process telemetry, rate-limit metrics, maintenance announcements, and
  database pool utilisation into a single operational snapshot consumed by `/api/admin/runtime/health` and admin dashboards.
- Resolves the highest priority active or upcoming maintenance window via `runtimeMaintenanceService` while surfacing
  max/min/borrowed counts from the pool snapshot so operations can validate graceful shutdowns from the same telemetry payload.

## `src/services/runtimeDependencyGuard.js`
- New dependency orchestration layer that inspects platform settings, runtime maintenance announcements, and cached telemetry
  to determine whether payments and compliance services are healthy, degraded (maintenance), or unavailable.
- Normalises guard results into structured snapshots, updates runtime health state for observability, and throws
  `ServiceUnavailableError` instances with detailed metadata when downstream workflows must halt.
- Provides warm-up helpers so the server precomputes dependency state during boot, enabling `/health/ready` and admin
  dashboards to surface accurate statuses immediately.

## `src/services/complianceService.js`
- Wrapped wallet provisioning and ledger mutation helpers with the payment dependency guard so new accounts and ledger entries
  are blocked when the configured custody provider credentials are missing or maintenance is in progress.
- Propagates request logging context into guard calls to improve traceability when wallet creation or ledger posts are paused
  due to degraded dependencies.

## `src/services/complianceLockerService.js`
- Added compliance dependency guard enforcement to document creation, versioning, and reminder acknowledgement flows so secure
  storage outages trigger immediate `503` responses instead of partial writes.
- Extended service options to carry request logging metadata into guard checks, ensuring operational logs capture which actor
  attempted to mutate the locker during a maintenance window.
## `src/utils/dependencyGate.js`
- New guard utility that inspects runtime dependency health and raises `ServiceUnavailableError` responses when critical
  providers are degraded, ensuring finance/compliance workflows stop cleanly instead of cascading failures.
- Exposes helpers for services to record dependency incidents or recoveries while keeping telemetry in `runtimeHealth` aligned
  with operational dashboards.

## `src/observability/dependencyHealth.js`
- Synchronises payment and compliance dependency state from platform settings, validating Stripe/Escrow credentials and feature
  toggles to mark `paymentsCore`/`complianceProviders` health before requests are processed.
- Provides a shared `syncCriticalDependencies` entry point for server bootstrap and administrative updates.

## `src/services/platformSettingsService.js`
- After persisting administrative changes, re-evaluates critical dependency health using the new observability module and logs
  results via the platform settings logger.

## `src/services/complianceService.js`
- Adds dependency guard clauses across wallet provisioning, ledger writes, identity/corporate verification, and qualification
  recording so requests short-circuit with actionable 503 responses when custodial providers or the database are unhealthy.

## `src/services/financeService.js`
- Protects the finance control tower overview with dependency gating to prevent cache refreshes and expensive aggregations when
  the database or payment provider telemetry indicates an outage.

## `src/services/healthService.js`
- Verifies Sequelize connectivity on a throttled cadence, calculates dependency latency, and synthesises readiness/liveness reports for API consumers while embedding current pool metrics for admin tooling and alerting.

## `src/services/databaseLifecycleService.js`
- New lifecycle orchestrator that warms Sequelize pools during server start, registers pool instrumentation, and drains connections on shutdown while persisting `database_audit_events` for security review.
- Exposes `getDatabasePoolSnapshot()` so health checks and observability services can publish max/available/borrowed counts and last pool events for operational dashboards, and returns shutdown audit metadata so orchestrators can log compliance evidence without requerying the database post-close.

## `src/services/newsAggregationService.js`
- Added logger injection for worker cycles, upgraded error handling to structured logs, and ensured the worker resets its logger on shutdown to avoid leaking stale references.

## `src/services/profileEngagementService.js`
- Leveraged existing logger injection to integrate with the lifecycle supervisor (no behavioural changes beyond worker management updates).

## `src/services/searchIndexService.js`
- Consumed by the new worker manager to register Meilisearch bootstrap health status (no internal code changes required).

## `src/services/authService.js`
- Rebuilt authentication flows to delegate persistence to the new AuthDomainService, record login audits, evaluate feature flags, and emit schema-driven user payloads with shared contracts.

## `src/services/projectService.js`
- Integrated MarketplaceDomainService to derive workspace status, synchronise project workspaces after status changes, and centralise marketplace-specific business rules.

## `src/services/domainIntrospectionService.js`
- New service that serialises bounded-context metadata, Sequelize models, indexes, hooks, and associations to power `/api/domains` diagnostics and registry exports.
- Resolves attached domain services via capability descriptors, enabling tooling to understand which contexts provide authentication, marketplace, or platform workflows.
