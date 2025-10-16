# Admin Dashboard Updates — Version 1.50 Update

## RBAC Telemetry Hardening (30 Apr 2024)
- Added shared date/time formatting helpers to keep RBAC and consent governance
  panels in sync across locales and unblock the Vitest harness from resolving
  the new utilities imported by `RbacMatrixPanel`.
- Executed the RBAC Vitest suite to confirm loading/error/empty states render as
  designed; warnings logged about React act wrapping are queued for follow-up so
  automated coverage remains actionable.

## RBAC Guardrails Panel (29 Apr 2024)
- **Matrix snapshot card:** Inserted `RbacMatrixPanel` into the governance row
  featuring persona/guardrail/resource summary tiles, review cadence chips, and
  refresh controls aligned with `Admin_panel_drawings.md`. Panel now mirrors the
  backend matrix metadata (publish date, next review timestamp, guardrail
  severity pills) so operators can confirm security posture without leaving the
  dashboard.
- **Guardrail & resource grids:** Added responsive grid layouts for guardrail
  descriptions, severity badges, and coverage chips plus a governed-resource
  table referencing owner teams and surfaces. Layout matches
  `web_application_styling_changes.md` to ensure tone and spacing align with the
  runtime telemetry shell.
- **Error and empty states:** Implemented DataStatus integration with actionable
  error copy, persona-targeted empty state guidance, and manual refresh button.
  Vitest coverage asserts refresh behaviour, error messaging, and guardrail
  rendering so future data model changes remain regression-safe.

## Consent Governance Console (27 Apr 2024)
- **Policy inventory table:** Added `ConsentGovernancePanel` with pinned summary
  bar showing active/inactive counts, migration backlog, and breach alerts.
  Table supports jurisdiction, channel, and status filters plus CSV export
  triggers mirroring legal operations requirements from
  `ui-ux_updates/web_app_wireframe_changes.md`.
- **Version drill-down drawer:** Drawer surfaces locale manifests, version
  changelog, rollout readiness, and outstanding backfill counts using the shared
  consent schemas. Inline activation and retire actions respect RBAC and display
  audit context per `Screen_text.md` copy.
- **Actionable alerts:** Panel raises inline toasts/snackbars when policies lack
  translations or require forced migration, with quick links to the Settings
  privacy console. Analytics hooks log export/activation interactions for
  compliance telemetry.

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
