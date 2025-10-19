## Routes Updates

- Rebuilt `/health/ready` to accept pagination (`page`, `perPage`), dependency filters, and optional refresh flags while returning detailed dependency/worker telemetry.
- Deprecated `/health` in favour of `/health/live`, returning a compatibility payload with deprecation notice.
- Locked `/health/metrics` behind the new bearer-token middleware and ensured unauthorised callers receive 401/403 responses instead of raw Prometheus output.
