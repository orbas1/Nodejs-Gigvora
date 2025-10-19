## Module Changes

- Consolidated `src/server.js` bootstrap into a single guarded lifecycle: waits for configuration hydration, starts workers once, and unwinds workers/database connections on failure.
- Reworked `lifecycle/workerManager` to respect configuration flags, fail fast on worker startup errors, and expose telemetry samplers consumed by the readiness API.
