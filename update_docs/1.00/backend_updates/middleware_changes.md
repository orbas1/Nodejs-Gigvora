## Middleware Changes

- Hardened the correlation ID middleware to ignore spoofed inbound identifiers unless explicitly permitted by configuration, capturing parent IDs separately when accepted.
- Added `metricsAuth` middleware enforcing bearer-token authentication (with configurable disable state) for `/health/metrics`.
- Sanitised the global error handler so sensitive `err.details` are only emitted when an error opts-in via `err.expose` (used by the new readiness failures).
- Exported the shared authentication helpers (`resolveAuthenticatedUser`, `extractRoleSet`) so websocket namespaces reuse the same RBAC guarantees as REST endpoints without duplicating token logic.
- Extended the JSON body parser to capture raw payloads for `/support/chatwoot/webhook`, enabling HMAC verification without disabling the global parser chain.
