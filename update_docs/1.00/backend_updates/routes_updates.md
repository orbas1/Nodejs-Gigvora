# Routes & Health Endpoint Changes

## Health Endpoint Redesign
- `/health/live` remains a fast liveness probe returning `{ status: 'ok', version, uptimeSeconds }` with a 200 or 503 status.
- `/health/ready` now enforces token-based auth via `x-ops-token`. The controller reads queue depth, dependency guard status,
  and database pool metrics through `healthService`. Responses follow:
  ```json
  {
    "status": "degraded",
    "httpStatus": 503,
    "timestamp": "2024-08-12T07:20:45.124Z",
    "dependencies": {
      "database": { "status": "ok", "connections": { "used": 8, "available": 24 } },
      "queues": [
        { "name": "timeline-publisher", "depth": 0, "lagMs": 0 },
        { "name": "matching-scoring", "depth": 125, "lagMs": 4200 }
      ]
    },
    "workers": {
      "matching-engine": { "status": "unhealthy", "lastHeartbeat": "2024-08-12T07:18:13.004Z" }
    },
    "dependencyGuard": {
      "bypass": false,
      "failingChecks": ["chatwoot"]
    }
  }
  ```
- `/health` becomes a backwards-compatible alias for `/health/live` and returns a deprecation header `Deprecation: true`.
- `/health/metrics` requires an HMAC-based bearer token. Responses disable caching via `Cache-Control: no-store` and omit any
  labels containing personally identifiable information.

## Pagination & Filtering
- Readiness reports accept `?page=2&pageSize=25` to paginate dependency lists. `healthService` slices results deterministically
  to ensure stable ordering for monitors.
- `?filter=queues` returns only queue metrics, allowing Grafana dashboards to limit payload size.

## Error Handling
- The health router catches `ServiceUnavailableError` and serialises it into `{ code, message, recommendedActions }` while
  logging the correlation ID and failing dependency names.
- Other unexpected errors bubble to the global error handler, which now redacts stack traces and records a structured security
  event via `recordRuntimeSecurityEvent`.

## Additional Routes
- `/ops/runtime/events` (GET, SSE) streams lifecycle events (start, stop, degraded, recovered) for operators.
- `/ops/runtime/shutdown` (POST) triggers a graceful shutdown guarded by RBAC and CSRF tokens. It returns the correlation ID
  used for auditing.
