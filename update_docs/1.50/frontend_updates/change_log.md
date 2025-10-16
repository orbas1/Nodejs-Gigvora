# Front-end Change Log — Version 1.50 Update

## 30 Apr 2024
- Added shared date formatting utilities (`src/utils/formatDate.js`,
  `src/utils/formatDateTime.js`) used by the admin RBAC and consent governance
  panels to render publish timestamps and review cadences consistently across
  environments. Utilities normalise invalid inputs, respect locale overrides,
  and unblock the Vitest harness from resolving imports introduced with the
  RBAC governance telemetry work.

## 29 Apr 2024
- Added `RbacMatrixPanel` to the admin dashboard with guardrail/persona/resource
  summaries, refresh controls, review cadence chips, and guardrail/resource grids
  aligned with `Admin_panel_drawings.md`. Panel consumes the new RBAC service
  client and surfaces publish dates plus next review timestamps.
- Wired RBAC telemetry service (`services/rbac.js`) to normalise matrix/audit
  payloads and created Vitest coverage (`RbacMatrixPanel.test.jsx`) validating
  happy path rendering, refresh behaviour, and error/empty states so the console
  remains regression safe.
- Configured Vitest + Testing Library in the React app, enabling jsdom testing
  with shared setup and coverage reporting for subsequent dashboard work.

## 27 Apr 2024
- Launched the admin `ConsentGovernancePanel` with paginated policy tables,
  breach indicators, and policy drill-down drawer aligned with
  `ui-ux_updates/web_app_wireframe_changes.md`. The panel consumes the new
  `/api/admin/governance/consents` API via a dedicated service, surfaces version
  activation health, and queues notifications when policies require migration.
- Refreshed Settings privacy console to expose granular consent toggles, audit
  badges, SAR request entry point, and policy history timeline. UI ties into
  consent schemas and reuses copy documented in
  `Application_Design_Update_Plan/Settings Dashboard.md` while persisting changes
  with optimistic updates and rollback on server rejection.
- Added a shared consent service module with error mapping, toast messaging, and
  React Query integration so admin dashboards and settings share caching and
  retry logic without duplicating request plumbing.

## 23 Apr 2024
- Added a data governance registry card to the admin dashboard surfacing bounded
  context classification, steward contacts, PII coverage, review status, and
  remediation countdowns sourced from the new `/api/domains/governance` endpoint.
- Introduced `useDomainGovernanceSummaries` hook and `domainGovernance` service to
  consume the generated TypeScript clients, handle abortable fetches, and expose
  auto-refresh plus manual refresh support for operations teams.
- Wired badge helpers and theming tokens so governance severity levels render with
  accessible colour ramps across neutral and emo themes, and documented loading,
  error, and empty-state behaviours for QA in `Dashboard Designs.md`.

## 12 Apr 2024
- Extended the admin runtime telemetry panel with an API perimeter card that surfaces blocked origins, last attempt timing, and
  aggregated counts from the new backend perimeter metrics.
- Updated telemetry copy to emphasise actionable maintenance contacts when the backend reports degraded health, aligning web
  messaging with mobile bootstrapper updates.

## 11 Apr 2024
- Enhanced the admin runtime telemetry panel with maintenance window summaries, active outage alerts, and recent security audit
  highlights to mirror the expanded `/api/admin/runtime/health` payload.
- Added iconography, localisation-ready copy, and support contact/status page links so operations teams receive actionable
  downtime messaging without leaving the dashboard.
- Polished skeleton/loading states and error banners to accommodate the richer telemetry data set and degraded health states.

## 07 Apr 2024
- Added a Runtime Health panel to the admin dashboard, consuming `/api/admin/runtime/health` with auto-refresh, manual refresh controls, and detailed dependency/rate-limit visualisations.
- Implemented `useRuntimeHealthSnapshot` hook and `runtimeTelemetry` service to provide cancellable fetches and background polling with abort handling.
- Updated admin dashboard navigation metadata to include the new runtime section and harmonise operations copy with compliance messaging.
