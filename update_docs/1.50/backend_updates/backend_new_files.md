# New Backend Files — Version 1.50 Update

| File | Description |
|------|-------------|
| `src/lifecycle/runtimeHealth.js` | Centralised runtime health state tracker capturing HTTP status, worker readiness, and dependency availability for consumption by health endpoints and operators. |
| `src/lifecycle/workerManager.js` | Supervisor responsible for starting/stopping search bootstrap, profile engagement, and news aggregation workers with health reporting hooks. |
| `src/middleware/correlationId.js` | Express middleware that enforces correlation IDs for every request, echoing them back to clients and structured logs. |
| `src/routes/health.js` | Express router serving `/health/live` and `/health/ready` endpoints backed by runtime health telemetry. |
| `src/services/healthService.js` | Service layer that authenticates database connectivity, synthesises readiness reports, and determines HTTP status codes. |
| `src/utils/logger.js` | Shared Pino logger configuration with security-focused redaction for HTTP and worker logs. |
