## Dependency Updates

- Upgraded `express` to the latest LTS patch release to pick up security fixes for header poisoning and to support the stricter CORS middleware defaults.
- Bumped `socket.io` and `socket.io-redis` to align with the production cluster rollout, ensuring compatibility with Redis 7 stream backplanes and namespace-level rate limiting.
- Updated `sequelize` and `mysql2` to receive prepared statement hardening, decimal precision fixes, and connection pool diagnostics consumed by the new health endpoints.
- Refreshed `jest`, `supertest`, and `eslint` so the monorepo test harness benefits from modern assertion helpers, structured reporting, and enforced coding standards across backend modules.
- Added `@hapi/boom` and `zod` to standardise API error responses and runtime configuration validation, enabling consistent error contracts and safer configuration loading.
