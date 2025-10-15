# Version 1.50 Update Change Log

## 12 Apr 2024
- Hardened the HTTP perimeter with a dedicated security configuration that enforces trust-proxy settings, helmet policies, and
  a CORS guard that blocks untrusted origins, records audit events, and compresses responses without impacting health probes or
  worker bootstraps.
- Captured perimeter metrics for admin operators by aggregating blocked origins and exposing them through
  `/api/admin/runtime/health`, enabling the runtime telemetry panel to surface real-time abuse activity alongside dependency
  and maintenance data.
- Updated the admin runtime telemetry UI to display API perimeter activity, including top blocked origins and incident timing,
  so operations teams can triage origin abuse without leaving the dashboard.
- Propagated maintenance support contact details and perimeter signals to the Flutter bootstrapper and runtime health listener,
  ensuring mobile experiences surface actionable maintenance messaging when the platform is in a degraded state.
- Added Jest coverage for the HTTP security middleware and refreshed Flutter runtime health tests to lock in the new perimeter
  metrics, maintenance contact handling, and fallback behaviour for unauthorised admin health polling.

## 11 Apr 2024
- Implemented audited database lifecycle orchestration that authenticates pools on startup, updates readiness caches, drains
  connections on shutdown, and records security events for `/health/ready` and admin observability surfaces.
- Persisted runtime security audit events and surfaced them, alongside scheduled maintenance windows, through
  `/api/admin/runtime/health` so operators, admin dashboards, and mobile bootstrap logic share a unified downtime view.
- Shipped `/auth/refresh` plus mobile/web session bootstrap flows leveraging refresh tokens, enabling Flutter and React clients
  to restore authenticated sessions securely while respecting login audit trails.
- Upgraded the Flutter app with authenticated health polling, secure token storage, and maintenance-aware messaging to replace
  demo connectivity checks and align with production resilience requirements.
- Added backend Jest coverage for `/api/auth/refresh` alongside lifecycle shutdown auditing plus Flutter widget/unit tests for
  the session bootstrapper and runtime health repository, locking in the refresh workflow across platforms.
- Recorded cross-surface maintenance messaging, refresh copy, and telemetry design updates in the Version 1.50 design trackers
  and user phone app documentation so engineering hand-offs stay aligned with the implemented behaviour.

## 13 Apr 2024
- Implemented a dedicated database lifecycle service that warms Sequelize pools before startup, drains connections during shutdown, and records auditable `database_audit_events` so operations teams can validate graceful maintenance windows.
- Added database pool telemetry to readiness and runtime observability responses, exposing max/borrowed/available counts for admin dashboards and health probes.
- Introduced Jest coverage verifying startup/shutdown auditing and pool snapshot exports, ensuring lifecycle orchestration remains regression-safe.

## 12 Apr 2024
- Added end-to-end supertest coverage for payments and compliance dependency guards so `/api/users/:id` and `/api/compliance/documents` reliably emit `503` with dependency metadata whenever downstream providers degrade.
- Backfilled the authorization middleware with a production-ready `normaliseMemberships` helper, preventing undefined function errors and keeping membership deduplication consistent across Express routes.
- Extended Jest configuration with a `zod` stub to unblock schema-heavy route tests in environments that omit the optional dependency, keeping guard regression suites runnable in CI.

## 11 Apr 2024
- Implemented dependency guards for payments and compliance services so wallet creation, ledger mutations, and compliance locker
  writes automatically return `503` responses when provider credentials are missing or maintenance incidents are active.
- Added runtime dependency warm-up during server boot and exposed guard state to health telemetry, keeping admin dashboards and
  `/health/ready` responses in sync with payments/compliance readiness.
- Authored Jest coverage validating guard behaviour across missing credentials, healthy configurations, and maintenance blocks
  to prevent regression in future releases.

## 10 Apr 2024
- Delivered runtime maintenance registry across Node API and Flutter clients, introducing CRUD-capable admin endpoints, public
  maintenance announcements, and observability exports that surface downtime windows alongside existing health telemetry.
- Added Sequelize `RuntimeAnnouncement` model, migration, validation schemas, service layer, and controllers powering
  `/api/runtime/maintenance` plus authenticated `/api/admin/runtime/maintenance` management routes with production-ready
  sanitisation, scheduling enforcement, and metadata support.
- Implemented Jest coverage for runtime maintenance services and routes with dependency stubs so announcement lifecycle edge
  cases (chronology, dismissal, filtering) remain locked and regressions surface through CI; documented partial test blockers
  caused by optional dependencies.
- Updated Flutter security repository to replace mock maintenance responses with authenticated polling of the runtime health and
  maintenance APIs, ensuring mobile clients receive real announcements, upcoming maintenance windows, and secure session gating.
- Extended documentation, design trackers, and progress metrics to reflect the new maintenance UX, admin workflows, and mobile
  parity guarantees for downtime messaging.
## 10 Apr 2024
- Introduced runtime dependency gating for finance and compliance services so payout, wallet, and verification workflows halt
  with clear 503 messaging when Stripe/Escrow configurations or maintenance flags render custodial providers unsafe.
- Bootstrapped critical dependency health from platform settings at API startup and after administrative updates, ensuring
  `/health/ready` and admin telemetry expose payment/compliance readiness immediately after configuration changes.
- Added regression coverage around the wallet ledger writer to verify dependency outages short-circuit safely and to lock in the
  closed-loop compliance metadata applied to credit entries.

## 09 Apr 2024
- Extended schema-backed validation across search, project, and finance APIs so high-volume discovery, execution, and revenue
  endpoints reject unsafe payloads and coerce filters, pagination, and configuration objects before hitting services.
- Added dedicated Jest route coverage for search, project management, and finance controllers to confirm sanitised payloads
  reach the mocked services and invalid requests fail with structured `422` responses.
- Published validation schemas for marketplace projects, saved search subscriptions, and finance overview parameters, ensuring
  canonical category aliases, numeric coercion, and viewport parsing are enforced consistently across the platform.

## 08 Apr 2024
- Added schema-backed request validation across authentication and admin APIs, introducing a reusable middleware that trims and
  coerces inputs, rejects malformed payloads with structured issue metadata, and protects nested configuration objects from
  prototype pollution.
- Hardened `/api/auth/*` flows by enforcing email casing, password length, boolean coercion, and optional geo-location
  sanitisation before domain services execute registration or login logic.
- Guarded admin dashboard and settings endpoints with deep validation that normalises lookback filters, commission rates,
  payment provider credentials, and affiliate tier configurations, preventing invalid operator input from persisting to platform
  settings.

## 07 Apr 2024
- Shipped an instrumented rate-limiter stack (`src/middleware/rateLimiter.js`, `src/observability/rateLimitMetrics.js`) that records per-window utilisation, top consumers, and abuse signals while feeding Redis-free in-memory analytics to operators.
- Exposed `GET /api/admin/runtime/health` which aggregates readiness/liveness data, dependency telemetry, and rate-limit metrics via the new `runtimeObservabilityService`, enabling admin dashboards and tooling to respond to degradation in real time.
- Updated the admin web dashboard with a production-ready Runtime Health panel wired to live telemetry, including auto-refresh, dependency status chips, rate-limit utilisation, and history views aligned with compliance copy and localisation guidance.

## 06 Apr 2024
- Released `/api/domains/registry` and context/model drill-down endpoints that expose bounded-context metadata, index coverage, and service bindings for operators and tooling clients.
- Generated TypeScript client definitions in `shared-contracts/clients/typescript` via `npm run schemas:clients`, ensuring Node/React consumers ingest the same contracts as JSON schema clients.
- Added domain capability descriptors to auth, marketplace, and platform services so downstream diagnostics and documentation stay in sync with bounded contexts.

## 05 Apr 2024
- Partitioned `src/models/index.js` into logged domain contexts via a new registry, introducing auth/marketplace/platform domain services plus login audit models and feature-flag governance.
- Added JSON schema generation (`npm run schemas:sync`) that exports canonical auth, marketplace, and platform contracts to `shared-contracts/domain` for React and Flutter clients.
- Updated project workspace orchestration to consume the marketplace domain service, ensuring workspace status synchronises automatically with project state changes.

## 04 Apr 2024
- Decoupled the Node.js API server lifecycle from background workers, added graceful shutdown hooks, and published `/health/live` plus `/health/ready` endpoints with structured telemetry for operators and mobile clients.
- Hardened inbound request handling via correlation-aware logging, configurable payload limits, and environment-tuned rate limiting to align with security remediation goals.
- Delivered design specifications for maintenance-mode messaging, health telemetry widgets, and rate-limit disclosures across web and mobile experiences, updating associated design trackers and task plans.

---

# Historical Note — Version 1.10
- Removed all provider phone app artifacts (documentation, evaluations, tests, and UI assets) from the update package to reflect the retirement of the provider mobile experience.
