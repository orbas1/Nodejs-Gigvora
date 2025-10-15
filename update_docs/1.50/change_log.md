# Version 1.50 Update Change Log

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
  coerces inputs, rejects malformed payloads with structured issue metadata, and protects nested configuration objects from prot
  otype pollution.
- Hardened `/api/auth/*` flows by enforcing email casing, password length, boolean coercion, and optional geo-location sanitisa
  tion before domain services execute registration or login logic.
- Guarded admin dashboard and settings endpoints with deep validation that normalises lookback filters, commission rates, paymen
  t provider credentials, and affiliate tier configurations, preventing invalid operator input from persisting to platform settin
  gs.

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
