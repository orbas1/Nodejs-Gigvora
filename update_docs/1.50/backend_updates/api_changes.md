# API Changes — Version 1.50 Update

## Health & Telemetry Endpoints
- Added `GET /health/live` returning lightweight process and HTTP runtime status for container orchestrators.
- Added `GET /health/ready` returning dependency-aware readiness reports, including database latency metrics and worker states. Responses emit `503` when dependencies degrade.
- Maintained `GET /health` as an alias of the readiness endpoint for backwards compatibility with existing load balancer checks.
- Added `GET /api/admin/runtime/health` delivering combined readiness, liveness, dependency, environment, rate-limit telemetry, and now database pool utilisation (max/available/borrowed counts plus last pool event) for operator tooling and the admin dashboard; powered by `runtimeObservabilityService` and the instrumented rate-limiter metrics store.
- Runtime observability snapshots now embed the highest priority maintenance announcement (active or scheduled) so operators can view downtime context without calling a second endpoint.

## Runtime Maintenance Announcements
- Added `GET /api/runtime/maintenance` exposing public maintenance announcements filtered by `audience`, `channel`, `windowMinutes`, `includeResolved`, and `limit` query params. Returns active and upcoming windows with ISO timestamps, severity, metadata, and cache hints for clients.
- Added `GET /api/admin/runtime/maintenance` delivering paginated maintenance registry data (`limit`, `offset`) with optional filters for `status[]`, `audience`, `channel`, and `includeResolved`; responses include actor metadata, schedule windows, and lifecycle timestamps.
- Added `POST /api/admin/runtime/maintenance` to create announcements. Requires `title`, `message`, optional `slug`, `severity`, `status`, `audiences[]`, `channels[]`, `dismissible`, and schedule metadata. Server enforces slug uniqueness, chronology, and metadata object shape.
- Added `PUT /api/admin/runtime/maintenance/:announcementId` for full replacements with the same validation guarantees; rejects attempts to retroactively schedule windows in the past or downgrade severity outside the allowed set.
- Added `PATCH /api/admin/runtime/maintenance/:announcementId` for partial updates (copy tweaks, audience/channel changes, metadata adjustments) while preserving unspecified fields and validating chronology.
- Added `PATCH /api/admin/runtime/maintenance/:announcementId/status` dedicated to lifecycle transitions. Accepts `status` body field (`draft`, `scheduled`, `active`, `resolved`) and auto-adjusts timestamps (start/end) to match the new state while blocking invalid sequences.

## Request Governance
- Enforced configurable JSON/urlencoded body limits via `REQUEST_BODY_LIMIT` to guard against oversized payload attacks.
- Applied rate limiting across `/api/*` routes using `RATE_LIMIT_WINDOW_MS` and `RATE_LIMIT_MAX_REQUESTS` to mitigate brute-force and scraping behaviours.
- Standardised correlation headers by echoing `X-Request-Id` on every response, enabling cross-service traceability in logs and monitoring dashboards.
- Introduced schema-backed request validation for authentication and admin APIs, returning `422` with structured issue metadata when payloads fail to meet contract requirements.
- Expanded schema-backed validation to search, project management, finance, and runtime maintenance endpoints so discovery filters, auto-assign updates, control-tower reports, and downtime messaging consume canonicalised payloads with enforced numeric/date bounds.

## Payments & Compliance Workflows
- Wallet provisioning (`ensureProfileWallets`, `ensureWalletAccount`) now responds with `503 Service Unavailable` when the configured payments provider credentials are missing or a maintenance window blocks write operations.
- Compliance locker endpoints (`POST /api/compliance/documents`, `POST /api/compliance/documents/:documentId/versions`, `PATCH /api/compliance/reminders/:reminderId`) emit dependency-aware `503` responses carrying `requestId` metadata when secure storage is degraded, protecting document integrity during outages.
- Added end-to-end guard coverage confirming `/api/compliance/documents` returns `503` with dependency metadata whenever the compliance vault is offline, ensuring the behaviour stays locked for future releases.
- User profile reads (`GET /api/users/:id`) now propagate payments guard failures so wallet provisioning pauses surface as `503` responses alongside correlation IDs, guarding dashboards against stale balance snapshots.

## Domain Introspection API
- Added `GET /api/domains/registry` returning registered domain contexts, service bindings, and sampled model attributes for operator dashboards.
- Added `GET /api/domains/:context` exposing full context metadata, including model tables, attributes, indexes, hooks, and associations.
- Added `GET /api/domains/:context/models/:modelName` returning model-level definitions so tooling can verify schema changes before releasing dependent clients.
