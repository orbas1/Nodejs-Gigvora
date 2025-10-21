# Routes Updates

## New Endpoints
| Method | Path | Description | Auth & RBAC |
| ------ | ---- | ----------- | ----------- |
| POST | `/v1/agency/engagements` | Create agency-client engagement with automated matching suggestions | Requires `agency:bookings:write` + idempotency key |
| PATCH | `/v1/agency/engagements/:id/confirm` | Confirm engagement and trigger onboarding workflows | Requires `agency:bookings:approve` |
| GET | `/v1/audit/policies` | Download signed policy snapshot for compliance | Requires `compliance:read` |
| POST | `/v1/payments/disputes/:id/resolve` | Submit resolution evidence to payment processor | Requires `finance:disputes:write` |

## Updated Endpoints
- `/v1/auth/login` now accepts device fingerprint header `x-device-hash` and returns `mfa_required` flag when applicable.
- `/v1/users/:id` enforces field-level permissions; sensitive attributes only visible with `user:profiles:write` capability.
- `/v1/files/upload` restricts MIME types server-side and enforces signed upload URLs with 5-minute validity.

## Deprecations
- Deprecated `/v1/agency/requests` (legacy endpoint) with sunset scheduled for 2024-12-31; responses now include `Sunset` header.

## CORS & Security
- Updated route registry to register per-route CORS policies, enabling read-only GET endpoints for marketing microsites while keeping POST operations restricted to trusted origins.
- Added schema validation for all new routes using `celebrate` to prevent malformed payloads.

## Testing
- Added Postman regression collection `collections/routes-release-q4.json` executed in CI via `newman`.
- Contract tests updated in `shared-contracts/tests/routes.contract.spec.ts`.
