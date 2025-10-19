## Controller Changes

- Added `chatwootController` exposing an authenticated `/support/chatwoot/session` endpoint and signature-verified webhook handler that passes Chatwoot events into the inbox synchronisation pipeline.
- Introduced `adminModerationController` powering queue retrieval, overview metrics, and resolution endpoints for the new moderation dashboard.
- Added `liveServiceTelemetryController` to serve cached or on-demand `/admin/runtime/telemetry/live-services` snapshots that fuel the upgraded admin observability experience.
