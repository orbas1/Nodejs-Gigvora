# Middleware Changes – Communication & Engagement Suite

## `src/middleware/authenticate.js`
- Introduced helper `extractBearerToken` and `resolveUserFromRequest` to consistently parse Bearer tokens and fallback `x-actor-id` headers.
- Added granular error messaging differentiating between expired and invalid tokens, enabling clients to prompt refresh flows accurately.
- Provided two exported middlewares:
  - `authenticateOptional` – hydrates `req.user` when credentials are present without blocking public routes.
  - `requireAuth` – composes optional auth and enforces presence of `req.user`, returning `AuthorizationError` when missing.
- Middleware now fetches user records via Sequelize, returning minimal identity payload (id, userType, email) consumed by controllers and services.
