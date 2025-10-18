# Lifecycle & Module Restructuring

## Lifecycle Orchestrator
- Create `src/lifecycle/runtimeOrchestrator.js` exposing `initialiseRuntime()` and `shutdownRuntime(reason)`.
- `initialiseRuntime()` executes an idempotent state machine:
  1. Load runtime configuration (see configuration updates).
  2. Boot database pools via `databaseLifecycleService.bootstrap()` with circuit breaker semantics.
  3. Warm dependency guard caches with retries and structured error codes (`E_DEPENDENCY_UNAVAILABLE`, `E_CONFIG_INVALID`).
  4. Start worker pools using a new `workerRegistry` that guarantees single registration per worker name.
  5. Start the HTTP server only after steps 1–4 report `status: ok`.
- Each step registers a compensating action (teardown) so partial failures unwind in reverse order.

## Lifecycle Event Bus
- Introduce `src/lifecycle/eventBus.js` built on `node:events`. Exposes `emitLifecycleEvent({ name, payload })` and
  `subscribeLifecycleEvent(name, handler)`.
- Components such as `workerManager`, `metricsRegistry`, and `platformSettingsService` will subscribe to events including
  `config:reloaded`, `worker:started`, `worker:failed`, `runtime:degraded`, and `runtime:recovered`.

## ServiceUnavailableError
- Add `src/errors/ServiceUnavailableError.js` deriving from `ExtendableError` with properties `code`, `details`, and
  `recommendedActions`. Health endpoints and controllers will throw this error when dependencies fail so that clients receive
  structured outage codes.

## Shutdown Coordination
- Replace direct calls to `stopBackgroundWorkers` inside `httpShutdown.js` with a `shutdownRegistry`. Each long-running module
  (workers, schedulers, SSE broadcasters) registers an async teardown callback identified by key. During shutdown, callbacks run
  in parallel batches with timeout enforcement and error aggregation.

## Dependency Guard Refactor
- Split `runtimeDependencyGuard.js` into `runtimeDependencyGuard/index.js` with discrete files for cache, policy evaluation,
  and reporting. The guard now exposes `evaluateDependencySet({ requestId })` returning deterministic snapshots consumed by
  health endpoints and worker warmers.

## Testing
- Provide `tests/lifecycle/runtimeOrchestrator.test.js` covering double-start prevention, error unwinding, and event emission.
- Mock adapters for database and worker modules live under `tests/__mocks__/lifecycle` to decouple from real infrastructure.
