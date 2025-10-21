# Release Change Log

## Version
- **Release Name:** Gigvora Platform Q4 Backend Update
- **Tag:** `backend-v2024.10`
- **Date:** 2024-10-15

## Highlights
- AI-assisted agency engagement lifecycle with strong RBAC and audit capabilities.
- Payment dispute automation and ledger reconciliation enhancements.
- Security hardening including CORS lockdown, CSRF protection, and policy governance.
- Observability and reliability improvements across middleware, services, and build pipelines.

## Detailed Summary
| Area | Key Changes |
| ---- | ----------- |
| Handlers | Unified auth flows, engagement lifecycle automation, dispute hardening |
| Middleware | New RBAC enforcer, strict CORS, CSRF protection, idempotency guard |
| Services | AI matching, transactional outbox, payout reconciliation |
| Storage | Optimistic locking, S3 malware scanning, Redis TLS migration |
| Policies & RBAC | New granular capabilities, audit endpoints, reconciler jobs |
| Routes | New agency engagement endpoints, policy audit endpoint, CORS per route |
| Providers | SendGrid MTLS, Twilio WhatsApp, Stripe REST onboarding |
| Build & Ops | Enhanced CI/CD gating, Node 20 LTS image, SBOM generation |

## Breaking Changes
- Removal of legacy `/v1/agency/requests` endpoint (sunsetting 2024-12-31).
- JWT scopes now strictly enforced; clients must request valid capability sets.
- Upload endpoints require signed URLs with limited lifetime.

## Migration Notes
- Clients should update SDKs to `@gigvora/api@2.5.0` for compatibility.
- Ensure integration partners register new webhook secrets before rollout.
- Run database migrations bundle `20241015-backend.sql` prior to deployment.

## Testing & Certification
- CI suite: ✅ `npm run test`, `npm run lint`, `npm run test:handlers`, `npm run test:services`.
- Load testing: 500 RPS sustained, p95 < 350ms, zero error budget burn.
- Security review: Completed SOC2 change control checklist and OWASP ZAP scan (no critical findings).
