## Routes Updates

- Rebuilt `/health/ready` to accept pagination (`page`, `perPage`), dependency filters, and optional refresh flags while returning detailed dependency/worker telemetry.
- Deprecated `/health` in favour of `/health/live`, returning a compatibility payload with deprecation notice.
- Locked `/health/metrics` behind the new bearer-token middleware and ensured unauthorised callers receive 401/403 responses instead of raw Prometheus output.
- Introduced `/support/chatwoot/session` (authenticated) and `/support/chatwoot/webhook` (signed) to provision Chatwoot widget configuration and mirror conversation events into the messaging domain.
- Added `/admin/moderation/queue`, `/admin/moderation/overview`, and `/admin/moderation/events/:id/resolve` endpoints secured by admin RBAC for driving the moderation dashboard workflows.
