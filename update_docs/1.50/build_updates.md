# Build & Deployment Updates — Version 1.50

- Node backend start/stop scripts now expose `start()` and `stop()` helpers for test harnesses and operational tooling; production processes should monitor `/health/ready` before routing traffic.
- Container probes should be updated to call `GET /health/live` for liveness and `GET /health/ready` for readiness with a failure threshold aligned to worker bootstrap time (~15s).
- New environment variables (`REQUEST_BODY_LIMIT`, `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX_REQUESTS`, `LOG_LEVEL`) should be injected through deployment manifests with environment-specific overrides.
- Logging pipelines must ingest structured JSON output from Pino; ensure log shippers parse the `requestId` and `worker` fields for correlation dashboards.
