# Middleware & Logging Standardisation

## Request Lifecycle
- Replace the existing correlation ID middleware with `src/middleware/requestContext.js` which always generates a UUIDv7 and
  stores it on `res.locals.context`. Incoming `x-request-id` values are accepted only when present in an allowlist configured via
  `runtimeConfig.security.requestId.trustedForwarders`.
- Attach the context to `pino-http` so every log entry includes `requestId`, `sessionId`, `userId`, and `routeId` where available.

## Structured Logging
- `utils/logger.js` now builds a base logger with redaction rules for `authorization`, `cookie`, and `x-ops-token` headers.
- Worker processes share the same logger factory via `createWorkerLogger(workerName)` to unify log formats.
- Log sampling rules defined in configuration allow verbose debug logs to be enabled per component without code changes.

## Error Handling
- `errorHandler` strips stack traces by default and surfaces a `supportCode` that maps to runbook entries.
- When a `ServiceUnavailableError` is thrown, the handler returns HTTP 503 with JSON payload `{ code, message, supportCode,
  correlationId }` and records an audit event.

## Security Headers
- CSP removes `'unsafe-inline'` for styles. Instead, we precompute nonces per response and inject them via `res.locals.cspNonce`.
- The middleware exports `applySecurityHeaders(app, { cspNonceProvider })` to keep configuration centralized.
- WAF middleware preloads the audit service to avoid dynamic imports under load and caps perimeter metric cache size to 10,000
  entries with LRU eviction.

## Rate Limiting & Body Parsing
- Rate limit middleware reads from runtime config and publishes metrics `rate_limit_block_total` and `rate_limit_current_usage`.
- Body parser limits become route-aware: file upload routes register `bodyParser.override('10mb')` while JSON APIs remain at
  `2mb`.

## Worker Telemetry
- Middleware emits `runtime:degraded` events to the lifecycle bus when latency or error rate thresholds breach configured limits.
  The event bus notifies workers to shed load or pause queues automatically.
