# Policies Changes

## Access Policies
- Created granular policies for agency engagement lifecycle: `agency:bookings:view`, `agency:bookings:write`, and `agency:bookings:approve`.
- Updated admin superuser policy to require explicit opt-in via `ADMIN_TRUSTED_IDS` before granting wildcard permissions.
- Introduced `privacy:data-export` capability, required for accessing personal data export endpoints.

## Enforcement
- Policy engine now reads definitions from `config/policies.json` signed with HMAC to detect tampering.
- Added periodic reconciliation job comparing policy definitions against database assignments; discrepancies trigger PagerDuty.

## Auditing
- Exposed `/v1/audit/policies` endpoint for compliance teams to retrieve a signed snapshot of active policies.
- Captured policy change events in `system_audit_logs` table with before/after diffs for traceability.

## Testing
- Executed `npm run test:policies` suite, adding 54 assertions covering denial edge cases.
- Completed quarterly RBAC tabletop exercise with security and customer success teams; no gaps identified.
