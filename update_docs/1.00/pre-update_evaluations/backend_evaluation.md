# Backend Evaluation — Version 1.00

## Functionality
- The HTTP server bootstrap path double-starts background workers before and after database bootstrapping, which risks spawning duplicate queues and cron jobs if the first call succeeds.【F:gigvora-backend-nodejs/src/server.js†L43-L54】
- Runtime startup proceeds even when warm-up of platform settings or metrics collection fails; there is no circuit breaker to abort when critical integrations (e.g., dependency sync) reject, so the instance can advertise readiness while dependent services remain unsynchronised.【F:gigvora-backend-nodejs/src/server.js†L35-L84】
- Health routing exposes both `/health/ready` and `/health` with identical payloads but no caching or pagination of dependency status, creating redundant endpoints without differentiation for monitors and lacking support for partial dependency evaluation results.【F:gigvora-backend-nodejs/src/routes/health.js†L13-L29】
- Route composition registers the same router instances under multiple base paths (e.g., `creationStudioRoutes` and `freelancerRoutes`), multiplying maintenance surfaces and inviting subtle behaviour drift between seemingly distinct APIs.【F:gigvora-backend-nodejs/src/routes/index.js†L17-L108】
- Background worker orchestration proceeds even when previous steps fail, because the startup loop catches errors and only logs warnings before moving to the next worker, leaving the application running without critical asynchronous services.【F:gigvora-backend-nodejs/src/lifecycle/workerManager.js†L75-L89】
- `runtimeDependencyGuard` still contains a half-resolved merge where `shouldBypassDependencyGuard` and `isDependencyGuardDisabled` coexist, so the early-return branch writes cache entries that the later branch never reuses—runtime health snapshots therefore oscillate every time the flag flips and downstream callers see inconsistent dependency states.【F:gigvora-backend-nodejs/src/services/runtimeDependencyGuard.js†L160-L205】

## Usability
- Operational configuration is sourced entirely from environment variables without schema validation or defaults beyond coarse fallbacks, which makes local onboarding error-prone and hides misconfiguration until runtime.【F:gigvora-backend-nodejs/src/config/database.js†L8-L52】【F:gigvora-backend-nodejs/src/app.js†L37-L66】
- Logging relies on a single `pino-http` instance wired into Express with static severity rules, providing no request sampling or correlation with background workers, so observability during incidents will be fragmented.【F:gigvora-backend-nodejs/src/app.js†L18-L52】
- The platform settings service is consulted during startup but no administrative tooling is exposed to validate or reload these settings dynamically, leading to heavy reliance on restarts for config changes.【F:gigvora-backend-nodejs/src/server.js†L35-L84】
- Request parsing enforces a blanket 1 MB payload cap, forcing teams that need file uploads or large JSON bodies to patch environment variables manually rather than leveraging route-specific policies.【F:gigvora-backend-nodejs/src/app.js†L47-L77】
- Rate limiting is toggled only through raw environment variables with no runtime insight into effective values, so operators cannot confirm whether limits are active without log spelunking or code inspection.【F:gigvora-backend-nodejs/src/app.js†L51-L77】

## Errors
- The global error handler emits `err.details` directly to clients when provided, allowing upstream stack traces or validation payloads to leak through API responses.【F:gigvora-backend-nodejs/src/middleware/errorHandler.js†L4-L28】
- Background worker warm-up rejects bubble directly to the `start` caller without granular context, preventing automated restarts from identifying whether the failure came from queue connectivity, scheduler overlap, or dependency bootstrap.【F:gigvora-backend-nodejs/src/server.js†L35-L99】
- Startup failures trigger `shutdownDatabase` but ignore potential partial state in warmed services (e.g., runtime dependency guard), so subsystems may remain half-initialised without compensating actions.【F:gigvora-backend-nodejs/src/server.js†L35-L99】
- Worker start exceptions are swallowed inside `startBackgroundWorkers`, so diagnostics lose stack traces and the HTTP layer believes scheduling succeeded even when promises rejected earlier in the loop.【F:gigvora-backend-nodejs/src/lifecycle/workerManager.js†L75-L89】
- CORS enforcement short-circuits with a generic 403 but does not surface correlation identifiers or remediation hints, creating opaque error flows for consumers and slowing incident triage.【F:gigvora-backend-nodejs/src/config/httpSecurity.js†L172-L224】
- `routes/index.js` redeclares `creationStudioRoutes` twice, which causes a top-level `Identifier 'creationStudioRoutes' has already been declared` syntax failure and prevents the Express app from ever importing the router bundle successfully.【F:gigvora-backend-nodejs/src/routes/index.js†L17-L78】

## Integration
- The API defaults to port 5000, yet the web client targets port 4000, guaranteeing integration mismatches unless overridden in multiple environments.【F:gigvora-backend-nodejs/src/server.js†L26-L88】【F:gigvora-frontend-reactjs/src/services/apiClient.js†L1-L83】
- Health and metrics endpoints do not reflect upstream dependency saturation or job queue health, so orchestration layers cannot make informed routing decisions when background services fail.【F:gigvora-backend-nodejs/src/routes/health.js†L7-L39】
- No versioned API surface or deprecation headers are emitted from Express routes, increasing the risk of breaking downstream consumers when controller contracts evolve.【F:gigvora-backend-nodejs/src/app.js†L55-L69】
- Duplicate router mounts expose identical resources under multiple URLs, complicating link generation for the frontend and mobile clients and increasing CORS preflight chatter for each alias.【F:gigvora-backend-nodejs/src/routes/index.js†L57-L108】
- Runtime shutdown records audit events before draining database connections, so downstream analytics receive “clean shutdown” entries even if the final drain step later throws and leaves pooled connections hanging.【F:gigvora-backend-nodejs/src/lifecycle/httpShutdown.js†L25-L87】

## Security
- The `/health/metrics` endpoint streams Prometheus metrics without authentication or rate limiting exemptions, providing attackers visibility into internal counters and potential PII stored in custom labels.【F:gigvora-backend-nodejs/src/routes/health.js†L31-L39】
- Error responses include `requestId` echoes without throttling, enabling brute-force correlation of valid request identifiers for log poisoning unless combined with strict rate limits.【F:gigvora-backend-nodejs/src/middleware/errorHandler.js†L4-L28】【F:gigvora-backend-nodejs/src/app.js†L41-L66】
- Database credentials and SSL options are sourced directly from environment variables with no validation, so typos can silently fall back to insecure defaults (e.g., missing SSL enforcement).【F:gigvora-backend-nodejs/src/config/database.js†L8-L52】
- The correlation ID middleware trusts arbitrary client-provided `x-request-id` headers, allowing attackers to spoof trace identifiers and poison log streams or bypass simple allowlists.【F:gigvora-backend-nodejs/src/middleware/correlationId.js†L5-L12】
- Helmet’s CSP explicitly whitelists `'unsafe-inline'` for styles, leaving the admin surface vulnerable to CSS injection even when script blocking succeeds.【F:gigvora-backend-nodejs/src/config/httpSecurity.js†L234-L264】
- The WAF middleware dynamically imports the audit service on first block and never guards against repeated dynamic loads under load, opening the door to event-loop stalls whenever attackers trigger many cold blocks simultaneously.【F:gigvora-backend-nodejs/src/middleware/webApplicationFirewall.js†L1-L89】

## Alignment
- Core migrations still create `password` columns without hashing responsibilities, signalling a gap between security policies and actual schema design for user records.【F:gigvora-backend-nodejs/database/migrations/20240501000000-create-core-tables.cjs†L5-L83】
- There is no production profile in `sequelize.config.cjs`, conflicting with deployment goals that expect differentiated staging/production environments.【F:gigvora-backend-nodejs/sequelize.config.cjs†L5-L19】
- Runtime orchestration heavily emphasises observability hooks, yet no corresponding runbooks or automated checks exist inside the repo, suggesting misalignment between desired SRE posture and operational tooling delivered with the codebase.【F:gigvora-backend-nodejs/src/server.js†L35-L146】
- The router hierarchy attempts to cover every product pillar in one monolithic Express app, contradicting the stated ambition for modular, domain-isolated services and making future decomposition significantly harder.【F:gigvora-backend-nodejs/src/routes/index.js†L3-L110】
- Background worker tracking persists stop callbacks in an in-memory map, signalling a single-instance mental model that clashes with the roadmap’s multi-region reliability targets and will not scale to horizontally sharded workers.【F:gigvora-backend-nodejs/src/lifecycle/workerManager.js†L21-L114】

## Full Scan Notes
- Numerous backend scripts still rely on `console` fallbacks rather than structured loggers, so dependency sync helpers like `syncCriticalDependencies` will emit inconsistent telemetry compared with the rest of the runtime.【F:gigvora-backend-nodejs/src/observability/dependencyHealth.js†L86-L140】
- The perimeter metrics helper increments in-memory maps without eviction, meaning long-running nodes will accumulate unbounded state if the WAF blocks many unique origins during sustained probing campaigns.【F:gigvora-backend-nodejs/src/observability/perimeterMetrics.js†L1-L120】
