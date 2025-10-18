# Admin Dashboard Updates — Platform Hardening

## Runtime Operations Console
- Added a new `src/pages/admin/AdminOperationsConsole.jsx` composed of widgets sourced from `features/admin/operations`.
  - **Configuration Snapshot Card:** Calls `GET /ops/config` via `useOpsConfigQuery`. Displays validation status, config version,
    and last reload timestamp. Includes a "Request Reload" action that POSTs to `/ops/config/reload` after prompting for MFA.
  - **Health Overview Panel:** Streams `/health/ready` via SSE with ops token injection from secure storage. Visualises database
    pool usage, queue depth, and worker heartbeats using `Victory` charts with accessibility labels.
  - **Maintenance Notice Composer:** Allows ops to broadcast maintenance windows to users/mobile apps. Writes to the platform
    settings service through the backend `runtimeSettings` API.

## Navigation
- Updated `src/layouts/AdminLayout.jsx` to include a "Runtime" mega menu section with links to Operations Console, Config History,
  and Audit Trail.
- Added route guards that require the `admin.runtime.manage` permission; unauthorized users are redirected with an audit log.

## Metrics Integration
- Introduced `useOpsToken()` hook that fetches an expiring metrics token from the backend and automatically refreshes before
  expiry. The hook stores tokens in memory to avoid XSS exposure.
- Dashboard charts automatically fall back to cached data when the API is unreachable and surface actionable error states
  referencing operator runbooks.

## Accessibility & Internationalisation
- All new components include ARIA live regions announcing degraded states. Labels are internationalised via `i18n/admin.json`
  with concise translations (≤3 words) to meet UI guidelines.

## Testing
- Added Playwright scenarios verifying that degraded queue metrics render warning banners and that the reload button triggers a
  confirmation modal. Component tests assert token refresh logic and SSE reconnection handling.
