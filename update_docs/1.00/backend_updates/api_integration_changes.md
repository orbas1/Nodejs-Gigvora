# API Integration Notes — Health & Operations

- Published versioned readiness endpoint at `GET /v1/ops/health/ready` returning structured outage codes and dependency data.
  Clients must include `X-Ops-Token` issued via `POST /v1/ops/tokens` with MFA-backed credentials.
- Added SSE stream at `GET /v1/ops/runtime/events` delivering lifecycle messages. Consumers must support automatic reconnection
  and deduplicate events using `event.id`.
- Deprecated legacy `/health` consumer endpoints. API clients have been updated to reference the versioned path and include
  `Gigvora-Environment` headers for auditing.
- Shared contracts updated to include `ServiceUnavailableErrorPayload` type with fields `code`, `message`, `recommendedActions`,
  `correlationId`.
