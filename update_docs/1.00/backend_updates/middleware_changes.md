## Middleware Changes

- Hardened the correlation ID middleware to ignore spoofed inbound identifiers unless explicitly permitted by configuration, capturing parent IDs separately when accepted.
- Added `metricsAuth` middleware enforcing bearer-token authentication (with configurable disable state) for `/health/metrics`.
- Sanitised the global error handler so sensitive `err.details` are only emitted when an error opts-in via `err.expose` (used by the new readiness failures).
