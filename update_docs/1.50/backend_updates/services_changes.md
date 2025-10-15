# Services Changes — Version 1.50 Update

## `src/services/healthService.js`
- New service verifying Sequelize connectivity on a throttled cadence, calculating dependency latency, and synthesising readiness/liveness reports for API consumers.

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

## `src/services/runtimeObservabilityService.js`
- Aggregates readiness, liveness, dependency health, process telemetry, and rate-limit metrics into a single operational snapshot consumed by `/api/admin/runtime/health`.
- Normalises environment metadata (release identifiers, regions, memory/cpu usage) so dashboards and automation hooks can surface actionable runtime indicators without duplicating process logic.
