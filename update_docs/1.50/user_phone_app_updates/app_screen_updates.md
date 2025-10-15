# Screen Updates — User App (11 Apr 2024)

## Session Bootstrap Flow
- Replaced the placeholder splash copy with a maintenance-aware bootstrap overlay that displays backend readiness, the last
  known maintenance message, and retry guidance when `/health/ready` returns degraded states.
- Added optimistic progress indicators during refresh attempts so users understand the app is restoring their secure session
  before dropping them into dashboards.

## Login Screen
- Introduced secure session expiry messaging that matches the backend audit copy. When refresh fails, the login screen explains
  why re-authentication is required and highlights maintenance banner links exported by the runtime health repository.
- Persisted the new copy variants in `Screen_text.md` and wired localisation identifiers for English, French, and Spanish.
