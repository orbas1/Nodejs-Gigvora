# Routes Updates — Version 1.50 Update

| Route | Change | Notes |
|-------|--------|-------|
| `GET /health/live` | **New.** Returns liveness payload for container orchestrators; excludes heavy dependency checks so it can be polled at high frequency. | Backed by `services/healthService.getLivenessReport()` and the runtime health tracker. |
| `GET /health/ready` | **New.** Surfaces dependency-aware readiness, including Sequelize connectivity and worker states. Emits `503` when degraded or during shutdown. | Consumers should migrate from legacy `/health` to this path for granular telemetry. |
| `GET /health` | Updated. Now proxies to `/health/ready` to preserve compatibility while delivering enriched telemetry. | Documented for load balancers and mobile clients. |
| `GET /api/domains/registry` | **New.** Provides a registry snapshot of bounded contexts, associated services, and sampled model attributes. | Designed for admin dashboards and tooling to verify coverage before migrations. |
| `GET /api/domains/:context` | **New.** Returns context metadata plus serialised model definitions (attributes, indexes, hooks, associations). | Supports engineering review of schema churn and contract drift. |
| `GET /api/domains/:context/models/:modelName` | **New.** Serves a specific model definition pulled from the bounded context. | Enables targeted schema validation in CI and documentation pipelines. |
