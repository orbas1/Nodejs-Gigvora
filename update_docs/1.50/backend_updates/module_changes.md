# Module Changes — Version 1.50 Update

- Created a new `lifecycle/` module that centralises runtime health tracking (`runtimeHealth.js`) and worker supervision (`workerManager.js`). This module exposes start/stop primitives for the HTTP server to call during boot/shutdown.
- Updated `src/server.js` to consume the lifecycle module, export `start`/`stop` helpers for testing, and register signal handlers for graceful termination.
- Refactored background workers (profile engagement, news aggregation, search bootstrap) to register with the lifecycle supervisor and report health status.
