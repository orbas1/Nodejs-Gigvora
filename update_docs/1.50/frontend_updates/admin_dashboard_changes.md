# Admin Dashboard Updates — Version 1.50 Update

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
