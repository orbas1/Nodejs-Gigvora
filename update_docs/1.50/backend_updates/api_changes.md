# API Changes — Version 1.50 Update

## Health & Telemetry Endpoints
- Added `GET /health/live` returning lightweight process and HTTP runtime status for container orchestrators.
- Added `GET /health/ready` returning dependency-aware readiness reports, including database latency metrics and worker states. Responses emit `503` when dependencies degrade.
- Maintained `GET /health` as an alias of the readiness endpoint for backwards compatibility with existing load balancer checks.
- Added `GET /api/admin/runtime/health` delivering combined readiness, liveness, dependency, environment, and rate-limit telemetry for operator tooling and the admin dashboard; powered by `runtimeObservabilityService` and the instrumented rate-limiter metrics store.

## Request Governance
- Enforced configurable JSON/urlencoded body limits via `REQUEST_BODY_LIMIT` to guard against oversized payload attacks.
- Applied rate limiting across `/api/*` routes using `RATE_LIMIT_WINDOW_MS` and `RATE_LIMIT_MAX_REQUESTS` to mitigate brute-force and scraping behaviours.
- Standardised correlation headers by echoing `X-Request-Id` on every response, enabling cross-service traceability in logs and monitoring dashboards.

## Domain Introspection API
- Added `GET /api/domains/registry` returning registered domain contexts, service bindings, and sampled model attributes for operator dashboards.
- Added `GET /api/domains/:context` exposing full context metadata, including model tables, attributes, indexes, hooks, and associations.
- Added `GET /api/domains/:context/models/:modelName` returning model-level definitions so tooling can verify schema changes before releasing dependent clients.
