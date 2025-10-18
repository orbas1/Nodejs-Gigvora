# Service Layer Upgrades

## Runtime Dependency Guard
- Rebuild `runtimeDependencyGuard` as a deterministic state machine with explicit states: `cold`, `warming`, `healthy`,
  `degraded`, `bypassed`. Each call to `evaluateDependencySet` returns `{ state, failingChecks, ttlMs }`.
- Cache entries are keyed by dependency name and expire based on schema-driven TTLs. Negative results (failures) get shorter TTLs
  (15 seconds) to speed up recovery detection.
- The bypass flag is now stored exclusively in `config.runtime.dependencyGuard.bypassFlag`. When enabled, health endpoints return
  `state: 'bypassed'` and append an advisory instructing operators to disable the bypass once root causes are fixed.

## Database Lifecycle Service
- `bootstrapDatabase` returns structured status objects: `{ name: 'primary', status: 'ok', pool: { used, available }, latencyMs }`.
- `shutdownDatabase` drains pools before closing connections and records metrics: `database_shutdown_duration_seconds` and
  `database_connections_left_open_total`.
- On failure, the service throws `ServiceUnavailableError` with `code: 'DATABASE_BOOT_FAIL'` so orchestrators can respond.

## Metrics Registry
- Extend `metricsRegistry` to expose queue depth histograms (`queue_depth_gauge`) and worker heartbeat gauges.
- Provide `getMetricsStatus()` returning `{ exporter: 'prom-client', status: 'ok', cacheSize }` for the readiness check.
- Metrics exports are rate-limited to avoid Prometheus scraping loops from exhausting CPU.

## Security Audit Service
- `recordRuntimeSecurityEvent` attaches `correlationId` and `configVersion` metadata to every event, enabling cross-service
  correlation.
- Failed health checks emit an audit event `runtime.health.degraded` with recommended remediation steps pulled from a new
  `docs/operators/runbooks.json` file.

## Queue Service
- Worker bootstrap calls `queueService.verifyConnectivity({ queues })` which pings each queue backend (BullMQ, Redis streams) and
  returns connection metrics before workers subscribe to jobs.
- Queue status integrates with readiness payloads and the admin dashboard to show depth and lag.
