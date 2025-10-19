## API Changes

- Versioned health surface informally by redefining `/health/ready` responses to include pagination metadata (`page`, `perPage`, `total`, `counts`) and worker telemetry, enabling monitoring automation to parse queue depth.
- Deprecated `/health` JSON readiness clone in favour of `/health/live`; existing clients receive a deprecation notice while retaining status and uptime fields.
- Enforced bearer token authentication on `/health/metrics` with explicit 401/403/404 responses to prevent unauthorised Prometheus scrapes.
- Added `/support/chatwoot/session` for authenticated widget provisioning and `/support/chatwoot/webhook` for signed event intake, enabling inbox synchronisation and SLA escalation from Chatwoot conversations.
- Exposed `/admin/moderation/queue`, `/admin/moderation/overview`, and `/admin/moderation/events/:id/resolve` REST surfaces delivering moderation queues, aggregate metrics, and resolution workflows to the admin dashboard.
