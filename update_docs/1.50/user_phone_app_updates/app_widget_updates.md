# Widget Updates — User App

## 12 Apr 2024
- **Maintenance Contact Chip:** Runtime health banner now appends the backend support contact as a tappable chip so operators
  have immediate escalation details when maintenance is active.
- **Perimeter Telemetry Hooks:** Session restore indicator logs perimeter-block totals to analytics when degraded health aligns
  with elevated perimeter activity.

## 11 Apr 2024
- **Runtime Health Banner:** Added a lightweight banner widget used on the splash/login flow that surfaces maintenance
  messaging and links to the status page returned by the backend telemetry. The banner respects theme tokens and accessibility
  contrast guidance captured in `Design_Plan.md`.
- **Session Restore Indicator:** Implemented a determinate progress bar and status label that reflects the refresh-token call
  state (polling, refreshing, retrying). The widget emits analytics breadcrumbs so ops can trace where refresh attempts fail.
- **Error Toast Harmonisation:** Updated toast variants to reuse the `SecureSessionExpired` copy block and error severity so
  mobile, web, and admin surfaces communicate outages consistently.
