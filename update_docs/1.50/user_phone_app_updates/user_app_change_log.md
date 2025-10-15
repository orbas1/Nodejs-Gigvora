# User Phone App Change Log — 24 Apr 2024

1. **Governance Widget Automation:** Added widget tests covering loading, error,
   and remediation-focused states for `DomainGovernanceSummaryCard`, asserting
   severity ordering, steward copy, and snapshot timestamps so the mobile
   experience remains aligned with React telemetry surfaces.
2. **Testing Infrastructure:** Introduced reusable design tokens and wired tests
   to the shared `TestApiClient` stub, preventing asset loads or network calls
   while keeping widget assertions faithful to production spacing/colour tokens.
3. **Documentation Sync:** Updated widget/test result logs to record the new
   coverage and flagged the pending CI action to install the Flutter SDK before
   the suite can be executed automatically.

# User Phone App Change Log — 23 Apr 2024

1. **Domain Governance Snapshot:** Added a governance summary card to the admin
   home experience consuming the new `/api/domains/governance` endpoint via the
   shared schema client. Displays contexts by remediation status, overdue review
   countdowns, and steward contacts with tappable escalation actions.
2. **Repository Enhancements:** Introduced governance repository/provider wiring
   to hydrate Flutter widgets with summaries/detail payloads while sharing error,
   retry, and cache policies with the runtime health layer.
3. **Design & Analytics Sync:** Updated `App_screens_drawings.md` and
   `Screens_Update_Plan.md` with governance states (loading, empty, approved,
   remediation required) and instrumented analytics events for follow-up taps.

# User Phone App Change Log — 19 Apr 2024

1. **Prometheus Exporter Alerts:** Runtime health snapshot now exposes exporter status (primed flag, last scrape timestamp, failure streak) so Flutter surfaces raise stale scrape warnings alongside maintenance copy.
2. **Runbook CTA Wiring:** Added repository hooks powering "Runbook" deep link and telemetry events; mobile operators can jump directly to the runtime incident guide when exporter failures persist.
3. **Design Artefact Sync:** Updated `App_screens_drawings.md` and `user_app_wireframe_changes.md` with exporter snackbar/drawer layouts, ensuring parity with admin telemetry specs and localisation tokens.

# User Phone App Change Log — 18 Apr 2024

1. **Auto-Block Snapshot Support:** Extended `RuntimeHealthSnapshot` and repository to parse the new `waf.autoBlock` payload (active quarantines, threshold, TTL, last escalation) so the app can raise escalated alerts when automated quarantines trigger.
2. **Snackbar Enhancements:** Documented auto-block badge treatments, escalation copy, and accessibility announcements in `App_screens_drawings.md`, ensuring Flutter surfaces highlight countdown timers and review guidance.
3. **QA Scenarios:** Added test plan notes covering zero-data, first escalation, and expired quarantine states so QA validates the new schema without requiring backend log inspection.

# User Phone App Change Log — 17 Apr 2024

1. **Dynamic WAF Snapshot:** Extended `RuntimeHealthSnapshot` to capture blocked request totals, evaluation counts, top rules, and last-block timestamp so Flutter can display accurate security context without extra API calls.
2. **Repository Wiring:** Updated `RuntimeHealthRepository` to pass the new `waf` payload through to domain models, preserving backwards compatibility for unauthenticated polling while enabling authenticated admin users to see security alerts.
3. **QA Guidance:** Documented zero-data and elevated-security snackbar copy plus localisation tokens in `App_screens_drawings.md`, ensuring QA validates alerts for both new incidents and quiet periods.

# User Phone App Change Log — 16 Apr 2024

1. **Shutdown Drain Messaging:** Updated runtime health snackbars to surface drain failure guidance and request IDs when the backend shutdown orchestrator reports a non-graceful drain, ensuring users see actionable copy during maintenance windows.
2. **Audit Telemetry Integration:** Wired the maintenance repository to the new shutdown verdict field so Flutter can differentiate between planned maintenance, graceful shutdowns, and drain errors before attempting session refresh.
3. **Test Additions:** Added repository tests covering drain verdict parsing to keep mobile telemetry aligned with the backend shutdown orchestrator payloads.

# User Phone App Change Log — 15 Apr 2024

1. **WAF Telemetry Consumption:** Extended the runtime health snapshot to parse the new `waf` payload (total blocks, top rules, last block) and surface concise security alerts when fresh incidents occur.
2. **Security Snackbars:** Introduced localisation-ready snackbars highlighting blocked attacks with escalation messaging and support contact links, matching the admin runtime design.
3. **Regression Coverage:** Added repository tests covering WAF parsing and ensured stale incidents older than 15 minutes do not trigger alerts, maintaining signal-to-noise.

# User Phone App Change Log — 12 Apr 2024

1. **Maintenance Contact Surfacing:** Updated the runtime health snapshot and bootstrapper to consume support contact details
   from `/api/admin/runtime/health`, updating snackbars/toasts so mobile users know who to reach when maintenance is active.
2. **Perimeter Metrics Awareness:** Captured the new `perimeter.totalBlocked` metric for analytics and support telemetry,
   keeping the app aware of backend abuse signals without exposing them directly to users.
3. **Extended Test Coverage:** Expanded runtime health repository tests to assert maintenance contacts and perimeter counts are
   parsed correctly when the admin endpoint responds with nested data.

## 11 Apr 2024

1. **Secure Session Bootstrap & Refresh:** Replaced the demo bootstrap with the production refresh-token handshake. The
   `session_bootstrapper` now polls `/health/ready`, attempts `/auth/refresh`, records login audits, and clears tokens when
   refresh fails so users receive actionable “secure session expired” messaging.
2. **Runtime Health Awareness:** Added a runtime health repository that calls `/api/admin/runtime/health` (with `/health/ready`
   fallback) so the mobile app mirrors the admin dashboard's maintenance state. The bootstrapper surfaces maintenance copy when
   the backend is degraded and suppresses stale data loads.
3. **Test Automation:** Introduced widget tests covering session bootstrap success/failure scenarios and repository tests
   verifying the runtime health fallback logic. These tests document the refresh workflow and ensure mobile stays in lockstep
   with backend lifecycle changes.
# User Phone App Change Log — Version 1.50

## 10 Apr 2024
- Replaced mock maintenance/health data source with live polling of `/api/runtime/maintenance` and `/api/runtime/health`, updating `SecurityRepository` and controller to hydrate runtime banners, downtime drawers, and offline messaging.
- Added new maintenance drawer wireframes, localisation keys, and analytics events ensuring Flutter screens announce severity, countdown timers, and CTA actions in line with backend contracts.
- Documented updated provider acknowledgement parity requirements so future provider app work can mirror downtime workflows (refer to `provider_application_logic_flow_changes.md`).
