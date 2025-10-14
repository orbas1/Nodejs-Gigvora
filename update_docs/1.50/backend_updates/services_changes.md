# Services Changes — Version 1.50 Update

## `src/services/healthService.js`
- New service verifying Sequelize connectivity on a throttled cadence, calculating dependency latency, and synthesising readiness/liveness reports for API consumers.

## `src/services/newsAggregationService.js`
- Added logger injection for worker cycles, upgraded error handling to structured logs, and ensured the worker resets its logger on shutdown to avoid leaking stale references.

## `src/services/profileEngagementService.js`
- Leveraged existing logger injection to integrate with the lifecycle supervisor (no behavioural changes beyond worker management updates).

## `src/services/searchIndexService.js`
- Consumed by the new worker manager to register Meilisearch bootstrap health status (no internal code changes required).
