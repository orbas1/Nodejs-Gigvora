## New Backend Files

- `src/config/runtimeConfig.js` – schema-validated runtime configuration loader with hot reload support and config change events.
- `src/middleware/metricsAuth.js` – bearer-token guard for Prometheus metrics exposure.
- `scripts/validateRuntimeConfig.js` – CI/CLI helper validating `.env` files against the runtime configuration schema.
- `src/realtime/channelRegistry.js`, `communityNamespace.js`, `voiceNamespace.js`, `eventsNamespace.js`, `moderationNamespace.js`, `connectionRegistry.js`, `presenceStore.js`, and `socketServer.js` – realtime platform modules covering channel definitions, namespace orchestration, connection governance, and socket.io lifecycle management.
- `src/services/communityChatService.js` – backend service encapsulating community thread lifecycle, message persistence, acknowledgements, and moderation workflows consumed by the realtime layer.
- `tests/realtime/channelRegistry.test.js` and `tests/realtime/connectionRegistry.test.js` – unit coverage for channel access controls and connection limit enforcement powering the realtime rollout.
- `src/services/chatwootService.js`, `src/controllers/chatwootController.js`, and `src/routes/supportRoutes.js` – Chatwoot integration surface that provisions widget sessions, verifies signed webhooks, and synchronises conversations with inbox support cases.
- `src/services/communityModerationService.js`, `src/controllers/adminModerationController.js`, `src/routes/adminModerationRoutes.js`, `src/events/moderationEvents.js`, `src/validation/schemas/adminModerationSchemas.js`, and `src/models/moderationModels.js` – community moderation stack providing heuristics, persistence, realtime broadcasting, schema validation, and admin APIs.
- `tests/services/communityModerationService.test.js` – focused unit coverage validating the moderation heuristics pipeline and event logging behaviour.
- `src/services/liveServiceTelemetryService.js`, `src/controllers/liveServiceTelemetryController.js`, and `tests/services/liveServiceTelemetryService.test.js` – live service telemetry aggregation pipeline with API surface and load-focused Jest coverage powering the admin observability refresh.
- `src/models/liveServiceTelemetryModels.js` – targeted Sequelize model bootstrap for telemetry dependencies (timeline posts, analytics events, user events, support playbooks) used by the aggregation service and lightweight Jest harness.
- `babel.config.cjs` – project-level Babel preset enabling Jest to transpile ESM modules to CommonJS for the telemetry suites while respecting the Node runtime target.
