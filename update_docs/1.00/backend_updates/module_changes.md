## Module Changes

- Consolidated `src/server.js` bootstrap into a single guarded lifecycle: waits for configuration hydration, starts workers once, and unwinds workers/database connections on failure.
- Reworked `lifecycle/workerManager` to respect configuration flags, fail fast on worker startup errors, and expose telemetry samplers consumed by the readiness API.
- Wired the HTTP server to provision and drain the socket.io cluster, ensuring realtime namespaces start with the API and close gracefully during orchestrated shutdowns.
- Reworked `tests/setupTestEnv.js` so realtime-focused suites can opt into a lightweight bootstrap path that skips the monolithic model index yet hydrates messaging/moderation models, refreshes the sqlite schema, logs fallback mode, and now auto-loads the telemetry-specific models when bypassing the legacy index.
- Normalised `messagingModels.js` associations to remove duplicate definitions (e.g., `MessageThreadLabel`) and centralise relationship wiring, eliminating redeclaration errors during module loading.
