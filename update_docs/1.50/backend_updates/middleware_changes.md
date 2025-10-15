# Middleware Changes — Version 1.50 Update

## `src/app.js`
- Replaced `morgan` with `pino-http` configured for correlation-aware structured logging and severity-based log levels.
- Added correlation ID middleware to enforce `X-Request-Id` propagation across all requests and responses.
- Enforced Helmet, CORS, JSON, and urlencoded middleware with configurable body-size limits via `REQUEST_BODY_LIMIT`.
- Applied an instrumented rate limiter across `/api/*` routes while exempting health and runtime telemetry endpoints to preserve probe responsiveness; exposes window metrics to the observability service.
- Disabled `x-powered-by` header to reduce framework fingerprinting.

## `src/middleware/errorHandler.js`
- Upgraded signature to the four-argument Express contract and integrated structured logging that includes method, path, status, and correlation ID metadata.
- Ensures responses include the originating `requestId` for traceability while respecting headers-sent guardrails.

## `src/middleware/correlationId.js`
- New middleware generating UUID-backed correlation IDs when clients omit `X-Request-Id`, echoing the identifier back to consumers and downstream logs.

## `src/middleware/rateLimiter.js`
- New wrapper around `express-rate-limit` that records per-request attempts, blocked responses, and route metadata into the shared metrics store.
- Provides reusable key generation (user-aware when authenticated) and ensures manual refresh endpoints remain exempt from throttling.

## `src/middleware/validateRequest.js`
- New request-validation middleware that accepts Zod schemas for body, query, params, headers, and cookies, replacing ad-hoc checks across controllers.
- Normalises input by reassigning parsed payloads back to the Express `req` object and converts Zod issues into structured `ValidationError` responses for the global error handler.
- Extended coverage to search discovery, project management, finance, and runtime maintenance endpoints to canonicalise categories, coerce pagination, sanitise auto-assign payloads, and ensure downtime messaging respects severity/status schedules.

## `src/middleware/authorization.js`
- Added a dedicated `normaliseMemberships` helper so membership and role middleware deduplicate nested arrays/objects before evaluating access rules.
- Resolves the previously undefined helper reference that could surface runtime errors when the module loaded under tests.
