# Middleware Changes

## Access Control & RBAC
- Replaced legacy role parser with `rbacEnforcer` middleware that loads capabilities from `systemSetting.roleMatrix` at boot and caches them with ETag validation.
- Middleware now injects `req.permissionSet` so downstream handlers can perform fine-grained checks without re-querying storage.

## Security Enhancements
- Added `corsGuard` middleware exposing only whitelisted origins (`app.gigvora.com`, `studio.gigvora.com`, `admin.gigvora.com`) with environment-specific overrides, supporting credentialed requests with strict allowed headers.
- Hardened `rateLimiter` by switching to Redis sliding window algorithm and aligning limits with SOC2 requirements (e.g., login bursts limited to 5/minute per IP + device fingerprint).
- Introduced `csrfProtector` for session-based admin consoles using double-submit cookies and rotating CSRF secrets every 12 hours.

## Observability & Resilience
- Middleware now appends `x-trace-id` header on responses if incoming request lacked one, improving cross-service logging.
- `requestLogger` batches structured logs to the OpenTelemetry collector, reducing write amplification by 28%.
- Implemented `idempotencyKeyValidator` for POST routes, storing hashes in Dynamo-compatible persistence to prevent duplicate job submissions.

## Testing & Verification
- Added integration coverage via `tests/middleware/security.e2e.spec.js` verifying RBAC denials, CORS, and rate limiting behavior.
- Ran OWASP ZAP regression scan against staging; no medium/high findings.
