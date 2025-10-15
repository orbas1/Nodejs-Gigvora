# Services Changes — Version 1.50 Update

## `src/services/runtimeMaintenanceService.js`
- New service providing CRUD operations for runtime maintenance announcements with sanitisation of copy, slug deduplication,
  channel/audience targeting, and strict scheduling/chronology enforcement.
- Supplies filtering helpers for public and admin listings (audience, channel, status, time window) plus lifecycle transitions
  that automatically stamp `startsAt`/`endsAt` when statuses change to `active` or `resolved`.
- Normalises actor metadata for auditability and emits plain objects for controllers, enabling consistent serialization across
  admin dashboards, public banners, and mobile clients.

## `src/services/runtimeObservabilityService.js`
- Aggregates readiness, liveness, dependency health, process telemetry, rate-limit metrics, perimeter incidents, security audits, and database pool utilisation into a single operational snapshot consumed by `/api/admin/runtime/health` and admin dashboards.
- Normalises runtime maintenance announcements into a `maintenance` feed plus a `scheduledMaintenance` summary sourced from platform settings so operators can compare live incidents with planned downtime without additional calls.
- Resolves the highest priority active or upcoming maintenance window via `runtimeMaintenanceService` while surfacing max/min/borrowed counts from the pool snapshot so operations can validate graceful shutdowns from the same telemetry payload.
- Incorporates web application firewall metrics, exposing top rules, top sources, and recent block timestamps so operators can correlate abuse detection with rate-limit telemetry from one payload.

## `src/services/webApplicationFirewallService.js`
- New inspection service that normalises incoming requests, evaluates them against curated threat signatures, and returns scored matches used by the WAF middleware to determine whether to block traffic.
- Calculates aggregate scores across rule hits, surfaces highest-severity matches, and exposes helpers for logging/audit metadata without leaking raw payloads.
- Allows configurable block thresholds via `WAF_BLOCK_THRESHOLD`, enabling environment-specific tuning of false-positive tolerance.

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
- Normalises maintenance window payloads (`maintenance.windows`, support contacts, status page URLs) so runtime telemetry and
  clients receive curated downtime schedules with validated ISO timestamps.

## `src/services/complianceService.js`
- Adds dependency guard clauses across wallet provisioning, ledger writes, identity/corporate verification, and qualification
  recording so requests short-circuit with actionable 503 responses when custodial providers or the database are unhealthy.

## `src/services/financeService.js`
- Protects the finance control tower overview with dependency gating to prevent cache refreshes and expensive aggregations when
  the database or payment provider telemetry indicates an outage.

## `src/services/healthService.js`
- New service verifying Sequelize connectivity on a throttled cadence, calculating dependency latency, persisting pool snapshots, and synthesising readiness/liveness reports for API consumers.
- Exposes `setDatabaseStatus` so lifecycle hooks can immediately update cached readiness after graceful shutdowns or startup authentication events, keeping `/health/ready` aligned with admin observability payloads.

## `src/lifecycle/databaseLifecycle.js`
- New lifecycle coordinator that authenticates Sequelize connections on startup, feeds dependency health telemetry, drains
  pools during shutdown, and records runtime security audits for post-incident analysis.

## `src/lifecycle/httpShutdown.js`
- New orchestration helper responsible for stopping background workers, closing the HTTP server, logging runtime security audits,
  and draining database connections with consistent error handling.
- Emits structured logging for worker/database/drain failures so operations dashboards and log pipelines surface actionable
  metadata whenever shutdown deviates from the happy path.
- Provides a testable seam for server shutdown logic, enabling targeted Jest coverage without bootstrapping Express or touching
  Sequelize connections during unit tests.

## `src/services/securityAuditService.js`
- Persists runtime security audit events (start, stop, shutdown failure) in `runtime_security_audit_events` and exposes helpers
  for querying the latest incidents.
- Provides a single entry point for services to log maintenance, dependency, and runtime perimeter changes in a structured way
  consumable by dashboards and compliance.
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
- Added refresh-token validation and session renewal so `/auth/refresh` can issue new access tokens without re-prompting for
  credentials.

## `src/services/projectService.js`
- Integrated MarketplaceDomainService to derive workspace status, synchronise project workspaces after status changes, and centralise marketplace-specific business rules.

## `src/services/domainIntrospectionService.js`
- New service that serialises bounded-context metadata, Sequelize models, indexes, hooks, and associations to power `/api/domains` diagnostics and registry exports.
- Resolves attached domain services via capability descriptors, enabling tooling to understand which contexts provide authentication, marketplace, or platform workflows.

## `src/services/runtimeObservabilityService.js`
- Aggregates readiness, liveness, dependency health, process telemetry, and rate-limit metrics into a single operational snapshot consumed by `/api/admin/runtime/health`.
- Normalises environment metadata (release identifiers, regions, memory/cpu usage) so dashboards and automation hooks can surface actionable runtime indicators without duplicating process logic.
- Enriches snapshots with maintenance schedules, recent security audit events, and perimeter telemetry so operators have contextual downtime insights alongside dependency posture and abuse detection signals.

## `src/config/httpSecurity.js`
- Applies helmet, trust proxy, compression, and audited CORS enforcement in a single middleware to harden the HTTP perimeter and keep configuration consistent across environments.
- Records origin blocks through the security audit service and feeds perimeter metrics into runtime observability so blocked hosts surface in admin dashboards.

## `src/observability/perimeterMetrics.js`
- Tracks blocked origin attempts, last-seen timestamps, and affected routes to power runtime observability snapshots and perimeter reporting.
- Provides reset-friendly helpers used by tests and scheduled jobs to rotate perimeter metrics without restarting the process.

## `src/observability/wafMetrics.js`
- Maintains aggregate WAF statistics (total blocks, top rules, top sources, recent samples) for display on runtime observability surfaces.
- Records each blocked request with timestamps and user agent snippets so operations can triage attack campaigns without tailing logs.
- Provides reset helpers for tests and scheduled scrubs to rotate in-memory metrics safely during long-running processes.
