# Middleware Changes — Version 1.50 Update

## `src/app.js`
- Replaced `morgan` with `pino-http` configured for correlation-aware structured logging and severity-based log levels.
- Added correlation ID middleware to enforce `X-Request-Id` propagation across all requests and responses.
- Enforced Helmet, CORS, JSON, and urlencoded middleware with configurable body-size limits via `REQUEST_BODY_LIMIT`.
- Applied Express Rate Limit across `/api/*` routes while exempting `/health` endpoints to preserve probe responsiveness.
- Disabled `x-powered-by` header to reduce framework fingerprinting.

## `src/middleware/errorHandler.js`
- Upgraded signature to the four-argument Express contract and integrated structured logging that includes method, path, status, and correlation ID metadata.
- Ensures responses include the originating `requestId` for traceability while respecting headers-sent guardrails.

## `src/middleware/correlationId.js`
- New middleware generating UUID-backed correlation IDs when clients omit `X-Request-Id`, echoing the identifier back to consumers and downstream logs.
