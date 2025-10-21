# Backend Changes Supporting v2024.09.0

## API Surface
- **Launchpad API v2** (`GET /mobile/v2/launchpad`)
  - Returns RBAC-scoped cards; role matrix enforced via `X-Gigvora-Roles` header validated in API gateway.
  - Response cached 30 seconds per workspace to balance freshness and load.
- **Mentor Scheduling API** (`POST /mobile/v2/mentors/{id}/sessions`)
  - Enforces cancellation window (≥ 6h) server-side with descriptive error codes.
  - Integrates with Calendar microservice via async events (`mentor.session.requested`).
- **Wallet Analytics API** (`GET /mobile/v2/wallet/insights`)
  - Requires `finance:view` scope; denies access to users lacking finance privileges.
  - Supports query params `period`, `granularity`, `currency` with validation and defaults.

## Authentication & RBAC
- JWT audience split per platform: `gigvora-mobile-android`, `gigvora-mobile-ios`.
- New `mobile:mentor.manage` scope assigned only to approved mentors and support leads.
- Gateway rejects mismatched device fingerprint hash to reduce token replay risk.
- Service mesh policies updated to block lateral access between mobile and admin microservices.

## Security & Compliance
- **CORS policy tightened**:
  - Allowed origins: `https://app.gigvora.com`, `https://beta.gigvora.com`, `capacitor://localhost` (for mobile webviews).
  - Preflight responses cacheable for 600 seconds with `Vary: Origin` header enforced.
  - Credentialed requests allowed only for wallet endpoints; others use token-auth headers.
- Rate limits: 120 requests/min per user for Launchpad, 30/min for mentor scheduling to prevent abuse.
- Audit logging extended to include RBAC decision trace IDs for troubleshooting.

## Data & Storage
- New Postgres partial index on `sessions (mentor_id, start_time)` to speed up conflict detection.
- Redis TTL adjustments: Launchpad card cache 45s, mentor availability 5m.
- S3 bucket `gigvora-mobile-uploads` now encrypts with KMS CMK `alias/gigvora-mobile`.

## Observability
- Datadog dashboard `GV-MOBILE-LAUNCHPAD` monitors latency, cache hit ratio, and RBAC denials.
- Structured logs adopt ECS 1.12 fields to align with central logging pipeline.
- Synthetic monitors configured for `/mobile/v2/launchpad` and `/mobile/v2/wallet/insights` from US/EU regions.

## Migration & Rollout
- Backward compatible with v2024.08.x clients; fallback responses omit new cards when scopes missing.
- Feature flags (`mobile_launchpad_v2`, `mobile_wallet_insights_v2`) controllable via LaunchDarkly.
- Database migrations deployed during low traffic window with zero-downtime strategy.
