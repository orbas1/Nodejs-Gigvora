# Handler Changes — Version 1.50 Update

- `src/server.js` now exports `start` and `stop` functions, builds the HTTP server manually, and registers graceful shutdown handlers instead of using `app.listen` directly.
- Process signal handlers (`SIGTERM`, `SIGINT`) call the shared lifecycle supervisor to drain workers before closing sockets.
