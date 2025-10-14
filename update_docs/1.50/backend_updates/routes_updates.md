# Routes Updates — Version 1.50 Update

| Route | Change | Notes |
|-------|--------|-------|
| `GET /health/live` | **New.** Returns liveness payload for container orchestrators; excludes heavy dependency checks so it can be polled at high frequency. | Backed by `services/healthService.getLivenessReport()` and the runtime health tracker. |
| `GET /health/ready` | **New.** Surfaces dependency-aware readiness, including Sequelize connectivity and worker states. Emits `503` when degraded or during shutdown. | Consumers should migrate from legacy `/health` to this path for granular telemetry. |
| `GET /health` | Updated. Now proxies to `/health/ready` to preserve compatibility while delivering enriched telemetry. | Documented for load balancers and mobile clients. |
