## Operator Runbook – Hardened Platform Lifecycle

### Pre-Deployment Checklist
- Run `npm run config:validate` inside `gigvora-backend-nodejs` to ensure `.env` or staged environment files satisfy the runtime configuration schema.
- Confirm `METRICS_BEARER_TOKEN` is rotated per environment and shared only with observability tooling; the metrics endpoint returns 404 when the token is missing.
- Review worker toggles in the runtime configuration (`ENABLE_*_WORKER`) to intentionally disable optional workers for maintenance windows.

### Startup Procedure
1. Deploy configuration changes and restart the Node process.
2. Monitor `/health/ready?page=1&perPage=10&refresh=true` with the metrics token to obtain the latest dependency statuses and queue telemetry.
3. If readiness returns a 503, inspect the `details.workers.nodes` and `details.dependencies.nodes` arrays to identify failing components; remediation steps are now surfaced via structured metadata.

### Shutdown Procedure
- Invoke the process signal handlers (SIGINT/SIGTERM) or call the exported `stop()` helper to ensure database drains before background workers stop; the server now guarantees worker shutdown even on startup failures.
- Verify `/health/live` transitions to `degraded` while shutdown is in progress and `stopped` once complete.

### Observability Notes
- `/health/metrics` responds only when the bearer token is supplied; unauthenticated calls return `401` and disabled environments return `404` to prevent information leakage.
- Worker telemetry samples queue depth and aggregation heartbeats at 15–60s intervals, enabling Grafana alerts without custom collectors.
- Local or CI smoke suites that only exercise realtime modules may export `SKIP_SEQUELIZE_BOOTSTRAP=true` to bypass the monolithic model index; the harness still hydrates messaging/moderation models, rebuilds the sqlite schema, and logs the mode so operators understand test coverage limits.
