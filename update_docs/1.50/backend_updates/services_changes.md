# Services Changes — Version 1.50 Update

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
- New service verifying Sequelize connectivity on a throttled cadence, calculating dependency latency, and synthesising readiness/liveness reports for API consumers.
- Exposes `setDatabaseStatus` so lifecycle hooks can immediately update cached readiness after graceful shutdowns or startup
  authentication events.

## `src/lifecycle/databaseLifecycle.js`
- New lifecycle coordinator that authenticates Sequelize connections on startup, feeds dependency health telemetry, drains
  pools during shutdown, and records runtime security audits for post-incident analysis.

## `src/services/securityAuditService.js`
- Persists runtime security audit events (start, stop, shutdown failure) in `runtime_security_audit_events` and exposes helpers
  for querying the latest incidents.
- Provides a single entry point for services to log maintenance, dependency, and runtime perimeter changes in a structured way
  consumable by dashboards and compliance.

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
