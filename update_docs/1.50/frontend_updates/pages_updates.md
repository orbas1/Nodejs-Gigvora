# Frontend Page Updates — 23 Apr 2024

## Admin Governance Overview
- Added governance overview section to the admin dashboard hero region,
  highlighting contexts requiring remediation, overdue reviews, and steward
  ownership at-a-glance. The card consumes `useDomainGovernanceSummaries`, pulls
  schema-generated types, and shares manual refresh hooks with runtime telemetry.
- Documented loading skeletons, empty states (“No governance reviews recorded yet”)
  and remediation callouts so QA can validate accessibility, localisation, and
  analytics instrumentation for operations follow-up clicks.
- Updated `Dashboard Designs.md`, `Screens_Updates_widget_functions.md`, and
  `Screen_text.md` to align copy, iconography, and colour ramps with the shared
  governance schema definitions and enterprise compliance guidance.

# Frontend Page Updates — 11 Apr 2024

## Admin Runtime Telemetry Panel
- Wired the React admin runtime telemetry panel to the extended `/api/admin/runtime/health` payload so operations teams now see
  live dependency state (database, paymentsCore, complianceProviders) alongside the most recent runtime security audit events.
- Introduced maintenance banners that surface scheduled downtime windows and soft outages surfaced by the backend lifecycle
  hooks. The panel now renders tiered messaging (`notice`, `warn`, `error`) with localisation-ready copy blocks referenced in
  `Screen_text.md` and `text.md.md`.
- Added guard-rail messaging for refresh token expirations so admins can distinguish between session expiry and perimeter
  degradation. The copy maps to the new refresh flow used by React Query mutations and the Flutter bootstrapper.

## Session Refresh UX Harmonisation
- Updated global auth providers to consume the Zod-backed `/auth/refresh` schema, allowing the web shell to silently renew
  access tokens with explicit audit log references. Error toasts now mirror Flutter's “secure session expired” copy and route
  operators back to the login screen without leaving stale feature flag state behind.
- Extended the shared runtime telemetry hook so the navigation shell can display maintenance badges when the backend lifecycle
  supervisor marks the database as degraded or drained. This prevents operators from triggering long-running exports during
  planned shutdowns.

## Documentation & Design Alignment
- Captured the telemetry and maintenance changes in `Dashboard Designs.md`, `Screens_Updates_widget_functions.md`, and
  `component_functions.md` to keep engineering and design assets aligned with the production implementation.
- Logged localisation requirements for the new maintenance messaging in `Screen_text.md` and updated the change references in
  `Design_Change_log.md`.
