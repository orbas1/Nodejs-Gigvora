# Events & Webhooks Changes

- Added `triggeredBy` metadata to freelancer lifecycle webhooks (created, updated, completed) so downstream processors know whether an action originated from mobile or web.
- Notification events now include device hints, enabling push services to prioritise native vs. email fallbacks.
- Calendar event stream emits `completionToggled` events when users mark meetings done from the mobile app, supporting analytics dashboards.
- Updated retry policy for outbound webhooks to align with mobile retry cadence (exponential backoff up to 5 attempts).
