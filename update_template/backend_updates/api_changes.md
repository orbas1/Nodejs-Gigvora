# Backend API Changes – Mobile Launch

| Endpoint | Change | Notes |
| --- | --- | --- |
| `GET /users/:id/calendar/events` | Added `surface` metadata (`web`, `mobile`, `admin`) to response envelope. | Enables channel-specific caching and analytics while keeping event schema intact. |
| `PUT /users/:id/calendar/events/:eventId` | Accepts `completedAt` timestamps to support mobile completion toggles. | Controller sanitises null/ISO values before persisting via `freelancerCalendarService`. |
| `GET /explorer` | Introduced optional query parameter `surface=mobile` for personalised ordering. | Falls back to default ranking if omitted, preserving backward compatibility. |
| `GET /finance/overview` | Ensured ledger arrays always include `currency` and `period` fields. | Aligns with Flutter finance charts and prevents undefined errors. |
| `POST /auth/refresh` | Attaches `deviceHint` (e.g., `mobile-ios`) to response metadata. | Derived from session bootstrap and stored for audit analytics. |

All other endpoints remain unchanged; contract tests confirm schema stability.
