# Front-end Change Log — Version 1.50 Update

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
