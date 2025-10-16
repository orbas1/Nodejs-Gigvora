# API Changes — Version 1.50 Update

## Health & Telemetry Endpoints
- Added `GET /health/live` returning lightweight process and HTTP runtime status for container orchestrators.
- Added `GET /health/ready` returning dependency-aware readiness reports, including database latency metrics and worker states. Responses emit `503` when dependencies degrade.
- Maintained `GET /health` as an alias of the readiness endpoint for backwards compatibility with existing load balancer checks.
- Added `GET /health/metrics` streaming Prometheus gauges and counters (exporter heartbeat, scrape totals, rate-limit/WAF stats, database pool utilisation) with cache disabled so SRE tooling can scrape without intermediary proxies.
- Added `GET /api/admin/runtime/health` delivering combined readiness, liveness, dependency, environment, and rate-limit telemetry for operator tooling and the admin dashboard; powered by `runtimeObservabilityService` and the instrumented rate-limiter metrics store.
- Extended `GET /api/admin/runtime/health` with `maintenance`, `security`, and `perimeter` sections so dashboards and mobile clients can surface scheduled downtime, recent audit events, and blocked origin telemetry alongside dependency posture.
- Runtime observability payloads now expose a `waf` object (blocked totals, top rules, flagged IPs, recent events) so operators, admin dashboards, and mobile clients can investigate abuse without querying logs.
- Runtime observability payloads now include a `metricsExporter` object (primed flag, last successful scrape timestamp, failure streak) so operators can detect stale Prometheus scrapes from the admin dashboard and mobile telemetry surfaces.
- The `waf.autoBlock` payload now reports active quarantines, thresholds, TTLs, and last escalation metadata so admin tooling, mobile clients, and partner integrations can react to automated perimeter blocks programmatically.
- `GET /health/ready` now returns database pool snapshots (max/available/borrowed counts) and vendor metadata sourced from `databaseLifecycleService` so readiness telemetry matches the admin runtime panel.

## Authentication Lifecycle
- Added `POST /auth/refresh` accepting a refresh token and returning a refreshed `session` payload (access and refresh tokens plus sanitised user details) to support secure mobile/web session bootstrap without a full login flow.
- Added `GET /api/admin/runtime/health` delivering combined readiness, liveness, dependency, environment, rate-limit telemetry, and now database pool utilisation (max/available/borrowed counts plus last pool event) for operator tooling and the admin dashboard; powered by `runtimeObservabilityService` and the instrumented rate-limiter metrics store.
- Runtime observability snapshots now embed the highest priority maintenance announcement (active or scheduled) so operators can view downtime context without calling a second endpoint.

## API Documentation
- Added `GET /api/docs/runtime-security` serving the OpenAPI 3.0 document covering health and authentication flows with five-minute cache headers and hashed ETags for contract validation.
- Documented the spec under `docs/openapi/runtime-security.json` so partner tooling and SDK generators can ingest an audited schema without traversing controller code.

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
- Hardened CORS enforcement by rejecting disallowed origins with `403` responses while recording perimeter audits, keeping maintenance probes and authenticated clients unaffected.
- Added an inline web application firewall that evaluates SQLi/XSS/command injection patterns before controllers run, returning `403` with reference IDs and recording structured security audits for investigations.
- Expanded schema-backed validation to search, project management, and finance endpoints so discovery filters, auto-assign
  updates, and control-tower reports consume canonicalised payloads with enforced numeric/date bounds.
- Expanded schema-backed validation to search, project management, finance, and runtime maintenance endpoints so discovery filters, auto-assign updates, control-tower reports, and downtime messaging consume canonicalised payloads with enforced numeric/date bounds.

## Payments & Compliance Workflows
- Wallet provisioning (`ensureProfileWallets`, `ensureWalletAccount`) now responds with `503 Service Unavailable` when the configured payments provider credentials are missing or a maintenance window blocks write operations.
- Compliance locker endpoints (`POST /api/compliance/documents`, `POST /api/compliance/documents/:documentId/versions`, `PATCH /api/compliance/reminders/:reminderId`) emit dependency-aware `503` responses carrying `requestId` metadata when secure storage is degraded, protecting document integrity during outages.
- Added end-to-end guard coverage confirming `/api/compliance/documents` returns `503` with dependency metadata whenever the compliance vault is offline, ensuring the behaviour stays locked for future releases.
- Compliance locker endpoints (`POST /api/compliance/documents`, versioning, reminders) now apply schema validation that returns `422 Unprocessable Entity` with actionable issue lists when payloads are malformed, preventing unsanitised documents from reaching the service layer.
- User profile reads (`GET /api/users/:id`) now propagate payments guard failures so wallet provisioning pauses surface as `503` responses alongside correlation IDs, guarding dashboards against stale balance snapshots.

## Domain Introspection API
- Added `GET /api/domains/registry` returning registered domain contexts, service bindings, and sampled model attributes for operator dashboards.
- Added `GET /api/domains/:context` exposing full context metadata, including model tables, attributes, indexes, hooks, and associations.
- Added `GET /api/domains/:context/models/:modelName` returning model-level definitions so tooling can verify schema changes before releasing dependent clients.

## Domain Governance API
- Added `GET /api/domains/governance` exposing aggregated governance summaries
  (contexts by review status, remediation backlog, next review due dates) merged
  from domain metadata and persisted governance review records. Responses include
  totals, remediation counts, and audit backlog arrays so admin tooling can
  prioritise follow-up work.
- Added `GET /api/domains/:context/governance` delivering detailed payloads per
  context, including steward contacts, classification, retention targets, PII
  coverage, last review notes, remediation checklists, and next-review cadence.
  Contracts are versioned under `shared-contracts/domain/governance` and consumed
  by generated TypeScript clients plus the Flutter governance repository.

## Consent & Privacy Governance API
- Added `GET /api/admin/governance/consents` returning paginated consent policy
  catalogs with filters for jurisdiction, delivery channel, status, legal basis,
  and upcoming activation windows. Responses hydrate active version metadata,
  outstanding migration counts, and export URLs for legal fulfilment.
- Added `POST /api/admin/governance/consents` to create consent policies with
  initial draft versions, enforcing unique slugs, GDPR legal basis validation,
  jurisdiction scoping, and preview copy for localisation teams.
- Added `POST /api/admin/governance/consents/:policyId/versions` to publish new
  policy versions including locale manifests, channel targeting, attachment
  references, and effective dates. Activation requires an explicit `POST
  /:policyId/activate` call to prevent accidental rollouts.
- Added `PATCH /api/admin/governance/consents/:policyId` for metadata updates
  (title, summary, defaults) while policies remain in draft; the endpoint blocks
  edits once a policy has active versions to preserve audit history.
- Added `POST /api/admin/governance/consents/:policyId/activate` that activates
  a specific version globally or for targeted jurisdictions, kicking off
  transactional user backfills and producing audit events for compliance.
- Added `GET /api/users/:userId/consents` exposing a user’s consent ledger,
  outstanding required policies, and audit timeline with pagination and SAR
  export toggles. Supports impersonation guard rails plus locale hints for web
  and mobile clients.
- Added `POST /api/users/:userId/consents/:policyId/accept` to record acceptance
  with locale, channel, and actor metadata while validating policy availability
  and revocability requirements.
- Added `POST /api/users/:userId/consents/:policyId/withdraw` to process
  revocable policy withdrawals, capturing reason codes, supporting documents, and
  disabling dependent experiences while rejecting non-revocable requests with
  `409 Conflict` responses.

## RBAC Governance API
- Added `GET /api/admin/governance/rbac/matrix` serving versioned persona, guardrail, and
  resource catalogues sourced from `rbacPolicyService`. Responses power the admin dashboard,
  Flutter card, and CLI tooling with review cadence, escalation targets, and constraint notes while
  emitting audit events for every retrieval.
- Added `GET /api/admin/governance/rbac/audit-events` that paginates RBAC audit trails with filters
  for persona, policy key, resource, decision, free-text search, and ISO date windows. The endpoint
  sanitises metadata before returning results so compliance teams can export evidence without
  leaking sensitive headers.
- Added `POST /api/admin/governance/rbac/simulate` allowing operators to test persona/resource/action
  combinations against the live policy matrix. Responses include allow/deny verdicts, constraints, and
  audit retention windows while denying non-granted actions with HTTP `403`.
- Supertest coverage (`tests/routes/adminRbacRoutes.test.js`) now verifies persona filtering, deny
  simulations, and audit recording to prevent regressions in the new governance endpoints.
