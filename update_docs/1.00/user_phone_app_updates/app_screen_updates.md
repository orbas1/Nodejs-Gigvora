# User App Screen Updates — Diagnostics

- Added `DiagnosticsCenterScreen` under `lib/features/diagnostics/view`. The screen shows:
  - Environment badge (staging/production) with last validation timestamp.
  - Queue health table with color-coded badges and pagination matching backend responses.
  - Maintenance notice timeline with CTA to acknowledge downtime.
- Integrated the diagnostics screen into the profile/settings tab for users with `canViewDiagnostics` permission.
- Added offline fallback: if health endpoints fail, the screen displays cached data with a "Last synced" timestamp and
  instructions pulled from operator runbooks.
