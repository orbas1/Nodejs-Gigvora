# Admin Dashboard Updates — Version 1.50 Update

## Domain Governance Registry (23 Apr 2024)
- **New governance card:** Added `DomainGovernanceSummaryCard` presenting each
  bounded context’s classification, steward, review status, outstanding
  remediation tasks, and next-review due date sourced from the governance
  summaries endpoint.
- **Schema-aligned badges:** Severity chips now map to the shared governance
  enums and leverage the refreshed status badge helper so approved contexts render
  success states while remediation-required contexts display escalated tones with
  accessible contrast.
- **Refresh and error affordances:** Hook integrates with the existing telemetry
  refresh controls to support manual reloads, ten-minute auto-refresh cadence,
  empty-state guidance, and retry copy aligned with operations tooling.

## Runtime Health Panel — API Perimeter (12 Apr 2024)
- **Blocked origin analytics:** New API perimeter card lists the top blocked origins, request counts, and last-attempt timing sourced from backend perimeter metrics so operations can spot abuse without leaving the dashboard.
- **Telemetry alignment:** Panel messaging now highlights the backend support contact when the platform enters maintenance, mirroring Flutter bootstrapper updates and ensuring operators have a single source of truth.

## Runtime Health Panel Enhancements (11 Apr 2024)
- **Maintenance surfacing:** Panel now renders active maintenance windows, upcoming downtime summaries, support contact
  details, and status page deep links pulled from the expanded runtime telemetry payload.
- **Security audit visibility:** Added security telemetry card highlighting the latest runtime security audits and last incident
  timestamps so operators can correlate downtime with privileged actions.
- **Alerting & localisation:** Snackbars and inline banners reuse compliance-approved copy and support localisation, ensuring
  manual refresh prompts and degraded health warnings remain accessible.

## Runtime Health Panel (07 Apr 2024)
- **New section:** Added `RuntimeTelemetryPanel` to the top of the admin dashboard, surfacing readiness status, liveness uptime, dependency badges, and rate-limit utilisation history.
- **Data integration:** Panel consumes the new `/api/admin/runtime/health` endpoint via `useRuntimeHealthSnapshot`, delivering initial load skeletons, background polling, and manual refresh with abort support.
- **Operations insights:** Includes approaching-limit callouts, top consumer table, and window history cards so security/ops teams can triage throttling before user impact. Copy mirrors compliance-approved maintenance messaging.
- **Navigation:** `MENU_SECTIONS` now exposes "Runtime health" deep link to align command modules with observability-first workflows.
