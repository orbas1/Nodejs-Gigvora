# Widget Updates — User App

## 24 Apr 2024
- **Governance Card Widget Tests:** Authored widget coverage for loading, error,
  and remediation-heavy states using Riverpod overrides and fixture summaries so
  the governance card renders consistent copy, chip ordering, and metadata on
  mobile. Tests validate severity ordering, steward copy, and snapshot labelling
  ahead of enabling CI.
- **Design Token Overrides:** Added dedicated test tokens mirroring production
  spacing, radius, and colour palettes to keep widget assertions stable without
  loading bundled assets during unit tests.
- **Provider Overrides:** Reused the shared `TestApiClient` stub to satisfy
  repository dependencies without booting the ServiceLocator, keeping widget
  tests deterministic and network-free while exercising the generated models.

## 23 Apr 2024
- **Domain Governance Card:** Introduced governance summary card for the admin
  home surface showing remediation-required contexts, steward avatars, scorecard
  percentages, and CTA buttons to open detail drawers. Supports shimmer skeletons
  during fetch and accessible status chips aligned with shared tokens.
- **Detail Bottom Sheet:** Added drill-down bottom sheet presenting audit notes,
  remediation checklist, next review due date, and quick actions to escalate or
  mark resolved (stubbed until workflow lands). Includes analytics instrumentation
  and state restoration after device rotation.
- **Empty/Healthy States:** Documented visual treatment when all contexts are
  approved (celebratory illustration) and when no reviews exist yet (setup prompt)
  so QA validates copy, icons, and focus behaviour.

## 19 Apr 2024
- **Exporter Snackbar Widget:** Added Prometheus exporter snackbar variant with warning/error palettes, runbook CTA, and analytics hooks; integrates with runtime health repository exporter snapshot.
- **Telemetry Drawer Module:** Introduced expandable drawer showing exporter uptime gauge, scrape history sparkline, and failure streak list; supports manual refresh action and runbook link.
- **Success Toast:** After recovery the snackbar transitions to success toast variant with confetti micro-interaction and auto-dismiss timer to confirm metrics restored.

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
# Widget & Screen Updates — User Phone App

## 10 Apr 2024
- **Runtime Maintenance Drawer:** New widget presenting severity badge, countdown timer, impacted services, and CTA stack. Supports dismissible states, offline fallback, and analytics hooks (`maintenance_drawer_impression`, `maintenance_drawer_cta`).
- **Home Banner:** Replaced static status chip with dynamic banner fed by maintenance API. Includes pill indicator for upcoming maintenance, taps open drawer, and automatically collapses post-resolution.
- **Security Dashboard Card:** Expanded to show runtime health summary, last maintenance timestamp, and quick link to admin support article.
- **Notifications:** Added push template for maintenance events with action buttons ("View details", "Snooze"), ensuring copy uses shared localisation tokens.
