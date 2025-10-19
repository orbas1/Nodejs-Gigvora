## API Changes

- Versioned health surface informally by redefining `/health/ready` responses to include pagination metadata (`page`, `perPage`, `total`, `counts`) and worker telemetry, enabling monitoring automation to parse queue depth.
- Deprecated `/health` JSON readiness clone in favour of `/health/live`; existing clients receive a deprecation notice while retaining status and uptime fields.
- Enforced bearer token authentication on `/health/metrics` with explicit 401/403/404 responses to prevent unauthorised Prometheus scrapes.
