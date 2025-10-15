# Admin Dashboard Updates — Version 1.50 Update

## Runtime Health Panel (07 Apr 2024)
- **New section:** Added `RuntimeTelemetryPanel` to the top of the admin dashboard, surfacing readiness status, liveness uptime, dependency badges, and rate-limit utilisation history.
- **Data integration:** Panel consumes the new `/api/admin/runtime/health` endpoint via `useRuntimeHealthSnapshot`, delivering initial load skeletons, background polling, and manual refresh with abort support.
- **Operations insights:** Includes approaching-limit callouts, top consumer table, and window history cards so security/ops teams can triage throttling before user impact. Copy mirrors compliance-approved maintenance messaging.
- **Navigation:** `MENU_SECTIONS` now exposes "Runtime health" deep link to align command modules with observability-first workflows.
