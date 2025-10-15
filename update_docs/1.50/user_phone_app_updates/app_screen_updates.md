# Screen Updates — User App

## Session Bootstrap Flow (12 Apr 2024)
- Maintenance overlays now include the backend-provided support contact so users see the escalation path during outages without digging into settings.
- Snackbar copy references the contact information when degraded health persists, harmonising the mobile experience with admin dashboards.

## Session Bootstrap Flow (11 Apr 2024)
- Replaced the placeholder splash copy with a maintenance-aware bootstrap overlay that displays backend readiness, the last
  known maintenance message, and retry guidance when `/health/ready` returns degraded states.
- Added optimistic progress indicators during refresh attempts so users understand the app is restoring their secure session
  before dropping them into dashboards.

## Login Screen (11 Apr 2024)
- Introduced secure session expiry messaging that matches the backend audit copy. When refresh fails, the login screen explains
  why re-authentication is required and highlights maintenance banner links exported by the runtime health repository.
- Persisted the new copy variants in `Screen_text.md` and wired localisation identifiers for English, French, and Spanish.
