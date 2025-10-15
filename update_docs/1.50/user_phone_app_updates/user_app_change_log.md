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
