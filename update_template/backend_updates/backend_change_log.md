# Backend Change Log – Release 1.50

## Enhancements
- Added mobile surface metadata across calendar, explorer, finance, and auth responses.
- Updated RBAC policy definitions to include mobile personas and tightened admin-only scopes.
- Extended metrics registry labelling to differentiate traffic by surface (`web`, `mobile`, `admin`).
- Hardened refresh token rotation logic with device-specific identifiers and shorter inactivity windows for mobile clients.
- Refreshed webhook payloads to include triggering surface for audit and notification workflows.

## Fixes
- Normalised ledger payloads to always emit currency and period fields, resolving occasional undefined errors in finance clients.
- Addressed calendar completion toggles failing under high latency by sanitising `completedAt` handling in services.
- Eliminated redundant cache invalidations when explorer results are filtered by persona.

## Maintenance
- Regenerated API documentation with updated RBAC annotations and parameter hints.
- Rotated service secrets in staging and production to align with mobile launch policy.
- Reviewed and updated incident runbooks covering mobile traffic anomalies and escalations.
