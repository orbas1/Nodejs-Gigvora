# Calendar Stub

The calendar stub mirrors the production calendar surface so local and QA environments can exercise
workspace-aware scheduling flows without touching real accounts. It now exposes the full CRUD
contract, deterministic fixtures, latency simulation hooks, and explicit error scenarios to help teams
harden UI and service integrations.

## Getting Started

```bash
# start the stub on the default port (4010)
node calendar_stub/server.mjs
```

The server honours the following environment variables:

| Variable | Description | Default |
| --- | --- | --- |
| `CALENDAR_STUB_HOST` | Bind address for the HTTP server. | `0.0.0.0` |
| `CALENDAR_STUB_PORT` | Listening port. | `4010` |
| `CALENDAR_STUB_ALLOWED_ORIGINS` | Comma-separated list of permitted origins. | `*` |
| `CALENDAR_STUB_FALLBACK_ORIGIN` | Origin echoed when requests omit `Origin`. | `http://localhost:4173` |
| `CALENDAR_STUB_VIEW_ROLES` | Roles allowed to view events. | `calendar:view,calendar:manage,platform:admin` |
| `CALENDAR_STUB_MANAGE_ROLES` | Roles allowed to mutate events. | `calendar:manage,platform:admin` |
| `CALENDAR_STUB_API_KEY` | Optional API key enforced against `x-api-key` or Bearer tokens. | _unset_ |
| `CALENDAR_STUB_EVENTS_FILE` | Path to a JSON file containing seeded events. | _unset_ |
| `CALENDAR_STUB_WORKSPACES_FILE` | Path to a JSON file containing workspace fixtures. | _unset_ |
| `CALENDAR_STUB_MIN_LATENCY_MS` | Minimum latency (ms) injected for calendar API requests. | `0` |
| `CALENDAR_STUB_MAX_LATENCY_MS` | Maximum latency (ms). | `0` |

When no fixtures are supplied, the stub loads deterministic default events covering projects,
interviews, gigs, mentorship, and volunteering across two sample workspaces.

## Request Requirements

All API calls must include:

- `Origin` header matching an allowed origin (or rely on the fallback origin).
- `x-roles` header containing at least one of the configured roles.
- `x-user-id` header for mutation requests (POST, PATCH, DELETE).
- Optional `x-api-key` header or Bearer token when `CALENDAR_STUB_API_KEY` is set.

### Supported Endpoints

- `GET /api/company/calendar/events?workspaceId=<id>` – list events with optional filters `from`,
  `to`, `types`, `search`, `limit`.
- `GET /api/company/calendar/events/:id` – fetch a single event.
- `POST /api/company/calendar/events` – create an event. Requires `workspaceId`, `title`, `startsAt`.
- `PATCH /api/company/calendar/events/:id` – update an event.
- `DELETE /api/company/calendar/events/:id` – delete an event.

## Scenario Toggles & Latency Simulation

Developers can exercise failure modes without modifying code:

- Append `?scenario=rate-limit` or send `x-calendar-scenario: rate-limit` to receive a `429` response.
- Use `scenario=forbidden` for a `403` and `scenario=server-error` for a `500` error payload.
- Override per-request latency via `latencyMs` query parameter or `x-calendar-latency-ms` header.
  When unset, the stub picks a random delay between `CALENDAR_STUB_MIN_LATENCY_MS` and
  `CALENDAR_STUB_MAX_LATENCY_MS`.

## Dynamic Fixtures

- Supply `seedEvents` when constructing the server (useful for tests) or point
  `CALENDAR_STUB_EVENTS_FILE` at a JSON array. Fixture entries can include either absolute `startsAt`
  timestamps or relative offsets (`startOffsetHours`, `endOffsetHours`).
- Use `CALENDAR_STUB_WORKSPACES_FILE` or the `workspaces` option to override the available
  workspaces. `resetWorkspaces()` can refresh the in-memory catalogue at runtime.
- Call `resetEvents(null)` to reload the baseline fixtures, or `resetEvents([...])` to inject custom
  events during tests.

### Unsupported Behaviours

The stub does **not** support recurring events, attendee invitation workflows, ICS exports, or
third-party synchronisation. Consumers should guard those paths behind feature flags when running
against the stub. All payloads are stored in-memory and are reset when the process restarts.

## Response Shape

Event listing responses include:

- `workspace` details (id, name, timezone).
- `eventsByType` grouped arrays for each supported event type.
- `summary` containing totals, next event, and overdue counts.
- `meta.availableWorkspaces` exposing workspace fixtures.
- `meta.supportedEventTypes`, `meta.scenarios`, and `meta.latency` summarising stub capabilities.

Use this metadata to drive UI toggles (e.g., enabling retry flows when `rate-limit` scenarios are
available) and to keep documentation consistent with the live contract.
