# Webhooks Changes

## New Webhooks
- `engagements.created`: dispatched when an agency confirms an engagement; payload includes sanitized client summary and timeline metadata.
- `payments.dispute.updated`: emitted when dispute state changes, ensuring finance dashboards and partner systems stay in sync.

## Security
- All outbound webhooks now sign payloads with SHA-256 HMAC using per-subscriber secrets rotated quarterly.
- Added retry policy with exponential backoff and dead-letter queue for endpoints returning 4xx/5xx.

## Management
- Introduced `/v1/webhooks/subscriptions` endpoints allowing admins to register, pause, and test webhook endpoints securely.
- Added webhook delivery analytics stored in `webhook_delivery_logs`, accessible via admin dashboards.

## Testing
- Built Postman webhook monitor verifying handshake and signature correctness for top subscribers.
- Added integration tests simulating webhook retries and signature validation failures.
