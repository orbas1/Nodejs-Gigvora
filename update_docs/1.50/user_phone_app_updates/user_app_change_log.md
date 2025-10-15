# User Phone App Change Log — Version 1.50

## 10 Apr 2024
- Replaced mock maintenance/health data source with live polling of `/api/runtime/maintenance` and `/api/runtime/health`, updating `SecurityRepository` and controller to hydrate runtime banners, downtime drawers, and offline messaging.
- Added new maintenance drawer wireframes, localisation keys, and analytics events ensuring Flutter screens announce severity, countdown timers, and CTA actions in line with backend contracts.
- Documented updated provider acknowledgement parity requirements so future provider app work can mirror downtime workflows (refer to `provider_application_logic_flow_changes.md`).
